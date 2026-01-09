const express = require("express");
const AllHolidayController = require("../controllers/holiday.controller");
const AllHolidayRoutes = express.Router();

AllHolidayRoutes.get("/", AllHolidayController.getAllHoliday);
AllHolidayRoutes.post("/", AllHolidayController.createHoliday);
AllHolidayRoutes.put("/:id", AllHolidayController.updateHoliday);
AllHolidayRoutes.delete("/:id", AllHolidayController.deleteHoliday);

module.exports = AllHolidayRoutes;
