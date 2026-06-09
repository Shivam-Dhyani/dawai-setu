import {
  Injectable, BadRequestException, UnauthorizedException, ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { HospitalSignUpDto, PharmacySignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { VerifyOtpDto } from './dto/otp.dto';
import { ForgetPasswordDto, ResetPasswordDto } from './dto/password.dto';

const BCRYPT_ROUNDS = 10;
const OTP_TTL_MINUTES = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ── Hospital sign-up ───────────────────────────────────────────────────────

  async hospitalSignUp(dto: HospitalSignUpDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    if (dto.role === 'DOCTOR' && (!dto.specializations || dto.specializations.length === 0)) {
      throw new BadRequestException('Doctors must provide at least one specialization');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const role = await this.prisma.role.findUnique({ where: { name: dto.role } });
    if (!role) throw new BadRequestException('Invalid role');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        roleId: role.id,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        passwordHash,
        phone: dto.phone,
        state: dto.state,
        city: dto.city,
        address: dto.address,
        pincode: dto.pincode,
        specializations: dto.specializations
          ? { create: dto.specializations.map((name) => ({ name })) }
          : undefined,
      },
      include: { specializations: true, role: true },
    });

    await this.generateAndSendOtp(dto.email, 'EMAIL_VERIFICATION');

    return { message: 'Registration successful. Check your email for the OTP.' };
  }

  // ── Pharmacy sign-up ───────────────────────────────────────────────────────

  async pharmacySignUp(dto: PharmacySignUpDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const existing = await this.prisma.pharmacy.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    await this.prisma.pharmacy.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        phone: dto.phone,
        state: dto.state,
        city: dto.city,
        address: dto.address,
        pincode: dto.pincode,
        licenseNo: dto.licenseNo,
      },
    });

    await this.generateAndSendOtp(dto.email, 'EMAIL_VERIFICATION');

    return { message: 'Registration successful. Check your email for the OTP.' };
  }

  // ── Email verification ─────────────────────────────────────────────────────

  async verifyEmail(dto: VerifyOtpDto) {
    await this.consumeOtp(dto.email, dto.code, 'EMAIL_VERIFICATION');

    // Mark whichever account type this email belongs to as verified
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (user) {
      await this.prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
    } else {
      await this.prisma.pharmacy.update({
        where: { email: dto.email },
        data: { emailVerified: true },
      });
    }

    return { message: 'Email verified successfully' };
  }

  // ── Sign-in (hospital users) ───────────────────────────────────────────────

  async hospitalSignIn(dto: SignInDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    const token = this.jwt.sign({
      sub: user.id,
      roleId: user.roleId,
      hospitalId: user.hospitalId,
    });

    return {
      accessToken: token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roleId: user.roleId,
        roleName: user.role!.name as 'DOCTOR' | 'PHARMACIST',
      },
    };
  }

  // ── Sign-in (pharmacy) ─────────────────────────────────────────────────────

  async pharmacySignIn(dto: SignInDto) {
    const pharmacy = await this.prisma.pharmacy.findUnique({ where: { email: dto.email } });

    if (!pharmacy || !(await bcrypt.compare(dto.password, pharmacy.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!pharmacy.emailVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    // Pharmacy sessions use pharmacyId instead of sub so PermissionsGuard
    // can distinguish the actor type
    const pharmacyRole = await this.prisma.role.findUnique({ where: { name: 'PHARMACY' } });
    const token = this.jwt.sign({ pharmacyId: pharmacy.id, roleId: pharmacyRole!.id });

    return { accessToken: token, pharmacy: this.sanitizePharmacy(pharmacy) };
  }

  // ── Forgot password ────────────────────────────────────────────────────────

  async sendForgotPasswordOtp(email: string) {
    const userExists =
      (await this.prisma.user.count({ where: { email } })) > 0 ||
      (await this.prisma.pharmacy.count({ where: { email } })) > 0;

    // Always return the same message to avoid user enumeration
    if (userExists) await this.generateAndSendOtp(email, 'FORGOT_PASSWORD');

    return { message: 'If that email exists, a reset OTP has been sent' };
  }

  async forgotPassword(dto: ForgetPasswordDto) {
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    await this.consumeOtp(dto.email, dto.code, 'FORGOT_PASSWORD');

    const hash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (user) {
      await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
    } else {
      await this.prisma.pharmacy.update({
        where: { email: dto.email },
        data: { passwordHash: hash },
      });
    }

    return { message: 'Password reset successfully' };
  }

  // ── Reset password (authenticated) ────────────────────────────────────────

  async resetPassword(userId: string, dto: ResetPasswordDto, isPharmacy = false) {
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const currentHash = isPharmacy
      ? (await this.prisma.pharmacy.findUniqueOrThrow({ where: { id: userId } })).passwordHash
      : (await this.prisma.user.findUniqueOrThrow({ where: { id: userId } })).passwordHash;

    if (!(await bcrypt.compare(dto.currentPassword, currentHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    if (isPharmacy) {
      await this.prisma.pharmacy.update({ where: { id: userId }, data: { passwordHash: newHash } });
    } else {
      await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
    }

    return { message: 'Password updated successfully' };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async generateAndSendOtp(email: string, purpose: 'EMAIL_VERIFICATION' | 'FORGOT_PASSWORD') {
    // Invalidate any existing un-used OTP for this email+purpose
    await this.prisma.otp.updateMany({
      where: { email, purpose, usedAt: null },
      data: { usedAt: new Date() },
    });

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);

    await this.prisma.otp.create({ data: { email, code, purpose, expiresAt } });

    // TODO: wire to nodemailer via OtpService/MailService
    console.warn(`[OTP] ${email}: ${code} (${purpose})`);
  }

  private async consumeOtp(
    email: string,
    code: string,
    purpose: 'EMAIL_VERIFICATION' | 'FORGOT_PASSWORD',
  ) {
    const otp = await this.prisma.otp.findFirst({
      where: { email, code, purpose, usedAt: null, expiresAt: { gt: new Date() } },
    });

    if (!otp) throw new BadRequestException('Invalid or expired OTP');

    await this.prisma.otp.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
  }

  private sanitizeUser(user: { id: string; firstName: string; lastName: string; email: string; roleId: string }) {
    return { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, roleId: user.roleId };
  }

  private sanitizePharmacy(pharmacy: { id: string; name: string; email: string }) {
    return { id: pharmacy.id, name: pharmacy.name, email: pharmacy.email };
  }
}
