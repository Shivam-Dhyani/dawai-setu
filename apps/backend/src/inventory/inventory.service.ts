import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Months within which a batch is considered near-expiry (PRD §8).
const NEAR_EXPIRY_MONTHS = 3;

function nearExpiryThreshold(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + NEAR_EXPIRY_MONTHS);
  return d;
}

// Derived status appended to each batch row — never stored (PRD §8).
function deriveStatus(expiryDate: Date, readinessState: string): string {
  const now = new Date();
  if (expiryDate < now) return 'EXPIRED';
  if (expiryDate <= nearExpiryThreshold() && readinessState === 'READY_TO_USE') return 'NEAR_EXPIRY';
  return readinessState;
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  // All hospital inventory batches with derived readiness display status.
  async listBatches(hospitalId: string) {
    const batches = await this.prisma.hospitalInventoryBatch.findMany({
      where: { hospitalId },
      include: { medicine: true },
      orderBy: { createdAt: 'desc' },
    });

    return batches.map((b) => ({
      ...b,
      displayStatus: deriveStatus(b.expiryDate, b.readinessState),
    }));
  }

  // Mark a RECEIVED_PENDING batch READY_TO_USE and complete its sub-order.
  // Must run inside a transaction so the batch flip and sub-order update are atomic (PRD §15).
  async markReady(batchId: string, hospitalId: string) {
    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.hospitalInventoryBatch.findUnique({ where: { id: batchId } });
      if (!batch) throw new NotFoundException('Batch not found');
      if (batch.hospitalId !== hospitalId) throw new NotFoundException('Batch not found');
      if (batch.readinessState !== 'RECEIVED_PENDING') {
        throw new BadRequestException('Only RECEIVED_PENDING batches can be marked ready');
      }

      const updated = await tx.hospitalInventoryBatch.update({
        where: { id: batchId },
        data: { readinessState: 'READY_TO_USE' },
      });

      // Complete the linked sub-order when it exists (PRD §9, §10.8).
      if (batch.subOrderId) {
        await tx.subOrder.update({
          where: { id: batch.subOrderId },
          data: { status: 'COMPLETED' },
        });

        // Audit trail (PRD §15).
        await tx.auditLog.create({
          data: {
            actorId: hospitalId,
            actorType: 'HOSPITAL',
            action: 'BATCH_MARKED_READY',
            resourceId: batchId,
            resourceType: 'HospitalInventoryBatch',
            metadata: { subOrderId: batch.subOrderId },
          },
        });
      }

      return updated;
    });
  }

  // READY_TO_USE batches expiring within 3 months (PRD §10.9).
  listNearExpiry(hospitalId: string) {
    const now = new Date();
    const threshold = nearExpiryThreshold();

    return this.prisma.hospitalInventoryBatch.findMany({
      where: {
        hospitalId,
        readinessState: 'READY_TO_USE',
        expiryDate: { gt: now, lte: threshold },
      },
      include: { medicine: true },
      orderBy: { expiryDate: 'asc' },
    });
  }

  // Batches past their expiry date — excluded from prescribing (PRD §10.10).
  listExpired(hospitalId: string) {
    return this.prisma.hospitalInventoryBatch.findMany({
      where: {
        hospitalId,
        expiryDate: { lt: new Date() },
      },
      include: { medicine: true },
      orderBy: { expiryDate: 'asc' },
    });
  }
}
