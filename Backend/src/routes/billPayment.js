const express = require("express");
const router = express.Router();
const billController = require("../controllers/billPayment.controller");

// Get all bills
router.get("/", billController.getAllBill);

// Get bill details
router.get("/:billType/:billId", billController.getBillDetails);

// Create payment
router.post("/payments", billController.createPayment);

// Update payment
router.put("/payments/:paymentId", billController.updatePayment);

// Delete payment
router.delete("/payments/:paymentId/:billType", billController.deletePayment);

// Get payment by ID
router.get("/payments/:paymentId", billController.getPaymentById);

module.exports = router;
