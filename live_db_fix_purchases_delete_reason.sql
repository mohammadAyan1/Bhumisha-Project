-- ========================================================================
-- BHUMISHA AGRO - ADD delete_reason COLUMN TO ALL PURCHASES TABLES
-- Resolves: Unknown column 'p.delete_reason' in 'SELECT' on /api/purchase
-- Run this in phpMyAdmin on Database: `bhumishaagro_DB`
-- ========================================================================

-- METHOD 1: Direct ALTER Statements (Run these first in phpMyAdmin SQL tab)
-- ------------------------------------------------------------------------
ALTER TABLE `purchases` ADD COLUMN `delete_reason` TEXT NULL;
ALTER TABLE `tpl_purchases` ADD COLUMN `delete_reason` TEXT NULL;
ALTER TABLE `purchases_bo01` ADD COLUMN `delete_reason` TEXT NULL;
ALTER TABLE `purchases_002` ADD COLUMN `delete_reason` TEXT NULL;
ALTER TABLE `purchases_ay0001` ADD COLUMN `delete_reason` TEXT NULL;
ALTER TABLE `purchases_bhu0001` ADD COLUMN `delete_reason` TEXT NULL;
ALTER TABLE `purchases_knpl_02` ADD COLUMN `delete_reason` TEXT NULL;
ALTER TABLE `purchases_kntl0001` ADD COLUMN `delete_reason` TEXT NULL;
ALTER TABLE `purchases_n101` ADD COLUMN `delete_reason` TEXT NULL;
ALTER TABLE `purchases_cmp_001` ADD COLUMN `delete_reason` TEXT NULL;
ALTER TABLE `purchases_cmp_002` ADD COLUMN `delete_reason` TEXT NULL;
ALTER TABLE `purchases_comp_0` ADD COLUMN `delete_reason` TEXT NULL;

-- ------------------------------------------------------------------------
-- METHOD 2: Dynamic Auto-Fix Procedure (Ensures ANY other purchase tables are covered)
-- ------------------------------------------------------------------------
DELIMITER $$

DROP PROCEDURE IF EXISTS AddDeleteReasonToAllPurchasesTables$$

CREATE PROCEDURE AddDeleteReasonToAllPurchasesTables()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE tbl_name VARCHAR(64);
    DECLARE cur CURSOR FOR 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
          AND (table_name = 'purchases' OR table_name LIKE 'purchases_%' OR table_name = 'tpl_purchases');
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO tbl_name;
        IF done THEN
            LEAVE read_loop;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = DATABASE() 
              AND table_name = tbl_name 
              AND column_name = 'delete_reason'
        ) THEN
            SET @alter_sql = CONCAT('ALTER TABLE `', tbl_name, '` ADD COLUMN delete_reason TEXT NULL');
            PREPARE stmt FROM @alter_sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        END IF;
    END LOOP;

    CLOSE cur;
END$$

DELIMITER ;

CALL AddDeleteReasonToAllPurchasesTables();
DROP PROCEDURE IF EXISTS AddDeleteReasonToAllPurchasesTables;

-- ------------------------------------------------------------------------
-- Verification: Check that delete_reason column is present
-- ------------------------------------------------------------------------
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
  AND column_name = 'delete_reason' 
  AND (table_name = 'purchases' OR table_name LIKE 'purchases_%' OR table_name = 'tpl_purchases');
