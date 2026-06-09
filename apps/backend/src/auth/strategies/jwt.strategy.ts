import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;       // user id
  roleId: string;
  hospitalId?: string;
  pharmacyId?: string; // set for pharmacy sessions
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.pharmacyId) {
      const pharmacy = await this.prisma.pharmacy.findUnique({
        where: { id: payload.pharmacyId },
      });
      if (!pharmacy || pharmacy.status === 'INACTIVE') throw new UnauthorizedException();
      return { id: pharmacy.id, pharmacyId: pharmacy.id, roleId: payload.roleId };
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status === 'INACTIVE') throw new UnauthorizedException();
    return user;
  }
}
