import { useState, useCallback } from 'react';

/**
 * Custom hook for managing modal state
 * Provides open, close, toggle functionality with optional data
 */
export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const [modalData, setModalData] = useState(null);

  const open = useCallback((data = null) => {
    setModalData(data);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Delay clearing data for smooth closing animation
    setTimeout(() => setModalData(null), 150);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    modalData,
    open,
    close,
    toggle,
    setModalData,
  };
};
