import { Router } from 'express';
import { prisma } from '../config/prisma';

const router = Router();

// Public stats for landing page
router.get('/', async (_req, res, next) => {
  try {
    const [sellers, buyers, listings, totalBiomassResult] = await Promise.all([
      prisma.user.count({ where: { role: 'SELLER', isApproved: true } }),
      prisma.user.count({ where: { role: 'BUYER', isApproved: true } }),
      prisma.listing.count({ where: { status: 'ACTIVE' } }),
      prisma.listing.aggregate({ where: { status: 'ACTIVE' }, _sum: { quantityTonsMonth: true } }),
    ]);
    const totalDistricts = 2; // Sonitpur and Kamrup
    res.json({
      success: true,
      data: {
        registeredSellers: sellers,
        registeredBuyers: buyers,
        activeListings: listings,
        totalBiomassAvailableTons: totalBiomassResult._sum.quantityTonsMonth ?? 0,
        districtsActive: totalDistricts,
      },
    });
  } catch (err) { next(err); }
});

export default router;
