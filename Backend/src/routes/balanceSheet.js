const express = require("express");
const router = express.Router();
const balanceSheetController = require("../controllers/balanceSheet.controller");

// Get balance sheet data
router.get("/", balanceSheetController.getBalanceSheet);

router.get("/sales/:id/items", balanceSheetController.getSalesBillItems);

router.get(
  "/purchases/:id/items",
  balanceSheetController.getPurchasesBillItems
);

module.exports = router;
