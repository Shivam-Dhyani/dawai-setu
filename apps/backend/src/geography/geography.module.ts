import { Module } from '@nestjs/common';
import { GeographyService } from './geography.service';
import { GeographyController } from './geography.controller';

@Module({
  providers: [GeographyService],
  controllers: [GeographyController],
})
export class GeographyModule {}
