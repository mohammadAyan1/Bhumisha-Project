import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import clusterApi from "../../axios/clusterAdded";
import { toast } from "react-toastify";

// 🔹 Fetch all
export const fetchClusters = createAsyncThunk(
  "clusters/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await clusterApi.getAll();
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
// 🔹 Add
export const addCluster = createAsyncThunk(
  "clusters/add",
  async (data, { rejectWithValue }) => {
    try {
      const res = await clusterApi.create(data);
      toast.success("Cluster added successfully");
      return res.data;
    } catch (error) {
      toast.error("Failed to add cluster");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
// 🔹 Update
export const updateCluster = createAsyncThunk(
  "clusters/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      await clusterApi.update(id, data);
      toast.success("Cluster updated successfully");
      return { id, ...data };
    } catch (error) {
      toast.error("Failed to update cluster");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
// 🔹 Delete
export const deleteCluster = createAsyncThunk(
  "clusters/delete",
  async (id, { rejectWithValue }) => {
    try {
      await clusterApi.remove(id);
      toast.success("Cluster deleted successfully");
      return id;
    } catch (error) {
      toast.error("Failed to delete cluster");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
const clusterSlice = createSlice({
  name: "clusters",
  initialState: {
    clusters: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchClusters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClusters.fulfilled, (state, action) => {
        state.loading = false;
        state.clusters = action.payload;
      })
      .addCase(fetchClusters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add
      .addCase(addCluster.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCluster.fulfilled, (state, action) => {
        state.loading = false;
        state.clusters.push(action.payload);
      })
      .addCase(addCluster.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update
      .addCase(updateCluster.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCluster.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.clusters.findIndex(
          (cluster) => cluster.id === action.payload.id
        );
        if (index !== -1) {
          state.clusters[index] = action.payload;
        }
      })
      .addCase(updateCluster.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete
      .addCase(deleteCluster.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCluster.fulfilled, (state, action) => {
        state.loading = false;
        state.clusters = state.clusters.filter(
          (cluster) => cluster.id !== action.payload
        );
      })
      .addCase(deleteCluster.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});
export default clusterSlice.reducer;
