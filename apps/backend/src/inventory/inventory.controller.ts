import { Controller, Get, Put, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MODULE, ACTION } from '../common/constants/permissions';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @RequirePermission(MODULE.TRACK_INVENTORY, ACTION.READ)
  @Get()
  listBatches(@CurrentUser() user: { hospitalId?: string }) {
    return this.inventory.listBatches(user.hospitalId ?? '');
  }

  @RequirePermission(MODULE.GOODS_RECEIVED, ACTION.UPDATE)
  @Put('batch/:id/ready')
  markReady(
    @Param('id') id: string,
    @CurrentUser() user: { hospitalId?: string },
  ) {
    return this.inventory.markReady(id, user.hospitalId ?? '');
  }

  @RequirePermission(MODULE.NEAR_EXPIRY, ACTION.READ)
  @Get('near-expiry')
  listNearExpiry(@CurrentUser() user: { hospitalId?: string }) {
    return this.inventory.listNearExpiry(user.hospitalId ?? '');
  }

  @RequirePermission(MODULE.EXPIRED, ACTION.READ)
  @Get('expired')
  listExpired(@CurrentUser() user: { hospitalId?: string }) {
    return this.inventory.listExpired(user.hospitalId ?? '');
  }
}
