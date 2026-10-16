import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  ClaimStatus,
  ItemStatus,
  ItemType,
  NotificationType,
} from '../../domain/enums';

@Injectable()
export class ScheduledJobsService {
  private readonly logger = new Logger(ScheduledJobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * SLA Escalation Job (FR-21, INT-11).
   * Finds claims in PENDING status beyond thresholdHours (default: 48h)
   * and emits idempotent escalation notifications to campus staff.
   */
  async escalatePendingClaims(thresholdHours: number = 48): Promise<number> {
    const cutoff = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);
    const datePeriodKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const pendingClaims = await this.prisma.claim.findMany({
      where: {
        status: ClaimStatus.PENDING,
        createdAt: {
          lte: cutoff,
        },
      },
      include: {
        item: true,
      },
    });

    let escalatedCount = 0;

    for (const claim of pendingClaims) {
      // Find staff in claim's campus
      const campusStaff = await this.prisma.user.findMany({
        where: {
          campusId: claim.item.campusId,
          role: 'ADMIN',
        },
      });

      for (const staff of campusStaff) {
        // INT-11: Deterministic key (jobType, targetId, period)
        const eventKey = `SLA_ESCALATION:${claim.id}:${staff.id}:${datePeriodKey}`;

        await this.notificationsService.notify({
          userId: staff.id,
          type: NotificationType.NEW_CLAIM,
          message: `SLA ESCALATION: Claim for '${claim.item.itemName}' (${claim.item.caseId}) has been pending for over ${thresholdHours}h.`,
          eventKey,
        });
      }

      escalatedCount++;
    }

    this.logger.log(`Escalated ${escalatedCount} overdue pending claims`);
    return escalatedCount;
  }

  /**
   * Unclaimed Reminders & Retention Job (FR-27, INT-11).
   * Finds stale FOUND items:
   * - At reminderDays (e.g. 300 days): emits staff reminder.
   * - At retentionDays (default: 365 days): flags as candidate for UNCLAIMED terminal path.
   */
  async processUnclaimedItems(
    retentionDays: number = 365,
    reminderDays: number = 300,
  ): Promise<{ remindersSent: number; retentionFlagged: number }> {
    const retentionCutoff = new Date(
      Date.now() - retentionDays * 24 * 60 * 60 * 1000,
    );
    const reminderCutoff = new Date(
      Date.now() - reminderDays * 24 * 60 * 60 * 1000,
    );
    const periodKey = new Date().toISOString().slice(0, 7); // YYYY-MM

    const foundItems = await this.prisma.item.findMany({
      where: {
        type: ItemType.FOUND,
        status: ItemStatus.FOUND,
        createdAt: {
          lte: reminderCutoff,
        },
      },
    });

    let remindersSent = 0;
    let retentionFlagged = 0;

    for (const item of foundItems) {
      const staffList = await this.prisma.user.findMany({
        where: {
          campusId: item.campusId,
          role: 'ADMIN',
        },
      });

      const isPastRetention = item.createdAt <= retentionCutoff;

      for (const staff of staffList) {
        if (isPastRetention) {
          const eventKey = `UNCLAIMED_RETENTION:${item.id}:${staff.id}:${periodKey}`;
          await this.notificationsService.notify({
            userId: staff.id,
            type: NotificationType.READY_FOR_COLLECTION,
            message: `RETENTION LIMIT: Found item '${item.itemName}' (${item.caseId}) has exceeded ${retentionDays} days. Eligible for UNCLAIMED disposition.`,
            eventKey,
          });
        } else {
          const eventKey = `UNCLAIMED_REMINDER:${item.id}:${staff.id}:${periodKey}`;
          await this.notificationsService.notify({
            userId: staff.id,
            type: NotificationType.READY_FOR_COLLECTION,
            message: `UNCLAIMED REMINDER: Found item '${item.itemName}' (${item.caseId}) has been in storage for over ${reminderDays} days.`,
            eventKey,
          });
        }
      }

      if (isPastRetention) {
        retentionFlagged++;
      } else {
        remindersSent++;
      }
    }

    this.logger.log(
      `Processed unclaimed items: ${remindersSent} reminders, ${retentionFlagged} retention flagged`,
    );
    return { remindersSent, retentionFlagged };
  }

  /**
   * Notification Digest Job (FR-31, INT-11).
   * Batches notifications for users who enabled digest mode.
   */
  async processNotificationDigest(
    periodKey: string = new Date().toISOString().slice(0, 10),
  ): Promise<number> {
    const digestUsers = await this.prisma.notificationPreference.findMany({
      where: { digestEnabled: true },
    });

    let digestsCreated = 0;

    for (const pref of digestUsers) {
      const unreadNotifications = await this.prisma.notification.findMany({
        where: {
          userId: pref.userId,
          readAt: null,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      if (unreadNotifications.length > 0) {
        const eventKey = `DIGEST:${pref.userId}:${periodKey}`;
        await this.notificationsService.notify({
          userId: pref.userId,
          type: NotificationType.POSSIBLE_MATCH,
          message: `Daily CIRS Digest: You have ${unreadNotifications.length} unread CIRS notification(s). Check your portal feed for updates.`,
          eventKey,
        });
        digestsCreated++;
      }
    }

    this.logger.log(`Generated ${digestsCreated} notification digests`);
    return digestsCreated;
  }
}
