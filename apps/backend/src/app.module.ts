import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { GeographyModule } from './geography/geography.module';
import { MedicinesModule } from './medicines/medicines.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';
import { PharmacyOrdersModule } from './pharmacy-orders/pharmacy-orders.module';
import { PatientCasesModule } from './patient-cases/patient-cases.module';
import { DefaultRxModule } from './default-rx/default-rx.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ProfileModule } from './profile/profile.module';
import { RolesModule } from './roles/roles.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
      },
    }),

    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),

    ScheduleModule.forRoot(),

    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.get<string>('REDIS_URL') },
      }),
    }),

    PrismaModule,
    AuthModule,
    GeographyModule,
    MedicinesModule,
    InventoryModule,
    OrdersModule,
    PharmacyOrdersModule,
    PatientCasesModule,
    DefaultRxModule,
    DashboardModule,
    ProfileModule,
    RolesModule,
    NotificationsModule,
  ],
})
export class AppModule {}
