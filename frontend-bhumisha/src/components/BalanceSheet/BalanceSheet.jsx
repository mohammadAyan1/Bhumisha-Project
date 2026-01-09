import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaBuilding,
  FaEye,
  FaEyeSlash,
  FaDownload,
  FaSync,
  FaChartBar,
  FaRupeeSign,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaFileExcel,
  FaFilePdf,
} from "react-icons/fa";
import ExcelJS from "exceljs";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";
import companyAPI from "../../axios/companyAPI";
import balanceSheetAPI from "../../axios/balanceSheetAPI";
import SalesModal from "../SalesModal/SalesModal";
import PurchasesModal from "../PurchasesModal/PurchasesModal";
import ExpensesModal from "../ExpensesModal/ExpensesModal";
import BillItemsModal from "../BillItemsModal/BillItemsModal";

const BalanceSheet = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [financialData, setFinancialData] = useState(null);
  const [showClosingBalance, setShowClosingBalance] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Modals for detailed views
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showPurchasesModal, setShowPurchasesModal] = useState(false);
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [modalData, setModalData] = useState([]);

  // Bill Items Modal
  const [showBillItemsModal, setShowBillItemsModal] = useState(false);
  const [selectedBillForItems, setSelectedBillForItems] = useState(null);
  const [billType, setBillType] = useState("");
  const [loadingItems, setLoadingItems] = useState(false);

  // Get company name for export
  const getCompanyName = () => {
    const company = companies.find((c) => c.id == selectedCompany);

    return company ? `${company.code} - ${company.name}` : "Unknown Company";
  };

  // Get month name for export
  const getMonthName = () => {
    const month = monthOptions.find((m) => m.value === selectedMonth);
    return month ? month.label : selectedMonth;
  };

  // Get current date
  const currentDate = new Date();
  const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, "0");
  const currentYear = currentDate.getFullYear();

  // Initialize with current month
  useEffect(() => {
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear.toString());
  }, []);

  // Fetch companies
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await companyAPI.getAll();
      setCompanies(res.data || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast.error("Failed to load companies");
    }
  };

  // Generate month options
  const monthOptions = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  // Generate year options (last 5 years + current year)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 4; i <= currentYear; i++) {
      years.push(i.toString());
    }
    return years;
  }, []);

  // Validate date selection
  const isFutureDate = useMemo(() => {
    if (!selectedMonth || !selectedYear) return false;

    const selectedDate = new Date(
      parseInt(selectedYear),
      parseInt(selectedMonth) - 1,
      1
    );
    const currentDate = new Date();
    currentDate.setDate(1);

    return selectedDate > currentDate;
  }, [selectedMonth, selectedYear]);

  // Fetch financial data
  const fetchFinancialData = async () => {
    if (!selectedCompany) {
      toast.error("Please select a company");
      return;
    }

    if (!selectedMonth || !selectedYear) {
      toast.error("Please select month and year");
      return;
    }

    if (isFutureDate) {
      toast.error("Cannot select future month/year");
      return;
    }

    setLoading(true);
    try {
      const params = {
        companyId: selectedCompany,
        month: selectedMonth,
        year: selectedYear,
      };

      const res = await balanceSheetAPI.getBalanceSheet(params);

      if (res.data.success) {
        setFinancialData(res.data.data);

        // Check if selected month is completed
        const selectedDate = new Date(
          parseInt(selectedYear),
          parseInt(selectedMonth) - 1,
          1
        );
        const currentDate = new Date();
        currentDate.setDate(1);

        const isCurrentMonth =
          selectedMonth === currentMonth &&
          selectedYear === currentYear.toString();
        const isMonthCompleted = selectedDate < currentDate;

        setShowClosingBalance(isMonthCompleted && !isCurrentMonth);

        toast.success("Financial data loaded successfully");
      } else {
        toast.error(res.data.message || "Failed to load data");
      }
    } catch (error) {
      console.error("Error fetching financial data:", error);
      toast.error(error.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Handle view details
  const handleViewSalesDetails = async (boolChecker) => {
    if (
      !financialData?.monthlySales?.data ||
      !financialData.openingBalance.totalRowData?.salesResult
    ) {
      toast.error("No sales data available");
      return;
    }

    if (boolChecker) {
      setModalData(financialData?.monthlySales?.data);
    } else {
      setModalData(financialData.openingBalance.totalRowData?.salesResult);
    }
    setShowSalesModal(true);
  };

  const handleViewPurchasesDetails = async (boolChecker) => {
    if (
      !financialData?.monthlyPurchases?.data ||
      !financialData.openingBalance.totalRowData?.purchasesResult
    ) {
      toast.error("No purchases data available");
      return;
    }
    if (boolChecker) {
      setModalData(financialData?.monthlyPurchases?.data);
    } else {
      setModalData(financialData.openingBalance.totalRowData?.purchasesResult);
    }
    setShowPurchasesModal(true);
  };

  const handleViewExpensesDetails = async (boolChecker) => {
    if (
      !financialData?.monthlyExpenses?.data ||
      !financialData?.openingBalance?.totalRowData?.combineExpenses?.data
    ) {
      toast.error("No expenses data available");
      return;
    }

    if (boolChecker) {
      setModalData(financialData?.monthlyExpenses?.data);
    } else {
      setModalData(
        financialData?.openingBalance?.totalRowData?.combineExpenses?.data
      );
    }
    setShowExpensesModal(true);
  };

  // Handle viewing bill items
  const handleViewBillItems = async (bill, type) => {
    try {
      setLoadingItems(true);
      setBillType(type);

      // Fetch bill items based on type
      let itemsResponse;
      if (type === "sales") {
        itemsResponse = await balanceSheetAPI.getSalesBillItems(bill.id);
      } else if (type === "purchases") {
        itemsResponse = await balanceSheetAPI.getPurchasesBillItems(bill.id);
      } else {
        toast.error("Invalid bill type");
        return;
      }

      if (itemsResponse.data.success) {
        setSelectedBillForItems({
          ...bill,
          items: itemsResponse.data.data || [],
        });
        setShowBillItemsModal(true);
      } else {
        toast.error("Failed to load bill items");
      }
    } catch (error) {
      console.error("Error fetching bill items:", error);
      toast.error("Failed to load bill items");
    } finally {
      setLoadingItems(false);
    }
  };

  // Calculate net profit/loss for SELECTED MONTH
  const calculateNetProfitLoss = () => {
    if (!financialData) return 0;

    // Use monthly data for profit/loss calculation
    const totalSales = financialData.monthlySales?.totalAmount || 0;
    const totalPurchases = financialData.monthlyPurchases?.totalAmount || 0;
    const totalExpenses = financialData.monthlyExpenses?.totalAmount || 0;

    return totalSales - (totalPurchases + totalExpenses);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Format currency without symbol for export
  const formatCurrencyForExport = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Export to PDF
  const handleExportPDF = async () => {
    if (!financialData) {
      toast.error("No data to export");
      return;
    }

    setExporting(true);
    try {
      const doc = new jsPDF("p", "mm", "a4");

      // Header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text("Financial Statement", 105, 15, { align: "center" });

      doc.setFontSize(12);
      doc.text(`Company: ${getCompanyName()}`, 14, 25);
      doc.text(`Period: ${getMonthName()} ${selectedYear}`, 14, 32);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 39);

      let yPos = 50;

      // 1. Opening Balance Section (Previous Month)
      doc.setFontSize(16);
      doc.setTextColor(30, 64, 175); // Blue
      doc.text(
        `Opening Balance (${
          financialData.openingBalance?.period || "Previous Month"
        })`,
        14,
        yPos
      );
      yPos += 10;

      const openingData = [
        ["Category", "Amount (₹)", "GST (₹)", "Total (₹)"],
        [
          "Sales",
          formatCurrencyForExport(
            financialData.openingBalance?.totalSales || 0
          ),
          formatCurrencyForExport(
            financialData.openingBalance?.totalSalesGST || 0
          ),
          formatCurrencyForExport(
            (financialData.openingBalance?.totalSales || 0) +
              (financialData.openingBalance?.totalSalesGST || 0)
          ),
        ],
        [
          "Purchases",
          formatCurrencyForExport(
            financialData.openingBalance?.totalPurchases || 0
          ),
          formatCurrencyForExport(
            financialData.openingBalance?.totalPurchasesGST || 0
          ),
          formatCurrencyForExport(
            (financialData.openingBalance?.totalPurchases || 0) +
              (financialData.openingBalance?.totalPurchasesGST || 0)
          ),
        ],
        [
          "Expenses",
          formatCurrencyForExport(
            financialData.openingBalance?.totalExpenses || 0
          ),
          formatCurrencyForExport(
            financialData.openingBalance?.totalExpensesGST || 0
          ),
          formatCurrencyForExport(
            (financialData.openingBalance?.totalExpenses || 0) +
              (financialData.openingBalance?.totalExpensesGST || 0)
          ),
        ],
        [
          "Outstanding to Receive",
          formatCurrencyForExport(
            financialData.openingBalance?.outstandingToReceive || 0
          ),
          "-",
          formatCurrencyForExport(
            financialData.openingBalance?.outstandingToReceive || 0
          ),
        ],
        [
          "Outstanding to Pay",
          formatCurrencyForExport(
            financialData.openingBalance?.outstandingToPay || 0
          ),
          "-",
          formatCurrencyForExport(
            financialData.openingBalance?.outstandingToPay || 0
          ),
        ],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [openingData[0]],
        body: openingData.slice(1),
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
      });

      yPos = doc.lastAutoTable.finalY + 15;

      // 2. Monthly Sales Summary (Selected Month)
      if (financialData.monthlySales?.data?.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(30, 64, 175);
        doc.text(`Monthly Sales (${getMonthName()} ${selectedYear})`, 14, yPos);
        yPos += 10;

        const salesData = financialData.monthlySales.data.map((sale) => [
          sale.bill_date || "-",
          sale.party_name || "-",
          sale.bill_no || "-",
          formatCurrencyForExport(sale.total_gst || 0),
          formatCurrencyForExport(sale.total_amount || 0),
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [["Date", "Party", "Bill No", "GST (₹)", "Total (₹)"]],
          body: salesData,
          theme: "grid",
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 14, right: 14 },
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // Sales Totals
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(
          `Total Sales GST: ₹${formatCurrencyForExport(
            financialData.monthlySales.totalGST || 0
          )}`,
          120,
          yPos,
          { align: "right" }
        );
        yPos += 7;
        doc.text(
          `Total Sales Amount: ₹${formatCurrencyForExport(
            financialData.monthlySales.totalAmount || 0
          )}`,
          120,
          yPos,
          { align: "right" }
        );
        yPos += 15;
      }

      // 3. Monthly Purchases Summary (Selected Month)
      if (financialData.monthlyPurchases?.data?.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(147, 51, 234);
        doc.text(
          `Monthly Purchases (${getMonthName()} ${selectedYear})`,
          14,
          yPos
        );
        yPos += 10;

        const purchasesData = financialData.monthlyPurchases.data.map(
          (purchase) => [
            purchase.bill_date || "-",
            purchase.party_type || "-",
            purchase.party_name ||
              purchase.vendor_name ||
              purchase.farmer_name ||
              "-",
            purchase.bill_no || "-",
            formatCurrencyForExport(purchase.gst_amount || 0),
            formatCurrencyForExport(purchase.total_amount || 0),
          ]
        );

        autoTable(doc, {
          startY: yPos,
          head: [["Date", "Type", "Party", "Bill No", "GST (₹)", "Total (₹)"]],
          body: purchasesData,
          theme: "grid",
          headStyles: { fillColor: [147, 51, 234] },
          margin: { left: 14, right: 14 },
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // Purchases Totals
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(
          `Total Purchases GST: ₹${formatCurrencyForExport(
            financialData.monthlyPurchases.totalGST || 0
          )}`,
          120,
          yPos,
          { align: "right" }
        );
        yPos += 7;
        doc.text(
          `Total Purchases Amount: ₹${formatCurrencyForExport(
            financialData.monthlyPurchases.totalAmount || 0
          )}`,
          120,
          yPos,
          { align: "right" }
        );
        yPos += 15;
      }

      // 4. Monthly Expenses Summary (Selected Month)
      if (financialData.monthlyExpenses?.data?.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(220, 38, 38);
        doc.text(
          `Monthly Expenses (${getMonthName()} ${selectedYear})`,
          14,
          yPos
        );
        yPos += 10;

        const expensesData = financialData.monthlyExpenses.data.map(
          (expense) => [
            expense.bill_date || expense.expense_date || "-",
            expense.expenses_for || expense.expenses_type || "-",
            (expense.remark || "-").substring(0, 30) +
              (expense.remark?.length > 30 ? "..." : ""),
            expense.bill_no || "-",
            formatCurrencyForExport(
              expense.total_gst_amount || expense.total_gst || 0
            ),
            formatCurrencyForExport(
              expense.total_amount || expense.amount || 0
            ),
          ]
        );

        autoTable(doc, {
          startY: yPos,
          head: [
            ["Date", "Type", "Description", "Bill No", "GST (₹)", "Total (₹)"],
          ],
          body: expensesData,
          theme: "grid",
          headStyles: { fillColor: [220, 38, 38] },
          margin: { left: 14, right: 14 },
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // Expenses Totals
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(
          `Total Expenses GST: ₹${formatCurrencyForExport(
            financialData.monthlyExpenses.totalGST || 0
          )}`,
          120,
          yPos,
          { align: "right" }
        );
        yPos += 7;
        doc.text(
          `Total Expenses Amount: ₹${formatCurrencyForExport(
            financialData.monthlyExpenses.totalAmount || 0
          )}`,
          120,
          yPos,
          { align: "right" }
        );
        yPos += 15;
      }

      // 5. Profit & Loss Summary (Selected Month)
      doc.setFontSize(16);
      doc.setTextColor(5, 150, 105);
      doc.text(
        `Profit & Loss Summary (${getMonthName()} ${selectedYear})`,
        14,
        yPos
      );
      yPos += 10;

      const netProfitLoss = calculateNetProfitLoss();
      const profitLossData = [
        ["Category", "Amount (₹)"],
        [
          "Total Sales",
          formatCurrencyForExport(financialData.monthlySales?.totalAmount || 0),
        ],
        [
          "Total Purchases",
          formatCurrencyForExport(
            financialData.monthlyPurchases?.totalAmount || 0
          ),
        ],
        [
          "Total Expenses",
          formatCurrencyForExport(
            financialData.monthlyExpenses?.totalAmount || 0
          ),
        ],
        [
          "Total Costs",
          formatCurrencyForExport(
            (financialData.monthlyPurchases?.totalAmount || 0) +
              (financialData.monthlyExpenses?.totalAmount || 0)
          ),
        ],
        ["Net Profit/Loss", formatCurrencyForExport(netProfitLoss)],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [profitLossData[0]],
        body: profitLossData.slice(1),
        theme: "grid",
        headStyles: { fillColor: [5, 150, 105] },
        margin: { left: 14, right: 14 },
        didDrawCell: function (data) {
          if (data.row.index === profitLossData.length - 2) {
            data.cell.styles.fillColor = [243, 244, 246];
          }
          if (data.row.index === profitLossData.length - 1) {
            data.cell.styles.fillColor =
              netProfitLoss >= 0 ? [220, 252, 231] : [254, 226, 226];
            data.cell.styles.textColor =
              netProfitLoss >= 0 ? [22, 163, 74] : [220, 38, 38];
          }
        },
      });

      yPos = doc.lastAutoTable.finalY + 15;

      // 6. Closing Balance (if available)
      if (showClosingBalance && financialData.closingBalance) {
        doc.setFontSize(16);
        doc.setTextColor(30, 64, 175);
        doc.text("Closing Balance", 14, yPos);
        yPos += 10;

        const closingData = [
          ["Category", "Amount (₹)", "GST (₹)", "Total (₹)"],
          [
            "Sales",
            formatCurrencyForExport(
              financialData.closingBalance?.totalSales || 0
            ),
            formatCurrencyForExport(
              financialData.closingBalance?.totalSalesGST || 0
            ),
            formatCurrencyForExport(
              (financialData.closingBalance?.totalSales || 0) +
                (financialData.closingBalance?.totalSalesGST || 0)
            ),
          ],
          [
            "Purchases",
            formatCurrencyForExport(
              financialData.closingBalance?.totalPurchases || 0
            ),
            formatCurrencyForExport(
              financialData.closingBalance?.totalPurchasesGST || 0
            ),
            formatCurrencyForExport(
              (financialData.closingBalance?.totalPurchases || 0) +
                (financialData.closingBalance?.totalPurchasesGST || 0)
            ),
          ],
          [
            "Expenses",
            formatCurrencyForExport(
              financialData.closingBalance?.totalExpenses || 0
            ),
            formatCurrencyForExport(
              financialData.closingBalance?.totalExpensesGST || 0
            ),
            formatCurrencyForExport(
              (financialData.closingBalance?.totalExpenses || 0) +
                (financialData.closingBalance?.totalExpensesGST || 0)
            ),
          ],
          [
            "Outstanding to Receive",
            formatCurrencyForExport(
              financialData.closingBalance?.outstandingToReceive || 0
            ),
            "-",
            formatCurrencyForExport(
              financialData.closingBalance?.outstandingToReceive || 0
            ),
          ],
          [
            "Outstanding to Pay",
            formatCurrencyForExport(
              financialData.closingBalance?.outstandingToPay || 0
            ),
            "-",
            formatCurrencyForExport(
              financialData.closingBalance?.outstandingToPay || 0
            ),
          ],
        ];

        autoTable(doc, {
          startY: yPos,
          head: [closingData[0]],
          body: closingData.slice(1),
          theme: "grid",
          headStyles: { fillColor: [30, 64, 175] },
          margin: { left: 14, right: 14 },
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: "center" });
      }

      // Save PDF
      const fileName = `Financial_Statement_${getCompanyName().replace(
        /[^a-z0-9]/gi,
        "_"
      )}_${getMonthName()}_${selectedYear}.pdf`;
      doc.save(fileName);

      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  // Export to Excel
  const handleExportExcel = async () => {
    if (!financialData) {
      toast.error("No data to export");
      return;
    }

    setExporting(true);
    try {
      // Create a new workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Financial System";
      workbook.lastModifiedBy = "Financial System";
      workbook.created = new Date();
      workbook.modified = new Date();

      // Add worksheets
      const summarySheet = workbook.addWorksheet("Summary");
      const openingSheet = workbook.addWorksheet("Opening Balance");
      const salesSheet = workbook.addWorksheet("Monthly Sales");
      const purchasesSheet = workbook.addWorksheet("Monthly Purchases");
      const expensesSheet = workbook.addWorksheet("Monthly Expenses");
      const profitLossSheet = workbook.addWorksheet("Profit & Loss");

      if (showClosingBalance && financialData.closingBalance) {
        workbook.addWorksheet("Closing Balance");
      }

      // Helper function to add title
      const addTitle = (worksheet, title, startRow = 1) => {
        worksheet.mergeCells(`A${startRow}:D${startRow}`);
        const titleCell = worksheet.getCell(`A${startRow}`);
        titleCell.value = title;
        titleCell.font = { bold: true, size: 14, color: { argb: "FF1F4E79" } };
        titleCell.alignment = { horizontal: "center" };
        return startRow + 2;
      };

      // Helper function to add table
      const addTable = (
        worksheet,
        data,
        startRow,
        startCol = 1,
        title = null
      ) => {
        let currentRow = startRow;

        // Add title if provided
        if (title) {
          currentRow = addTitle(worksheet, title, currentRow);
        }

        // Add headers
        const headers = data[0];
        headers.forEach((header, colIndex) => {
          const cell = worksheet.getCell(currentRow, startCol + colIndex);
          cell.value = header;
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF4F81BD" },
          };
          cell.alignment = { horizontal: "center", vertical: "center" };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        currentRow++;

        // Add data rows
        for (let i = 1; i < data.length; i++) {
          const rowData = data[i];
          rowData.forEach((cellData, colIndex) => {
            const cell = worksheet.getCell(currentRow, startCol + colIndex);

            // Determine if it's a number
            if (typeof cellData === "number" || !isNaN(cellData)) {
              const numValue =
                typeof cellData === "string" ? parseFloat(cellData) : cellData;
              cell.value = numValue;
              cell.numFmt = "#,##0.00";
            } else {
              cell.value = cellData.toString();
            }

            // Alternate row coloring
            if (i % 2 === 0) {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF2F2F2" },
              };
            }

            cell.border = {
              top: { style: "thin", color: { argb: "FFD9D9D9" } },
              left: { style: "thin", color: { argb: "FFD9D9D9" } },
              bottom: { style: "thin", color: { argb: "FFD9D9D9" } },
              right: { style: "thin", color: { argb: "FFD9D9D9" } },
            };
          });
          currentRow++;
        }

        return currentRow;
      };

      // 1. SUMMARY SHEET
      let currentRow = 1;

      // Title
      currentRow = addTitle(
        summarySheet,
        "FINANCIAL STATEMENT SUMMARY",
        currentRow
      );

      // Company Info
      summarySheet.getCell(`A${currentRow}`).value = "Company:";
      summarySheet.getCell(`A${currentRow}`).font = { bold: true };
      summarySheet.getCell(`B${currentRow}`).value = getCompanyName();
      currentRow++;

      summarySheet.getCell(`A${currentRow}`).value = "Period:";
      summarySheet.getCell(`A${currentRow}`).font = { bold: true };
      summarySheet.getCell(
        `B${currentRow}`
      ).value = `${getMonthName()} ${selectedYear}`;
      currentRow++;

      summarySheet.getCell(`A${currentRow}`).value = "Generated:";
      summarySheet.getCell(`A${currentRow}`).font = { bold: true };
      summarySheet.getCell(`B${currentRow}`).value =
        new Date().toLocaleDateString();
      currentRow += 2;

      // Key Metrics Table
      const netProfitLoss = calculateNetProfitLoss();
      const summaryData = [
        ["Key Metrics", "Amount (₹)", "Notes"],
        ["Total Sales", financialData.monthlySales?.totalAmount || 0, ""],
        [
          "Total Purchases",
          financialData.monthlyPurchases?.totalAmount || 0,
          "",
        ],
        ["Total Expenses", financialData.monthlyExpenses?.totalAmount || 0, ""],
        [
          "Total Costs",
          (financialData.monthlyPurchases?.totalAmount || 0) +
            (financialData.monthlyExpenses?.totalAmount || 0),
          "Purchases + Expenses",
        ],
        [
          "Net Profit/Loss",
          netProfitLoss,
          netProfitLoss >= 0 ? "Profit" : "Loss",
        ],
        [
          "Profit Margin %",
          financialData.monthlySales?.totalAmount > 0
            ? (
                (netProfitLoss / financialData.monthlySales.totalAmount) *
                100
              ).toFixed(2) + "%"
            : "0.00%",
          "",
        ],
      ];

      currentRow = addTable(
        summarySheet,
        summaryData,
        currentRow,
        1,
        "Key Financial Metrics"
      );

      // Outstanding Table
      const outstandingData = [
        ["Outstanding", "Amount (₹)", "Status"],
        [
          "To Receive",
          financialData.openingBalance?.outstandingToReceive || 0,
          "",
        ],
        ["To Pay", financialData.openingBalance?.outstandingToPay || 0, ""],
        [
          "Net Outstanding",
          (financialData.openingBalance?.outstandingToReceive || 0) -
            (financialData.openingBalance?.outstandingToPay || 0),
          "",
        ],
      ];

      addTable(
        summarySheet,
        outstandingData,
        currentRow,
        1,
        "Outstanding Summary"
      );

      // Set column widths for summary sheet
      summarySheet.columns = [{ width: 25 }, { width: 20 }, { width: 20 }];

      // 2. OPENING BALANCE SHEET (Previous Month)
      const openingBalanceData = [
        ["Category", "Amount (₹)", "GST (₹)", "Total (₹)"],
        [
          "Sales",
          financialData.openingBalance?.totalSales || 0,
          financialData.openingBalance?.totalSalesGST || 0,
          (financialData.openingBalance?.totalSales || 0) +
            (financialData.openingBalance?.totalSalesGST || 0),
        ],
        [
          "Purchases",
          financialData.openingBalance?.totalPurchases || 0,
          financialData.openingBalance?.totalPurchasesGST || 0,
          (financialData.openingBalance?.totalPurchases || 0) +
            (financialData.openingBalance?.totalPurchasesGST || 0),
        ],
        [
          "Expenses",
          financialData.openingBalance?.totalExpenses || 0,
          financialData.openingBalance?.totalExpensesGST || 0,
          (financialData.openingBalance?.totalExpenses || 0) +
            (financialData.openingBalance?.totalExpensesGST || 0),
        ],
        [
          "Outstanding to Receive",
          financialData.openingBalance?.outstandingToReceive || 0,
          "-",
          financialData.openingBalance?.outstandingToReceive || 0,
        ],
        [
          "Outstanding to Pay",
          financialData.openingBalance?.outstandingToPay || 0,
          "-",
          financialData.openingBalance?.outstandingToPay || 0,
        ],
      ];

      addTable(
        openingSheet,
        openingBalanceData,
        1,
        1,
        `OPENING BALANCE (${
          financialData.openingBalance?.period || "Previous Month"
        })`
      );

      // Set column widths
      openingSheet.columns = [
        { width: 25 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
      ];

      // 3. MONTHLY SALES SHEET (Selected Month)
      if (financialData.monthlySales?.data?.length > 0) {
        const salesHeaders = [
          "Date",
          "Party",
          "Bill No",
          "GST (₹)",
          "Total (₹)",
        ];
        const salesRows = financialData.monthlySales.data.map((sale) => [
          sale.bill_date || "-",
          sale.party_name || "-",
          sale.bill_no || "-",
          sale.total_gst || 0,
          sale.total_amount || 0,
        ]);

        const salesData = [salesHeaders, ...salesRows];
        addTable(
          salesSheet,
          salesData,
          1,
          1,
          `MONTHLY SALES SUMMARY (${getMonthName()} ${selectedYear})`
        );

        // Add totals
        const lastRow = salesSheet.lastRow.number + 2;
        salesSheet.getCell(`D${lastRow}`).value = "Total GST:";
        salesSheet.getCell(`D${lastRow}`).font = { bold: true };
        salesSheet.getCell(`E${lastRow}`).value =
          financialData.monthlySales.totalGST || 0;
        salesSheet.getCell(`E${lastRow}`).numFmt = "#,##0.00";
        salesSheet.getCell(`E${lastRow}`).font = { bold: true };

        salesSheet.getCell(`D${lastRow + 1}`).value = "Total Amount:";
        salesSheet.getCell(`D${lastRow + 1}`).font = { bold: true };
        salesSheet.getCell(`E${lastRow + 1}`).value =
          financialData.monthlySales.totalAmount || 0;
        salesSheet.getCell(`E${lastRow + 1}`).numFmt = "#,##0.00";
        salesSheet.getCell(`E${lastRow + 1}`).font = { bold: true };

        // Set column widths
        salesSheet.columns = [
          { width: 12 },
          { width: 25 },
          { width: 15 },
          { width: 15 },
          { width: 15 },
        ];
      }

      // 4. MONTHLY PURCHASES SHEET (Selected Month)
      if (financialData.monthlyPurchases?.data?.length > 0) {
        const purchasesHeaders = [
          "Date",
          "Type",
          "Party",
          "Bill No",
          "GST (₹)",
          "Total (₹)",
        ];
        const purchasesRows = financialData.monthlyPurchases.data.map(
          (purchase) => [
            purchase.bill_date || "-",
            purchase.party_type || "-",
            purchase.party_name ||
              purchase.vendor_name ||
              purchase.farmer_name ||
              "-",
            purchase.bill_no || "-",
            purchase.gst_amount || 0,
            purchase.total_amount || 0,
          ]
        );

        const purchasesData = [purchasesHeaders, ...purchasesRows];
        addTable(
          purchasesSheet,
          purchasesData,
          1,
          1,
          `MONTHLY PURCHASES SUMMARY (${getMonthName()} ${selectedYear})`
        );

        // Add totals
        const lastRow = purchasesSheet.lastRow.number + 2;
        purchasesSheet.getCell(`E${lastRow}`).value = "Total GST:";
        purchasesSheet.getCell(`E${lastRow}`).font = { bold: true };
        purchasesSheet.getCell(`F${lastRow}`).value =
          financialData.monthlyPurchases.totalGST || 0;
        purchasesSheet.getCell(`F${lastRow}`).numFmt = "#,##0.00";
        purchasesSheet.getCell(`F${lastRow}`).font = { bold: true };

        purchasesSheet.getCell(`E${lastRow + 1}`).value = "Total Amount:";
        purchasesSheet.getCell(`E${lastRow + 1}`).font = { bold: true };
        purchasesSheet.getCell(`F${lastRow + 1}`).value =
          financialData.monthlyPurchases.totalAmount || 0;
        purchasesSheet.getCell(`F${lastRow + 1}`).numFmt = "#,##0.00";
        purchasesSheet.getCell(`F${lastRow + 1}`).font = { bold: true };

        // Set column widths
        purchasesSheet.columns = [
          { width: 12 },
          { width: 15 },
          { width: 25 },
          { width: 15 },
          { width: 15 },
          { width: 15 },
        ];
      }

      // 5. MONTHLY EXPENSES SHEET (Selected Month)
      if (financialData.monthlyExpenses?.data?.length > 0) {
        const expensesHeaders = [
          "Date",
          "Type",
          "Description",
          "Bill No",
          "GST (₹)",
          "Total (₹)",
        ];
        const expensesRows = financialData.monthlyExpenses.data.map(
          (expense) => [
            expense.bill_date || expense.expense_date || "-",
            expense.expenses_for || expense.expenses_type || "-",
            expense.remark || "-",
            expense.bill_no || "-",
            expense.total_gst_amount || expense.total_gst || 0,
            expense.total_amount || expense.amount || 0,
          ]
        );

        const expensesData = [expensesHeaders, ...expensesRows];
        addTable(
          expensesSheet,
          expensesData,
          1,
          1,
          `MONTHLY EXPENSES SUMMARY (${getMonthName()} ${selectedYear})`
        );

        // Add totals
        const lastRow = expensesSheet.lastRow.number + 2;
        expensesSheet.getCell(`E${lastRow}`).value = "Total GST:";
        expensesSheet.getCell(`E${lastRow}`).font = { bold: true };
        expensesSheet.getCell(`F${lastRow}`).value =
          financialData.monthlyExpenses.totalGST || 0;
        expensesSheet.getCell(`F${lastRow}`).numFmt = "#,##0.00";
        expensesSheet.getCell(`F${lastRow}`).font = { bold: true };

        expensesSheet.getCell(`E${lastRow + 1}`).value = "Total Amount:";
        expensesSheet.getCell(`E${lastRow + 1}`).font = { bold: true };
        expensesSheet.getCell(`F${lastRow + 1}`).value =
          financialData.monthlyExpenses.totalAmount || 0;
        expensesSheet.getCell(`F${lastRow + 1}`).numFmt = "#,##0.00";
        expensesSheet.getCell(`F${lastRow + 1}`).font = { bold: true };

        // Set column widths
        expensesSheet.columns = [
          { width: 12 },
          { width: 15 },
          { width: 30 },
          { width: 15 },
          { width: 15 },
          { width: 15 },
        ];
      }

      // 6. PROFIT & LOSS SHEET (Selected Month)
      const profitLossData = [
        ["Category", "Amount (₹)", "Notes"],
        ["Total Sales", financialData.monthlySales?.totalAmount || 0, ""],
        [
          "Total Purchases",
          financialData.monthlyPurchases?.totalAmount || 0,
          "",
        ],
        ["Total Expenses", financialData.monthlyExpenses?.totalAmount || 0, ""],
        [
          "Total Costs",
          (financialData.monthlyPurchases?.totalAmount || 0) +
            (financialData.monthlyExpenses?.totalAmount || 0),
          "Purchases + Expenses",
        ],
        [
          "Net Profit/Loss",
          netProfitLoss,
          netProfitLoss >= 0 ? "Profit" : "Loss",
        ],
      ];

      addTable(
        profitLossSheet,
        profitLossData,
        1,
        1,
        `PROFIT & LOSS SUMMARY (${getMonthName()} ${selectedYear})`
      );

      // Add profit margin
      const lastRow = profitLossSheet.lastRow.number + 2;
      profitLossSheet.getCell(`A${lastRow}`).value = "Profit Margin %";
      profitLossSheet.getCell(`A${lastRow}`).font = { bold: true };
      profitLossSheet.getCell(`B${lastRow}`).value =
        financialData.monthlySales?.totalAmount > 0
          ? (
              (netProfitLoss / financialData.monthlySales.totalAmount) *
              100
            ).toFixed(2) + "%"
          : "0.00%";
      profitLossSheet.getCell(`B${lastRow}`).font = { bold: true };

      // Set column widths
      profitLossSheet.columns = [{ width: 25 }, { width: 20 }, { width: 20 }];

      // 7. CLOSING BALANCE SHEET (if available)
      if (showClosingBalance && financialData.closingBalance) {
        const closingSheet = workbook.getWorksheet("Closing Balance");
        const closingBalanceData = [
          ["Category", "Amount (₹)", "GST (₹)", "Total (₹)"],
          [
            "Sales",
            financialData.closingBalance?.totalSales || 0,
            financialData.closingBalance?.totalSalesGST || 0,
            (financialData.closingBalance?.totalSales || 0) +
              (financialData.closingBalance?.totalSalesGST || 0),
          ],
          [
            "Purchases",
            financialData.closingBalance?.totalPurchases || 0,
            financialData.closingBalance?.totalPurchasesGST || 0,
            (financialData.closingBalance?.totalPurchases || 0) +
              (financialData.closingBalance?.totalPurchasesGST || 0),
          ],
          [
            "Expenses",
            financialData.closingBalance?.totalExpenses || 0,
            financialData.closingBalance?.totalExpensesGST || 0,
            (financialData.closingBalance?.totalExpenses || 0) +
              (financialData.closingBalance?.totalExpensesGST || 0),
          ],
          [
            "Outstanding to Receive",
            financialData.closingBalance?.outstandingToReceive || 0,
            "-",
            financialData.closingBalance?.outstandingToReceive || 0,
          ],
          [
            "Outstanding to Pay",
            financialData.closingBalance?.outstandingToPay || 0,
            "-",
            financialData.closingBalance?.outstandingToPay || 0,
          ],
        ];

        addTable(closingSheet, closingBalanceData, 1, 1, "CLOSING BALANCE");

        // Set column widths
        closingSheet.columns = [
          { width: 25 },
          { width: 15 },
          { width: 15 },
          { width: 15 },
        ];
      }

      // Save the workbook
      const fileName = `Financial_Statement_${getCompanyName().replace(
        /[^a-z0-9]/gi,
        "_"
      )}_${getMonthName()}_${selectedYear}.xlsx`;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(blob, fileName);
      toast.success("Excel file exported successfully!");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast.error("Failed to export Excel: " + error.message);
    } finally {
      setExporting(false);
    }
  };

  // Combined export handler
  const handleExport = (type) => {
    if (!financialData) {
      toast.error("No data to export");
      return;
    }

    if (type === "PDF") {
      handleExportPDF();
    } else if (type === "Excel") {
      handleExportExcel();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Financial Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          View opening/closing balances, monthly summaries, and profit/loss
          statements
        </p>
      </div>

      {/* Filters Section */}
      <div
        className={`bg-white rounded-xl shadow-md mb-6 transition-all duration-300 ${
          showFilters ? "p-6" : "p-4"
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            <FaFilter className="inline mr-2" />
            Filters & Controls
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-blue-600 hover:text-blue-800"
          >
            {showFilters ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Company Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaBuilding className="inline mr-2" />
                Select Company
              </label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.code} - {company.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaCalendarAlt className="inline mr-2" />
                Select Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Month</option>
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaCalendarAlt className="inline mr-2" />
                Select Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isFutureDate ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
              >
                <option value="">Select Year</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {isFutureDate && (
                <p className="text-sm text-red-600 mt-1 flex items-center">
                  <FaExclamationTriangle className="mr-1" />
                  Cannot select future date
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-end space-x-3">
              <button
                onClick={fetchFinancialData}
                disabled={
                  loading ||
                  !selectedCompany ||
                  !selectedMonth ||
                  !selectedYear ||
                  isFutureDate
                }
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <FaSync className="animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <FaSearch className="mr-2" />
                    Fetch Data
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Export Buttons */}
        {financialData && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex space-x-3">
              <button
                onClick={() => handleExport("PDF")}
                disabled={exporting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <FaSync className="animate-spin mr-2" />
                ) : (
                  <FaFilePdf className="mr-2" />
                )}
                {exporting ? "Exporting..." : "Export PDF"}
              </button>
              <button
                onClick={() => handleExport("Excel")}
                disabled={exporting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <FaSync className="animate-spin mr-2" />
                ) : (
                  <FaFileExcel className="mr-2" />
                )}
                {exporting ? "Exporting..." : "Export Excel"}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Export includes: Opening Balance, Monthly
              Sales/Purchases/Expenses, Profit & Loss, and Closing Balance
            </p>
          </div>
        )}
      </div>

      {/* Financial Dashboard */}
      {financialData ? (
        <>
          {/* Opening Balance */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FaMoneyBillWave className="mr-2" />
              Opening Balance (
              {financialData.openingBalance?.period || "Previous Month"})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Sales Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-blue-800">Total Sales</h3>
                  {financialData?.openingBalance?.totalSales != 0 && (
                    <button
                      onClick={() => handleViewSalesDetails(false)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Details
                    </button>
                  )}
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {formatCurrency(
                    financialData.openingBalance?.totalSales || 0
                  )}
                </div>
                <div className="text-sm text-blue-600 mt-2">
                  GST:{" "}
                  {formatCurrency(
                    financialData.openingBalance?.totalSalesGST || 0
                  )}
                </div>
              </div>

              {/* Purchases Summary */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-purple-800">
                    Total Purchases
                  </h3>
                  {financialData?.openingBalance?.totalPurchases != 0 && (
                    <button
                      onClick={() => handleViewPurchasesDetails(false)}
                      className="text-purple-600 hover:text-purple-800 text-sm"
                    >
                      View Details
                    </button>
                  )}
                </div>
                <div className="text-2xl font-bold text-purple-700">
                  {formatCurrency(
                    financialData.openingBalance?.totalPurchases || 0
                  )}
                </div>
                <div className="text-sm text-purple-600 mt-2">
                  GST:{" "}
                  {formatCurrency(
                    financialData.openingBalance?.totalPurchasesGST || 0
                  )}
                </div>
              </div>

              {/* Expenses Summary */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-red-800">Total Expenses</h3>
                  {financialData?.openingBalance?.totalExpenses != 0 && (
                    <button
                      onClick={() => handleViewExpensesDetails(false)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      View Details
                    </button>
                  )}
                </div>
                <div className="text-2xl font-bold text-red-700">
                  {formatCurrency(
                    financialData.openingBalance?.totalExpenses || 0
                  )}
                </div>
                <div className="text-sm text-red-600 mt-2">
                  GST:{" "}
                  {formatCurrency(
                    financialData.openingBalance?.totalExpensesGST || 0
                  )}
                </div>
              </div>

              {/* Outstanding Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">
                  Outstanding
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">To Receive:</span>
                    <span className="font-medium text-green-700">
                      {formatCurrency(
                        financialData.openingBalance?.outstandingToReceive || 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">To Pay:</span>
                    <span className="font-medium text-green-700">
                      {formatCurrency(
                        financialData.openingBalance?.outstandingToPay || 0
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Summaries */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FaCalendarAlt className="mr-2" />
              Monthly Summary ({getMonthName()} {selectedYear})
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sales Summary Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-blue-600 text-white p-4">
                  <h3 className="font-bold text-lg">Monthly Sales Summary</h3>
                </div>
                <div className="p-4">
                  {financialData.monthlySales?.data?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Date
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Party
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Bill No
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              GST
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Total
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Items
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {financialData.monthlySales.data
                            .slice(0, 5)
                            .map((sale, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm">
                                  {sale.bill_date}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  {sale.party_name}
                                </td>
                                <td className="px-4 py-2 text-sm font-medium">
                                  {sale.bill_no}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  {formatCurrency(sale.total_gst)}
                                </td>
                                <td className="px-4 py-2 text-sm font-medium">
                                  {formatCurrency(sale.total_amount)}
                                </td>
                                <td className="px-4 py-2">
                                  <button
                                    onClick={() =>
                                      handleViewBillItems(sale, "sales")
                                    }
                                    disabled={loadingItems}
                                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                                  >
                                    <FaEye className="mr-1" />
                                    View Items
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No sales data available
                    </p>
                  )}

                  {/* Totals */}
                  {financialData.monthlySales?.data?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total GST:</span>
                        <span className="font-bold text-blue-600">
                          {formatCurrency(financialData.monthlySales.totalGST)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-medium">Total Amount:</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(
                            financialData.monthlySales.totalAmount
                          )}
                        </span>
                      </div>
                      <div className="mt-3 text-center">
                        <button
                          onClick={() => handleViewSalesDetails(true)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View All ({financialData.monthlySales.data.length}{" "}
                          entries)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Purchases Summary Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-purple-600 text-white p-4">
                  <h3 className="font-bold text-lg">
                    Monthly Purchases Summary
                  </h3>
                </div>
                <div className="p-4">
                  {financialData.monthlyPurchases?.data?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Date
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Type
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Party
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Bill No
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              GST
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Total
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Items
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {financialData.monthlyPurchases.data
                            .slice(0, 5)
                            .map((purchase, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm">
                                  {purchase.bill_date}
                                </td>
                                <td className="px-4 py-2 text-sm capitalize">
                                  {purchase.party_type}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  {purchase.party_name ||
                                    purchase.vendor_name ||
                                    purchase.farmer_name ||
                                    "-"}
                                </td>
                                <td className="px-4 py-2 text-sm font-medium">
                                  {purchase.bill_no}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  {formatCurrency(purchase.gst_amount)}
                                </td>
                                <td className="px-4 py-2 text-sm font-medium">
                                  {formatCurrency(purchase.total_amount)}
                                </td>
                                <td className="px-4 py-2">
                                  <button
                                    onClick={() =>
                                      handleViewBillItems(purchase, "purchases")
                                    }
                                    disabled={loadingItems}
                                    className="text-purple-600 hover:text-purple-800 text-sm flex items-center"
                                  >
                                    <FaEye className="mr-1" />
                                    View Items
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No purchases data available
                    </p>
                  )}

                  {/* Totals */}
                  {financialData.monthlyPurchases?.data?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total GST:</span>
                        <span className="font-bold text-purple-600">
                          {formatCurrency(
                            financialData.monthlyPurchases.totalGST
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-medium">Total Amount:</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(
                            financialData.monthlyPurchases.totalAmount
                          )}
                        </span>
                      </div>
                      <div className="mt-3 text-center">
                        <button
                          onClick={() => handleViewPurchasesDetails(true)}
                          className="text-purple-600 hover:text-purple-800 text-sm"
                        >
                          View All ({financialData.monthlyPurchases.data.length}{" "}
                          entries)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Expenses Summary Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-red-600 text-white p-4">
                  <h3 className="font-bold text-lg">
                    Monthly Expenses Summary
                  </h3>
                </div>
                <div className="p-4">
                  {financialData.monthlyExpenses?.data?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Date
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Type
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Description
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Bill No
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              GST
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {financialData.monthlyExpenses.data
                            .slice(0, 5)
                            .map((expense, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm">
                                  {expense.bill_date || expense.expense_date}
                                </td>
                                <td className="px-4 py-2 text-sm capitalize">
                                  {expense.expenses_for ||
                                    expense.expenses_type ||
                                    "-"}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  {expense.remark || "-"}
                                </td>
                                <td className="px-4 py-2 text-sm font-medium">
                                  {expense.bill_no || "-"}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  {formatCurrency(
                                    expense.total_gst_amount ||
                                      expense.total_gst ||
                                      0
                                  )}
                                </td>
                                <td className="px-4 py-2 text-sm font-medium">
                                  {formatCurrency(
                                    expense.total_amount || expense.amount || 0
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No expenses data available
                    </p>
                  )}

                  {/* Totals */}
                  {financialData.monthlyExpenses?.data?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total GST:</span>
                        <span className="font-bold text-red-600">
                          {formatCurrency(
                            financialData.monthlyExpenses.totalGST
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-medium">Total Amount:</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(
                            financialData.monthlyExpenses.totalAmount
                          )}
                        </span>
                      </div>
                      <div className="mt-3 text-center">
                        <button
                          onClick={() => handleViewExpensesDetails(true)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          View All ({financialData.monthlyExpenses.data.length}{" "}
                          entries)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profit & Loss Summary (Selected Month) */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FaChartBar className="mr-2" />
              Profit & Loss Summary ({getMonthName()} {selectedYear})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">
                  Total Sales
                </h3>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(financialData.monthlySales?.totalAmount || 0)}
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">
                  Total Purchases
                </h3>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(
                    financialData.monthlyPurchases?.totalAmount || 0
                  )}
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">
                  Total Expenses
                </h3>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(
                    financialData.monthlyExpenses?.totalAmount || 0
                  )}
                </div>
              </div>

              <div
                className={`border rounded-lg p-4 ${
                  calculateNetProfitLoss() >= 0
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <h3 className="font-semibold text-gray-700 mb-2">
                  Net Profit/Loss
                </h3>
                <div
                  className={`text-2xl font-bold ${
                    calculateNetProfitLoss() >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(calculateNetProfitLoss())}
                </div>
                <div className="text-sm mt-2">
                  Profit Margin:{" "}
                  {financialData.monthlySales?.totalAmount > 0
                    ? (
                        (calculateNetProfitLoss() /
                          financialData.monthlySales.totalAmount) *
                        100
                      ).toFixed(2)
                    : "0.00"}
                  %
                </div>
              </div>
            </div>
          </div>

          {/* Closing Balance */}
          {showClosingBalance && financialData.closingBalance ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaMoneyBillWave className="mr-2" />
                Closing Balance
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">
                    Total Sales
                  </h3>
                  <div className="text-2xl font-bold text-blue-700">
                    {formatCurrency(
                      financialData.closingBalance?.totalSales || 0
                    )}
                  </div>
                  <div className="text-sm text-blue-600 mt-2">
                    GST:{" "}
                    {formatCurrency(
                      financialData.closingBalance?.totalSalesGST || 0
                    )}
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-800 mb-2">
                    Total Purchases
                  </h3>
                  <div className="text-2xl font-bold text-purple-700">
                    {formatCurrency(
                      financialData.closingBalance?.totalPurchases || 0
                    )}
                  </div>
                  <div className="text-sm text-purple-600 mt-2">
                    GST:{" "}
                    {formatCurrency(
                      financialData.closingBalance?.totalPurchasesGST || 0
                    )}
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2">
                    Total Expenses
                  </h3>
                  <div className="text-2xl font-bold text-red-700">
                    {formatCurrency(
                      financialData.closingBalance?.totalExpenses || 0
                    )}
                  </div>
                  <div className="text-sm text-red-600 mt-2">
                    GST:{" "}
                    {formatCurrency(
                      financialData.closingBalance?.totalExpensesGST || 0
                    )}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">
                    Outstanding
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-green-700">
                        To Receive:
                      </span>
                      <span className="font-medium text-green-700">
                        {formatCurrency(
                          financialData.closingBalance?.outstandingToReceive ||
                            0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-green-700">To Pay:</span>
                      <span className="font-medium text-green-700">
                        {formatCurrency(
                          financialData.closingBalance?.outstandingToPay || 0
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : !financialData.summary?.monthCompleted ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-center">
                <FaExclamationTriangle className="text-yellow-600 mr-3 text-xl" />
                <div>
                  <h3 className="font-bold text-yellow-800">
                    Closing Balance Not Available
                  </h3>
                  <p className="text-yellow-700 mt-1">
                    Closing balance is only shown for completed months. Since
                    you selected the current running month, closing balance will
                    be available after the month ends.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FaChartBar className="text-gray-300 text-6xl mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">
            No Data Loaded
          </h3>
          <p className="text-gray-500 mb-6">
            Select a company, month, and year, then click "Fetch Data" to view
            financial information
          </p>
          <button
            onClick={fetchFinancialData}
            disabled={
              !selectedCompany ||
              !selectedMonth ||
              !selectedYear ||
              isFutureDate
            }
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Fetch Data
          </button>
        </div>
      )}

      {/* Modals for detailed views */}
      {showSalesModal && (
        <SalesModal
          data={modalData}
          onClose={() => setShowSalesModal(false)}
          onViewItems={handleViewBillItems}
        />
      )}

      {showPurchasesModal && (
        <PurchasesModal
          data={modalData}
          onClose={() => setShowPurchasesModal(false)}
          onViewItems={handleViewBillItems}
        />
      )}

      {showExpensesModal && (
        <ExpensesModal
          data={modalData}
          onClose={() => setShowExpensesModal(false)}
        />
      )}

      {/* Bill Items Modal */}
      {showBillItemsModal && selectedBillForItems && (
        <BillItemsModal
          bill={selectedBillForItems}
          billType={billType}
          onClose={() => {
            setShowBillItemsModal(false);
            setSelectedBillForItems(null);
            setBillType("");
          }}
        />
      )}
    </div>
  );
};

export default BalanceSheet;
