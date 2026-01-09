import { api } from "./axios";

const farmerAPI = {
  create: (data) => api.post("/farmers", data),
  getAll: () => api.get("/farmers"),
  update: (id, data) => api.put(`/farmers/${id}`, data),
  remove: (id) => api.delete(`/farmers/${id}`),
  updateStatus: (id, status) => api.patch(`/farmers/${id}/status`, { status }),
  getStatement: (id, params) => api.get(`/farmers/${id}/statement`, { params }),
  getInvoiceDetails: (farmerId, invoiceId, type) =>
    api.get(`/farmers/${farmerId}/invoice/${type}/${invoiceId}`),
};

export default farmerAPI;
