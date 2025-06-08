import { logger } from './logger';
import fs from 'fs';
import path from 'path';

export class MemoryManager {
  private static instance: MemoryManager;
  private lastCleanup: number = Date.now();
  private readonly CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes

  private constructor() {}

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  monitorMemoryUsage(): void {
    const used = process.memoryUsage();
    logger.info('Memory usage:', {
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(used.external / 1024 / 1024)}MB`,
      rss: `${Math.round(used.rss / 1024 / 1024)}MB`
    });
  }

  async cleanupResources(): Promise<void> {
    const now = Date.now();
    if (now - this.lastCleanup < this.CLEANUP_INTERVAL) {
      return;
    }

    logger.info('Starting resource cleanup...');
    
    // Clear temporary files
    const tempDir = path.join(__dirname, '..', 'temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    this.lastCleanup = now;
    logger.info('Resource cleanup completed');
  }

  setupErrorHandling(): void {
    process.on('uncaughtException', async (error) => {
      if (error.message.includes('memory')) {
        logger.error('Memory error detected, attempting recovery...');
        await this.cleanupResources();
      }
    });
  }
}

export default MemoryManager.getInstance(); 