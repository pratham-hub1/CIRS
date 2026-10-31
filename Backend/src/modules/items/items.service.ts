import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
  Optional,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ItemStatus, ItemType, Role } from '../../domain/enums';
import { serializePublicItem } from '../../common/serializers/public-item.serializer';
import { MatchingService } from '../matching/matching.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../domain/enums';
import { applyCampusScope } from '../../common/repositories/scoped.repository';

function extractFileId(fileRef: string): string {
  if (!fileRef) return fileRef;
  const match = fileRef.match(/\/files\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return match[1];
  }
  return fileRef.trim();
}

function formatItemImages<T extends { images?: any[] }>(item: T): T {
  if (!item || !item.images) return item;
  return {
    ...item,
    images: item.images.map((img: any) => ({
      ...img,
      fileId: img.fileId,
      url: img.fileId ? `/api/v1/files/${img.fileId}` : (img.url || `/api/v1/files/${img.id}`),
    })),
  };
}

@Injectable()
export class ItemsService {
  private readonly logger = new Logger(ItemsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancyService: TenancyService,
    @Optional() private readonly matchingService?: MatchingService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  /**
   * INV-DM-1: Generate a unique and immutable case ID (e.g. CIRS-2026-000123).
   */
  async generateCaseId(): Promise<string> {
    const year = new Date().getFullYear();
    for (let attempts = 0; attempts < 10; attempts++) {
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const candidate = `CIRS-${year}-${randomSuffix}`;
      const existing = await this.prisma.item.findUnique({
        where: { caseId: candidate },
        select: { id: true },
      });
      if (!existing) {
        return candidate;
      }
    }
    // High-entropy fallback if 10 collisions occur
    return `CIRS-${year}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  /**
   * FR-6, FR-7, INV-DM-6: Report lost or found item.
   */
  async createItem(user: AuthUser, dto: CreateItemDto) {
    // INV-DM-6: Type-specific checks
    if (dto.type === ItemType.LOST) {
      if (!dto.dateLost) {
        throw new BadRequestException('dateLost is required for LOST reports');
      }
      if (dto.storageLocationId) {
        throw new BadRequestException(
          'storageLocationId must not be specified for LOST reports',
        );
      }
    } else if (dto.type === ItemType.FOUND) {
      if (!dto.dateFound) {
        throw new BadRequestException('dateFound is required for FOUND reports');
      }
      if (!dto.storageLocationId) {
        throw new BadRequestException(
          'storageLocationId is required for FOUND reports',
        );
      }

      // Verify storage location belongs to user's campus
      const storageLocation = await this.prisma.storageLocation.findFirst({
        where: {
          id: dto.storageLocationId,
          campusId: user.campusId,
        },
      });

      if (!storageLocation) {
        throw new BadRequestException(
          `Storage location '${dto.storageLocationId}' does not exist in your campus`,
        );
      }
    }

    const caseId = await this.generateCaseId();
    const initialStatus =
      dto.type === ItemType.LOST ? ItemStatus.LOST_REPORTED : ItemStatus.FOUND;

    const item = await this.prisma.item.create({
      data: {
        caseId,
        type: dto.type,
        reporterId: user.id,
        campusId: user.campusId,
        departmentId: user.departmentId || null,
        itemName: dto.itemName.trim(),
        category: dto.category,
        description: dto.description.trim(),
        colour: dto.colour.trim(),
        brand: dto.brand.trim(),
        identifyingMarks: dto.identifyingMarks.trim(),
        serialNumber: dto.serialNumber ? dto.serialNumber.trim() : null,
        status: initialStatus,
        dateLost: dto.dateLost ? new Date(dto.dateLost) : null,
        lastKnownLocation: dto.lastKnownLocation ? dto.lastKnownLocation.trim() : null,
        dateFound: dto.dateFound ? new Date(dto.dateFound) : null,
        foundLocation: dto.foundLocation ? dto.foundLocation.trim() : null,
        storageLocationId: dto.storageLocationId || null,
        images: dto.images && dto.images.length > 0
          ? {
              create: dto.images.map((imgRef, index) => ({
                fileId: extractFileId(imgRef),
                sortOrder: index,
              })),
            }
          : undefined,
      },
      include: {
        images: true,
        storageLocation: true,
      },
    });

    // Record audit log (FR-37, INV-DM-8)
    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'ITEM_REPORTED',
        targetType: 'Item',
        targetId: item.id,
        after: {
          caseId: item.caseId,
          type: item.type,
          status: item.status,
          category: item.category,
        },
      },
    });

    // FR-29: Notify reporter that report was submitted
    if (this.notificationsService) {
      await this.notificationsService.notify({
        userId: user.id,
        type: NotificationType.REPORT_SUBMITTED,
        message: `Your ${item.type.toLowerCase()} report for '${item.itemName}' (Case ID: ${item.caseId}) has been successfully submitted.`,
        eventKey: `REPORT_SUBMITTED:${item.id}`,
      });
    }

    // INT-2: Run auto-matching post-commit (REV-8: surface errors fail-fast, do not swallow)
    if (this.matchingService) {
      await this.matchingService.runMatchingForItem(item);
    }

    return formatItemImages(item);
  }

  /**
   * Search and filter items within the actor's campus (FR-10, FR-11, INT-6).
   */
  async getItems(
    user: AuthUser,
    options: {
      category?: any;
      status?: any;
      type?: any;
      search?: string;
    } = {},
  ) {
    const where: any = applyCampusScope(user.campusId, {});

    if (options.category) where.category = options.category;
    if (options.status) where.status = options.status;
    if (options.type) where.type = options.type;
    if (options.search) {
      where.OR = [
        { itemName: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
        { brand: { contains: options.search, mode: 'insensitive' } },
        { colour: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.item.findMany({
      where,
      include: {
        images: true,
        storageLocation: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return items.map((item) => formatItemImages(item));
  }

  /**
   * FR-28: Fetch my active cases.
   */
  async getMyItems(user: AuthUser) {
    const where = applyCampusScope(user.campusId, {
      reporterId: user.id,
    });

    const items = await this.prisma.item.findMany({
      where,
      include: {
        images: true,
        storageLocation: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => formatItemImages(item));
  }

  /**
   * FR-12, INT-5: Fetch case by caseId with privacy masking if not owner or staff.
   */
  async getItemByCaseId(user: AuthUser, caseId: string) {
    const item = await this.prisma.item.findUnique({
      where: { caseId },
      include: {
        images: true,
        storageLocation: true,
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Case with ID '${caseId}' not found`);
    }

