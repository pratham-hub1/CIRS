import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancyService: TenancyService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        campusId: true,
        departmentId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        campus: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.departmentId) {
      await this.tenancyService.validateDepartment(user.campusId, dto.departmentId);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        departmentId: dto.departmentId !== undefined ? dto.departmentId : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        campusId: true,
        departmentId: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  async getNotificationPreferences(userId: string) {
    const prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      // Create defaults
      return this.prisma.notificationPreference.create({
        data: {
          userId,
          emailEnabled: true,
          digestEnabled: false,
        },
      });
    }

    return prefs;
  }

  async updateNotificationPreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        emailEnabled: dto.emailEnabled ?? true,
        digestEnabled: dto.digestEnabled ?? false,
      },
      update: {
        emailEnabled: dto.emailEnabled !== undefined ? dto.emailEnabled : undefined,
        digestEnabled: dto.digestEnabled !== undefined ? dto.digestEnabled : undefined,
      },
    });
  }
}
