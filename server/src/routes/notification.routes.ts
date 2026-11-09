import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/prisma';

const router = Router();

router.get('/', authenticate, async (req: any, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: notifications });
  } catch (err) { next(err); }
});

router.patch('/:id/read', authenticate, async (req: any, res, next) => {
  try {
    const n = await prisma.notification.findFirst({ where: { id: req.params.id, userId: req.userId! } });
    if (!n) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.patch('/read-all', authenticate, async (req: any, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.userId!, isRead: false }, data: { isRead: true } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
