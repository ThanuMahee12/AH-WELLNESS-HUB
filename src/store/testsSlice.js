import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { firestoreService } from '../services/firestoreService'

const COLLECTION = 'tests'

const initialState = {
  tests: [],
  loading: false,
  error: null,
}

// Async thunks for Firestore operations
export const fetchTests = createAsyncThunk(
  'tests/fetchAll',
  async (_, { rejectWithValue }) => {
    const result = await firestoreService.getAll(COLLECTION)
    if (result.success) {
      return result.data
    } else {
      return rejectWithValue(result.error)
    }
  }
)

export const addTest = createAsyncThunk(
  'tests/add',
  async (testData, { rejectWithValue }) => {
    const result = await firestoreService.create(COLLECTION, testData)
    if (result.success) {
      return { id: result.id, ...testData }
    } else {
      return rejectWithValue(result.error)
    }
  }
)

export const updateTest = createAsyncThunk(
  'tests/update',
  async ({ id, ...testData }, { rejectWithValue }) => {
    const result = await firestoreService.update(COLLECTION, id, testData)
    if (result.success) {
      return { id, ...testData }
    } else {
      return rejectWithValue(result.error)
    }
  }
)

export const deleteTest = createAsyncThunk(
  'tests/delete',
  async (id, { rejectWithValue }) => {
    const result = await firestoreService.delete(COLLECTION, id)
    if (result.success) {
      return id
    } else {
      return rejectWithValue(result.error)
    }
  }
)

const testsSlice = createSlice({
  name: 'tests',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tests
      .addCase(fetchTests.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTests.fulfilled, (state, action) => {
        state.tests = action.payload
        state.loading = false
      })
      .addCase(fetchTests.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Add test
      .addCase(addTest.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addTest.fulfilled, (state, action) => {
        state.tests.unshift(action.payload)
        state.loading = false
      })
      .addCase(addTest.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update test
      .addCase(updateTest.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateTest.fulfilled, (state, action) => {
        const index = state.tests.findIndex(t => t.id === action.payload.id)
        if (index !== -1) {
          state.tests[index] = action.payload
        }
        state.loading = false
      })
      .addCase(updateTest.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Delete test
      .addCase(deleteTest.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteTest.fulfilled, (state, action) => {
        state.tests = state.tests.filter(t => t.id !== action.payload)
        state.loading = false
      })
      .addCase(deleteTest.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError } = testsSlice.actions
export default testsSlice.reducer
