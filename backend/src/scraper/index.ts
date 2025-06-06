import puppeteer from 'puppeteer';
import cron from 'node-cron';
import { prisma } from '../index';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { RateLimiter } from 'limiter';
import fs from 'fs';
import path from 'path';
import { sendDiscordWebhook, queueDiscordNotification, getNotificationQueueSize } from '../utils/discord';
import { sendStatusUpdate } from '../routes/scraper';
import { getRandomUserAgent, randomDelay, addRandomMouseMovements } from '../utils/scraperUtils';

interface ScrapedItem {
  listingId: string;
  title: string;
  price: number;
  imageUrls: string[];
  productUrl: string;
  condition?: string;
  totalPrice?: number;
  likes: number;
  size?: string;
  brand?: string;
}

interface ScraperStatus {
  profileId: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  totalProfiles: number;
  currentProfile: string;
  lastError?: string;
  lastRun?: Date;
  currentPage: number;
  itemsProcessedOnCurrentPage: number;
  totalItemsProcessedForProfile: number;
  notificationQueueSize: number;
  rateLimit?: boolean;
  rateLimitWaitTime?: number;
}

let currentStatus: ScraperStatus = {
  profileId: '',
  status: 'idle',
  progress: 0,
  totalProfiles: 0,
  currentProfile: 'N/A',
  lastError: undefined,
  lastRun: undefined,
  currentPage: 0,
  itemsProcessedOnCurrentPage: 0,
  totalItemsProcessedForProfile: 0,
  notificationQueueSize: 0,
};

export const getScraperStatus = () => currentStatus;

// Rate limiter: 1 request per 2 seconds
const limiter = new RateLimiter({
  tokensPerInterval: 1,
  interval: 2000
});

const updateStatus = (updates: Partial<ScraperStatus>) => {
  currentStatus = { ...currentStatus, ...updates };
  logger.info('Scraper status updated:', currentStatus);
  sendStatusUpdate(currentStatus);
};

export const setupScraper = () => {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      updateStatus({ status: 'running', lastRun: new Date() });
      await scrapeActiveProfiles();
      updateStatus({ status: 'completed', progress: 100 });
    } catch (error) {
      updateStatus({ 
        status: 'error', 
        lastError: error instanceof Error ? error.message : 'Unknown error'
      });
      logger.error('Scraping job failed:', error);
    }
  });
};

