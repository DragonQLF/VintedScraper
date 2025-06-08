"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Auth routes
router.post('/login', authController_1.login);
router.post('/register', authController_1.register);
router.get('/me', auth_1.protect, authController_1.getMe);
// Webhook URL management for authenticated users
router.get('/webhook-url', auth_1.protect, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { discordWebhookUrl: true }
        });
        res.json({ webhookUrl: user?.discordWebhookUrl || '' });
    }
    catch (error) {
        console.error('Error fetching user webhook URL:', error);
        res.status(500).json({ error: 'Failed to fetch user webhook URL' });
    }
});
router.put('/webhook-url', auth_1.protect, async (req, res) => {
    const { webhookUrl } = req.body;
    try {
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { discordWebhookUrl: webhookUrl || null } // Store null if webhookUrl is empty
        });
        res.json({ webhookUrl: user.discordWebhookUrl || '' });
    }
    catch (error) {
        console.error('Error updating user webhook URL:', error);
        res.status(500).json({ error: 'Failed to update user webhook URL' });
    }
});
exports.default = router;
