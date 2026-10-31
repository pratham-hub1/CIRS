import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import {
  ItemCategory,
  ItemStatus,
  ItemType,
  ClaimStatus,
} from '../../domain/enums';
import { CreateStorageLocationDto } from './dto/create-storage-location.dto';
import { UpdateStorageLocationDto } from './dto/update-storage-location.dto';
import { AdminItemsQueryDto } from './dto/admin-items-query.dto';
import { applyCampusScope } from '../../common/repositories/scoped.repository';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancyService: TenancyService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * List all campus cases with administrative filtering and pagination (FR-33).
   */
  async getItems(adminUser: AuthUser, query: AdminItemsQueryDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 50;
    const skip = (page - 1) * limit;

    const where: any = applyCampusScope(adminUser.campusId, {});

    if (query.category) {
      where.category = query.category;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.type) {
      where.type = query.type;
    }
    if (query.storageLocationId) {
      where.storageLocationId = query.storageLocationId;
    }
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { itemName: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { caseId: { contains: term, mode: 'insensitive' } },
        { serialNumber: { contains: term, mode: 'insensitive' } },
      ];
    }
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const [total, items] = await Promise.all([
      this.prisma.item.count({ where }),
      this.prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          storageLocation: true,
          reporter: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          claims: {
            select: {
              id: true,
              status: true,
              claimantId: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items: items.map((item) => ({
        ...item,
        images: item.images
          ? item.images.map((img: any) => ({
              ...img,
              url: img.fileId ? `/api/v1/files/${img.fileId}` : (img.url || `/api/v1/files/${img.id}`),
            }))
          : item.images,
      })),
    };
  }

  /**
   * List all storage locations in the campus (FR-33).
   */
  async getStorageLocations(adminUser: AuthUser) {
    const where = applyCampusScope(adminUser.campusId, {});
    return this.prisma.storageLocation.findMany({
      where,
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Create a new storage location for the campus (FR-33).
   */
  async createStorageLocation(
    adminUser: AuthUser,
    dto: CreateStorageLocationDto,
  ) {
    const existing = await this.prisma.storageLocation.findUnique({
      where: {
        campusId_name: {
          campusId: adminUser.campusId,
          name: dto.name,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Storage location '${dto.name}' already exists in this campus`,
      );
    }

    const created = await this.prisma.storageLocation.create({
      data: {
        campusId: adminUser.campusId,
        name: dto.name,
      },
    });

    await this.auditService.record({
      actorId: adminUser.id,
      action: 'STORAGE_LOCATION_CREATED',
      targetType: 'StorageLocation',
      targetId: created.id,
      after: { name: created.name, campusId: created.campusId },
    });

    return created;
  }

  /**
   * Update an existing storage location (FR-33).
   */
  async updateStorageLocation(
    adminUser: AuthUser,
    id: string,
    dto: UpdateStorageLocationDto,
  ) {
    const location = await this.prisma.storageLocation.findUnique({
      where: { id },
    });

    if (!location) {
      throw new NotFoundException(`Storage location with ID '${id}' not found`);
    }

    this.tenancyService.assertCampusAccess(adminUser.campusId, location.campusId);

    const collision = await this.prisma.storageLocation.findUnique({
      where: {
        campusId_name: {
          campusId: adminUser.campusId,
          name: dto.name,
        },
      },
    });

    if (collision && collision.id !== id) {
      throw new ConflictException(
        `Storage location '${dto.name}' already exists in this campus`,
      );
    }

    const updated = await this.prisma.storageLocation.update({
      where: { id },
      data: {
        name: dto.name,
      },
    });

    await this.auditService.record({
      actorId: adminUser.id,
      action: 'STORAGE_LOCATION_UPDATED',
      targetType: 'StorageLocation',
      targetId: id,
      before: { name: location.name },
      after: { name: updated.name },
    });

    return updated;
  }

  /**
   * Compute analytics directly from source data (FR-34).
   * Recovery rate, category breakdown, status breakdown, hotspots, pending claims.
   */
  async getAnalytics(
    adminUser: AuthUser,
    query?: { startDate?: string; endDate?: string },
  ) {
    const itemWhere: any = {
      campusId: adminUser.campusId,
    };

    if (query?.startDate || query?.endDate) {
      itemWhere.createdAt = {};
      if (query.startDate) {
        itemWhere.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        itemWhere.createdAt.lte = new Date(query.endDate);
      }
    }

    // 1. Item counts by type and status
    const [
      totalReported,
      totalLost,
      totalFound,
      totalReturned,
      totalReadyForCollection,
      totalArchived,
      totalUnclaimed,
    ] = await Promise.all([
      this.prisma.item.count({ where: itemWhere }),
      this.prisma.item.count({ where: { ...itemWhere, type: ItemType.LOST } }),
      this.prisma.item.count({ where: { ...itemWhere, type: ItemType.FOUND } }),
      this.prisma.item.count({
        where: { ...itemWhere, status: ItemStatus.RETURNED },
      }),
      this.prisma.item.count({
        where: { ...itemWhere, status: ItemStatus.READY_FOR_COLLECTION },
      }),
      this.prisma.item.count({
        where: { ...itemWhere, status: ItemStatus.ARCHIVED },
      }),
      this.prisma.item.count({
        where: { ...itemWhere, status: ItemStatus.UNCLAIMED },
      }),
    ]);

    // Recovery rate: (totalReturned / totalFound) * 100
    const recoveryRate =
      totalFound > 0
        ? Number(((totalReturned / totalFound) * 100).toFixed(2))
        : 0;

    // 2. Pending claims on campus items
    const pendingClaims = await this.prisma.claim.count({
      where: {
        status: ClaimStatus.PENDING,
        item: {
          campusId: adminUser.campusId,
        },
      },
    });

    // 3. Active holds (APPROVED claim on READY_FOR_COLLECTION item)
    const activeHolds = await this.prisma.claim.count({
      where: {
        status: ClaimStatus.APPROVED,
        item: {
          campusId: adminUser.campusId,
          status: ItemStatus.READY_FOR_COLLECTION,
        },
      },
    });

    // 4. Category breakdown
    const categoryGroup = await this.prisma.item.groupBy({
      by: ['category'],
      where: itemWhere,
      _count: { _all: true },
    });

    const categoryBreakdown: Record<string, number> = {};
    for (const cat of Object.values(ItemCategory)) {
      categoryBreakdown[cat] = 0;
    }
    for (const group of categoryGroup) {
      categoryBreakdown[group.category] = group._count._all;
    }

    // 5. Status breakdown
    const statusBreakdown: Record<string, number> = {
      [ItemStatus.LOST_REPORTED]: totalLost - totalReturned, // Active lost
      [ItemStatus.FOUND]: totalFound - totalReadyForCollection - totalReturned - totalUnclaimed,
      [ItemStatus.READY_FOR_COLLECTION]: totalReadyForCollection,
      [ItemStatus.RETURNED]: totalReturned,
      [ItemStatus.ARCHIVED]: totalArchived,
      [ItemStatus.UNCLAIMED]: totalUnclaimed,
    };

    // 6. Hotspots (top found and lost locations)
    const foundHotspots = await this.prisma.item.groupBy({
      by: ['foundLocation'],
      where: {
        ...itemWhere,
        type: ItemType.FOUND,
        foundLocation: { not: null },
      },
      _count: { _all: true },
      orderBy: {
        _count: {
          foundLocation: 'desc',
        },
      },
      take: 5,
    });

    const lostHotspots = await this.prisma.item.groupBy({
      by: ['lastKnownLocation'],
      where: {
        ...itemWhere,
        type: ItemType.LOST,
        lastKnownLocation: { not: null },
      },
      _count: { _all: true },
      orderBy: {
        _count: {
          lastKnownLocation: 'desc',
        },
      },
      take: 5,
    });

    return {
      metrics: {
        totalReported,
        totalLost,
        totalFound,
        totalReturned,
        recoveryRate, // in percentage e.g. 75.50
        pendingClaims,
        activeHolds,
      },
      statusBreakdown,
      categoryBreakdown,
      hotspots: {
        found: foundHotspots.map((h) => ({
          location: h.foundLocation,
          count: h._count._all,
        })),
        lost: lostHotspots.map((h) => ({
          location: h.lastKnownLocation,
          count: h._count._all,
        })),
      },
    };
  }
}
