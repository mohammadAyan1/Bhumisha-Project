-- ========================================================================
-- BHUMISHA AGRO - ADD custom_product_name TO sales_order_items
-- Resolves: Unknown column 'soi.custom_product_name' in 'SELECT' on /api/so-orders
-- Run this in phpMyAdmin on Database: `bhumishaagro_DB`
-- ========================================================================

-- 1. Allow product_id to be NULL (needed when custom products are added without an existing product)
ALTER TABLE `sales_order_items` MODIFY COLUMN `product_id` INT NULL;

-- 2. Add custom_product_name column
ALTER TABLE `sales_order_items` ADD COLUMN `custom_product_name` VARCHAR(255) NULL AFTER `product_id`;

-- Verification:
DESCRIBE `sales_order_items`;
