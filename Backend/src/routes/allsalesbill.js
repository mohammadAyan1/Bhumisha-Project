const express = require("express");
const AllSalesBillRouter = express.Router();
const allSalesBillController = require("../controllers/allsalesbill.controller");
// Get all sales bills with items
AllSalesBillRouter.post(
  "/bills",
  allSalesBillController.getAllSalesBillsWithItems
);

AllSalesBillRouter.post(
  "/currentmonth",
  allSalesBillController.getAllSalesBillsWithItemsCurrentMonth
);

module.exports = AllSalesBillRouter;
