import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MODULE, ACTION } from '../common/constants/permissions';

type Period = 'day' | 'week' | 'month' | 'quarter' | 'year';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  // Returns role-appropriate metrics. The service branches on actor type:
  //   pharmacyId present → pharmacy operator dashboard
  //   hospitalId + PATIENT_CASES permission → doctor (checked by PermissionsGuard)
  //   hospitalId + no PATIENT_CASES → pharmacist
  //
  // A single endpoint keeps the frontend integration simple; the backend decides
  // which aggregation to run based on the JWT claims.
  @RequirePermission(MODULE.DASHBOARD, ACTION.READ)
  @Get()
  async getDashboard(
    @Query('period') period: Period = 'month',
    @CurrentUser() user: { id: string; hospitalId?: string; pharmacyId?: string; roleId: string },
  ) {
    if (user.pharmacyId) {
      return this.dashboard.pharmacyDashboard(user.pharmacyId, period);
    }

    // Distinguish doctor vs pharmacist by checking for a PATIENT_CASES permission.
    // This avoids hardcoding role names — consistent with the data-driven RBAC rule.
    const hasDoctorPermission = await this.dashboard.hasPermission(
      user.roleId,
      'PATIENT_CASES_MANAGEMENT',
      'READ',
    );

    if (hasDoctorPermission) {
      return this.dashboard.doctorDashboard(user.id, period);
    }

    return this.dashboard.pharmacistDashboard(user.hospitalId ?? '', period);
  }
}
