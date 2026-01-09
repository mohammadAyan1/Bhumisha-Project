// src/pages/sales/SalesPage.jsx
import { useState } from "react";
import { pick as pickCompanyColor } from "../../utils/companyColor";
import SalesList from "./SalesList";
import SalesForm from "./SalesForm";
import SalesDetailsPanel from "./SalesDetailsPanel";
import { Link } from "react-router-dom";

export default function SalesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingSale, setEditingSale] = useState(null);
  const [detailsId, setDetailsId] = useState(null);

  const onCreate = () => {
    setEditingSale(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onEdit = (sale) => {
    setEditingSale(sale);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmitted = () => {
    setEditingSale(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
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
          to="/customers"
          target="_blank"
          rel="noopener noreferrer"
        >
          Customer
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

      {/* Current company badge */}
      {(() => {
        const code = (localStorage.getItem("company_code") || "").toLowerCase();
        const { bg, text } = pickCompanyColor(code);
        return (
          <div className="mb-1 opacity-50">
            <div
              className={`inline-flex fixed right-2  items-center gap-3 px-3 py-2 rounded-lg shadow-sm ${bg} ${text}`}
            >
              <span className="text-lg font-semibold">
                {(code || "(none)").toUpperCase()}
              </span>
              <span className="text-lg  bg-white/20 px-2 py-0.5 rounded-full">
                Company
              </span>
            </div>
          </div>
        );
      })()}
      <SalesForm
        sale={editingSale}
        isEditMode={Boolean(editingSale)}
        onSubmitted={onSubmitted}
      />
      <SalesList
        key={refreshKey}
        onEdit={onEdit}
        onCreate={onCreate}
        onDetails={setDetailsId}
      />
      {detailsId && (
        <SalesDetailsPanel id={detailsId} onClose={() => setDetailsId(null)} />
      )}
    </div>
  );
}
