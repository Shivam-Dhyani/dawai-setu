import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MedicinesService } from './medicines.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MODULE, ACTION } from '../common/constants/permissions';

@ApiTags('medicines')
@ApiBearerAuth()
@Controller('medicines')
export class MedicinesController {
  constructor(private readonly medicines: MedicinesService) {}

  // Doctors and pharmacists both need the master list (default-rx picker, order cart).
  // The PATIENT_CASES READ permission covers doctor usage; pharmacists reach it via
  // REQUEST_STOCK READ. We expose it without a permission guard so both roles can
  // access it — authentication alone is sufficient for master data.
  @UseGuards(JwtAuthGuard)
  @Get()
  listAll() {
    return this.medicines.listAll();
  }

  // Ready-to-use, non-expired hospital inventory — restricted to doctors (PRD §10.4).
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission(MODULE.PATIENT_CASES, ACTION.READ)
  @Get('available')
  listAvailable(@CurrentUser() user: { hospitalId?: string }) {
    return this.medicines.listAvailable(user.hospitalId ?? '');
  }
}
