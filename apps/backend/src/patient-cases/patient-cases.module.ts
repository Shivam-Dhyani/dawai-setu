import { Module } from '@nestjs/common';
import { PatientCasesService } from './patient-cases.service';
import { PatientCasesController } from './patient-cases.controller';

@Module({
  providers: [PatientCasesService],
  controllers: [PatientCasesController],
})
export class PatientCasesModule {}
