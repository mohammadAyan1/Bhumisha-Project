import { api } from "./axios";

// ✅ Farmer API calls
const farmApi = {
  create: (data) => api.post("/farm", data),
  getAll: () => api.get("/farm"),
  getFarmByFarmerId: (id) =>
    api.get(`/farm/farmerId/${id}`, { params: { id } }),

  update: (id, data) => api.put(`/farm/${id}`, data),
  remove: (id) => api.delete(`/farm/${id}`),
  updateStatus: (id, status) => api.patch(`/farm/${id}/status`, { status }),
  getStatement: (id, params) => api.get(`/farm/${id}/statement`, { params }),
};

export default farmApi;
