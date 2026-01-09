import { api } from "./axios";

const IncentiveAPI = {
  getAllEmployee: () => api.get("/employees/all"),
  createIncentive: (form) => api.post("/incentives/create", form),
  updateIncentive: (form) => api.put(`/incentives/${form?.id}`, form),
  deleteIncentive: (id) => api.delete(`/incentives/${id}`),
  getAllIncentive: () => api.get("/incentives"),
};

export default IncentiveAPI;
