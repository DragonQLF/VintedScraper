"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = void 0;
const auth_1 = require("../middleware/auth");
const userController = __importStar(require("../controllers/userController"));
const searchProfileController = __importStar(require("../controllers/searchProfileController"));
const notificationController = __importStar(require("../controllers/notificationController"));
const matchController = __importStar(require("../controllers/matchController"));
const scraper_1 = require("../scraper");
const setupRoutes = (app) => {
    // Auth routes
    app.post('/api/auth/register', userController.register);
    app.post('/api/auth/login', userController.login);
    app.get('/api/auth/profile', auth_1.protect, userController.getProfile);
    // Protected routes
    app.use('/api', auth_1.protect);
    // Search profile routes
    app.get('/api/profiles', searchProfileController.getProfiles);
    app.post('/api/profiles', searchProfileController.createProfile);
    app.get('/api/profiles/:id', searchProfileController.getProfile);
    app.put('/api/profiles/:id', searchProfileController.updateProfile);
    app.delete('/api/profiles/:id', searchProfileController.deleteProfile);
    // Match routes
    app.get('/api/matches', matchController.getMatches);
    app.post('/api/actions', matchController.createAction);
    app.post('/api/matches/bulk-delete', matchController.bulkDeleteMatches);
    // Notification routes
    app.get('/api/notifications', notificationController.getNotifications);
    app.put('/api/notifications/:id/read', notificationController.markAsRead);
    app.put('/api/notifications/read-all', notificationController.markAllAsRead);
    // Manual scraper trigger (protected)
    app.post('/api/scraper/trigger', async (req, res) => {
        try {
            await (0, scraper_1.scrapeActiveProfiles)();
            res.json({ message: 'Scraping completed successfully' });
        }
        catch (error) {
            res.status(500).json({ error: 'Scraping failed' });
        }
    });
};
exports.setupRoutes = setupRoutes;
