import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import clusterProductsApi from "../../axios/ClusterProductsAPI";
import { toast } from "react-toastify";

// 🔹 Fetch all
export const fetchAllClustersProduct = createAsyncThunk(
  "clusters/fetchAllClusterProducts",
  async (_, { rejectWithValue }) => {
    try {
      const res = await clusterProductsApi.getAll();
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 🔹 Add
export const createClusterProduct = createAsyncThunk(
  "clusters/createClusterProducts",
  async (data, { rejectWithValue }) => {
    try {
      const res = await clusterProductsApi.create(data);
      return res.data;
    } catch (error) {
      toast.error("Failed to add Cluster Product");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
// 🔹 Update
export const updateClusterProduct = createAsyncThunk(
  "clusters/updateClusterProducts",
  async (payload, { rejectWithValue }) => {
    try {
      await clusterProductsApi.update(payload.id, payload);

      return { id: payload.id, ...payload };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 🔹 Delete
export const deleteClusterProduct = createAsyncThunk(
  "clusters/deleteClusterProducts",
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
  name: "secondClusterProducts",
  initialState: {
    list: [],
    status: "",
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllClustersProduct.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllClustersProduct.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.list = action.payload.data || []; // ✅ FIX
      })
      .addCase(fetchAllClustersProduct.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Add
      .addCase(createClusterProduct.fulfilled, (state, action) => {
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
