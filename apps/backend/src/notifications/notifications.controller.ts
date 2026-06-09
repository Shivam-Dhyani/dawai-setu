import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

// Notifications are scoped to the requesting actor — no module-level permission
// check needed beyond authentication; every authenticated user can read their own.
@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  listNotifications(@CurrentUser() user: { id: string; pharmacyId?: string }) {
    const recipientId = user.pharmacyId ?? user.id;
    const recipientType = user.pharmacyId ? 'PHARMACY' : 'USER';
    return this.notifications.listNotifications(recipientId, recipientType as 'USER' | 'PHARMACY');
  }

  @Patch(':id/read')
  markRead(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; pharmacyId?: string },
  ) {
    const recipientId = user.pharmacyId ?? user.id;
    const recipientType = user.pharmacyId ? 'PHARMACY' : 'USER';
    return this.notifications.markRead(id, recipientId, recipientType as 'USER' | 'PHARMACY');
  }
}