export const scrapeActiveProfiles = async () => {
  logger.info('Starting active profiles scraper...');
  updateStatus({
    status: 'running',
    progress: 0,
    totalProfiles: 0,
    currentProfile: 'N/A',
    lastError: undefined,
    currentPage: 0,
    itemsProcessedOnCurrentPage: 0,
    totalItemsProcessedForProfile: 0,
    notificationQueueSize: 0,
  });

  const profiles = await prisma.searchProfile.findMany({
    where: { isActive: true },
    include: {
      autoActions: true,
      brand: true,
    }
  });

  updateStatus({
    totalProfiles: profiles.length,
    profileId: '',
    currentProfile: 'N/A',
    currentPage: 0,
    itemsProcessedOnCurrentPage: 0,
    totalItemsProcessedForProfile: 0,
    lastError: undefined,
  });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];
      logger.info(`Processing profile ${profile.id} (${profile.name || profile.keywords || 'Unnamed'}), ${i + 1}/${profiles.length}`);
      updateStatus({
        profileId: profile.id,
        currentProfile: profile.keywords || 'Unnamed profile',
        currentPage: 0,
        itemsProcessedOnCurrentPage: 0,
        totalItemsProcessedForProfile: 0,
        notificationQueueSize: 0,
      });

      await limiter.removeTokens(1); // Rate limiting
      
      const page = await browser.newPage();
      // Use rotating user agent instead of static one
      await page.setUserAgent(getRandomUserAgent());
      await page.setViewport({ width: 1920, height: 1080 });

      try {
        let currentPage = 1;
        let itemsFoundOnPage = -1;
        let totalItemsProcessedForProfile = 0;
        
        while (itemsFoundOnPage !== 0) {
          const searchUrl = buildSearchUrl(profile, currentPage);
          logger.info(`Scraping profile ${profile.id}, Page ${currentPage} with URL: ${searchUrl}`);
          
          updateStatus({
            profileId: profile.id,
            currentProfile: profile.name || profile.keywords || 'Unnamed profile',
            currentPage: currentPage,
            itemsProcessedOnCurrentPage: 0,
            totalItemsProcessedForProfile: totalItemsProcessedForProfile,
            notificationQueueSize: getNotificationQueueSize(),
          });

          // Add random delay before each page load (reduced from 2000-5000 to 1000-2000)
          await randomDelay(1000, 2000);
        
          await page.goto(searchUrl, { 
            waitUntil: 'domcontentloaded',
            timeout: 30000
          });

          // Add random mouse movements to appear more human-like
          await addRandomMouseMovements(page);

          // Check for common error pages or blocks
          const errorText = await page.evaluate(() => {
            const errorElements = document.querySelectorAll('.error-message, .blocked-message, .captcha');
            return errorElements.length > 0 ? errorElements[0].textContent : null;
          });

          if (errorText) {
            logger.error(`Page returned error for profile ${profile.id}, page ${currentPage}: ${errorText}`);
            // Add longer delay on error (reduced from 5000-10000 to 3000-5000)
            await randomDelay(3000, 5000);
            break;
          }

          // Wait for items to load
          try {
            await page.waitForSelector('a[data-testid^="product-item-id-"]', { 
              timeout: 15000,
              visible: true 
            });
          } catch (waitForSelectorError) {
            logger.warn(`Timeout waiting for items on page ${currentPage} for profile ${profile.id}. This might mean no items on this page or a page structure change.`);
            itemsFoundOnPage = 0;
            continue;
          }

          // Add random delay after items load (reduced from 1000-2000 to 500-1000)
          await randomDelay(500, 1000);

          // Get product data from current page
          const items: ScrapedItem[] = await page.evaluate(() => {
            const scrapedItems: ScrapedItem[] = [];
            const gridItems = document.querySelectorAll('.feed-grid__item');

            gridItems.forEach((gridItem: Element) => {
              const linkElement = gridItem.querySelector('a.new-item-box__overlay[data-testid^="product-item-id-"]') as HTMLAnchorElement | null;
              const imageElement = gridItem.querySelector('img.web_ui__Image__content[data-testid$="--image--img"]') as HTMLImageElement | null;
              const titleElement = gridItem.querySelector('p[data-testid$="--description-title"]');
              const conditionElement = gridItem.querySelector('p[data-testid$="--description-subtitle"]');
              const priceElement = gridItem.querySelector('p[data-testid$="--price-text"]');
              const totalPriceElement = gridItem.querySelector('[aria-label*="inclui Proteção do Comprador"]');
              const likesElement = gridItem.querySelector('button[data-testid$="--favourite"] span.web_ui__Text__caption');

              const productUrl = linkElement?.href || '';
              const listingId = linkElement?.getAttribute('data-testid')?.replace('product-item-id-', '').replace('--overlay-link', '') || '';
              const imageUrl = imageElement?.src || '';
              const title = titleElement?.textContent?.trim() || '';
              const condition = conditionElement?.textContent?.trim();
              const priceText = priceElement?.textContent?.trim();
              const price = priceText ? parseFloat(priceText.replace(/[^0-9.,]/g, '').replace(',', '.')) : 0;
              
              const totalPriceText = totalPriceElement?.getAttribute('aria-label')?.trim();
              const totalPrice = totalPriceText ? parseFloat(totalPriceText.replace(/[^0-9.,]/g, '').replace(',', '.')) : undefined;

              const likesText = likesElement?.textContent?.trim();
              const likes = likesText ? parseInt(likesText, 10) : 0;

              if (listingId && productUrl && imageUrl && title && price !== undefined) {
                scrapedItems.push({
                  listingId,
                  title,
                  price,
                  imageUrls: [imageUrl],
                  productUrl,
                  condition,
                  totalPrice,
                  likes,
                });
              }
            });

            return scrapedItems;
          });

          itemsFoundOnPage = items.length; // Update count of items found on this page
          logger.info(`Finished scraping profile ${profile.id}, Page ${currentPage}. Found ${itemsFoundOnPage} items.`);

          // Process and store matches for the current page
          logger.info(`Processing ${itemsFoundOnPage} items from page ${currentPage} for profile ${profile.id}...`);
          let processedCount = 0;
          let initialQueueSize = getNotificationQueueSize();
          let itemsAddedToQueue = 0;

          // Calculate progress based on current profile and total profiles
          const profileProgress = (i / profiles.length) * 100;
          const pageProgress = (currentPage / 20) * (100 / profiles.length); // Assuming max 20 pages per profile
          const totalProgress = Math.min(Math.round(profileProgress + pageProgress), 99); // Cap at 99% until complete

          for (const item of items) {
            await processMatch(profile, item as any);
            processedCount++;
            totalItemsProcessedForProfile++;
            
            // Update status every 10 items or at the end of the page (reduced frequency)
            if (processedCount % 10 === 0 || processedCount === itemsFoundOnPage) {
              const currentQueueSize = getNotificationQueueSize();
              const newItemsInQueue = currentQueueSize - initialQueueSize;
              
              if (newItemsInQueue > 0) {
                logger.info(`Added ${newItemsInQueue} new items to webhook queue from current batch`);
                itemsAddedToQueue += newItemsInQueue;
              }
              
              updateStatus({
                itemsProcessedOnCurrentPage: processedCount,
                totalItemsProcessedForProfile: totalItemsProcessedForProfile,
                notificationQueueSize: currentQueueSize,
                progress: totalProgress,
              });
            }
          }

          logger.info(`Finished processing page ${currentPage} for profile ${profile.id}. Added ${itemsAddedToQueue} items to webhook queue.`);

          // Add a small delay to ensure all operations on the page are settled before proceeding
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Increment page number for the next iteration
          if (itemsFoundOnPage > 0) {
            currentPage++;
            // Add a small delay between pages to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        logger.info(`Completed scraping for profile ${profile.id}. Total items found: ${totalItemsProcessedForProfile}`);
        updateStatus({
          status: 'completed', // Mark profile as completed (or just update overall progress)
          profileId: profile.id, // Keep the last profile info
          currentProfile: profile.name || profile.keywords || 'Unnamed profile',
          progress: Math.round(((i + 1) / profiles.length) * 100), // Update overall progress
          totalItemsProcessedForProfile: totalItemsProcessedForProfile, // Final total for this profile
          notificationQueueSize: getNotificationQueueSize(), // Final queue size
          lastRun: new Date(),
        });

      } finally {
        await page.close();
      }
    }
  } catch (error: any) {
    logger.error('Scraper run failed:', error);
    updateStatus({
      status: 'error',
      lastError: error.message,
      lastRun: new Date(),
      notificationQueueSize: getNotificationQueueSize(), // Include queue size on error
    });
  } finally {
    await browser.close();
    logger.info('Finished active profiles scraper.');
    // Set overall status to idle after all profiles are done or if an error occurs
     if(currentStatus.status !== 'error') {
         updateStatus({
            status: 'idle',
            lastRun: new Date(),
            notificationQueueSize: getNotificationQueueSize(), // Final queue size
         });
     }
     
     // Start a periodic queue size update after scraping is complete
     const queueUpdateInterval = setInterval(() => {
       const currentQueueSize = getNotificationQueueSize();
       if (currentQueueSize !== currentStatus.notificationQueueSize) {
         updateStatus({
           notificationQueueSize: currentQueueSize
         });
       }
     }, 1000); // Update every second
     
     // Clear the interval after 5 minutes to prevent memory leaks
     setTimeout(() => {
       clearInterval(queueUpdateInterval);
     }, 5 * 60 * 1000);
  }
};

