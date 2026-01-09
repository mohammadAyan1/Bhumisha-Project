import { api } from "./axios";

// ✅ Category API calls
const holidayAPI = {
  create: (data) => api.post("/holiday", data),
  update: (data) => api.put(`/holiday/${data?.id}`, data),
  getAll: () => api.get("/holiday"),
  delete: (id) => api.delete(`/holiday/${id}`),
};

export default holidayAPI;
