"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateToken = (userId) => {
    const options = {
        expiresIn: (process.env.JWT_EXPIRES_IN || '7d'),
        algorithm: 'HS256'
    };
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, options);
};
exports.generateToken = generateToken;
