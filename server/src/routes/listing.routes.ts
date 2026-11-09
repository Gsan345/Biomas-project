import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// ── Create listing ────────────────────────────────────────────────────────────
router.post('/', authenticate, requireRole('SELLER'), async (req: any, res, next) => {
  try {
    const listing = await prisma.listing.create({
      data: { ...req.body, sellerUserId: req.userId! },
    });
    res.status(201).json({ success: true, data: listing });
  } catch (err) { next(err); }
});

// ── Get all active listings (public browse) ───────────────────────────────────
router.get('/', authenticate, async (req: any, res, next) => {
  try {
    const { page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where: { status: 'ACTIVE' },
        include: { sellerUser: { select: { fullName: true, district: true, mobile: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.listing.count({ where: { status: 'ACTIVE' } }),
    ]);
    res.json({ success: true, data: listings, pagination: { page: pageNum, limit: limitNum, total } });
  } catch (err) { next(err); }
});

// ── Get single listing ────────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req: any, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        sellerUser: { select: { fullName: true, district: true, mobile: true, email: true } },
        agriculturalSource: true,
        industrialSource: true,
        municipalWasteSite: true,
      },
    });
    if (!listing) throw new AppError('Listing not found', 404);
    res.json({ success: true, data: listing });
  } catch (err) { next(err); }
});

// ── Update listing ────────────────────────────────────────────────────────────
router.put('/:id', authenticate, requireRole('SELLER'), async (req: any, res, next) => {
  try {
    const existing = await prisma.listing.findFirst({ where: { id: req.params.id, sellerUserId: req.userId! } });
    if (!existing) throw new AppError('Listing not found or access denied', 404);
    const updated = await prisma.listing.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// ── Delete listing ────────────────────────────────────────────────────────────
router.delete('/:id', authenticate, requireRole('SELLER'), async (req: any, res, next) => {
  try {
    const existing = await prisma.listing.findFirst({ where: { id: req.params.id, sellerUserId: req.userId! } });
    if (!existing) throw new AppError('Listing not found or access denied', 404);
    await prisma.listing.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Listing deleted' });
  } catch (err) { next(err); }
});

export default router;
