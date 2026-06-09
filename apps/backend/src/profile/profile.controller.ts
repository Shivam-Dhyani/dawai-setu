import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MODULE, ACTION } from '../common/constants/permissions';

@ApiTags('profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @RequirePermission(MODULE.PROFILE, ACTION.READ)
  @Get()
  getProfile(@CurrentUser() user: { id: string; pharmacyId?: string }) {
    return this.profile.getProfile(user.pharmacyId ?? user.id, !!user.pharmacyId);
  }

  @RequirePermission(MODULE.PROFILE, ACTION.UPDATE)
  @Patch()
  updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: { id: string; pharmacyId?: string },
  ) {
    return this.profile.updateProfile(user.pharmacyId ?? user.id, dto, !!user.pharmacyId);
  }
}
