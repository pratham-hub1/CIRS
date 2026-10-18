import { MatchStatus } from './enums';
import { Item } from './item';

export interface Match {
  id: string;
  lostItemId: string;
  foundItemId: string;
  score: number; // 0 to 1.0 (where 1.0 is exact serial/match)
  status: MatchStatus;
  createdAt: string;
  lostItem?: Item;
  foundItem?: Item;
}
