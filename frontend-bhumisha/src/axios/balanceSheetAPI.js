import { api } from "./axios";

const balanceSheetAPI = {
  // Get balance sheet data
  getBalanceSheet: (params) => api.get("/balance-sheet", { params }),

  // Get sales bill items
  getSalesBillItems: (saleId) =>
    api.get(`/balance-sheet/sales/${saleId}/items`),

  // Get purchases bill items
  getPurchasesBillItems: (purchaseId) =>
    api.get(`/balance-sheet/purchases/${purchaseId}/items`),
};

export default balanceSheetAPI;
