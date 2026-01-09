const db = require("../config/db");

const calculateQtyIngram = (qty, unit) => {
  if (unit == "kg" || unit == "litter") {
    return Number(qty) * 1000;
  } else if (unit == "ton") {
    return Number(qty) * 1000 * 1000;
  } else if (unit == "quantal") {
    return Number(qty) * 1000 * 100;
  } else return qty;
};

const Product = {
  // Update a trash record and adjust product stock by the delta
  updateTrashProduct: (id, data, cb) => {
    const selectSql = `
      SELECT quantity, product_id
      FROM product_details
      WHERE id = ?
    `;

    db.query(selectSql, [id], (err, rows) => {
      if (err) return cb(err);
      if (!rows || rows.length === 0)
        return cb({ message: "Trash record not found" });

      const prevQty = Number(rows[0].quantity) || 0;
      const productId = rows[0].product_id;
      // const newQty = Number(data?.trashQuantity);
      const newQty = calculateQtyIngram(data?.trashQuantity, data?.unit);
      const remark = data?.remark || "";
      const unit = data?.unit;

      // delta = new - old; stock change should be -delta (because trash removes stock)
      const delta = newQty - prevQty;

      const updateTrashSql = `
        UPDATE product_details
        SET quantity = ?, remark = ?,unit=?
        WHERE id = ?
      `;

      db.query(updateTrashSql, [newQty, remark, unit, id], (err2) => {
        if (err2) return cb(err2);

        if (delta === 0) return cb(null, { message: "No change" });

        const updateStockSql = `
          UPDATE products
          SET size = size ${delta > 0 ? "-" : "+"} ?
          WHERE id = ?
        `;

        const qtyChange = Math.abs(delta);
        db.query(updateStockSql, [qtyChange, productId], (err3, res3) => {
          if (err3) return cb(err3);
          cb(null, { message: "Trash record updated and stock adjusted" });
        });
      });
    });
  },

  // Delete a trash record and restore the product stock by its quantity
  deleteTrashProduct: (id, cb) => {
    const selectSql = `
      SELECT quantity, product_id
      FROM product_details
      WHERE id = ?
    `;

    db.query(selectSql, [id], (err, rows) => {
      if (err) return cb(err);
      if (!rows || rows.length === 0)
        return cb({ message: "Trash record not found" });

      const qty = Number(rows[0].quantity) || 0;
      const productId = rows[0].product_id;

      const deleteSql = `UPDATE  product_details SET status='Inactive' WHERE id = ?`;
      db.query(deleteSql, [id], (err2) => {
        if (err2) return cb(err2);

        const restoreSql = `
          UPDATE products
          SET size = size + ?
          WHERE id = ?
        `;
        db.query(restoreSql, [qty, productId], (err3) => {
          if (err3) return cb(err3);
          cb(null, { message: "Trash record deleted and stock restored" });
        });
      });
    });
  },

  create: (data, cb) => {
    const sql = `
      INSERT INTO products
      (category_id, product_name, size,unit, purchase_rate, transport_charge, local_transport, packaging_cost, packing_weight, hsn_code, value, discount_30, discount_25, discount_50, total, gst)
      VALUES (?, ?, ?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
    `;
    db.query(
      sql,
      [
        data.category_id,
        data.product_name,
        data.size,
        data.unit || "kg",
        data.purchase_rate,
        data.transport_charge,
        data.local_transport,
        data.packaging_cost,
        data.packing_weight,
        data.hsn_code,
        data.value,
        data.discount_30,
        data.discount_25,
        data.discount_50,
        data.total,
        data.gst,
      ],
      cb
    );
  },

  createCustomProduct: (data, callback) => {
    try {
      // Validation
      if (!data.customProductName?.trim()) {
        return callback(new Error("Product name is required"));
      }

      if (
        !Array.isArray(data.selectedProductIds) ||
        data.selectedProductIds.length === 0
      ) {
        return callback(new Error("At least one ingredient is required"));
      }

      // Convert ingredients array to JSON string
      const ingredientsJson = JSON.stringify(data.selectedProductIds);

      // SQL Insert query - Updated to match actual database schema
      const sql = `
        INSERT INTO products (
          category_id,
          product_name,
          size,
          unit,
          purchase_rate,
          transport_charge,
          local_transport,
          packaging_cost,
          packing_weight,
          hsn_code,
          value,
          discount_30,
          discount_25,
          discount_50,
          total,
          gst,
          type,
          ingredients
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        data.categoryId || null,
        data.customProductName.trim(),
        data.customQty || 0, // Changed from null to 0 for numeric column
        data.unit || null,
        data.customPurchaseRate || 0,
        data.transportRate || 0,
        data.localTransport || 0,
        data.packagingCost || 0,
        data.packing_weight || 0,
        data.hsnCode || "",
        data.rawPrice || 0,
        data.margin30 || 0,
        data.margin25 || 0,
        data.margin50 || 0,
        data.customSaleRate || 0,
        data.gst || "0",
        "custom",
        ingredientsJson,
      ];

      // Execute query
      db.query(sql, params, (err, results) => {
        if (err) {
          console.error("Database Error:", {
            code: err.code,
            errno: err.errno,
            sqlMessage: err.sqlMessage,
            sqlState: err.sqlState,
          });
          return callback(err);
        }
        callback(null, results);
      });
    } catch (error) {
      console.error("Create product function error:", error);
      callback(error);
    }
  },

  getAll: (cb) => {
    const sql = `
      SELECT p.*, c.name AS category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.status='Active'
      ORDER BY c.name, p.product_name
    `;
    db.query(sql, cb);
  },

  getById: (id, cb) => {
    const sql = `
      SELECT p.*, c.name AS category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `;
    db.query(sql, [id], cb);
  },

  getCustomProductById: (id, cb) => {
    const sql = `
    SELECT p.*, c.name AS category_name
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `;

    db.query(sql, [id], (err, results) => {
      if (err) return cb(err);
      if (!results.length) return cb(null, []);

      const product = results[0];

      // ✅ Parse ingredients JSON (handles single, double, or already-parsed)
      let ingredients = [];
      try {
        const raw = product.ingredients;
        if (Array.isArray(raw)) ingredients = raw;
        else if (typeof raw === "object" && raw !== null) ingredients = [raw];
        else if (typeof raw === "string") {
          const first = JSON.parse(raw);
          ingredients = Array.isArray(first)
            ? first
            : JSON.parse(first || "[]");
        }
      } catch (e) {
        console.error("❌ Error parsing ingredients JSON:", e);
        ingredients = [];
      }

      if (!ingredients.length) {
        product.ingredientsData = [];
        return cb(null, [product]);
      }

      // ✅ Get all ingredient IDs
      const ingredientIds = ingredients.map((i) => i.productId);

      // ✅ Dynamic placeholders for IN clause
      const placeholders = ingredientIds.map(() => "?").join(",");

      const ingSql = `
      SELECT
        p.*,
        c.name AS category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id IN (${placeholders})
    `;

      db.query(ingSql, ingredientIds, (err2, ingResults) => {
        if (err2) return cb(err2);

        // ✅ Merge ingredient quantities from JSON
        const merged = ingResults.map((prod) => {
          const found = ingredients.find((i) => i.productId === prod.id);
          return { ...prod, qty: found?.qty || 0 };
        });

        // ✅ Attach ingredient product details
        product.ingredientsData = merged;

        cb(null, [product]);
      });
    });
  },

  update: (id, data, cb) => {
    const fields = [
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
      "type",
      "ingredients",
    ];
    const sets = [];
    const vals = [];
    fields.forEach((f) => {
      if (Object.prototype.hasOwnProperty.call(data, f)) {
        sets.push(`${f} = ?`);
        vals.push(data[f]);
      }
    });
    if (!sets.length) return cb(null, { affectedRows: 0 });

    const sql = `UPDATE products SET ${sets.join(", ")} WHERE id = ?`;
    vals.push(id);
    db.query(sql, vals, cb);
  },

  updateCustomProduct: (id, data, cb) => {
    try {
      const {
        customProductName,
        categoryId,
        hsnCode,
        gst,
        customQty,
        transportRate,
        localTransport,
        packagingCost,
        value,
        margin30,
        margin25,
        customPurchaseRate,
        customSaleRate,
        stockUpdates,
        selectedProductIds,
      } = data;
      console.log("====================================");
      console.log(data);
      console.log("====================================");

      // ✅ Convert ingredient array to JSON string for storage
      const ingredientsJson = JSON.stringify(
        selectedProductIds?.map((p) => {
          console.log(p);
          return {
            productId: p.id,
            qty: p.qty,
            rate: p.rate,
            salesRate: p.salesRate,
            availableQty: p.availableQty,
          };
        }) || []
      );

      // ✅ First update the custom product itself
      const sql = `
      UPDATE products
      SET
        category_id = ?,
        product_name = ?,
        size = ?,              -- customQty
        purchase_rate = ?,     -- customPurchaseRate
        transport_charge = ?,  -- transportRate
        local_transport = ?,   -- localTransport
        packaging_cost = ?,    -- packagingCost
        hsn_code = ?,          -- hsnCode
        value = ?,             -- value
        discount_30 = ?,       -- margin30
        discount_25 = ?,       -- margin25
        total = ?,             -- customSaleRate
        gst = ?,               -- gst
        type = 'custom',
        ingredients = ?,       -- JSON of ingredient products
        updated_at = NOW()
      WHERE id = ?
    `;

      const values = [
        categoryId,
        customProductName,
        customQty,
        customPurchaseRate,
        transportRate,
        localTransport,
        packagingCost,
        hsnCode,
        value,
        margin30,
        margin25,
        customSaleRate,
        gst,
        ingredientsJson,
        id,
      ];

      db.query(sql, values, (err, result) => {
        if (err) return cb(err);

        // ✅ After updating custom product, handle stock updates
        if (stockUpdates && typeof stockUpdates === "object") {
          const updates = Object.values(stockUpdates);

          updates.forEach((update) => {
            const { updatedQty } = update;
            if (updatedQty === 0) return;

            const key = Object.keys(stockUpdates);

            console.log(key);

            // If positive -> product used → decrease stock
            // If negative -> product returned → increase stock

            key.forEach((k) => {
              const updateSql = `
              UPDATE products
              SET size = size ${updatedQty > 0 ? "-" : "+"} ?
              WHERE id = ?
              `;

              const qtyChange = Math.abs(updatedQty);

              db.query(updateSql, [qtyChange, k], (err2) => {
                if (err2)
                  console.error(
                    `❌ Error updating stock for product ${key}:`,
                    err2
                  );
              });
            });
          });
        }

        cb(null, { message: "Custom product and stock updated successfully" });
      });
    } catch (err) {
      cb(err);
    }
  },

  delete: (id, cb) => {
    const sql = "UPDATE products SET status='Inactive' WHERE id=?";
    db.query(sql, [id], cb);
  },

  createTrashProduct: (data, cb) => {
    // handle both array or single object
    const items = Array.isArray(data) ? data : [data];

    const calculateQtyIngram = (qty, unit) => {
      if (unit == "kg" || unit == "litter") {
        return Number(qty) * 1000;
      } else if (unit == "ton") {
        return Number(qty) * 1000 * 1000;
      } else if (unit == "quantal") {
        return Number(qty) * 1000 * 100;
      } else return qty;
    };

    // Prepare insert values for trash table
    const values = items.map((item) => {
      const quantity = calculateQtyIngram(
        Number(item?.trashQuantity || 0),
        item?.unit
      );

      return [
        quantity,
        item?.remark || "",
        item?.productId,
        item?.unit,
        JSON.stringify(item),
      ];
    });

    const insertSql = `
    INSERT INTO product_details (quantity, remark, product_id,unit,selected_product)
    VALUES ?
  `;

    db.query(insertSql, [values], (err, result) => {
      if (err) return cb(err);

      // Now decrease product quantities in products table
      const updateTasks = items.map((item) => {
        // const trashQty = Number(item?.trashQuantity);
        const trashQty = calculateQtyIngram(
          Number(item?.trashQuantity || 0),
          item?.unit
        );
        const productId = item?.productId;

        const updateSql = `
        UPDATE products
        SET size = size - ?
        WHERE id = ?;
      `;
        return new Promise((resolve, reject) => {
          db.query(updateSql, [trashQty, productId], (err, res) => {
            if (err) reject(err);
            else resolve(res);
          });
        });
      });

      // Wait for all updates to finish
      Promise.all(updateTasks)
        .then(() =>
          cb(null, {
            success: true,
            message: "Trash product added and stock updated!",
          })
        )
        .catch(cb);
    });
  },

  getAllTrashProduct: (cb) => {
    const sql = `
      SELECT 
        tp.id AS trash_id,
        tp.quantity,
        tp.remark,
        tp.product_id,
        tp.unit AS trash_unit,
        p.*
      FROM product_details tp
      JOIN products p ON tp.product_id = p.id
      WHERE tp.status = 'Active' AND p.status = 'Active'
      ORDER BY p.product_name
    `;
    db.query(sql, cb);
  },
};

module.exports = Product;
