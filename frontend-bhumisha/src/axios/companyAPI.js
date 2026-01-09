import { api } from "./axios";

const companyAPI = {
  create: (payload) => api.post("/companies", payload),
  getAll: () => api.get("/companies"),
  update: (id, payload, config = {}) =>
    api.put(`/companies/${id}`, payload, config),
};

export default companyAPI;
