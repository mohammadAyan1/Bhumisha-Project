require("dotenv").config();
// if (process.env.NODE_ENV !== "production") {
//   require("dotenv").config();
// }

const db = require("./src/config/db");
const app = require("./src/app");

const PORT = Number(process.env.PORT || 5000);

const DDL_INIT_CORE = `
CREATE TABLE IF NOT EXISTS companies (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  address TEXT NULL,
  gst_no VARCHAR(25) NULL,
  contact_no VARCHAR(20) NULL,
  email VARCHAR(120) NULL,
  owner_name VARCHAR(120) NULL,
  status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  image_url VARCHAR(255) NULL,
  bank_detail_id INT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;`;

const DDL_TEMPLATES = [
  // 1) tpl_purchases
  `
CREATE TABLE IF NOT EXISTS tpl_purchases (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  vendor_id INT NULL,
  farmer_id INT NULL,
  gst_no VARCHAR(50) NULL,
  unit VARCHAR(50) NOT NULL DEFAULT 'kg',
  bill_no VARCHAR(50) NOT NULL,
  bill_date DATE NOT NULL,
  party_type ENUM('vendor','farmer') NOT NULL DEFAULT 'vendor',
  linked_po_id INT NULL,
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('Active','Inactive') DEFAULT 'Active',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  bill_img VARCHAR(255) NULL,
  UNIQUE KEY uq_tpl_purchase_bill (bill_no),
  KEY idx_tpl_purchase_date (bill_date),
  KEY idx_tpl_purchase_vendor (vendor_id)
) ENGINE=InnoDB;`,
  // 2) tpl_purchase_items
  `
CREATE TABLE IF NOT EXISTS tpl_purchase_items (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  purchase_id INT NOT NULL,
  product_id INT NOT NULL,
  po_item_id INT NULL,
  rate DECIMAL(10,2) NOT NULL,
  size DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL DEFAULT 'kg',
  status ENUM('Active','Inactive') DEFAULT 'Active',
  bill_img VARCHAR(255) NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  total DECIMAL(10,2) GENERATED ALWAYS AS (rate * size) STORED,
  KEY idx_tpl_pi_purchase (purchase_id),
  KEY idx_tpl_pi_product (product_id)
) ENGINE=InnoDB;`,
  // 3) tpl_sales
  `
CREATE TABLE IF NOT EXISTS tpl_sales (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NULL,
  vendor_id INT NULL,
  farmer_id INT NULL,
  bill_no VARCHAR(50) NOT NULL,
  buyer_type ENUM('retailer','wholesaler') NOT NULL DEFAULT 'retailer',
  bill_date DATE NOT NULL,
  unit VARCHAR(50) NOT NULL DEFAULT 'kg',
  party_type ENUM('customer','vendor','farmer') NOT NULL DEFAULT 'customer',
  total_taxable DECIMAL(10,2) DEFAULT 0.00,
  total_gst DECIMAL(10,2) DEFAULT 0.00,
  payment_status ENUM('Paid','Unpaid','Partial') DEFAULT 'Unpaid',
  payment_method ENUM('Cash','Card','Online','Credit Card','UPI') DEFAULT 'Cash',
  remarks TEXT NULL,
  other_amount DECIMAL(10,2) DEFAULT 0.00,
  other_note VARCHAR(255) NULL,
  status ENUM('Active','Inactive') DEFAULT 'Active',
  company_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tpl_sales_bill (bill_no),
  KEY idx_tpl_sales_date (bill_date)
) ENGINE=InnoDB;`,
  // 4) tpl_sale_items
  `
CREATE TABLE IF NOT EXISTS tpl_sale_items (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  buyer_type ENUM('retailer','wholesaler') NOT NULL DEFAULT 'retailer',
  qty DECIMAL(10,2) NOT NULL,
  discount_rate DECIMAL(10,2) DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  taxable_amount DECIMAL(10,2) DEFAULT 0.00,
  gst_percent DECIMAL(5,2) DEFAULT 0.00,
  gst_amount DECIMAL(10,2) DEFAULT 0.00,
  net_total DECIMAL(10,2) DEFAULT 0.00,
  unit VARCHAR(50) NOT NULL DEFAULT 'kg',
  total DECIMAL(10,2) GENERATED ALWAYS AS (qty * rate) STORED,
  status ENUM('Active','Inactive') DEFAULT 'Active',
  product_detail JSON NULL,
  company_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_tpl_si_sale (sale_id),
  KEY idx_tpl_si_product (product_id)
) ENGINE=InnoDB;`,
  // 5) tpl_sale_payments
  `
CREATE TABLE IF NOT EXISTS tpl_sale_payments (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  party_type ENUM('customer','vendor','farmer') NULL,
  customer_id INT NULL,
  unit VARCHAR(50) NOT NULL DEFAULT 'kg',
  vendor_id INT NULL,
  farmer_id INT NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method ENUM('Cash','Card','Online','Credit Card','UPI') DEFAULT 'Cash',
  remarks TEXT NULL,
  company_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_tpl_payments_sale (sale_id),
  KEY idx_tpl_payments_party (customer_id, payment_date)
) ENGINE=InnoDB;`,
];

function exec(sql) {
  return new Promise((resolve, reject) =>
    db.query(sql, (e) => (e ? reject(e) : resolve()))
  );
}

(async () => {
  try {
    await exec(DDL_INIT_CORE);
    // Ensure company_bank_details table exists
    await exec(`
CREATE TABLE IF NOT EXISTS company_bank_details (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  pan_number VARCHAR(20) DEFAULT NULL,
  account_holder_name VARCHAR(255) DEFAULT NULL,
  bank_name VARCHAR(255) DEFAULT NULL,
  account_number VARCHAR(30) DEFAULT NULL,
  ifsc_code VARCHAR(20) DEFAULT NULL,
  branch_name VARCHAR(255) DEFAULT NULL,
  upi_id VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;`);

    // Add FK column if missing (avoid IF NOT EXISTS for broader MySQL compatibility)
    await exec(
      `ALTER TABLE companies ADD COLUMN bank_detail_id INT NULL`
    ).catch(() => {});
    // Add FK constraint (swallow if already exists)
    await exec(`ALTER TABLE companies
      ADD CONSTRAINT fk_companies_bank_detail
      FOREIGN KEY (bank_detail_id) REFERENCES company_bank_details(id)
      ON DELETE SET NULL`).catch(() => {});
    for (const stmt of DDL_TEMPLATES) {
      await exec(stmt); // run each CREATE separately
    }
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (e) {
    console.error("Bootstrap failed:", e);
    process.exit(1);
  }
})();
