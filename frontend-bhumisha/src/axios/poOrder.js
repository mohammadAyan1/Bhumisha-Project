import { api } from "./axios";

// ✅ Product API calls


const PurchaseOrder = {
  remove: (id) => api.delete(`/poorderremove/${id}`),
};

export default PurchaseOrder;
