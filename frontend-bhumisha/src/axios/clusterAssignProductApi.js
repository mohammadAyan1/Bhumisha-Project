import { api } from "./axios";

// ✅ Category API calls
const clusterProductAssignApi = {
  create: (data) => api.post("/clusters-assign-products", data),
  getAllAssign: () => api.get("/clusters-assign-products"),
  getAllGiven: () => api.get("/clusters-assign-products/given"),
  getAllReceived: () => api.get("/clusters-assign-products/received"),
  update: (id, data) => api.put(`/clusters-assign-products/${id}`, data),
  remove: (id) => api.delete(`/clusters-assign-products/${id}`),
  updateStatus: (id, status) =>
    api.patch(`/clusters-assign-products/${id}/status`, { status }),
};

export default clusterProductAssignApi;


