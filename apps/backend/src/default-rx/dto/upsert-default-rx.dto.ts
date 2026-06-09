import { IsOptional, IsString, IsInt, IsPositive, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

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

// All fields optional: a partial update is valid (doctor may set only dose today).
export class UpsertDefaultRxDto {
  @ApiPropertyOptional() @IsOptional() @IsString() dose?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @IsPositive() days?: number;

  @ApiPropertyOptional({ enum: DoseFrequency })
  @IsOptional()
  @IsEnum(DoseFrequency)
  frequency?: DoseFrequency;

  @ApiPropertyOptional({ enum: WhenToTake })
  @IsOptional()
  @IsEnum(WhenToTake)
  whenToTake?: WhenToTake;
}
