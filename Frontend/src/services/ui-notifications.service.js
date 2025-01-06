// ui-notifications.service.js
import { toast } from "sonner";

export const uiNotifications = {
  success: (message, description) => {
    toast.success(message, {
      description,
      duration: 4000,
    });
  },

  error: (message, description) => {
    toast.error(message, {
      description,
      duration: 5000,
    });
  },

  loading: (promise, messages) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    });
  },

  showPendingNotifications: async () => {
    try {
      const response = await chrome.storage.local.get("pending_notifications");
      const notifications = response.pending_notifications || [];
      const unreadNotifications = notifications.filter((n) => !n.read);

      unreadNotifications.forEach((notification) => {
        toast.error(notification.message, {
          description: notification.description,
          duration: 0,
        });
      });

      // Marcar como leídas
      if (unreadNotifications.length > 0) {
        const updatedNotifications = notifications.map((n) => ({
          ...n,
          read: true,
        }));
        await chrome.storage.local.set({
          pending_notifications: updatedNotifications,
        });
        await chrome.action.setBadgeText({ text: "" });
      }
    } catch (error) {
      console.error("Error showing pending notifications:", error);
    }
  },
};
