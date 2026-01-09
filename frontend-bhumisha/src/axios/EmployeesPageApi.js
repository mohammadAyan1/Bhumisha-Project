import { api } from "./axios";

const EmployeePageApi = {
  create: (fd) => api.post("/employees/create", fd),
  edit: (fd, editID) => api.put(`/employees/edit${editID}`, fd),
  delete: (editID) => api.delete(`/employees/delete/${editID}`),
};

export default EmployeePageApi;
