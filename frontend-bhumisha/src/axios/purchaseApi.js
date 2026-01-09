// src/api/purchase.api.js
import { api } from "./axios";

// Helper: attach company header if not set by interceptors
const withCompany = (config = {}) => {
  const company =
    localStorage.getItem("company_code") ||
    sessionStorage.getItem("company_code") ||
    "";
  return {
    ...config,
    headers: {
      ...(config.headers || {}),
      "x-company-code": company,
    },
  };
};

const PurchaseAPI = {
  // LIST
  getAll: () => api.get("/purchase", withCompany()),

  // DETAIL
  getById: (id) => api.get(`/purchase/${id}`, withCompany()),

  // CREATE (multipart)
  // FormData must include:
  // - key "data": Blob(JSON.stringify(payload), "application/json") OR stringified JSON
  // - key "bill_img": File (optional)
  // Note: Do NOT set Content-Type manually; let Axios set multipart boundaries.
  create: (formData) => api.post("/purchase", formData, withCompany()),

  // UPDATE (multipart)
  update: (id, formData) => api.put(`/purchase/${id}`, formData, withCompany()),

  // DELETE (if supported backend-side)
  delete: (id) => api.delete(`/purchase/${id}`, withCompany()),

  // Prefill from PO for create flow
  getPOForPurchase: (poId) =>
    api.get(`/purchase-orders/${poId}/for-purchase`, withCompany()),
};

export default PurchaseAPI;
