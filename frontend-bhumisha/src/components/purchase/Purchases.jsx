import React, { useState } from "react";
import { pick as pickCompanyColor } from "../../utils/companyColor";
import PurchaseForm from "./PurchaseForm";
import PurchaseList from "./PurchaseList";
import { Link } from "react-router-dom";

export default function Purchases() {
  const [reloadFlag, setReloadFlag] = useState(0);

  const handlePurchaseSaved = () => {
    setReloadFlag((prev) => prev + 1);
  };

  return (
    <div className=" bg-gray-100 min-h-screen overflow-y-auto overflow-x-auto">
      <div className="flex items-center justify-between mb-6 bg-white p-3 shadow-md">
        <h1 className="text-2xl font-bold">Manage Purchases</h1>

        <div>
          {(() => {
            const code = (
              localStorage.getItem("company_code") || ""
            ).toLowerCase();
            const { bg, text } = pickCompanyColor(code);
            return (
              <div
                className={`inline-flex fixed right-2  opacity-50 items-center gap-3 px-3 py-2 rounded-lg ${bg} ${text}`}
              >
                <div className="text-lg font-semibold">
                  {(code || "(none)").toUpperCase()}
                </div>
                <div className="text-lg bg-white/20 px-2 py-0.5 rounded-full">
                  Company
                </div>
              </div>
            );
          })()}
        </div>
      </div>

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

      {/* Purchase Form */}
      <div className="mb-10 overflow-auto">
        <PurchaseForm onSaved={handlePurchaseSaved} />
      </div>

      {/* Purchase List */}
      <div className="overflow-auto">
        <PurchaseList reload={reloadFlag} />
      </div>
    </div>
  );
}
