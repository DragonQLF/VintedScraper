"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const index_1 = require("../index");
const errorHandler_1 = require("../middleware/errorHandler");
const authUtils_1 = require("../utils/authUtils");
const register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;
        // Check if user exists
        const existingUser = await index_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            throw new errorHandler_1.AppError(400, 'Email already registered');
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
                name: true,
                createdAt: true
            }
        });
        // Generate token
        const token = (0, authUtils_1.generateToken)(user.id);
        res.status(201).json({
            status: 'success',
            data: {
                user,
                token
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // Check if user exists
        const user = await index_1.prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            throw new errorHandler_1.AppError(401, 'Invalid credentials');
        }
        // Check password
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            throw new errorHandler_1.AppError(401, 'Invalid credentials');
        }
        // Generate token
        const token = (0, authUtils_1.generateToken)(user.id);
        res.json({
            status: 'success',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                },
                token
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const getProfile = async (req, res, next) => {
    try {
        const user = await index_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                searchProfiles: true
            }
        });
        res.json({
            status: 'success',
            data: { user }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProfile = getProfile;
