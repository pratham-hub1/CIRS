import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MatchScorer, ScorableItem } from './scorer/match-scorer';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { MatchStatus, NotificationType, ItemType } from '../../domain/enums';

export const MATCH_THRESHOLD = 0.4;

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancyService: TenancyService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * FR-14, WF-3, INT-2: Trigger matching for a newly created or updated item.
   */
  async runMatchingForItem(targetItem: {
    id: string;
    caseId: string;
    type: ItemType;
    campusId: string;
    reporterId: string;
    category: any;
    itemName: string;
    description: string;
    colour: string;
    brand: string;
    identifyingMarks: string;
    serialNumber?: string | null;
    dateLost?: Date | null;
    dateFound?: Date | null;
    lastKnownLocation?: string | null;
    foundLocation?: string | null;
  }) {
    const oppositeType =
      targetItem.type === ItemType.LOST ? ItemType.FOUND : ItemType.LOST;

    // Prefilter candidate set bounded by campus and opposite type (WF-3)
    const candidates = await this.prisma.item.findMany({
      where: {
        campusId: targetItem.campusId,
        type: oppositeType,
        archivedAt: null,
      },
      take: 200, // Bounded candidate set (WF-3 d)
    });

    const matchesCreated = [];

    for (const candidate of candidates) {
      const score = MatchScorer.computeScore(targetItem, candidate);

      if (score >= MATCH_THRESHOLD) {
        const lostItem =
          targetItem.type === ItemType.LOST ? targetItem : candidate;
        const foundItem =
          targetItem.type === ItemType.FOUND ? targetItem : candidate;

        // INV-DM-9: UNIQUE(lostItemId, foundItemId) with upsert (WF-3 f)
        const match = await this.prisma.match.upsert({
          where: {
            lostItemId_foundItemId: {
              lostItemId: lostItem.id,
              foundItemId: foundItem.id,
            },
          },
          create: {
            lostItemId: lostItem.id,
            foundItemId: foundItem.id,
            score,
            status: MatchStatus.SUGGESTED,
          },
          update: {
            score,
          },
        });

        matchesCreated.push(match);

        // INT-2: Notify both sides with idempotent keys (WF-5)
        const lostReporterKey = `POSSIBLE_MATCH:${lostItem.id}:${foundItem.id}:${lostItem.reporterId}`;
        const foundReporterKey = `POSSIBLE_MATCH:${lostItem.id}:${foundItem.id}:${foundItem.reporterId}`;

        await this.notificationsService.notify({
          userId: lostItem.reporterId,
          type: NotificationType.POSSIBLE_MATCH,
          message: `Possible match found for your lost item '${lostItem.itemName}' with a found item '${foundItem.itemName}' (Match Score: ${(score * 100).toFixed(0)}%)`,
          eventKey: lostReporterKey,
        });

        await this.notificationsService.notify({
          userId: foundItem.reporterId,
          type: NotificationType.POSSIBLE_MATCH,
          message: `Possible match found for your found report '${foundItem.itemName}' with a reported lost item '${lostItem.itemName}' (Match Score: ${(score * 100).toFixed(0)}%)`,
          eventKey: foundReporterKey,
        });
      }
    }

    // INT-12: Evaluate active saved searches in same campus
    await this.evaluateSavedSearches(targetItem);

    return matchesCreated;
  }

  /**
   * INT-12: Saved-search alert correctness.
   * An alert fires iff a newly created item matches an active saved search.
   */
  async evaluateSavedSearches(item: {
    id: string;
    caseId: string;
    campusId: string;
    itemName: string;
    category: any;
  }) {
    const activeSearches = await this.prisma.savedSearch.findMany({
      where: {
        active: true,
        user: { campusId: item.campusId },
      },
    });

    for (const search of activeSearches) {
      const criteria = (search.criteria as Record<string, any>) || {};
      let matches = true;

      if (criteria.category && criteria.category !== item.category) {
        matches = false;
      }

      if (criteria.q && typeof criteria.q === 'string') {
        const query = criteria.q.toLowerCase().trim();
        if (!item.itemName.toLowerCase().includes(query)) {
          matches = false;
        }
      }

      if (matches) {
        const alertKey = `SAVED_SEARCH:${search.id}:${item.id}`;
        await this.notificationsService.notify({
          userId: search.userId,
          type: NotificationType.POSSIBLE_MATCH,
          message: `A new item '${item.itemName}' matching your saved watch '${search.name}' has been reported.`,
          eventKey: alertKey,
        });
      }
    }
  }

  /**
   * Candidate matches for a given case.
   */
  async getMatchesForCase(user: AuthUser, caseId: string) {
    const item = await this.prisma.item.findUnique({
      where: { caseId },
    });

    if (!item) {
      throw new NotFoundException(`Case with ID '${caseId}' not found`);
    }

    this.tenancyService.assertCampusAccess(user.campusId, item.campusId);

    return this.prisma.match.findMany({
      where: {
        OR: [{ lostItemId: item.id }, { foundItemId: item.id }],
      },
      include: {
        lostItem: {
          select: {
            caseId: true,
            itemName: true,
            category: true,
            status: true,
          },
        },
        foundItem: {
          select: {
            caseId: true,
            itemName: true,
            category: true,
            status: true,
          },
        },
      },
      orderBy: { score: 'desc' },
    });
  }

  /**
   * Staff confirms a match.
   */
  async confirmMatch(adminUser: AuthUser, matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID '${matchId}' not found`);
    }

    return this.prisma.match.update({
      where: { id: matchId },
      data: {
        status: MatchStatus.CONFIRMED,
      },
    });
  }

  /**
   * Staff dismisses a match.
   */
  async dismissMatch(adminUser: AuthUser, matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID '${matchId}' not found`);
    }

    return this.prisma.match.update({
      where: { id: matchId },
      data: {
        status: MatchStatus.DISMISSED,
      },
    });
  }
}
