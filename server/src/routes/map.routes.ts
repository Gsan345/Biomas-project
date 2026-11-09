import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/prisma';

const router = Router();

// ── Map data: all sources, collection points, facilities, routes ──────────────
router.get('/sources', authenticate, async (_req, res, next) => {
  try {
    const [agr, ind, msw, cp, fac] = await Promise.all([
      prisma.agriculturalSource.findMany({ where: { isActive: true }, select: { id: true, code: true, name: true, latitude: true, longitude: true, biomassType: true, district: true, collectionFeasibility: true } }),
      prisma.industrialSource.findMany({ where: { isActive: true }, select: { id: true, code: true, industryName: true, latitude: true, longitude: true, biomassType: true, district: true } }),
      prisma.municipalWasteSite.findMany({ where: { isActive: true }, select: { id: true, code: true, city: true, latitude: true, longitude: true, district: true, dailyWasteKg: true } }),
      prisma.collectionPoint.findMany({ where: { isActive: true }, select: { id: true, code: true, name: true, latitude: true, longitude: true, district: true, storageCapacityTons: true } }),
      prisma.processingFacility.findMany({ where: { isActive: true }, select: { id: true, code: true, name: true, latitude: true, longitude: true, district: true, facilityType: true, installedCapacityTPD: true } }),
    ]);
    res.json({ success: true, data: { agricultural: agr, industrial: ind, municipal: msw, collectionPoints: cp, facilities: fac } });
  } catch (err) { next(err); }
});

router.get('/routes', authenticate, async (_req, res, next) => {
  try {
    const routes = await prisma.transportRoute.findMany({
      where: { isActive: true },
      select: { id: true, code: true, fromLocationName: true, toLocationName: true, distanceKm: true, roadType: true, roadCondition: true, fuelCostRsKm: true, vehicleLoadTons: true, tollChargesRs: true },
    });
    res.json({ success: true, data: routes });
  } catch (err) { next(err); }
});

export default router;
