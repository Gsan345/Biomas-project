import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// ── Seller Dashboard Overview ─────────────────────────────────────────────────
router.get('/dashboard', authenticate, requireRole('SELLER'), async (req: any, res, next) => {
  try {
    const userId = req.userId!;
    const [activeListings, openOrders, revenueResult, sources] = await Promise.all([
      prisma.listing.count({ where: { sellerUserId: userId, status: 'ACTIVE' } }),
      prisma.order.count({ where: { sellerUserId: userId, status: { in: ['REQUESTED', 'NEGOTIATING', 'CONFIRMED', 'IN_TRANSIT'] } } }),
      prisma.order.aggregate({
        where: { sellerUserId: userId, status: { in: ['PAID', 'CLOSED'] } },
        _sum: { finalPriceRsTon: true },
      }),
      prisma.sellerProfile.findUnique({
        where: { userId },
        include: {
          industrialSources: { take: 5, orderBy: { createdAt: 'desc' } },
          agriculturalSources: { take: 5, orderBy: { createdAt: 'desc' } },
          municipalWasteSites: { take: 5, orderBy: { createdAt: 'desc' } },
        },
      }),
    ]);

    // Quantity available this month from active listings
    const listings = await prisma.listing.findMany({
      where: { sellerUserId: userId, status: 'ACTIVE' },
      select: { quantityTonsMonth: true, priceRsTon: true },
    });
    const totalQtyMonth = listings.reduce((s, l) => s + l.quantityTonsMonth, 0);
    const avgPrice = listings.length > 0
      ? listings.reduce((s, l) => s + l.priceRsTon, 0) / listings.length
      : 0;

    res.json({
      success: true,
      data: {
        activeListings,
        openOrders,
        revenueToDate: revenueResult._sum.finalPriceRsTon ?? 0,
        totalQtyThisMonth: totalQtyMonth,
        avgPriceRsTon: avgPrice,
        recentSources: sources,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── My Sources ────────────────────────────────────────────────────────────────
router.get('/sources', authenticate, requireRole('SELLER'), async (req: any, res, next) => {
  try {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId: req.userId! },
      include: {
        industrialSources: true,
        agriculturalSources: true,
        municipalWasteSites: true,
      },
    });
    if (!profile) throw new AppError('Seller profile not found', 404);
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
});

// ── Agricultural Sources CRUD ─────────────────────────────────────────────────
router.get('/sources/agricultural', authenticate, requireRole('SELLER'), async (req: any, res, next) => {
  try {
    const profile = await prisma.sellerProfile.findUnique({ where: { userId: req.userId! } });
    if (!profile) throw new AppError('Profile not found', 404);
    const sources = await prisma.agriculturalSource.findMany({
      where: { sellerProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: sources });
  } catch (err) { next(err); }
});

router.post('/sources/agricultural', authenticate, requireRole('SELLER'), async (req: any, res, next) => {
  try {
    const profile = await prisma.sellerProfile.findUnique({ where: { userId: req.userId! } });
    if (!profile) throw new AppError('Profile not found', 404);
    const count = await prisma.agriculturalSource.count({ where: { sellerProfileId: profile.id } });
    const code = `AGR-${String(count + 1).padStart(3, '0')}`;
    const source = await prisma.agriculturalSource.create({
      data: { ...req.body, code, sellerProfileId: profile.id },
    });
    res.status(201).json({ success: true, data: source });
  } catch (err) { next(err); }
});

router.put('/sources/agricultural/:id', authenticate, requireRole('SELLER'), async (req: any, res, next) => {
  try {
    const profile = await prisma.sellerProfile.findUnique({ where: { userId: req.userId! } });
    if (!profile) throw new AppError('Profile not found', 404);
    const existing = await prisma.agriculturalSource.findFirst({ where: { id: req.params.id, sellerProfileId: profile.id } });
    if (!existing) throw new AppError('Source not found or access denied', 404);
    const updated = await prisma.agriculturalSource.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

router.delete('/sources/agricultural/:id', authenticate, requireRole('SELLER'), async (req: any, res, next) => {
  try {
    const profile = await prisma.sellerProfile.findUnique({ where: { userId: req.userId! } });
    if (!profile) throw new AppError('Profile not found', 404);
    const existing = await prisma.agriculturalSource.findFirst({ where: { id: req.params.id, sellerProfileId: profile.id } });
    if (!existing) throw new AppError('Source not found or access denied', 404);
    await prisma.agriculturalSource.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Source deleted' });
  } catch (err) { next(err); }
});

// ── Industrial Sources CRUD ───────────────────────────────────────────────────
router.get('/sources/industrial', authenticate, requireRole('SELLER'), async (req: any, res, next) => {
  try {
    const profile = await prisma.sellerProfile.findUnique({ where: { userId: req.userId! } });
    if (!profile) throw new AppError('Profile not found', 404);
    const sources = await prisma.industrialSource.findMany({ where: { sellerProfileId: profile.id }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: sources });
  } catch (err) { next(err); }
});

router.post('/sources/industrial', authenticate, requireRole('SELLER'), async (req: any, res, next) => {
  try {
    const profile = await prisma.sellerProfile.findUnique({ where: { userId: req.userId! } });
    if (!profile) throw new AppError('Profile not found', 404);
    const count = await prisma.industrialSource.count({ where: { sellerProfileId: profile.id } });
    const code = `IND-${String(count + 1).padStart(3, '0')}`;
    const source = await prisma.industrialSource.create({ data: { ...req.body, code, sellerProfileId: profile.id } });
    res.status(201).json({ success: true, data: source });
  } catch (err) { next(err); }
});

router.put('/sources/industrial/:id', authenticate, requireRole('SELLER'), async (req: any, res, next) => {
  try {
    const profile = await prisma.sellerProfile.findUnique({ where: { userId: req.userId! } });
    if (!profile) throw new AppError('Profile not found', 404);
    const existing = await prisma.industrialSource.findFirst({ where: { id: req.params.id, sellerProfileId: profile.id } });
    if (!existing) throw new AppError('Not found', 404);
    const updated = await prisma.industrialSource.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

router.delete('/sources/industrial/:id', authenticate, requireRole('SELLER'), async (req: any, res, next) => {
  try {
    const profile = await prisma.sellerProfile.findUnique({ where: { userId: req.userId! } });
    if (!profile) throw new AppError('Profile not found', 404);
    const existing = await prisma.industrialSource.findFirst({ where: { id: req.params.id, sellerProfileId: profile.id } });
    if (!existing) throw new AppError('Not found', 404);
    await prisma.industrialSource.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

// ── Municipal Waste Sites CRUD ────────────────────────────────────────────────
router.get('/sources/municipal', authenticate, requireRole('SELLER'), async (req: any, res, next) => {
  try {
    const profile = await prisma.sellerProfile.findUnique({ where: { userId: req.userId! } });
    if (!profile) throw new AppError('Profile not found', 404);
    const sites = await prisma.municipalWasteSite.findMany({ where: { sellerProfileId: profile.id }, orderBy: { createdAt: 'desc' } });
    // Compute derived fields
    const withComputed = sites.map(s => ({
      ...s,
      monthlyTons: parseFloat(((s.dailyWasteKg * 30) / 1000).toFixed(2)),
      annualTons: parseFloat(((s.dailyWasteKg * 365) / 1000).toFixed(2)),
      biodegradableKgDay: parseFloat(((s.dailyWasteKg * s.biodegradablePct) / 100).toFixed(2)),
      wtePotentialTonsDay: parseFloat((((s.dailyWasteKg * s.biodegradablePct) / 100) / 1000).toFixed(3)),
    }));
    res.json({ success: true, data: withComputed });
  } catch (err) { next(err); }
});

router.post('/sources/municipal', authenticate, requireRole('SELLER'), async (req: any, res, next) => {
  try {
    const profile = await prisma.sellerProfile.findUnique({ where: { userId: req.userId! } });
    if (!profile) throw new AppError('Profile not found', 404);
    const count = await prisma.municipalWasteSite.count({ where: { sellerProfileId: profile.id } });
    const code = `MSW-${String(count + 1).padStart(3, '0')}`;
    const site = await prisma.municipalWasteSite.create({ data: { ...req.body, code, sellerProfileId: profile.id } });
    res.status(201).json({ success: true, data: site });
  } catch (err) { next(err); }
});

router.put('/sources/municipal/:id', authenticate, requireRole('SELLER'), async (req: any, res, next) => {
  try {
    const profile = await prisma.sellerProfile.findUnique({ where: { userId: req.userId! } });
    if (!profile) throw new AppError('Profile not found', 404);
    const existing = await prisma.municipalWasteSite.findFirst({ where: { id: req.params.id, sellerProfileId: profile.id } });
    if (!existing) throw new AppError('Not found', 404);
    const updated = await prisma.municipalWasteSite.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

router.delete('/sources/municipal/:id', authenticate, requireRole('SELLER'), async (req: any, res, next) => {
  try {
    const profile = await prisma.sellerProfile.findUnique({ where: { userId: req.userId! } });
    if (!profile) throw new AppError('Profile not found', 404);
    const existing = await prisma.municipalWasteSite.findFirst({ where: { id: req.params.id, sellerProfileId: profile.id } });
    if (!existing) throw new AppError('Not found', 404);
    await prisma.municipalWasteSite.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

// ── Seller's own listings ─────────────────────────────────────────────────────
router.get('/my-listings', authenticate, requireRole('SELLER'), async (req: any, res, next) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { sellerUserId: req.userId! },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: listings });
  } catch (err) { next(err); }
});

// ── Incoming orders ────────────────────────────────────────────────────────────
router.get('/orders', authenticate, requireRole('SELLER'), async (req: any, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { sellerUserId: req.userId! },
      include: { listing: true, buyerUser: { select: { fullName: true, email: true, mobile: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
});

// ── Seasonal availability ─────────────────────────────────────────────────────
router.get('/seasonal', authenticate, requireRole('SELLER'), async (req: any, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { district: true } });
    const data = await prisma.seasonalAvailability.findMany({
      where: { district: user?.district },
      orderBy: [{ biomassType: 'asc' }, { month: 'asc' }],
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ── Price insights ────────────────────────────────────────────────────────────
router.get('/price-insights', authenticate, requireRole('SELLER'), async (req: any, res, next) => {
  try {
    const { biomassType } = req.query as { biomassType?: string };
    const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { district: true } });
    const prices = await prisma.biomassPrice.findMany({
      where: {
        district: user?.district,
        ...(biomassType ? { biomassType } : {}),
      },
      orderBy: { date: 'desc' },
      take: 24,
    });
    res.json({ success: true, data: prices });
  } catch (err) { next(err); }
});

export default router;
