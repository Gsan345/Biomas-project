import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      userId: string;
      role: string;
    };

    // Check if user is still active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, isSuspended: true, isApproved: true },
    });

    if (!user) throw new AppError('User not found', 401);
    if (user.isSuspended) throw new AppError('Account suspended', 403);

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError('Invalid or expired token', 401));
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
};

export const requireOwnership = (userIdField = 'userId') => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    const resourceUserId = (req as unknown as Record<string, unknown>)[userIdField] as string;
    if (req.userRole === 'ADMIN') return next(); // Admins bypass ownership
    if (resourceUserId && resourceUserId !== req.userId) {
      return next(new AppError('Access denied: not your resource', 403));
    }
    next();
  };
};
