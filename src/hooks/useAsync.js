import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';

/**
 * Custom hook for handling async Redux thunk actions
 * Provides loading, error states and execution function
 *
 * @returns {Object} Async utilities
 */
export const useAsync = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (asyncAction, ...args) => {
      setLoading(true);
      setError(null);

      try {
        const result = await dispatch(asyncAction(...args));

        if (result.type.includes('rejected')) {
          const errorMessage = result.payload || 'Operation failed';
          setError(errorMessage);
          setLoading(false);
          return { success: false, error: errorMessage };
        }

        setLoading(false);
        return { success: true, data: result.payload };
      } catch (err) {
        const errorMessage = err.message || 'Unexpected error occurred';
        setError(errorMessage);
        setLoading(false);
        return { success: false, error: errorMessage };
      }
    },
    [dispatch]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    execute,
    loading,
    error,
    clearError,
  };
};
