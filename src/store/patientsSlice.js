import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit'
import { firestoreService } from '../services/firestoreService'

const COLLECTION = 'patients'

// Create entity adapter
const patientsAdapter = createEntityAdapter({
  selectId: (patient) => patient.id,
  sortComparer: (a, b) => b.name.localeCompare(a.name)
})

const initialState = patientsAdapter.getInitialState({
  loading: false,
  error: null,
})

// Async thunks for Firestore operations
export const fetchPatients = createAsyncThunk(
  'patients/fetchAll',
  async (_, { rejectWithValue }) => {
    const result = await firestoreService.getAll(COLLECTION)
    if (result.success) {
      return result.data
    } else {
      return rejectWithValue(result.error)
    }
  }
)

export const addPatient = createAsyncThunk(
  'patients/add',
  async (patientData, { rejectWithValue }) => {
    const result = await firestoreService.create(COLLECTION, patientData)
    if (result.success) {
      return { id: result.id, ...patientData }
    } else {
      return rejectWithValue(result.error)
    }
  }
)

export const updatePatient = createAsyncThunk(
  'patients/update',
  async ({ id, ...patientData }, { rejectWithValue }) => {
    const result = await firestoreService.update(COLLECTION, id, patientData)
    if (result.success) {
      return { id, ...patientData }
    } else {
      return rejectWithValue(result.error)
    }
  }
)

export const deletePatient = createAsyncThunk(
  'patients/delete',
  async (id, { rejectWithValue }) => {
    const result = await firestoreService.delete(COLLECTION, id)
    if (result.success) {
      return id
    } else {
      return rejectWithValue(result.error)
    }
  }
)

const patientsSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch patients
      .addCase(fetchPatients.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPatients.fulfilled, (state, action) => {
        patientsAdapter.setAll(state, action.payload)
        state.loading = false
      })
      .addCase(fetchPatients.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Add patient
      .addCase(addPatient.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addPatient.fulfilled, (state, action) => {
        patientsAdapter.addOne(state, action.payload)
        state.loading = false
      })
      .addCase(addPatient.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update patient
      .addCase(updatePatient.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updatePatient.fulfilled, (state, action) => {
        patientsAdapter.updateOne(state, {
          id: action.payload.id,
          changes: action.payload
        })
        state.loading = false
      })
      .addCase(updatePatient.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Delete patient
      .addCase(deletePatient.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deletePatient.fulfilled, (state, action) => {
        patientsAdapter.removeOne(state, action.payload)
        state.loading = false
      })
      .addCase(deletePatient.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError } = patientsSlice.actions

// Export entity adapter selectors
export const {
  selectAll: selectAllPatients,
  selectById: selectPatientById,
  selectIds: selectPatientIds,
} = patientsAdapter.getSelectors((state) => state.patients)

export default patientsSlice.reducer
