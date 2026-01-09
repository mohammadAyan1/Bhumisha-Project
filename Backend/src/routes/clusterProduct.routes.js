const express = require("express");
const clusterProductsController = require("../controllers/clusterProducts.controller");
const router = express.Router();

router.get("/", clusterProductsController.getClusterProducts);
router.get("/given", clusterProductsController.getGivenClusterProducts);
router.get("/received", clusterProductsController.getReceivedClusterProducts);
router.post("/", clusterProductsController.createClusterProduct);
router.put("/:id", clusterProductsController.updateClusterProduct);
router.delete("/:id", clusterProductsController.deleteClusterProduct);

module.exports = router;
