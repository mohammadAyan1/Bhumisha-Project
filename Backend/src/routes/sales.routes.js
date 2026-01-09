// routes/sales.routes.js
const express = require("express");
const salesRoutes = express.Router();
const SalesController = require("../controllers/sales.controller");
const { requireAuth } = require("../middlewares/auth");

// New bill number
salesRoutes.get("/new-bill-no", requireAuth, SalesController.getNewBillNo);

// CRUD
salesRoutes.post("/", requireAuth, SalesController.createSale);
salesRoutes.get("/", requireAuth, SalesController.getSales);

salesRoutes.get("/:id", SalesController.getSaleByIdWithItems);
salesRoutes.put("/:id", requireAuth, SalesController.updateSale);
salesRoutes.delete("/:id", requireAuth, SalesController.deleteSale);
// Previous due
salesRoutes.get(
  "/party/:type/:id/previous-due",
  requireAuth,
  SalesController.getPartyPreviousDue
);

// Get SO for sale creation
salesRoutes.get("/from-so/:id", requireAuth, SalesController.getFromSO);

module.exports = salesRoutes;
