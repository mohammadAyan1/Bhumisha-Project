const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// Optional middlewares (env-based toggles)
const useHelmet = process.env.USE_HELMET === "true";
const useMorgan = process.env.USE_MORGAN === "true";

const app = express();

// Lazy-require optional deps only when enabled
let helmet = null;
let morgan = null;
if (useHelmet) {
  try {
    helmet = require("helmet");
  } catch {
    /* no-op */
  }
}
if (useMorgan) {
  try {
    morgan = require("morgan");
  } catch {
    /* no-op */
  }
}

// Routes
const vendorRoutes = require("./routes/vendor.routes");
const farmerRoutes = require("./routes/farmer.routes");
const categoryRoutes = require("./routes/categories.routes");
const productRoutes = require("./routes/product.routes");
const purchaseRoutes = require("./routes/purchase.routes");
const customerRouter = require("./routes/customer.routes");
const salesRoutes = require("./routes/sales.routes");
const salePaymentsRoutes = require("./routes/salePayments.routes");
const PurchaseOrderRouter = require("./routes/purchaseOrder.routes");
const SalesOrderRouter = require("./routes/salesOrder.routes");
const companyRoutes = require("./routes/company.routes");
const authRoutes = require("./routes/auth.routes");
const sequencesRoutes = require("./routes/sequences.routes");
const vendorBackend = require("./routes/vendor.routes");
const { requireAuth } = require("./middlewares/auth");
const PoOrderroute = require("./routes/poOrder.routes");
const customProductRoute = require("./routes/poOrder.routes");
const allPurchasesBillRoutes = require("./routes/allpurchasesbill");
const allSalesBillRoutes = require("./routes/allsalesbill");
const getAllSalesByBuyerType = require("./routes/getAllSalesByBuyerType");
const AllExpensesRoutes = require("./routes/expenses.routes");
const employeesRoutes = require("./routes/employees");
const attendanceRoutes = require("./routes/attendance");
const incentivesRoutes = require("./routes/incentives");
const salaryRoutes = require("./routes/salary");
const billPaymentRoutes = require("./routes/billPayment");

const balanceSheetRoutes = require("./routes/balanceSheet");

const holidayRoutes = require("./routes/holiday.routes");
const farmRoutes = require("./routes/farm.routes");
const clusterRoutes = require("./routes/cluster.routes");
const clusterProductRoutes = require("./routes/clusterProduct.routes");
const clusterProductAssignRoutes = require("./routes/clusterProductAssignRoutes");
const clusterSecondRoutes = require("./routes/clusterSecondProduct.routes");
const clusterInventoryRoutes = require("./routes/clusterInventoryRoutes");
const clusterTransactionRoutes = require("./routes/clusterTransactionRoutes");
const clusterCultivateRoutes = require("./routes/clusterCultivate.routes");
// ---------- Core Config ----------
const NODE_ENV = process.env.NODE_ENV || "development";
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.FRONTEND2_URL;
const JSON_LIMIT = process.env.JSON_LIMIT || "2mb";
const FRONTEND3_URL = process.env.FRONTEND3_URL;
// const FRONTEND4_URL = process.env.FRONTEND4_URL;

const allowedOrigins = [
  FRONTEND_URL,
  FRONTEND3_URL,
  "http://localhost:5174",
  "http://localhost:5173",
].filter(Boolean);

// CORS config with explicit 403 for unknown origins
const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // non-browser clients / server-to-server
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Origin not allowed by CORS"), false);
  },
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  // IMPORTANT: allow custom header used by tenant routing
  allowedHeaders: ["Content-Type", "Authorization", "x-company-code"],
  exposedHeaders: ["Content-Disposition"],
  maxAge: 86400,
};

// Handle CORS for all requests and short-circuit OPTIONS
app.use((req, res, next) => {
  const handler = cors(corsOptions);
  if (req.method === "OPTIONS") {
    return handler(req, res, () => res.sendStatus(204));
  }
  return handler(req, res, next);
});

// Body parsers
app.use(express.json({ limit: JSON_LIMIT }));
app.use(express.urlencoded({ extended: true }));

// Optional security/logging
if (helmet) app.use(helmet());
if (morgan) app.use(morgan("tiny"));

// ✅ Make uploads folder public (configured after ensuring uploads dir exists)

// ---------- Health ----------
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    env: NODE_ENV,
    ts: new Date().toISOString(),
  });
});

// ensure uploads dir exists and serve it at /uploads
const uploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));
app.use("/public", express.static(path.join(__dirname, "public")));

