import { api } from "./axios";

const expensesAPI = {
  ///// get only those which has status active
  getAll: () => api.get("/expenses"),
  //// create expenses
  create: (data) =>
    api.post("/expenses/create", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  //// like delete change status to inactive
  expensesUpdateStatus: (id) => api.put(`/expenses/expensesupdatestatus/${id}`),

  ///// get only the current month  expenses
  getCurrentmonth: () => api.get(`/expenses/currentmonth`),

  //// update the expenses
  expensesUpdate: (data, id) => api.put(`/expenses/updateexpenses/${id}`, data),

  //////////////////////////////////////// gst billing expenses

  /// get all the gst billing data expenses which has status active
  getAllExpensesBill: () => api.get("/expenses/getallexpensesgstbill"),

  ///// update the gst billing  data
  billexpensesUpdate: (data, id) =>
    api.put(`/expenses/updatebillexpenses/${id}`, data),

  /////// get only cyrrent nonth expenses
  getCurrentmonthGStExpenses: () =>
    api.get(`/expenses/currentmonthexpensesgst`),

  ////// create a  gst billing expenses
  billexpenses: (data) =>
    api.post("/expenses/billexpenses", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  ///// like delete update status to inactive
  expensesGstBillStatusChange: (id) =>
    api.put(`/expenses/billexpensesstatuschange/${id}`),
};

export default expensesAPI;
