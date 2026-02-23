import { useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { fetchSettings } from '../store/settingsSlice'
import { hasPermission } from '../constants/roles'

export function useSettings() {
  const dispatch = useDispatch()
  const { data: settings, loading, loaded } = useSelector(state => state.settings)

  // Auto-fetch settings if not yet loaded
  useEffect(() => {
    if (!loaded && !loading) {
      dispatch(fetchSettings())
    }
  }, [dispatch, loaded, loading])

  // Filter a fields array — removes hidden, overrides label/required/colSize/placeholder/rows
  const filterFields = useCallback((entity, fieldsArray) => {
    const entitySettings = settings?.forms?.[entity]?.fields
    if (!entitySettings) return fieldsArray

    return fieldsArray
      .filter((field) => {
        const cfg = entitySettings[field.name]
        return !cfg || cfg.visible !== false
      })
      .map((field) => {
        const cfg = entitySettings[field.name]
        if (!cfg) return field
        const merged = {
          ...field,
          required: cfg.required ?? field.required,
          label: cfg.label || field.label,
        }
        if (cfg.colSize != null) merged.colSize = cfg.colSize
        if (cfg.placeholder != null) merged.placeholder = cfg.placeholder
        if (cfg.rows != null) merged.rows = cfg.rows
        return merged
      })
  }, [settings])

  // Check if a specific field is visible (for custom/children-rendered fields)
  const isFieldVisible = useCallback((entity, fieldName) => {
    const cfg = settings?.forms?.[entity]?.fields?.[fieldName]
    return !cfg || cfg.visible !== false
  }, [settings])

  // Check if a specific field is required
  const isFieldRequired = useCallback((entity, fieldName, defaultRequired = false) => {
    const cfg = settings?.forms?.[entity]?.fields?.[fieldName]
    if (!cfg) return defaultRequired
    return cfg.required ?? defaultRequired
  }, [settings])

  // Get the display label for a field from settings
  const getFieldLabel = useCallback((entity, fieldName, defaultLabel = '') => {
    const cfg = settings?.forms?.[entity]?.fields?.[fieldName]
    return cfg?.label || defaultLabel
  }, [settings])

  // Filter a columns array — removes hidden columns, overrides label
  const filterColumns = useCallback((entity, columnsArray) => {
    const entitySettings = settings?.tables?.[entity]?.columns
    if (!entitySettings) return columnsArray

    return columnsArray
      .filter((col) => {
        const cfg = entitySettings[col.key]
        return !cfg || cfg.visible !== false
      })
      .map((col) => {
        const cfg = entitySettings[col.key]
        if (!cfg) return col
        return {
          ...col,
          label: cfg.label ?? col.label,
        }
      })
  }, [settings])

  // Get the roles array for a given page key
  const getPageRoles = useCallback((pageKey) => {
    return settings?.pages?.[pageKey]?.roles || []
  }, [settings])

  // Check if a specific role can access a page
  const canAccessPage = useCallback((pageKey, userRole) => {
    const roles = settings?.pages?.[pageKey]?.roles
    if (!roles) return true // no config = allow (fallback)
    return roles.includes(userRole)
  }, [settings])

  // Get search fields — all visible column keys for a table entity
  const getSearchFields = useCallback((entity) => {
    const columns = settings?.tables?.[entity]?.columns
    if (!columns) return []
    return Object.entries(columns)
      .filter(([, cfg]) => cfg.visible !== false)
      .map(([key]) => key)
  }, [settings])

  // Get items per page for a table entity
  const getItemsPerPage = useCallback((entity) => {
    return settings?.tables?.[entity]?.itemsPerPage || 10
  }, [settings])

  // Check if a role has permission for a resource+action (settings first, hardcoded fallback)
  const checkPermission = useCallback((resource, action, userRole) => {
    const rolesArray = settings?.permissions?.[resource]?.[action]
    if (rolesArray) {
      return rolesArray.includes(userRole)
    }
    return hasPermission(userRole, resource, action)
  }, [settings])

  return {
    settings,
    loading,
    loaded,
    filterFields,
    filterColumns,
    isFieldVisible,
    isFieldRequired,
    getFieldLabel,
    getPageRoles,
    canAccessPage,
    getSearchFields,
    getItemsPerPage,
    checkPermission,
  }
}
