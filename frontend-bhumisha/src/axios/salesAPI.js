// Use shared api instance so request interceptor (x-company-code) is applied
import { api } from "./axios";

const salesAPI = {
  getAll: () => api.get("/sales"),
  // getById: (id) => api.get(`/sales/${id}`),
  // src/axios/salesAPI.js
  getById: (id, config = {}) => api.get(`/sales/${id}`, config),

  create: (data) => api.post("/sales", data),
  update: (id, data) => api.put(`/sales/${id}`, data),
  delete: (id) => api.delete(`/sales/${id}`),
  getNewBillNo: () => api.get("/sales/new-bill-no"),
  getPartyPreviousDue: (type, id) =>
    api.get(`/sales/party/${type}/${id}/previous-due`),
  getFromSO: (id) => api.get(`/sales/from-so/${id}`),
};

export default salesAPI;
