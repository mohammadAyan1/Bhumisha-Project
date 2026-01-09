const express = require("express");
const SalesOrderRouter = express.Router();
const salesOrderController = require("../controllers/salesOrder.controller");
const { requireAuth } = require("../middlewares/auth");
// Create SO (header + items)
SalesOrderRouter.post("/", requireAuth, salesOrderController.create);

// Get all SOs (grouped + summary)
SalesOrderRouter.get("/", requireAuth, salesOrderController.getAll);

// Get single SO
SalesOrderRouter.get("/:id", salesOrderController.getById);

// Update SO (header + upsert items)
SalesOrderRouter.put("/:id", requireAuth, salesOrderController.update);

// Delete SO (items then header)
SalesOrderRouter.delete("/:id", requireAuth, salesOrderController.delete);

// Get SO data for creating sale
SalesOrderRouter.get(
  "/:id/for-sale",
  requireAuth,
  salesOrderController.getForSale
);

// Invoice payload
SalesOrderRouter.get(
  "/:id/invoice",
  requireAuth,
  salesOrderController.getInvoice
);

module.exports = SalesOrderRouter;
