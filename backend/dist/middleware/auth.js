"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../index");
const errorHandler_1 = require("./errorHandler");
const protect = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return next(new errorHandler_1.AppError(401, 'Not authorized to access this route'));
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return next(new errorHandler_1.AppError(401, 'No token provided'));
        }
        try {
            // Verify token
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
            if (!decoded.userId) {
                return next(new errorHandler_1.AppError(401, 'Invalid token payload'));
            }
            // Get user from token
            const user = await index_1.prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, email: true }
            });
            if (!user) {
                return next(new errorHandler_1.AppError(401, 'User not found'));
            }
            // Add user to request
            req.user = user;
            next();
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                return next(new errorHandler_1.AppError(401, 'Invalid token'));
            }
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                return next(new errorHandler_1.AppError(401, 'Token expired'));
            }
            return next(error);
        }
    }
    catch (error) {
        return next(error);
    }
};
exports.protect = protect;
