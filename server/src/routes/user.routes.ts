import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/prisma';

const router = Router();

// User self-profile update
router.get('/me', authenticate, async (req: any, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { id: true, email: true, fullName: true, mobile: true, district: true, role: true, isEmailVerified: true, isApproved: true, createdAt: true, sellerProfile: true, buyerProfile: true },
    });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

export default router;
