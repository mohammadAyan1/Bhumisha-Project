import { api } from "./axios";

const clusterTransactionApi = {
  create: (data) => api.post("/cluster-transaction", data),
  getAll: () => api.get("/cluster-transaction"),
  delete: (id) => api.delete(`/cluster-transaction/${id}`),
};

export default clusterTransactionApi;
