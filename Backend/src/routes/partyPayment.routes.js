const express = require("express");
const router = express.Router();
const PartyPaymentController = require("../controllers/partyPayment.controller");

// Process a bulk payment for a party
router.post("/", PartyPaymentController.processPartyPayment);

// Get summary (due & advance) for a party
router.get("/summary", PartyPaymentController.getPartySummary);

module.exports = router;
