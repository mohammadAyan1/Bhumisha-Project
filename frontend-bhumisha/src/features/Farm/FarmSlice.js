import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import farmAPI from "../../axios/FarmAPI";
import { toast } from "react-toastify";

// ✅ Thunks
export const fetchFarms = createAsyncThunk("farms/fetchFarms", async () => {
  const res = await farmAPI.getAll();
  return res.data;
});

export const fetchFarmDetailByFarmerId = createAsyncThunk(
  "farms/fetchFarmDetailByFarmerId",
  async (id, { rejectWithValue }) => {
    try {
      const res = await farmAPI.getFarmByFarmerId(id);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// addFarm
export const addFarm = createAsyncThunk(
  "farms/addFarm",
  async (data, { rejectWithValue }) => {
    try {
      const res = await farmAPI.create(data);
      toast.success("Farm successfully registered! 🎉");
      return res.data;
    } catch (error) {
      toast.error("Failed to register farm. Please try again.");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
// updateFarm
export const updateFarm = createAsyncThunk(
  "farms/updateFarm",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await farmAPI.update(payload.id, payload); // ✅ FIX
      toast.success("Farm details updated successfully! ✅");
      return res.data;
    } catch (error) {
      toast.error("Failed to update farm details.");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

//TODO - deleteFarm
export const deleteFarm = createAsyncThunk(
  "farms/deleteFarm",
  async (id, { rejectWithValue }) => {
    try {
      const res = await farmAPI.remove(id);
      toast.success("Farm deleted successfully! ✅");
      return res.data;
    } catch (error) {
      // console.error("deleteFarm ERR", error.response?.status, error.response?.data);
      toast.error("Failed to delete farm. Please try again.");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const farmSlice = createSlice({
  name: "farms",
  initialState: {
    farms: {
      data: [],
    },
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder

      // FETCH
      .addCase(fetchFarms.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFarms.fulfilled, (state, action) => {
        state.loading = false;
        state.farms.data = action.payload.data; // ✅ CORRECT
      })
      .addCase(fetchFarms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ADD (OPTION 1: refetch instead – recommended)
      .addCase(addFarm.fulfilled, (state) => {
        state.loading = false;
      })

      // UPDATE
      .addCase(updateFarm.fulfilled, (state) => {
        state.loading = false;
      })

      // DELETE
      .addCase(deleteFarm.fulfilled, (state, action) => {
        state.loading = false;
        state.farms.data = state.farms.data.filter(
          (farm) => farm.farm_id !== action.meta.arg // ✅ ID FIX
        );
      });
  },
});

export default farmSlice.reducer;
