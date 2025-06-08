"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Get all brands
router.get('/', async (req, res) => {
    try {
        const brands = await prisma.brand.findMany({
            orderBy: {
                name: 'asc'
            }
        });
        res.json(brands);
    }
    catch (error) {
        console.error('Error fetching brands:', error);
        res.status(500).json({ error: 'Failed to fetch brands' });
    }
});
exports.default = router;
