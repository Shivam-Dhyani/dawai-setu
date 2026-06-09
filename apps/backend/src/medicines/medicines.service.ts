import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MedicinesService {
  constructor(private readonly prisma: PrismaService) {}

  // Full medicine master catalogue.
  listAll() {
    return this.prisma.medicine.findMany({ orderBy: { name: 'asc' } });
  }

  // Ready-to-use, non-expired hospital inventory aggregated by medicine.
  // Used by doctors in patient-case medicine picker (PRD §10.4).
  // Quantity = sum of READY_TO_USE batches with expiry_date > now.
  async listAvailable(hospitalId: string) {
    const now = new Date();

    const batches = await this.prisma.hospitalInventoryBatch.findMany({
      where: {
        hospitalId,
        readinessState: 'READY_TO_USE',
        expiryDate: { gt: now },
        quantity: { gt: 0 },
      },
      include: { medicine: true },
    });

    // Aggregate by medicine so the picker sees one row per medicine with total qty.
    const byMedicine = new Map<string, { medicine: { id: string; name: string; indication: string }; availableQty: number }>();
    for (const batch of batches) {
      const existing = byMedicine.get(batch.medicineId);
      if (existing) {
        existing.availableQty += batch.quantity;
      } else {
        byMedicine.set(batch.medicineId, {
          medicine: { id: batch.medicine.id, name: batch.medicine.name, indication: batch.medicine.indication },
          availableQty: batch.quantity,
        });
      }
    }

    return Array.from(byMedicine.values());
  }
}
