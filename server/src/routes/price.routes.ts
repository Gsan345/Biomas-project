import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/prisma';

const router = Router();

router.get('/', authenticate, async (req: any, res, next) => {
  try {
    const { district, biomassType, page = '1', limit = '50' } = req.query as Record<string, string>;
    const pageNum = parseInt(page); const limitNum = parseInt(limit);
    const where: Record<string, unknown> = {};
    if (district) where.district = district;
    if (biomassType) where.biomassType = biomassType;
    const [prices, total] = await Promise.all([
      prisma.biomassPrice.findMany({ where, orderBy: { date: 'desc' }, skip: (pageNum - 1) * limitNum, take: limitNum }),
      prisma.biomassPrice.count({ where }),
    ]);
    res.json({ success: true, data: prices, pagination: { page: pageNum, limit: limitNum, total } });
  } catch (err) { next(err); }
});

router.get('/trends', authenticate, async (req: any, res, next) => {
  try {
    const { biomassType, district } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (district) where.district = district;
    if (biomassType) where.biomassType = biomassType;
    const prices = await prisma.biomassPrice.findMany({
      where, orderBy: { date: 'asc' }, take: 100,
      select: { date: true, priceRsTon: true, biomassType: true, district: true, qualityGrade: true },
    });
    res.json({ success: true, data: prices });
  } catch (err) { next(err); }
});

router.get('/seasonal', authenticate, async (req: any, res, next) => {
  try {
    const { district } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (district) where.district = district;
    const data = await prisma.seasonalAvailability.findMany({
      where, orderBy: [{ biomassType: 'asc' }, { month: 'asc' }],
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

export default router;
