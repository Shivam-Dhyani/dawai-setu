import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PharmacyOrdersService } from './pharmacy-orders.service';
import { RejectSubOrderDto } from './dto/resolve-sub-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MODULE, ACTION } from '../common/constants/permissions';

// Pharmacy-side view of sub-orders — used by pharmacy operators.
// The PHARMACY_ORDERS module maps to the seed rows for the PHARMACY role.
// We reuse REQUEST_STOCK constants here because the permission module name for
// pharmacy-side order management is stored as 'REQUEST_MEDICINE_STOCK' in seed data
// for the pharmacy role. If a separate module key is seeded, swap the constant.
@ApiTags('pharmacy-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('pharmacy-orders')
export class PharmacyOrdersController {
  constructor(private readonly pharmacyOrders: PharmacyOrdersService) {}

  @RequirePermission(MODULE.REQUEST_STOCK, ACTION.READ)
  @Get()
  listSubOrders(@CurrentUser() user: { pharmacyId?: string }) {
    return this.pharmacyOrders.listSubOrders(user.pharmacyId ?? '');
  }

  @RequirePermission(MODULE.REQUEST_STOCK, ACTION.READ)
  @Get(':id')
  getSubOrder(
    @Param('id') id: string,
    @CurrentUser() user: { pharmacyId?: string },
  ) {
    return this.pharmacyOrders.getSubOrder(id, user.pharmacyId ?? '');
  }

  @RequirePermission(MODULE.REQUEST_STOCK, ACTION.UPDATE)
  @Post(':id/accept')
  acceptSubOrder(
    @Param('id') id: string,
    @CurrentUser() user: { pharmacyId?: string },
  ) {
    return this.pharmacyOrders.acceptSubOrder(id, user.pharmacyId ?? '');
  }

  @RequirePermission(MODULE.REQUEST_STOCK, ACTION.UPDATE)
  @Post(':id/reject')
  rejectSubOrder(
    @Param('id') id: string,
    @Body() dto: RejectSubOrderDto,
    @CurrentUser() user: { pharmacyId?: string },
  ) {
    return this.pharmacyOrders.rejectSubOrder(id, user.pharmacyId ?? '', dto);
  }
}
