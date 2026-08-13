-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: bhumisha
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `date` date NOT NULL,
  `status` enum('present','absent','first halfday','halfday','leave','second halfday') NOT NULL DEFAULT 'present',
  `reason` varchar(255) DEFAULT NULL,
  `leave_type` enum('paid','unpaid') NOT NULL DEFAULT 'unpaid',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_emp_date` (`employee_id`,`date`),
  KEY `idx_date` (`date`),
  KEY `idx_employee_id` (`employee_id`),
  CONSTRAINT `fk_att_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=112 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (37,'category 0','Active'),(38,'June Category','Active'),(39,'June Category','Active'),(40,'June Category','Active'),(41,'June Category','Active');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cluster_cultivate_products`
--

DROP TABLE IF EXISTS `cluster_cultivate_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cluster_cultivate_products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clusterId` int NOT NULL,
  `farmerId` int NOT NULL,
  `farmId` int NOT NULL,
  `product` varchar(255) NOT NULL,
  `size` decimal(10,2) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `is_delete` enum('true','false') DEFAULT 'false',
  PRIMARY KEY (`id`),
  KEY `fk_cfp_cluster` (`clusterId`),
  KEY `fk_cfp_farmer` (`farmerId`),
  KEY `fk_cfp_farm` (`farmId`),
  CONSTRAINT `fk_cfp_cluster` FOREIGN KEY (`clusterId`) REFERENCES `company_clusters` (`id`),
  CONSTRAINT `fk_cfp_farm` FOREIGN KEY (`farmId`) REFERENCES `farmer_farm` (`id`),
  CONSTRAINT `fk_cfp_farmer` FOREIGN KEY (`farmerId`) REFERENCES `farmers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cluster_cultivate_products`
--

LOCK TABLES `cluster_cultivate_products` WRITE;
/*!40000 ALTER TABLE `cluster_cultivate_products` DISABLE KEYS */;
/*!40000 ALTER TABLE `cluster_cultivate_products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cluster_inventory`
--

DROP TABLE IF EXISTS `cluster_inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cluster_inventory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cluster_product_id` int NOT NULL,
  `cluster_id` int NOT NULL,
  `qty` decimal(20,2) NOT NULL,
  `purchase_rate` decimal(10,2) NOT NULL,
  `sale_rate` decimal(10,2) NOT NULL,
  `unit` enum('kg','ton','quintal','gram','liter') NOT NULL,
  `entry_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`id`),
  KEY `fk_cluster_inventory_cluster` (`cluster_id`),
  KEY `fk_cluster_inventory_product` (`cluster_product_id`),
  CONSTRAINT `fk_cluster_inventory_cluster` FOREIGN KEY (`cluster_id`) REFERENCES `company_clusters` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_cluster_inventory_product` FOREIGN KEY (`cluster_product_id`) REFERENCES `cluster_second_products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cluster_inventory`
--

LOCK TABLES `cluster_inventory` WRITE;
/*!40000 ALTER TABLE `cluster_inventory` DISABLE KEYS */;
/*!40000 ALTER TABLE `cluster_inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cluster_second_products`
--

DROP TABLE IF EXISTS `cluster_second_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cluster_second_products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `hsn_number` varchar(100) DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cluster_second_products`
--

LOCK TABLES `cluster_second_products` WRITE;
/*!40000 ALTER TABLE `cluster_second_products` DISABLE KEYS */;
/*!40000 ALTER TABLE `cluster_second_products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cluster_transactions`
--

DROP TABLE IF EXISTS `cluster_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cluster_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `billno` varchar(100) DEFAULT NULL,
  `clusterId` int DEFAULT NULL,
  `date` date DEFAULT NULL,
  `farmerId` int DEFAULT NULL,
  `gstper` decimal(10,2) DEFAULT NULL,
  `paid` decimal(20,2) DEFAULT NULL,
  `total` decimal(20,2) DEFAULT NULL,
  `remaining` decimal(20,2) DEFAULT NULL,
  `type` enum('purchase','sale') DEFAULT NULL,
  `productList` json DEFAULT NULL,
  `productName` varchar(255) DEFAULT NULL,
  `purchaseRate` decimal(10,2) DEFAULT NULL,
  `salesRate` decimal(10,2) DEFAULT NULL,
  `qty` decimal(20,2) DEFAULT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `remarks` text,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cluster_transactions`
--

LOCK TABLES `cluster_transactions` WRITE;
/*!40000 ALTER TABLE `cluster_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `cluster_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `name` varchar(150) NOT NULL,
  `address` text,
  `gst_no` varchar(25) DEFAULT NULL,
  `contact_no` varchar(20) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `owner_name` varchar(120) DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `image_url` varchar(255) DEFAULT NULL,
  `bank_detail_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `fk_companies_bank_detail` (`bank_detail_id`),
  CONSTRAINT `fk_companies_bank_detail` FOREIGN KEY (`bank_detail_id`) REFERENCES `company_bank_details` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companies`
--

LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
INSERT INTO `companies` VALUES (51,'comp_0','company 0','AYODHYA NAGAR ','asdf123lkj098','9000000002','mohammadayan2210@gmail.com','Ayush chahcha','Active','2026-07-16 06:49:03','2026-07-16 06:49:03','/uploads/1784184543241.png',19);
/*!40000 ALTER TABLE `companies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_bank_details`
--

DROP TABLE IF EXISTS `company_bank_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_bank_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pan_number` varchar(20) DEFAULT NULL,
  `account_holder_name` varchar(255) DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `account_number` varchar(30) DEFAULT NULL,
  `ifsc_code` varchar(20) DEFAULT NULL,
  `branch_name` varchar(255) DEFAULT NULL,
  `upi_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_bank_details`
--

LOCK TABLES `company_bank_details` WRITE;
/*!40000 ALTER TABLE `company_bank_details` DISABLE KEYS */;
INSERT INTO `company_bank_details` VALUES (19,'poi098hjkl','Ayush gand mari acc','CBI','0987654321123456','IFSC 7658','KOLAR','gand_mara_ayush@ybl','2026-07-16 06:49:03','2026-07-16 06:49:03');
/*!40000 ALTER TABLE `company_bank_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_clusters`
--

DROP TABLE IF EXISTS `company_clusters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_clusters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `cluster_location` varchar(255) DEFAULT NULL,
  `cluster_manager` varchar(255) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `district` varchar(255) DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `company_clusters_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_clusters`
--

