import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchClusters } from "../features/clusterAdded/ClusterAdded";
import { fetchClustersProduct } from "../features/clusterProduct/clusterProducts";
import { createClusterProduct } from "../features/cluster-product-assign/cluster-product-assign";

const toGrams = (value, unit) => {
  const n = Number(value) || 0;
  switch ((unit || "").toLowerCase()) {
    case "ton":
      return n * 1000000;
    case "quintal":
      return n * 100000;
    case "kg":
    case "kilogram":
      return n * 1000;
    case "gram":
    case "gm":
    default:
      return n;
  }
};

const fromGrams = (grams, unit) => {
  const g = Number(grams) || 0;
  switch ((unit || "").toLowerCase()) {
    case "ton":
      return g / 1000000;
    case "quintal":
      return g / 100000;
    case "kg":
    case "kilogram":
      return g / 1000;
    case "gram":
    case "gm":
    default:
      return g;
  }
};

const UNITS = ["ton", "quintal", "kg", "gram"];

const emptyRow = () => ({
  id: Date.now() + Math.random(), // unique row id
  productId: "",
  productName: "",
  availableGrams: 0,
  unit: "kg", // default unit for display/entry
  availableDisplay: 0, // computed value in chosen unit
  qty: "", // user-entered quantity in chosen unit
  rate: "",
});

