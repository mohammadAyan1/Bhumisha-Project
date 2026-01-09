const express = require("express");
const companyRoutes = express.Router();
const ctrl = require("../controllers/company.controller");
const upload = require("../middlewares/multerMiddleware");

// Public access to uploaded files
// companyRoutes.use("/uploads", express.static("src/uploads"));

companyRoutes.post("/", upload.single("logo"), ctrl.create);
companyRoutes.get("/", ctrl.list);
companyRoutes.put("/:id", upload.single("logo"), ctrl.update);

module.exports = companyRoutes;
