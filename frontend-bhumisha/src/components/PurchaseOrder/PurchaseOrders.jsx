import React, { useState } from "react";
import PurchaseOrderForm from "./PurchaseOrderForm";
import PurchaseOrderList from "./PurchaseOrderList";
import { Link } from "react-router-dom";

export default function PurchaseOrders() {
  const [editingPO, setEditingPO] = useState(null);

  const handleEdit = (po) => setEditingPO(po);
  const handleFormSubmit = () => setEditingPO(null);

  return (
    <div className="min-h-screen bg-gray-100">
      <h2 className="text-2xl font-bold mb-4">Purchase Orders</h2>

      <div className="flex flex-row justify-around items-center mb-2">
        <Link
          className="bg-blue-600 p-2 rounded hover:bg-amber-700"
          to="/vendor"
          target="_blank"
        >
          Vendor
        </Link>
        <Link
          className="bg-blue-600 p-2 rounded hover:bg-amber-700"
          to="/farmer"
          target="_blank"
        >
          Farmer
        </Link>
        <Link
          className="bg-blue-600 p-2 rounded hover:bg-amber-700"
          to="/products"
          target="_blank"
        >
          Products
        </Link>
      </div>

      {/* ================= FORM ================= */}
      <div className="mb-6">
        <div className="bg-white rounded shadow horizontal-scroll">
          {/* Mobile swipe hint */}
          {/* <p className="text-xs text-gray-500 mb-2 md:hidden text-center">
            ⬅ Swipe left / right to view full form ➡
          </p> */}

          <div className="min-w-[1400px]">
            <PurchaseOrderForm
              purchaseOrder={editingPO}
              onSubmitted={handleFormSubmit}
            />
          </div>
        </div>
      </div>

      {/* ================= LIST ================= */}
      <div className="bg-white rounded shadow horizontal-scroll mt-4">
        {/* Mobile swipe hint */}
        <p className="text-xs text-gray-500 mb-2 md:hidden text-center">
          ⬅ Swipe left / right to view full list ➡
        </p>

        <div className="min-w-[1200px]">
          <PurchaseOrderList onEdit={handleEdit} />
        </div>
      </div>
    </div>
  );
}
