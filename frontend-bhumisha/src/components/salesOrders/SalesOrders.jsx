import React, { useState } from "react";
import CreateSalesOrder from "./CreateSalesOrder";
import SalesOrderList from "./SalesOrderList";
import { Link } from "react-router-dom";

export default function SalesOrders() {
  const [editing, setEditing] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen  bg-gray-100">
      <h2 className="text-2xl bg-white px-2 py-2 rounded-md  font-bold mb-4">
        Sales Orders
      </h2>

      <div className="flex flex-row justify-around items-center mb-2">
        <Link
          className="bg-blue-600 p-2 rounded hover:bg-amber-700"
          to="/vendor"
          target="_blank"
          rel="noopener noreferrer"
        >
          Vendor
        </Link>
        <Link
          className="bg-blue-600 p-2 rounded hover:bg-amber-700"
          to="/customers"
          target="_blank"
          rel="noopener noreferrer"
        >
          customer
        </Link>
        <Link
          className="bg-blue-600 p-2 rounded hover:bg-amber-700"
          to="/farmer"
          target="_blank"
          rel="noopener noreferrer"
        >
          Farmer
        </Link>
        <Link
          className="bg-blue-600 p-2 rounded hover:bg-amber-700"
          to="/products"
          target="_blank"
          rel="noopener noreferrer"
        >
          Products
        </Link>
      </div>

      <div className="mb-6 bg-white rounded shadow p-4">
        <CreateSalesOrder
          so={editing}
          onSaved={() => {
            setEditing(null);
            setRefreshKey((k) => k + 1); // trigger list reload
          }}
        />
      </div>

      <div className="bg-white rounded shadow p-4">
        <SalesOrderList
          key={refreshKey} // optional: remount on refresh
          refreshKey={refreshKey}
          onEdit={(so) => setEditing(so)}
        />
      </div>
    </div>
  );
}
