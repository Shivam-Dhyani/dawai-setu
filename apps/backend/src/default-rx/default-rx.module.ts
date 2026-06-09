import { Module } from '@nestjs/common';
import { DefaultRxService } from './default-rx.service';
import { DefaultRxController } from './default-rx.controller';

@Module({
  providers: [DefaultRxService],
  controllers: [DefaultRxController],
})
export class DefaultRxModule {}
