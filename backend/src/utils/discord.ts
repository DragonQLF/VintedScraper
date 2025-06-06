import axios from 'axios';
import { logger } from './logger'; // Assuming logger is in ./logger
import { getScraperStatus } from '../scraper';
import { sendStatusUpdate } from '../routes/scraper';

interface DiscordWebhookMessage {
  title: string;
  price: number;
  imageUrl: string;
  productUrl: string;
  condition?: string;
  size?: string;
  brand?: string;
}

// In-memory queue for webhook notifications
const notificationQueue: DiscordWebhookMessage[] = [];
let isProcessingQueue = false;
let isRateLimited = false;
let rateLimitEndTime: number | null = null;

// Function to get the current size of the notification queue
export const getNotificationQueueSize = () => {
  return notificationQueue.length;
};

// Function to add a notification to the queue
export const queueDiscordNotification = (item: DiscordWebhookMessage) => {
  notificationQueue.push(item);
  logger.info(`Added item to notification queue. Queue size: ${notificationQueue.length}`);
  // Start processing the queue if not already running
  if (!isProcessingQueue) {
    processWebhookQueue();
  }
};

// Function to process the notification queue
const processWebhookQueue = async () => {
  isProcessingQueue = true;
  logger.info('Starting webhook queue processing...');

  while (notificationQueue.length > 0) {
    // Check if we're currently rate limited
    if (isRateLimited && rateLimitEndTime) {
      const now = Date.now();
      if (now < rateLimitEndTime) {
        const waitTime = rateLimitEndTime - now;
        logger.info(`Rate limited, waiting ${waitTime}ms before continuing...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      isRateLimited = false;
      rateLimitEndTime = null;
    }

    const item = notificationQueue.shift(); // Get the next item from the queue
    if (!item) continue; // Should not happen if queue.length > 0, but good practice

    try {
      await sendDiscordWebhook(process.env.DISCORD_WEBHOOK_URL as string, item);
      logger.info(`Successfully sent webhook from queue for item: ${item.title}`);
      // Reduced delay between successful sends
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay

    } catch (error: any) {
      logger.error(`Failed to send webhook from queue for item: ${item.title}`, error);
      // If it was a rate limit error, sendDiscordWebhook already handled retry-after
      // If it was another error, we log it and drop the item to avoid blocking the queue
    }
  }

  isProcessingQueue = false;
  logger.info('Finished webhook queue processing.');
};

// Original sendDiscordWebhook modified to be called by the queue processor
export async function sendDiscordWebhook(webhookUrl: string, item: DiscordWebhookMessage) {
  const MAX_RETRIES = 1; // Only retry once within this function
  let retries = 0;

  while (retries <= MAX_RETRIES) {
    try {
      const embed = {
        title: item.title,
        url: item.productUrl,
        color: 0x00ff00, // Green color
        fields: [
          {
            name: 'Price',
            value: `€${item.price.toFixed(2)}`,
            inline: true
          }
        ],
        image: {
          url: item.imageUrl
        },
        timestamp: new Date().toISOString()
      };

      // Add optional fields if they exist
      if (item.condition) {
        embed.fields.push({
          name: 'Condition',
          value: item.condition,
          inline: true
        });
      }
      if (item.size) {
        embed.fields.push({
          name: 'Size',
          value: item.size,
          inline: true
        });
      }
      if (item.brand) {
        embed.fields.push({
          name: 'Brand',
          value: item.brand,
          inline: true
        });
      }

      await axios.post(webhookUrl, {
        content: '<@&1380314012121829376> New item found!', // Using the provided role ID
        embeds: [embed]
      });

      // If successful, break the loop
      return;

    } catch (error: any) {
      if (error.response && error.response.status === 429) {
        retries++;
        if (retries <= MAX_RETRIES) {
          const retryAfter = error.response.headers['retry-after'];
          const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 10000; // Default to 10 seconds
          logger.warn(`Discord webhook rate limited. Retrying in ${waitTime}ms. Attempt ${retries}/${MAX_RETRIES}`);
          
          // Set rate limit state
          isRateLimited = true;
          rateLimitEndTime = Date.now() + waitTime;
          
          // Update status
          const currentStatus = getScraperStatus();
          sendStatusUpdate({
            ...currentStatus,
            rateLimit: true,
            rateLimitWaitTime: waitTime
          });
          
          // Wait for the rate limit period
          await new Promise(resolve => setTimeout(resolve, waitTime));
          
          // Clear rate limit state
          isRateLimited = false;
          rateLimitEndTime = null;
          
          // Update status
          sendStatusUpdate({
            ...currentStatus,
            rateLimit: false,
            rateLimitWaitTime: 0
          });
        } else {
          logger.error(`Max retries reached for webhook. Dropping item: ${item.title}`);
          throw error; // Throw to be caught by the queue processor
        }
      } else {
        // If not a rate limit error, re-throw immediately
        logger.error('Error sending Discord webhook:', error);
        throw error;
      }
    }
  }
} 