const buildSearchUrl = (profile: any, page: number = 1): string => {
  // Always use vinted.pt domain
  const baseUrl = 'https://www.vinted.pt/catalog';
  const params = new URLSearchParams();

  // Map condition values from profile (English strings) to numeric IDs for URL
  const conditionToIdMap: { [key: string]: string } = {
    'new_with_tags': '6',
    'new_without_tags': '1',
    'very_good': '2',
    'good': '3',
    'satisfactory': '4'
  };

  if (profile.keywords) {
    params.append('search_text', profile.keywords);
  }

  if (profile.condition) {
    const statusId = conditionToIdMap[profile.condition];
    if (statusId) {
      params.append('status_ids[]', statusId);
    }
  }

  if (profile.order) {
    params.append('order', profile.order);
  } else {
    params.append('order', 'newest_first');
  }

  if (profile.minPrice) {
    params.append('price_from', profile.minPrice.toString());
  }

  if (profile.maxPrice) {
    params.append('price_to', profile.maxPrice.toString());
  }

  // Ensure brandId is properly handled
  if (profile.brandId) {
    params.append('brand_ids[]', profile.brandId.toString());
    logger.info(`Adding brand ID ${profile.brandId} to search URL`);
  }

  // Add page parameter
  params.append('page', page.toString());

  const url = `${baseUrl}?${params.toString()}`;
  logger.info(`Built search URL: ${url}`);
  return url;
};

