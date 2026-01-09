const express = require("express");
const AllExpensesRoutes = express.Router();
const AllExpensesController = require("../controllers/expenses.controller");
const upload = require("../middlewares/multer.middleware.expenses");

// Get all retail sales bills with items

///expenses

AllExpensesRoutes.get("/", AllExpensesController.getAllExpenses);

AllExpensesRoutes.post(
  "/create",
  upload.array("files"),
  AllExpensesController.createExpenses
);

AllExpensesRoutes.get(
  "/currentmonth",
  AllExpensesController.getCurrentMonthExpenses
);

AllExpensesRoutes.put(
  "/expensesupdatestatus/:id",
  AllExpensesController.updateExpenseStatus
);

AllExpensesRoutes.put(
  "/updateexpenses/:id",
  upload.array("files"),
  AllExpensesController.updateExpenses
);

/////////////// gst bill expenses
///create
AllExpensesRoutes.post(
  "/billexpenses",
  upload.array("files"),
  AllExpensesController.createExpensesBill
);
//get
AllExpensesRoutes.get(
  "/getallexpensesgstbill",
  AllExpensesController.getAllExpensesBill
);

AllExpensesRoutes.get(
  "/currentmonthexpensesgst",
  AllExpensesController.getCurrentMonthGSTExpenses
);

///update expenses data
AllExpensesRoutes.put(
  "/updatebillexpenses/:id",
  upload.array("files"),
  AllExpensesController.updateBillExpenses
);

//update expenses status for hidding row
AllExpensesRoutes.put(
  "/billexpensesstatuschange/:id",
  AllExpensesController.updateBillExpensesStatus
);

module.exports = AllExpensesRoutes;
