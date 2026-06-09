import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PatientCasesService } from './patient-cases.service';
import { CreatePatientCaseDto } from './dto/create-patient-case.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MODULE, ACTION } from '../common/constants/permissions';

@ApiTags('patient-cases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('patient-cases')
export class PatientCasesController {
  constructor(private readonly patientCases: PatientCasesService) {}

  @RequirePermission(MODULE.PATIENT_CASES, ACTION.CREATE)
  @Post()
  createCase(
    @Body() dto: CreatePatientCaseDto,
    @CurrentUser() user: { id: string; hospitalId?: string },
  ) {
    return this.patientCases.createCase(dto, user.id, user.hospitalId ?? '');
  }

  @RequirePermission(MODULE.PATIENT_CASES, ACTION.READ)
  @Get()
  listCases(
    @Query('period') period: 'day' | 'week' | 'month' | 'year' | undefined,
    @CurrentUser() user: { id: string },
  ) {
    return this.patientCases.listCases(user.id, period);
  }

  @RequirePermission(MODULE.PATIENT_CASES, ACTION.READ)
  @Get(':id')
  getCase(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.patientCases.getCase(id, user.id);
  }
}
