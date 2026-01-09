// src/axios/getAllPurchaseBill.js
import { api } from "./axios";

const getAllSalesBill = {
  getAll: (companies) => api.post("/allsales/bills", { data: companies }),

  getAllBillByMonth: (companies) => api.post("/allsales/currentmonth", { data: companies }),

  getAllRetaildSales: (companies, type) =>
    api.post(`/allsales-by-buyer-type/${type}`, { data: companies }),

  getGstAmount: (companies) =>
    api.post("/allsales-by-buyer-type/gst-total", { data: companies }),
};

export default getAllSalesBill;
