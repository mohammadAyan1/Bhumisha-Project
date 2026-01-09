// src/axios/getAllPurchaseBill.js
import { api } from "./axios";

const getAllPurchaseBill = {
  getAll: (companies) => api.post("/allpurchases/bills", { data: companies }),
};

export default getAllPurchaseBill;
