import { IsString, IsArray, ValidateNested, IsIn, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'SENIOR_DOCTOR' })
  @IsString()
  name: string;
}

export class PermissionDto {
  @ApiProperty({ example: 'PATIENT_CASES_MANAGEMENT' })
  @IsString()
  module: string;

  @ApiProperty({ enum: ['READ', 'CREATE', 'UPDATE', 'DELETE'] })
  @IsIn(['READ', 'CREATE', 'UPDATE', 'DELETE'])
  action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE';
}

export class UpdateRolePermissionsDto {
  @ApiProperty({ type: [PermissionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(0)
  @Type(() => PermissionDto)
  permissions: PermissionDto[];
}
