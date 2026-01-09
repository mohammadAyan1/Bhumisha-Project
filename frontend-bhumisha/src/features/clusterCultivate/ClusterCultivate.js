// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import ClusterCultivateApi from "../../axios/clusterCultivate";
// import { toast } from "react-toastify";

// export const fetchClustersCultivate = createAsyncThunk(
//   "clusters/fetchAllClusterCultivate",
//   async (_, { rejectWithValue }) => {
//     try {
//       const res = await ClusterCultivateApi.getAll();
//       return res.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// // 🔹 Add
// export const addClusterCultivate = createAsyncThunk(
//   "clusters/addClusterCultivate",
//   async (data, { rejectWithValue }) => {
//     try {
//       const res = await ClusterCultivateApi.create(data);
//       toast.success("Cluster Cultivate added successfully");
//       return res.data;
//     } catch (error) {
//       toast.error("Failed to add Cluster Product");
//       return rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// const clusterCultivateSlice = createSlice({
//   name: "clusterCultivate",
//   initialState: {
//     clusterCultivate: [],
//     status: "",
//     error: null,
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchClustersCultivate.pending, (state) => {
//         state.status = "loading";
//       })
//       .addCase(fetchClustersCultivate.fulfilled, (state, action) => {
//         state.status = "succeeded";
//         state.clusterCultivate = action.payload.data || []; // ✅ FIX
//       })
//       .addCase(fetchClustersCultivate.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload;
//       })

//       // Add
//       .addCase(addClusterCultivate.fulfilled, (state, action) => {
//         state.clusterCultivate.push(action.payload.data); // If backend returns {success, data}
//       });
//   },
// });
// export default clusterCultivateSlice.reducer;

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import ClusterCultivateApi from "../../axios/clusterCultivate";
import { toast } from "react-toastify";

export const fetchClustersCultivate = createAsyncThunk(
  "clusters/fetchAllClusterCultivate",
  async (_, { rejectWithValue }) => {
    try {
      const res = await ClusterCultivateApi.getAll();
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 🔹 Add
export const addClusterCultivate = createAsyncThunk(
  "clusters/addClusterCultivate",
  async (data, { rejectWithValue }) => {
    try {
      const res = await ClusterCultivateApi.create(data);
      toast.success("Cluster Cultivate added successfully");
      return res.data;
    } catch (error) {
      toast.error("Failed to add Cluster Product");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 🔹 Update
export const updateClusterCultivate = createAsyncThunk(
  "clusters/updateClusterCultivate",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await ClusterCultivateApi.update(id, data);
      toast.success("Cluster Cultivate updated successfully");
      return res.data;
    } catch (error) {
      toast.error("Failed to update Cluster Product");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 🔹 Delete
export const deleteClusterCultivate = createAsyncThunk(
  "clusters/deleteClusterCultivate",
  async (id, { rejectWithValue }) => {
    try {
      const res = await ClusterCultivateApi.delete(id);
      toast.success("Cluster Cultivate deleted successfully");
      return { id, data: res.data };
    } catch (error) {
      toast.error("Failed to delete Cluster Product");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const clusterCultivateSlice = createSlice({
  name: "clusterCultivate",
  initialState: {
    clusterCultivate: [],
    status: "",
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClustersCultivate.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchClustersCultivate.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.clusterCultivate = action.payload.data || [];
      })
      .addCase(fetchClustersCultivate.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Add
      .addCase(addClusterCultivate.fulfilled, (state, action) => {
        state.clusterCultivate.push(action.payload.data);
      })

      // Update
      .addCase(updateClusterCultivate.fulfilled, (state, action) => {
        const index = state.clusterCultivate.findIndex(
          (item) => item.id === action.payload.data.id
        );
        if (index !== -1) {
          state.clusterCultivate[index] = action.payload.data;
        }
      })

      // Delete
      .addCase(deleteClusterCultivate.fulfilled, (state, action) => {
        state.clusterCultivate = state.clusterCultivate.filter(
          (item) => item.id !== action.payload.id
        );
      });
  },
});

export default clusterCultivateSlice.reducer;