const ClusterProductsAssign = () => {
  const dispatch = useDispatch();

  // products array (your clusterProducts list from slice)
  const { list: products = [] } = useSelector(
    (state) => state.clusterProducts || {}
  );
  // you were setting clusters locally earlier by dispatch(fetchClusters()).then(...)
  const [clusters, setClusters] = useState([]);

  // local rows state (multiple rows support)
  const [rows, setRows] = useState([emptyRow()]);

  // form-level fields
  const [selectedCluster, setSelectedCluster] = useState("");
  // load clusters on mount (robust against different payload shapes)
  useEffect(() => {
    dispatch(fetchClusters()).then((action) => {
      const payload = action?.payload;
      // payload might be an array or { success:true, data:[...] } or something else
      if (Array.isArray(payload)) setClusters(payload);
      else if (payload?.data && Array.isArray(payload.data))
        setClusters(payload.data);
      else if (payload?.clusters && Array.isArray(payload.clusters))
        setClusters(payload.clusters);
      else setClusters([]); // fallback
    });

    // fetch products (clusterProducts)
    dispatch(fetchClustersProduct());
  }, [dispatch]);

  // helper: update a row by id
  const updateRow = (rowId, patch) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r))
    );
  };

  // when product is selected for a row: populate available grams, name, rate default
  const handleProductChange = (rowId, productId) => {
    const product = products.find((p) => String(p.id) === String(productId));
    if (!product) {
      updateRow(rowId, {
        productId: "",
        productName: "",
        availableGrams: 0,
        availableDisplay: 0,
        qty: "",
        rate: "",
      });
      return;
    }

    // Your API stores quantity in grams (from your sample). We'll read product.quantity as grams.
    const availableGrams = Number(product.quantity) || 0;
    // choose the current row unit (if undefined default to kg)
    const row = rows.find((r) => r.id === rowId) || {};
    const unit = row.unit || "kg";
    const availableDisplay = fromGrams(availableGrams, unit);

    updateRow(rowId, {
      productId: productId,
      productName: product.name || product.product_name || "",
      availableGrams,
      availableDisplay,
      qty: "", // reset entered qty
      rate: product.rate || "",
    });
  };

  // when unit changes for a row: recompute availableDisplay and validate qty
  const handleUnitChange = (rowId, newUnit) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;
    const availableDisplay = fromGrams(row.availableGrams, newUnit);
    const enteredQty = Number(row.qty || 0);

    updateRow(rowId, { unit: newUnit, availableDisplay });

    // validation after state update (use setTimeout to ensure state applied) or compute immediately:
    if (enteredQty > availableDisplay) {
      alert("Entered quantity exceeds available quantity for selected unit.");
      // Optionally clamp value to availableDisplay or reset:
      updateRow(rowId, { qty: "" });
    } else if (enteredQty === availableDisplay) {
      // informational
      // you asked "if user quantity reached the available quantity according to the unit so it will give alert message"
      alert("Entered quantity equals the available quantity.");
    }
  };

  const handleQtyChange = (rowId, value) => {
    // allow numbers and dots only
    const normalized = value.replace(/[^\d.]/g, "");
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;
    const unit = row.unit || "kg";
    const available = row.availableDisplay || 0;
    const numeric = Number(normalized || 0);

    if (numeric > available) {
      alert("Entered quantity exceeds available quantity for selected unit.");
      // don't accept the new value
      return;
    }
    if (numeric === available) {
      alert("Entered quantity equals the available quantity.");
    }

    updateRow(rowId, { qty: normalized });
  };

  const handleRateChange = (rowId, val) => {
    const cleaned = val.replace(/[^\d.]/g, "");
    updateRow(rowId, { rate: cleaned });
  };

  const addRow = () => {
    setRows((prev) => [...prev, emptyRow()]);
  };

  const removeRow = (rowId) => {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedCluster) {
      alert("Please select a cluster before submitting.");
      return;
    }

    // validate each row
    for (const r of rows) {
      if (!r.productId) {
        alert("Please select a product for all rows.");
        return;
      }
      if (!r.qty || Number(r.qty) <= 0) {
        alert("Please enter quantity for all rows.");
        return;
      }
      const available = r.availableDisplay || 0;
      if (Number(r.qty) > available) {
        alert("One of the rows has quantity greater than available stock.");
        return;
      }
    }

    // Build payload: convert qty to grams (DB format)
    const payloadRows = rows.map((r) => ({
      cluster_id: selectedCluster,
      product_id: r.productId,
      name: r.productName,
      // convert row.qty (entered in selected unit) -> grams
      quantity: toGrams(r.qty, r.unit),
      unit: "gram", // you'll store grams in DB
      rate: r.rate || 0,
      farmer_id: null, // if you need farmer id, fill here
    }));

    // For now log payload. Replace with your API call.

    dispatch(createClusterProduct(payloadRows));

    // Example: call API to submit
    // api.createClusterProduct(payloadRows).then(...)
    // after success you may reset rows
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Assign Products to Cluster</h1>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Cluster</label>
        <select
          className="w-full border rounded p-2"
          value={selectedCluster}
          onChange={(e) => setSelectedCluster(e.target.value)}
        >
          <option value="">-- Select Cluster --</option>
          {clusters?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.cluster_location || c.name || `Cluster ${c.id}`}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {rows.map((row, idx) => (
          <div
            key={row.id}
            className="grid grid-cols-12 gap-3 items-end border rounded p-3"
          >
            {/* Product */}
            <div className="col-span-4">
              <label className="block text-xs font-medium mb-1">Product</label>
              <select
                className="w-full border rounded p-2"
                value={row.productId}
                onChange={(e) => handleProductChange(row.id, e.target.value)}
              >
                <option value="">-- Select Product --</option>
                {products?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.product_name || p.name || `#${p.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Available */}
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1">
                Available ({row.unit})
              </label>
              <input
                type="text"
                readOnly
                value={
                  // format fairly to show up to 4 decimals max
                  row.availableDisplay === undefined
                    ? ""
                    : Number(row.availableDisplay).toFixed(
                        Math.abs(row.availableDisplay) < 1 ? 4 : 2
                      )
                }
                className="w-full border rounded p-2 bg-gray-50"
              />
            </div>

            {/* Unit */}
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1">Unit</label>
              <select
                className="w-full border rounded p-2"
                value={row.unit}
                onChange={(e) => handleUnitChange(row.id, e.target.value)}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity input */}
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1">Quantity</label>
              <input
                className="w-full border rounded p-2"
                placeholder="0.00"
                value={row.qty}
                onChange={(e) => handleQtyChange(row.id, e.target.value)}
                inputMode="decimal"
              />
            </div>

            {/* Rate */}
            <div className="col-span-1">
              <label className="block text-xs font-medium mb-1">Rate</label>
              <input
                className="w-full border rounded p-2"
                placeholder="rate"
                value={row.rate}
                onChange={(e) => handleRateChange(row.id, e.target.value)}
              />
            </div>

            {/* Remove button */}
            <div className="col-span-1">
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="bg-red-500 text-white rounded px-3 py-1"
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={addRow}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Add Row
          </button>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Submit All
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClusterProductsAssign;
