-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: bus_reservation_system
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Temporary table structure for view `active_routes_view`
--

DROP TABLE IF EXISTS `active_routes_view`;
/*!50001 DROP VIEW IF EXISTS `active_routes_view`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `active_routes_view` AS SELECT
 1 AS `route_id`,
  1 AS `source_city`,
  1 AS `destination_city`,
  1 AS `departure_time`,
  1 AS `arrival_time`,
  1 AS `base_fare`,
  1 AS `status`,
  1 AS `bus_id`,
  1 AS `bus_type`,
  1 AS `registration_number`,
  1 AS `total_capacity`,
  1 AS `booked_seats`,
  1 AS `available_seats` */;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `booking`
--

DROP TABLE IF EXISTS `booking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `booking` (
  `booking_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `route_id` int(10) unsigned NOT NULL,
  `seat_id` int(10) unsigned NOT NULL,
  `passenger_gender` enum('Male','Female') NOT NULL,
  `booking_date` datetime NOT NULL DEFAULT current_timestamp(),
  `booking_status` enum('confirmed','cancelled','pending') NOT NULL DEFAULT 'confirmed',
  `cancellation_date` datetime DEFAULT NULL,
  PRIMARY KEY (`booking_id`),
  UNIQUE KEY `uq_seat_route_confirmed` (`seat_id`,`route_id`,`booking_status`),
  KEY `idx_booking_user` (`user_id`),
  KEY `idx_booking_route` (`route_id`),
  KEY `idx_booking_status` (`booking_status`),
  CONSTRAINT `fk_booking_route` FOREIGN KEY (`route_id`) REFERENCES `route` (`route_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_booking_seat` FOREIGN KEY (`seat_id`) REFERENCES `seat` (`seat_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_booking_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booking`
--

LOCK TABLES `booking` WRITE;
/*!40000 ALTER TABLE `booking` DISABLE KEYS */;
INSERT INTO `booking` VALUES (16,34,19,337,'Male','2026-04-30 19:54:25','confirmed',NULL),(17,34,19,340,'Female','2026-04-30 20:28:02','confirmed',NULL),(18,34,19,339,'Male','2026-04-30 20:28:02','cancelled','2026-04-30 20:34:49'),(19,27,19,338,'Male','2026-04-30 21:19:55','confirmed',NULL);
/*!40000 ALTER TABLE `booking` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary table structure for view `booking_summary_view`
--

DROP TABLE IF EXISTS `booking_summary_view`;
/*!50001 DROP VIEW IF EXISTS `booking_summary_view`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `booking_summary_view` AS SELECT
 1 AS `booking_id`,
  1 AS `booking_date`,
  1 AS `booking_status`,
  1 AS `passenger_gender`,
  1 AS `cancellation_date`,
  1 AS `user_id`,
  1 AS `passenger_name`,
  1 AS `passenger_email`,
  1 AS `passenger_phone`,
  1 AS `route_id`,
  1 AS `source_city`,
  1 AS `destination_city`,
  1 AS `departure_time`,
  1 AS `arrival_time`,
  1 AS `base_fare`,
  1 AS `seat_number`,
  1 AS `registration_number`,
  1 AS `bus_type`,
  1 AS `payment_id`,
  1 AS `total_amount`,
  1 AS `payment_method`,
  1 AS `transaction_status`,
  1 AS `payment_date` */;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `bus`
--

DROP TABLE IF EXISTS `bus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bus` (
  `bus_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `registration_number` varchar(20) NOT NULL,
  `bus_type` enum('AC','Non-AC','Sleeper','Mini') NOT NULL DEFAULT 'AC',
  `total_capacity` tinyint(3) unsigned NOT NULL DEFAULT 40,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`bus_id`),
  UNIQUE KEY `uq_bus_reg` (`registration_number`),
  CONSTRAINT `chk_capacity` CHECK (`total_capacity` between 10 and 60)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bus`
--

LOCK TABLES `bus` WRITE;
/*!40000 ALTER TABLE `bus` DISABLE KEYS */;
INSERT INTO `bus` VALUES (12,'LHR-TOM-01','AC',46,'2026-04-28 13:20:58'),(13,'KHI-TOM-02','Sleeper',30,'2026-04-28 13:20:58');
/*!40000 ALTER TABLE `bus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `login_attempts`
--

DROP TABLE IF EXISTS `login_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `login_attempts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(45) NOT NULL,
  `email` varchar(191) NOT NULL,
  `success` tinyint(1) NOT NULL DEFAULT 0,
  `attempted_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_ip_time` (`ip_address`,`attempted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `login_attempts`
--

LOCK TABLES `login_attempts` WRITE;
/*!40000 ALTER TABLE `login_attempts` DISABLE KEYS */;
INSERT INTO `login_attempts` VALUES (1,'127.0.0.1','testadmin_1775930314@example.com',1,'2026-04-11 22:58:34'),(2,'127.0.0.1','testuser_1775930314@example.com',0,'2026-04-11 22:58:34'),(3,'127.0.0.1','testadmin_1775930353@example.com',1,'2026-04-11 22:59:13'),(4,'127.0.0.1','testuser_1775930353@example.com',1,'2026-04-11 22:59:13'),(5,'127.0.0.1','testadmin_1775930382@example.com',1,'2026-04-11 22:59:42'),(6,'127.0.0.1','testuser_1775930382@example.com',1,'2026-04-11 22:59:43'),(7,'127.0.0.1','testadmin_1775930409@example.com',1,'2026-04-11 23:00:09'),(8,'127.0.0.1','testuser_1775930409@example.com',1,'2026-04-11 23:00:09'),(9,'127.0.0.1','testadmin_1775930441@example.com',1,'2026-04-11 23:00:41'),(10,'127.0.0.1','testuser_1775930441@example.com',1,'2026-04-11 23:00:42'),(11,'127.0.0.1','testadmin_1775931105@example.com',1,'2026-04-11 23:11:45'),(12,'127.0.0.1','testuser_1775931105@example.com',1,'2026-04-11 23:11:46'),(13,'127.0.0.1','zeyam@example.com',1,'2026-04-12 03:22:03'),(14,'127.0.0.1','p243111@pwr.nu.edu.pk',0,'2026-04-12 03:22:31'),(15,'127.0.0.1','zeyam@example.com',0,'2026-04-12 03:22:51'),(16,'127.0.0.1','zeyam@example.com',1,'2026-04-12 03:23:02'),(17,'127.0.0.1','zeyam@example.com',1,'2026-04-12 14:26:03'),(18,'127.0.0.1','zeyamhussain24@gmail.com',1,'2026-04-13 20:03:54'),(19,'127.0.0.1','zeyamhussain24@gmail.com',0,'2026-04-13 20:04:19'),(20,'127.0.0.1','p240509@pwr.nu.edu.pk',1,'2026-04-13 20:10:32'),(21,'127.0.0.1','p243111@pwr.nu.edu.pk',1,'2026-04-14 01:54:30'),(22,'127.0.0.1','p243111@pwr.nu.edu.pk',1,'2026-04-14 01:55:56'),(23,'127.0.0.1','p243073@pwr.nu.edu.pk',1,'2026-04-14 13:12:04'),(24,'127.0.0.1','p243111@pwr.nu.edu.pk',0,'2026-04-15 23:08:18'),(25,'127.0.0.1','p243111@pwr.nu.edu.pk',0,'2026-04-15 23:08:28'),(26,'127.0.0.1','zeyamhussain24@gmail.com',1,'2026-04-15 23:08:43'),(27,'127.0.0.1','zeyamhussain24@gmail.com',1,'2026-04-15 23:10:11'),(28,'127.0.0.1','zeyamhussain24@gmail.com',1,'2026-04-16 00:07:56'),(29,'127.0.0.1','zeyamhussain24@gmail.com',1,'2026-04-16 00:54:45'),(30,'127.0.0.1','zeyamhussain24@gmail.com',1,'2026-04-17 17:52:10'),(31,'127.0.0.1','zeyamhussain24@gmail.com',1,'2026-04-18 15:41:14'),(32,'127.0.0.1','zeyamhussain24@gmail.com',1,'2026-04-18 17:56:11'),(33,'127.0.0.1','zeyamhussain24@gmail.com',1,'2026-04-19 23:16:02'),(34,'127.0.0.1','zeyamhussain24@gmail.com',1,'2026-04-20 23:56:18'),(35,'127.0.0.1','zeyamhussain24@gmail.com',1,'2026-04-28 13:07:02'),(36,'127.0.0.1','zeyamhussain24@gmail.com',1,'2026-04-28 13:22:44'),(37,'127.0.0.1','zeyamhussain24@gmail.com',1,'2026-04-28 13:39:01'),(38,'127.0.0.1','zeyamhussain24@gmail.com',1,'2026-04-28 13:54:27'),(39,'127.0.0.1','zeyamhussain24@gmail.com',1,'2026-04-28 14:05:35'),(40,'127.0.0.1','zeyamhussain24@gmail.com',1,'2026-04-28 14:22:13'),(41,'127.0.0.1','zeyamhussain24@gmail.com',1,'2026-04-28 14:24:26'),(42,'127.0.0.1','zeyamhussain24@gmail.com',1,'2026-04-28 14:39:53'),(43,'127.0.0.1','p243096@pwr.nu.edu.pk',1,'2026-04-28 14:45:42'),(44,'127.0.0.1','zeyamhussain24@gmail.com',1,'2026-04-29 11:28:08'),(45,'127.0.0.1','zeyamhussain610@gmail.com',1,'2026-04-30 11:00:36'),(46,'127.0.0.1','zeyamhussain610@gmail.com',1,'2026-04-30 19:28:34'),(47,'127.0.0.1','zeyamhussain610@gmail.com',1,'2026-04-30 19:30:03'),(48,'127.0.0.1','zeyamhussain610@gmail.com',1,'2026-04-30 21:15:08'),(49,'127.0.0.1','zeyamhussain610@gmail.com',1,'2026-04-30 21:17:52'),(50,'127.0.0.1','zeyamhussain24@gmail.com',1,'2026-04-30 21:18:06'),(51,'127.0.0.1','zeyamhussain610@gmail.com',1,'2026-04-30 21:20:31');
/*!40000 ALTER TABLE `login_attempts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment`
--

DROP TABLE IF EXISTS `payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment` (
  `payment_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `booking_id` int(10) unsigned NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `payment_method` enum('cash','card','easypaisa','jazzcash','bank') NOT NULL DEFAULT 'cash',
  `transaction_status` enum('completed','pending','refunded','failed') NOT NULL DEFAULT 'pending',
  `payment_date` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `uq_payment_booking` (`booking_id`),
  KEY `idx_payment_status` (`transaction_status`),
  CONSTRAINT `fk_payment_booking` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`booking_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_amount` CHECK (`total_amount` > 0)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment`
--

LOCK TABLES `payment` WRITE;
/*!40000 ALTER TABLE `payment` DISABLE KEYS */;
INSERT INTO `payment` VALUES (12,16,7000.00,'easypaisa','completed','2026-04-30 19:54:25'),(13,17,7000.00,'jazzcash','completed','2026-04-30 20:28:02'),(14,18,7000.00,'jazzcash','refunded','2026-04-30 20:28:07'),(15,19,7000.00,'easypaisa','completed','2026-04-30 21:19:55');
/*!40000 ALTER TABLE `payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `refresh_tokens` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `token` varchar(128) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_token` (`token`),
  KEY `idx_rt_user` (`user_id`),
  CONSTRAINT `fk_rt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES (1,10,'86d57aa12f87e5fc2ff00a0a8f0da734f26a9d5ec567213e612dfb82e6d93998348c587d7ba3d2fd3746c5759bf1c6273881737e7654bd75c5349cdce90e444f','2026-04-18 22:58:34','2026-04-11 22:58:34'),(2,11,'8daf98930cdff0a0a5fbebbaef0d5fcc723605cf56bd801a61d3c53236470d2edcde55d4355f45f4c61b0b45025713fb62229fd1b28db69910f5da123f603b09','2026-04-18 22:59:13','2026-04-11 22:59:13'),(3,12,'d1e141426ac6254243b94e5b30064beaa3e65d2d19868d9d317215f3af8c51cab549f2c98d71e75461dd302854fc497a0e6a9697b34ac6a12e679dd496d754d4','2026-04-18 22:59:13','2026-04-11 22:59:13'),(4,13,'085cb0284b4891bb7e006154b5cf9b9f5f395255109717a6e5f62e9876538dc754e63577a1df9b780e14fbe512e20f6fa7e9ccc73ecaf9ac628470d5dfa77be1','2026-04-18 22:59:42','2026-04-11 22:59:42'),(5,14,'04213eb3a6078d595acbb9fdb10a5b72bd7dd2b9114e1d9db4e9ce41ed631acd66ab32ae9bc9f3793d740999378926122e55249ee609488c3e6855aaabde1d43','2026-04-18 22:59:43','2026-04-11 22:59:43'),(6,15,'4595d33b621b041e36dce1c72fcc796b601daec89cabd91ffb4144df359ce47531a4a340e36381a918c13b13de2f98aaf8bbf2fa72bb20005edd33aa7acc5587','2026-04-18 23:00:09','2026-04-11 23:00:09'),(7,16,'7b45385fd626abe0e0a77ad8f23027b6d89183d07759c4b8f24dd229919f0d4264d4c140dcdbf4f6036d2b8c6ec63834a83e0a7b81c6def2607d2f7a44f5b3db','2026-04-18 23:00:09','2026-04-11 23:00:09'),(8,17,'5db7c23ace1b49e7c11c461a42646cacd8bc46a3cf99532ec699a50aa127920bd9bcbdde0b6467978be5393101db072b422cd7d3c88102f512c420e8cf098567','2026-04-18 23:00:41','2026-04-11 23:00:41'),(9,18,'e4715deb8bc778143c94556ba6f6c8b3198282e8a02e9a84d28a8e616652c0021bdb1762c1a5b55f7d64a3f9920360b5f655dbca9adfde0c8937f327ce4f1a95','2026-04-18 23:00:42','2026-04-11 23:00:42'),(10,19,'42de20bdc5dcd9137bf6733473a71e4c8f48f3fe91f14b01579eea321cc844452e30da844cad9ca8ec71686e2cb562952e1f70e65ed7f61dcf6b7ffa99f1b49e','2026-04-18 23:11:45','2026-04-11 23:11:45'),(11,20,'9bee0f03a29f2f84ea2c4c34a620e47f3a86530e986bdd923ba4cb8d0a7940515d91a23621fce5b8e8983f69c0433b2dc3d1b1a442941e347a643e693fa8c007','2026-04-18 23:11:46','2026-04-11 23:11:46'),(14,21,'a389afe332897167e4dcef3dee0ccb7ceea6985bb2d32b8e7242d47799bb80909339896dbb44fc299035d4648d466ae44d6b344baa0294cffb13b49c56c37a0b','2026-04-19 14:26:03','2026-04-12 14:26:03'),(16,28,'f52886432d623ca78b349569e312dd449c4a28a6462e960e8f1ba68849f404d81edd247107a410347d9c6525069998dca3b11931aefc36ff833115aa8547ea70','2026-04-20 20:10:32','2026-04-13 20:10:32'),(18,29,'1967054799ae59eaaffc1caf41a5b92d1080288094debf27ffe85235538a5167fa88ca86e96190410f1714961f4e4b7ed67f42dc1f303316567f575bfcb826ca','2026-04-21 01:55:56','2026-04-14 01:55:56'),(19,30,'f443f4b1c14886b5b9a2cc684cb49138c5aed4eef6b703f57749a9a1c6cbee7463f5de75b9dad33991933fa9740dac2aab00b9f36b71cab59d86526565144bf6','2026-04-21 13:12:04','2026-04-14 13:12:04'),(37,31,'212fcf5d78d78b8c92eecd8732d5ffa2af2927142ceb7c6de873878ffdeeb5213fd16826c8dd07d47dd3b388348f83269c63b3fab6dfa6bef3ef8b59f37f742b','2026-05-05 14:45:42','2026-04-28 14:45:42'),(44,27,'d957dc34abd7ed06d354950175767caa83d066596fe6e9f11f8ec91b9188570a32caf653dfb6dfc4367cacfc925af75bf256a2462ae3272c912ac1b446ed96ff','2026-05-07 21:18:06','2026-04-30 21:18:06'),(45,34,'d3390a7b4fcda790984ea6e258df377369d87fd8d9de3c37fb659bc951939ecc53dd630ceef14ed3a4588771c660c68f2467cda4875840ccd6c4f3c31d95ba23','2026-05-07 21:20:31','2026-04-30 21:20:31');
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary table structure for view `revenue_by_route_view`
--

DROP TABLE IF EXISTS `revenue_by_route_view`;
/*!50001 DROP VIEW IF EXISTS `revenue_by_route_view`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `revenue_by_route_view` AS SELECT
 1 AS `route_id`,
  1 AS `source_city`,
  1 AS `destination_city`,
  1 AS `total_bookings`,
  1 AS `total_revenue`,
  1 AS `avg_fare`,
  1 AS `first_booking`,
  1 AS `last_booking` */;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `route`
--

DROP TABLE IF EXISTS `route`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `route` (
  `route_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `bus_id` int(10) unsigned NOT NULL,
  `source_city` varchar(100) NOT NULL,
  `destination_city` varchar(100) NOT NULL,
  `departure_time` datetime NOT NULL,
  `arrival_time` datetime NOT NULL,
  `base_fare` decimal(10,2) NOT NULL,
  `status` enum('active','cancelled','completed') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`route_id`),
  KEY `fk_route_bus` (`bus_id`),
  KEY `idx_route_cities` (`source_city`,`destination_city`),
  KEY `idx_route_departure` (`departure_time`),
  CONSTRAINT `fk_route_bus` FOREIGN KEY (`bus_id`) REFERENCES `bus` (`bus_id`) ON UPDATE CASCADE,
  CONSTRAINT `chk_route_times` CHECK (`arrival_time` > `departure_time`),
  CONSTRAINT `chk_fare` CHECK (`base_fare` > 0)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `route`
--

LOCK TABLES `route` WRITE;
/*!40000 ALTER TABLE `route` DISABLE KEYS */;
INSERT INTO `route` VALUES (19,13,'Karachi','Peshawar','2026-05-02 08:00:00','2026-05-03 06:00:00',7000.00,'active','2026-04-30 19:51:30');
/*!40000 ALTER TABLE `route` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seat`
--

DROP TABLE IF EXISTS `seat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `seat` (
  `seat_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `bus_id` int(10) unsigned NOT NULL,
  `seat_number` varchar(5) NOT NULL,
  PRIMARY KEY (`seat_id`),
  UNIQUE KEY `uq_seat_per_bus` (`bus_id`,`seat_number`),
  KEY `idx_seat_bus` (`bus_id`),
  CONSTRAINT `fk_seat_bus` FOREIGN KEY (`bus_id`) REFERENCES `bus` (`bus_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=367 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seat`
--

LOCK TABLES `seat` WRITE;
/*!40000 ALTER TABLE `seat` DISABLE KEYS */;
INSERT INTO `seat` VALUES (333,12,'10A'),(334,12,'10B'),(335,12,'10C'),(336,12,'10D'),(297,12,'1A'),(298,12,'1B'),(299,12,'1C'),(300,12,'1D'),(301,12,'2A'),(302,12,'2B'),(303,12,'2C'),(304,12,'2D'),(305,12,'3A'),(306,12,'3B'),(307,12,'3C'),(308,12,'3D'),(309,12,'4A'),(310,12,'4B'),(311,12,'4C'),(312,12,'4D'),(313,12,'5A'),(314,12,'5B'),(315,12,'5C'),(316,12,'5D'),(317,12,'6A'),(318,12,'6B'),(319,12,'6C'),(320,12,'6D'),(321,12,'7A'),(322,12,'7B'),(323,12,'7C'),(324,12,'7D'),(325,12,'8A'),(326,12,'8B'),(327,12,'8C'),(328,12,'8D'),(329,12,'9A'),(330,12,'9B'),(331,12,'9C'),(332,12,'9D'),(364,13,'10A'),(365,13,'10B'),(366,13,'10C'),(337,13,'1A'),(338,13,'1B'),(339,13,'1C'),(340,13,'2A'),(341,13,'2B'),(342,13,'2C'),(343,13,'3A'),(344,13,'3B'),(345,13,'3C'),(346,13,'4A'),(347,13,'4B'),(348,13,'4C'),(349,13,'5A'),(350,13,'5B'),(351,13,'5C'),(352,13,'6A'),(353,13,'6B'),(354,13,'6C'),(355,13,'7A'),(356,13,'7B'),(357,13,'7C'),(358,13,'8A'),(359,13,'8B'),(360,13,'8C'),(361,13,'9A'),(362,13,'9B'),(363,13,'9C');
/*!40000 ALTER TABLE `seat` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seat_locks`
--

DROP TABLE IF EXISTS `seat_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `seat_locks` (
  `lock_id` int(11) NOT NULL AUTO_INCREMENT,
  `route_id` int(11) NOT NULL,
  `seat_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `gender` enum('Male','Female') NOT NULL,
  `locked_until` datetime NOT NULL,
  PRIMARY KEY (`lock_id`),
  UNIQUE KEY `route_id` (`route_id`,`seat_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seat_locks`
--

LOCK TABLES `seat_locks` WRITE;
/*!40000 ALTER TABLE `seat_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `seat_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `token_blacklist`
--

DROP TABLE IF EXISTS `token_blacklist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `token_blacklist` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `jti` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_jti` (`jti`),
  KEY `idx_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `token_blacklist`
--

LOCK TABLES `token_blacklist` WRITE;
/*!40000 ALTER TABLE `token_blacklist` DISABLE KEYS */;
/*!40000 ALTER TABLE `token_blacklist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `user_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(191) NOT NULL,
  `phone` varchar(20) NOT NULL DEFAULT '',
  `password_hash` varchar(255) NOT NULL,
  `role` enum('passenger','admin') NOT NULL DEFAULT 'passenger',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `otp_code` varchar(6) DEFAULT NULL,
  `otp_expiry` datetime DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `otp_requests` int(11) DEFAULT 0,
  `otp_last_request` date DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Super Admin','admin@busreserve.pk','03001234567','$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.usc0Xl6.y','admin','2026-04-03 17:28:53','2026-04-03 17:28:53',NULL,NULL,0,0,NULL),(2,'Ali Hassan','ali@email.com','03009999999','$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.usc0Xl6.y','passenger','2026-04-03 17:28:53','2026-04-03 17:28:53',NULL,NULL,0,0,NULL),(3,'Sara Khan','sara@email.com','03221234567','$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.usc0Xl6.y','passenger','2026-04-03 17:28:53','2026-04-03 17:28:53',NULL,NULL,0,0,NULL),(4,'Usman Ahmed','usman@email.com','03331234567','$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.usc0Xl6.y','passenger','2026-04-03 17:28:53','2026-04-03 17:28:53',NULL,NULL,0,0,NULL),(5,'Fatima Noor','fatima@email.com','03441234567','$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.usc0Xl6.y','passenger','2026-04-03 17:28:53','2026-04-03 17:28:53',NULL,NULL,0,0,NULL),(6,'Bilal Tariq','bilal@email.com','03551234567','$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.usc0Xl6.y','passenger','2026-04-03 17:28:53','2026-04-03 17:28:53',NULL,NULL,0,0,NULL),(7,'Hina Malik','hina@email.com','03661234567','$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.usc0Xl6.y','passenger','2026-04-03 17:28:53','2026-04-03 17:28:53',NULL,NULL,0,0,NULL),(8,'Zain Raza','zain@email.com','03771234567','$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.usc0Xl6.y','passenger','2026-04-03 17:28:53','2026-04-03 17:28:53',NULL,NULL,0,0,NULL),(9,'Maham Javed','maham@email.com','03881234567','$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.usc0Xl6.y','passenger','2026-04-03 17:28:53','2026-04-03 17:28:53',NULL,NULL,0,0,NULL),(10,'Admin Test','testadmin_1775930314@example.com','','$2y$10$v.naPMil4/JaQSySUzQLXejVp.53ga3Gzy0ph0qWPYZSRGenjvLZW','admin','2026-04-11 22:58:34','2026-04-11 22:58:34',NULL,NULL,0,0,NULL),(11,'Admin Test','testadmin_1775930353@example.com','','$2y$10$SBBQjl21hdRLLF.J6tcNDOdmUkMnJDt6IuHarMdDxMDhP9M0h02eO','admin','2026-04-11 22:59:13','2026-04-11 22:59:13',NULL,NULL,0,0,NULL),(12,'User Test','testuser_1775930353@example.com','0987654321','$2y$12$FGAV4SuHHRTq49Ab/IP76.U1u41DTSqGNqpMuNpTaHVIYQjScl1na','passenger','2026-04-11 22:59:13','2026-04-11 22:59:13',NULL,NULL,0,0,NULL),(13,'Admin Test','testadmin_1775930382@example.com','','$2y$10$YfhlzphcwiE3tLdLZrZ27.93BtarNh1sSWKado.gK5lrDGvVQerVq','admin','2026-04-11 22:59:42','2026-04-11 22:59:42',NULL,NULL,0,0,NULL),(14,'User Test','testuser_1775930382@example.com','0987654321','$2y$12$T/qrZYdMBGEvnYiKhpi1H.T/JQiUSU7P/tlkRcyZfaWheNTYyMJWe','passenger','2026-04-11 22:59:43','2026-04-11 22:59:43',NULL,NULL,0,0,NULL),(15,'Admin Test','testadmin_1775930409@example.com','','$2y$10$L3JZNoFOaj5jrpuGa0Vy.OpjHt9iWK1yBwvgGi0yBpk5gG0v4CSvm','admin','2026-04-11 23:00:09','2026-04-11 23:00:09',NULL,NULL,0,0,NULL),(16,'User Test','testuser_1775930409@example.com','0987654321','$2y$12$pTiWkr6O/K7iFB.Nl/2bJ.ZjaIXWtvhsRCg6rGMHocQ5U5Vh8aCfG','passenger','2026-04-11 23:00:09','2026-04-11 23:00:09',NULL,NULL,0,0,NULL),(17,'Admin Test','testadmin_1775930441@example.com','','$2y$10$rdgpM/1vXDaqn4jdol3hQOszW.vf4X8LuPwbMScgBZ0rDyJQLnLNu','admin','2026-04-11 23:00:41','2026-04-11 23:00:41',NULL,NULL,0,0,NULL),(18,'User Test','testuser_1775930441@example.com','0987654321','$2y$12$SC4eCAMB81.WQRVz1aWZCejRyxGotFygpt4tBcxhlybVOVFSfenOu','passenger','2026-04-11 23:00:42','2026-04-11 23:00:42',NULL,NULL,0,0,NULL),(19,'Admin Test','testadmin_1775931105@example.com','','$2y$10$75SuAt/8F70by/4u3z/yl.ZMmufN/w814.U6yXUsa4LpZUpOm/Q4.','admin','2026-04-11 23:11:45','2026-04-11 23:11:45',NULL,NULL,0,0,NULL),(20,'User Test','testuser_1775931105@example.com','0987654321','$2y$12$Bw7c6/M8ML8HhFDKaq7nK.6ycm/Q7MVQ/Hu9NF.EarRPpWihTTvkO','passenger','2026-04-11 23:11:45','2026-04-11 23:11:45',NULL,NULL,0,0,NULL),(21,'Zeyam Test','zeyam@example.com','03001234567','$2y$12$VHgco4mvEhaAegIIdcFkxOE6kBCi90vqcHBqzgX0.EsLTmAi50tVW','passenger','2026-04-12 03:20:58','2026-04-12 03:20:58',NULL,NULL,0,0,NULL),(25,'Zeyam Hussain','p243000@pwr.nu.edu.pk','03001234567','$2y$12$YnrHvL29UXLUc043HQNwh.O1rtqTWjbT6HaBapBJsnM0sls5T3h7O','passenger','2026-04-13 18:27:57','2026-04-13 18:27:57','589073','2026-04-13 18:37:57',0,0,NULL),(26,'Test User','test@example.com','1234567890','$2y$12$m2EkdbPzOfgYZibGivgXzuBvHq5H1XgdvxFhQY1Mjy404t0UEJXYK','passenger','2026-04-13 18:49:13','2026-04-13 18:49:32','736004','2026-04-13 18:59:32',0,3,'2026-04-13'),(27,'Zeyam Hussain ','zeyamhussain24@gmail.com','03441808298','$2y$12$mY695lcon/.bVxd/lcnXMudQ2ZPhcEGWoUE2FzZrYL1k2w7X5AGQu','passenger','2026-04-13 20:02:31','2026-04-30 21:18:59',NULL,NULL,1,1,'2026-04-13'),(28,'Zeyam Hussain','p240509@pwr.nu.edu.pk','03441808298','$2y$12$XXQfeI25aXx8moxpY4hl5ucDXoChG.fspTIlztWFy/BdojtUJ3Sqi','passenger','2026-04-13 20:09:31','2026-04-13 20:09:59',NULL,NULL,1,1,'2026-04-13'),(29,'Zeyam Hussain','p243111@pwr.nu.edu.pk','03441808298','$2y$12$JpyapwmLTO9onlNRjlilxe9zk/2fkWB2u1rsAbm4H3HZYnpGQD5C6','passenger','2026-04-13 23:14:43','2026-04-14 01:54:05',NULL,NULL,1,1,'2026-04-14'),(30,'Sami ullah','p243073@pwr.nu.edu.pk','03441808298','$2y$12$DC9JhKTM6gJ4JwDWYr5ZE.9hmqkzywJoebQz6zBbCPVwqrCjSVxne','passenger','2026-04-14 13:10:50','2026-04-14 13:11:35',NULL,NULL,1,1,'2026-04-14'),(31,'Mamoon','p243096@pwr.nu.edu.pk','03441808298','$2y$12$oWzgOVnSPA06/3x5ZCTGfuIonIsp9Uh032xAyEi5zKBanXBIxV9iC','passenger','2026-04-28 14:43:04','2026-04-28 14:44:29',NULL,NULL,1,2,'2026-04-28'),(32,'Zeyam Hussain','zeyamhussain@gmail.com','','$2y$10$Bs5j8gHmxuLfE/7spQmVfOTdv1kLW0Bit8/3MNqzMG9sU1sGShcni','admin','2026-04-30 10:40:51','2026-04-30 10:40:51',NULL,NULL,0,0,NULL),(34,'Zeyam Hussain','zeyamhussain610@gmail.com','','$2y$10$WHDPZlQjCYuU/KJUoaxcPuTWx01MBIShC0.y6RFvvQ9JqTZHVRPha','admin','2026-04-30 10:58:21','2026-04-30 10:58:46',NULL,NULL,1,1,'2026-04-30');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Final view structure for view `active_routes_view`
--

/*!50001 DROP VIEW IF EXISTS `active_routes_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `active_routes_view` AS select `r`.`route_id` AS `route_id`,`r`.`source_city` AS `source_city`,`r`.`destination_city` AS `destination_city`,`r`.`departure_time` AS `departure_time`,`r`.`arrival_time` AS `arrival_time`,`r`.`base_fare` AS `base_fare`,`r`.`status` AS `status`,`b`.`bus_id` AS `bus_id`,`b`.`bus_type` AS `bus_type`,`b`.`registration_number` AS `registration_number`,`b`.`total_capacity` AS `total_capacity`,(select count(0) from `booking` `bk` where `bk`.`route_id` = `r`.`route_id` and `bk`.`booking_status` = 'confirmed') AS `booked_seats`,`b`.`total_capacity` - (select count(0) from `booking` `bk` where `bk`.`route_id` = `r`.`route_id` and `bk`.`booking_status` = 'confirmed') AS `available_seats` from (`route` `r` join `bus` `b` on(`r`.`bus_id` = `b`.`bus_id`)) where `r`.`status` = 'active' and `r`.`departure_time` > current_timestamp() */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `booking_summary_view`
--

/*!50001 DROP VIEW IF EXISTS `booking_summary_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `booking_summary_view` AS select `b`.`booking_id` AS `booking_id`,`b`.`booking_date` AS `booking_date`,`b`.`booking_status` AS `booking_status`,`b`.`passenger_gender` AS `passenger_gender`,`b`.`cancellation_date` AS `cancellation_date`,`u`.`user_id` AS `user_id`,`u`.`full_name` AS `passenger_name`,`u`.`email` AS `passenger_email`,`u`.`phone` AS `passenger_phone`,`r`.`route_id` AS `route_id`,`r`.`source_city` AS `source_city`,`r`.`destination_city` AS `destination_city`,`r`.`departure_time` AS `departure_time`,`r`.`arrival_time` AS `arrival_time`,`r`.`base_fare` AS `base_fare`,`s`.`seat_number` AS `seat_number`,`bs`.`registration_number` AS `registration_number`,`bs`.`bus_type` AS `bus_type`,`p`.`payment_id` AS `payment_id`,`p`.`total_amount` AS `total_amount`,`p`.`payment_method` AS `payment_method`,`p`.`transaction_status` AS `transaction_status`,`p`.`payment_date` AS `payment_date` from (((((`booking` `b` join `users` `u` on(`b`.`user_id` = `u`.`user_id`)) join `route` `r` on(`b`.`route_id` = `r`.`route_id`)) join `bus` `bs` on(`r`.`bus_id` = `bs`.`bus_id`)) join `seat` `s` on(`b`.`seat_id` = `s`.`seat_id`)) left join `payment` `p` on(`b`.`booking_id` = `p`.`booking_id`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `revenue_by_route_view`
--

/*!50001 DROP VIEW IF EXISTS `revenue_by_route_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `revenue_by_route_view` AS select `r`.`route_id` AS `route_id`,`r`.`source_city` AS `source_city`,`r`.`destination_city` AS `destination_city`,count(`b`.`booking_id`) AS `total_bookings`,sum(`p`.`total_amount`) AS `total_revenue`,avg(`p`.`total_amount`) AS `avg_fare`,min(`b`.`booking_date`) AS `first_booking`,max(`b`.`booking_date`) AS `last_booking` from ((`route` `r` left join `booking` `b` on(`r`.`route_id` = `b`.`route_id` and `b`.`booking_status` = 'confirmed')) left join `payment` `p` on(`b`.`booking_id` = `p`.`booking_id` and `p`.`transaction_status` = 'completed')) group by `r`.`route_id`,`r`.`source_city`,`r`.`destination_city` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-30 22:29:45