// Upload invoice image (expects JSON with base64 data URL)
app.post("/api/invoice-image", requireAuth, async (req, res) => {
  try {
    const { fileData, filename } = req.body || {};
    if (
      !fileData ||
      typeof fileData !== "string" ||
      !fileData.startsWith("data:image/")
    ) {
      return res
        .status(400)
        .json({ error: "fileData must be a data URL string (data:image/...)" });
    }
    const safeName = String(filename || `invoice-${Date.now()}.jpg`).replace(
      /[^a-zA-Z0-9_.-]+/g,
      "_"
    );
    const extMatch = fileData.match(/^data:(image\/(png|jpeg|jpg));base64,/i);
    const ext = extMatch ? (extMatch[2] === "png" ? "png" : "jpg") : "jpg";
    const finalName = safeName.endsWith(`.${ext}`)
      ? safeName
      : `${safeName}.${ext}`;
    const base64 = fileData.replace(/^data:image\/(png|jpeg|jpg);base64,/i, "");
    const buf = Buffer.from(base64, "base64");
    const outPath = path.join(uploadsDir, finalName);
    await fs.promises.writeFile(outPath, buf);
    return res.json({ url: `/uploads/${finalName}` });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ---------- Routes ----------
app.use("/api/auth", authRoutes);

// Protected routes (require valid Bearer token)
app.use("/api/farm", requireAuth, farmRoutes);
app.use("/api/clusters", requireAuth, clusterRoutes);
app.use("/api/clusters-products", requireAuth, clusterProductRoutes);
app.use("/api/clusters-second-products", requireAuth, clusterSecondRoutes);
app.use("/api/clusters-cultivate", requireAuth, clusterCultivateRoutes);

app.use("/api/clusters-assign-products", requireAuth);

app.use("/api/vendors", requireAuth, vendorRoutes);
app.use("/api/vendor-bank-details", requireAuth, vendorBackend);
app.use("/api/farmers", requireAuth, farmerRoutes);
app.use("/api/categories", requireAuth, categoryRoutes);
app.use("/api/products", requireAuth, productRoutes);
app.use("/api/clusters-inventory", requireAuth, clusterInventoryRoutes);
app.use("/api/cluster-transaction", requireAuth, clusterTransactionRoutes);

// app.use("/api/", requireAuth, productRoutes);

app.use("/api/purchase", requireAuth, purchaseRoutes);
app.use("/api/purchase-orders", requireAuth, PurchaseOrderRouter);
app.use("/api/customers", requireAuth, customerRouter);
app.use("/api/sales", salesRoutes); //restart from here
app.use("/api/so-orders", SalesOrderRouter);
app.use("/api/sale-payments", requireAuth, salePaymentsRoutes);
app.use("/api/companies", requireAuth, companyRoutes);
app.use("/api/sequences", requireAuth, sequencesRoutes);
app.use("/api/poorderremove", requireAuth, PoOrderroute);
app.use("/api/allpurchases", requireAuth, allPurchasesBillRoutes);
app.use("/api/allsales", requireAuth, allSalesBillRoutes);
app.use("/api/allsales-by-buyer-type", requireAuth, getAllSalesByBuyerType);
app.use("/api/expenses", requireAuth, AllExpensesRoutes);
app.use("/api/holiday", requireAuth, holidayRoutes);

app.use("/api/employees", requireAuth, employeesRoutes);
app.use("/api/attendance", requireAuth, attendanceRoutes);
app.use("/api/incentives", requireAuth, incentivesRoutes);
app.use("/api/salary", requireAuth, salaryRoutes);
app.use("/api/bills", requireAuth, billPaymentRoutes);
app.use("/api/balance-sheet", requireAuth, balanceSheetRoutes);

app.use(
  "/api/public/uploads",
  express.static(path.join(__dirname, "public", "uploads"))
);

app.use(
  "/api/src/uploads/expenses",
  express.static(path.join(__dirname, "uploads/expenses"))
);

app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

// app.use("/api/poorderremove", requireAuth, trash);

// Serve uploaded files at both /uploads and /api/uploads for consistency
const uploadsPath = path.join(__dirname, "public", "uploads");
app.use("/uploads", express.static(uploadsPath));
app.use("/api/uploads", express.static(uploadsPath));

// ---------- 404 ----------

// removed duplicate/incorrect /uploads static mount (uploads are served from uploadsDir above)

// app.use("/api/bill_img", purchaseRoutes); // base path

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).json({ message: "Not found", path: req.originalUrl });
});

// ---------- Error handler ----------
app.use((err, req, res, _next) => {
  // CORS unknown origin -> 403
  if (err && err.message === "Origin not allowed by CORS") {
    return res
      .status(403)
      .json({ message: "CORS blocked: Origin not allowed" });
  }

  const isProd = NODE_ENV === "production";
  const payload = { message: "Internal server error" };

  if (!isProd) {
    payload.error = {
      message: err?.message,
      stack: err?.stack,
      sql: err?.query,
      params: err?.params,
    };
    // eslint-disable-next-line no-console
    console.error("Unhandled error:", err);
  }

  return res.status(500).json(payload);
});

module.exports = app;
