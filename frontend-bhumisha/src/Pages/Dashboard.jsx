import React from "react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import companyAPI from "../axios/companyAPI";
import getAllPurchaseBill from "../axios/getAllPurchasesBill";
import getAllSalesBill from "../axios/getAllSalesBill";
import axios from "axios";
import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import customersAPI from "../axios/customerAPI";
import clusterApi from "../axios/clusterAdded";
import expensesAPI from "../axios/ExpensesAPI";
import vendorAPI from "../axios/vendorsAPI";

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function Dashboard() {
  const [totalVendors, setTotalVendors] = useState(0);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [totalExpensesGstExpenses, setTotalExpensesGstExpenses] = useState(0);
  const [purchaseGstAmount, setPurchaseGstAmount] = useState(0);
  const [saleGstTotal, setSaleGstTotal] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalCluster, setTotalCluster] = useState(0);
  const [
    currentMonthPurchaseInvoiceCount,
    setCurrentMonthPurchaseInvoiceCount,
  ] = useState(0);
  const [currentMonthPurchaseTotalAmount, setCurrentMonthPurchaseTotalAmount] =
    useState(0);
  const [currentMonthSalesInvoiceCount, setCurrentMonthSalesInvoiceCount] =
    useState(0);
  const [currentMonthSalesTotalAmount, setCurrentMonthSalesTotalAmount] =
    useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0); // Add this for single month revenue
  const [revenueData, setRevenueData] = useState([]); // This should be array for chart
  const [vendorData, setVendorData] = useState([]);

  // Add this helper function to get month key
  const getMonthKey = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return `${date.getFullYear()}-${date.getMonth()}`;
  };

  useEffect(() => {
    // Calculate current month revenue
    const revenueTotal =
      currentMonthSalesTotalAmount - currentMonthPurchaseTotalAmount;
    setMonthlyRevenue(revenueTotal);
  }, [currentMonthPurchaseTotalAmount, currentMonthSalesTotalAmount]);

  // Fetch purchases and sales data for revenue chart
  useEffect(() => {
    const fetchRevenueData = async () => {
      if (!totalCompanies || totalCompanies.length === 0) return;

      try {
        // Fetch both purchases and sales data
        const [purchaseRes, salesRes] = await Promise.all([
          getAllPurchaseBill.getAll(totalCompanies),
          getAllSalesBill.getAllBillByMonth(totalCompanies),
        ]);

        const purchaseData = purchaseRes?.data || [];
        const salesData = salesRes?.data || [];

        // Initialize revenue buckets for last 12 months
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        const revenueBuckets = new Map();

        for (let i = 0; i < 12; i++) {
          const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          revenueBuckets.set(key, {
            month: `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(
              -2
            )}`,
            purchases: 0,
            sales: 0,
            revenue: 0,
          });
        }

        // Process purchases data
        purchaseData.forEach((company) => {
          const purchases = company?.purchases || [];
          purchases.forEach((purchase) => {
            const billDate = purchase?.purchaseDetails?.bill_date;
            const monthKey = getMonthKey(billDate);
            if (monthKey && revenueBuckets.has(monthKey)) {
              const amount =
                Number(purchase?.purchaseDetails?.total_amount) || 0;
              revenueBuckets.get(monthKey).purchases += amount;
            }
          });
        });

        // Process sales data
        salesData.forEach((company) => {
          const sales = company?.sales || [];
          sales.forEach((sale) => {
            const billDate = sale?.saleDetails?.bill_date || sale?.bill_date;
            const monthKey = getMonthKey(billDate);
            if (monthKey && revenueBuckets.has(monthKey)) {
              const amount =
                Number(sale?.saleDetails?.total_amount) ||
                Number(sale?.saleDetails?.net_total) ||
                Number(sale?.total_amount) ||
                Number(sale?.net_total) ||
                0;
              revenueBuckets.get(monthKey).sales += amount;
            }
          });
        });

        // Calculate revenue for each month (sales - purchases)
        const processedData = Array.from(revenueBuckets.values()).map(
          (item) => ({
            ...item,
            revenue: item.sales - item.purchases,
          })
        );

        setRevenueData(processedData);
      } catch (error) {
        console.error("Error fetching revenue data:", error);
      }
    };

    fetchRevenueData();
  }, [totalCompanies]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vendorRes, company] = await Promise.all([
          vendorAPI.getAll(),
          companyAPI.getAll(),
        ]);

        const notifyTelegram = async (
          message = "Bhumisha agro server is down. Please restart the server."
        ) => {
          try {
            const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
            const id = import.meta.env.VITE_TELEGRAM_CHAT_ID;
            await axios.post(
              `https://api.telegram.org/bot${token}/sendMessage`,
              null,
              {
                params: { chat_id: id, text: message },
              }
            );
          } catch (error) {
            console.error("Error sending Telegram notification:", error);
          }
        };

        if (vendorRes?.status !== 200) await notifyTelegram();
        if (company?.status !== 200) await notifyTelegram();

        setTotalVendors(vendorRes.data.length);
        setTotalCompanies(company.data);

        // Build vendor registrations per month
        try {
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
          const buckets = new Map();
          for (let i = 0; i < 12; i++) {
            const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            buckets.set(key, {
              month: `${monthNames[d.getMonth()]} ${String(
                d.getFullYear()
              ).slice(-2)}`,
              vendors: 0,
            });
          }
          for (const v of vendorRes.data || []) {
            const dt = new Date(
              v.created_at || v.createdAt || v.created || Date.now()
            );
            const key = `${dt.getFullYear()}-${dt.getMonth()}`;
            if (buckets.has(key)) {
              buckets.get(key).vendors += 1;
            }
          }
          setVendorData(Array.from(buckets.values()));
        } catch {
          console.error("Error computing vendor registration metrics");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        try {
          await axios.post(
            `https://api.telegram.org/bot${
              import.meta.env.VITE_TELEGRAM_BOT_TOKEN
            }/sendMessage`,
            null,
            {
              params: {
                chat_id: import.meta.env.VITE_TELEGRAM_CHAT_ID,
                text: "Bhumisha agro server is down. Please restart the server.",
              },
            }
          );
        } catch (e) {
          console.error("Secondary Telegram notify failed:", e);
        }
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const isCurrentMonth = (dateString) => {
      if (!dateString) return false;
      const date = new Date(dateString);
      const now = new Date();
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    };

    const calculatePurchaseMetrics = (companies) => {
      let currentMonthInvoiceCount = 0;
      let currentMonthTotalAmount = 0;
      let currentMonthGstAmount = 0;
      let currentMonthTaxableAmount = 0;

      for (const company of companies) {
        const purchases = company?.purchases || [];
        for (const purchase of purchases) {
          const billDate = purchase?.purchaseDetails?.bill_date;
          if (isCurrentMonth(billDate)) {
            currentMonthInvoiceCount++;
            const amount = Number(purchase?.purchaseDetails?.total_amount) || 0;
            currentMonthTotalAmount += amount;
            const gstAmount =
              Number(purchase?.purchaseDetails?.gst_amount) || 0;
            currentMonthGstAmount += gstAmount;
            const taxableAmount =
              Number(purchase?.purchaseDetails?.taxable_amount) || 0;
            currentMonthTaxableAmount += taxableAmount;
          }
        }
      }

      return {
        invoiceCount: currentMonthInvoiceCount,
        totalAmount: currentMonthTotalAmount,
        gstAmount: currentMonthGstAmount,
        taxableAmount: currentMonthTaxableAmount,
      };
    };

    if (totalCompanies && totalCompanies.length > 0) {
      getAllPurchaseBill.getAll(totalCompanies).then((res) => {
        try {
          const companies = res.data || [];
          const purchaseMetrics = calculatePurchaseMetrics(companies);
          setPurchaseGstAmount(purchaseMetrics.gstAmount);
          setCurrentMonthPurchaseInvoiceCount(purchaseMetrics.invoiceCount);
          setCurrentMonthPurchaseTotalAmount(purchaseMetrics.totalAmount);
        } catch (err) {
          console.error("Error computing purchase metrics", err);
        }
      });
    }
  }, [totalCompanies]);

  useEffect(() => {
    if (!totalCompanies || totalCompanies.length === 0) return;

    getAllSalesBill
      .getAllBillByMonth(totalCompanies)
      .then((res) => {
        const salesData = res?.data || [];
        let totalSaleGst = 0;
        let totalSalesAmount = 0;
        let totalSalesInvoiceCount = 0;

        const isCurrentMonth = (dateString) => {
          if (!dateString) return false;
          const date = new Date(dateString);
          const now = new Date();
          return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
          );
        };

        salesData.forEach((company) => {
          const sales = company?.sales || [];
          sales.forEach((sale) => {
            const billDate = sale?.saleDetails?.bill_date || sale?.bill_date;

            if (isCurrentMonth(billDate)) {
              totalSalesInvoiceCount++;
              const gstAmount =
                Number(sale?.items?.[0]?.total_gst) ||
                Number(sale?.saleDetails?.gst_amount) ||
                Number(sale?.gst_amount) ||
                0;
              totalSaleGst += gstAmount;

              const saleAmount =
                Number(sale?.saleDetails?.total_amount) ||
                Number(sale?.saleDetails?.net_total) ||
                Number(sale?.total_amount) ||
                Number(sale?.net_total) ||
                0;
              totalSalesAmount += saleAmount;
            }
          });
        });

        setSaleGstTotal(totalSaleGst);
        setCurrentMonthSalesInvoiceCount(totalSalesInvoiceCount);
        setCurrentMonthSalesTotalAmount(totalSalesAmount);
      })
      .catch((err) => {
        console.error("Error fetching sales data:", err);
      });
  }, [totalCompanies]);

  useEffect(() => {
    clusterApi
      .getAll()
      .then((res) => {
        setTotalCluster(res?.data?.length);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  useEffect(() => {
    expensesAPI
      .getCurrentmonth()
      .then((res) => {
        setTotalExpenses(res?.data?.total);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  useEffect(() => {
    expensesAPI
      .getCurrentmonthGStExpenses()
      .then((res) => {
        setTotalExpensesGstExpenses(res?.data?.total);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-extrabold text-[var(--text-color)]">
        📊 Dashboard Overview
      </h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Month Revenue Card - ADD THIS */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-600 shadow-lg text-white flex items-center gap-4 hover:scale-[1.01] transition-transform">
          <span className="text-4xl leading-none">💰</span>
          <div>
            <p className="text-sm opacity-80">Current Month Revenue</p>
            <h3 className="text-2xl font-bold">
              ₹{" "}
              {monthlyRevenue.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h3>
            <p className="text-xs opacity-80 mt-1">
              Sales: ₹{currentMonthSalesTotalAmount.toFixed(2)} - Purchases: ₹
              {currentMonthPurchaseTotalAmount.toFixed(2)}
            </p>
          </div>
        </div>

        <Link to="/proforma-invoice" className="block">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg text-white flex items-center gap-4 hover:scale-[1.01] transition-transform">
            <span className="text-4xl leading-none">💸</span>
            <div>
              <p className="text-sm opacity-80">Total Purchases This Month</p>
              <h3 className="text-2xl font-bold">
                ₹{" "}
                {Number(currentMonthPurchaseTotalAmount || 0).toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </h3>
            </div>
          </div>
        </Link>

        <Link to="/proforma-invoice" className="block">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg text-white flex items-center gap-4 hover:scale-[1.01] transition-transform">
            <span className="text-4xl leading-none">🧾</span>
            <div>
              <p className="text-sm opacity-80">Purchase Invoices This Month</p>
              <h3 className="text-2xl font-bold">
                {currentMonthPurchaseInvoiceCount || 0}
              </h3>
            </div>
          </div>
        </Link>

        <Link to="/sales-reports" className="block">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 shadow-lg text-white flex items-center gap-4 hover:scale-[1.01] transition-transform">
            <span className="text-4xl leading-none">📈</span>
            <div>
              <p className="text-sm opacity-80">Total Sales This Month</p>
              <h3 className="text-2xl font-bold">
                ₹ {currentMonthSalesTotalAmount.toFixed(2)}
              </h3>
            </div>
          </div>
        </Link>

        <Link to="/sales-reports" className="block">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-600 shadow-lg text-white flex items-center gap-4 hover:scale-[1.01] transition-transform">
            <span className="text-4xl leading-none">🧾</span>
            <div>
              <p className="text-sm opacity-80">Sales Invoices This Month</p>
              <h3 className="text-2xl font-bold">
                {currentMonthSalesInvoiceCount}
              </h3>
            </div>
          </div>
        </Link>

        <Link to={"/vendor"}>
          <div className="p-6 rounded-2xl bg-gradient-to-r from-green-500 to-blue-600 shadow-lg text-white flex items-center gap-4 hover:scale-[1.01] transition-transform">
            <div>
              <p className="text-sm opacity-80">Vendors</p>
              <h3 className="text-2xl font-bold">{totalVendors || 0}</h3>
            </div>
          </div>
        </Link>

        <Link to={"/cluster-create"}>
          <div className="p-6 rounded-2xl bg-gradient-to-r from-pink-500 to-yellow-600 shadow-lg text-white flex items-center gap-4 hover:scale-[1.01] transition-transform">
            <div>
              <p className="text-sm opacity-80">Total Cluster</p>
              <h3 className="text-2xl font-bold">{totalCluster}</h3>
            </div>
          </div>
        </Link>

        <Link to={"/proforma-invoice"}>
          <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-500 to-amber-600 shadow-lg text-white flex items-center gap-4 hover:scale-[1.01] transition-transform">
            <div>
              <p className="text-sm opacity-80">Purchase GST</p>
              <h3 className="text-2xl font-bold">
                {(purchaseGstAmount || 0).toFixed(2)}
              </h3>
            </div>
          </div>
        </Link>

        <Link to={"/sales-reports"}>
          <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-500 to-teal-600 shadow-lg text-white flex items-center gap-4 hover:scale-[1.01] transition-transform">
            <div>
              <p>Sales GST</p>
              <h3 className="text-2xl font-bold">
                {saleGstTotal.toFixed(2) || 0}
              </h3>
            </div>
          </div>
        </Link>

        <Link to={"/expenses/table"}>
          <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-500 to-cyan-600 shadow-lg text-white flex items-center gap-4 hover:scale-[1.01] transition-transform">
            <div>
              <p className="text-sm opacity-80">Total Expenses this Month</p>
              <h3 className="text-2xl font-bold">{totalExpenses.toFixed(2)}</h3>
            </div>
          </div>
        </Link>

        <Link to={"/expenses/table/gst"}>
          <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-500 to-cyan-600 shadow-lg text-white flex items-center gap-4 hover:scale-[1.01] transition-transform">
            <div>
              <p className="text-sm opacity-80">
                Total GST Expenses this Month
              </p>
              <h3 className="text-2xl font-bold">
                {totalExpensesGstExpenses.toFixed(2)}
              </h3>
            </div>
          </div>
        </Link>
      </div>

      {/* Graphs Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-[var(--bg)] shadow rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-[var(--text-color)] mb-4">
            Monthly Revenue (Last 12 Months)
          </h3>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={revenueData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => value.toFixed(2)} />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "revenue")
                      return [value.toFixed(2), "Revenue"];
                    if (name === "sales") return [value.toFixed(2), "Sales"];
                    if (name === "purchases")
                      return [value.toFixed(2), "Purchases"];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  name="Revenue"
                />
                {/* Optional: Add sales and purchase lines for comparison */}
                {/* <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} name="Sales" /> */}
                {/* <Line type="monotone" dataKey="purchases" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} name="Purchases" /> */}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vendor Growth */}
        <div className="bg-[var(--bg)] shadow rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-[var(--text-color)] mb-4">
            Customers Registrations
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={vendorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value) => [value, "Customers"]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Bar dataKey="vendors" fill="#16a34a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
