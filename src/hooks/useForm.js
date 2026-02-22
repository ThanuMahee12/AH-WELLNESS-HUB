import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for managing form state and validation
 * Handles form data, validation, errors, and submission
 */
export const useForm = (initialValues = {}, onSubmit, validate) => {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep a ref to always have the latest formData in handleSubmit
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Handle individual field change
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  // Set single field value programmatically
  const setFieldValue = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Set multiple fields at once
  const setFields = useCallback((fields) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  }, []);

  // Reset to initial values
  const reset = useCallback(() => {
    setFormData(initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Reset to specific values
  const resetTo = useCallback((values) => {
    setFormData(values);
    setErrors({});
    setIsSubmitting(false);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e) => {
      if (e) e.preventDefault();

      // Use ref to get latest formData (avoids stale closure from onBlur race)
      const currentData = formDataRef.current;

      // Validate if validation function provided
      if (validate) {
        const validationErrors = validate(currentData);
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          return false;
        }
      }

      setIsSubmitting(true);
      setErrors({});

      try {
        await onSubmit(currentData);
        return true;
      } catch (error) {
        setErrors({ submit: error.message || 'Submission failed' });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, validate]
  );

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    isSubmitting,
    handleChange,
    setFieldValue,
    setFields,
    handleSubmit,
    reset,
    resetTo,
  };
};
