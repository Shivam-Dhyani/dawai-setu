import {
  IsString, IsOptional, IsArray, IsInt, IsPositive,
  IsEnum, ValidateNested, ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Enums mirror the Prisma schema — kept local to avoid tight schema coupling in DTOs.
enum DoseFrequency {
  ONCE_A_DAY = 'ONCE_A_DAY',
  TWICE_A_DAY = 'TWICE_A_DAY',
  THRICE_A_DAY = 'THRICE_A_DAY',
  ONCE_IN_3_DAYS = 'ONCE_IN_3_DAYS',
  ONCE_IN_4_DAYS = 'ONCE_IN_4_DAYS',
  ONCE_A_WEEK = 'ONCE_A_WEEK',
}

enum WhenToTake {
  BEFORE_BREAKFAST = 'BEFORE_BREAKFAST',
  AFTER_BREAKFAST = 'AFTER_BREAKFAST',
  BEFORE_LUNCH = 'BEFORE_LUNCH',
  AFTER_LUNCH = 'AFTER_LUNCH',
  BEFORE_DINNER = 'BEFORE_DINNER',
  AFTER_DINNER = 'AFTER_DINNER',
}

export class CaseMedicineDto {
  @ApiProperty() @IsString() medicineId: string;
  @ApiProperty() @IsString() dose: string;

  @ApiProperty() @IsInt() @IsPositive() days: number;

  @ApiProperty({ enum: DoseFrequency })
  @IsEnum(DoseFrequency)
  frequency: DoseFrequency;

  @ApiPropertyOptional({ enum: WhenToTake })
  @IsOptional()
  @IsEnum(WhenToTake)
  whenToTake?: WhenToTake;

  @ApiProperty() @IsInt() @IsPositive() dispensedQty: number;
}

export class CreatePatientCaseDto {
  @ApiProperty() @IsString() patientName: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  symptoms?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  diseases?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({ type: [CaseMedicineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CaseMedicineDto)
  medicines: CaseMedicineDto[];
}
