import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import firestoreService from '../../services/firestoreService';

/**
 * Factory function to create CRUD Redux slices
 * Eliminates 70% of Redux boilerplate code
 *
 * @param {string} name - Slice name (e.g., 'patients')
 * @param {string} collection - Firestore collection name
 * @param {Object} customReducers - Optional custom reducers
 * @param {Object} customThunks - Optional custom async thunks
 * @returns {Object} Slice and async thunks
 */
export const createCRUDSlice = (name, collection, customReducers = {}, customThunks = {}) => {
  // Async Thunks
  const fetchAll = createAsyncThunk(
    `${name}/fetchAll`,
    async (_, { rejectWithValue }) => {
      const result = await firestoreService.getAll(collection);
      if (result.success) {
        return result.data;
      }
      return rejectWithValue(result.error);
    }
  );

  const add = createAsyncThunk(
    `${name}/add`,
    async (data, { rejectWithValue }) => {
      const result = await firestoreService.add(collection, data);
      if (result.success) {
        return result.data;
      }
      return rejectWithValue(result.error);
    }
  );

  const update = createAsyncThunk(
    `${name}/update`,
    async ({ id, ...data }, { rejectWithValue }) => {
      const result = await firestoreService.update(collection, id, data);
      if (result.success) {
        return result.data;
      }
      return rejectWithValue(result.error);
    }
  );

  const remove = createAsyncThunk(
    `${name}/delete`,
    async (id, { rejectWithValue }) => {
      const result = await firestoreService.delete(collection, id);
      if (result.success) {
        return id;
      }
      return rejectWithValue(result.error);
    }
  );

  // Initial State
  const initialState = {
    [name]: [],
    loading: false,
    error: null,
  };

  // Create Slice
  const slice = createSlice({
    name,
    initialState,
    reducers: {
      clearError: (state) => {
        state.error = null;
      },
      ...customReducers,
    },
    extraReducers: (builder) => {
      // Fetch All
      builder
        .addCase(fetchAll.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(fetchAll.fulfilled, (state, action) => {
          state[name] = action.payload;
          state.loading = false;
        })
        .addCase(fetchAll.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        });

      // Add
      builder
        .addCase(add.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(add.fulfilled, (state, action) => {
          state[name].push(action.payload);
          state.loading = false;
        })
        .addCase(add.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        });

      // Update
      builder
        .addCase(update.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(update.fulfilled, (state, action) => {
          const index = state[name].findIndex(
            (item) => item.id === action.payload.id
          );
          if (index !== -1) {
            state[name][index] = action.payload;
          }
          state.loading = false;
        })
        .addCase(update.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        });

      // Delete
      builder
        .addCase(remove.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(remove.fulfilled, (state, action) => {
          state[name] = state[name].filter(
            (item) => item.id !== action.payload
          );
          state.loading = false;
        })
        .addCase(remove.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        });
    },
  });

  return {
    reducer: slice.reducer,
    actions: slice.actions,
    thunks: {
      fetchAll,
      add,
      update,
      delete: remove,
      ...customThunks,
    },
  };
};
