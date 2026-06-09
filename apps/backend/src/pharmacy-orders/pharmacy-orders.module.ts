import { Module } from '@nestjs/common';
import { PharmacyOrdersService } from './pharmacy-orders.service';
import { PharmacyOrdersController } from './pharmacy-orders.controller';

@Module({
  providers: [PharmacyOrdersService],
  controllers: [PharmacyOrdersController],
})
export class PharmacyOrdersModule {}
