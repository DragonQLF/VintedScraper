import { Router } from 'express';
import { login, register, getMe } from '../controllers/authController';
import { protect } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Auth routes
router.post('/login', login);
router.post('/register', register);
router.get('/me', protect, getMe);

// Webhook URL management for authenticated users
router.get('/webhook-url', protect, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { discordWebhookUrl: true }
    });
    res.json({ webhookUrl: user?.discordWebhookUrl || '' });
  } catch (error) {
    console.error('Error fetching user webhook URL:', error);
    res.status(500).json({ error: 'Failed to fetch user webhook URL' });
  }
});

router.put('/webhook-url', protect, async (req, res) => {
  const { webhookUrl } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { discordWebhookUrl: webhookUrl || null } // Store null if webhookUrl is empty
    });
    res.json({ webhookUrl: user.discordWebhookUrl || '' });
  } catch (error) {
    console.error('Error updating user webhook URL:', error);
    res.status(500).json({ error: 'Failed to update user webhook URL' });
  }
});

export default router; 