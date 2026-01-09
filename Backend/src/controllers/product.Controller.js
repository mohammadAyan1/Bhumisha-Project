const Product = require("../models/productsModel");
const db = require("../config/db");

const convertAllWeightInGram = (qty, unit) => {
  switch (unit) {
    case "kg":
      return qty * 1000;
    case "litter":
      return qty * 1000;
    case "ton":
      return qty * 1000 * 1000;
    case "quantal":
      return qty * 1000 * 100;
    case "gram":
      return qty;
    default:
      throw new Error(`Unsupported unit: ${unit}`);
  }
};

const validate = (body, isCreate = true) => {
  const errors = [];
  if (isCreate && (body.category_id === undefined || body.category_id === "")) {
    errors.push("category_id is required");
  }
  if (
    isCreate &&
    (body.product_name === undefined || String(body.product_name).trim() === "")
  ) {
    errors.push("product_name is required");
  }
  if (body.size !== undefined && String(body.size).length > 64) {
    errors.push("size too long (max 64)");
  }
  const numericFields = [
    "purchase_rate",
    "transport_charge",
    "local_transport",
    "packaging_cost",
    "packing_weight",
    "value",
    "discount_30",
    "discount_25",
    "discount_50",
    "total",
    "gst",
  ];
  numericFields.forEach((f) => {
    if (body[f] !== undefined && body[f] !== null && body[f] !== "") {
      if (isNaN(Number(body[f]))) errors.push(`${f} must be a number`);
    }
  });
  return errors;
};

// update trash record and adjust product stock by delta
const updateTrashProduct = (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "invalid id" });

  Product.updateTrashProduct(id, req.body, (err, result) => {
    if (err) return res.status(500).json(safeErr(err));
    return res.json(result || { message: "Trash updated" });
  });
};

// delete trash record and restore product stock
const deleteTrashProduct = (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "invalid id" });

  Product.deleteTrashProduct(id, (err, result) => {
    if (err) return res.status(500).json(safeErr(err));
    return res.json(result || { message: "Trash deleted" });
  });
};

const safeErr = (err) => ({
  error: err?.sqlMessage || err?.message || String(err),
});

// Create (same)
const createProduct = (req, res) => {
  const errors = validate(req.body, true);
  if (errors.length) return res.status(400).json({ errors });
  Product.create(req.body, (err, result) => {
    if (err) return res.status(500).json(safeErr(err));
    return res
      .status(201)
      .json({ message: "Product created", id: result.insertId });
  });
};

