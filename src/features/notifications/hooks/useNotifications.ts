import { useCallback, useEffect, useState } from 'react';
import {
  subscribeNotifications,
  markAsRead as repositoryMarkAsRead,
  markAllAsRead as repositoryMarkAllAsRead,
} from '../../../data/notificationsRepository';
import type { WithId, NotificationRecord } from '../../../data/types';
import { useAssociateId } from './useAssociateId';

export interface UseNotifications {
  /** `null` while the first snapshot hasn't arrived yet (and while signed out). */
  notifications: WithId<NotificationRecord>[] | null;
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

/**
 * Live inbox data shared by the Home header bell (9.4) and the inbox screen
 * (9.2/9.3) — one Firestore listener per mounted consumer, both reading
 * through `notificationsRepository` per contract rule 3. Carries no
 * side-effecting "mark as read on view" behavior of its own; the screen
 * decides when to call `markAllAsRead`.
 */
export function useNotifications(): UseNotifications {
  const associateId = useAssociateId();
  const [notifications, setNotifications] = useState<WithId<NotificationRecord>[] | null>(null);

  useEffect(() => {
    if (!associateId) {
      setNotifications(null);
      return;
    }
    setNotifications(null);
    return subscribeNotifications(associateId, setNotifications);
  }, [associateId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await repositoryMarkAsRead(notificationId);
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!associateId) return;
    await repositoryMarkAllAsRead(associateId);
  }, [associateId]);

  const unreadCount = notifications?.filter((n) => n.read_at === null).length ?? 0;

  return {
    notifications,
    unreadCount,
    isLoading: associateId !== null && notifications === null,
    markAsRead,
    markAllAsRead,
  };
}
