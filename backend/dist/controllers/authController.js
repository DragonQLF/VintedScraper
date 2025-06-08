"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const index_1 = require("../index");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const authUtils_1 = require("../utils/authUtils");
const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        // Check if user already exists
        const existingUser = await index_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            throw new errorHandler_1.AppError(400, 'User already exists');
        }
        // Hash password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        // Create user
        const user = await index_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name
            },
            select: {
                id: true,
                email: true,
                name: true
            }
        });
        // Generate token
        const token = (0, authUtils_1.generateToken)(user.id);
        res.status(201).json({
            user,
            token
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Failed to register user' });
        }
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        logger_1.logger.info('Login attempt:', { email });
        // Find user
        logger_1.logger.debug('Looking up user in database...');
        const user = await index_1.prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            logger_1.logger.warn('Login failed: User not found', { email });
            throw new errorHandler_1.AppError(401, 'Invalid credentials');
        }
        // Check password
        logger_1.logger.debug('Verifying password...');
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            logger_1.logger.warn('Login failed: Invalid password', { email });
            throw new errorHandler_1.AppError(401, 'Invalid credentials');
        }
        // Generate token
        logger_1.logger.debug('Generating JWT token...');
        const token = (0, authUtils_1.generateToken)(user.id);
        // Return user data and token
        logger_1.logger.info('Login successful', { userId: user.id });
        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            },
            token
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError) {
            logger_1.logger.error('Login error:', {
                statusCode: error.statusCode,
                message: error.message
            });
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            logger_1.logger.error('Unexpected login error:', error);
            res.status(500).json({ error: 'Failed to login' });
        }
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        const user = await index_1.prisma.user.findUnique({
            where: { id: req.user?.id },
            select: {
                id: true,
                email: true,
                name: true
            }
        });
        if (!user) {
            throw new errorHandler_1.AppError(404, 'User not found');
        }
        res.json(user);
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            console.error('Get me error:', error);
            res.status(500).json({ error: 'Failed to get user data' });
        }
    }
};
exports.getMe = getMe;
