import express from 'express';
import { protect } from '../middleware/auth';
import * as userController from '../controllers/userController';
import * as searchProfileController from '../controllers/searchProfileController';
import * as notificationController from '../controllers/notificationController';
import * as matchController from '../controllers/matchController';
import { scrapeActiveProfiles } from '../scraper';

export const setupRoutes = (app: express.Application) => {
  // Auth routes
  app.post('/api/auth/register', userController.register);
  app.post('/api/auth/login', userController.login);
  app.get('/api/auth/profile', protect, userController.getProfile);

  // Protected routes
  app.use('/api', protect);

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
      await scrapeActiveProfiles();
      res.json({ message: 'Scraping completed successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Scraping failed' });
    }
  });
}; 