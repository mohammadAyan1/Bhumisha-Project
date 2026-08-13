require('dotenv').config();
const db = require('./src/config/db');

async function seed() {
  const promiseDb = db.promise();
  try {
    const ts = Date.now();
    
    // 1. Core Data
    const [empRes] = await promiseDb.query(`INSERT INTO employees (name, base_salary, join_date, status) VALUES ('Test Employee', 25000.00, '2026-05-01', 'active')`);
    const empId = empRes.insertId;

    const [custRes] = await promiseDb.query(`INSERT INTO customers (name, firm_name, phone, created_at, status) VALUES ('Comp Customer', 'Comp Firm', '9876543210', '2026-06-01 10:00:00', 'active')`);
    const custId = custRes.insertId;

    const [vendRes] = await promiseDb.query(`INSERT INTO vendors (vendor_name, firm_name, contact_number, created_at, status) VALUES ('Comp Vendor', 'Comp Vendor Firm', '9876543212', '2026-06-03 10:00:00', 'active')`);
    const vendId = vendRes.insertId;

    const [catRes] = await promiseDb.query(`INSERT INTO categories (name, status) VALUES ('Comp Category', 'active')`);
    const catId = catRes.insertId;

    const [prodRes] = await promiseDb.query(`INSERT INTO products (product_name, category_id, size, unit, purchase_rate, total, gst) VALUES ('Comp Product', ?, 1, 'kg', 80, 100, 18)`, [catId]);
    const prodId = prodRes.insertId;

    // Months to generate data for: June (6) and July (7)
    const months = [
      { monthNum: 6, year: 2026, prefix: '06', daysInMonth: 30 },
      { monthNum: 7, year: 2026, prefix: '07', daysInMonth: 31 }
    ];

    for (const { monthNum, year, prefix, daysInMonth } of months) {
      console.log(`Generating data for Month: ${monthNum} Year: ${year}`);
      
      // Attendance & Salary
      let presentDays = 0;
      for (let day = 1; day <= daysInMonth; day++) {
        const d = `${year}-${prefix}-${day.toString().padStart(2, '0')}`;
        // Mark present for weekdays mostly
        const isWeekend = (new Date(d).getDay() === 0); // Sunday
        const status = isWeekend ? 'absent' : 'present';
        if (status === 'present') presentDays++;
        
        // Ignore duplicate key error safely
        try {
            await promiseDb.query(`INSERT INTO attendance (employee_id, date, status, reason, leave_type) VALUES (?, ?, ?, '', 'unpaid')`, [empId, d, status]);
        } catch (e) {
            if (e.code !== 'ER_DUP_ENTRY') throw e;
        }
      }

      // Salary Report
      const base_salary = 25000.00;
      const total_deduction = isNaN(daysInMonth - presentDays) ? 0 : ((daysInMonth - presentDays) * (base_salary / daysInMonth));
      const final_salary = base_salary - total_deduction;
      try {
        await promiseDb.query(
            `INSERT INTO salary_reports (employee_id, year, month, base_salary, days_in_month, total_deduction, total_incentives, final_salary) VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
            [empId, year, monthNum, base_salary, daysInMonth, total_deduction, final_salary]
        );
      } catch (e) {
        if (e.code !== 'ER_DUP_ENTRY') throw e;
      }

      // Expenses & Expense Bills
      for (let i = 1; i <= 3; i++) {
        const d = `${year}-${prefix}-1${i}`;
        await promiseDb.query(
            `INSERT INTO expenses (expenses_for, expenses_type, amount, expense_date, status) VALUES ('Office Supplies', 'Operational', 500, ?, 'Active')`,
            [d]
        );
        await promiseDb.query(
            `INSERT INTO expenses_bill (vendor_name, bill_no, total_amount, total_gst_amount, number_of_item, bill_date) VALUES ('Office Vendor', 'EB-${year}${prefix}-${i}-${ts}', 1000, 180, 5, ?)`,
            [d]
        );
      }

      // Sales & Purchases
      for (let i = 1; i <= 5; i++) {
        const d = `${year}-${prefix}-0${i} 12:00:00`;
        const sBillNo = `SJ-${year}${prefix}-${ts}-${i}`;
        const pBillNo = `PJ-${year}${prefix}-${ts}-${i}`;
        
        // Sale
        const [saleRes] = await promiseDb.query(
            `INSERT INTO sales (customer_id, bill_no, bill_date, party_type, total_taxable, total_gst, payment_status, total_amount, status, created_at) VALUES (?, ?, ?, 'customer', 1000, 180, 'paid', 1180, 'active', ?)`,
            [custId, sBillNo, d, d]
        );
        await promiseDb.query(
            `INSERT INTO sale_items (sale_id, product_id, rate, qty, total, taxable_amount, gst_percent, gst_amount, net_total, status, created_at) VALUES (?, ?, 100, 10, 1000, 1000, 18, 180, 1180, 'active', ?)`,
            [saleRes.insertId, prodId, d]
        );
        await promiseDb.query(
            `INSERT INTO sale_payments (sale_id, party_type, customer_id, payment_date, amount, method, status, created_at) VALUES (?, 'customer', ?, ?, 1180, 'cash', 'active', ?)`,
            [saleRes.insertId, custId, d, d]
        );

        // Purchase
        const [purRes] = await promiseDb.query(
            `INSERT INTO purchases (vendor_id, bill_no, bill_date, party_type, total_amount, status, created_at) VALUES (?, ?, ?, 'vendor', 800, 'active', ?)`,
            [vendId, pBillNo, d, d]
        );
        await promiseDb.query(
            `INSERT INTO purchase_items (purchase_id, product_id, rate, size, total, unit, status) VALUES (?, ?, 80, 10, 800, 'kg', 'active')`,
            [purRes.insertId, prodId]
        );
      }
    }
    
    console.log("Comprehensive data for June and July generated successfully.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
seed();
