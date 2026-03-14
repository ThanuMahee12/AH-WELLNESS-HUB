import React, { createContext, useState, useCallback, useContext, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Modal, Button } from 'react-bootstrap';

const NotificationContext = createContext();

/**
 * Notification Provider Component
 * Provides react-toastify notifications and confirmation dialogs throughout the app
 */
export const NotificationProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState(null);
  const confirmResolveRef = useRef(null);

  const success = useCallback((message, duration = 3000) => {
    toast.success(message, { autoClose: duration });
  }, []);

  const error = useCallback((message, duration = 4000) => {
    toast.error(message, { autoClose: duration });
  }, []);

  const warning = useCallback((message, duration = 3500) => {
    toast.warn(message, { autoClose: duration });
  }, []);

  const info = useCallback((message, duration = 3000) => {
    toast.info(message, { autoClose: duration });
  }, []);

  const notify = useCallback((message, type = 'success', duration = 3000) => {
    switch (type) {
      case 'success': success(message, duration); break;
      case 'danger':  error(message, duration); break;
      case 'warning': warning(message, duration); break;
      case 'info':    info(message, duration); break;
      default:        toast(message, { autoClose: duration }); break;
    }
  }, [success, error, warning, info]);

  /**
   * Show a confirmation dialog and return a Promise<boolean>.
   * @param {string} message - The confirmation message
   * @param {object} [options] - Optional config
   * @param {string} [options.title] - Modal title (default: 'Confirm')
   * @param {string} [options.confirmText] - Confirm button text (default: 'Yes')
   * @param {string} [options.cancelText] - Cancel button text (default: 'Cancel')
   * @param {string} [options.variant] - Confirm button variant (default: 'danger')
   * @returns {Promise<boolean>}
   */
  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve;
      setConfirmState({
        message,
        title: options.title || 'Confirm',
        confirmText: options.confirmText || 'Yes',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'danger',
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    confirmResolveRef.current?.(true);
    confirmResolveRef.current = null;
    setConfirmState(null);
  }, []);

  const handleCancel = useCallback(() => {
    confirmResolveRef.current?.(false);
    confirmResolveRef.current = null;
    setConfirmState(null);
  }, []);

  const value = {
    notify,
    success,
    error,
    warning,
    info,
    confirm,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      {/* Confirmation Modal */}
      <Modal show={!!confirmState} onHide={handleCancel} centered size="sm" style={{ zIndex: 10000 }}>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1rem' }}>{confirmState?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ fontSize: '0.9rem' }}>{confirmState?.message}</Modal.Body>
        <Modal.Footer className="py-2">
          <Button size="sm" variant="secondary" onClick={handleCancel}>
            {confirmState?.cancelText}
          </Button>
          <Button size="sm" variant={confirmState?.variant} onClick={handleConfirm}>
            {confirmState?.confirmText}
          </Button>
        </Modal.Footer>
      </Modal>
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
