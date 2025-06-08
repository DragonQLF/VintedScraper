"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeActiveProfiles = exports.setupScraper = exports.getScraperStatus = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const node_cron_1 = __importDefault(require("node-cron"));
const index_1 = require("../index");
const logger_1 = require("../utils/logger");
const limiter_1 = require("limiter");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const discord_1 = require("../utils/discord");
const scraper_1 = require("../routes/scraper");
const scraperUtils_1 = require("../utils/scraperUtils");
let currentStatus = {
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
    currentProfileIndex: 0,
    totalItemsFound: 0,
    lastUpdate: new Date(),
    stage: 'initializing',
    debugWaiting: false,
    debugWaitTime: 0
};
const getScraperStatus = () => currentStatus;
exports.getScraperStatus = getScraperStatus;
// Maximum number of parallel browser instances
// This limit helps prevent overwhelming system resources and avoid rate limiting
const MAX_PARALLEL_BROWSERS = 5;
// Rate limiter: 1 request per 2 seconds per browser instance
const createRateLimiter = () => new limiter_1.RateLimiter({
    tokensPerInterval: 1,
    interval: 2000
});
const updateStatus = (updates) => {
    currentStatus = {
        ...currentStatus,
        ...updates,
        lastUpdate: new Date()
    };
    logger_1.logger.info('Scraper status updated:', {
        ...currentStatus,
        lastUpdate: currentStatus.lastUpdate.toISOString()
    });
    (0, scraper_1.sendStatusUpdate)(currentStatus);
};
const setupScraper = () => {
    // Run every 15 minutes
    node_cron_1.default.schedule('*/15 * * * *', async () => {
        try {
            updateStatus({
                status: 'running',
                lastRun: new Date(),
                stage: 'initializing',
                progress: 0
            });
            await (0, exports.scrapeActiveProfiles)();
            // Only mark as completed if we actually finished
            if (currentStatus.status === 'running') {
                updateStatus({
                    status: 'completed',
                    progress: 100,
                    stage: 'completed',
                    lastUpdate: new Date()
                });
            }
        }
        catch (error) {
            updateStatus({
                status: 'error',
                lastError: error instanceof Error ? error.message : 'Unknown error',
                stage: 'completed'
            });
            logger_1.logger.error('Scraping job failed:', error);
        }
    });
};
exports.setupScraper = setupScraper;
const scrapeActiveProfiles = async () => {
    const startTime = new Date();
    let currentProfileIndex = 0; // Track current profile index
    logger_1.logger.info('Starting active profiles scraper...');
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
        currentProfileIndex: 0,
        totalItemsFound: 0,
        stage: 'initializing',
        lastRun: startTime
    });
    const profiles = await index_1.prisma.searchProfile.findMany({
        where: { isActive: true },
        include: {
            autoActions: true,
            brand: true,
        },
        orderBy: [
            { priority: 'desc' },
            { createdAt: 'asc' }
        ]
    });
    logger_1.logger.info(`Found ${profiles.length} active profiles to process`);
    updateStatus({
        totalProfiles: profiles.length,
        profileId: '',
        currentProfile: 'N/A',
        currentPage: 0,
        itemsProcessedOnCurrentPage: 0,
        totalItemsProcessedForProfile: 0,
        lastError: undefined,
        stage: 'processing_profiles',
        lastRun: startTime
    });
    // Group profiles by user and maintain priority order
    const profilesByUser = profiles.reduce((acc, profile) => {
        if (!acc[profile.userId]) {
            acc[profile.userId] = [];
        }
        acc[profile.userId].push(profile);
        return acc;
    }, {});
    // Define priority order mapping
    const PRIORITY_ORDER = {
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1
    };
    // Sort user groups by their highest priority profile
    const userGroups = Object.entries(profilesByUser)
        .map(([userId, userProfiles]) => ({
        userId,
        profiles: userProfiles,
        highestPriority: Math.max(...userProfiles.map(p => PRIORITY_ORDER[p.priority]))
    }))
        .sort((a, b) => b.highestPriority - a.highestPriority)
        .map(group => group.profiles);
    // Process users in parallel, but limit the number of parallel browser instances
    const processUserProfiles = async (userProfiles) => {
        const browser = await puppeteer_1.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const rateLimiter = createRateLimiter();
        try {
            // Process all profiles for this user
            for (let i = 0; i < userProfiles.length; i++) {
                const profile = userProfiles[i];
                currentProfileIndex++; // Increment the current profile index
                // Calculate progress based on total profiles
                const profileProgress = Math.round((currentProfileIndex / profiles.length) * 100);
                updateStatus({
                    currentProfileIndex: currentProfileIndex,
                    progress: profileProgress,
                    lastRun: startTime
                });
                await processProfile(browser, rateLimiter, profile);
            }
        }
        finally {
            await browser.close();
        }
    };
    // Process a single profile
    const processProfile = async (browser, rateLimiter, profile) => {
        logger_1.logger.info(`Processing profile ${profile.id} (${profile.name || profile.keywords || 'Unnamed'})`);
        updateStatus({
            profileId: profile.id,
            currentProfile: profile.keywords || 'Unnamed profile',
            currentPage: 0,
            itemsProcessedOnCurrentPage: 0,
            totalItemsProcessedForProfile: 0,
            notificationQueueSize: (0, discord_1.getNotificationQueueSize)(),
            stage: 'processing_items',
            lastRun: startTime
        });
        await rateLimiter.removeTokens(1);
        const page = await browser.newPage();
        await page.setUserAgent((0, scraperUtils_1.getRandomUserAgent)());
        await page.setViewport({ width: 1920, height: 1080 });
        try {
            let currentPage = 1;
            let itemsFoundOnPage = -1;
            let totalItemsProcessedForProfile = 0;
            while (itemsFoundOnPage !== 0) {
                const searchUrl = buildSearchUrl(profile, currentPage);
                logger_1.logger.info(`Scraping profile ${profile.id}, Page ${currentPage} with URL: ${searchUrl}`);
                updateStatus({
                    profileId: profile.id,
                    currentProfile: profile.name || profile.keywords || 'Unnamed profile',
                    currentPage: currentPage,
                    itemsProcessedOnCurrentPage: 0,
                    totalItemsProcessedForProfile: totalItemsProcessedForProfile,
                    notificationQueueSize: (0, discord_1.getNotificationQueueSize)(),
                    stage: 'processing_items',
                    lastRun: startTime
                });
                await (0, scraperUtils_1.randomDelay)(1000, 2000);
                await page.goto(searchUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: 30000
                });
                await (0, scraperUtils_1.addRandomMouseMovements)(page);
                const errorText = await page.evaluate(() => {
                    const errorElements = document.querySelectorAll('.error-message, .blocked-message, .captcha');
                    return errorElements.length > 0 ? errorElements[0].textContent : null;
                });
                if (errorText) {
                    logger_1.logger.error(`Page returned error for profile ${profile.id}, page ${currentPage}: ${errorText}`);
                    await (0, scraperUtils_1.randomDelay)(3000, 5000);
                    break;
                }
                try {
                    await page.waitForSelector('a[data-testid^="product-item-id-"]', {
                        timeout: 15000,
                        visible: true
                    });
                }
                catch (waitForSelectorError) {
                    logger_1.logger.warn(`Timeout waiting for items on page ${currentPage} for profile ${profile.id}. This might mean no items on this page or a page structure change.`);
                    itemsFoundOnPage = 0;
                    continue;
                }
                await (0, scraperUtils_1.randomDelay)(500, 1000);
                const items = await page.evaluate(() => {
                    const scrapedItems = [];
                    const gridItems = document.querySelectorAll('.feed-grid__item');
                    gridItems.forEach((gridItem) => {
                        const linkElement = gridItem.querySelector('a.new-item-box__overlay[data-testid^="product-item-id-"]');
                        const imageElement = gridItem.querySelector('img.web_ui__Image__content[data-testid$="--image--img"]');
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
                itemsFoundOnPage = items.length;
                logger_1.logger.info(`Finished scraping profile ${profile.id}, Page ${currentPage}. Found ${itemsFoundOnPage} items.`);
                let processedCount = 0;
                let initialQueueSize = (0, discord_1.getNotificationQueueSize)();
                let itemsAddedToQueue = 0;
                for (const item of items) {
                    await processMatch(profile, item);
                    processedCount++;
                    totalItemsProcessedForProfile++;
                    if (processedCount % 10 === 0 || processedCount === itemsFoundOnPage) {
                        const currentQueueSize = (0, discord_1.getNotificationQueueSize)();
                        const newItemsInQueue = currentQueueSize - initialQueueSize;
                        if (newItemsInQueue > 0) {
                            logger_1.logger.info(`Added ${newItemsInQueue} new items to webhook queue from current batch`);
                            itemsAddedToQueue += newItemsInQueue;
                        }
                        // Calculate progress within the current profile
                        const currentProfileProgress = Math.round((processedCount / itemsFoundOnPage) * 100);
                        // Calculate overall progress based on total profiles and current profile progress
                        const overallProgress = Math.round(((currentProfileIndex - 1 + currentProfileProgress / 100) / profiles.length) * 100);
                        updateStatus({
                            itemsProcessedOnCurrentPage: processedCount,
                            totalItemsProcessedForProfile: totalItemsProcessedForProfile,
                            notificationQueueSize: currentQueueSize,
                            progress: overallProgress,
                            stage: 'processing_items',
                            lastRun: startTime
                        });
                    }
                }
                if (itemsFoundOnPage > 0) {
                    currentPage++;
                    const waitTime = 2000;
                    updateStatus({
                        debugWaiting: true,
                        debugWaitTime: waitTime
                    });
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    updateStatus({
                        debugWaiting: false,
                        debugWaitTime: 0
                    });
                }
            }
            logger_1.logger.info(`Completed scraping for profile ${profile.id}. Total items found: ${totalItemsProcessedForProfile}`);
            updateStatus({
                profileId: profile.id,
                currentProfile: profile.name || profile.keywords || 'Unnamed profile',
                totalItemsProcessedForProfile: totalItemsProcessedForProfile,
                notificationQueueSize: (0, discord_1.getNotificationQueueSize)(),
                lastRun: startTime,
                stage: 'processing_items'
            });
        }
        finally {
            await page.close();
        }
    };
    try {
        // Process users in parallel, but limit the number of parallel browser instances
        for (const userProfiles of userGroups) {
            await processUserProfiles(userProfiles);
        }
        // Only mark as completed after all profiles are processed
        updateStatus({
            status: 'completed',
            lastRun: startTime,
            notificationQueueSize: (0, discord_1.getNotificationQueueSize)(),
            stage: 'completed',
            progress: 100
        });
    }
    catch (error) {
        logger_1.logger.error('Scraper run failed:', error);
        updateStatus({
            status: 'error',
            lastError: error.message,
            lastRun: startTime,
            notificationQueueSize: (0, discord_1.getNotificationQueueSize)(),
            stage: 'completed'
        });
    }
    // Start a periodic queue size update after scraping is complete
    const queueUpdateInterval = setInterval(() => {
        const currentQueueSize = (0, discord_1.getNotificationQueueSize)();
        if (currentQueueSize !== currentStatus.notificationQueueSize) {
            updateStatus({
                notificationQueueSize: currentQueueSize
            });
        }
    }, 1000);
    // Clear the interval after 5 minutes
    setTimeout(() => {
        clearInterval(queueUpdateInterval);
    }, 5 * 60 * 1000);
};
exports.scrapeActiveProfiles = scrapeActiveProfiles;
const buildSearchUrl = (profile, page = 1) => {
    // Always use vinted.pt domain
    const baseUrl = 'https://www.vinted.pt/catalog';
    const params = new URLSearchParams();
    // Map condition values from profile (English strings) to numeric IDs for URL
    const conditionToIdMap = {
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
    }
    else {
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
        logger_1.logger.info(`Adding brand ID ${profile.brandId} to search URL`);
    }
    // Add page parameter
    params.append('page', page.toString());
    const url = `${baseUrl}?${params.toString()}`;
    logger_1.logger.info(`Built search URL: ${url}`);
    return url;
};
const processMatch = async (profile, item) => {
    try {
        // Fetch the user associated with this search profile to get their webhook URL
        const user = await index_1.prisma.user.findUnique({
            where: { id: profile.userId },
            select: { discordWebhookUrl: true }
        });
        const userWebhookUrl = user?.discordWebhookUrl;
        // Check if item already exists for this profile
        const existingMatch = await index_1.prisma.match.findFirst({
            where: {
                listingId: item.listingId,
                searchProfileId: profile.id
            }
        });
        if (existingMatch) {
            // Update existing match if price changed
            if (existingMatch.price !== item.price) {
                await index_1.prisma.match.update({
                    where: { id: existingMatch.id },
                    data: {
                        price: item.price,
                        totalPrice: item.totalPrice,
                        likes: item.likes,
                        notifications: {
                            create: {
                                type: 'PRICE_DROP',
                                message: `Price changed for ${item.title}: From €${existingMatch.price.toFixed(2)} to €${item.price.toFixed(2)}`,
                                userId: profile.userId
                            }
                        }
                    }
                });
                // Send Discord notification for price change asynchronously
                if (userWebhookUrl) {
                    (0, discord_1.queueDiscordNotification)({
                        title: item.title,
                        price: item.price,
                        imageUrl: item.imageUrls[0],
                        productUrl: item.productUrl,
                        condition: item.condition,
                        size: item.size,
                        brand: item.brand,
                        webhookUrl: userWebhookUrl,
                        notificationType: 'PRICE_DROP',
                        oldPrice: existingMatch.price
                    });
                }
                return;
            }
            return;
        }
        // Create new match
        const match = await index_1.prisma.match.create({
            data: {
                listingId: item.listingId,
                title: item.title,
                price: item.price,
                totalPrice: item.totalPrice,
                imageUrls: JSON.stringify(item.imageUrls),
                productUrl: item.productUrl,
                condition: item.condition,
                likes: item.likes,
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
        if (userWebhookUrl) {
            (0, discord_1.queueDiscordNotification)({
                title: item.title,
                price: item.price,
                imageUrl: item.imageUrls[0],
                productUrl: item.productUrl,
                condition: item.condition,
                size: item.size,
                brand: item.brand,
                webhookUrl: userWebhookUrl,
                notificationType: 'NEW_MATCH'
            });
        }
        // Handle auto-actions
        if (profile.autoActions) {
            const { autoFavorite, autoOffer, autoOfferPrice, autoBuy } = profile.autoActions;
            if (autoFavorite) {
                await index_1.prisma.action.create({
                    data: {
                        type: 'FAVORITE',
                        status: 'PENDING',
                        userId: profile.userId,
                        matchId: match.id
                    }
                });
            }
            if (autoOffer && autoOfferPrice && item.price <= autoOfferPrice) {
                await index_1.prisma.action.create({
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
                await index_1.prisma.action.create({
                    data: {
                        type: 'BUY',
                        status: 'PENDING',
                        userId: profile.userId,
                        matchId: match.id
                    }
                });
            }
        }
    }
    catch (error) {
        logger_1.logger.error(`Error processing match for profile ${profile.id}:`, error);
    }
};
// Ensure debug directory exists
const debugDir = path_1.default.join(__dirname, 'debug');
if (!fs_1.default.existsSync(debugDir)) {
    fs_1.default.mkdirSync(debugDir);
}
