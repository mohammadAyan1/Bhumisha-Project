import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import ClusterInventoryApi from "../../axios/clusterInventoryApi";
import { toast } from "react-toastify";

export const fetchClustersInventory = createAsyncThunk(
  "clusters/fetchAllClusterInventory",
  async (_, { rejectWithValue }) => {
    try {
      const res = await ClusterInventoryApi.getAll();
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// fetch cluster inventory by cluster id
export const fetchClustersProductByPurchases = createAsyncThunk(
  "clusters/fetchClustersProductByPurchases",
  async (_, { rejectWithValue }) => {
    try {
      const res = await ClusterInventoryApi.getClusterProductByPurchases();
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// fetch cluster inventory by cluster id
export const fetchClustersInventoryByClusterId = createAsyncThunk(
  "clusters/fetchAllClusterInventoryByClusterId",
  async (id, { rejectWithValue }) => {
    try {
      const res = await ClusterInventoryApi.getClusterInventoryByClusterId(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 🔹 Add
export const addClusterInventory = createAsyncThunk(
  "clusters/addClusterInventory",
  async (data, { rejectWithValue }) => {
    try {
      const res = await ClusterInventoryApi.create(data);
      // toast.success("Cluster Product added successfully");
      return res.data;
    } catch (error) {
      // toast.error("Failed to add Cluster Product");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateClusterInventory = createAsyncThunk(
  "clusters/updateClusterInventory",
  async (payload, { rejectWithValue }) => {
    try {
      await ClusterInventoryApi.update(payload.id, payload);
      return payload; // ✅ return updated data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 🔹 Delete
export const deleteClusterInventory = createAsyncThunk(
  "clusters/deleteClusterInventory",
  async (id, { rejectWithValue }) => {
    try {
      await ClusterInventoryApi.remove(id);
      toast.success("Cluster Product deleted successfully");
      return id;
    } catch (error) {
      toast.error("Failed to delete Cluster Product");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const clusterInventory = createSlice({
  name: "clusterInventory",
  initialState: {
    clusterInventory: [],
    status: "",
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClustersInventory.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchClustersInventory.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.clusterInventory = action.payload.data || []; // ✅ FIX
      })
      .addCase(fetchClustersInventory.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Add
      .addCase(addClusterInventory.fulfilled, (state, action) => {
        state.clusterInventory.push(action.payload.data); // If backend returns {success, data}
      })

      // Update
      .addCase(updateClusterInventory.fulfilled, (state, action) => {
        const index = state.clusterInventory.findIndex(
          (p) => p.id === action.payload.id
        );
        if (index !== -1) {
          state.clusterInventory[index] = {
            ...state.clusterInventory[index],
            ...action.payload,
          };
        }
      })

      // Delete
      .addCase(deleteClusterInventory.fulfilled, (state, action) => {
        state.clusterInventory = state.clusterInventory.filter(
          (p) => p.id !== action.payload
        );
      });
  },
});
export default clusterInventory.reducer;
