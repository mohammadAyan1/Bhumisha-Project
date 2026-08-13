const db = require("../config/db");
const { tn } = require("../services/tableName");

const PartyPaymentController = {
  processPartyPayment: async (req, res) => {
    let conn;
    try {
      const {
        party_type,
        party_id,
        amount,
        payment_method = "Cash",
        date,
        remarks,
        billType, // "sales" or "purchase"
        company_id
      } = req.body;

      if (!party_type || !party_id || !amount || !billType || !company_id) {
        return res.status(400).json({
          message: "Missing required fields (party_type, party_id, amount, billType, company_id)",
          success: false,
        });
      }

      conn = await db.promise().getConnection();
      await conn.beginTransaction();

      // Get company code
      const [companyResult] = await conn.query("SELECT code FROM companies WHERE id = ?", [company_id]);
      if (!companyResult.length) {
        throw new Error("Company not found");
      }
      const companyCode = companyResult[0].code;

      let paymentAmount = parseFloat(amount);
      const originalAmount = paymentAmount;

      // Determine tables and columns
      const billTable = billType === "sales" ? "sales" : "purchases";
      const billTableCompany = tn(companyCode, billTable);
      const paymentTable = billType === "sales" ? "sale_payments" : "purchase_payments";
      const paymentTableCompany = tn(companyCode, paymentTable);
      
      const partyIdColumn = party_type === "customer" ? "customer_id" : (party_type === "vendor" ? "vendor_id" : "farmer_id");

      // Fetch unpaid bills ordered by date ASC (oldest first)
      let queryUnpaidBills = "";
      const queryParams = [party_id];
      let companyFilter = "";
      if (company_id) {
          companyFilter = " AND company_id = ?";
          queryParams.push(company_id);
      }

      if (billType === "sales") {
        queryUnpaidBills = `
          SELECT id, total_amount, COALESCE(paid_amount, 0) as paid_amount, 
          (total_amount - COALESCE(paid_amount, 0)) as left_amount, payment_status, company_id
          FROM ${billTable} 
          WHERE ${partyIdColumn} = ?${companyFilter} AND payment_status != 'Paid' AND (total_amount - COALESCE(paid_amount, 0)) > 0
          ORDER BY bill_date ASC, created_at ASC
        `;
      } else {
        queryUnpaidBills = `
          SELECT id, total_amount, COALESCE(paid_amount, 0) as paid_amount, 
          (total_amount - COALESCE(paid_amount, 0)) as left_amount, company_id
          FROM ${billTable} 
          WHERE ${partyIdColumn} = ?${companyFilter} AND (total_amount - COALESCE(paid_amount, 0)) > 0
          ORDER BY bill_date ASC, created_at ASC
        `;
      }
      const [bills] = await conn.query(queryUnpaidBills, queryParams);

      for (let bill of bills) {
        if (paymentAmount <= 0) break;

        const left = parseFloat(bill.left_amount);
        const toPay = Math.min(left, paymentAmount);

        // Insert into master payment table
        let masterInsertQuery;
        let masterParams;
        if (billType === "sales") {
          masterInsertQuery = `
            INSERT INTO sale_payments
            (sale_id, amount, remarks, party_type, customer_id, vendor_id, farmer_id, payment_date, method, company_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          masterParams = [
            bill.id, toPay, remarks || "Party Payment Allocation", party_type, 
            party_type === 'customer' ? party_id : null,
            party_type === 'vendor' ? party_id : null,
            party_type === 'farmer' ? party_id : null,
            date || new Date(), payment_method, bill.company_id
          ];
        } else {
          masterInsertQuery = `
            INSERT INTO purchase_payments
            (purchases_id, amount, remarks, party_type, vendor_id, farmer_id, payment_date, method, company_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          masterParams = [
            bill.id, toPay, remarks || "Party Payment Allocation", party_type,
            party_type === 'vendor' ? party_id : null,
            party_type === 'farmer' ? party_id : null,
            date || new Date(), payment_method, bill.company_id
          ];
        }

        const [masterResult] = await conn.query(masterInsertQuery, masterParams);

        // Insert into company-specific payment table
        try {
            if (billType === "sales") {
                await conn.query(`
                INSERT INTO \`${paymentTableCompany}\`
                (id, sale_id, amount, remarks, party_type, customer_id, vendor_id, farmer_id, payment_date, method)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [masterResult.insertId, bill.id, toPay, remarks || "Party Payment Allocation", party_type, 
                party_type === 'customer' ? party_id : null,
                party_type === 'vendor' ? party_id : null,
                party_type === 'farmer' ? party_id : null,
                date || new Date(), payment_method]);
            } else {
                await conn.query(`
                INSERT INTO \`${paymentTableCompany}\`
                (id, purchases_id, amount, remarks, party_type, vendor_id, farmer_id, payment_date, method)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [masterResult.insertId, bill.id, toPay, remarks || "Party Payment Allocation", party_type,
                party_type === 'vendor' ? party_id : null,
                party_type === 'farmer' ? party_id : null,
                date || new Date(), payment_method]);
            }
        } catch(err) {
            if(err.code !== 'ER_NO_SUCH_TABLE') console.warn(err.message);
            else throw err;
        }

        // Update bill status
        const newPaidAmount = parseFloat(bill.paid_amount) + toPay;
        const newStatus = newPaidAmount >= parseFloat(bill.total_amount) ? 'Paid' : 'Partial';

        if (billType === "sales") {
            await conn.query(`
              UPDATE ${billTable} 
              SET paid_amount = ?, payment_status = ? 
              WHERE id = ?
            `, [newPaidAmount, newStatus, bill.id]);
        } else {
            await conn.query(`
              UPDATE ${billTable} 
              SET paid_amount = ? 
              WHERE id = ?
            `, [newPaidAmount, bill.id]);
        }

        try {
            if (billType === "sales") {
                await conn.query(`
                UPDATE \`${billTableCompany}\` 
                SET paid_amount = ?, payment_status = ? 
                WHERE id = ?
                `, [newPaidAmount, newStatus, bill.id]);
            } else {
                await conn.query(`
                UPDATE \`${billTableCompany}\` 
                SET paid_amount = ? 
                WHERE id = ?
                `, [newPaidAmount, bill.id]);
            }
        } catch(err) {
            if(err.code !== 'ER_NO_SUCH_TABLE') console.warn(err.message);
            else throw err;
        }

        paymentAmount -= toPay;
      }

      // If there's still paymentAmount left, add it to advance_amount
      if (paymentAmount > 0) {
        const partyTable = party_type === "customer" ? "customers" : (party_type === "vendor" ? "vendors" : "farmers");
        await conn.query(`
          UPDATE ${partyTable} 
          SET advance_amount = advance_amount + ? 
          WHERE id = ?
        `, [paymentAmount, party_id]);
      }

      await conn.commit();
      res.status(200).json({
        success: true,
        message: "Payment processed successfully.",
        allocated_amount: originalAmount - paymentAmount,
        advance_added: paymentAmount
      });

    } catch (error) {
      if (conn) await conn.rollback();
      console.error("Party payment error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process payment",
        error: error.message
      });
    } finally {
      if (conn) conn.release();
    }
  },
  
  getPartySummary: async (req, res) => {
    let conn;
    try {
      const { party_type, party_id, billType, company_id } = req.query;
      
      if (!party_type || !party_id || !billType) {
        return res.status(400).json({ message: "Missing required parameters", success: false });
      }
      
      conn = await db.promise().getConnection();
      
      const partyTable = party_type === "customer" ? "customers" : (party_type === "vendor" ? "vendors" : "farmers");
      const nameCol = party_type === "vendor" ? "vendor_name as name" : "name";
      const firmCol = party_type === "farmer" ? "'' as firm_name" : "firm_name";
      const [partyRes] = await conn.query(`SELECT advance_amount, ${nameCol}, ${firmCol} FROM ${partyTable} WHERE id = ?`, [party_id]);
      const advance_amount = partyRes.length ? parseFloat(partyRes[0].advance_amount || 0) : 0;
      
      const billTable = billType === "sales" ? "sales" : "purchases";
      const partyIdColumn = party_type === "customer" ? "customer_id" : (party_type === "vendor" ? "vendor_id" : "farmer_id");
      
      let queryStr = "";
      const queryParams = [party_id];
      let companyFilter = "";
      if (company_id) {
          companyFilter = " AND company_id = ?";
          queryParams.push(company_id);
      }

      if (billType === "sales") {
          queryStr = `
            SELECT COALESCE(SUM(total_amount), 0) as total_amount, COALESCE(SUM(paid_amount), 0) as paid_amount 
            FROM ${billTable} 
            WHERE ${partyIdColumn} = ?${companyFilter} AND (payment_status != 'Paid' OR payment_status IS NULL)
          `;
      } else {
          queryStr = `
            SELECT COALESCE(SUM(total_amount), 0) as total_amount, COALESCE(SUM(paid_amount), 0) as paid_amount 
            FROM ${billTable} 
            WHERE ${partyIdColumn} = ?${companyFilter} AND (total_amount > COALESCE(paid_amount, 0))
          `;
      }
      const [bills] = await conn.query(queryStr, queryParams);
      
      const unpaid_due = parseFloat(bills[0].total_amount) - parseFloat(bills[0].paid_amount);
      
      res.status(200).json({
        success: true,
        data: {
          advance_amount,
          unpaid_due,
          name: partyRes.length ? partyRes[0].name : "",
          firm_name: partyRes.length ? partyRes[0].firm_name : ""
        }
      });
    } catch (error) {
      console.error("Get summary error:", error);
      res.status(500).json({ success: false, error: error.message });
    } finally {
      if (conn) conn.release();
    }
  }
};

module.exports = PartyPaymentController;
