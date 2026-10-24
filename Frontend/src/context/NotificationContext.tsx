import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Notification } from '../types/notification';
import { notificationsService } from '../services/notificationsService';
import { useAuth } from './AuthContext';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const STORAGE_KEY = 'cirs_read_notification_ids';

const getStoredReadIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return new Set(JSON.parse(raw));
    }
  } catch (e) {
    console.warn('Failed to parse stored read notifications:', e);
  }
  return new Set();
};

const saveStoredReadIds = (ids: Set<string>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch (e) {
    console.warn('Failed to save read notifications to localStorage:', e);
  }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await notificationsService.getNotifications();
      const readIds = getStoredReadIds();
      const now = new Date().toISOString();

      // Merge backend notifications with locally persisted read states
      const merged = (data || []).map((n) => {
        if (readIds.has(n.id)) {
          return { ...n, readAt: n.readAt || now };
        }
        return n;
      });

      setNotifications(merged);
    } catch (err) {
      console.warn('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated, fetchNotifications]);

  const markAsRead = async (id: string) => {
    const readTimestamp = new Date().toISOString();

    // 1. Update localStorage cache so it permanently stays marked as read
    const readIds = getStoredReadIds();
    readIds.add(id);
    saveStoredReadIds(readIds);

    // 2. Instant optimistic state update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: n.readAt || readTimestamp } : n)),
    );

    // 3. Sync to backend API
    try {
      await notificationsService.markAsRead(id);
    } catch (err) {
      console.warn('Backend markAsRead sync status:', err);
    }
  };

  const markAllAsRead = async () => {
    const readTimestamp = new Date().toISOString();

    // 1. Persist all notification IDs to localStorage
    const readIds = getStoredReadIds();
    notifications.forEach((n) => readIds.add(n.id));
    saveStoredReadIds(readIds);

    // 2. Instant optimistic state update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt || readTimestamp })),
    );

    // 3. Sync to backend API
    try {
      await notificationsService.markAllAsRead();
    } catch (err) {
      console.warn('Backend markAllAsRead sync status:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
