import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  tests: [
    { id: 1, name: 'Complete Blood Count (CBC)', price: 500, details: 'Measures red blood cells, white blood cells, and platelets', rules: 'Fasting not required' },
    { id: 2, name: 'Blood Sugar (Fasting)', price: 250, details: 'Measures glucose levels in blood', rules: 'Minimum 8 hours fasting required' },
    { id: 3, name: 'Lipid Profile', price: 800, details: 'Measures cholesterol and triglycerides', rules: '12 hours fasting required' },
  ],
  nextId: 4,
}

const testsSlice = createSlice({
  name: 'tests',
  initialState,
  reducers: {
    addTest: (state, action) => {
      state.tests.push({ ...action.payload, id: state.nextId })
      state.nextId += 1
    },
    updateTest: (state, action) => {
      const index = state.tests.findIndex(t => t.id === action.payload.id)
      if (index !== -1) {
        state.tests[index] = action.payload
      }
    },
    deleteTest: (state, action) => {
      state.tests = state.tests.filter(t => t.id !== action.payload)
    },
  },
})

export const { addTest, updateTest, deleteTest } = testsSlice.actions
export default testsSlice.reducer