// Create custom product endpoint
const createCustomProduct = (req, res) => {
  try {
    // Validate request
    if (!req.body.customProductName?.trim()) {
      return res.status(400).json({ error: "Product name is required" });
    }

    if (
      !Array.isArray(req.body.selectedProductIds) ||
      req.body.selectedProductIds.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "At least one ingredient is required" });
    }

    // Create the custom product
    Product.createCustomProduct(req.body, (err, createResult) => {
      if (err) {
        console.error("Create product error:", err);
        return res.status(500).json({
          error: "Failed to create custom product",
          details: err.sqlMessage || err.message,
        });
      }

      const newProductId = createResult.insertId;
      const updates = req.body.selectedProductIds;

      // If no updates needed, return success
      if (updates.length === 0) {
        return res.status(201).json({
          success: true,
          message: "Custom Product created successfully",
          productId: newProductId,
        });
      }

      // Track updates
      let completedUpdates = 0;
      let hasUpdateError = false;
      let updateErrors = [];

      // Update ingredient quantities
      for (const item of updates) {
        const qtyInGram = convertAllWeightInGram(item?.qty, item?.selectedUnit);

        db.query(
          `UPDATE products SET size = size - ? WHERE id = ? AND size >= ?`,
          [qtyInGram, item?.productId, qtyInGram],
          (updateErr, updateResult) => {
            completedUpdates++;

            if (updateErr) {
              console.error(
                `Update error for product ${item?.productId}:`,
                updateErr
              );
              hasUpdateError = true;
              updateErrors.push({
                productId: item?.productId,
                error: updateErr.sqlMessage || updateErr.message,
              });
            } else if (updateResult.affectedRows === 0) {
              // No rows updated - product not found or insufficient quantity
              hasUpdateError = true;
              updateErrors.push({
                productId: item?.productId,
                error: "Product not found or insufficient quantity",
              });
            }

            // When all updates are processed
            if (completedUpdates === updates.length) {
              if (hasUpdateError) {
                // Product was created but updates failed
                return res.status(207).json({
                  // 207 Multi-Status
                  success: true,
                  message:
                    "Custom Product created but some ingredient updates failed",
                  productId: newProductId,
                  updateErrors: updateErrors,
                  warning: "Please check ingredient quantities manually",
                });
              } else {
                // Everything successful
                return res.status(201).json({
                  success: true,
                  message:
                    "Custom Product created and ingredients updated successfully",
                  productId: newProductId,
                });
              }
            }
          }
        );
      }
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

const getByIdCustomProduct = (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "invalid id" });
  Product.getCustomProductById(id, (err, result) => {
    if (err) return res.status(500).json(safeErr(err));
    if (!Array.isArray(result) || result.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.json(result[0]);
  });
};

// List (same)
const getProducts = (req, res) => {
  Product.getAll((err, results) => {
    if (err) return res.status(500).json(safeErr(err));
    return res.json(results);
  });
};

// Get one (same)
const getProductById = (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "invalid id" });
  Product.getById(id, (err, result) => {
    if (err) return res.status(500).json(safeErr(err));
    if (!Array.isArray(result) || result.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.json(result[0]);
  });
};

// Update (sanitizer + whitelist + partial)
const updateProduct = (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "invalid id" });

  // 1) Drop empty strings so they don't overwrite
  const clean = {};
  Object.entries(req.body || {}).forEach(([k, v]) => {
    if (v !== "") clean[k] = v;
  });

  // 2) Whitelist only known fields
  const allowed = new Set([
    "category_id",
    "product_name",
    "size",
    "unit",
    "purchase_rate",
    "transport_charge",
    "local_transport",
    "packaging_cost",
    "packing_weight",
    "hsn_code",
    "value",
    "discount_30",
    "discount_25",
    "discount_50",
    "total",
    "gst",
  ]);
  const filtered = {};
  Object.keys(clean).forEach((k) => {
    if (allowed.has(k)) filtered[k] = clean[k];
  });

  const errors = validate(filtered, false);
  if (errors.length) return res.status(400).json({ errors });

  // 3) If nothing to update, short-circuit
  if (!Object.keys(filtered).length) {
    return res.json({ message: "Nothing to update" });
  }

  Product.update(id, filtered, (err) => {
    if (err) return res.status(500).json(safeErr(err));
    return res.json({ message: "Product updated" });
  });
};

const updateCustomProduct = (req, res) => {
  const id = Number(req.params.id);

  if (!id) return res.status(400).json({ error: "invalid id" });

  Product.updateCustomProduct(id, req.body, (err) => {
    if (err) return res.status(500).json(safeErr(err));
    return res.json({ message: "Product updated" });
  });
};

// Delete (same)
const deleteProduct = (req, res) => {
  const id = Number(req.params.id);

  if (!id) return res.status(400).json({ error: "invalid id" });
  Product.delete(id, (err) => {
    if (err) return res.status(500).json(safeErr(err));
    return res.json({ message: "Product deleted" });
  });
};

// Trash product Controller

// create a trash product
const createTrashProduct = (req, res) => {
  Product.createTrashProduct(req.body, (err, result) => {
    if (err) return res.status(500).json(safeErr(err));
    return res
      .status(201)
      .json({ message: "Product created", id: result.insertId });
  });
};
// fetch all trash product
const getTrashProducts = (req, res) => {
  Product.getAllTrashProduct((err, results) => {
    if (err) return res.status(500).json(safeErr(err));
    return res.json(results);
  });
};

module.exports = {
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
};
