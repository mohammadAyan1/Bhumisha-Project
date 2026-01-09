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
const vendorRoutes = require("./src/routes/vendor.routes");
const farmerRoutes = require("./src/routes/farmer.routes");
const categoryRoutes = require("./src/routes/categories.routes");
const productRoutes = require("./src/routes/product.routes");
const purchaseRoutes = require("./src/routes/purchase.routes");
const customerRouter = require("./src/routes/customer.routes");
const salesRoutes = require("./src/routes/sales.routes");
const salePaymentsRoutes = require("./src/routes/salePayments.routes");
const PurchaseOrderRouter = require("./src/routes/purchaseOrder.routes");
const SalesOrderRouter = require("./src/routes/salesOrder.routes");
const companyRoutes = require("./src/routes/company.routes");
// const authRoutes = require("./routes/auth.routes");
const authRoutes = require("./src/routes/auth.routes");

const sequencesRoutes = require("./src/routes/sequences.routes");
const vendorBackend = require("./src/routes/vendor.routes");
const { requireAuth } = require("./src/middlewares/auth");
const PoOrderroute = require("./src/routes/poOrder.routes");
const AllPurchasesBillRoutes = require("./src/routes/allpurchasesbill");
const AllSalesBillRoutes = require("./src/routes/allsalesbill");

// ---------- Core Config ----------
const NODE_ENV = process.env.NODE_ENV || "development";
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.FRONTEND2_URL;
const JSON_LIMIT = process.env.JSON_LIMIT || "2mb";

const allowedOrigins = [FRONTEND_URL, FRONTEND3_URL].filter(Boolean);

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

// ---------- Routes ----------
app.use("/api/auth", authRoutes);

// Protected routes (require valid Bearer token)
app.use("/api/vendors", requireAuth, vendorRoutes);
app.use("/api/vendor-bank-details", requireAuth, vendorBackend);
app.use("/api/farmers", requireAuth, farmerRoutes);
app.use("/api/categories", requireAuth, categoryRoutes);
app.use("/api/products", requireAuth, productRoutes);
// app.use("/api/", requireAuth, productRoutes);

app.use("/api/purchase", requireAuth, purchaseRoutes);
app.use("/api/purchase-orders", requireAuth, PurchaseOrderRouter);
app.use("/api/customers", requireAuth, customerRouter);
app.use("/api/sales", requireAuth, salesRoutes);
app.use("/api/so-orders", requireAuth, SalesOrderRouter);
app.use("/api/sale-payments", requireAuth, salePaymentsRoutes);
app.use("/api/companies", requireAuth, companyRoutes);
app.use("/api/sequences", requireAuth, sequencesRoutes);
app.use("/api/poorderremove", requireAuth, PoOrderroute);
app.use("/api/allpurchases", requireAuth, AllPurchasesBillRoutes);
app.use("/api/allsales", requireAuth, AllSalesBillRoutes);

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
