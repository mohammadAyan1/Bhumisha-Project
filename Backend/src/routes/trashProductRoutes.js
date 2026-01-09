const express = require("express");
const productRoutes = express.Router();
const {
  updateTrashProduct,
  deleteTrashProduct,
  createTrashProduct,
  getTrashProducts,
} = require("../controllers/product.Controller");

productRoutes.post("/trash", createTrashProduct);
productRoutes.get("/trash", getTrashProducts);
productRoutes.put("/trash/:id", updateTrashProduct);
productRoutes.delete("/trash/:id", deleteTrashProduct);
