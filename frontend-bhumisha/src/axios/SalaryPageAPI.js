import { api } from "./axios";

const salaryPageAPI = {
  generate: (payload) => api.post("/salary/generate", payload),
  getReport: (id, year, month, toDate) =>
    api.get(
      `/salary/employee/${id}?year=${year}&month=${month}&toDate=${toDate}`
    ),
};

export default salaryPageAPI;
