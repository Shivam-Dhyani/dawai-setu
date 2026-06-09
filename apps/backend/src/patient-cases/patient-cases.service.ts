import {
  Injectable, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientCaseDto } from './dto/create-patient-case.dto';
import { Decimal } from '@prisma/client/runtime/library';

type PeriodFilter = 'day' | 'week' | 'month' | 'year';

function periodStart(period: PeriodFilter): Date {
  const now = new Date();
  switch (period) {
    case 'day':   return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay());
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'month': return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'year':  return new Date(now.getFullYear(), 0, 1);
  }
}

@Injectable()
export class PatientCasesService {
  private readonly taxRatePercent: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    // TAX_RATE_PERCENT from environment — e.g. "18" means 18%. Default 0 if unset.
    this.taxRatePercent = parseFloat(this.config.get<string>('TAX_RATE_PERCENT', '0'));
  }

  // Create a patient case (PRD §10.2):
  //   1. Validate each medicine is in READY_TO_USE, non-expired hospital inventory with
  //      sufficient quantity.
  //   2. Atomically deduct dispensed qty from the earliest-expiry batch(es).
  //   3. Compute costs: medicine_cost + consultation_fee + tax = total_cost.
  //   4. Persist case and medicines.
  async createCase(dto: CreatePatientCaseDto, doctorId: string, hospitalId: string) {
    return this.prisma.$transaction(async (tx) => {
      const doctor = await tx.user.findUniqueOrThrow({ where: { id: doctorId } });

      let medicineCost = new Decimal(0);

      for (const med of dto.medicines) {
        // Find READY_TO_USE, non-expired batches ordered FIFO (earliest expiry first).
        const batches = await tx.hospitalInventoryBatch.findMany({
          where: {
            hospitalId,
            medicineId: med.medicineId,
            readinessState: 'READY_TO_USE',
            expiryDate: { gt: new Date() },
            quantity: { gt: 0 },
          },
          orderBy: { expiryDate: 'asc' },
        });

        const totalAvailable = batches.reduce((sum, b) => sum + b.quantity, 0);
        if (totalAvailable < med.dispensedQty) {
          throw new BadRequestException(
            `Insufficient READY_TO_USE stock for medicine ${med.medicineId} (available: ${totalAvailable}, requested: ${med.dispensedQty})`,
          );
        }

        // Deduct across batches (FIFO) and accumulate cost.
        let remaining = med.dispensedQty;
        for (const batch of batches) {
          if (remaining <= 0) break;

          const take = Math.min(batch.quantity, remaining);

          // Atomic decrement — prevents concurrent over-dispense.
          const updated = await tx.hospitalInventoryBatch.updateMany({
            where: { id: batch.id, quantity: { gte: take } },
            data: { quantity: { decrement: take } },
          });
          if (updated.count === 0) {
            throw new BadRequestException(
              `Concurrent dispense conflict on batch ${batch.id} — please retry`,
            );
          }

          // Unit cost may be absent for manually added batches; treat as 0.
          const unitCost = batch.unitCost ?? new Decimal(0);
          medicineCost = medicineCost.add(unitCost.mul(take));

          remaining -= take;
        }
      }

      const consultationFee = doctor.consultationFee ?? new Decimal(0);
      // Tax applied to (medicine_cost + consultation_fee) as per PRD §12.
      const taxBase = medicineCost.add(consultationFee);
      const tax = taxBase.mul(this.taxRatePercent).div(100).toDecimalPlaces(2);
      const totalCost = taxBase.add(tax);

      const patientCase = await tx.patientCase.create({
        data: {
          doctorId,
          patientName: dto.patientName,
          symptoms: dto.symptoms ?? [],
          diseases: dto.diseases ?? [],
          remarks: dto.remarks,
          consultationFee,
          medicineCost,
          tax,
          totalCost,
          medicines: {
            create: dto.medicines.map((m) => ({
              medicineId: m.medicineId,
              dose: m.dose,
              days: m.days,
              frequency: m.frequency,
              whenToTake: m.whenToTake,
              dispensedQty: m.dispensedQty,
            })),
          },
        },
        include: { medicines: { include: { medicine: true } } },
      });

      await tx.auditLog.create({
        data: {
          actorId: doctorId,
          actorType: 'USER',
          action: 'MEDICINE_DISPENSED',
          resourceId: patientCase.id,
          resourceType: 'PatientCase',
          metadata: { hospitalId, medicineCount: dto.medicines.length },
        },
      });

      return patientCase;
    });
  }

  listCases(doctorId: string, period?: PeriodFilter) {
    const where: Record<string, unknown> = { doctorId };
    if (period) {
      where.createdAt = { gte: periodStart(period) };
    }

    return this.prisma.patientCase.findMany({
      where,
      include: { medicines: { include: { medicine: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCase(id: string, doctorId: string) {
    const patientCase = await this.prisma.patientCase.findUnique({
      where: { id },
      include: { medicines: { include: { medicine: true } } },
    });
    if (!patientCase || patientCase.doctorId !== doctorId) {
      throw new NotFoundException('Patient case not found');
    }
    return patientCase;
  }
}
