const express = require("express");
const {
  getClusters,
  createCluster,
  updateCluster,
  deleteCluster,
} = require("../controllers/cluster.controller");
const clusterRoutes = express.Router();

clusterRoutes.get("/", getClusters);
clusterRoutes.post("/", createCluster);
clusterRoutes.put("/:id", updateCluster);
clusterRoutes.delete("/:id", deleteCluster);
module.exports = clusterRoutes;
