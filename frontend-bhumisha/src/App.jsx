import React, { useMemo, useState } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import Sidebar from "./components/Layout/Sidebar";
import Navbar from "./components/Layout/Navbar";
import { useAuth } from "./contexts/AuthContext";
import { useCompany } from "./contexts/CompanyContext";

/* ---- imports unchanged ---- */

import Dashboard from "./Pages/Dashboard";
import VendorManagement from "./Pages/VendorManagement.jsx";
import FarmerRegistrationPage from "./Pages/FarmerRegistrationPage";
import Categories from "./components/categories/Categories";
import Products from "./Pages/products/Products";
import Purchases from "./components/purchase/Purchases.jsx";
import PurchaseEdit from "./Pages/purchase/PurchaseEdit.jsx";
import PurchaseView from "./Pages/purchase/PurchaseView.jsx";
import CustomersPage from "./components/customers/CustomersPage.jsx";
import SalesPage from "./components/Sales/SalesPage";
import PurchaseOrders from "./components/PurchaseOrder/PurchaseOrders.jsx";
import SalesOrders from "./components/salesOrders/SalesOrders.jsx";
import CompaniesPage from "./components/Company/CompaniesPage.jsx";
import PurchaseForm from "./components/purchase/PurchaseForm.jsx";
import LoginPage from "./Pages/LoginPage";
import SaleOrderInvoice from "./components/salesOrders/SalesOrderInvoice.jsx";
import POinvoice from "./components/PurchaseOrder/POInvoice.jsx";
import SalesInvoice from "./components/Sales/salesInvoice";
import SalesForm from "./components/Sales/SalesForm.jsx";
import CustomProductForm from "./components/Customproductform/CustomProductForm.jsx";
import TrashProductForm from "./components/trashProduct/trashProduct.jsx";
import AllPurchasesReport from "./components/PurchasesReports/PurchasesReports.jsx";
import SalesReports from "./components/SalesReports/SalesReports.jsx";
import Expenses from "./Pages/Expenses.jsx";
import SalaryInceptive from "./Pages/SalaryIncentive/SalaryInceptive.jsx";
import Holiday from "./components/Holiday/Holiday.jsx";
import FarmDetailsPage from "./Pages/FarmDetailsPage.jsx";
import ClusterCreate from "./Pages/ClusterCreate.jsx";
import ClusterProducts from "./components/ClusterProducts/ClusterProducts";
import ClusterInventory from "./Pages/ClusterInventory.jsx";
import ClusterTransaction from "./components/ClusterTransaction/ClusterTransaction.jsx";
import ClusterCultivated from "./components/ClusterCultivated.jsx";
import EmployeesPage from "./components/EmployeesPage/EmployeesPage.jsx";
import EmployeeIDCard from "./components/EmployeeIDCard/EmployeeIDCard.jsx";
import SalaryPage from "./components/SalaryPage/SalaryPage.jsx";
import Incentive from "./components/Incentive/Incentive.jsx";
import AttendenceUpdate from "./components/AttendenceUpdate/AttendenceUpdate";
import BillPayment from "./components/BillPayment/BillPayment.jsx";
import BalanceSheet from "./components/BalanceSheet/BalanceSheet.jsx";

/* ---------------- SHELL ---------------- */

function AppShell() {
  const { company } = useCompany();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);
  const toggleCollapse = () => setCollapsed((v) => !v);

  const outletKey = useMemo(() => company?.code || "no-company", [company]);

  return (
    <div className="flex min-h-screen bg-[var(--secondary-bg)] overflow-x-auto">
      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-[var(--accent)] text-white shadow-lg md:hidden"
        >
          ☰
        </button>
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        collapsed={collapsed}
        toggleSidebar={toggleSidebar}
        toggleCollapse={toggleCollapse}
      />

      <div
        className={`
          flex flex-col flex-1 transition-all duration-300
          ${isSidebarOpen ? (collapsed ? "md:ml-20" : "md:ml-64") : "md:ml-0"}
          ml-0 overflow-x-hidden
        `}
      >
        <Navbar toggleSidebar={toggleSidebar} />

        <main className="flex-1 p-2 overflow-y-auto overflow-x-auto">
          <Outlet key={outletKey} />
        </main>
      </div>
    </div>
  );
}

/* ---------------- APP ---------------- */

function PrivateRoute() {
  const { token } = useAuth();
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function App() {
  // const { token } = useAuth();
  const { loading } = useAuth();
  const [value, setValue] = useState(true);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      {/* ================= PUBLIC ROUTES ================= */}
      <Route path="/login" element={<LoginPage />} />

      {/* ✅ PUBLIC INVOICE ROUTE (NO LOGIN REQUIRED) */}
      <Route path="/sales-order/invoice/:id" element={<SaleOrderInvoice />} />
      <Route path="/sales-invoice/:token" element={<SalesInvoice />} />

      {/* ================= PROTECTED ROUTES ================= */}
      {/* {token && ( */}
      <Route element={<PrivateRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vendor" element={<VendorManagement />} />
          <Route path="/farmer" element={<FarmerRegistrationPage />} />
          <Route path="/farm-details" element={<FarmDetailsPage />} />
          <Route path="/category" element={<Categories />} />
          <Route path="/product" element={<Products />} />
          <Route path="/cluster-create" element={<ClusterCreate />} />
          <Route path="/cluster-products" element={<ClusterProducts />} />
          <Route path="/cluster-inventory" element={<ClusterInventory />} />
          <Route path="/cluster-transaction" element={<ClusterTransaction />} />
          <Route path="/cluster-cultivated" element={<ClusterCultivated />} />

          <Route
            path="/products"
            element={<Products open={value} hide={setValue} />}
          />

          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customproduct" element={<CustomProductForm />} />
          <Route path="/customproduct/:id" element={<CustomProductForm />} />
          <Route path="/trashproduct" element={<TrashProductForm />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/purchases/edit/:poId" element={<PurchaseEdit />} />
          <Route path="/purchases/view/:poId" element={<PurchaseView />} />
          <Route path="/purchases/create" element={<PurchaseForm />} />
          <Route path="/proforma-invoice" element={<AllPurchasesReport />} />
          <Route path="/sales-reports" element={<SalesReports />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/sales-payment" element={<BillPayment />} />
          <Route path="/sales-orders" element={<SalesOrders />} />

          <Route path="/sales/create" element={<SalesForm />} />
          <Route path="/po-order" element={<PurchaseOrders />} />
          <Route path="/invoice/:id" element={<POinvoice />} />
          <Route path="/company/new" element={<CompaniesPage />} />
          <Route path="/balanced-sheet" element={<BalanceSheet />} />

          <Route path="/salaryincentive" element={<SalaryInceptive />}>
            <Route index element={<EmployeesPage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="employee/:employeeId" element={<EmployeeIDCard />} />
            <Route path="salary" element={<SalaryPage />} />
            <Route path="incentives" element={<Incentive />} />
            <Route path="attendance" element={<AttendenceUpdate />} />
            <Route path="holiday" element={<Holiday />} />
          </Route>

          <Route path="/expenses" element={<Expenses />} />
          <Route
            path="/expenses/table/gst"
            element={<Expenses tabel="list" />}
          />
          <Route
            path="/expenses/table"
            element={<Expenses tabel="list" switchTable={true} />}
          />
        </Route>
      </Route>
      {/* )} */}

      {/* ================= FALLBACK ================= */}
      {/* <Route
        path="/*"
        element={<Navigate to={token ? "/" : "/login"} replace />}
      /> */}
      <Route path="*" element={<div>404 – Page Not Found</div>} />
    </Routes>
  );
}
