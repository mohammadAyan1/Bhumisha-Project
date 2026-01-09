const express = require("express");
const AllPurchasesBillController = require("../controllers/getallpurchasebill.controller");
const AllPurchasesBillRoutes = express.Router();



AllPurchasesBillRoutes.post(
  "/bills",
  AllPurchasesBillController.getAllPurchasesBills
);

module.exports = AllPurchasesBillRoutes;
