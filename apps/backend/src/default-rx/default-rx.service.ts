import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertDefaultRxDto } from './dto/upsert-default-rx.dto';

@Injectable()
export class DefaultRxService {
  constructor(private readonly prisma: PrismaService) {}

  // All saved default Rx entries for this doctor.
  listDefaults(doctorId: string) {
    return this.prisma.defaultRx.findMany({
      where: { doctorId },
      include: { medicine: true },
      orderBy: { medicine: { name: 'asc' } },
    });
  }

  // Single medicine default — 404 if not yet configured.
  async getDefault(doctorId: string, medicineId: string) {
    const entry = await this.prisma.defaultRx.findUnique({
      where: { doctorId_medicineId: { doctorId, medicineId } },
      include: { medicine: true },
    });
    if (!entry) throw new NotFoundException('Default Rx not found for this medicine');
    return entry;
  }

  // Upsert — creates or replaces the default for this doctor+medicine pair (PRD §10.11).
  upsertDefault(doctorId: string, medicineId: string, dto: UpsertDefaultRxDto) {
    return this.prisma.defaultRx.upsert({
      where: { doctorId_medicineId: { doctorId, medicineId } },
      create: { doctorId, medicineId, ...dto },
      update: { ...dto },
      include: { medicine: true },
    });
  }
}
