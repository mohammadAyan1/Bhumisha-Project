import { createSlice } from "@reduxjs/toolkit";
import {
  fetchVendors,
  addVendor,
  updateVendor,
  deleteVendor,
  updateVendorStatus,
} from "./vendorThunks";

const vendorSlice = createSlice({
  name: "vendor",
  initialState: {
    vendors: [],
    loading: false,
    error: null,
    editingVendor: null,
  },
  reducers: {
    setEditingVendor: (state, action) => {
      const payload = JSON.parse(JSON.stringify(action.payload));
      state.editingVendor = {
        ...payload,
        bank: {
          pan_number: payload.bank?.pan_number || payload.pan_number || "",
          account_holder_name:
            payload.bank?.account_holder_name ||
            payload.account_holder_name ||
            "",
          bank_name: payload.bank?.bank_name || payload.bank_name || "",
          account_number:
            payload.bank?.account_number || payload.account_number || "",
          ifsc_code: payload.bank?.ifsc_code || payload.ifsc_code || "",
          branch_name: payload.bank?.branch_name || payload.branch_name || "",
        },
      };
    },
    clearEditingVendor: (state) => {
      state.editingVendor = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchVendors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVendors.fulfilled, (state, action) => {
        state.loading = false;
        state.vendors = action.payload;
      })
      .addCase(fetchVendors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Add
      .addCase(addVendor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addVendor.fulfilled, (state, action) => {
        state.loading = false;
        const v = action.payload?.vendor || action.payload || {};
        // Normalize to flat row shape expected by list/grid
        const normalized = {
          id: v.id ?? v.vendor_id ?? v._id,
          vendor_name: v.vendor_name,
          firm_name: v.firm_name,
          gst_no: v.gst_no,
          address: v.address,
          contact_number: v.contact_number,
          status: (v.status || "").toString(),
          // Flatten possible nested bank object or accept flat fields
          pan_number: v.bank?.pan_number ?? v.pan_number ?? "",
          account_holder_name:
            v.bank?.account_holder_name ?? v.account_holder_name ?? "",
          bank_name: v.bank?.bank_name ?? v.bank_name ?? "",
          account_number: v.bank?.account_number ?? v.account_number ?? "",
          ifsc_code: v.bank?.ifsc_code ?? v.ifsc_code ?? "",
          branch_name: v.bank?.branch_name ?? v.branch_name ?? "",
        };
        // Only push if we have a valid id; otherwise let fetchVendors refresh the list
        if (
          normalized.id !== undefined &&
          normalized.id !== null &&
          normalized.id !== ""
        ) {
          // Deduplicate by id if it already exists
          const existsIndex = state.vendors.findIndex(
            (row) => (row.id ?? row._id ?? row.vendor_id) === normalized.id
          );
          if (existsIndex >= 0) {
            state.vendors[existsIndex] = {
              ...state.vendors[existsIndex],
              ...normalized,
            };
          } else {
            state.vendors.push(normalized);
          }
        }
      })
      .addCase(addVendor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Update
      .addCase(updateVendor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateVendor.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        const index = state.vendors.findIndex((v) => v.id === updated.id);
        if (index !== -1) {
          state.vendors[index] = {
            ...state.vendors[index],
            ...updated,
            bank: {
              ...state.vendors[index].bank,
              ...updated.bank,
            },
          };
        }
        state.editingVendor = null;
      })

      .addCase(updateVendor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Delete
      .addCase(deleteVendor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteVendor.fulfilled, (state, action) => {
        state.loading = false;
        state.vendors = state.vendors.filter((v) => v.id !== action.payload);
      })
      .addCase(deleteVendor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Update Status
      .addCase(updateVendorStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateVendorStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.vendors.findIndex(
          (v) => v.id === action.payload.id
        );
        if (index !== -1) {
          state.vendors[index].status = action.payload.status;
        }
      })
      .addCase(updateVendorStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setEditingVendor, clearEditingVendor } = vendorSlice.actions;
export default vendorSlice.reducer;
