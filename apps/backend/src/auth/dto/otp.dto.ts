import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty() @IsEmail() email: string;
}

export class VerifyOtpDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @Length(4, 4) code: string;
}
