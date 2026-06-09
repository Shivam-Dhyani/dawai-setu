import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DefaultRxService } from './default-rx.service';
import { UpsertDefaultRxDto } from './dto/upsert-default-rx.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MODULE, ACTION } from '../common/constants/permissions';

@ApiTags('default-rx')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('default-rx')
export class DefaultRxController {
  constructor(private readonly defaultRx: DefaultRxService) {}

  @RequirePermission(MODULE.DEFAULT_RX, ACTION.READ)
  @Get()
  listDefaults(@CurrentUser() user: { id: string }) {
    return this.defaultRx.listDefaults(user.id);
  }

  @RequirePermission(MODULE.DEFAULT_RX, ACTION.READ)
  @Get(':medicineId')
  getDefault(
    @Param('medicineId') medicineId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.defaultRx.getDefault(user.id, medicineId);
  }

  @RequirePermission(MODULE.DEFAULT_RX, ACTION.UPDATE)
  @Put(':medicineId')
  upsertDefault(
    @Param('medicineId') medicineId: string,
    @Body() dto: UpsertDefaultRxDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.defaultRx.upsertDefault(user.id, medicineId, dto);
  }
}
