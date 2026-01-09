import { api } from "./axios";

const employeeAPI = {
  getAll: () => api.get("/employees/all"),
};

export default employeeAPI;
