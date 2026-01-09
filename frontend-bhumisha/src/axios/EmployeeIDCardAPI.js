import { api } from "./axios";

const EmployeeIDCardAPI = {
  getById: (employeeId) => api.get(`/employees/${employeeId}`),
};

export default EmployeeIDCardAPI;
