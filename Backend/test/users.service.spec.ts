import { NotFoundException } from '@nestjs/common';
import { UsersService } from '../src/modules/users/users.service';

describe('UsersService (Phase 1)', () => {
  let service: UsersService;
  let prisma: any;
  let tenancyService: any;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      notificationPreference: {
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
      },
    };

    tenancyService = {
      validateDepartment: jest.fn(),
    };

    service = new UsersService(prisma, tenancyService);
  });

  it('retrieves user profile', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      name: 'John Doe',
      email: 'john@gsfcuniversity.ac.in',
    });

    const profile = await service.getProfile('user-1');
    expect(profile.id).toBe('user-1');
    expect(profile.name).toBe('John Doe');
  });

  it('throws NotFoundException when profile is not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.getProfile('user-missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updates user profile', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      campusId: 'campus-1',
    });
    prisma.user.update.mockResolvedValue({
      id: 'user-1',
      name: 'Jane Doe',
    });

    const updated = await service.updateProfile('user-1', { name: 'Jane Doe' });
    expect(updated.name).toBe('Jane Doe');
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('retrieves or initializes notification preferences', async () => {
    prisma.notificationPreference.findUnique.mockResolvedValue(null);
    prisma.notificationPreference.create.mockResolvedValue({
      userId: 'user-1',
      emailEnabled: true,
      digestEnabled: false,
    });

    const prefs = await service.getNotificationPreferences('user-1');
    expect(prefs.emailEnabled).toBe(true);
    expect(prisma.notificationPreference.create).toHaveBeenCalled();
  });
});
