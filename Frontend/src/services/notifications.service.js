// notifications.service.js
const NOTIFICATION_STORAGE_KEY = "pending_notifications";

// Funciones auxiliares privadas
async function _getPendingNotifications() {
  try {
    const result = await chrome.storage.local.get(NOTIFICATION_STORAGE_KEY);
    return result[NOTIFICATION_STORAGE_KEY] || [];
  } catch (error) {
    console.error("Error getting notifications:", error);
    return [];
  }
}

async function _updateBadge(notificationsList) {
  try {
    const unreadCount = notificationsList.filter((n) => !n.read).length;

    if (unreadCount > 0) {
      await chrome.action.setBadgeBackgroundColor({ color: "#DC2626" });
      await chrome.action.setBadgeText({ text: unreadCount.toString() });
    } else {
      await chrome.action.setBadgeText({ text: "" });
    }
  } catch (error) {
    console.error("Error updating badge:", error);
  }
}

export const notifications = {
  addBlockedUrlNotification: async (url) => {
    try {
      const currentNotifications = await _getPendingNotifications();

      const newNotification = {
        id: Date.now(),
        url,
        timestamp: new Date().toISOString(),
        message: "URL maliciosa detectada y bloqueada",
        description: `Se ha bloqueado el acceso a: ${new URL(url).hostname}`,
        read: false,
        type: "blocked_url",
      };

      const updatedNotifications = [...currentNotifications, newNotification];

      await chrome.storage.local.set({
        [NOTIFICATION_STORAGE_KEY]: updatedNotifications,
      });

      await _updateBadge(updatedNotifications);

      try {
        chrome.runtime
          .sendMessage({
            action: "new_notification",
            notification: newNotification,
          })
          .catch(() => {});
      } catch (error) {}

      return newNotification;
    } catch (error) {
      console.error("Error adding blocked URL notification:", error);
      throw error;
    }
  },

  getPendingNotifications: async () => {
    return await _getPendingNotifications();
  },

  markNotificationsAsRead: async () => {
    try {
      const currentNotifications = await _getPendingNotifications();
      const updatedNotifications = currentNotifications.map((notif) => ({
        ...notif,
        read: true,
      }));

      await chrome.storage.local.set({
        [NOTIFICATION_STORAGE_KEY]: updatedNotifications,
      });

      await _updateBadge([]);

      return updatedNotifications;
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      throw error;
    }
  },

  addNotification: async (message, description, type = "info") => {
    try {
      const currentNotifications = await _getPendingNotifications();

      const newNotification = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        message,
        description,
        read: false,
        type,
      };

      const updatedNotifications = [...currentNotifications, newNotification];

      await chrome.storage.local.set({
        [NOTIFICATION_STORAGE_KEY]: updatedNotifications,
      });

      await _updateBadge(updatedNotifications);

      try {
        chrome.runtime
          .sendMessage({
            action: "new_notification",
            notification: newNotification,
          })
          .catch(() => {});
      } catch (error) {}

      return newNotification;
    } catch (error) {
      console.error("Error adding notification:", error);
      throw error;
    }
  },
};
