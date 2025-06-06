import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

const generateToken = (userId: string) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET as string,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      algorithm: 'HS256'
    }
  );
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new AppError(400, 'User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
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
    const token = generateToken(user.id);

    res.status(201).json({
      user,
      token
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    logger.info('Login attempt:', { email });

    // Find user
    logger.debug('Looking up user in database...');
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      logger.warn('Login failed: User not found', { email });
      throw new AppError(401, 'Invalid credentials');
    }

    // Check password
    logger.debug('Verifying password...');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn('Login failed: Invalid password', { email });
      throw new AppError(401, 'Invalid credentials');
    }

    // Generate token
    logger.debug('Generating JWT token...');
    const token = generateToken(user.id);

    // Return user data and token
    logger.info('Login successful', { userId: user.id });
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });
  } catch (error) {
    if (error instanceof AppError) {
      logger.error('Login error:', { 
        statusCode: error.statusCode, 
        message: error.message 
      });
      res.status(error.statusCode).json({ error: error.message });
    } else {
      logger.error('Unexpected login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json(user);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Get me error:', error);
      res.status(500).json({ error: 'Failed to get user data' });
    }
  }
}; 