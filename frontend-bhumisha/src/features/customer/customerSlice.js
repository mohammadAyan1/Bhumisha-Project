import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import customersAPI from "../../axios/customerAPI";

export const fetchCustomer = createAsyncThunk(
  "customers/fetchCustomers",
  async () => {
    const res = await customersAPI.getAll();
    return res.data;
  }
);

const customerSlice = createSlice({
  name: "Customer",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomer.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default customerSlice.reducer;
