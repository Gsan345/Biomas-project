import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// ── Token helpers ─────────────────────────────────────────────────────────────

function generateAccessToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

function generateRefreshToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

function setRefreshCookie(res: Response, token: string, rememberMe = false): void {
  const maxAge = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge,
    path: '/api/v1/auth',
  });
}

// ── Register ──────────────────────────────────────────────────────────────────

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = req.body;

    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError('An account with this email already exists', 409);

    const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          fullName: data.fullName,
          mobile: data.mobile,
          district: data.district,
          role: data.role,
          emailVerifyToken,
          emailVerifyExpiry,
          isApproved: false,
        },
      });

      // Create role-specific profile
      if (data.role === 'SELLER') {
        await tx.sellerProfile.create({
          data: {
            userId: newUser.id,
            sellerType: data.sellerType,
            organisationName: data.organisationName,
            designation: data.designation,
            locationArea: data.locationArea,
            latitude: data.latitude,
            longitude: data.longitude,
            operationalStatus: data.operationalStatus ?? 'OPERATIONAL',
            operatingMonths: data.operatingMonths ?? [],
          },
        });
      } else {
        await tx.buyerProfile.create({
          data: {
            userId: newUser.id,
            buyerType: data.buyerType,
            companyName: data.companyName,
            ownerOrOperator: data.ownerOrOperator,
            locationArea: data.locationArea,
            latitude: data.latitude,
            longitude: data.longitude,
            installedCapacityTPD: data.installedCapacityTPD,
            feedstockTypesAccepted: data.feedstockTypesAccepted ?? [],
            maxMoisturePct: data.maxMoisturePct,
            maxAshPct: data.maxAshPct,
            gridConnectivity: data.gridConnectivity ?? false,
            envClearanceStatus: data.envClearanceStatus ?? 'PENDING',
            deliveryRequired: data.deliveryRequired ?? false,
          },
        });
      }

      return newUser;
    });

    // Log verification link in dev (email send in prod)
    const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${emailVerifyToken}`;
    console.log(`\n📧  [DEV] Email verification link for ${user.email}:\n${verifyUrl}\n`);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER',
        entityType: 'User',
        entityId: user.id,
        newValues: { email: user.email, role: user.role },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: { userId: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

// ── Email Verification ────────────────────────────────────────────────────────

export async function verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.query as { token: string };
    if (!token) throw new AppError('Token required', 400);

    const user = await prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExpiry: { gt: new Date() },
      },
    });

    if (!user) throw new AppError('Invalid or expired verification token', 400);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        isApproved: true,
        emailVerifyToken: null,
        emailVerifyExpiry: null,
      },
    });

    res.json({ success: true, message: 'Email verified successfully. You may now login.' });
  } catch (err) {
    next(err);
  }
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { sellerProfile: true, buyerProfile: true },
    });

    if (!user) throw new AppError('Invalid email or password', 401);

    // Lockout check
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new AppError(`Account locked. Try again in ${remaining} minute(s).`, 429);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      const newCount = user.failedLoginCount + 1;
      const update: Record<string, unknown> = { failedLoginCount: newCount };
      if (newCount >= env.AUTH_LOCKOUT_MAX) {
        update.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lockout
      }
      await prisma.user.update({ where: { id: user.id }, data: update });
      throw new AppError('Invalid email or password', 401);
    }

    if (user.isSuspended) throw new AppError('Your account has been suspended. Contact support.', 403);
    if (!user.isEmailVerified) {
      throw new AppError('Please verify your email before logging in.', 403);
    }

    // Reset failed attempts
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setRefreshCookie(res, refreshToken, rememberMe);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          district: user.district,
          sellerProfile: user.sellerProfile,
          buyerProfile: user.buyerProfile,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── Refresh Token ─────────────────────────────────────────────────────────────

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies.refreshToken;
    if (!token) throw new AppError('No refresh token', 401);

    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string; role: string };

    const stored = await prisma.refreshToken.findFirst({
      where: { token, userId: decoded.userId, expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    if (!stored) throw new AppError('Invalid refresh token', 401);
    if (stored.user.isSuspended) throw new AppError('Account suspended', 403);

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    const newRefreshToken = generateRefreshToken(decoded.userId, decoded.role);
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: decoded.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setRefreshCookie(res, newRefreshToken);
    const accessToken = generateAccessToken(decoded.userId, decoded.role);

    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid refresh token', 401));
    }
    next(err);
  }
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } }).catch(() => {});
    }
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

// ── Forgot Password ───────────────────────────────────────────────────────────

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond the same way to prevent user enumeration
    if (!user) {
      res.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;
    console.log(`\n🔑  [DEV] Password reset link for ${user.email}:\n${resetUrl}\n`);

    res.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
}

// ── Reset Password ────────────────────────────────────────────────────────────

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: { gt: new Date() },
      },
    });

    if (!user) throw new AppError('Invalid or expired reset token', 400);

    const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    res.json({ success: true, message: 'Password reset successfully. Please login.' });
  } catch (err) {
    next(err);
  }
}

// ── Get me ────────────────────────────────────────────────────────────────────

export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true, email: true, fullName: true, mobile: true,
        district: true, role: true, isEmailVerified: true,
        isApproved: true, createdAt: true,
        sellerProfile: true,
        buyerProfile: true,
      },
    });
    if (!user) throw new AppError('User not found', 404);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}
