const express = require("express");
const deletepoOrderController = require("../controllers/poOrder.controller");

const PoOrderroute = express.Router();


PoOrderroute.delete("/:id", deletepoOrderController);

module.exports = PoOrderroute;
