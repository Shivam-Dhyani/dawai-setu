import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GeographyService {
  constructor(private readonly prisma: PrismaService) {}

  listStates() {
    return this.prisma.state.findMany({ orderBy: { name: 'asc' } });
  }

  listCities(stateId: string) {
    return this.prisma.city.findMany({
      where: { stateId },
      orderBy: { name: 'asc' },
    });
  }
}
