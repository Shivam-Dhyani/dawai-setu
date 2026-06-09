import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type RecipientType = 'USER' | 'PHARMACY';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // List notifications for the current actor, newest first.
  listNotifications(recipientId: string, recipientType: RecipientType) {
    return this.prisma.notification.findMany({
      where: { recipientId, recipientType },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Mark a single notification as read. Guards against reading another user's notification.
  async markRead(id: string, recipientId: string, recipientType: RecipientType) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    if (
      notification.recipientId !== recipientId ||
      notification.recipientType !== recipientType
    ) {
      throw new ForbiddenException('Not your notification');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }
}
