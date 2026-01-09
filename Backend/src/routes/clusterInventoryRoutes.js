const express = require("express");
const clusterInventoryController = require("../controllers/clusterInventoryController");
const clusterInventoryRoutes = express.Router();

clusterInventoryRoutes.get("/", clusterInventoryController.getClusterInventory);
clusterInventoryRoutes.post(
  "/",
  clusterInventoryController.createClusterInventory
);
clusterInventoryRoutes.get(
  "/bypurchases",
  clusterInventoryController.getClusterProductByPurchases
);
clusterInventoryRoutes.get(
  "/:id",
  clusterInventoryController.getClusterInventoryByClusterId
);

clusterInventoryRoutes.put("/:id", clusterInventoryController.updateCluster);
clusterInventoryRoutes.delete("/:id", clusterInventoryController.deleteCluster);

module.exports = clusterInventoryRoutes;
