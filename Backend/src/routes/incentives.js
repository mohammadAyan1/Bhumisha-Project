const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/incentivesController");

router.post("/create", ctrl.createIncentive);
router.get("/employee/:id", ctrl.getIncentivesForEmployee);
router.get("/", ctrl.getAllIncentive);
router.put("/:id", ctrl.updateIncentive);
router.delete("/:id", ctrl.deleteIncentive);

module.exports = router;
