const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/salaryController");

router.post("/generate", ctrl.generateSalaryByMe);
router.get("/employee/:id", ctrl.getSalaryReport);

module.exports = router;
