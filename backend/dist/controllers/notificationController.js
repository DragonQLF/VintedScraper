"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const index_1 = require("../index");
const errorHandler_1 = require("../middleware/errorHandler");
const getNotifications = async (req, res, next) => {
    try {
        const notifications = await index_1.prisma.notification.findMany({
            where: {
                userId: req.user.id
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50
        });
        res.json({
            status: 'success',
            data: { notifications }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getNotifications = getNotifications;
const markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const notification = await index_1.prisma.notification.findFirst({
            where: {
                id,
                userId: req.user.id
            }
        });
        if (!notification) {
            throw new errorHandler_1.AppError(404, 'Notification not found');
        }
        await index_1.prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
        res.json({
            status: 'success',
            data: null
        });
    }
    catch (error) {
        next(error);
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res, next) => {
    try {
        await index_1.prisma.notification.updateMany({
            where: {
                userId: req.user.id,
                isRead: false
            },
            data: { isRead: true }
        });
        res.json({
            status: 'success',
            data: null
        });
    }
    catch (error) {
        next(error);
    }
};
exports.markAllAsRead = markAllAsRead;
