import { Request, Response, Router } from 'express';
import { logger } from '../utils/logger';
import { ScraperStatus, getScraperStatus } from '../scraper';

const router = Router();

// Keep track of connected clients
let clients: Response[] = [];

// Function to send status updates to all connected clients
export const sendStatusUpdate = (status: ScraperStatus) => {
  clients.forEach(res => {
    res.write(`data: ${JSON.stringify(status)}\n\n`);
  });
};

// SSE endpoint for scraper status
router.get('/status/stream', (req: Request, res: Response) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust CORS as needed

  // Send current status immediately to the new client
  const currentStatus = getScraperStatus();
  res.write(`data: ${JSON.stringify(currentStatus)}\n\n`);

  // Add client to the list
  clients.push(res);

  logger.info('Client connected for scraper status stream.');

  // Remove client from the list on disconnect
  req.on('close', () => {
    clients = clients.filter(client => client !== res);
    logger.info('Client disconnected from scraper status stream.');
  });
});

export default router; 