const express = require("express");
const purchaseRoutes = express.Router();
const upload = require("../middlewares/upload");
const purchaseController = require("../controllers/purchase.controller");

// Create (multipart)
purchaseRoutes.post("/", upload.single("bill_img"), purchaseController.create);

// List
purchaseRoutes.get("/", purchaseController.getAll);

// Detail
purchaseRoutes.get("/:id", purchaseController.getById);

// Update (multipart)
purchaseRoutes.put(
  "/:id",
  upload.single("bill_img"),
  purchaseController.update
);

module.exports = purchaseRoutes;
