import { api } from "./axios";

// ✅ Product API calls
const productAPI = {
  create: (data) => api.post("/products", data),
  createCustom: (data) => api.post("/products/custom", data),
  getAll: () => api.get("/products"),
  getById: (id) => api.get(`/products/${id}`),
  getCustomProductById: (id) => api.get(`/products/custom/${id}`),
  update: (id, data) => api.put(`/products/${id}`, data),
  updateCustomProduct: (id, data) => api.put(`/products/custom/${id}`, data),
  remove: (id) => api.delete(`/products/${id}`),
};

export default productAPI;
