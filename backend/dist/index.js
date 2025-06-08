"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const routes_1 = require("./routes");
const scraper_1 = require("./scraper");
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./utils/logger");
const searchProfileRoutes_1 = __importDefault(require("./routes/searchProfileRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const scraper_2 = __importDefault(require("./routes/scraper"));
const brands_1 = __importDefault(require("./routes/brands"));
const memoryManager_1 = __importDefault(require("./utils/memoryManager"));
// Load environment variables
dotenv_1.default.config();
// Initialize memory management
memoryManager_1.default.setupErrorHandling();
// Start periodic memory monitoring
setInterval(() => {
    memoryManager_1.default.monitorMemoryUsage();
}, 5 * 60 * 1000); // Every 5 minutes
// Start periodic cleanup
setInterval(() => {
    memoryManager_1.default.cleanupResources();
}, 30 * 60 * 1000); // Every 30 minutes
// Initialize Prisma client
exports.prisma = new client_1.PrismaClient();
// Create Express app
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Add scraper routes before authentication middleware
app.use('/api/scraper', scraper_2.default);
// Setup routes (authentication middleware is likely applied here)
(0, routes_1.setupRoutes)(app);
// Additional routes (these might also be under authentication depending on setupRoutes)
app.use('/api/auth', authRoutes_1.default);
app.use('/api/search-profiles', searchProfileRoutes_1.default);
app.use('/api/brands', brands_1.default);
// Error handling
app.use(errorHandler_1.errorHandler);
// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    logger_1.logger.info(`Server running on port ${PORT}`);
    // Initialize scraper
    (0, scraper_1.setupScraper)();
});
// Handle graceful shutdown
process.on('SIGTERM', async () => {
    logger_1.logger.info('SIGTERM received. Closing HTTP server and Prisma client...');
    await exports.prisma.$disconnect();
    process.exit(0);
});