LOCK TABLES `company_clusters` WRITE;
/*!40000 ALTER TABLE `company_clusters` DISABLE KEYS */;
/*!40000 ALTER TABLE `company_clusters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text,
  `GST_No` varchar(15) DEFAULT NULL,
  `balance` decimal(12,2) NOT NULL DEFAULT '0.00',
  `min_balance` decimal(12,2) NOT NULL DEFAULT '5000.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `firm_name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_customers_balance` (`balance`),
  KEY `idx_customers_gst_no` (`GST_No`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (27,'priyanshu','priyanshu@gmail.com','9000000001','Ashoka garden','890000000000000',1000.00,5000.00,'2026-07-16 06:19:21','2026-07-16 06:19:21','Active','priyanshu kirana'),(28,'June Customer',NULL,'9876543210',NULL,NULL,0.00,5000.00,'2026-06-01 04:30:00','2026-07-25 09:51:31','Active','June Firm'),(29,'June Customer',NULL,'9876543210',NULL,NULL,0.00,5000.00,'2026-06-01 04:30:00','2026-07-25 09:52:06','Active','June Firm'),(30,'June Customer',NULL,'9876543210',NULL,NULL,0.00,5000.00,'2026-06-01 04:30:00','2026-07-25 09:53:41','Active','June Firm'),(31,'June Customer',NULL,'9876543210',NULL,NULL,0.00,5000.00,'2026-06-01 04:30:00','2026-07-25 09:54:07','Active','June Firm');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `base_salary` decimal(12,2) NOT NULL DEFAULT '0.00',
  `join_date` date DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `photo` varchar(250) DEFAULT NULL,
  `salary_date` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `expenses_for` varchar(255) DEFAULT NULL,
  `expenses_type` varchar(255) DEFAULT NULL,
  `master` varchar(255) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `remark` varchar(255) DEFAULT NULL,
  `documents` varchar(255) DEFAULT NULL,
  `expense_date` date DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `expensedate` date DEFAULT NULL,
  `incentive` decimal(10,2) DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `vendor_name` varchar(255) DEFAULT NULL,
  `firm_name` varchar(255) DEFAULT NULL,
  `gst_number` varchar(55) DEFAULT NULL,
  `address` varchar(100) DEFAULT NULL,
  `contact` varchar(45) DEFAULT NULL,
  `bill_no` varchar(100) DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `total_gst_amount` decimal(10,2) DEFAULT NULL,
  `number_of_item` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses_bill`
--

DROP TABLE IF EXISTS `expenses_bill`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses_bill` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vendor_name` varchar(255) NOT NULL,
  `firm_name` varchar(255) DEFAULT NULL,
  `gst_number` varchar(50) DEFAULT NULL,
  `address` text,
  `contact` varchar(20) DEFAULT NULL,
  `bill_no` varchar(100) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `total_gst_amount` decimal(10,2) NOT NULL,
  `number_of_item` int NOT NULL,
  `bill_date` date NOT NULL,
  `bill_image` varchar(500) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `remark` varchar(255) DEFAULT NULL,
  `company_id` varchar(45) DEFAULT '1',
  `status` enum('active','inactive') DEFAULT 'active',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses_bill`
--

LOCK TABLES `expenses_bill` WRITE;
/*!40000 ALTER TABLE `expenses_bill` DISABLE KEYS */;
/*!40000 ALTER TABLE `expenses_bill` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `farmer_bank_details`
--

DROP TABLE IF EXISTS `farmer_bank_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `farmer_bank_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `farmer_id` int DEFAULT NULL,
  `pan_number` varchar(20) DEFAULT NULL,
  `account_holder_name` varchar(255) DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `account_number` varchar(30) DEFAULT NULL,
  `ifsc_code` varchar(20) DEFAULT NULL,
  `branch_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `farmer_id` (`farmer_id`),
  CONSTRAINT `farmer_bank_details_ibfk_1` FOREIGN KEY (`farmer_id`) REFERENCES `farmers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `farmer_bank_details`
--

LOCK TABLES `farmer_bank_details` WRITE;
/*!40000 ALTER TABLE `farmer_bank_details` DISABLE KEYS */;
INSERT INTO `farmer_bank_details` VALUES (49,49,'','','','','','','2026-07-16 06:17:34','2026-07-16 06:17:34');
/*!40000 ALTER TABLE `farmer_bank_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `farmer_documents`
--

DROP TABLE IF EXISTS `farmer_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `farmer_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `adhar` varchar(255) DEFAULT NULL,
  `pan` varchar(255) DEFAULT NULL,
  `voter` varchar(255) DEFAULT NULL,
  `landholding_records` varchar(255) DEFAULT NULL,
  `other` varchar(255) DEFAULT NULL,
  `farmer_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_farmer_documents` (`farmer_id`),
  CONSTRAINT `fk_farmer_documents` FOREIGN KEY (`farmer_id`) REFERENCES `farmers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `farmer_documents`
--

LOCK TABLES `farmer_documents` WRITE;
/*!40000 ALTER TABLE `farmer_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `farmer_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `farmer_farm`
--

DROP TABLE IF EXISTS `farmer_farm`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `farmer_farm` (
  `id` int NOT NULL AUTO_INCREMENT,
  `location` varchar(255) NOT NULL,
  `size` varchar(100) NOT NULL,
  `farm_type` varchar(255) NOT NULL,
  `farmer_id` int NOT NULL,
  `state` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `district` varchar(255) DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`id`),
  KEY `fk_farmer` (`farmer_id`),
  CONSTRAINT `fk_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `farmer_farm`
--

LOCK TABLES `farmer_farm` WRITE;
/*!40000 ALTER TABLE `farmer_farm` DISABLE KEYS */;
INSERT INTO `farmer_farm` VALUES (19,'AYODHYA NAGAR','100','organic',49,'Madhya Pradesh','Bhopal','Bhopal','Active');
/*!40000 ALTER TABLE `farmer_farm` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `farmers`
--

DROP TABLE IF EXISTS `farmers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `farmers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `father_name` varchar(255) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `tehsil` varchar(100) DEFAULT NULL,
  `patwari_halka` varchar(100) DEFAULT NULL,
  `village` varchar(100) DEFAULT NULL,
  `contact_number` varchar(15) DEFAULT NULL,
  `khasara_number` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `balance` decimal(10,2) DEFAULT '0.00',
  `min_balance` decimal(10,2) DEFAULT '5000.00',
  `state` varchar(100) DEFAULT NULL,
  `grade` varchar(45) DEFAULT 'c1',
  PRIMARY KEY (`id`),
  CONSTRAINT `chk_farmer_balance_nonneg` CHECK ((`balance` >= 0)),
  CONSTRAINT `chk_farmer_min_balance_nonneg` CHECK ((`min_balance` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `farmers`
--

LOCK TABLES `farmers` WRITE;
/*!40000 ALTER TABLE `farmers` DISABLE KEYS */;
INSERT INTO `farmers` VALUES (49,'ayush','rahu ketu','Bhopal','govindpura','14','cholla','9000000000','10/1','2026-07-16 06:17:34','2026-07-16 06:17:34','Active',1000.00,5000.00,NULL,'c1'),(50,'June Farmer',NULL,NULL,NULL,NULL,NULL,'9876543211',NULL,'2026-06-02 04:30:00','2026-07-25 09:51:32','Active',0.00,5000.00,NULL,'c1'),(51,'June Farmer',NULL,NULL,NULL,NULL,NULL,'9876543211',NULL,'2026-06-02 04:30:00','2026-07-25 09:52:06','Active',0.00,5000.00,NULL,'c1'),(52,'June Farmer',NULL,NULL,NULL,NULL,NULL,'9876543211',NULL,'2026-06-02 04:30:00','2026-07-25 09:53:41','Active',0.00,5000.00,NULL,'c1'),(53,'June Farmer',NULL,NULL,NULL,NULL,NULL,'9876543211',NULL,'2026-06-02 04:30:00','2026-07-25 09:54:07','Active',0.00,5000.00,NULL,'c1');
/*!40000 ALTER TABLE `farmers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `holidays`
--

DROP TABLE IF EXISTS `holidays`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `holidays` (
  `id` int NOT NULL AUTO_INCREMENT,
  `holiday_date` date NOT NULL,
  `remark` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `holidays`
--

LOCK TABLES `holidays` WRITE;
/*!40000 ALTER TABLE `holidays` DISABLE KEYS */;
/*!40000 ALTER TABLE `holidays` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `incentives`
--

DROP TABLE IF EXISTS `incentives`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `incentives` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `year` int NOT NULL,
  `month` int NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_used` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`id`),
  KEY `idx_emp_month` (`employee_id`,`year`,`month`),
  CONSTRAINT `fk_inc_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `incentives`
--

LOCK TABLES `incentives` WRITE;
/*!40000 ALTER TABLE `incentives` DISABLE KEYS */;
/*!40000 ALTER TABLE `incentives` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_details`
--

DROP TABLE IF EXISTS `product_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quantity` int NOT NULL,
  `remark` varchar(255) DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `unit` varchar(45) DEFAULT 'kg',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `selected_product` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_product` (`product_id`),
  CONSTRAINT `fk_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_details`
--

LOCK TABLES `product_details` WRITE;
/*!40000 ALTER TABLE `product_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `size` varchar(50) DEFAULT NULL,
  `pieces` int DEFAULT NULL,
  `unit` varchar(50) DEFAULT 'kg',
  `purchase_rate` decimal(10,2) DEFAULT NULL,
  `transport_charge` decimal(10,2) DEFAULT NULL,
  `local_transport` decimal(10,2) DEFAULT NULL,
  `packaging_cost` decimal(10,2) DEFAULT NULL,
  `packing_weight` decimal(10,2) DEFAULT NULL,
  `hsn_code` varchar(50) DEFAULT NULL,
  `value` decimal(10,2) DEFAULT NULL,
  `discount_30` decimal(10,2) DEFAULT NULL,
  `discount_25` decimal(10,2) DEFAULT NULL,
  `discount_50` decimal(10,2) DEFAULT NULL,
  `total` decimal(10,2) DEFAULT NULL,
  `gst` varchar(10) DEFAULT NULL,
  `type` enum('normal','custom') NOT NULL DEFAULT 'normal',
  `ingredients` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=159 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (155,37,' Khapli wheat','11000000',NULL,'ton',100.00,10.00,5.00,1.50,NULL,'1E+07',116.50,34.95,29.13,58.25,174.75,'10','normal',NULL,'2026-07-16 06:22:23','2026-07-16 08:16:40','Active'),(156,39,'June Product','1',NULL,'kg',80.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,100.00,'18','normal',NULL,'2026-07-25 09:52:06','2026-07-25 09:52:06','Active'),(157,40,'June Product','1',NULL,'kg',80.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,100.00,'18','normal',NULL,'2026-07-25 09:53:41','2026-07-25 09:53:41','Active'),(158,41,'June Product','1',NULL,'kg',80.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,100.00,'18','normal',NULL,'2026-07-25 09:54:07','2026-07-25 09:54:07','Active');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_items`
--

DROP TABLE IF EXISTS `purchase_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `purchase_id` int NOT NULL,
  `product_id` int NOT NULL,
  `po_item_id` int DEFAULT NULL,
  `rate` decimal(10,2) NOT NULL,
  `total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `size` decimal(10,2) NOT NULL,
  `unit` varchar(50) DEFAULT 'kg',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `bill_img` varchar(255) DEFAULT NULL,
  `quantity_in_kg` decimal(15,3) DEFAULT '0.000',
  `discount_percent` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(15,3) DEFAULT '0.000',
  `gst_percent` decimal(10,2) DEFAULT '0.00',
  `gst_amount` decimal(15,3) DEFAULT '0.000',
  `base_amount` decimal(15,3) DEFAULT '0.000',
  `amount_after_discount` decimal(15,3) DEFAULT '0.000',
  `final_amount` decimal(15,3) DEFAULT '0.000',
  `taxable_amount` decimal(15,3) DEFAULT '0.000',
  `unit_conversion_factor` decimal(15,3) DEFAULT '1.000',
  `transport_share` decimal(15,3) DEFAULT '0.000',
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL COMMENT 'ID from other table',
  PRIMARY KEY (`id`),
  KEY `purchase_id` (`purchase_id`),
  KEY `product_id` (`product_id`),
  KEY `fk_pi_poi` (`po_item_id`),
  CONSTRAINT `fk_pi_poi` FOREIGN KEY (`po_item_id`) REFERENCES `purchase_order_items` (`id`),
  CONSTRAINT `purchase_items_ibfk_1` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`),
  CONSTRAINT `purchase_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=95 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_items`
--

LOCK TABLES `purchase_items` WRITE;
/*!40000 ALTER TABLE `purchase_items` DISABLE KEYS */;
INSERT INTO `purchase_items` VALUES (88,55,155,NULL,100.00,0.00,10.00,'quantal','Active','2026-07-16 06:36:57','2026-07-16 06:36:57',NULL,1000.000,5.00,5000.000,10.00,9500.000,100000.000,95000.000,104500.000,95000.000,100.000,100.000,50,6),(89,56,155,NULL,100.00,0.00,1.00,'quantal','Active','2026-07-16 07:16:50','2026-07-16 07:16:50',NULL,100.000,5.00,500.000,10.00,950.000,10000.000,9500.000,10450.000,9500.000,100.000,100.000,51,1),(90,58,158,NULL,80.00,800.00,10.00,'kg','Active','2026-06-11 06:30:00','2026-07-25 09:54:07',NULL,0.000,0.00,0.000,0.00,0.000,0.000,0.000,0.000,0.000,1.000,0.000,NULL,NULL),(91,59,158,NULL,80.00,800.00,10.00,'kg','Active','2026-06-12 06:30:00','2026-07-25 09:54:07',NULL,0.000,0.00,0.000,0.00,0.000,0.000,0.000,0.000,0.000,1.000,0.000,NULL,NULL),(92,60,158,NULL,80.00,800.00,10.00,'kg','Active','2026-06-13 06:30:00','2026-07-25 09:54:07',NULL,0.000,0.00,0.000,0.00,0.000,0.000,0.000,0.000,0.000,1.000,0.000,NULL,NULL),(93,61,158,NULL,80.00,800.00,10.00,'kg','Active','2026-06-14 06:30:00','2026-07-25 09:54:07',NULL,0.000,0.00,0.000,0.00,0.000,0.000,0.000,0.000,0.000,1.000,0.000,NULL,NULL),(94,62,158,NULL,80.00,800.00,10.00,'kg','Active','2026-06-15 06:30:00','2026-07-25 09:54:07',NULL,0.000,0.00,0.000,0.00,0.000,0.000,0.000,0.000,0.000,1.000,0.000,NULL,NULL);
/*!40000 ALTER TABLE `purchase_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_items_cmp_001`
--

DROP TABLE IF EXISTS `purchase_items_cmp_001`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_items_cmp_001` (
  `id` int NOT NULL AUTO_INCREMENT,
  `purchase_id` int NOT NULL,
  `product_id` int NOT NULL,
  `po_item_id` int DEFAULT NULL,
  `rate` decimal(10,2) NOT NULL,
  `total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `size` decimal(10,2) NOT NULL,
  `unit` varchar(50) NOT NULL DEFAULT 'kg',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `quantity_in_kg` decimal(15,3) DEFAULT '0.000',
  `discount_percent` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(15,3) DEFAULT '0.000',
  `gst_percent` decimal(10,2) DEFAULT '0.00',
  `gst_amount` decimal(15,3) DEFAULT '0.000',
  `base_amount` decimal(15,3) DEFAULT '0.000',
  `amount_after_discount` decimal(15,3) DEFAULT '0.000',
  `final_amount` decimal(15,3) DEFAULT '0.000',
  `taxable_amount` decimal(15,3) DEFAULT '0.000',
  `unit_conversion_factor` decimal(15,3) DEFAULT '1.000',
  `transport_share` decimal(15,3) DEFAULT '0.000',
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL COMMENT 'ID from other table',
  PRIMARY KEY (`id`),
  KEY `idx_tpl_pi_purchase` (`purchase_id`),
  KEY `idx_tpl_pi_product` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_items_cmp_001`
--

LOCK TABLES `purchase_items_cmp_001` WRITE;
/*!40000 ALTER TABLE `purchase_items_cmp_001` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_items_cmp_001` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_items_cmp_002`
--

DROP TABLE IF EXISTS `purchase_items_cmp_002`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_items_cmp_002` (
  `id` int NOT NULL AUTO_INCREMENT,
  `purchase_id` int NOT NULL,
  `product_id` int NOT NULL,
  `po_item_id` int DEFAULT NULL,
  `rate` decimal(10,2) NOT NULL,
  `total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `size` decimal(10,2) NOT NULL,
  `unit` varchar(50) NOT NULL DEFAULT 'kg',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `quantity_in_kg` decimal(15,3) DEFAULT '0.000',
  `discount_percent` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(15,3) DEFAULT '0.000',
  `gst_percent` decimal(10,2) DEFAULT '0.00',
  `gst_amount` decimal(15,3) DEFAULT '0.000',
  `base_amount` decimal(15,3) DEFAULT '0.000',
  `amount_after_discount` decimal(15,3) DEFAULT '0.000',
  `final_amount` decimal(15,3) DEFAULT '0.000',
  `taxable_amount` decimal(15,3) DEFAULT '0.000',
  `unit_conversion_factor` decimal(15,3) DEFAULT '1.000',
  `transport_share` decimal(15,3) DEFAULT '0.000',
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL COMMENT 'ID from other table',
  PRIMARY KEY (`id`),
  KEY `idx_tpl_pi_purchase` (`purchase_id`),
  KEY `idx_tpl_pi_product` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_items_cmp_002`
--

LOCK TABLES `purchase_items_cmp_002` WRITE;
/*!40000 ALTER TABLE `purchase_items_cmp_002` DISABLE KEYS */;
INSERT INTO `purchase_items_cmp_002` VALUES (6,4,155,NULL,100.00,0.00,10.00,'quantal','Active','2026-07-16 06:36:57','2026-07-16 06:36:57',1000.000,5.00,5000.000,10.00,9500.000,100000.000,95000.000,104500.000,95000.000,100.000,100.000,50,88);
/*!40000 ALTER TABLE `purchase_items_cmp_002` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_items_comp_0`
--

DROP TABLE IF EXISTS `purchase_items_comp_0`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_items_comp_0` (
  `id` int NOT NULL AUTO_INCREMENT,
  `purchase_id` int NOT NULL,
  `product_id` int NOT NULL,
  `po_item_id` int DEFAULT NULL,
  `rate` decimal(10,2) NOT NULL,
  `total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `size` decimal(10,2) NOT NULL,
  `unit` varchar(50) NOT NULL DEFAULT 'kg',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `quantity_in_kg` decimal(15,3) DEFAULT '0.000',
  `discount_percent` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(15,3) DEFAULT '0.000',
  `gst_percent` decimal(10,2) DEFAULT '0.00',
  `gst_amount` decimal(15,3) DEFAULT '0.000',
  `base_amount` decimal(15,3) DEFAULT '0.000',
  `amount_after_discount` decimal(15,3) DEFAULT '0.000',
  `final_amount` decimal(15,3) DEFAULT '0.000',
  `taxable_amount` decimal(15,3) DEFAULT '0.000',
  `unit_conversion_factor` decimal(15,3) DEFAULT '1.000',
  `transport_share` decimal(15,3) DEFAULT '0.000',
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL COMMENT 'ID from other table',
  PRIMARY KEY (`id`),
  KEY `idx_tpl_pi_purchase` (`purchase_id`),
  KEY `idx_tpl_pi_product` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_items_comp_0`
--

LOCK TABLES `purchase_items_comp_0` WRITE;
/*!40000 ALTER TABLE `purchase_items_comp_0` DISABLE KEYS */;
INSERT INTO `purchase_items_comp_0` VALUES (1,1,155,NULL,100.00,0.00,1.00,'quantal','Active','2026-07-16 07:16:50','2026-07-16 07:16:50',100.000,5.00,500.000,10.00,950.000,10000.000,9500.000,10450.000,9500.000,100.000,100.000,51,89);
/*!40000 ALTER TABLE `purchase_items_comp_0` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_order_items`
--

DROP TABLE IF EXISTS `purchase_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `purchase_order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `hsn_code` varchar(50) DEFAULT NULL,
  `qty` decimal(10,2) NOT NULL,
  `rate` decimal(10,2) NOT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_per_qty` decimal(10,2) DEFAULT '0.00',
  `discount_total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_rate` decimal(10,2) DEFAULT '0.00',
  `gst_percent` decimal(5,2) DEFAULT '0.00',
  `gst_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `final_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` enum('Active','Closed','Cancelled') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `unit` varchar(45) DEFAULT 'kg',
  PRIMARY KEY (`id`),
  KEY `idx_poi_po` (`purchase_order_id`),
  KEY `idx_poi_product` (`product_id`),
  CONSTRAINT `fk_poi_po` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_poi_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=102 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_order_items`
--

LOCK TABLES `purchase_order_items` WRITE;
/*!40000 ALTER TABLE `purchase_order_items` DISABLE KEYS */;
INSERT INTO `purchase_order_items` VALUES (100,114,155,'1E+07',10.00,100.00,100000.00,5.00,5000.00,5.00,10.00,9500.00,104500.00,'Cancelled','2026-07-16 06:32:04','2026-07-16 06:36:57','quantal'),(101,115,155,'1E+07',1.00,100.00,10000.00,5.00,500.00,5.00,10.00,950.00,10450.00,'Cancelled','2026-07-16 07:14:59','2026-07-16 07:16:50','quantal');
/*!40000 ALTER TABLE `purchase_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `po_no` varchar(50) NOT NULL,
  `party_type` enum('vendor','farmer') NOT NULL DEFAULT 'vendor',
  `vendor_id` int DEFAULT NULL,
  `farmer_id` int DEFAULT NULL,
  `date` date NOT NULL,
  `bill_time` datetime NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `mobile_no` varchar(15) DEFAULT NULL,
  `gst_no` varchar(50) DEFAULT NULL,
  `place_of_supply` varchar(100) DEFAULT NULL,
  `terms_condition` text,
  `total_amount` decimal(12,2) DEFAULT '0.00',
  `gst_amount` decimal(12,2) DEFAULT '0.00',
  `final_amount` decimal(12,2) DEFAULT '0.00',
  `status` enum('Draft','Issued','PartiallyReceived','Closed','Cancelled') DEFAULT 'Draft',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `unit` varchar(45) DEFAULT 'kg',
  PRIMARY KEY (`id`),
  UNIQUE KEY `po_no` (`po_no`),
  KEY `idx_po_vendor` (`vendor_id`),
  KEY `idx_po_farmer` (`farmer_id`),
  CONSTRAINT `fk_po_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=116 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_orders`
--

LOCK TABLES `purchase_orders` WRITE;
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
INSERT INTO `purchase_orders` VALUES (114,'98746465566','vendor',98,NULL,'2026-07-16','2026-07-16 23:59:00','Madhya pradesh bhopal Awadpuri ','1234567890','24AAAGM0289C1ZP','Kerala','Online',95000.00,9500.00,104500.00,'Issued','2026-07-16 06:32:04','2026-07-16 06:32:04','kg'),(115,'50364962363','vendor',98,NULL,'2026-07-16','2026-07-16 12:43:00','Madhya pradesh bhopal Awadpuri ','1234567890','24AAAGM0289C1ZP','kerala','Payment after supply deliever',9500.00,950.00,10450.00,'Issued','2026-07-16 07:14:59','2026-07-16 07:14:59','kg');
/*!40000 ALTER TABLE `purchase_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_payments`
--

DROP TABLE IF EXISTS `purchase_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `purchases_id` int DEFAULT NULL,
  `party_type` enum('vendor','farmer') DEFAULT NULL,
  `vendor_id` int DEFAULT NULL,
  `farmer_id` int DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `method` enum('None','Cash','Card','Online','Credit Card','UPI') DEFAULT 'None',
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL COMMENT 'ID from other table',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_payments`
--

LOCK TABLES `purchase_payments` WRITE;
/*!40000 ALTER TABLE `purchase_payments` DISABLE KEYS */;
INSERT INTO `purchase_payments` VALUES (11,55,'vendor',98,NULL,'2026-07-16',1000.00,'Cash','','2026-07-16 06:36:57','Active',50,3),(12,56,'vendor',98,NULL,'2026-07-16',1000.00,'Cash','','2026-07-16 07:16:50','Active',51,1);
/*!40000 ALTER TABLE `purchase_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_payments_cmp_001`
--

DROP TABLE IF EXISTS `purchase_payments_cmp_001`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_payments_cmp_001` (
  `id` int NOT NULL AUTO_INCREMENT,
  `purchases_id` int DEFAULT NULL,
  `party_type` enum('vendor','farmer') DEFAULT NULL,
  `vendor_id` int DEFAULT NULL,
  `farmer_id` int DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `method` enum('None','Cash','Card','Online','Credit Card','UPI') DEFAULT 'None',
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL COMMENT 'ID from other table',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_payments_cmp_001`
--

LOCK TABLES `purchase_payments_cmp_001` WRITE;
/*!40000 ALTER TABLE `purchase_payments_cmp_001` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_payments_cmp_001` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_payments_cmp_002`
--

DROP TABLE IF EXISTS `purchase_payments_cmp_002`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_payments_cmp_002` (
  `id` int NOT NULL AUTO_INCREMENT,
  `purchases_id` int DEFAULT NULL,
  `party_type` enum('vendor','farmer') DEFAULT NULL,
  `vendor_id` int DEFAULT NULL,
  `farmer_id` int DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `method` enum('Cash','Card','Online','Credit Card','UPI') DEFAULT NULL,
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL COMMENT 'ID from other table',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_payments_cmp_002`
--

LOCK TABLES `purchase_payments_cmp_002` WRITE;
/*!40000 ALTER TABLE `purchase_payments_cmp_002` DISABLE KEYS */;
INSERT INTO `purchase_payments_cmp_002` VALUES (3,4,'vendor',98,NULL,'2026-07-16',1000.00,'Cash','','2026-07-16 06:36:57','Active',50,11);
/*!40000 ALTER TABLE `purchase_payments_cmp_002` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_payments_comp_0`
--

DROP TABLE IF EXISTS `purchase_payments_comp_0`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_payments_comp_0` (
  `id` int NOT NULL AUTO_INCREMENT,
  `purchases_id` int DEFAULT NULL,
  `party_type` enum('vendor','farmer') DEFAULT NULL,
  `vendor_id` int DEFAULT NULL,
  `farmer_id` int DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `method` enum('Cash','Card','Online','Credit Card','UPI') DEFAULT NULL,
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL COMMENT 'ID from other table',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_payments_comp_0`
--

LOCK TABLES `purchase_payments_comp_0` WRITE;
/*!40000 ALTER TABLE `purchase_payments_comp_0` DISABLE KEYS */;
INSERT INTO `purchase_payments_comp_0` VALUES (1,1,'vendor',98,NULL,'2026-07-16',1000.00,'Cash','','2026-07-16 07:16:50','Active',51,12);
/*!40000 ALTER TABLE `purchase_payments_comp_0` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchases`
--

DROP TABLE IF EXISTS `purchases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int DEFAULT NULL,
  `farmer_id` int DEFAULT NULL,
  `gst_no` varchar(50) DEFAULT NULL,
  `bill_no` varchar(50) NOT NULL,
  `bill_date` date NOT NULL,
  `party_type` enum('vendor','farmer') NOT NULL DEFAULT 'vendor',
  `linked_po_id` int DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT '0.00',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `bill_img` varchar(255) DEFAULT NULL,
  `unit` varchar(45) DEFAULT 'kg',
  `paid_amount` decimal(15,3) DEFAULT '0.000',
  `discount_percent` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(15,3) DEFAULT '0.000',
  `gst_amount` decimal(15,3) DEFAULT '0.000',
  `taxable_amount` decimal(15,3) DEFAULT '0.000',
  `base_amount` decimal(15,3) DEFAULT '0.000',
  `payment_method` varchar(50) DEFAULT 'Cash',
  `payment_note` text,
  `terms_condition` text,
  `transport` decimal(15,3) DEFAULT '0.000',
  `transport_rate` decimal(15,3) DEFAULT '0.000',
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL COMMENT 'ID from other table',
  PRIMARY KEY (`id`),
  KEY `fk_purchases_po` (`linked_po_id`),
  KEY `fk_purchases_vendor` (`vendor_id`),
  KEY `fk_purchases_farmer` (`farmer_id`),
  CONSTRAINT `fk_purchases_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmers` (`id`),
  CONSTRAINT `fk_purchases_po` FOREIGN KEY (`linked_po_id`) REFERENCES `purchase_orders` (`id`),
  CONSTRAINT `fk_purchases_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`),
  CONSTRAINT `purchases_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`),
  CONSTRAINT `chk_party_exactly_one` CHECK ((((`party_type` = _utf8mb4'vendor') and (`vendor_id` is not null) and (`farmer_id` is null)) or ((`party_type` = _utf8mb4'farmer') and (`farmer_id` is not null) and (`vendor_id` is null))))
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchases`
--

LOCK TABLES `purchases` WRITE;
/*!40000 ALTER TABLE `purchases` DISABLE KEYS */;
INSERT INTO `purchases` VALUES (55,98,NULL,'24AAAGM0289C1ZP','bill 001','2026-07-16','vendor',NULL,104600.00,'Active','2026-07-16 06:36:57','2026-07-16 06:36:57','/public/uploads/1784183817470_WhatsApp_Image_2025-11-14_at_18.01.35_97ad0938.jpg','kg',1000.000,0.00,0.000,9500.000,95000.000,100000.000,'Cash','','Online',100.000,0.000,50,4),(56,98,NULL,'24AAAGM0289C1ZP','bill_no 0001','2026-07-16','vendor',NULL,10550.00,'Active','2026-07-16 07:16:50','2026-07-16 07:16:50','/public/uploads/1784186208871_Screenshot_2026-07-07_162213.png','kg',1000.000,0.00,0.000,950.000,9500.000,10000.000,'Cash','','Payment after supply deliever',100.000,0.000,51,1),(57,100,NULL,NULL,'PJ-1','2026-06-11','vendor',NULL,1180.00,'Active','2026-06-11 06:30:00','2026-07-25 09:52:07',NULL,'kg',0.000,0.00,0.000,180.000,1000.000,0.000,'Cash',NULL,NULL,0.000,0.000,NULL,NULL),(58,102,NULL,NULL,'PJ-1784973247432-1','2026-06-11','vendor',NULL,800.00,'Active','2026-06-11 06:30:00','2026-07-25 09:54:07',NULL,'kg',0.000,0.00,0.000,0.000,0.000,0.000,'Cash',NULL,NULL,0.000,0.000,NULL,NULL),(59,102,NULL,NULL,'PJ-1784973247432-2','2026-06-12','vendor',NULL,800.00,'Active','2026-06-12 06:30:00','2026-07-25 09:54:07',NULL,'kg',0.000,0.00,0.000,0.000,0.000,0.000,'Cash',NULL,NULL,0.000,0.000,NULL,NULL),(60,102,NULL,NULL,'PJ-1784973247432-3','2026-06-13','vendor',NULL,800.00,'Active','2026-06-13 06:30:00','2026-07-25 09:54:07',NULL,'kg',0.000,0.00,0.000,0.000,0.000,0.000,'Cash',NULL,NULL,0.000,0.000,NULL,NULL),(61,102,NULL,NULL,'PJ-1784973247432-4','2026-06-14','vendor',NULL,800.00,'Active','2026-06-14 06:30:00','2026-07-25 09:54:07',NULL,'kg',0.000,0.00,0.000,0.000,0.000,0.000,'Cash',NULL,NULL,0.000,0.000,NULL,NULL),(62,102,NULL,NULL,'PJ-1784973247432-5','2026-06-15','vendor',NULL,800.00,'Active','2026-06-15 06:30:00','2026-07-25 09:54:07',NULL,'kg',0.000,0.00,0.000,0.000,0.000,0.000,'Cash',NULL,NULL,0.000,0.000,NULL,NULL);
/*!40000 ALTER TABLE `purchases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchases_cmp_001`
--

DROP TABLE IF EXISTS `purchases_cmp_001`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchases_cmp_001` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int DEFAULT NULL,
  `farmer_id` int DEFAULT NULL,
  `gst_no` varchar(50) DEFAULT NULL,
  `bill_no` varchar(50) NOT NULL,
  `bill_date` date NOT NULL,
  `party_type` enum('vendor','farmer') NOT NULL DEFAULT 'vendor',
  `linked_po_id` int DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT '0.00',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `bill_img` varchar(255) DEFAULT NULL,
  `unit` varchar(45) DEFAULT 'kg',
  `paid_amount` decimal(15,3) DEFAULT '0.000',
  `discount_percent` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(15,3) DEFAULT '0.000',
  `gst_amount` decimal(15,3) DEFAULT '0.000',
  `taxable_amount` decimal(15,3) DEFAULT '0.000',
  `base_amount` decimal(15,3) DEFAULT '0.000',
  `payment_method` varchar(50) DEFAULT 'Cash',
  `payment_note` text,
  `terms_condition` text,
  `transport` decimal(15,3) DEFAULT '0.000',
  `transport_rate` decimal(15,3) DEFAULT '0.000',
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL COMMENT 'ID from other table',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tpl_purchase_bill` (`bill_no`),
  KEY `idx_tpl_purchase_date` (`bill_date`),
  KEY `idx_tpl_purchase_vendor` (`vendor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchases_cmp_001`
--

LOCK TABLES `purchases_cmp_001` WRITE;
/*!40000 ALTER TABLE `purchases_cmp_001` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchases_cmp_001` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchases_cmp_002`
--

DROP TABLE IF EXISTS `purchases_cmp_002`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchases_cmp_002` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int DEFAULT NULL,
  `farmer_id` int DEFAULT NULL,
  `gst_no` varchar(50) DEFAULT NULL,
  `bill_no` varchar(50) NOT NULL,
  `bill_date` date NOT NULL,
  `party_type` enum('vendor','farmer') NOT NULL DEFAULT 'vendor',
  `linked_po_id` int DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT '0.00',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `bill_img` varchar(255) DEFAULT NULL,
  `unit` varchar(45) DEFAULT 'kg',
  `paid_amount` decimal(15,3) DEFAULT '0.000',
  `discount_percent` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(15,3) DEFAULT '0.000',
  `gst_amount` decimal(15,3) DEFAULT '0.000',
  `taxable_amount` decimal(15,3) DEFAULT '0.000',
  `base_amount` decimal(15,3) DEFAULT '0.000',
  `payment_method` varchar(50) DEFAULT 'Cash',
  `payment_note` text,
  `terms_condition` text,
  `transport` decimal(15,3) DEFAULT '0.000',
  `transport_rate` decimal(15,3) DEFAULT '0.000',
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL COMMENT 'ID from other table',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tpl_purchase_bill` (`bill_no`),
  KEY `idx_tpl_purchase_date` (`bill_date`),
  KEY `idx_tpl_purchase_vendor` (`vendor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchases_cmp_002`
--

LOCK TABLES `purchases_cmp_002` WRITE;
/*!40000 ALTER TABLE `purchases_cmp_002` DISABLE KEYS */;
INSERT INTO `purchases_cmp_002` VALUES (4,98,NULL,'24AAAGM0289C1ZP','bill 001','2026-07-16','vendor',NULL,104600.00,'Active','2026-07-16 06:36:57','2026-07-16 06:36:57','/public/uploads/1784183817470_WhatsApp_Image_2025-11-14_at_18.01.35_97ad0938.jpg','kg',1000.000,0.00,0.000,9500.000,95000.000,100000.000,'Cash','','Online',100.000,0.000,50,55);
/*!40000 ALTER TABLE `purchases_cmp_002` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchases_comp_0`
--

DROP TABLE IF EXISTS `purchases_comp_0`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchases_comp_0` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int DEFAULT NULL,
  `farmer_id` int DEFAULT NULL,
  `gst_no` varchar(50) DEFAULT NULL,
  `bill_no` varchar(50) NOT NULL,
  `bill_date` date NOT NULL,
  `party_type` enum('vendor','farmer') NOT NULL DEFAULT 'vendor',
  `linked_po_id` int DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT '0.00',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `bill_img` varchar(255) DEFAULT NULL,
  `unit` varchar(45) DEFAULT 'kg',
  `paid_amount` decimal(15,3) DEFAULT '0.000',
  `discount_percent` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(15,3) DEFAULT '0.000',
  `gst_amount` decimal(15,3) DEFAULT '0.000',
  `taxable_amount` decimal(15,3) DEFAULT '0.000',
  `base_amount` decimal(15,3) DEFAULT '0.000',
  `payment_method` varchar(50) DEFAULT 'Cash',
  `payment_note` text,
  `terms_condition` text,
  `transport` decimal(15,3) DEFAULT '0.000',
  `transport_rate` decimal(15,3) DEFAULT '0.000',
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL COMMENT 'ID from other table',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tpl_purchase_bill` (`bill_no`),
  KEY `idx_tpl_purchase_date` (`bill_date`),
  KEY `idx_tpl_purchase_vendor` (`vendor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchases_comp_0`
--

LOCK TABLES `purchases_comp_0` WRITE;
/*!40000 ALTER TABLE `purchases_comp_0` DISABLE KEYS */;
INSERT INTO `purchases_comp_0` VALUES (1,98,NULL,'24AAAGM0289C1ZP','bill_no 0001','2026-07-16','vendor',NULL,10550.00,'Active','2026-07-16 07:16:50','2026-07-16 07:16:50','/public/uploads/1784186208871_Screenshot_2026-07-07_162213.png','kg',1000.000,0.00,0.000,950.000,9500.000,10000.000,'Cash','','Payment after supply deliever',100.000,0.000,51,56);
/*!40000 ALTER TABLE `purchases_comp_0` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `salary_reports`
--

DROP TABLE IF EXISTS `salary_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salary_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `year` int NOT NULL,
  `month` int NOT NULL,
  `base_salary` decimal(12,2) DEFAULT NULL,
  `days_in_month` int DEFAULT NULL,
  `total_deduction` decimal(12,2) DEFAULT NULL,
  `total_incentives` decimal(12,2) DEFAULT NULL,
  `final_salary` decimal(12,2) DEFAULT NULL,
  `generated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_emp_year_month` (`employee_id`,`year`,`month`),
  CONSTRAINT `fk_sal_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=126 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `salary_reports`
--

LOCK TABLES `salary_reports` WRITE;
/*!40000 ALTER TABLE `salary_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `salary_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_items`
--

DROP TABLE IF EXISTS `sale_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `product_id` int NOT NULL,
  `rate` decimal(10,2) NOT NULL,
  `total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `qty` decimal(10,2) NOT NULL,
  `discount_rate` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `taxable_amount` decimal(10,2) DEFAULT '0.00',
  `gst_percent` decimal(5,2) DEFAULT '0.00',
  `gst_amount` decimal(10,2) DEFAULT '0.00',
  `net_total` decimal(10,2) DEFAULT '0.00',
  `unit` varchar(50) NOT NULL DEFAULT 'kg',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `buyer_type` enum('retailer','wholesaler') NOT NULL DEFAULT 'retailer',
  `product_detail` json DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sale_items_sale` (`sale_id`),
  KEY `idx_sale_items_product` (`product_id`),
  CONSTRAINT `fk_sale_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_sale_items_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=147 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_items`
--

LOCK TABLES `sale_items` WRITE;
/*!40000 ALTER TABLE `sale_items` DISABLE KEYS */;
INSERT INTO `sale_items` VALUES (136,75,155,174.75,0.00,1.00,5.00,873.75,16601.25,10.00,1660.13,18261.38,'quantal','Active','2026-07-16 08:16:40','2026-07-16 08:16:40','retailer',NULL,51,1),(137,76,156,100.00,1000.00,10.00,0.00,0.00,1000.00,18.00,180.00,1180.00,'kg','Active','2026-06-01 06:30:00','2026-07-25 09:52:07','retailer',NULL,NULL,NULL),(138,77,156,100.00,1000.00,10.00,0.00,0.00,1000.00,18.00,180.00,1180.00,'kg','Active','2026-06-02 06:30:00','2026-07-25 09:52:07','retailer',NULL,NULL,NULL),(139,78,156,100.00,1000.00,10.00,0.00,0.00,1000.00,18.00,180.00,1180.00,'kg','Active','2026-06-03 06:30:00','2026-07-25 09:52:07','retailer',NULL,NULL,NULL),(140,79,156,100.00,1000.00,10.00,0.00,0.00,1000.00,18.00,180.00,1180.00,'kg','Active','2026-06-04 06:30:00','2026-07-25 09:52:07','retailer',NULL,NULL,NULL),(141,80,156,100.00,1000.00,10.00,0.00,0.00,1000.00,18.00,180.00,1180.00,'kg','Active','2026-06-05 06:30:00','2026-07-25 09:52:07','retailer',NULL,NULL,NULL),(142,82,158,100.00,1000.00,10.00,0.00,0.00,1000.00,18.00,180.00,1180.00,'kg','Active','2026-06-01 06:30:00','2026-07-25 09:54:07','retailer',NULL,NULL,NULL),(143,83,158,100.00,1000.00,10.00,0.00,0.00,1000.00,18.00,180.00,1180.00,'kg','Active','2026-06-02 06:30:00','2026-07-25 09:54:07','retailer',NULL,NULL,NULL),(144,84,158,100.00,1000.00,10.00,0.00,0.00,1000.00,18.00,180.00,1180.00,'kg','Active','2026-06-03 06:30:00','2026-07-25 09:54:07','retailer',NULL,NULL,NULL),(145,85,158,100.00,1000.00,10.00,0.00,0.00,1000.00,18.00,180.00,1180.00,'kg','Active','2026-06-04 06:30:00','2026-07-25 09:54:07','retailer',NULL,NULL,NULL),(146,86,158,100.00,1000.00,10.00,0.00,0.00,1000.00,18.00,180.00,1180.00,'kg','Active','2026-06-05 06:30:00','2026-07-25 09:54:07','retailer',NULL,NULL,NULL);
/*!40000 ALTER TABLE `sale_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_items_cmp_001`
--

DROP TABLE IF EXISTS `sale_items_cmp_001`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_items_cmp_001` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `product_id` int NOT NULL,
  `rate` decimal(10,2) NOT NULL,
  `total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `qty` decimal(10,2) NOT NULL,
  `discount_rate` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `taxable_amount` decimal(10,2) DEFAULT '0.00',
  `gst_percent` decimal(5,2) DEFAULT '0.00',
  `gst_amount` decimal(10,2) DEFAULT '0.00',
  `net_total` decimal(10,2) DEFAULT '0.00',
  `unit` varchar(50) DEFAULT 'kg',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  `product_detail` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tpl_si_sale` (`sale_id`),
  KEY `idx_tpl_si_product` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_items_cmp_001`
--

LOCK TABLES `sale_items_cmp_001` WRITE;
/*!40000 ALTER TABLE `sale_items_cmp_001` DISABLE KEYS */;
/*!40000 ALTER TABLE `sale_items_cmp_001` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_items_cmp_002`
--

DROP TABLE IF EXISTS `sale_items_cmp_002`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_items_cmp_002` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `product_id` int NOT NULL,
  `rate` decimal(10,2) NOT NULL,
  `total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `qty` decimal(10,2) NOT NULL,
  `discount_rate` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `taxable_amount` decimal(10,2) DEFAULT '0.00',
  `gst_percent` decimal(5,2) DEFAULT '0.00',
  `gst_amount` decimal(10,2) DEFAULT '0.00',
  `net_total` decimal(10,2) DEFAULT '0.00',
  `unit` varchar(50) DEFAULT 'kg',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  `product_detail` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tpl_si_sale` (`sale_id`),
  KEY `idx_tpl_si_product` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_items_cmp_002`
--

LOCK TABLES `sale_items_cmp_002` WRITE;
/*!40000 ALTER TABLE `sale_items_cmp_002` DISABLE KEYS */;
/*!40000 ALTER TABLE `sale_items_cmp_002` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_items_comp_0`
--

DROP TABLE IF EXISTS `sale_items_comp_0`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_items_comp_0` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `product_id` int NOT NULL,
  `rate` decimal(10,2) NOT NULL,
  `total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `qty` decimal(10,2) NOT NULL,
  `discount_rate` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `taxable_amount` decimal(10,2) DEFAULT '0.00',
  `gst_percent` decimal(5,2) DEFAULT '0.00',
  `gst_amount` decimal(10,2) DEFAULT '0.00',
  `net_total` decimal(10,2) DEFAULT '0.00',
  `unit` varchar(50) DEFAULT 'kg',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  `product_detail` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tpl_si_sale` (`sale_id`),
  KEY `idx_tpl_si_product` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_items_comp_0`
--

LOCK TABLES `sale_items_comp_0` WRITE;
/*!40000 ALTER TABLE `sale_items_comp_0` DISABLE KEYS */;
INSERT INTO `sale_items_comp_0` VALUES (1,12,155,174.75,0.00,1.00,5.00,873.75,16601.25,10.00,1660.13,18261.38,'quantal','Active','2026-07-16 08:16:40','2026-07-16 08:16:40',NULL,136,NULL);
/*!40000 ALTER TABLE `sale_items_comp_0` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_payments`
--

DROP TABLE IF EXISTS `sale_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `party_type` enum('customer','vendor','farmer') NOT NULL DEFAULT 'customer',
  `customer_id` int DEFAULT NULL,
  `vendor_id` int DEFAULT NULL,
  `farmer_id` int DEFAULT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` enum('None','Cash','Card','Online','Credit Card','UPI') DEFAULT 'None',
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `unit` varchar(45) DEFAULT 'kg',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_payments_sale` (`sale_id`),
  KEY `idx_payments_customer` (`customer_id`),
  KEY `idx_payments_customer_paydate` (`customer_id`,`payment_date`),
  KEY `idx_payments_created_at` (`created_at`),
  KEY `fk_sp_vendor` (`vendor_id`),
  KEY `fk_sp_farmer` (`farmer_id`),
  CONSTRAINT `fk_sale_payments_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sp_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_sp_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmers` (`id`),
  CONSTRAINT `fk_sp_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`),
  CONSTRAINT `chk_sale_payments_party_exactly_one` CHECK ((((`party_type` = _utf8mb4'customer') and (`customer_id` is not null) and (`vendor_id` is null) and (`farmer_id` is null)) or ((`party_type` = _utf8mb4'vendor') and (`vendor_id` is not null) and (`customer_id` is null) and (`farmer_id` is null)) or ((`party_type` = _utf8mb4'farmer') and (`farmer_id` is not null) and (`customer_id` is null) and (`vendor_id` is null))))
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_payments`
--

LOCK TABLES `sale_payments` WRITE;
/*!40000 ALTER TABLE `sale_payments` DISABLE KEYS */;
INSERT INTO `sale_payments` VALUES (47,75,'vendor',NULL,98,NULL,'2026-07-16',1000.00,'None',NULL,'2026-07-16 08:16:40','kg','Active',51,1),(48,76,'customer',29,NULL,NULL,'2026-06-01',1180.00,'Cash',NULL,'2026-06-01 06:30:00','kg','Active',NULL,NULL),(49,77,'customer',29,NULL,NULL,'2026-06-02',1180.00,'Cash',NULL,'2026-06-02 06:30:00','kg','Active',NULL,NULL),(50,78,'customer',29,NULL,NULL,'2026-06-03',1180.00,'Cash',NULL,'2026-06-03 06:30:00','kg','Active',NULL,NULL),(51,79,'customer',29,NULL,NULL,'2026-06-04',1180.00,'Cash',NULL,'2026-06-04 06:30:00','kg','Active',NULL,NULL),(52,80,'customer',29,NULL,NULL,'2026-06-05',1180.00,'Cash',NULL,'2026-06-05 06:30:00','kg','Active',NULL,NULL),(53,82,'customer',31,NULL,NULL,'2026-06-01',1180.00,'Cash',NULL,'2026-06-01 06:30:00','kg','Active',NULL,NULL),(54,83,'customer',31,NULL,NULL,'2026-06-02',1180.00,'Cash',NULL,'2026-06-02 06:30:00','kg','Active',NULL,NULL),(55,84,'customer',31,NULL,NULL,'2026-06-03',1180.00,'Cash',NULL,'2026-06-03 06:30:00','kg','Active',NULL,NULL),(56,85,'customer',31,NULL,NULL,'2026-06-04',1180.00,'Cash',NULL,'2026-06-04 06:30:00','kg','Active',NULL,NULL),(57,86,'customer',31,NULL,NULL,'2026-06-05',1180.00,'Cash',NULL,'2026-06-05 06:30:00','kg','Active',NULL,NULL);
/*!40000 ALTER TABLE `sale_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_payments_cmp_001`
--

DROP TABLE IF EXISTS `sale_payments_cmp_001`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_payments_cmp_001` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `party_type` enum('customer','vendor','farmer') DEFAULT NULL,
  `customer_id` int DEFAULT NULL,
  `vendor_id` int DEFAULT NULL,
  `farmer_id` int DEFAULT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` enum('None','Cash','Card','Online','Credit Card','UPI') DEFAULT 'None',
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `unit` varchar(45) NOT NULL DEFAULT 'kg',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tpl_payments_sale` (`sale_id`),
  KEY `idx_tpl_payments_party` (`customer_id`,`payment_date`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_payments_cmp_001`
--

LOCK TABLES `sale_payments_cmp_001` WRITE;
/*!40000 ALTER TABLE `sale_payments_cmp_001` DISABLE KEYS */;
/*!40000 ALTER TABLE `sale_payments_cmp_001` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_payments_cmp_002`
--

DROP TABLE IF EXISTS `sale_payments_cmp_002`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_payments_cmp_002` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `party_type` enum('customer','vendor','farmer') DEFAULT NULL,
  `customer_id` int DEFAULT NULL,
  `vendor_id` int DEFAULT NULL,
  `farmer_id` int DEFAULT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` enum('None','Cash','Card','Online','Credit Card','UPI') DEFAULT 'None',
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `unit` varchar(45) NOT NULL DEFAULT 'kg',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tpl_payments_sale` (`sale_id`),
  KEY `idx_tpl_payments_party` (`customer_id`,`payment_date`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_payments_cmp_002`
--

LOCK TABLES `sale_payments_cmp_002` WRITE;
/*!40000 ALTER TABLE `sale_payments_cmp_002` DISABLE KEYS */;
/*!40000 ALTER TABLE `sale_payments_cmp_002` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_payments_comp_0`
--

DROP TABLE IF EXISTS `sale_payments_comp_0`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_payments_comp_0` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `party_type` enum('customer','vendor','farmer') DEFAULT NULL,
  `customer_id` int DEFAULT NULL,
  `vendor_id` int DEFAULT NULL,
  `farmer_id` int DEFAULT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` enum('None','Cash','Card','Online','Credit Card','UPI') DEFAULT 'None',
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `unit` varchar(45) NOT NULL DEFAULT 'kg',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tpl_payments_sale` (`sale_id`),
  KEY `idx_tpl_payments_party` (`customer_id`,`payment_date`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_payments_comp_0`
--

LOCK TABLES `sale_payments_comp_0` WRITE;
/*!40000 ALTER TABLE `sale_payments_comp_0` DISABLE KEYS */;
INSERT INTO `sale_payments_comp_0` VALUES (1,12,'vendor',NULL,98,NULL,'2026-07-16',1000.00,'None',NULL,'2026-07-16 08:16:40','kg','Active',NULL,47);
/*!40000 ALTER TABLE `sale_payments_comp_0` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL,
  `vendor_id` int DEFAULT NULL,
  `farmer_id` int DEFAULT NULL,
  `bill_no` varchar(50) NOT NULL,
  `bill_date` date NOT NULL,
  `party_type` enum('customer','vendor','farmer') NOT NULL DEFAULT 'customer',
  `total_taxable` decimal(10,2) DEFAULT '0.00',
  `total_gst` decimal(10,2) DEFAULT '0.00',
  `payment_status` enum('Paid','Unpaid','Partial') DEFAULT 'Unpaid',
  `payment_method` enum('Cash','Card','Online','Credit Card','UPI','None') DEFAULT 'None',
  `remarks` text,
  `total_amount` decimal(10,2) DEFAULT '0.00',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `buyer_type` enum('retailer','wholesaler') DEFAULT 'retailer',
  `unit` varchar(45) DEFAULT 'kg',
  `other_note` varchar(255) DEFAULT NULL,
  `other_amount` decimal(10,2) DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  `total_discount_amount` decimal(15,2) DEFAULT '0.00',
  `paid_amount` decimal(15,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sales_bill_no` (`bill_no`),
  KEY `idx_sales_customer` (`customer_id`),
  KEY `idx_sales_bill_date` (`bill_date`),
  KEY `idx_sales_customer_billdate` (`customer_id`,`bill_date`),
  KEY `idx_sales_created_at` (`created_at`),
  KEY `fk_sales_vendor_1` (`vendor_id`),
  KEY `fk_sales_farmer_1` (`farmer_id`),
  CONSTRAINT `fk_sales_farmer_1` FOREIGN KEY (`farmer_id`) REFERENCES `farmers` (`id`),
  CONSTRAINT `fk_sales_vendor_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`),
  CONSTRAINT `chk_sales_party_exactly_one` CHECK ((((`party_type` = _utf8mb4'customer') and (`customer_id` is not null) and (`vendor_id` is null) and (`farmer_id` is null)) or ((`party_type` = _utf8mb4'vendor') and (`vendor_id` is not null) and (`customer_id` is null) and (`farmer_id` is null)) or ((`party_type` = _utf8mb4'farmer') and (`farmer_id` is not null) and (`customer_id` is null) and (`vendor_id` is null))))
) ENGINE=InnoDB AUTO_INCREMENT=87 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
INSERT INTO `sales` VALUES (64,NULL,98,NULL,'COMP/26-27/001','2026-07-16','vendor',0.00,0.00,'Partial','None','',0.00,'Active','2026-07-16 07:51:29','2026-07-16 07:51:29','retailer','kg','transport charges',100.00,51,1,0.00,100.00),(75,NULL,98,NULL,'COMP/26-27/002','2026-07-16','vendor',16601.25,1660.13,'Partial','None','',18361.38,'Active','2026-07-16 08:16:40','2026-07-16 08:16:40','retailer','kg','transport fee',100.00,51,12,873.75,1000.00),(76,29,NULL,NULL,'SJ-1','2026-06-01','customer',1000.00,180.00,'Paid','None',NULL,1180.00,'Active','2026-06-01 06:30:00','2026-07-25 09:52:06','retailer','kg',NULL,NULL,NULL,NULL,0.00,0.00),(77,29,NULL,NULL,'SJ-2','2026-06-02','customer',1000.00,180.00,'Paid','None',NULL,1180.00,'Active','2026-06-02 06:30:00','2026-07-25 09:52:07','retailer','kg',NULL,NULL,NULL,NULL,0.00,0.00),(78,29,NULL,NULL,'SJ-3','2026-06-03','customer',1000.00,180.00,'Paid','None',NULL,1180.00,'Active','2026-06-03 06:30:00','2026-07-25 09:52:07','retailer','kg',NULL,NULL,NULL,NULL,0.00,0.00),(79,29,NULL,NULL,'SJ-4','2026-06-04','customer',1000.00,180.00,'Paid','None',NULL,1180.00,'Active','2026-06-04 06:30:00','2026-07-25 09:52:07','retailer','kg',NULL,NULL,NULL,NULL,0.00,0.00),(80,29,NULL,NULL,'SJ-5','2026-06-05','customer',1000.00,180.00,'Paid','None',NULL,1180.00,'Active','2026-06-05 06:30:00','2026-07-25 09:52:07','retailer','kg',NULL,NULL,NULL,NULL,0.00,0.00),(82,31,NULL,NULL,'SJ-1784973247432-1','2026-06-01','customer',1000.00,180.00,'Paid','None',NULL,1180.00,'Active','2026-06-01 06:30:00','2026-07-25 09:54:07','retailer','kg',NULL,NULL,NULL,NULL,0.00,0.00),(83,31,NULL,NULL,'SJ-1784973247432-2','2026-06-02','customer',1000.00,180.00,'Paid','None',NULL,1180.00,'Active','2026-06-02 06:30:00','2026-07-25 09:54:07','retailer','kg',NULL,NULL,NULL,NULL,0.00,0.00),(84,31,NULL,NULL,'SJ-1784973247432-3','2026-06-03','customer',1000.00,180.00,'Paid','None',NULL,1180.00,'Active','2026-06-03 06:30:00','2026-07-25 09:54:07','retailer','kg',NULL,NULL,NULL,NULL,0.00,0.00),(85,31,NULL,NULL,'SJ-1784973247432-4','2026-06-04','customer',1000.00,180.00,'Paid','None',NULL,1180.00,'Active','2026-06-04 06:30:00','2026-07-25 09:54:07','retailer','kg',NULL,NULL,NULL,NULL,0.00,0.00),(86,31,NULL,NULL,'SJ-1784973247432-5','2026-06-05','customer',1000.00,180.00,'Paid','None',NULL,1180.00,'Active','2026-06-05 06:30:00','2026-07-25 09:54:07','retailer','kg',NULL,NULL,NULL,NULL,0.00,0.00);
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_cmp_001`
--

DROP TABLE IF EXISTS `sales_cmp_001`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_cmp_001` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL,
  `vendor_id` int DEFAULT NULL,
  `farmer_id` int DEFAULT NULL,
  `bill_no` varchar(50) NOT NULL,
  `bill_date` date NOT NULL,
  `party_type` enum('customer','vendor','farmer') NOT NULL DEFAULT 'customer',
  `total_taxable` decimal(10,2) DEFAULT '0.00',
  `total_gst` decimal(10,2) DEFAULT '0.00',
  `payment_status` enum('Paid','Unpaid','Partial') DEFAULT 'Unpaid',
  `payment_method` enum('Cash','Card','Online','Credit Card','UPI','None') DEFAULT 'None',
  `remarks` text,
  `total_amount` decimal(10,2) DEFAULT '0.00',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `other_amount` decimal(10,2) DEFAULT '0.00',
  `other_note` varchar(255) DEFAULT NULL,
  `unit` varchar(45) NOT NULL DEFAULT 'kg',
  `buyer_type` enum('retailer','wholesaler') DEFAULT 'retailer',
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  `total_discount_amount` decimal(12,2) DEFAULT '0.00',
  `paid_amount` decimal(12,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tpl_sales_bill` (`bill_no`),
  KEY `idx_tpl_sales_date` (`bill_date`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_cmp_001`
--

LOCK TABLES `sales_cmp_001` WRITE;
/*!40000 ALTER TABLE `sales_cmp_001` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales_cmp_001` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_cmp_002`
--

DROP TABLE IF EXISTS `sales_cmp_002`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_cmp_002` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL,
  `vendor_id` int DEFAULT NULL,
  `farmer_id` int DEFAULT NULL,
  `bill_no` varchar(50) NOT NULL,
  `bill_date` date NOT NULL,
  `party_type` enum('customer','vendor','farmer') NOT NULL DEFAULT 'customer',
  `total_taxable` decimal(10,2) DEFAULT '0.00',
  `total_gst` decimal(10,2) DEFAULT '0.00',
  `payment_status` enum('Paid','Unpaid','Partial') DEFAULT 'Unpaid',
  `payment_method` enum('Cash','Card','Online','Credit Card','UPI','None') DEFAULT 'None',
  `remarks` text,
  `total_amount` decimal(10,2) DEFAULT '0.00',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `other_amount` decimal(10,2) DEFAULT '0.00',
  `other_note` varchar(255) DEFAULT NULL,
  `unit` varchar(45) NOT NULL DEFAULT 'kg',
  `buyer_type` enum('retailer','wholesaler') DEFAULT 'retailer',
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  `total_discount_amount` decimal(12,2) DEFAULT '0.00',
  `paid_amount` decimal(12,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tpl_sales_bill` (`bill_no`),
  KEY `idx_tpl_sales_date` (`bill_date`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_cmp_002`
--

LOCK TABLES `sales_cmp_002` WRITE;
/*!40000 ALTER TABLE `sales_cmp_002` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales_cmp_002` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_comp_0`
--

DROP TABLE IF EXISTS `sales_comp_0`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_comp_0` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL,
  `vendor_id` int DEFAULT NULL,
  `farmer_id` int DEFAULT NULL,
  `bill_no` varchar(50) NOT NULL,
  `bill_date` date NOT NULL,
  `party_type` enum('customer','vendor','farmer') NOT NULL DEFAULT 'customer',
  `total_taxable` decimal(10,2) DEFAULT '0.00',
  `total_gst` decimal(10,2) DEFAULT '0.00',
  `payment_status` enum('Paid','Unpaid','Partial') DEFAULT 'Unpaid',
  `payment_method` enum('Cash','Card','Online','Credit Card','UPI','None') DEFAULT 'None',
  `remarks` text,
  `total_amount` decimal(10,2) DEFAULT '0.00',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `other_amount` decimal(10,2) DEFAULT '0.00',
  `other_note` varchar(255) DEFAULT NULL,
  `unit` varchar(45) NOT NULL DEFAULT 'kg',
  `buyer_type` enum('retailer','wholesaler') DEFAULT 'retailer',
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  `total_discount_amount` decimal(12,2) DEFAULT '0.00',
  `paid_amount` decimal(12,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tpl_sales_bill` (`bill_no`),
  KEY `idx_tpl_sales_date` (`bill_date`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_comp_0`
--

LOCK TABLES `sales_comp_0` WRITE;
/*!40000 ALTER TABLE `sales_comp_0` DISABLE KEYS */;
INSERT INTO `sales_comp_0` VALUES (1,NULL,98,NULL,'COMP/26-27/001','2026-07-16','vendor',0.00,0.00,'Partial','None','',0.00,'Active','2026-07-16 07:51:29','2026-07-16 07:51:29',100.00,'transport charges','kg','retailer',NULL,64,0.00,100.00),(12,NULL,98,NULL,'COMP/26-27/002','2026-07-16','vendor',16601.25,1660.13,'Partial','None','',18361.38,'Active','2026-07-16 08:16:40','2026-07-16 08:16:40',100.00,'transport fee','kg','retailer',NULL,75,873.75,1000.00);
/*!40000 ALTER TABLE `sales_comp_0` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_order_items`
--

DROP TABLE IF EXISTS `sales_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sales_order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `hsn_code` varchar(50) DEFAULT NULL,
  `qty` decimal(10,2) NOT NULL,
  `rate` decimal(10,2) NOT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_per_qty` decimal(10,2) DEFAULT '0.00',
  `discount_total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `gst_percent` decimal(5,2) DEFAULT '0.00',
  `gst_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `final_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_rate` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` enum('Active','Cancelled','Issued') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `buyer_type` enum('retailer','wholesaler') NOT NULL DEFAULT 'retailer',
  `unit` varchar(45) DEFAULT 'kg',
  PRIMARY KEY (`id`),
  KEY `soi_so_idx` (`sales_order_id`),
  KEY `soi_prod_idx` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_order_items`
--

LOCK TABLES `sales_order_items` WRITE;
/*!40000 ALTER TABLE `sales_order_items` DISABLE KEYS */;
INSERT INTO `sales_order_items` VALUES (48,44,155,'1E+07',1.00,174.75,17475.00,5.00,873.75,10.00,1660.13,18261.38,873.75,'Active','2026-07-16 07:37:51','2026-07-16 07:37:51','retailer','quantal'),(49,45,155,'1E+07',1.00,174.75,17475.00,5.00,873.75,10.00,1660.13,18261.38,873.75,'Active','2026-07-16 07:48:24','2026-07-16 07:48:24','retailer','quantal');
/*!40000 ALTER TABLE `sales_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_orders`
--

DROP TABLE IF EXISTS `sales_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `so_no` varchar(50) NOT NULL,
  `party_type` enum('Customer','Vendor','Farmer') NOT NULL,
  `party_id` int NOT NULL,
  `buyer_type` enum('Retailer','Whole Saler') NOT NULL DEFAULT 'Retailer',
  `date` date NOT NULL,
  `bill_time` datetime NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `mobile_no` varchar(15) DEFAULT NULL,
  `gst_no` varchar(50) DEFAULT NULL,
  `place_of_supply` varchar(100) DEFAULT NULL,
  `terms_condition` text,
  `other_amount` int DEFAULT NULL,
  `other_note` varchar(255) DEFAULT NULL,
  `total_amount` decimal(12,2) DEFAULT '0.00',
  `gst_amount` decimal(12,2) DEFAULT '0.00',
  `final_amount` decimal(12,2) DEFAULT '0.00',
  `status` enum('Draft','Issued','Confirmed','Closed','Cancelled') DEFAULT 'Draft',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `unit` varchar(45) DEFAULT 'kg',
  PRIMARY KEY (`id`),
  UNIQUE KEY `so_no` (`so_no`),
  KEY `idx_sales_orders_party` (`party_type`,`party_id`),
  CONSTRAINT `chk_party_type` CHECK ((`party_type` in (_utf8mb4'Customer',_utf8mb4'Vendor',_utf8mb4'Farmer')))
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_orders`
--

LOCK TABLES `sales_orders` WRITE;
/*!40000 ALTER TABLE `sales_orders` DISABLE KEYS */;
INSERT INTO `sales_orders` VALUES (44,'SO--000022','Vendor',98,'Retailer','2026-07-16','2026-07-16 12:00:00','Kazi camp','6260777506','ASDF1234POIU','','',100,'transport fee',17475.00,1660.13,18361.38,'Issued','2026-07-16 07:37:51','2026-07-16 07:37:51','kg'),(45,'SO--000036','Vendor',98,'Retailer','2026-07-16','2026-07-16 12:00:00','C-/335 mukherji nagar vidisha','8319540266','LKJH0987POIU89','','',100,'transport charges',17475.00,1660.13,18361.38,'Issued','2026-07-16 07:48:24','2026-07-16 07:48:24','kg');
/*!40000 ALTER TABLE `sales_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sequences`
--

DROP TABLE IF EXISTS `sequences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sequences` (
  `name` varchar(100) NOT NULL,
  `value` bigint NOT NULL,
  `prefix` varchar(20) NOT NULL DEFAULT 'PO-',
  `pad` int NOT NULL DEFAULT '6',
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sequences`
--

LOCK TABLES `sequences` WRITE;
/*!40000 ALTER TABLE `sequences` DISABLE KEYS */;
INSERT INTO `sequences` VALUES ('so',44,'PO-',6);
/*!40000 ALTER TABLE `sequences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tpl_purchase_items`
--

DROP TABLE IF EXISTS `tpl_purchase_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tpl_purchase_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `purchase_id` int NOT NULL,
  `product_id` int NOT NULL,
  `po_item_id` int DEFAULT NULL,
  `rate` decimal(10,2) NOT NULL,
  `total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `size` decimal(10,2) NOT NULL,
  `unit` varchar(50) NOT NULL DEFAULT 'kg',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tpl_pi_purchase` (`purchase_id`),
  KEY `idx_tpl_pi_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tpl_purchase_items`
--

LOCK TABLES `tpl_purchase_items` WRITE;
/*!40000 ALTER TABLE `tpl_purchase_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `tpl_purchase_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tpl_purchases`
--

DROP TABLE IF EXISTS `tpl_purchases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tpl_purchases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int DEFAULT NULL,
  `farmer_id` int DEFAULT NULL,
  `gst_no` varchar(50) DEFAULT NULL,
  `bill_no` varchar(50) NOT NULL,
  `bill_date` date NOT NULL,
  `party_type` enum('vendor','farmer') NOT NULL DEFAULT 'vendor',
  `linked_po_id` int DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT '0.00',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `bill_img` varchar(255) DEFAULT NULL,
  `unit` varchar(45) DEFAULT 'kg',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tpl_purchase_bill` (`bill_no`),
  KEY `idx_tpl_purchase_date` (`bill_date`),
  KEY `idx_tpl_purchase_vendor` (`vendor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tpl_purchases`
--

LOCK TABLES `tpl_purchases` WRITE;
/*!40000 ALTER TABLE `tpl_purchases` DISABLE KEYS */;
/*!40000 ALTER TABLE `tpl_purchases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tpl_sale_items`
--

DROP TABLE IF EXISTS `tpl_sale_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tpl_sale_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `product_id` int NOT NULL,
  `rate` decimal(10,2) NOT NULL,
  `total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `qty` decimal(10,2) NOT NULL,
  `discount_rate` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `taxable_amount` decimal(10,2) DEFAULT '0.00',
  `gst_percent` decimal(5,2) DEFAULT '0.00',
  `gst_amount` decimal(10,2) DEFAULT '0.00',
  `net_total` decimal(10,2) DEFAULT '0.00',
  `unit` varchar(50) DEFAULT 'kg',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tpl_si_sale` (`sale_id`),
  KEY `idx_tpl_si_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tpl_sale_items`
--

LOCK TABLES `tpl_sale_items` WRITE;
/*!40000 ALTER TABLE `tpl_sale_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `tpl_sale_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tpl_sale_payments`
--

DROP TABLE IF EXISTS `tpl_sale_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tpl_sale_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `party_type` enum('customer','vendor','farmer') DEFAULT NULL,
  `customer_id` int DEFAULT NULL,
  `vendor_id` int DEFAULT NULL,
  `farmer_id` int DEFAULT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` enum('None','Cash','Card','Online','Credit Card','UPI') DEFAULT 'None',
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `unit` varchar(45) NOT NULL DEFAULT 'kg',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tpl_payments_sale` (`sale_id`),
  KEY `idx_tpl_payments_party` (`customer_id`,`payment_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tpl_sale_payments`
--

LOCK TABLES `tpl_sale_payments` WRITE;
/*!40000 ALTER TABLE `tpl_sale_payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `tpl_sale_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tpl_sales`
--

DROP TABLE IF EXISTS `tpl_sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tpl_sales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL,
  `vendor_id` int DEFAULT NULL,
  `farmer_id` int DEFAULT NULL,
  `bill_no` varchar(50) NOT NULL,
  `bill_date` date NOT NULL,
  `party_type` enum('customer','vendor','farmer') NOT NULL DEFAULT 'customer',
  `total_taxable` decimal(10,2) DEFAULT '0.00',
  `total_gst` decimal(10,2) DEFAULT '0.00',
  `payment_status` enum('Paid','Unpaid','Partial') DEFAULT 'Unpaid',
  `payment_method` enum('Cash','Card','Online','Credit Card','UPI','None') DEFAULT 'None',
  `remarks` text,
  `total_amount` decimal(10,2) DEFAULT '0.00',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `other_amount` decimal(10,2) DEFAULT '0.00',
  `other_note` varchar(255) DEFAULT NULL,
  `unit` varchar(45) NOT NULL DEFAULT 'kg',
  `buyer_type` enum('retailer','wholesaler') DEFAULT 'retailer',
  `company_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tpl_sales_bill` (`bill_no`),
  KEY `idx_tpl_sales_date` (`bill_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tpl_sales`
--

LOCK TABLES `tpl_sales` WRITE;
/*!40000 ALTER TABLE `tpl_sales` DISABLE KEYS */;
/*!40000 ALTER TABLE `tpl_sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (2,'admin','$2b$10$dRjV3ib1t/owzlNFrU6RJu10bUGl1kE8kJ3Kmp4hnNsC96.x4TxpK','admin','2025-10-29 08:11:34');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendor_bank_details`
--

DROP TABLE IF EXISTS `vendor_bank_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_bank_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int DEFAULT NULL,
  `pan_number` varchar(20) DEFAULT NULL,
  `account_holder_name` varchar(255) DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `account_number` varchar(30) DEFAULT NULL,
  `ifsc_code` varchar(20) DEFAULT NULL,
  `branch_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`id`),
  KEY `vendor_id` (`vendor_id`),
  CONSTRAINT `vendor_bank_details_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_bank_details`
--

LOCK TABLES `vendor_bank_details` WRITE;
/*!40000 ALTER TABLE `vendor_bank_details` DISABLE KEYS */;
INSERT INTO `vendor_bank_details` VALUES (65,98,'AAACH2702H','Ankit raghuwanshi','SBI','9223866666','SBINO123456','AWADPURI','2026-07-16 06:13:07','2026-07-16 06:13:07','Active');
/*!40000 ALTER TABLE `vendor_bank_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendors`
--

DROP TABLE IF EXISTS `vendors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vendor_name` varchar(100) DEFAULT NULL,
  `firm_name` varchar(255) NOT NULL,
  `gst_no` varchar(50) DEFAULT NULL,
  `address` text,
  `contact_number` varchar(15) DEFAULT NULL,
  `balance` decimal(12,2) NOT NULL DEFAULT '0.00',
  `min_balance` decimal(12,2) NOT NULL DEFAULT '5000.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` varchar(50) DEFAULT 'active',
  `vendor_bank_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_vendors_balance` (`balance`)
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendors`
--

LOCK TABLES `vendors` WRITE;
/*!40000 ALTER TABLE `vendors` DISABLE KEYS */;
INSERT INTO `vendors` VALUES (98,'Ankit','Sky info group','24AAAGM0289C1ZP','Madhya pradesh bhopal Awadpuri ','1234567890',1000.00,5000.00,'2026-07-16 06:13:07','2026-07-16 06:13:07','active',NULL),(99,'June Vendor','June Vendor Firm',NULL,NULL,'9876543212',0.00,5000.00,'2026-06-03 04:30:00','2026-07-25 09:51:32','active',NULL),(100,'June Vendor','June Vendor Firm',NULL,NULL,'9876543212',0.00,5000.00,'2026-06-03 04:30:00','2026-07-25 09:52:06','active',NULL),(101,'June Vendor','June Vendor Firm',NULL,NULL,'9876543212',0.00,5000.00,'2026-06-03 04:30:00','2026-07-25 09:53:41','active',NULL),(102,'June Vendor','June Vendor Firm',NULL,NULL,'9876543212',0.00,5000.00,'2026-06-03 04:30:00','2026-07-25 09:54:07','active',NULL);
/*!40000 ALTER TABLE `vendors` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-25 15:31:43
