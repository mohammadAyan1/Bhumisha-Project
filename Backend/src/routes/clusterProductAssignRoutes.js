const express = require("express");
const clusterProductAssignRoutes = express.Router();
const clusterAssignProductController = require("../controllers/clusterAssignProduct.controller");

// Get all retail sales bills with items

clusterProductAssignRoutes.get(
  "/",
  clusterAssignProductController.getAllAssignedProducts
);
clusterProductAssignRoutes.post(
  "/",
  clusterAssignProductController.assignProductToCluster
);

module.exports = clusterProductAssignRoutes;
