import {
  Injectable, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RejectSubOrderDto } from './dto/resolve-sub-order.dto';

// MODULE constant for pharmacy-side orders — these are the sub-orders a pharmacy
// receives from hospitals. The permission module name mirrors the seed data.
const PHARMACY_ORDERS_MODULE = 'PHARMACY_ORDERS';

@Injectable()
export class PharmacyOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // All incoming sub-orders for this pharmacy, newest first.
  listSubOrders(pharmacyId: string) {
    return this.prisma.subOrder.findMany({
      where: { pharmacyId },
      include: {
        lineItems: { include: { medicine: true } },
        order: { include: { hospital: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Single sub-order detail with full line-item breakdown.
  async getSubOrder(id: string, pharmacyId: string) {
    const subOrder = await this.prisma.subOrder.findUnique({
      where: { id },
      include: {
        lineItems: { include: { medicine: true } },
        order: { include: { hospital: true } },
      },
    });
    if (!subOrder || subOrder.pharmacyId !== pharmacyId) {
      throw new NotFoundException('Sub-order not found');
    }
    return subOrder;
  }

  // Accept a sub-order in a single transaction (PRD §9, §15).
  //
  // Steps performed atomically:
  //   1. Verify sub-order is PENDING and belongs to this pharmacy.
  //   2. For each line item: attempt an atomic decrement — if insufficient stock
  //      the entire transaction rolls back (no partial fulfillment, PRD §3.2).
  //   3. Create a RECEIVED_PENDING hospital inventory batch for each line item.
  //   4. Mark sub-order ACCEPTED.
  //   5. Write audit log row.
  async acceptSubOrder(id: string, pharmacyId: string) {
    return this.prisma.$transaction(async (tx) => {
      const subOrder = await tx.subOrder.findUnique({
        where: { id },
        include: { lineItems: true },
      });
      if (!subOrder || subOrder.pharmacyId !== pharmacyId) {
        throw new NotFoundException('Sub-order not found');
      }
      if (subOrder.status !== 'PENDING') {
        throw new BadRequestException('Only PENDING sub-orders can be accepted');
      }

      // Fetch the parent order so we know which hospital receives the batches.
      const order = await tx.order.findUniqueOrThrow({ where: { id: subOrder.orderId } });

      for (const item of subOrder.lineItems) {
        // Find the best matching pharmacy batch for this medicine (non-expired, FIFO).
        // We pick the batch with earliest expiry to minimise waste, then decrement atomically.
        const batchCandidates = await tx.pharmacyInventoryBatch.findMany({
          where: {
            pharmacyId,
            medicineId: item.medicineId,
            quantity: { gt: 0 },
            expiryDate: { gt: new Date() },
          },
          orderBy: { expiryDate: 'asc' },
        });

        let remaining = item.neededQty;
        for (const batch of batchCandidates) {
          if (remaining <= 0) break;

          const take = Math.min(batch.quantity, remaining);

          // Atomic check-and-decrement: if another request raced us, count will be 0.
          const updated = await tx.pharmacyInventoryBatch.updateMany({
            where: { id: batch.id, quantity: { gte: take } },
            data: { quantity: { decrement: take } },
          });
          if (updated.count === 0) {
            throw new BadRequestException(
              `Insufficient stock for medicine ${item.medicineId} — another order may have reserved it`,
            );
          }

          // Create a RECEIVED_PENDING batch in hospital inventory.
          await tx.hospitalInventoryBatch.create({
            data: {
              hospitalId: order.hospitalId,
              medicineId: item.medicineId,
              batchNo: batch.batchNo,
              expiryDate: batch.expiryDate,
              quantity: take,
              readinessState: 'RECEIVED_PENDING',
              unitCost: batch.unitPrice,
              sourcePharmacyId: pharmacyId,
              subOrderId: subOrder.id,
            },
          });

          remaining -= take;
        }

        if (remaining > 0) {
          throw new BadRequestException(
            `Insufficient total stock for medicine ${item.medicineId}`,
          );
        }
      }

      const accepted = await tx.subOrder.update({
        where: { id },
        data: { status: 'ACCEPTED', resolvedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          actorId: pharmacyId,
          actorType: 'PHARMACY',
          action: 'ORDER_ACCEPTED',
          resourceId: id,
          resourceType: 'SubOrder',
          metadata: { orderId: subOrder.orderId },
        },
      });

      // Notify the hospital pharmacist that the sub-order has been accepted.
      const hospital = await tx.hospital.findUniqueOrThrow({ where: { id: order.hospitalId } });
      await tx.notification.create({
        data: {
          recipientId: order.createdById,
          recipientType: 'USER',
          type: 'SUB_ORDER_ACCEPTED',
          payload: {
            subOrderId: id,
            orderId: subOrder.orderId,
            pharmacyId,
          },
        },
      });

      return accepted;
    });
  }

  // Reject a sub-order and notify the hospital pharmacist.
  async rejectSubOrder(id: string, pharmacyId: string, dto: RejectSubOrderDto) {
    const subOrder = await this.prisma.subOrder.findUnique({ where: { id } });
    if (!subOrder || subOrder.pharmacyId !== pharmacyId) {
      throw new NotFoundException('Sub-order not found');
    }
    if (subOrder.status !== 'PENDING') {
      throw new BadRequestException('Only PENDING sub-orders can be rejected');
    }

    return this.prisma.$transaction(async (tx) => {
      const rejected = await tx.subOrder.update({
        where: { id },
        data: { status: 'REJECTED', resolvedAt: new Date() },
      });

      const order = await tx.order.findUniqueOrThrow({ where: { id: subOrder.orderId } });

      await tx.auditLog.create({
        data: {
          actorId: pharmacyId,
          actorType: 'PHARMACY',
          action: 'ORDER_REJECTED',
          resourceId: id,
          resourceType: 'SubOrder',
          metadata: { orderId: subOrder.orderId, reason: dto.reason },
        },
      });

      await tx.notification.create({
        data: {
          recipientId: order.createdById,
          recipientType: 'USER',
          type: 'SUB_ORDER_REJECTED',
          payload: {
            subOrderId: id,
            orderId: subOrder.orderId,
            pharmacyId,
            reason: dto.reason ?? null,
          },
        },
      });

      return rejected;
    });
  }
}
