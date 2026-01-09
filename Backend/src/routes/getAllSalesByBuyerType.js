const express = require("express");
const AllSalesRouterByBuyerType = express.Router();
const allsalesByBuyerType = require("../controllers/getAllSalesByBuyerType.controller");

// Get all retail sales bills with items

AllSalesRouterByBuyerType.post(
  "/gst-total",
  allsalesByBuyerType.getAllGstAmount
);
AllSalesRouterByBuyerType.post("/:type", allsalesByBuyerType.getAllRetailSales);

module.exports = AllSalesRouterByBuyerType;
