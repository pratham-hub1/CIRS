import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ItemStatus, Role } from '../../domain/enums';
import {
  PublicItemDto,
  serializePublicItem,
} from '../../common/serializers/public-item.serializer';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancyService: TenancyService,
  ) {}

  /**
   * FR-12, INT-5: Community feed with strict allowlist serialization.
   * Excludes archived and closed cases.
   */
  async getCommunityFeed(
    user: AuthUser,
    query: SearchQueryDto,
  ): Promise<{ data: PublicItemDto[]; nextCursor?: string }> {
    const limit = Math.min(query.limit || 20, 100);

    const where: any = {
      campusId: user.campusId,
      status: {
        in: [
          ItemStatus.LOST_REPORTED,
          ItemStatus.FOUND,
          ItemStatus.READY_FOR_COLLECTION,
        ],
      },
      archivedAt: null,
    };

    if (query.category) where.category = query.category;
    if (query.type) where.type = query.type;

    const items = await this.prisma.item.findMany({
      where,
      include: {
        images: true,
        storageLocation: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
    });

    let nextCursor: string | undefined = undefined;
    if (items.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem?.id;
    }

    const data = items.map((item) =>
      serializePublicItem({
        ...item,
        images: item.images.map((img) => img.url),
      }),
    );

    return { data, nextCursor };
  }

  /**
   * FR-10, FR-11: Search and multi-filter combining AND queries server-side.
   */
  async searchItems(
    user: AuthUser,
    query: SearchQueryDto,
  ): Promise<{ data: PublicItemDto[]; nextCursor?: string }> {
    const limit = Math.min(query.limit || 20, 100);

    const where: any = {
      campusId: user.campusId,
    };

    // Public users cannot search archived cases unless staff
    if (user.role !== Role.ADMIN) {
      where.status = query.status
        ? query.status
        : {
            in: [
              ItemStatus.LOST_REPORTED,
              ItemStatus.FOUND,
              ItemStatus.READY_FOR_COLLECTION,
            ],
          };
      where.archivedAt = null;
    } else if (query.status) {
      where.status = query.status;
    }

    if (query.category) where.category = query.category;
    if (query.type) where.type = query.type;

    // Free text keyword search (FR-10)
    if (query.q && query.q.trim() !== '') {
      const term = query.q.trim();
      where.OR = [
        { itemName: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { brand: { contains: term, mode: 'insensitive' } },
        { colour: { contains: term, mode: 'insensitive' } },
        { identifyingMarks: { contains: term, mode: 'insensitive' } },
      ];
    }

    // Location filter (FR-11)
    if (query.location && query.location.trim() !== '') {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { lastKnownLocation: { contains: query.location.trim(), mode: 'insensitive' } },
          { foundLocation: { contains: query.location.trim(), mode: 'insensitive' } },
        ],
      });
    }

    // Date range filter (FR-11)
    if (query.startDate || query.endDate) {
      where.AND = where.AND || [];
      const dateFilter: any = {};
      if (query.startDate) dateFilter.gte = new Date(query.startDate);
      if (query.endDate) dateFilter.lte = new Date(query.endDate);

      where.AND.push({
        OR: [{ dateLost: dateFilter }, { dateFound: dateFilter }],
      });
    }

    const items = await this.prisma.item.findMany({
      where,
      include: {
        images: true,
        storageLocation: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
    });

    let nextCursor: string | undefined = undefined;
    if (items.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem?.id;
    }

    const data = items.map((item) =>
      serializePublicItem({
        ...item,
        images: item.images.map((img) => img.url),
      }),
    );

    return { data, nextCursor };
  }

  /**
   * FR-13: Create a saved search / watch alert.
   */
  async createSavedSearch(user: AuthUser, dto: CreateSavedSearchDto) {
    return this.prisma.savedSearch.create({
      data: {
        userId: user.id,
        name: dto.name.trim(),
        criteria: dto.criteria,
        active: true,
      },
    });
  }

  /**
   * FR-13: List active saved searches.
   */
  async getSavedSearches(user: AuthUser) {
    return this.prisma.savedSearch.findMany({
      where: {
        userId: user.id,
        active: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * FR-13: Remove a saved search / watch.
   */
  async deleteSavedSearch(user: AuthUser, id: string) {
    const watch = await this.prisma.savedSearch.findUnique({
      where: { id },
    });

    if (!watch) {
      throw new NotFoundException(`Saved search with ID '${id}' not found`);
    }

    if (watch.userId !== user.id) {
      throw new ForbiddenException('You can only delete your own saved searches');
    }

    await this.prisma.savedSearch.delete({
      where: { id },
    });

    return { message: 'Watch removed successfully' };
  }
}
