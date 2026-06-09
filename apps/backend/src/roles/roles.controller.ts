import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRolePermissionsDto } from './dto/role.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { MODULE, ACTION } from '../common/constants/permissions';

// Role-management APIs exist for future admin use (PRD §6.2). They are guarded
// by AUTH READ/CREATE/UPDATE — in practice only a future admin role will hold
// those permissions for this module. No portal UI consumes these endpoints today.
@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @RequirePermission(MODULE.AUTH, ACTION.READ)
  @Get()
  listRoles() {
    return this.roles.listRoles();
  }

  @RequirePermission(MODULE.AUTH, ACTION.CREATE)
  @Post()
  createRole(@Body() dto: CreateRoleDto) {
    return this.roles.createRole(dto);
  }

  @RequirePermission(MODULE.AUTH, ACTION.READ)
  @Get(':id/permissions')
  listPermissions(@Param('id') id: string) {
    return this.roles.listPermissions(id);
  }

  @RequirePermission(MODULE.AUTH, ACTION.UPDATE)
  @Put(':id/permissions')
  updatePermissions(
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return this.roles.updatePermissions(id, dto);
  }
}
