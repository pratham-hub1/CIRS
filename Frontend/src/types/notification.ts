import { Channel, NotificationType } from './enums';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  channel: Channel;
  eventKey?: string | null;
  readAt?: string | null;
  createdAt: string;
}
