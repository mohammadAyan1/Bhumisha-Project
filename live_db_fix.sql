-- ========================================================================
-- BHUMISHA AGRO - LIVE DATABASE FIX & RECONCILIATION SCRIPT
-- Purpose:
--   1. Sync Bill Numbers between Master `sales` and Company `sales_bo01`
--   2. Fix Corrupted `paid_amount` in `sales_bo01` caused by `OR id = ?` bug
--   3. Fix Corrupted `paid_amount` in `purchases_bo01` (Abhishek Tomar, etc.)
--   4. Fix False 'Partial' status where paid_amount >= total_amount
-- 
-- Run this in phpMyAdmin on Database: `bhumishaagro_DB`
-- ========================================================================

START TRANSACTION;

-- ------------------------------------------------------------------------
-- STEP 1: Sync Bill Numbers from Company table (sales_bo01) to Master (sales)
-- Fixes bills showing BILL-xxx in Bill Payment instead of BO/...
-- ------------------------------------------------------------------------
UPDATE sales s
JOIN sales_bo01 b ON (s.id = b.reference_id OR s.reference_id = b.id)
SET s.bill_no = b.bill_no
WHERE s.bill_no != b.bill_no;

-- ------------------------------------------------------------------------
-- STEP 2: Fix Corrupted paid_amount in `sales_bo01` from Master `sales`
-- Master `sales` holds the true payment sums recorded in `sale_payments`.
-- This restores corrupted bills (e.g., BO/26-27/133 from 29000 back to 0).
-- ------------------------------------------------------------------------
UPDATE sales_bo01 b
JOIN sales s ON (b.reference_id = s.id OR s.reference_id = b.id)
SET b.paid_amount = s.paid_amount;

-- ------------------------------------------------------------------------
-- STEP 3: Fix Corrupted paid_amount in `purchases_bo01` from Master `purchases`
-- Restores corrupted purchase bills (e.g. Abhishek Tomar from 372320 back to 0).
-- ------------------------------------------------------------------------
UPDATE purchases_bo01 pb
JOIN purchases p ON (pb.reference_id = p.id OR p.reference_id = pb.id)
SET pb.paid_amount = p.paid_amount;

-- ------------------------------------------------------------------------
-- STEP 4: Fix Payment Status on Master `sales` and `sales_bo01`
-- Ensures any bill where paid_amount >= total_amount is marked 'Paid'
-- (Fixes BILL-002, BO/25-26/049, etc. which showed Partial with 0 remaining).
-- ------------------------------------------------------------------------
UPDATE sales
SET payment_status = CASE 
    WHEN paid_amount >= total_amount AND total_amount > 0 THEN 'Paid'
    WHEN paid_amount > 0 AND paid_amount < total_amount THEN 'Partial'
    ELSE 'Unpaid'
END
WHERE (status IS NULL OR status != 'Inactive');

UPDATE sales_bo01
SET payment_status = CASE 
    WHEN paid_amount >= total_amount AND total_amount > 0 THEN 'Paid'
    WHEN paid_amount > 0 AND paid_amount < total_amount THEN 'Partial'
    ELSE 'Unpaid'
END
WHERE (status IS NULL OR status != 'Inactive');

-- ------------------------------------------------------------------------
-- STEP 5: Verification Checks
-- ------------------------------------------------------------------------

-- Verify Samyaprash Farm (customer_id = 2)
SELECT 
    'Samyaprash Farm' AS Party,
    (SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM sales_bo01 WHERE customer_id = 2 AND payment_status != 'Paid' AND (status IS NULL OR status != 'Inactive')) AS `Sales_Page_Due`,
    (SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM sales WHERE customer_id = 2 AND company_id = 13 AND (status IS NULL OR status != 'Inactive') AND total_amount > paid_amount) AS `Consolidated_Modal_Due`;

-- Verify Pranita Naturals (customer_id = 4)
SELECT 
    'Pranita Naturals' AS Party,
    (SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM sales_bo01 WHERE customer_id = 4 AND payment_status != 'Paid' AND (status IS NULL OR status != 'Inactive')) AS `Sales_Page_Due`,
    (SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM sales WHERE customer_id = 4 AND company_id = 13 AND (status IS NULL OR status != 'Inactive') AND total_amount > paid_amount) AS `Consolidated_Modal_Due`;

-- Verify Agrozen Natural Foods (customer_id = 9)
SELECT 
    'Agrozen Natural Foods' AS Party,
    (SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM sales_bo01 WHERE customer_id = 9 AND payment_status != 'Paid' AND (status IS NULL OR status != 'Inactive')) AS `Sales_Page_Due`,
    (SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM sales WHERE customer_id = 9 AND company_id = 13 AND (status IS NULL OR status != 'Inactive') AND total_amount > paid_amount) AS `Consolidated_Modal_Due`;

-- Verify specific bills that had corruption
SELECT id, bill_no, total_amount, paid_amount, payment_status FROM sales_bo01 WHERE bill_no = 'BO/26-27/133';
SELECT id, bill_no, total_amount, paid_amount, payment_status FROM sales_bo01 WHERE bill_no = 'BILL-002';
SELECT id, bill_no, total_amount, paid_amount, payment_status FROM purchases_bo01 WHERE id = 23;

COMMIT;
