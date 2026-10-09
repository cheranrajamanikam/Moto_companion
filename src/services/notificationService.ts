import type { Notification, NotificationType } from "@/types/rider";
import { MOCK_NOTIFICATIONS } from "@/data/mockData";

let notificationsStore: Notification[] = [...MOCK_NOTIFICATIONS];

export const notificationService = {
  getNotifications(userId: string): Notification[] {
    return notificationsStore.filter((n) => n.userId === userId);
  },

  getUnreadCount(userId: string): number {
    return notificationsStore.filter((n) => n.userId === userId && !n.read).length;
  },

  markNotificationRead(notificationId: string): void {
    const notif = notificationsStore.find((n) => n.notificationId === notificationId);
    if (notif) {
      notif.read = true;
    }
  },

  markAllAsRead(userId: string): void {
    notificationsStore.forEach((n) => {
      if (n.userId === userId) {
        n.read = true;
      }
    });
  },

  addNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedId?: string;
  }): Notification {
    const newNotif: Notification = {
      notificationId: `notif-${Date.now()}`,
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      relatedId: data.relatedId,
      read: false,
      createdAt: new Date().toISOString(),
    };
    notificationsStore.unshift(newNotif);
    return newNotif;
  },
};
