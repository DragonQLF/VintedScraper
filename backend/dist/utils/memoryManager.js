"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryManager = void 0;
const logger_1 = require("./logger");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class MemoryManager {
    constructor() {
        this.lastCleanup = Date.now();
        this.CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
    }
    static getInstance() {
        if (!MemoryManager.instance) {
            MemoryManager.instance = new MemoryManager();
        }
        return MemoryManager.instance;
    }
    monitorMemoryUsage() {
        const used = process.memoryUsage();
        logger_1.logger.info('Memory usage:', {
            heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
            external: `${Math.round(used.external / 1024 / 1024)}MB`,
            rss: `${Math.round(used.rss / 1024 / 1024)}MB`
        });
    }
    async cleanupResources() {
        const now = Date.now();
        if (now - this.lastCleanup < this.CLEANUP_INTERVAL) {
            return;
        }
        logger_1.logger.info('Starting resource cleanup...');
        // Clear temporary files
        const tempDir = path_1.default.join(__dirname, '..', 'temp');
        if (fs_1.default.existsSync(tempDir)) {
            fs_1.default.rmSync(tempDir, { recursive: true, force: true });
        }
        this.lastCleanup = now;
        logger_1.logger.info('Resource cleanup completed');
    }
    setupErrorHandling() {
        process.on('uncaughtException', async (error) => {
            if (error.message.includes('memory')) {
                logger_1.logger.error('Memory error detected, attempting recovery...');
                await this.cleanupResources();
            }
        });
    }
}
exports.MemoryManager = MemoryManager;
exports.default = MemoryManager.getInstance();
