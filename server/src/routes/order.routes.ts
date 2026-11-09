import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { OrderStatus } from '@prisma/client';

const router = Router();

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  REQUESTED:   ['NEGOTIATING', 'CONFIRMED', 'CANCELLED'],
  NEGOTIATING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:   ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT:  ['DELIVERED'],
  DELIVERED:   ['PAID'],
  PAID:        ['CLOSED'],
  CLOSED:      [],
  CANCELLED:   [],
};

// ── Create order (buyer makes offer) ─────────────────────────────────────────
router.post('/', authenticate, requireRole('BUYER'), async (req: any, res, next) => {
  try {
    const { listingId, quantityTons, offeredPriceRsTon, ...rest } = req.body;
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new AppError('Listing not found', 404);
    if (listing.sellerUserId === req.userId) throw new AppError('Cannot buy your own listing', 400);

    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          listingId,
          buyerUserId: req.userId!,
          sellerUserId: listing.sellerUserId,
          quantityTons,
          offeredPriceRsTon,
          status: 'REQUESTED',
          ...rest,
        },
      });
      // Create notification for seller
      await tx.notification.create({
        data: {
          userId: listing.sellerUserId,
          orderId: o.id,
          type: 'OFFER_RECEIVED',
          title: 'New Offer Received',
          body: `A buyer has made an offer of ₹${offeredPriceRsTon}/ton for ${quantityTons} tons of ${listing.biomassType}.`,
        },
      });
      return o;
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) { next(err); }
});

// ── Get single order ──────────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req: any, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        listing: true,
        buyerUser: { select: { fullName: true, email: true, mobile: true } },
        sellerUser: { select: { fullName: true, email: true, mobile: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order) throw new AppError('Order not found', 404);
    // Ownership check
    if (order.buyerUserId !== req.userId && order.sellerUserId !== req.userId && req.userRole !== 'ADMIN') {
      throw new AppError('Access denied', 403);
    }
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

// ── Update order status ───────────────────────────────────────────────────────
router.patch('/:id/status', authenticate, async (req: any, res, next) => {
  try {
    const { status, counterPriceRsTon, finalPriceRsTon, transportCostRsTon, notes } = req.body;
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) throw new AppError('Order not found', 404);

    // Ownership check
    if (order.buyerUserId !== req.userId && order.sellerUserId !== req.userId && req.userRole !== 'ADMIN') {
      throw new AppError('Access denied', 403);
    }

    // Validate transition
    const allowed = VALID_TRANSITIONS[order.status as OrderStatus];
    if (!allowed.includes(status as OrderStatus)) {
      throw new AppError(`Cannot transition from ${order.status} to ${status}`, 400);
    }

    const updateData: Record<string, unknown> = { status };
    if (counterPriceRsTon) updateData.counterPriceRsTon = counterPriceRsTon;
    if (finalPriceRsTon) {
      updateData.finalPriceRsTon = finalPriceRsTon;
      if (transportCostRsTon) {
        updateData.transportCostRsTon = transportCostRsTon;
        updateData.landedCostRsTon = finalPriceRsTon + transportCostRsTon;
      }
    }
    if (notes) updateData.notes = notes;
    if (status === 'DELIVERED') updateData.actualDeliveryDate = new Date();
    if (status === 'PAID') updateData.paymentDate = new Date();

    const updated = await prisma.order.update({ where: { id: req.params.id }, data: updateData });

    // Notify the other party
    const notifyUserId = order.sellerUserId === req.userId ? order.buyerUserId : order.sellerUserId;
    await prisma.notification.create({
      data: {
        userId: notifyUserId,
        orderId: order.id,
        type: 'ORDER_UPDATE',
        title: `Order status updated to ${status}`,
        body: `Your order has been updated to ${status}.`,
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// ── Send message on order ─────────────────────────────────────────────────────
router.post('/:id/messages', authenticate, async (req: any, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) throw new AppError('Order not found', 404);
    if (order.buyerUserId !== req.userId && order.sellerUserId !== req.userId) {
      throw new AppError('Access denied', 403);
    }
    const receiverId = order.buyerUserId === req.userId ? order.sellerUserId : order.buyerUserId;
    const message = await prisma.message.create({
      data: { orderId: order.id, senderId: req.userId!, receiverId, content: req.body.content },
    });
    res.status(201).json({ success: true, data: message });
  } catch (err) { next(err); }
});

export default router;
