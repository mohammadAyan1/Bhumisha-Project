import { api } from "./axios";

// ✅ Product API calls
const trashProductAPI = {
  create: (data) => api.post("/products/trash", data),
  //   createCustom: (data) => api.post("/products/custom", data),
  getAll: () => api.get("/products/trash"),
  getById: (id) => api.get(`/products/trash/${id}`),
  //   getCustomProductById: (id) => api.get(`/products/custom/${id}`),
  update: (id, data) => api.put(`/products/trash/${id}`, data),
  //   updateCustomProduct: (id, data) => api.put(`/products/custom/${id}`, data),
  remove: (id) => api.delete(`/products/trash/${id}`),
};

export default trashProductAPI;
