const express = require("express");
const productRoutes = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  createCustomProduct,
  getByIdCustomProduct,
  updateCustomProduct,
  createTrashProduct,
  getTrashProducts,
  updateTrashProduct,
  deleteTrashProduct,
} = require("../controllers/product.Controller");

productRoutes.delete("/:id", deleteProduct); // Delete one product row

productRoutes.post("/trash", createTrashProduct);
productRoutes.get("/trash", getTrashProducts);
productRoutes.put("/trash/:id", updateTrashProduct);
productRoutes.delete("/trash/:id", deleteTrashProduct);

productRoutes.post("/", createProduct); // Add new product row (size/discount)
productRoutes.post("/custom", createCustomProduct); // Add new product row (size/discount)
productRoutes.put("/custom/:id", updateCustomProduct); // Add new product row (size/discount)
productRoutes.get("/custom/:id", getByIdCustomProduct); // Add new product row (size/discount)
productRoutes.get("/", getProducts); // Get all products (with category)
productRoutes.get("/:id", getProductById); // Get one product row
productRoutes.put("/:id", updateProduct); // Update one product row

//trash product routes

module.exports = productRoutes;
