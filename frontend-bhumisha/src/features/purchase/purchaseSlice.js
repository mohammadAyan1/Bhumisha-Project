// src/store/purchases/purchaseSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import PurchaseAPI from "../../axios/purchaseApi";

// Common error extractor
const toErr = (err, fallback) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  err?.response?.data ||
  err?.message ||
  fallback;

// Thunks
export const fetchPurchases = createAsyncThunk(
  "purchases/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await PurchaseAPI.getAll();
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      return rejectWithValue(toErr(err, "Error while fetching purchases"));
    }
  }
);

export const fetchPurchaseById = createAsyncThunk(
  "purchases/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await PurchaseAPI.getById(id);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        toErr(err, "Error while fetching purchase details")
      );
    }
  }
);

// CREATE: expects FormData (data JSON blob + optional bill_img File)
export const addPurchase = createAsyncThunk(
  "purchases/add",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await PurchaseAPI.create(formData);
      return res.data; // backend returns created row or {message, purchase_id, bill_img}
    } catch (err) {
      return rejectWithValue(toErr(err, "Error while adding purchase"));
    }
  }
);

// UPDATE: expects { id, formData }
export const updatePurchase = createAsyncThunk(
  "purchases/update",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const res = await PurchaseAPI.update(id, formData);
      return { id, data: res.data };
    } catch (err) {
      return rejectWithValue(toErr(err, "Error while updating purchase"));
    }
  }
);

const purchasesSlice = createSlice({
  name: "purchases",
  initialState: {
    list: [],
    selected: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearSelected: (state) => {
      state.selected = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all
    builder
      .addCase(fetchPurchases.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchases.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload || [];
      })
      .addCase(fetchPurchases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch by ID
    builder
      .addCase(fetchPurchaseById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload || null;
      })
      .addCase(fetchPurchaseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Add Purchase (multipart)
    builder
      .addCase(addPurchase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPurchase.fulfilled, (state, action) => {
        state.loading = false;
        const p = action.payload;
        // If API returns full purchase row, prepend; otherwise refetch list in UI
        if (p && (p.id || p.purchase_id)) {
          // Normalize shape if only id returned

          const row = p.id
            ? p
            : { id: p.purchase_id, bill_img: p.bill_img, ...p };
          state.list = Array.isArray(state.list) ? [row, ...state.list] : [row];
        }
      })
      .addCase(addPurchase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Purchase (multipart)
    builder
      .addCase(updatePurchase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePurchase.fulfilled, (state, action) => {
        state.loading = false;
        const { id, data } = action.payload || {};
        if (!id || !data) return;
        const idx = state.list.findIndex((x) => String(x.id) === String(id));
        if (idx >= 0) state.list[idx] = { ...state.list[idx], ...data };
        if (state.selected && String(state.selected.id) === String(id)) {
          state.selected = { ...state.selected, ...data };
        }
      })
      .addCase(updatePurchase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelected, clearError } = purchasesSlice.actions;
export default purchasesSlice.reducer;
