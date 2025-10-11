import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { firestoreService } from '../services/firestoreService'

const COLLECTION = 'patients'

const initialState = {
  patients: [],
  loading: false,
  error: null,
}

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
        state.patients = action.payload
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
        state.patients.unshift(action.payload)
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
        const index = state.patients.findIndex(p => p.id === action.payload.id)
        if (index !== -1) {
          state.patients[index] = action.payload
        }
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
        state.patients = state.patients.filter(p => p.id !== action.payload)
        state.loading = false
      })
      .addCase(deletePatient.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError } = patientsSlice.actions
export default patientsSlice.reducer
