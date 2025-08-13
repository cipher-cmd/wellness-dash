import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconX,
  IconCheck,
  IconAlertTriangle,
  IconInbox,
} from '@tabler/icons-react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationSystemProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

const notificationTypes = {
  success: {
    icon: IconCheck,
    bgColor: 'bg-green-500',
    textColor: 'text-green-500',
  },
  error: {
    icon: IconAlertTriangle,
    bgColor: 'bg-red-500',
    textColor: 'text-red-500',
  },
  warning: {
    icon: IconAlertTriangle,
    bgColor: 'bg-yellow-500',
    textColor: 'text-yellow-500',
  },
  info: { icon: IconInbox, bgColor: 'bg-blue-500', textColor: 'text-blue-500' },
};

export default function NotificationSystem({
  notifications,
  onRemove,
}: NotificationSystemProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={onRemove}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

function NotificationItem({ notification, onRemove }: NotificationItemProps) {
  const IconComponent = notificationTypes[notification.type].icon;
  const bgColor = notificationTypes[notification.type].bgColor;
  const textColor = notificationTypes[notification.type].textColor;

  useEffect(() => {
    if (notification.duration) {
      const timer = setTimeout(() => {
        setTimeout(() => onRemove(notification.id), 300);
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification.duration, notification.id, onRemove]);

  const handleRemove = () => {
    setTimeout(() => onRemove(notification.id), 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-w-sm w-full"
    >
      <div className="flex items-start gap-3">
        <div className={`${bgColor} p-2 rounded-lg flex-shrink-0`}>
          <IconComponent className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 mb-1">
            {notification.title}
          </h4>
          <p className="text-gray-600 text-sm mb-2">{notification.message}</p>

          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className={`text-sm font-medium ${textColor} hover:opacity-80 transition-opacity`}
            >
              {notification.action.label}
            </button>
          )}
        </div>

        <button
          onClick={handleRemove}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
        >
          <IconX className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </motion.div>
  );
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newNotification = { ...notification, id };
      setNotifications((prev) => [...prev, newNotification]);
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
  };
}

// Utility functions for common notifications
export const notificationUtils = {
  success: (title: string, message: string, duration = 5000) => ({
    type: 'success' as const,
    title,
    message,
    duration,
  }),

  error: (title: string, message: string, duration = 7000) => ({
    type: 'error' as const,
    title,
    message,
    duration,
  }),

  warning: (title: string, message: string, duration = 6000) => ({
    type: 'warning' as const,
    title,
    message,
    duration,
  }),

  info: (title: string, message: string, duration = 5000) => ({
    type: 'info' as const,
    title,
    message,
    duration,
  }),
};
