// import { api } from "./axios";

// // ✅ Category API calls
// const ClusterCultivateApi = {
//   create: (data) => api.post("/clusters-cultivate", data),
//   getAll: () => api.get("/clusters-cultivate"),
//   delete: (id) => api.put(`/clusters-cultivate/${id}`, { params: { id } }),
// };

// export default ClusterCultivateApi;


import { api } from "./axios";

const ClusterCultivateApi = {
  create: (data) => api.post("/clusters-cultivate", data),
  getAll: () => api.get("/clusters-cultivate"),
  update: (id, data) => api.put(`/clusters-cultivate/${id}`, data),
  delete: (id) => api.delete(`/clusters-cultivate/${id}`),
};

export default ClusterCultivateApi;