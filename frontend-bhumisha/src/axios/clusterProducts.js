import { api } from "./axios";

// ✅ Category API calls
const clusterProductsApi = {
  create: (data) => api.post("/clusters-products", data),
  getAll: () => api.get("/clusters-products"),
  getAllGiven: () => api.get("/clusters-products/given"),
  getAllReceived: () => api.get("/clusters-products/received"),
  update: (id, data) => api.put(`/clusters-products/${id}`, data),
  remove: (id) => api.delete(`/clusters-products/${id}`),
  updateStatus: (id, status) =>
    api.patch(`/clusters-products/${id}/status`, { status }),
};

export default clusterProductsApi;
