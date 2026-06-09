import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlaceOrderDto } from './dto/place-order.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // Nearby pharmacies (same city, PRD §15 open item 5) that have sufficient
  // READY_TO_USE stock of the requested medicine.
  async findAvailablePharmacies(medicineId: string, qty: number, hospitalId: string) {
    const hospital = await this.prisma.hospital.findUniqueOrThrow({ where: { id: hospitalId } });

    // Aggregate available qty per pharmacy for this medicine in the same city.
    const batches = await this.prisma.pharmacyInventoryBatch.findMany({
      where: {
        medicineId,
        quantity: { gt: 0 },
        expiryDate: { gt: new Date() },
        pharmacy: { city: hospital.city, status: 'ACTIVE' },
      },
      include: { pharmacy: true },
    });

    const byPharmacy = new Map<string, { pharmacy: { id: string; name: string; city: string; address: string }; availableQty: number; unitPrice: Decimal }>();
    for (const batch of batches) {
      const existing = byPharmacy.get(batch.pharmacyId);
      if (existing) {
        existing.availableQty += batch.quantity;
      } else {
        byPharmacy.set(batch.pharmacyId, {
          pharmacy: { id: batch.pharmacy.id, name: batch.pharmacy.name, city: batch.pharmacy.city, address: batch.pharmacy.address },
          availableQty: batch.quantity,
          unitPrice: batch.unitPrice,
        });
      }
    }

    return Array.from(byPharmacy.values()).filter((p) => p.availableQty >= qty);
  }

  // Place a new order — creates Order + SubOrders + OrderLineItems.
  async placeOrder(dto: PlaceOrderDto, hospitalId: string, createdById: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          hospitalId,
          createdById,
          status: 'PENDING',
        },
      });

      for (const sub of dto.subOrders) {
        // Compute sub-order total from pharmacy batch unit prices.
        let totalPrice = new Decimal(0);
        for (const item of sub.lineItems) {
          const batch = await tx.pharmacyInventoryBatch.findUniqueOrThrow({
            where: { id: item.pharmacyBatchId },
          });
          if (batch.pharmacyId !== sub.pharmacyId) {
            throw new BadRequestException('Batch does not belong to the selected pharmacy');
          }
          if (batch.medicineId !== item.medicineId) {
            throw new BadRequestException('Batch medicine mismatch');
          }
          totalPrice = totalPrice.add(batch.unitPrice.mul(item.neededQty));
        }

        const subOrder = await tx.subOrder.create({
          data: {
            orderId: order.id,
            pharmacyId: sub.pharmacyId,
            status: 'PENDING',
            totalPrice,
          },
        });

        for (const item of sub.lineItems) {
          const batch = await tx.pharmacyInventoryBatch.findUniqueOrThrow({
            where: { id: item.pharmacyBatchId },
          });
          await tx.orderLineItem.create({
            data: {
              subOrderId: subOrder.id,
              medicineId: item.medicineId,
              neededQty: item.neededQty,
              unitPrice: batch.unitPrice,
              lineTotal: batch.unitPrice.mul(item.neededQty),
            },
          });
        }
      }

      return tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: { subOrders: { include: { lineItems: true } } },
      });
    });
  }

  // List all orders for this hospital.
  listOrders(hospitalId: string) {
    return this.prisma.order.findMany({
      where: { hospitalId },
      include: { subOrders: { include: { lineItems: { include: { medicine: true } }, pharmacy: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Single order detail.
  async getOrder(id: string, hospitalId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { subOrders: { include: { lineItems: { include: { medicine: true } }, pharmacy: true } } },
    });
    if (!order || order.hospitalId !== hospitalId) throw new NotFoundException('Order not found');
    return order;
  }

  // Cancel a PENDING order.
  async cancelOrder(id: string, hospitalId: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order || order.hospitalId !== hospitalId) throw new NotFoundException('Order not found');
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Only PENDING orders can be cancelled');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.subOrder.updateMany({
        where: { orderId: id, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      });
      return tx.order.update({ where: { id }, data: { status: 'CANCELLED' } });
    });
  }
}
