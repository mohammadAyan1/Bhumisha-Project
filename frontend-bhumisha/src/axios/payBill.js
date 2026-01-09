import { api } from "./axios";

const payBillAPI = {
  // Get all bills
  getAllBill: (params) => api.get(`/bills?${params}`),

  // Get bill details
  getBillDetails: (billType, billId) => api.get(`/bills/${billType}/${billId}`),

  // Create payment
  createPayment: (paymentData) => api.post(`/bills/payments`, paymentData),

  // Update payment - FIXED ENDPOINT
  updatePayment: (paymentId, paymentData) =>
    api.put(`/bills/payments/${paymentId}`, paymentData),

  // Delete payment
  deletePayment: (paymentId, paymentType) =>
    api.delete(`/bills/payments/${paymentId}/${paymentType}`),

  // Get payment by ID
  getPaymentById: (paymentId) => api.get(`/bills/payments/${paymentId}`),
};

export default payBillAPI;
