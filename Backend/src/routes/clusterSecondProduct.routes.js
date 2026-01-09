const express = require("express");
const secondClusterProducts = require("../controllers/ClusterSecondController");

const clusterSecondRoutes = express.Router();

clusterSecondRoutes.post("/", secondClusterProducts.create);
clusterSecondRoutes.get("/", secondClusterProducts.getAll);
clusterSecondRoutes.put("/:id", secondClusterProducts.update);
clusterSecondRoutes.delete("/:id", secondClusterProducts.delete);

module.exports = clusterSecondRoutes;
