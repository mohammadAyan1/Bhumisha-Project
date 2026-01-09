const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/attendanceController");

router.post("/mark", ctrl.markAttendance);
router.get("/employee/:id", ctrl.getAttendanceForEmployee);
router.get("/all", ctrl.getAttendanceForMonth);
router.post("/delete", ctrl.deleteAttendance);
router.delete("/deletepresent", ctrl.deletePresent);

module.exports = router;
