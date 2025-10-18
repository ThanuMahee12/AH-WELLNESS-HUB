import React, { createContext, useState, useCallback, useContext } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

const NotificationContext = createContext();

/**
 * Notification Provider Component
 * Provides toast notifications throughout the app
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type,
      duration,
    };

    setNotifications((prev) => [...prev, notification]);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, [removeNotification]);

  const success = useCallback(
    (message, duration) => notify(message, 'success', duration),
    [notify]
  );

  const error = useCallback(
    (message, duration) => notify(message, 'danger', duration),
    [notify]
  );

  const warning = useCallback(
    (message, duration) => notify(message, 'warning', duration),
    [notify]
  );

  const info = useCallback(
    (message, duration) => notify(message, 'info', duration),
    [notify]
  );

  const value = {
    notify,
    success,
    error,
    warning,
    info,
    removeNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}

      {/* Toast Container */}
      <ToastContainer
        position="top-end"
        className="p-3"
        style={{ zIndex: 9999 }}
      >
        {notifications.map((notification) => (
          <Toast
            key={notification.id}
            onClose={() => removeNotification(notification.id)}
            show={true}
            delay={notification.duration}
            autohide={notification.duration > 0}
            bg={notification.type}
          >
            <Toast.Header>
              <strong className="me-auto">
                {notification.type === 'success' && '✓ Success'}
                {notification.type === 'danger' && '✗ Error'}
                {notification.type === 'warning' && '⚠ Warning'}
                {notification.type === 'info' && 'ℹ Info'}
              </strong>
            </Toast.Header>
            <Toast.Body
              className={notification.type === 'danger' || notification.type === 'dark' ? 'text-white' : ''}
            >
              {notification.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </NotificationContext.Provider>
  );
};

/**
 * Custom hook to use notifications
 * @returns {Object} Notification utilities
 */
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export default NotificationContext;
