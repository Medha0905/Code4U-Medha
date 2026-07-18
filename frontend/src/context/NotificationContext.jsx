import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';
import * as notificationsApi from '../services/notifications';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;
    notificationsApi.listNotifications().then(setNotifications).catch(() => {});

    const socket = getSocket();
    const handler = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      toast(notification.message, { icon: '🔔' });
    };
    socket.on('notification:new', handler);
    return () => socket.off('notification:new', handler);
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markRead = async (id) => {
    await notificationsApi.markRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
