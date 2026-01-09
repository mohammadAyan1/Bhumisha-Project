import { api } from "./axios";

// ✅ Category API calls
const clusterApi = {
  create: (data) => api.post("/clusters", data),
  getAll: () => api.get("/clusters"),
  update: (id, data) => api.put(`/clusters/${id}`, data),
  remove: (id) => api.delete(`/clusters/${id}`),
  updateStatus: (id, status) => api.patch(`/clusters/${id}/status`, { status }),
};

export default clusterApi;
