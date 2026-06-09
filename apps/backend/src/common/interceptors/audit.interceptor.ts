import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

export const AUDIT_ACTION_KEY = 'audit_action';

export const AuditAction = (action: string, resourceType: string) =>
  // Attach metadata that this interceptor picks up to write an AuditLog row.
  (target: object, key: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(AUDIT_ACTION_KEY, { action, resourceType }, descriptor.value as object);
    return descriptor;
  };

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.get<{ action: string; resourceType: string } | undefined>(
      AUDIT_ACTION_KEY,
      ctx.getHandler(),
    );

    if (!meta) return next.handle();

    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return next.handle().pipe(
      tap(async (result: { id?: string } | undefined) => {
        if (!user || !result?.id) return;
        await this.prisma.auditLog.create({
          data: {
            actorId: user.id,
            actorType: user.pharmacyId ? 'PHARMACY' : 'USER',
            action: meta.action,
            resourceId: result.id,
            resourceType: meta.resourceType,
          },
        });
      }),
    );
  }
}
