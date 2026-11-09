import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// ── Landed cost calculator helper ─────────────────────────────────────────────
function computeLandedCost(
  priceRsTon: number,
  distanceKm: number,
  fuelCostRsKm: number,
  vehicleLoadTons: number,
  tollChargesRs: number,
  storageCostRsTonDay: number,
  storageDays: number,
  handlingCostRsTon: number,
): number {
  const transportRsTon = (distanceKm * fuelCostRsKm) / vehicleLoadTons + tollChargesRs / vehicleLoadTons;
  const storageRsTon = storageCostRsTonDay * storageDays;
  return priceRsTon + transportRsTon + storageRsTon + handlingCostRsTon;
}

// ── Buyer Dashboard Overview ──────────────────────────────────────────────────
router.get('/dashboard', authenticate, requireRole('BUYER'), async (req: any, res, next) => {
  try {
    const userId = req.userId!;
    const [openRequirements, pendingDeliveries, totalMatched] = await Promise.all([
      prisma.requirement.count({ where: { buyerUserId: userId, isActive: true } }),
      prisma.order.count({ where: { buyerUserId: userId, status: { in: ['CONFIRMED', 'IN_TRANSIT'] } } }),
      prisma.order.count({ where: { buyerUserId: userId, status: { in: ['DELIVERED', 'PAID', 'CLOSED'] } } }),
    ]);

    const landedCostResult = await prisma.order.aggregate({
      where: { buyerUserId: userId, landedCostRsTon: { not: null } },
      _avg: { landedCostRsTon: true },
    });

    res.json({
      success: true,
      data: {
        openRequirements,
        pendingDeliveries,
        totalMatched,
        avgLandedCostRsTon: landedCostResult._avg.landedCostRsTon ?? 0,
      },
    });
  } catch (err) { next(err); }
});

// ── Marketplace search ────────────────────────────────────────────────────────
router.get('/marketplace', authenticate, async (req: any, res, next) => {
  try {
    const {
      biomassType, district, minPrice, maxPrice, maxMoisture,
      minCalorific, minQuantity, page = '1', limit = '20', sortBy = 'priceRsTon',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = { status: 'ACTIVE' };
    if (biomassType) where.biomassType = biomassType;
    if (district) where.district = district;
    if (minPrice || maxPrice) {
      where.priceRsTon = {};
      if (minPrice) (where.priceRsTon as Record<string, unknown>).gte = parseFloat(minPrice);
      if (maxPrice) (where.priceRsTon as Record<string, unknown>).lte = parseFloat(maxPrice);
    }
    if (maxMoisture) where.moisturePct = { lte: parseFloat(maxMoisture) };
    if (minCalorific) where.calorificValueKcalKg = { gte: parseFloat(minCalorific) };
    if (minQuantity) where.quantityTonsMonth = { gte: parseFloat(minQuantity) };

    const validSort = ['priceRsTon', 'quantityTonsMonth', 'createdAt'];
    const orderBy = validSort.includes(sortBy) ? sortBy : 'priceRsTon';

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          sellerUser: { select: { fullName: true, district: true } },
        },
        orderBy: { [orderBy]: 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.listing.count({ where }),
    ]);

    res.json({
      success: true,
      data: listings,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) { next(err); }
});

// ── Landed-cost calculator ────────────────────────────────────────────────────
router.post('/landed-cost', authenticate, requireRole('BUYER'), async (req: any, res, next) => {
  try {
    const {
      listingId,
      distanceKm,
      fuelCostRsKm = 8,
      vehicleLoadTons = 10,
      tollChargesRs = 0,
      storageCostRsTonDay = 0,
      storageDays = 0,
      handlingCostRsTon = 0,
    } = req.body;

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new AppError('Listing not found', 404);

    const landedCost = computeLandedCost(
      listing.priceRsTon, distanceKm, fuelCostRsKm,
      vehicleLoadTons, tollChargesRs, storageCostRsTonDay, storageDays, handlingCostRsTon
    );

    res.json({
      success: true,
      data: {
        listingId,
        basePrice: listing.priceRsTon,
        transportCostRsTon: (distanceKm * fuelCostRsKm) / vehicleLoadTons + tollChargesRs / vehicleLoadTons,
        storageCostRsTon: storageCostRsTonDay * storageDays,
        handlingCostRsTon,
        totalLandedCostRsTon: parseFloat(landedCost.toFixed(2)),
      },
    });
  } catch (err) { next(err); }
});

// ── Requirements CRUD ─────────────────────────────────────────────────────────
router.get('/requirements', authenticate, requireRole('BUYER'), async (req: any, res, next) => {
  try {
    const reqs = await prisma.requirement.findMany({
      where: { buyerUserId: req.userId! },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: reqs });
  } catch (err) { next(err); }
});

router.post('/requirements', authenticate, requireRole('BUYER'), async (req: any, res, next) => {
  try {
    const req_ = await prisma.requirement.create({
      data: { ...req.body, buyerUserId: req.userId! },
    });
    res.status(201).json({ success: true, data: req_ });
  } catch (err) { next(err); }
});

router.put('/requirements/:id', authenticate, requireRole('BUYER'), async (req: any, res, next) => {
  try {
    const existing = await prisma.requirement.findFirst({ where: { id: req.params.id, buyerUserId: req.userId! } });
    if (!existing) throw new AppError('Not found', 404);
    const updated = await prisma.requirement.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

router.delete('/requirements/:id', authenticate, requireRole('BUYER'), async (req: any, res, next) => {
  try {
    const existing = await prisma.requirement.findFirst({ where: { id: req.params.id, buyerUserId: req.userId! } });
    if (!existing) throw new AppError('Not found', 404);
    await prisma.requirement.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

// ── Orders ────────────────────────────────────────────────────────────────────
router.get('/orders', authenticate, requireRole('BUYER'), async (req: any, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { buyerUserId: req.userId! },
      include: {
        listing: { include: { sellerUser: { select: { fullName: true, email: true, mobile: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
});

// ── Supply-demand gap ─────────────────────────────────────────────────────────
router.get('/supply-gap', authenticate, requireRole('BUYER'), async (req: any, res, next) => {
  try {
    const profile = await prisma.buyerProfile.findUnique({
      where: { userId: req.userId! },
      include: { processingFacilities: true },
    });
    const requirements = await prisma.requirement.findMany({ where: { buyerUserId: req.userId!, isActive: true } });
    const matchedOrders = await prisma.order.findMany({
      where: { buyerUserId: req.userId!, status: { in: ['CONFIRMED', 'IN_TRANSIT', 'DELIVERED'] } },
      select: { quantityTons: true },
    });
    const totalRequired = requirements.reduce((s, r) => s + r.quantityTonsMonth, 0);
    const totalMatched = matchedOrders.reduce((s, o) => s + o.quantityTons, 0);

    res.json({
      success: true,
      data: {
        totalRequiredTonsMonth: totalRequired,
        totalMatchedTons: totalMatched,
        gapTons: Math.max(0, totalRequired - totalMatched),
        facilities: profile?.processingFacilities ?? [],
      },
    });
  } catch (err) { next(err); }
});

export default router;
