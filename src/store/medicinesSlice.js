import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit'
import { firestoreService } from '../services/firestoreService'

const COLLECTION = 'medicines'

// Create entity adapter
const medicinesAdapter = createEntityAdapter({
  selectId: (medicine) => medicine.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name)
})

const initialState = medicinesAdapter.getInitialState({
  loading: false,
  error: null,
})

// Async thunks for Firestore operations
export const fetchMedicines = createAsyncThunk(
  'medicines/fetchAll',
  async (_, { rejectWithValue }) => {
    const result = await firestoreService.getAll(COLLECTION)
    if (result.success) {
      return result.data
    } else {
      return rejectWithValue(result.error)
    }
  }
)

export const addMedicine = createAsyncThunk(
  'medicines/add',
  async (medicineData, { rejectWithValue }) => {
    const result = await firestoreService.create(COLLECTION, medicineData)
    if (result.success) {
      return { id: result.id, ...medicineData }
    } else {
      return rejectWithValue(result.error)
    }
  }
)

export const updateMedicine = createAsyncThunk(
  'medicines/update',
  async ({ id, ...medicineData }, { rejectWithValue }) => {
    const result = await firestoreService.update(COLLECTION, id, medicineData)
    if (result.success) {
      return { id, ...medicineData }
    } else {
      return rejectWithValue(result.error)
    }
  }
)

export const deleteMedicine = createAsyncThunk(
  'medicines/delete',
  async (id, { rejectWithValue }) => {
    const result = await firestoreService.delete(COLLECTION, id)
    if (result.success) {
      return id
    } else {
      return rejectWithValue(result.error)
    }
  }
)

const medicinesSlice = createSlice({
  name: 'medicines',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch medicines
      .addCase(fetchMedicines.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMedicines.fulfilled, (state, action) => {
        medicinesAdapter.setAll(state, action.payload)
        state.loading = false
      })
      .addCase(fetchMedicines.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Add medicine
      .addCase(addMedicine.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addMedicine.fulfilled, (state, action) => {
        medicinesAdapter.addOne(state, action.payload)
        state.loading = false
      })
      .addCase(addMedicine.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update medicine
      .addCase(updateMedicine.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateMedicine.fulfilled, (state, action) => {
        medicinesAdapter.updateOne(state, {
          id: action.payload.id,
          changes: action.payload
        })
        state.loading = false
      })
      .addCase(updateMedicine.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Delete medicine
      .addCase(deleteMedicine.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteMedicine.fulfilled, (state, action) => {
        medicinesAdapter.removeOne(state, action.payload)
        state.loading = false
      })
      .addCase(deleteMedicine.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError } = medicinesSlice.actions

// Export entity adapter selectors
export const {
  selectAll: selectAllMedicines,
  selectById: selectMedicineById,
  selectIds: selectMedicineIds,
} = medicinesAdapter.getSelectors((state) => state.medicines)

export default medicinesSlice.reducer
