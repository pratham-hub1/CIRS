import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { NotificationType } from '../src/domain/enums';

describe('NotificationsService (Phase 4: WF-5, FR-29..31)', () => {
  let service: NotificationsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      notificationPreference: {
        findUnique: jest.fn(),
      },
      notification: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('WF-5: Notification Idempotency', () => {
    it('creates notification with unique eventKey', async () => {
      prisma.notificationPreference.findUnique.mockResolvedValue({ emailEnabled: true });
      prisma.notification.findUnique.mockResolvedValue(null);
      prisma.notification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        eventKey: 'EVENT:1',
      });

      const res = await service.notify({
        userId: 'user-1',
        type: NotificationType.REPORT_SUBMITTED,
        message: 'Report created',
        eventKey: 'EVENT:1',
      });

      expect(res!.id).toBe('notif-1');
      expect(prisma.notification.create).toHaveBeenCalled();
    });

    it('WF-5: skips duplicate creation when notification with same eventKey exists', async () => {
      prisma.notificationPreference.findUnique.mockResolvedValue({ emailEnabled: true });
      const existingNotif = {
        id: 'notif-existing',
        userId: 'user-1',
        eventKey: 'EVENT:DUPLICATE',
      };
      prisma.notification.findUnique.mockResolvedValue(existingNotif);

      const res = await service.notify({
        userId: 'user-1',
        type: NotificationType.POSSIBLE_MATCH,
        message: 'Match found',
        eventKey: 'EVENT:DUPLICATE',
      });

      expect(res!.id).toBe('notif-existing');
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('Read Status Management', () => {
    it('marks single notification as read', async () => {
      prisma.notification.findUnique.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
      });
      prisma.notification.update.mockResolvedValue({
        id: 'notif-1',
        readAt: new Date(),
      });

      const res = await service.markAsRead('user-1', 'notif-1');
      expect(res.readAt).toBeDefined();
    });

    it('marks all unread notifications as read', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 5 });
      const res = await service.markAllAsRead('user-1');
      expect(res.count).toBe(5);
    });
  });
});
