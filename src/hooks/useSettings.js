import { useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { fetchSettings } from '../store/settingsSlice'
import { hasPermission } from '../constants/roles'

export function useSettings() {
  const dispatch = useDispatch()
  const { data: settings, loading, loaded } = useSelector(state => state.settings)
  const userRole = useSelector(state => state.auth?.user?.role)

  // Auto-fetch settings if not yet loaded
  useEffect(() => {
    if (!loaded && !loading) {
      dispatch(fetchSettings())
    }
  }, [dispatch, loaded, loading])

  // Filter a fields array — removes hidden, overrides label/required/colSize/placeholder/rows,
  // and appends dynamically-added fields from settings that aren't in the hardcoded array
  const filterFields = useCallback((entity, fieldsArray) => {
    const entitySettings = settings?.forms?.[entity]?.fields
    if (!entitySettings) return fieldsArray

    const hardcodedNames = new Set(fieldsArray.map(f => f.name))

    // Filter and merge hardcoded fields
    const merged = fieldsArray
      .filter((field) => {
        const cfg = entitySettings[field.name]
        return !cfg || cfg.visible !== false
      })
      .map((field) => {
        const cfg = entitySettings[field.name]
        if (!cfg) return field
        const result = {
          ...field,
          required: cfg.required ?? field.required,
          label: cfg.label || field.label,
        }
        if (cfg.colSize != null) result.colSize = cfg.colSize
        if (cfg.placeholder != null) result.placeholder = cfg.placeholder
        if (cfg.rows != null) result.rows = cfg.rows
        if (cfg.options) result.options = cfg.options
        return result
      })

    // Append dynamic fields added via settings that aren't hardcoded
    const dynamicFields = Object.entries(entitySettings)
      .filter(([key, cfg]) => !hardcodedNames.has(key) && cfg.visible !== false)
      .map(([key, cfg]) => ({
        name: key,
        label: cfg.label || key,
        type: cfg.type || 'text',
        required: cfg.required === true,
        colSize: cfg.colSize ?? 6,
        placeholder: cfg.placeholder || '',
        rows: cfg.rows ?? 3,
        ...(cfg.options ? { options: cfg.options } : {}),
      }))

    return [...merged, ...dynamicFields]
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

  // Filter a columns array — removes hidden columns, overrides label,
  // and appends dynamically-added columns from settings
  const filterColumns = useCallback((entity, columnsArray) => {
    const entitySettings = settings?.tables?.[entity]?.columns
    if (!entitySettings) return columnsArray

    const hardcodedKeys = new Set(columnsArray.map(c => c.key))

    const merged = columnsArray
      .filter((col) => {
        const cfg = entitySettings[col.key]
        if (cfg?.visible === false) return false
        if (cfg?.roles && userRole && !cfg.roles.includes(userRole)) return false
        return true
      })
      .map((col) => {
        const cfg = entitySettings[col.key]
        if (!cfg) return col
        return {
          ...col,
          label: cfg.label ?? col.label,
        }
      })

    // Append dynamic columns added via settings
    const dynamicColumns = Object.entries(entitySettings)
      .filter(([key, cfg]) => {
        if (hardcodedKeys.has(key)) return false
        if (cfg.visible === false) return false
        if (cfg.roles && userRole && !cfg.roles.includes(userRole)) return false
        return true
      })
      .map(([key, cfg]) => ({
        key,
        label: cfg.label || key,
      }))

    return [...merged, ...dynamicColumns]
  }, [settings, userRole])

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

  // Get all visible fields for an entity directly from settings (no hardcoded array needed)
  // Accepts optional customRenderers map: { fieldName: { render, ... } } to merge in custom props
  const getEntityFields = useCallback((entity, customProps = {}) => {
    const entitySettings = settings?.forms?.[entity]?.fields
    if (!entitySettings) return []

    return Object.entries(entitySettings)
      .filter(([, cfg]) => cfg.visible !== false)
      .map(([key, cfg]) => ({
        name: key,
        label: cfg.label || key,
        type: cfg.type || 'text',
        required: cfg.required === true,
        colSize: cfg.colSize ?? 6,
        placeholder: cfg.placeholder || '',
        rows: cfg.rows ?? 3,
        ...(cfg.options ? { options: cfg.options } : {}),
        ...(customProps[key] || {}),
      }))
  }, [settings])

  // Get all visible columns for an entity directly from settings (no hardcoded array needed)
  // Accepts optional customRenderers map: { columnKey: { render } } to merge in custom render functions
  const getEntityColumns = useCallback((entity, customRenderers = {}) => {
    const entitySettings = settings?.tables?.[entity]?.columns
    if (!entitySettings) return []

    return Object.entries(entitySettings)
      .filter(([, cfg]) => {
        if (cfg.visible === false) return false
        if (cfg.roles && userRole && !cfg.roles.includes(userRole)) return false
        return true
      })
      .map(([key, cfg]) => ({
        key,
        label: cfg.label || key,
        ...(customRenderers[key] || {}),
      }))
  }, [settings, userRole])

  // Build initial form data object from entity fields (all empty strings)
  const getInitialFormData = useCallback((entity, defaults = {}) => {
    const entitySettings = settings?.forms?.[entity]?.fields
    if (!entitySettings) return defaults

    const initial = {}
    Object.entries(entitySettings).forEach(([key, cfg]) => {
      if (cfg.type === 'list') initial[key] = []
      else if (cfg.type === 'checkbox') initial[key] = false
      else initial[key] = ''
    })
    return { ...initial, ...defaults }
  }, [settings])

  // Get search fields — visible, searchable, role-allowed column keys for a table entity
  const getSearchFields = useCallback((entity) => {
    const columns = settings?.tables?.[entity]?.columns
    if (!columns) return []
    return Object.entries(columns)
      .filter(([, cfg]) => {
        if (cfg.visible === false) return false
        if (cfg.searchable === false) return false
        if (cfg.roles && userRole && !cfg.roles.includes(userRole)) return false
        return true
      })
      .map(([key]) => key)
  }, [settings, userRole])

  // Get items per page for a table entity
  const getItemsPerPage = useCallback((entity) => {
    return settings?.tables?.[entity]?.itemsPerPage || 10
  }, [settings])

  // Get visible general test fields sorted by order
  const getGeneralTestFields = useCallback(() => {
    const fields = settings?.generalTests?.fields
    if (!fields) return []
    const defaultNotation = settings?.generalTests?.defaultNotation || '{value}({label})'
    return Object.entries(fields)
      .filter(([, cfg]) => cfg.visible !== false && !cfg.parent)
      .sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
      .map(([key, cfg]) => ({
        key,
        label: cfg.label || key,
        order: cfg.order || 0,
        display: cfg.display || 'default',
        notation: defaultNotation,
        rules: cfg.rules || null,
        children: cfg.children
          ? cfg.children
              .filter(ck => fields[ck] && fields[ck].visible !== false)
              .map(ck => ({ key: ck, label: fields[ck]?.label || ck, display: fields[ck]?.display || 'default', notation: defaultNotation, rules: fields[ck]?.rules || null }))
          : null,
      }))
  }, [settings])

  // Get visible lab result fields sorted by order (excludes children — they're accessed via parent.children)
  const getLabResultFields = useCallback(() => {
    const fields = settings?.labResults?.fields
    if (!fields) return []
    const defaultNotation = settings?.labResults?.defaultNotation || '{value}({label})'
    return Object.entries(fields)
      .filter(([, cfg]) => cfg.visible !== false && !cfg.parent)
      .sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
      .map(([key, cfg]) => ({
        key,
        label: cfg.label || key,
        order: cfg.order || 0,
        display: cfg.display || 'default',
        notation: defaultNotation,
        rules: cfg.rules || null,
        children: cfg.children
          ? cfg.children
              .filter(ck => fields[ck] && fields[ck].visible !== false)
              .map(ck => ({ key: ck, label: fields[ck]?.label || ck, display: fields[ck]?.display || 'default', notation: defaultNotation, rules: fields[ck]?.rules || null }))
          : null,
      }))
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
    getEntityFields,
    getEntityColumns,
    getInitialFormData,
    getSearchFields,
    getItemsPerPage,
    getGeneralTestFields,
    getLabResultFields,
    checkPermission,
  }
}
