import { logger } from './logger';

// List of common user agents for different browsers and devices
const userAgents = [
    // Chrome on Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    
    // Firefox on Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    
    // Safari on macOS
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    
    // Edge on Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0',
    
    // Mobile devices
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.64 Mobile Safari/537.36'
];

// Keep track of last used user agent to avoid immediate repetition
let lastUsedUserAgent: string | null = null;

/**
 * Get a random user agent, ensuring it's different from the last used one
 */
export const getRandomUserAgent = (): string => {
    let availableAgents = userAgents;
    
    // If we have a last used agent, filter it out from available options
    if (lastUsedUserAgent) {
        availableAgents = userAgents.filter(agent => agent !== lastUsedUserAgent);
    }
    
    // Get random agent from available ones
    const randomAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)];
    lastUsedUserAgent = randomAgent;
    
    logger.debug(`Selected user agent: ${randomAgent}`);
    return randomAgent;
};

/**
 * Generate a random delay between min and max milliseconds
 * Reduced default delays for faster operation while maintaining randomness
 */
export const getRandomDelay = (minMs: number = 500, maxMs: number = 1500): number => {
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
};

/**
 * Wait for a random amount of time
 * Reduced default delays for faster operation
 */
export const randomDelay = async (minMs: number = 500, maxMs: number = 1500): Promise<void> => {
    const delay = getRandomDelay(minMs, maxMs);
    logger.debug(`Waiting for ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Add random mouse movements to make behavior more human-like
 * Reduced number of movements and delay between them
 */
export const addRandomMouseMovements = async (page: any): Promise<void> => {
    const viewport = await page.viewport();
    const maxX = viewport.width;
    const maxY = viewport.height;
    
    // Generate 2-3 random mouse movements (reduced from 3-5)
    const movements = Math.floor(Math.random() * 2) + 2;
    
    for (let i = 0; i < movements; i++) {
        const x = Math.floor(Math.random() * maxX);
        const y = Math.floor(Math.random() * maxY);
        await page.mouse.move(x, y);
        await randomDelay(50, 150); // Reduced delay between movements
    }
};

// Export all functions
export default {
    getRandomUserAgent,
    getRandomDelay,
    randomDelay,
    addRandomMouseMovements
}; 