import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { AppError } from './errorHandler';

interface JwtPayload {
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new AppError(401, 'Not authorized to access this route'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(new AppError(401, 'No token provided'));
    }

    try {
      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string,
        { algorithms: ['HS256'] }
      ) as JwtPayload;

      if (!decoded.userId) {
        return next(new AppError(401, 'Invalid token payload'));
      }

      // Get user from token
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true }
      });

      if (!user) {
        return next(new AppError(401, 'User not found'));
      }

      // Add user to request
      req.user = user;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return next(new AppError(401, 'Invalid token'));
      }
      if (error instanceof jwt.TokenExpiredError) {
        return next(new AppError(401, 'Token expired'));
      }
      return next(error);
    }
  } catch (error) {
    return next(error);
  }
}; 