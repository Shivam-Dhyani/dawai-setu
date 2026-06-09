import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  // Fetches the profile for whichever actor type the JWT belongs to.
  async getProfile(actorId: string, isPharmacy: boolean) {
    if (isPharmacy) {
      return this.prisma.pharmacy.findUniqueOrThrow({
        where: { id: actorId },
        select: {
          id: true, name: true, email: true, phone: true,
          state: true, city: true, address: true, pincode: true,
          licenseNo: true, status: true, emailVerified: true, createdAt: true,
        },
      });
    }

    return this.prisma.user.findUniqueOrThrow({
      where: { id: actorId },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        state: true, city: true, address: true, pincode: true,
        status: true, emailVerified: true, consultationFee: true,
        defaultNeededQty: true, createdAt: true,
        role: { select: { name: true } },
        specializations: { select: { name: true } },
        hospital: { select: { id: true, name: true } },
      },
    });
  }

  // Updates whichever profile type matches the JWT.
  async updateProfile(actorId: string, dto: UpdateProfileDto, isPharmacy: boolean) {
    if (isPharmacy) {
      return this.prisma.pharmacy.update({
        where: { id: actorId },
        data: {
          address: dto.address,
          phone: dto.phone,
          pincode: dto.pincode,
          state: dto.state,
          city: dto.city,
          status: dto.status,
        },
        select: {
          id: true, name: true, email: true, phone: true,
          state: true, city: true, address: true, pincode: true,
          status: true,
        },
      });
    }

    return this.prisma.user.update({
      where: { id: actorId },
      data: {
        address: dto.address,
        phone: dto.phone,
        pincode: dto.pincode,
        state: dto.state,
        city: dto.city,
        status: dto.status,
        // consultationFee and defaultNeededQty are role-specific fields —
        // the DB accepts them for any user, but only the relevant role will
        // surface them in UI; no guard needed here since both are harmless if set.
        consultationFee: dto.consultationFee !== undefined ? dto.consultationFee : undefined,
        defaultNeededQty: dto.defaultNeededQty,
      },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        state: true, city: true, address: true, pincode: true,
        status: true, consultationFee: true, defaultNeededQty: true,
      },
    });
  }
}