    // Tenancy isolation (INT-6)
    this.tenancyService.assertCampusAccess(user.campusId, item.campusId);

    const isOwner = item.reporterId === user.id;
    const isStaff = user.role === Role.ADMIN;

    if (isOwner || isStaff) {
      return formatItemImages(item);
    }

    // Mask for community access (FR-12, INT-5)
    return serializePublicItem({
      ...item,
      images: (item.images || []).map((img: any) =>
        img.fileId ? `/api/v1/files/${img.fileId}` : (img.url || `/api/v1/files/${img.id}`),
      ),
    });
  }

  /**
   * FR-9: Edit own report within allowed state.
   */
  async editItem(user: AuthUser, caseId: string, dto: UpdateItemDto) {
    const item = await this.prisma.item.findUnique({
      where: { caseId },
      include: {
        claims: {
          where: { status: 'APPROVED' },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Case with ID '${caseId}' not found`);
    }

    // Only owner can edit (FR-9)
    if (item.reporterId !== user.id) {
      throw new ForbiddenException('You can only edit your own report');
    }

    // Tenancy isolation (INT-6)
    this.tenancyService.assertCampusAccess(user.campusId, item.campusId);

    // Edits only allowed in pre-claim states (FR-9)
    const allowedStates: ItemStatus[] = [ItemStatus.LOST_REPORTED, ItemStatus.FOUND];
    if (!allowedStates.includes(item.status) || item.claims.length > 0) {
      throw new BadRequestException(
        `Case cannot be edited while in status '${item.status}' or with approved claims`,
      );
    }

    const updated = await this.prisma.item.update({
      where: { id: item.id },
      data: {
        itemName: dto.itemName !== undefined ? dto.itemName.trim() : undefined,
        category: dto.category !== undefined ? dto.category : undefined,
        description: dto.description !== undefined ? dto.description.trim() : undefined,
        colour: dto.colour !== undefined ? dto.colour.trim() : undefined,
        brand: dto.brand !== undefined ? dto.brand.trim() : undefined,
        identifyingMarks:
          dto.identifyingMarks !== undefined ? dto.identifyingMarks.trim() : undefined,
        serialNumber:
          dto.serialNumber !== undefined ? dto.serialNumber.trim() : undefined,
        lastKnownLocation:
          dto.lastKnownLocation !== undefined
            ? dto.lastKnownLocation.trim()
            : undefined,
        foundLocation:
          dto.foundLocation !== undefined ? dto.foundLocation.trim() : undefined,
      },
      include: {
        images: true,
      },
    });

    // Record audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'ITEM_UPDATED',
        targetType: 'Item',
        targetId: item.id,
        before: {
          itemName: item.itemName,
          category: item.category,
          description: item.description,
        },
        after: {
          itemName: updated.itemName,
          category: updated.category,
          description: updated.description,
        },
      },
    });

    return formatItemImages(updated);
  }

  /**
   * FR-28: Cancel or close own case.
   */
  async cancelItem(user: AuthUser, caseId: string) {
    const item = await this.prisma.item.findUnique({
      where: { caseId },
    });

    if (!item) {
      throw new NotFoundException(`Case with ID '${caseId}' not found`);
    }

    if (item.reporterId !== user.id) {
      throw new ForbiddenException('You can only cancel your own case');
    }

    this.tenancyService.assertCampusAccess(user.campusId, item.campusId);

    // Can only cancel pre-claim active cases
    const allowedStates: ItemStatus[] = [ItemStatus.LOST_REPORTED, ItemStatus.FOUND];
    if (!allowedStates.includes(item.status)) {
      throw new BadRequestException(
        `Cannot cancel case in terminal or advanced status '${item.status}'`,
      );
    }

    const nextStatus = ItemStatus.ARCHIVED;

    const updated = await this.prisma.item.update({
      where: { id: item.id },
      data: {
        status: nextStatus,
        archivedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'ITEM_CANCELLED',
        targetType: 'Item',
        targetId: item.id,
        before: { status: item.status },
        after: { status: updated.status },
      },
    });

    return {
      message: 'Case closed and archived successfully',
      caseId: updated.caseId,
      status: updated.status,
    };
  }

  /**
   * FR-32: Send staff-mediated case message.
   */
  async addCaseMessage(user: AuthUser, caseId: string, body: string) {
    const item = await this.prisma.item.findUnique({
      where: { caseId },
    });

    if (!item) {
      throw new NotFoundException(`Case with ID '${caseId}' not found`);
    }

    this.tenancyService.assertCampusAccess(user.campusId, item.campusId);

    const message = await this.prisma.caseMessage.create({
      data: {
        itemId: item.id,
        senderId: user.id,
        body: body.trim(),
        visibleToStaff: true,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return message;
  }

  /**
   * FR-32: Read staff-mediated case messages.
   */
  async getCaseMessages(user: AuthUser, caseId: string) {
    const item = await this.prisma.item.findUnique({
      where: { caseId },
    });

    if (!item) {
      throw new NotFoundException(`Case with ID '${caseId}' not found`);
    }

    this.tenancyService.assertCampusAccess(user.campusId, item.campusId);

    const isOwner = item.reporterId === user.id;
    const isStaff = user.role === Role.ADMIN;

    if (!isOwner && !isStaff) {
      throw new ForbiddenException(
        'Only the case reporter and security staff can view messages',
      );
    }

    return this.prisma.caseMessage.findMany({
      where: {
        itemId: item.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
