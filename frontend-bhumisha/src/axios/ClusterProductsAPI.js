import { api } from "./axios";

// ✅ Category API calls
const clusterProductsApi = {
  create: (data) => api.post("/clusters-second-products", data),
  getAll: () => api.get("/clusters-second-products"),
  update: (id, data) => api.put(`/clusters-second-products/${id}`, data),
  remove: (id) => api.delete(`/clusters-second-products/${id}`),
};

export default clusterProductsApi;