const processMatch = async (profile: any, item: ScrapedItem) => {
  try {
    // Check if item already exists for this profile
    const existingMatch = await prisma.match.findFirst({
      where: {
        listingId: item.listingId,
        searchProfileId: profile.id
      }
    });

    if (existingMatch) {
      // Update existing match if price changed or likes changed
      if (existingMatch.price !== item.price || (existingMatch as any).likes !== item.likes || existingMatch.totalPrice !== item.totalPrice) {
        await prisma.match.update({
          where: { id: existingMatch.id },
          data: {
            price: item.price,
            totalPrice: item.totalPrice,
            likes: item.likes as any,
            notifications: {
              create: {
                type: 'PRICE_DROP',
                message: `Update for ${item.title}: Price ${existingMatch.price} -> ${item.price}, Likes ${(existingMatch as any).likes} -> ${item.likes}, TotalPrice ${existingMatch.totalPrice} -> ${item.totalPrice}`,
                userId: profile.userId
              }
            }
          }
        });

        // Send Discord notification for price change asynchronously
        if (process.env.DISCORD_WEBHOOK_URL) {
          queueDiscordNotification({
            title: item.title,
            price: item.price,
            imageUrl: item.imageUrls[0],
            productUrl: item.productUrl,
            condition: item.condition,
            size: item.size,
            brand: item.brand
          });
        }
      }
      return;
    }

    // Create new match
    const match = await prisma.match.create({
      data: {
        listingId: item.listingId,
        title: item.title,
        price: item.price,
        totalPrice: item.totalPrice,
        imageUrls: JSON.stringify(item.imageUrls),
        productUrl: item.productUrl,
        condition: item.condition,
        likes: item.likes as any,
        searchProfileId: profile.id,
        notifications: {
          create: {
            type: 'NEW_MATCH',
            message: `New match found: ${item.title}`,
            userId: profile.userId
          }
        }
      }
    });

    // Send Discord notification for new match asynchronously
    if (process.env.DISCORD_WEBHOOK_URL) {
      queueDiscordNotification({
        title: item.title,
        price: item.price,
        imageUrl: item.imageUrls[0],
        productUrl: item.productUrl,
        condition: item.condition,
        size: item.size,
        brand: item.brand
      });
    }

    // Handle auto-actions
    if (profile.autoActions) {
      const { autoFavorite, autoOffer, autoOfferPrice, autoBuy } = profile.autoActions;

      if (autoFavorite) {
        await prisma.action.create({
          data: {
            type: 'FAVORITE',
            status: 'PENDING',
            userId: profile.userId,
            matchId: match.id
          }
        });
      }

      if (autoOffer && autoOfferPrice && item.price <= autoOfferPrice) {
        await prisma.action.create({
          data: {
            type: 'OFFER',
            price: autoOfferPrice,
            status: 'PENDING',
            userId: profile.userId,
            matchId: match.id
          }
        });
      }

      if (autoBuy) {
        await prisma.action.create({
          data: {
            type: 'BUY',
            status: 'PENDING',
            userId: profile.userId,
            matchId: match.id
          }
        });
      }
    }
  } catch (error) {
    logger.error(`Error processing match for profile ${profile.id}:`, error);
  }
};

// Ensure debug directory exists
const debugDir = path.join(__dirname, 'debug');
if (!fs.existsSync(debugDir)) {
  fs.mkdirSync(debugDir);
} 