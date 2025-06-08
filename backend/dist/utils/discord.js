"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueDiscordNotification = exports.getNotificationQueueSize = void 0;
exports.sendDiscordWebhook = sendDiscordWebhook;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("./logger"); // Assuming logger is in ./logger
const scraper_1 = require("../scraper");
const scraper_2 = require("../routes/scraper");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// In-memory queue for webhook notifications
const notificationQueue = [];
let isProcessingQueue = false;
let isRateLimited = false;
let rateLimitEndTime = null;
// Function to get the current size of the notification queue
const getNotificationQueueSize = () => {
    return notificationQueue.length;
};
exports.getNotificationQueueSize = getNotificationQueueSize;
// Function to add a notification to the queue
const queueDiscordNotification = (item) => {
    notificationQueue.push(item);
    logger_1.logger.info(`Added item to notification queue. Queue size: ${notificationQueue.length}`);
    // Start processing the queue if not already running
    if (!isProcessingQueue) {
        processWebhookQueue();
    }
};
exports.queueDiscordNotification = queueDiscordNotification;
// Function to process the notification queue
const processWebhookQueue = async () => {
    isProcessingQueue = true;
    logger_1.logger.info('Starting webhook queue processing...');
    while (notificationQueue.length > 0) {
        // Check if we're currently rate limited
        if (isRateLimited && rateLimitEndTime) {
            const now = Date.now();
            if (now < rateLimitEndTime) {
                const waitTime = rateLimitEndTime - now;
                logger_1.logger.info(`Rate limited, waiting ${waitTime}ms before continuing...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
            isRateLimited = false;
            rateLimitEndTime = null;
        }
        const item = notificationQueue.shift(); // Get the next item from the queue
        if (!item)
            continue; // Should not happen if queue.length > 0, but good practice
        try {
            if (!item.webhookUrl) {
                logger_1.logger.warn(`No webhook URL provided for item '${item.title}'. Skipping notification.`);
                continue;
            }
            await sendDiscordWebhook(item.webhookUrl, item);
            logger_1.logger.info(`Successfully sent webhook from queue for item: ${item.title}`);
            // Reduced delay between successful sends
            await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        }
        catch (error) {
            logger_1.logger.error(`Failed to send webhook from queue for item: ${item.title}`, error);
            // If it was a rate limit error, sendDiscordWebhook already handled retry-after
            // If it was another error, we log it and drop the item to avoid blocking the queue
        }
    }
    isProcessingQueue = false;
    logger_1.logger.info('Finished webhook queue processing.');
};
// Original sendDiscordWebhook modified to be called by the queue processor
async function sendDiscordWebhook(webhookUrl, item) {
    const MAX_RETRIES = 1; // Only retry once within this function
    let retries = 0;
    while (retries <= MAX_RETRIES) {
        try {
            const isPriceDrop = item.notificationType === 'PRICE_DROP';
            const embed = {
                title: item.title,
                url: item.productUrl,
                color: isPriceDrop ? 0xff0000 : 0x00ff00, // Red for price drop, green for new match
                fields: [
                    {
                        name: 'Price',
                        value: isPriceDrop
                            ? `~~€${item.oldPrice?.toFixed(2)}~~ → €${item.price.toFixed(2)}`
                            : `€${item.price.toFixed(2)}`,
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
            await axios_1.default.post(webhookUrl, {
                content: isPriceDrop
                    ? '<@&1380314012121829376> Price drop detected!'
                    : '<@&1380314012121829376> New item found!',
                embeds: [embed]
            });
            // If successful, break the loop
            return;
        }
        catch (error) {
            if (error.response && error.response.status === 429) {
                retries++;
                if (retries <= MAX_RETRIES) {
                    const retryAfter = error.response.headers['retry-after'];
                    const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 10000; // Default to 10 seconds
                    logger_1.logger.warn(`Discord webhook rate limited. Retrying in ${waitTime}ms. Attempt ${retries}/${MAX_RETRIES}`);
                    // Set rate limit state
                    isRateLimited = true;
                    rateLimitEndTime = Date.now() + waitTime;
                    // Update status
                    const currentStatus = (0, scraper_1.getScraperStatus)();
                    (0, scraper_2.sendStatusUpdate)({
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
                    (0, scraper_2.sendStatusUpdate)({
                        ...currentStatus,
                        rateLimit: false,
                        rateLimitWaitTime: 0
                    });
                }
                else {
                    logger_1.logger.error(`Max retries reached for webhook. Dropping item: ${item.title}`);
                    throw error; // Throw to be caught by the queue processor
                }
            }
            else {
                // If not a rate limit error, re-throw immediately
                logger_1.logger.error('Error sending Discord webhook:', error);
                throw error;
            }
        }
    }
}
