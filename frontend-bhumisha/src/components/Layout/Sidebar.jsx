"use client";
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar({
  isOpen,
  collapsed,
  toggleSidebar,
  toggleCollapse,
}) {
  const location = useLocation();

  const [companyData, setCompanyData] = useState(null);

  const linkClass = (path) =>
    `flex items-center gap-3 px-4 py-2 rounded-md cursor-pointer transition-all duration-200 ${
      location.pathname === path
        ? "bg-[var(--accent)] text-white"
        : "hover:bg-[var(--secondary-bg)] text-[var(--text-color)]"
    }`;

  // Small helper for emoji stickers
  const Sticker = ({ label, symbol, className = "", decorative = false }) => (
    <span
      className={`text-xl leading-none select-none ${className}`}
      {...(decorative
        ? { "aria-hidden": "true" }
        : { role: "img", "aria-label": label })}
    >
      {symbol}
    </span>
  );

  // Chevron for dropdown indicator
  const Chevron = ({ open }) => (
    <span
      className={`inline-block transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
      aria-hidden="true"
    >
      ▼
    </span>
  );

  // Left chevron for collapse toggle
  const ChevronLeft = ({ rotated }) => (
    <span
      className={`inline-block transition-transform duration-300 ${
        rotated ? "rotate-180" : ""
      }`}
      aria-hidden="true"
    >
      ◀
    </span>
  );

  useEffect(() => {
    const companyData = localStorage.getItem("currentCompany");
    const parsed = JSON.parse(companyData || "null");
    setCompanyData(parsed);
    const handler = (e) => {
      const d = e?.detail || null;
      if (d) {
        setCompanyData(d);
      } else {
        try {
          const raw = localStorage.getItem("currentCompany");
          setCompanyData(raw ? JSON.parse(raw) : null);
        } catch {
          setCompanyData(null);
        }
      }
    };
    window.addEventListener("company:changed", handler);
    return () => window.removeEventListener("company:changed", handler);
  }, []);

  const image_url = import.meta.env.VITE_IMAGE_URL;

  // Hamburger for mobile close
  const Bars = () => <span aria-hidden="true">☰</span>;

  const handleNavClick = () => {
    if (window.innerWidth < 768 && typeof toggleSidebar === "function") {
      toggleSidebar();
    }
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-[var(--bg)] shadow-lg z-50
  transition-transform duration-300
  ${collapsed ? "w-20" : "w-64"}
  ${isOpen ? "translate-x-0" : "-translate-x-full"}
  md:${isOpen ? "translate-x-0" : "-translate-x-full"}
  overflow-auto`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-neutral-800">
        {!collapsed && (
          <Link
            to="/"
            className="flex items-center gap-3 text-xl font-bold text-[var(--accent)]"
          >
            {/* Logo with safe fallback so header layout stays intact */}
            <td className="p-2 border">
              <img
                src={
                  companyData?.image_url
                    ? `${image_url}${companyData.image_url}`
                    : "/img/image.png"
                }
                alt="Company Logo"
                onError={(e) => {
                  e.currentTarget.src = "/img/image.png";
                }}
              />
            </td>
          </Link>
        )}
        {collapsed && (
          <Link to="/" className="flex items-center justify-center">
            {/* Logo with safe fallback so header layout stays intact */}
            <td className="p-2 border">
              <img
                src={
                  companyData?.image_url
                    ? `${image_url}${companyData.image_url}`
                    : "/img/image.png"
                }
                alt="Company Logo"
                onError={(e) => {
                  e.currentTarget.src = "/img/image.png";
                }}
              />
            </td>
          </Link>
        )}
        <div className="flex gap-2">
          {/* Collapse button (desktop) */}
          <button
            onClick={toggleCollapse}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-full hover:bg-[var(--secondary-bg)]"
            aria-label="Toggle collapse"
          >
            <ChevronLeft rotated={collapsed} />
          </button>

          {/* Close button (mobile) */}
          <button
            className="md:hidden w-8 h-8 grid place-items-center"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <Bars />
          </button>
        </div>
      </div>

      {/* Sidebar Links */}
      <nav className="p-4 space-y-2 font-medium overflow-y-auto h-full">
        {/* Dashboard */}
        <Link to="/" className={linkClass("/")} onClick={handleNavClick}>
          <Sticker
            label="Dashboard"
            symbol="🏠"
            decorative={collapsed ? false : true}
          />
          {!collapsed && "Dashboard"}
        </Link>

        <Link
          to="/balanced-sheet"
          className={linkClass("/balanced-sheet")}
          onClick={handleNavClick}
        >
          <Sticker
            label="Balance Sheet"
            symbol="📃"
            decorative={collapsed ? false : true}
          />
          {!collapsed && "Balanced Sheet"}
        </Link>
        {/* Extra Links */}
        <Link
          to="/vendor"
          className={linkClass("/vendor")}
          onClick={handleNavClick}
        >
          <Sticker
            label="Vendor"
            symbol="🧑‍💼"
            decorative={collapsed ? false : true}
          />
          {!collapsed && "Vendor"}
        </Link>

        <Link
          to="/farmer"
          className={linkClass("/farmer")}
          onClick={handleNavClick}
        >
          <Sticker
            label="Farmer"
            symbol="🚜"
            decorative={collapsed ? false : true}
          />
          {!collapsed && "Farmer"}
        </Link>

        <Link
          to="/farm-details"
          className={linkClass("/farm-details")}
          onClick={handleNavClick}
        >
          <Sticker
            label="Farm"
            symbol="🌆"
            decorative={collapsed ? false : true}
          />
          {!collapsed && "Farm"}
        </Link>

        <Link
          to="/customers"
          className={linkClass("/customers")}
          onClick={handleNavClick}
        >
          <Sticker
            label="Customers"
            symbol="👥"
            decorative={collapsed ? false : true}
          />
          {!collapsed && "Customers"}
        </Link>

        <Link
          to="/category"
          className={linkClass("/category")}
          onClick={handleNavClick}
        >
          <Sticker
            label="Category"
            symbol="🏷️"
            decorative={collapsed ? false : true}
          />
          {!collapsed && "Category"}
        </Link>

        <Link
          to="/product"
          className={linkClass("/product")}
          onClick={handleNavClick}
        >
          <Sticker
            label="Products"
            symbol="📦"
            decorative={collapsed ? false : true}
          />
          {!collapsed && "Products"}
        </Link>

        <Link
          to="/customproduct"
          className={linkClass("/customproduct")}
          onClick={handleNavClick}
        >
          <Sticker
            label="Custom Products"
            symbol="🛠️"
            decorative={collapsed ? false : true}
          />
          {!collapsed && "Custom Products"}
        </Link>

        <Link
          to="/trashProduct"
          className={linkClass("/trashProduct")}
          onClick={handleNavClick}
        >
          <Sticker
            label="Trash Products"
            symbol="🗑️"
            decorative={collapsed ? false : true}
          />
          {!collapsed && "Trash Products"}
        </Link>

        <Link
          to="/po-order"
          className={linkClass("/po-order")}
          onClick={handleNavClick}
        >
          <Sticker
            label="PO Order"
            symbol="🛍️"
            decorative={collapsed ? false : true}
          />
          {!collapsed && "PO Order"}
        </Link>

        <Link
          to="/purchases"
          className={linkClass("/purchases")}
          onClick={handleNavClick}
        >
          <Sticker
            label="Purchases"
            symbol="🛒"
            decorative={collapsed ? false : true}
          />
          {!collapsed && "Purchases"}
        </Link>

        <Link
          to="/sales-orders"
          className={linkClass("/sales-orders")}
          onClick={handleNavClick}
        >
          <Sticker
            label="Sales Orders"
            symbol="➕"
            decorative={collapsed ? false : true}
          />
          {!collapsed && "Quotations"}
        </Link>

        <Link
          to="/sales"
          className={linkClass("/sales")}
          onClick={handleNavClick}
        >
          <Sticker
            label="Sales"
            symbol="💹"
            decorative={collapsed ? false : true}
          />
          {!collapsed && "Sales Billing"}
        </Link>

        <Link
          to="/sales-payment"
          className={linkClass("/sales-payment")}
          onClick={handleNavClick}
        >
          <Sticker
            label="Sales Payments"
            symbol="💸"
            decorative={collapsed ? false : true}
          />
          {!collapsed && "Bill Payment"}
        </Link>

        <Link
          to="/company/new"
          className={linkClass("/company/new")}
          onClick={handleNavClick}
        >
          <Sticker
            label="Company"
            symbol="🏢"
            decorative={collapsed ? false : true}
          />
          {!collapsed && "Company"}
        </Link>

        <Link
          to="/salaryincentive"
          className={linkClass("/salaryincentive")}
          onClick={handleNavClick}
        >
          <Sticker
            label="Salary Incentive"
            symbol="₹"
            decorative={collapsed ? false : true}
          />
          {!collapsed && "Salary&Incentive"}
        </Link>

        <Link
          to="/expenses"
          className={linkClass("/expenses")}
          onClick={handleNavClick}
        >
          <Sticker
            label="expenses"
            symbol={"📠"}
            decorative={collapsed ? false : true}
          />
          {!collapsed && "expenses"}
        </Link>

        <Link
          to="/cluster-create"
          className={linkClass("/cluster-create")}
          onClick={handleNavClick}
        >
          <Sticker
            label="Cluster Create"
            symbol="👤"
            decorative={collapsed ? false : true}
          />
          {!collapsed && "Cluster Create"}
        </Link>

        <Link
          to="/cluster-products"
          className={linkClass("/cluster-products")}
          onClick={handleNavClick}
        >
          <Sticker
            label="Cluster Products"
            symbol="🧑‍💼"
            decorative={collapsed ? false : true}
          />
          {!collapsed && "Cluster Products"}
        </Link>

        <Link
          to="/cluster-inventory"
          className={linkClass("/cluster-inventory")}
          onClick={handleNavClick}
        >
          <Sticker
            label="Cluster Inventory"
            symbol="📦"
            decorative={collapsed ? false : true}
          />
          {!collapsed && "Cluster Inventory"}
        </Link>

        <Link
          to="/cluster-transaction"
          className={linkClass("/cluster-transaction")}
          onClick={handleNavClick}
        >
          <Sticker
            label="Cluster transaction"
            symbol="®️"
            decorative={collapsed ? false : true}
          />
          {!collapsed && "Cluster transaction"}
        </Link>

        <Link
          to="/cluster-cultivated"
          className={linkClass("/cluster-cultivated")}
          onClick={handleNavClick}
        >
          <Sticker
            label="Cluster Contract Farming"
            symbol="🌾"
            decorative={collapsed ? false : true}
          />
          {!collapsed && "Cluster Contract Farming"}
        </Link>
      </nav>
    </aside>
  );
}
