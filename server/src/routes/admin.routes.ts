import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// All admin routes require ADMIN role
router.use(authenticate, requireRole('ADMIN'));

// ── Users management ──────────────────────────────────────────────────────────
router.get('/users', async (req: any, res, next) => {
  try {
    const { page = '1', limit = '20', role, search } = req.query as Record<string, string>;
    const pageNum = parseInt(page); const limitNum = parseInt(limit);
    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (search) where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, select: { id: true, fullName: true, email: true, mobile: true, role: true, district: true, isApproved: true, isSuspended: true, isEmailVerified: true, createdAt: true },
        orderBy: { createdAt: 'desc' }, skip: (pageNum - 1) * limitNum, take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ success: true, data: users, pagination: { page: pageNum, limit: limitNum, total } });
  } catch (err) { next(err); }
});

router.patch('/users/:id/approve', async (req: any, res, next) => {
  try {
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { isApproved: true } });
    res.json({ success: true, data: { id: user.id, isApproved: user.isApproved } });
  } catch (err) { next(err); }
});

router.patch('/users/:id/suspend', async (req: any, res, next) => {
  try {
    const { suspend } = req.body;
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { isSuspended: !!suspend } });
    res.json({ success: true, data: { id: user.id, isSuspended: user.isSuspended } });
  } catch (err) { next(err); }
});

// ── Survey Progress ───────────────────────────────────────────────────────────
router.get('/survey-progress', async (_req, res, next) => {
  try {
    const progress = await prisma.surveyProgress.findMany({ orderBy: [{ surveyType: 'asc' }, { district: 'asc' }] });
    // Add computed pending field (fix shifted-value bug from spreadsheets)
    const withPending = progress.map(p => ({
      ...p,
      pendingCount: p.targetCount - p.completedCount,
      completionPct: p.targetCount > 0 ? parseFloat(((p.completedCount / p.targetCount) * 100).toFixed(1)) : 0,
    }));
    res.json({ success: true, data: withPending });
  } catch (err) { next(err); }
});

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get('/stats', async (_req, res, next) => {
  try {
    const [users, listings, orders, sources] = await Promise.all([
      prisma.user.groupBy({ by: ['role'], _count: true }),
      prisma.listing.groupBy({ by: ['status'], _count: true }),
      prisma.order.groupBy({ by: ['status'], _count: true }),
      Promise.all([
        prisma.agriculturalSource.count(),
        prisma.industrialSource.count(),
        prisma.municipalWasteSite.count(),
        prisma.collectionPoint.count(),
        prisma.processingFacility.count(),
      ]),
    ]);
    res.json({
      success: true,
      data: {
        users: Object.fromEntries(users.map(u => [u.role, u._count])),
        listings: Object.fromEntries(listings.map(l => [l.status, l._count])),
        orders: Object.fromEntries(orders.map(o => [o.status, o._count])),
        sources: { agricultural: sources[0], industrial: sources[1], municipal: sources[2], collectionPoints: sources[3], facilities: sources[4] },
      },
    });
  } catch (err) { next(err); }
});

// ── Audit logs ────────────────────────────────────────────────────────────────
router.get('/audit-logs', async (req: any, res, next) => {
  try {
    const { page = '1', limit = '50' } = req.query as Record<string, string>;
    const pageNum = parseInt(page); const limitNum = parseInt(limit);
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: { user: { select: { fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' }, skip: (pageNum - 1) * limitNum, take: limitNum,
      }),
      prisma.auditLog.count(),
    ]);
    res.json({ success: true, data: logs, pagination: { page: pageNum, limit: limitNum, total } });
  } catch (err) { next(err); }
});

// ── Collection Points ─────────────────────────────────────────────────────────
router.get('/collection-points', async (_req, res, next) => {
  try {
    const points = await prisma.collectionPoint.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: points });
  } catch (err) { next(err); }
});

router.post('/collection-points', async (req: any, res, next) => {
  try {
    const count = await prisma.collectionPoint.count();
    const code = `CP-${String(count + 1).padStart(3, '0')}`;
    const cp = await prisma.collectionPoint.create({ data: { ...req.body, code } });
    res.status(201).json({ success: true, data: cp });
  } catch (err) { next(err); }
});

router.put('/collection-points/:id', async (req: any, res, next) => {
  try {
    const cp = await prisma.collectionPoint.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: cp });
  } catch (err) { next(err); }
});

// ── Biomass Prices admin ──────────────────────────────────────────────────────
router.post('/prices', async (req: any, res, next) => {
  try {
    const count = await prisma.biomassPrice.count();
    const code = `PRC-${String(count + 1).padStart(3, '0')}`;
    // Auto-compute Rs/quintal
    const priceRsQuintal = req.body.priceRsTon / 10;
    const price = await prisma.biomassPrice.create({ data: { ...req.body, code, priceRsQuintal } });
    res.status(201).json({ success: true, data: price });
  } catch (err) { next(err); }
});

// ── Transport Routes admin ────────────────────────────────────────────────────
router.get('/transport-routes', async (_req, res, next) => {
  try {
    const routes = await prisma.transportRoute.findMany({ orderBy: { createdAt: 'desc' } });
    const withComputed = routes.map(r => ({
      ...r,
      transportCostRsTon: r.fuelCostRsKm && r.vehicleLoadTons
        ? parseFloat(((r.distanceKm * r.fuelCostRsKm) / r.vehicleLoadTons + (r.tollChargesRs ?? 0) / r.vehicleLoadTons).toFixed(2))
        : null,
    }));
    res.json({ success: true, data: withComputed });
  } catch (err) { next(err); }
});

router.post('/transport-routes', async (req: any, res, next) => {
  try {
    const count = await prisma.transportRoute.count();
    const code = `TR-${String(count + 1).padStart(3, '0')}`;
    const route = await prisma.transportRoute.create({ data: { ...req.body, code } });
    res.json({ success: true, data: route });
  } catch (err) { next(err); }
});

export default router;
