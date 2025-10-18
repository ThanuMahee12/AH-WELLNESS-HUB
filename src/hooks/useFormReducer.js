import { useReducer, useCallback, useMemo } from 'react';

/**
 * Form reducer for complex state management
 */
const formReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        values: {
          ...state.values,
          [action.field]: action.value,
        },
        touched: {
          ...state.touched,
          [action.field]: true,
        },
        errors: {
          ...state.errors,
          [action.field]: action.error || '',
        },
      };

    case 'SET_FIELDS':
      return {
        ...state,
        values: {
          ...state.values,
          ...action.fields,
        },
      };

    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.field]: action.error,
        },
      };

    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.errors,
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: {},
      };

    case 'SET_TOUCHED':
      return {
        ...state,
        touched: {
          ...state.touched,
          [action.field]: action.touched,
        },
      };

    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.isSubmitting,
      };

    case 'RESET':
      return {
        values: action.initialValues || state.initialValues,
        errors: {},
        touched: {},
        isSubmitting: false,
        initialValues: action.initialValues || state.initialValues,
      };

    case 'RESET_TO':
      return {
        values: action.values,
        errors: {},
        touched: {},
        isSubmitting: false,
        initialValues: action.values,
      };

    default:
      return state;
  }
};

/**
 * Advanced form hook using useReducer for complex state management
 * Perfect for forms with validation, multiple fields, and complex interactions
 *
 * @param {Object} initialValues - Initial form values
 * @param {Object} options - Configuration options
 * @param {Function} options.validate - Validation function
 * @param {Function} options.onSubmit - Submit handler
 * @param {boolean} options.validateOnChange - Validate on field change
 * @param {boolean} options.validateOnBlur - Validate on field blur
 */
export const useFormReducer = (initialValues = {}, options = {}) => {
  const {
    validate,
    onSubmit,
    validateOnChange = true,
    validateOnBlur = true,
  } = options;

  const initialState = useMemo(
    () => ({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      initialValues,
    }),
    [initialValues]
  );

  const [state, dispatch] = useReducer(formReducer, initialState);

  // Validate single field
  const validateField = useCallback(
    (name, value) => {
      if (!validate) return '';

      const errors = validate({ ...state.values, [name]: value });
      return errors[name] || '';
    },
    [validate, state.values]
  );

  // Validate all fields
  const validateForm = useCallback(() => {
    if (!validate) return {};

    const errors = validate(state.values);
    dispatch({ type: 'SET_ERRORS', errors });
    return errors;
  }, [validate, state.values]);

  // Handle field change
  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      const fieldValue = type === 'checkbox' ? checked : value;

      const error = validateOnChange ? validateField(name, fieldValue) : '';

      dispatch({
        type: 'SET_FIELD',
        field: name,
        value: fieldValue,
        error,
      });
    },
    [validateOnChange, validateField]
  );

  // Handle field blur
  const handleBlur = useCallback(
    (e) => {
      const { name, value } = e.target;

      dispatch({
        type: 'SET_TOUCHED',
        field: name,
        touched: true,
      });

      if (validateOnBlur) {
        const error = validateField(name, value);
        dispatch({
          type: 'SET_ERROR',
          field: name,
          error,
        });
      }
    },
    [validateOnBlur, validateField]
  );

  // Set field value programmatically
  const setFieldValue = useCallback((name, value, shouldValidate = true) => {
    const error = shouldValidate ? validateField(name, value) : '';

    dispatch({
      type: 'SET_FIELD',
      field: name,
      value,
      error,
    });
  }, [validateField]);

  // Set multiple fields
  const setFields = useCallback((fields) => {
    dispatch({ type: 'SET_FIELDS', fields });
  }, []);

  // Set field error
  const setFieldError = useCallback((field, error) => {
    dispatch({ type: 'SET_ERROR', field, error });
  }, []);

  // Reset form
  const reset = useCallback((newInitialValues) => {
    dispatch({ type: 'RESET', initialValues: newInitialValues });
  }, []);

  // Reset to specific values
  const resetTo = useCallback((values) => {
    dispatch({ type: 'RESET_TO', values });
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e) => {
      if (e) e.preventDefault();

      // Validate form
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        return false;
      }

      if (!onSubmit) return false;

      dispatch({ type: 'SET_SUBMITTING', isSubmitting: true });

      try {
        await onSubmit(state.values);
        dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
        return true;
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          field: 'submit',
          error: error.message || 'Submission failed',
        });
        dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
        return false;
      }
    },
    [validateForm, onSubmit, state.values]
  );

  // Check if form is valid
  const isValid = useMemo(() => {
    return Object.keys(state.errors).length === 0;
  }, [state.errors]);

  // Check if form has been modified
  const isDirty = useMemo(() => {
    return JSON.stringify(state.values) !== JSON.stringify(state.initialValues);
  }, [state.values, state.initialValues]);

  return {
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isSubmitting: state.isSubmitting,
    isValid,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFields,
    setFieldError,
    validateField,
    validateForm,
    reset,
    resetTo,
  };
};
