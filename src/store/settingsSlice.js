import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { firestoreService } from '../services/firestoreService'
import { logActivity, ACTIVITY_TYPES, createActivityDescription } from '../services/activityService'
import { DEFAULT_SETTINGS } from '../constants/defaultSettings'

// Deep merge utility — merges source into target, preserving defaults for missing keys
function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return target
  if (!target || typeof target !== 'object') return source

  const result = { ...target }
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key])
    } else {
      result[key] = source[key]
    }
  }
  return result
}

// Fetch settings from Firestore, deep-merge with defaults
export const fetchSettings = createAsyncThunk(
  'settings/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const result = await firestoreService.getSettings()
      if (result.success && result.data) {
        const merged = deepMerge(DEFAULT_SETTINGS, result.data)
        // Auto-sync missing pages/keys back to Firestore
        const defaultPages = DEFAULT_SETTINGS.pages || {}
        const firestorePages = result.data.pages || {}
        const missingPages = {}
        Object.keys(defaultPages).forEach(key => {
          if (!firestorePages[key]) missingPages[key] = defaultPages[key]
        })
        if (Object.keys(missingPages).length > 0) {
          firestoreService.updateSettings({ pages: missingPages }).catch(() => {})
        }
        return merged
      }
      // No settings doc yet — write defaults to Firestore
      firestoreService.updateSettings(DEFAULT_SETTINGS).catch(() => {})
      return DEFAULT_SETTINGS
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Update settings (partial merge) and log activity
export const updateSettings = createAsyncThunk(
  'settings/update',
  async ({ data, user }, { getState, rejectWithValue }) => {
    try {
      const result = await firestoreService.updateSettings(data)
      if (!result.success) {
        return rejectWithValue(result.error)
      }

      // Log activity (non-blocking — don't let logging failure break settings update)
      if (user) {
        logActivity({
          userId: user.uid,
          username: user.username || user.email,
          userRole: user.role,
          activityType: ACTIVITY_TYPES.SETTINGS_UPDATE,
          description: createActivityDescription(ACTIVITY_TYPES.SETTINGS_UPDATE),
          metadata: { changes: JSON.stringify(data).slice(0, 500) },
        }).catch(() => {})
      }

      // Re-fetch to get the merged result
      const fetchResult = await firestoreService.getSettings()
      if (fetchResult.success && fetchResult.data) {
        return deepMerge(DEFAULT_SETTINGS, fetchResult.data)
      }
      return deepMerge(getState().settings.data, data)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    data: DEFAULT_SETTINGS,
    loading: false,
    loaded: false,
    error: null,
  },
  reducers: {
    clearSettingsError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.data = action.payload
        state.loading = false
        state.loaded = true
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.loaded = true // still mark loaded so we use defaults
      })
      .addCase(updateSettings.pending, (state) => {
        state.error = null
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.data = action.payload
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.error = action.payload
      })
  },
})

export const { clearSettingsError } = settingsSlice.actions
export default settingsSlice.reducer
