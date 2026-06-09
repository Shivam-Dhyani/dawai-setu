import { IsEmail, IsString, Length, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgetPasswordDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @Length(4, 4) code: string;
  @ApiProperty() @IsString() @MinLength(8) newPassword: string;
  @ApiProperty() @IsString() confirmNewPassword: string;
}

export class ResetPasswordDto {
  @ApiProperty() @IsString() currentPassword: string;
  @ApiProperty() @IsString() @MinLength(8) newPassword: string;
  @ApiProperty() @IsString() confirmNewPassword: string;
}
