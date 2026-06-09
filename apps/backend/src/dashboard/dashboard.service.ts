import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Period = 'day' | 'week' | 'month' | 'quarter' | 'year';

function periodStart(period: Period): Date {
  const now = new Date();
  switch (period) {
    case 'day':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay());
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'quarter': {
      const q = Math.floor(now.getMonth() / 3);
      return new Date(now.getFullYear(), q * 3, 1);
    }
    case 'year':
      return new Date(now.getFullYear(), 0, 1);
  }
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // Doctor dashboard (PRD §10.3): total patients and prescriptions in period.
  async doctorDashboard(doctorId: string, period: Period) {
    const since = periodStart(period);

    const [totalCases, totalMedicinesDispensed] = await Promise.all([
      this.prisma.patientCase.count({
        where: { doctorId, createdAt: { gte: since } },
      }),
      this.prisma.patientCaseMedicine.count({
        where: { case: { doctorId, createdAt: { gte: since } } },
      }),
    ]);

    return {
      period,
      totalPatients: totalCases,
      totalPrescriptions: totalMedicinesDispensed,
    };
  }

  // Pharmacist dashboard (PRD §11.3): inventory and order stats for this hospital.
  async pharmacistDashboard(hospitalId: string, period: Period) {
    const since = periodStart(period);
    const now = new Date();
    const nearExpiryThreshold = new Date(now);
    nearExpiryThreshold.setMonth(nearExpiryThreshold.getMonth() + 3);

    const [
      totalMedicineBatches,
      totalExpiredBatches,
      totalNearExpiryBatches,
      ordersPlaced,
      ordersPending,
      ordersCompleted,
    ] = await Promise.all([
      this.prisma.hospitalInventoryBatch.count({ where: { hospitalId } }),
      this.prisma.hospitalInventoryBatch.count({
        where: { hospitalId, expiryDate: { lt: now } },
      }),
      this.prisma.hospitalInventoryBatch.count({
        where: {
          hospitalId,
          readinessState: 'READY_TO_USE',
          expiryDate: { gt: now, lte: nearExpiryThreshold },
        },
      }),
      this.prisma.order.count({
        where: { hospitalId, createdAt: { gte: since } },
      }),
      this.prisma.order.count({
        where: { hospitalId, status: 'PENDING', createdAt: { gte: since } },
      }),
      this.prisma.order.count({
        where: { hospitalId, status: 'COMPLETED', createdAt: { gte: since } },
      }),
    ]);

    return {
      period,
      totalMedicineBatches,
      totalExpiredBatches,
      totalNearExpiryBatches,
      ordersPlaced,
      ordersPending,
      ordersCompleted,
    };
  }

  // Helper used by the controller to distinguish doctor vs pharmacist without
  // hardcoding role names — consistent with PRD §6's data-driven RBAC rule.
  async hasPermission(roleId: string, module: string, action: string): Promise<boolean> {
    const row = await this.prisma.rolePermission.findFirst({
      where: { roleId, module, action },
    });
    return !!row;
  }

  // Pharmacy dashboard (PRD §11.3 pharmacy side): incoming orders + stock health.
  async pharmacyDashboard(pharmacyId: string, period: Period) {
    const since = periodStart(period);
    const now = new Date();
    const nearExpiryThreshold = new Date(now);
    nearExpiryThreshold.setMonth(nearExpiryThreshold.getMonth() + 3);

    const [
      totalMedicineBatches,
      totalNearExpiryBatches,
      totalExpiredBatches,
      totalOrders,
      pendingOrders,
      acceptedOrders,
    ] = await Promise.all([
      this.prisma.pharmacyInventoryBatch.count({ where: { pharmacyId } }),
      this.prisma.pharmacyInventoryBatch.count({
        where: {
          pharmacyId,
          expiryDate: { gt: now, lte: nearExpiryThreshold },
          quantity: { gt: 0 },
        },
      }),
      this.prisma.pharmacyInventoryBatch.count({
        where: { pharmacyId, expiryDate: { lt: now } },
      }),
      this.prisma.subOrder.count({
        where: { pharmacyId, createdAt: { gte: since } },
      }),
      this.prisma.subOrder.count({
        where: { pharmacyId, status: 'PENDING', createdAt: { gte: since } },
      }),
      this.prisma.subOrder.count({
        where: { pharmacyId, status: 'ACCEPTED', createdAt: { gte: since } },
      }),
    ]);

    return {
      period,
      totalMedicineBatches,
      totalNearExpiryBatches,
      totalExpiredBatches,
      totalOrders,
      pendingOrders,
      acceptedOrders,
    };
  }
}
