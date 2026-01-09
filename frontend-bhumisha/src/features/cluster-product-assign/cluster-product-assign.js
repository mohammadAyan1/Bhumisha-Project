import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import clusterProductAssignApi from "../../axios/clusterAssignProductApi";
import { toast } from "react-toastify";

// 🔹 Fetch all
export const fetchClustersAssignProduct = createAsyncThunk(
  "clusters/fetchAllAssignProducts",
  async (_, { rejectWithValue }) => {
    try {
      const res = await clusterProductAssignApi.getAllAssign();
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 🔹 Add
export const createClusterProduct = createAsyncThunk(
  "clusters/createAssign",
  async (data, { rejectWithValue }) => {
    try {
      const res = await clusterProductAssignApi.create(data);
      toast.success("Cluster Product assigned successfully");
      return res.data;
    } catch (error) {
      toast.error("Failed to assign Cluster Product");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
// 🔹 Slice
const clusterProductAssignSlice = createSlice({
  name: "clusterProductAssign",
  initialState: {
    assignProducts: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClustersAssignProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClustersAssignProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.assignProducts = action.payload;
      })
      .addCase(fetchClustersAssignProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createClusterProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createClusterProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.assignProducts.push(action.payload);
      })
      .addCase(createClusterProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});
export default clusterProductAssignSlice.reducer;
