import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Channel, NotificationType } from '../../domain/enums';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * WF-5: Notification idempotency with deterministic eventKey.
   */
  async notify(params: {
    userId: string;
    type: NotificationType;
    message: string;
    eventKey?: string;
    channel?: Channel;
  }) {
    const { userId, type, message, eventKey, channel = Channel.IN_APP } = params;

    // Check user notification preferences (FR-30, FR-31)
    const prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    const isEmailEnabled = prefs ? prefs.emailEnabled : true;

    // If eventKey is provided, ensure idempotency (WF-5)
    if (eventKey) {
      const existing = await this.prisma.notification.findUnique({
        where: { eventKey },
      });
      if (existing) {
        this.logger.debug(
          `WF-5: Idempotent skip: notification with eventKey '${eventKey}' already exists`,
        );
        return existing;
      }
    }

    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type,
          message,
          channel,
          eventKey: eventKey || null,
        },
      });

      // Email channel simulation (FR-30)
      if (isEmailEnabled) {
        this.logger.log(
          `[Email Notification Sent] To User: ${userId} | Type: ${type} | Message: ${message}`,
        );
      }

      return notification;
    } catch (error: any) {
      // If unique constraint collided concurrently, return existing (WF-5)
      if (eventKey && error.code === 'P2002') {
        return this.prisma.notification.findUnique({
          where: { eventKey },
        });
      }
      throw error;
    }
  }

  async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID '${notificationId}' not found`);
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You can only update your own notifications');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }
}
