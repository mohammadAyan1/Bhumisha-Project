import { api } from "./axios";

// ✅ Category API calls
const ClusterInventoryApi = {
  create: (data) => api.post("/clusters-inventory", data),
  getAll: () => api.get("/clusters-inventory"),
  getClusterInventoryByClusterId: (id) =>
    api.get(`/clusters-inventory/${id}`, { params: { id } }),

  getClusterProductByPurchases: () => api.get("cluster-inventory/bypurchases"),
  update: (id, data) => api.put(`/clusters-inventory/${id}`, data),
  remove: (id) => api.delete(`/clusters-inventory/${id}`),
  updateStatus: (id, status) =>
    api.patch(`/clusters-inventory/${id}/status`, { status }),
};

export default ClusterInventoryApi;
