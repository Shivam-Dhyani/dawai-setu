import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSION_KEY, RequiredPermission } from '../decorators/require-permission.decorator';

// Enforces data-driven RBAC (PRD §6): queries role_permissions at request time.
// No hardcoded role-name comparisons — permissions come exclusively from DB rows.
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<RequiredPermission | undefined>(
      PERMISSION_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    if (!required) return true;

    const user = ctx.switchToHttp().getRequest().user;
    if (!user?.roleId) return false;

    const permission = await this.prisma.rolePermission.findFirst({
      where: { roleId: user.roleId, module: required.module, action: required.action },
    });

    if (!permission) {
      throw new ForbiddenException(
        `Missing permission: ${required.module}:${required.action}`,
      );
    }

    return true;
  }
}
