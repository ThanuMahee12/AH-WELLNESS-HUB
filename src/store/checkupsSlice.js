import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { firestoreService } from '../services/firestoreService'

const COLLECTION = 'checkups'

const initialState = {
  checkups: [],
  loading: false,
  error: null,
}

// Async thunks for Firestore operations
export const fetchCheckups = createAsyncThunk(
  'checkups/fetchAll',
  async (_, { rejectWithValue }) => {
    const result = await firestoreService.getAll(COLLECTION)
    if (result.success) {
      return result.data
    } else {
      return rejectWithValue(result.error)
    }
  }
)

export const addCheckup = createAsyncThunk(
  'checkups/add',
  async (checkupData, { rejectWithValue }) => {
    const dataWithTimestamp = {
      ...checkupData,
      timestamp: new Date().toISOString()
    }
    const result = await firestoreService.create(COLLECTION, dataWithTimestamp)
    if (result.success) {
      return { id: result.id, ...dataWithTimestamp }
    } else {
      return rejectWithValue(result.error)
    }
  }
)

export const updateCheckup = createAsyncThunk(
  'checkups/update',
  async ({ id, ...checkupData }, { rejectWithValue }) => {
    const result = await firestoreService.update(COLLECTION, id, checkupData)
    if (result.success) {
      return { id, ...checkupData }
    } else {
      return rejectWithValue(result.error)
    }
  }
)

export const deleteCheckup = createAsyncThunk(
  'checkups/delete',
  async (id, { rejectWithValue }) => {
    const result = await firestoreService.delete(COLLECTION, id)
    if (result.success) {
      return id
    } else {
      return rejectWithValue(result.error)
    }
  }
)

const checkupsSlice = createSlice({
  name: 'checkups',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch checkups
      .addCase(fetchCheckups.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCheckups.fulfilled, (state, action) => {
        state.checkups = action.payload
        state.loading = false
      })
      .addCase(fetchCheckups.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Add checkup
      .addCase(addCheckup.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addCheckup.fulfilled, (state, action) => {
        state.checkups.unshift(action.payload)
        state.loading = false
      })
      .addCase(addCheckup.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update checkup
      .addCase(updateCheckup.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateCheckup.fulfilled, (state, action) => {
        const index = state.checkups.findIndex(c => c.id === action.payload.id)
        if (index !== -1) {
          state.checkups[index] = action.payload
        }
        state.loading = false
      })
      .addCase(updateCheckup.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Delete checkup
      .addCase(deleteCheckup.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteCheckup.fulfilled, (state, action) => {
        state.checkups = state.checkups.filter(c => c.id !== action.payload)
        state.loading = false
      })
      .addCase(deleteCheckup.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError } = checkupsSlice.actions
export default checkupsSlice.reducer
