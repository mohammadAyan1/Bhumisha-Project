import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import clusterTransactionApi from "../../axios/clusterTransactionApi";
import { toast } from "react-toastify";
export const fetchClusterTransaction = createAsyncThunk(
  "cluster/fetchClusterTransaction",
  async (_, { rejectWithValue }) => {
    try {
      const res = await clusterTransactionApi.getAll();
      return res?.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createClusterTransaction = createAsyncThunk(
  "cluster/createClusterTransaction",
  async (data, { rejectWithValue }) => {
    try {
      const res = await clusterTransactionApi.create(data);
      toast.success("Cluster Transaction added successfully");
      return res.data;
    } catch (error) {
      toast.error("Failed to add Cluster Transaction");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const clusterTransaction = createSlice({
  name: "clusterTransaction",
  initialState: {
    clusterTransaction: [],
    status: "",
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClusterTransaction.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchClusterTransaction.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.clusterTransaction = action.payload.data || []; // ✅ FIX
      })
      .addCase(fetchClusterTransaction.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createClusterTransaction.fulfilled, (state, action) => {
        state.clusterTransaction.push(action.payload.data); // If backend
      });
  },
});

export default clusterTransaction.reducer;
