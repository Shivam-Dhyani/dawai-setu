import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Rejection can carry an optional reason shown to the hospital pharmacist.
export class RejectSubOrderDto {
  @ApiPropertyOptional({ example: 'Insufficient stock after audit' })
  @IsOptional()
  @IsString()
  reason?: string;
}
