import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { setupRoutes } from './routes';
import { setupScraper } from './scraper';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import searchProfileRoutes from './routes/searchProfileRoutes';
import authRoutes from './routes/authRoutes';
import scraperRoutes from './routes/scraper';
import brandRoutes from './routes/brands';

// Load environment variables
dotenv.config();

// Initialize Prisma client
export const prisma = new PrismaClient();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Add scraper routes before authentication middleware
app.use('/api/scraper', scraperRoutes);

// Setup routes (authentication middleware is likely applied here)
setupRoutes(app);

// Additional routes (these might also be under authentication depending on setupRoutes)
app.use('/api/auth', authRoutes);
app.use('/api/search-profiles', searchProfileRoutes);
app.use('/api/brands', brandRoutes);

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  
  // Initialize scraper
  setupScraper();
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Closing HTTP server and Prisma client...');
  await prisma.$disconnect();
  process.exit(0);
}); 