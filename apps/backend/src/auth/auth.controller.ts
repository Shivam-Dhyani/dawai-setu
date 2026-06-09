import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { HospitalSignUpDto, PharmacySignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SendOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { ForgetPasswordDto, ResetPasswordDto } from './dto/password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('hospital/sign-up')
  hospitalSignUp(@Body() dto: HospitalSignUpDto) {
    return this.auth.hospitalSignUp(dto);
  }

  @Post('pharmacy/sign-up')
  pharmacySignUp(@Body() dto: PharmacySignUpDto) {
    return this.auth.pharmacySignUp(dto);
  }

  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyEmail(dto);
  }

  @Post('hospital/sign-in')
  hospitalSignIn(@Body() dto: SignInDto) {
    return this.auth.hospitalSignIn(dto);
  }

  @Post('pharmacy/sign-in')
  pharmacySignIn(@Body() dto: SignInDto) {
    return this.auth.pharmacySignIn(dto);
  }

  @Post('send-otp')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.auth.sendForgotPasswordOtp(dto.email);
  }

  @Post('forget-password')
  forgetPassword(@Body() dto: ForgetPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('reset-password')
  resetPassword(
    @CurrentUser() user: { id: string; pharmacyId?: string },
    @Body() dto: ResetPasswordDto,
  ) {
    return this.auth.resetPassword(user.id, dto, !!user.pharmacyId);
  }
}
