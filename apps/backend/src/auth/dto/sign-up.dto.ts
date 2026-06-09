import {
  IsEmail, IsString, IsOptional, MinLength, IsArray,
  ArrayMinSize, IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HospitalSignUpDto {
  @ApiProperty({ example: 'DOCTOR', enum: ['DOCTOR', 'PHARMACIST'] })
  @IsIn(['DOCTOR', 'PHARMACIST'])
  role: 'DOCTOR' | 'PHARMACIST';

  @ApiProperty() @IsString() firstName: string;
  @ApiProperty() @IsString() lastName: string;
  @ApiProperty() @IsEmail() email: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  specializations?: string[];

  @ApiProperty() @IsString() state: string;
  @ApiProperty() @IsString() city: string;
  @ApiProperty() @IsString() address: string;
  @ApiProperty() @IsString() pincode: string;
  @ApiProperty() @IsString() phone: string;
  @ApiProperty() @IsString() @MinLength(8) password: string;
  @ApiProperty() @IsString() confirmPassword: string;
}

export class PharmacySignUpDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() phone: string;
  @ApiProperty() @IsString() state: string;
  @ApiProperty() @IsString() city: string;
  @ApiProperty() @IsString() address: string;
  @ApiProperty() @IsString() pincode: string;
  @ApiPropertyOptional() @IsOptional() @IsString() licenseNo?: string;
  @ApiProperty() @IsString() @MinLength(8) password: string;
  @ApiProperty() @IsString() confirmPassword: string;
}
