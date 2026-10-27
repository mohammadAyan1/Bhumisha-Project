-- ========================================================================
-- BHUMISHA AGRO - LIVE DATABASE FIX PART 2 (CLEAN UPDATE - NO DUPLICATE ERROR)
-- Resolves:
--   1. BILL-003 missing in Bill Payment & due amount mismatch (Samyaprash Farm)
--   2. BILL-005 duplicate & due amount mismatch (Aakanksha Duday)
--   3. Cleanup ghost 0.00 bill (BO/25-26/035) in master sales table
-- 
-- Run this in phpMyAdmin on Database: `bhumishaagro_DB`
-- ========================================================================

START TRANSACTION;

-- ------------------------------------------------------------------------
-- STEP 1: Fix Samyaprash Farm's BILL-003 in Company Table (sales_bo01)
-- Restore true payment status: BILL-003 was originally paid in full (240.00).
-- ------------------------------------------------------------------------
UPDATE sales_bo01
SET 
    paid_amount = 240.00,
    payment_status = 'Paid'
WHERE id = 3;

-- ------------------------------------------------------------------------
-- STEP 2: Update Master `sales` Row 5 (BILL-003) for Samyaprash Farm
-- Row 5 in `sales` already has bill_no = 'BILL-003' and reference_id = 3.
-- We UPDATE row 5 to customer_id = 2 (Samyaprash Farm) and total = 240.00.
-- This avoids the '#1062 - Duplicate entry' error completely!
-- ------------------------------------------------------------------------
UPDATE sales
SET 
    customer_id = 2,
    bill_date = '2025-12-12',
    party_type = 'customer',
    total_taxable = 240.00,
    total_gst = 0.00,
    payment_status = 'Paid',
    payment_method = 'Online',
    total_amount = 240.00,
    paid_amount = 240.00,
    other_amount = 0.00,
    other_note = 'paid',
    buyer_type = 'wholesaler',
    reference_id = 3,
    status = 'Active'
WHERE id = 5;

-- Ensure sales_bo01 row 3 points to master sales row 5
UPDATE sales_bo01
SET reference_id = 5
WHERE id = 3;

-- Insert item in sale_items for BILL-003 if missing
INSERT INTO sale_items (
    sale_id, product_id, rate, qty, discount_rate, discount_amount,
    taxable_amount, gst_percent, gst_amount, net_total, unit, status,
    buyer_type, company_id, reference_id
)
SELECT 
    5, 22, 48.00, 5.00, 0.00, 0.00,
    240.00, 0.00, 0.00, 240.00, 'KG', 'Active',
    'wholesaler', 13, 6
WHERE NOT EXISTS (SELECT 1 FROM sale_items WHERE sale_id = 5);

-- Update payment record in sale_payments for sale_id = 5
UPDATE sale_payments
SET customer_id = 2, amount = 240.00, method = 'Online'
WHERE sale_id = 5;

-- Update payment record in sale_payments_bo01 for sale_id = 3
UPDATE sale_payments_bo01
SET 
    customer_id = 2,
    amount = 240.00,
    method = 'Online',
    payment_date = '2025-12-12',
    remarks = 'Paid on creation'
WHERE sale_id = 3;


-- ------------------------------------------------------------------------
-- STEP 3: Remove Ghost 0.00 Bill (BO/25-26/035) from Master `sales` Table
-- Row 107 in sales was created with 0.00 total and does not exist in sales_bo01.
-- Setting status = 'Inactive' hides it from Bill Payment table.
-- ------------------------------------------------------------------------
UPDATE sales
SET status = 'Inactive'
WHERE id = 107 AND bill_no = 'BO/25-26/035' AND total_amount = 0.00;


-- ------------------------------------------------------------------------
-- STEP 4: Fix Customer 28 (Aakanksha Duday) BILL-005
-- Update Master `sales` Row 8 and Company `sales_bo01` Row 5.
-- ------------------------------------------------------------------------
UPDATE sales_bo01
SET 
    paid_amount = 655.75,
    payment_status = 'Paid'
WHERE id = 5;

-- Update row 8 in master sales directly to Customer 28 (NO INSERT = NO DUPLICATE ERROR)
UPDATE sales
SET 
    customer_id = 28,
    bill_date = '2025-12-13',
    party_type = 'customer',
    total_taxable = 649.00,
    total_gst = 6.75,
    payment_status = 'Paid',
    payment_method = 'Online',
    total_amount = 655.75,
    paid_amount = 655.75,
    other_amount = 0.00,
    other_note = 'paid',
    buyer_type = 'retailer',
    reference_id = 5,
    status = 'Active'
WHERE id = 8;

-- Update payment record in sale_payments_bo01 for sale_id = 5 to Customer 28
UPDATE sale_payments_bo01
SET 
    customer_id = 28,
    amount = 655.75,
    method = 'Online',
    payment_date = '2025-12-13',
    remarks = 'Paid on creation'
WHERE sale_id = 5;


-- ------------------------------------------------------------------------
-- STEP 5: Verification Queries
-- ------------------------------------------------------------------------
SELECT 
    'Samyaprash Farm (Customer 2)' AS Check_Name,
    (SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM sales_bo01 WHERE customer_id = 2 AND payment_status != 'Paid' AND (status IS NULL OR status != 'Inactive')) AS `Sales_Page_Due`,
    (SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM sales WHERE customer_id = 2 AND company_id = 13 AND (status IS NULL OR status != 'Inactive') AND total_amount > paid_amount) AS `Bill_Payment_Due`;

SELECT 
    'Aakanksha Duday (Customer 28)' AS Check_Name,
    (SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM sales_bo01 WHERE customer_id = 28 AND payment_status != 'Paid' AND (status IS NULL OR status != 'Inactive')) AS `Sales_Page_Due`,
    (SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM sales WHERE customer_id = 28 AND company_id = 13 AND (status IS NULL OR status != 'Inactive') AND total_amount > paid_amount) AS `Bill_Payment_Due`;

-- Check BILL-003 in both tables
SELECT id, customer_id, bill_no, total_amount, paid_amount, payment_status, reference_id FROM sales_bo01 WHERE bill_no = 'BILL-003';
SELECT id, customer_id, bill_no, total_amount, paid_amount, payment_status, reference_id FROM sales WHERE bill_no = 'BILL-003';

COMMIT;
