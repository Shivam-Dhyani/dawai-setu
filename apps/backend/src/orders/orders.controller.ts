import {
  Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { PlaceOrderDto } from './dto/place-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MODULE, ACTION } from '../common/constants/permissions';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @RequirePermission(MODULE.REQUEST_STOCK, ACTION.READ)
  @Get('available-pharmacies')
  findAvailablePharmacies(
    @Query('medicineId') medicineId: string,
    @Query('qty', ParseIntPipe) qty: number,
    @CurrentUser() user: { hospitalId?: string },
  ) {
    return this.orders.findAvailablePharmacies(medicineId, qty, user.hospitalId ?? '');
  }

  @RequirePermission(MODULE.REQUEST_STOCK, ACTION.CREATE)
  @Post()
  placeOrder(
    @Body() dto: PlaceOrderDto,
    @CurrentUser() user: { id: string; hospitalId?: string },
  ) {
    return this.orders.placeOrder(dto, user.hospitalId ?? '', user.id);
  }

  @RequirePermission(MODULE.REQUEST_STOCK, ACTION.READ)
  @Get()
  listOrders(@CurrentUser() user: { hospitalId?: string }) {
    return this.orders.listOrders(user.hospitalId ?? '');
  }

  @RequirePermission(MODULE.REQUEST_STOCK, ACTION.READ)
  @Get(':id')
  getOrder(
    @Param('id') id: string,
    @CurrentUser() user: { hospitalId?: string },
  ) {
    return this.orders.getOrder(id, user.hospitalId ?? '');
  }

  @RequirePermission(MODULE.REQUEST_STOCK, ACTION.UPDATE)
  @Post(':id/cancel')
  cancelOrder(
    @Param('id') id: string,
    @CurrentUser() user: { hospitalId?: string },
  ) {
    return this.orders.cancelOrder(id, user.hospitalId ?? '');
  }
}
