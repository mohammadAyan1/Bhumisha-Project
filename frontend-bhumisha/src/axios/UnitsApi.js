import { api } from "./axios";

// ✅ Product API calls
const unitsApi = {
  create: (data) => api.post("/unit", data),
};

export default unitsApi;
