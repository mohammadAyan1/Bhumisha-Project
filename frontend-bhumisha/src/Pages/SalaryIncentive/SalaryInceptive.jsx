import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function SalaryIncentive() {
  const tabs = [
    { name: "Employees", path: "employees" },
    { name: "Salary", path: "salary" },
    { name: "Incentives", path: "incentives" },
    { name: "Attendance", path: "attendance" },
    { name: "Holiday", path: "holiday" },
  ];

  return (
    <div className="min-h-screen bg-[var(--secondary-bg)]">
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <nav className="flex flex-wrap justify-center gap-4 bg-[var(--bg)] p-3 rounded-2xl shadow-md backdrop-blur-sm">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `px-5 py-2 rounded-xl font-semibold transition-all duration-300 ${
                  isActive
                    ? "bg-[var(--accent)] text-white shadow-lg"
                    : "bg-white text-gray-600 border hover:bg-[var(--accent)] hover:text-white"
                }`
              }
            >
              {tab.name}
            </NavLink>
          ))}
        </nav>

        {/* Nested Page Content */}
        <div className="bg-[var(--bg)] p-6 mt-6 rounded-2xl shadow-md border">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
