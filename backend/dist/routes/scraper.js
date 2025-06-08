"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendStatusUpdate = void 0;
const express_1 = require("express");
const logger_1 = require("../utils/logger");
const scraper_1 = require("../scraper");
const router = (0, express_1.Router)();
// Keep track of connected clients
let clients = [];
// Function to send status updates to all connected clients
const sendStatusUpdate = (status) => {
    clients = clients.filter(res => {
        try {
            res.write(`data: ${JSON.stringify(status)}\n\n`);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error sending status update to client:', error);
            return false;
        }
    });
};
exports.sendStatusUpdate = sendStatusUpdate;
// SSE endpoint for scraper status
router.get('/status/stream', (req, res) => {
    try {
        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust CORS as needed
        // Send current status immediately to the new client
        const currentStatus = (0, scraper_1.getScraperStatus)();
        res.write(`data: ${JSON.stringify(currentStatus)}\n\n`);
        // Add client to the list
        clients.push(res);
        logger_1.logger.info('Client connected for scraper status stream.');
        // Remove client from the list on disconnect
        req.on('close', () => {
            clients = clients.filter(client => client !== res);
            logger_1.logger.info('Client disconnected from scraper status stream.');
        });
        // Handle errors on the response
        res.on('error', (error) => {
            logger_1.logger.error('Error in scraper status stream:', error);
            clients = clients.filter(client => client !== res);
        });
    }
    catch (error) {
        logger_1.logger.error('Error setting up scraper status stream:', error);
        res.status(500).end();
    }
});
exports.default = router;
