const express = require("express");
const clusterTransactionRoutes = express.Router();
const clusterTransactionController = require("../controllers/clusterTransaction.controller");

clusterTransactionRoutes.post("/", clusterTransactionController.create);
clusterTransactionRoutes.get(
  "/",
  clusterTransactionController.getAllClusterTransaction
);
clusterTransactionRoutes.delete(
  "/:id",
  clusterTransactionController.removeClusterTransaction
);

module.exports = clusterTransactionRoutes;
