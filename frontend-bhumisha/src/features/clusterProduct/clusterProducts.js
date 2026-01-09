import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import clusterProductsApi from "../../axios/clusterProducts";
import { toast } from "react-toastify";

// 🔹 Fetch all
export const fetchClustersProduct = createAsyncThunk(
  "clusters/fetchAllProducts",
  async (_, { rejectWithValue }) => {
    try {
      const res = await clusterProductsApi.getAll();
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

//given product fetch
export const fetchGivenClusterProducts = createAsyncThunk(
  "clusters/fetchAllGivenClusters",
  async (_, { rejectWithValue }) => {
    try {
      const res = await clusterProductsApi.getAllGiven();

      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// received product fetch
export const fetchReceivedClusterProducts = createAsyncThunk(
  "clusters/fetchAllReceivedClusters",
  async (_, { rejectWithValue }) => {
    try {
      const res = await clusterProductsApi.getAllReceived();
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 🔹 Add
export const addClusterProduct = createAsyncThunk(
  "clusters/add",
  async (data, { rejectWithValue }) => {
    try {
      const res = await clusterProductsApi.create(data);
      toast.success("Cluster Product added successfully");
      return res.data;
    } catch (error) {
      toast.error("Failed to add Cluster Product");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
// 🔹 Update
export const updateClusterProduct = createAsyncThunk(
  "clusters/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      await clusterProductsApi.update(id, data);
      toast.success("Cluster Product updated successfully");
      return { id, ...data };
    } catch (error) {
      toast.error("Failed to update Cluster Product");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
// 🔹 Delete
export const deleteClusterProduct = createAsyncThunk(
  "clusters/delete",
  async (id, { rejectWithValue }) => {
    try {
      await clusterProductsApi.remove(id);
      toast.success("Cluster Product deleted successfully");
      return id;
    } catch (error) {
      toast.error("Failed to delete Cluster Product");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
const clusterProductSlice = createSlice({
  name: "clusterProducts",
  initialState: {
    list: [],
    status: "idle",
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClustersProduct.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchClustersProduct.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.list = action.payload.data || []; // ✅ FIX
      })
      .addCase(fetchClustersProduct.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Add
      .addCase(addClusterProduct.fulfilled, (state, action) => {
        state.list.push(action.payload.data); // If backend returns {success, data}
      })

      // Update
      .addCase(updateClusterProduct.fulfilled, (state, action) => {
        const index = state.list.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = { ...state.list[index], ...action.payload };
        }
      })

      // Delete
      .addCase(deleteClusterProduct.fulfilled, (state, action) => {
        state.list = state.list.filter((p) => p.id !== action.payload);
      });
  },
});
export default clusterProductSlice.reducer;
