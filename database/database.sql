-- ==========================================================
-- Stationery Store Management System - Database Schema
-- Target: MySQL 5.7+ / MySQL 8.0+ / MariaDB
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `stationery_store` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `stationery_store`;

-- Disable foreign key checks for clean re-creation
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `purchase_items`;
DROP TABLE IF EXISTS `purchases`;
DROP TABLE IF EXISTS `sale_items`;
DROP TABLE IF EXISTS `sales`;
DROP TABLE IF EXISTS `suppliers`;
DROP TABLE IF EXISTS `customers`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;

-- 1. Users Table (Admin & Staff)
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Categories Table
CREATE TABLE `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Products Table
CREATE TABLE `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `category_id` INT NOT NULL,
  `brand` VARCHAR(100) DEFAULT '',
  `description` TEXT NULL,
  `sku` VARCHAR(50) NOT NULL UNIQUE,
  `purchase_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `selling_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `quantity` INT NOT NULL DEFAULT 0,
  `minimum_stock` INT NOT NULL DEFAULT 5,
  `unit` VARCHAR(20) NOT NULL DEFAULT 'Pieces',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) 
    REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Customers Table
CREATE TABLE `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(30) DEFAULT '',
  `email` VARCHAR(150) DEFAULT '',
  `address` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Suppliers Table
CREATE TABLE `suppliers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `contact_person` VARCHAR(100) DEFAULT '',
  `phone` VARCHAR(30) DEFAULT '',
  `email` VARCHAR(150) DEFAULT '',
  `address` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Sales Table
CREATE TABLE `sales` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_number` VARCHAR(50) NOT NULL UNIQUE,
  `customer_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `subtotal` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `tax` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `payment_method` ENUM('Cash', 'UPI', 'Card') NOT NULL DEFAULT 'Cash',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_sale_customer` FOREIGN KEY (`customer_id`) 
    REFERENCES `customers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_sale_user` FOREIGN KEY (`user_id`) 
    REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Sale Items Table
CREATE TABLE `sale_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sale_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `subtotal` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  CONSTRAINT `fk_sale_item_sale` FOREIGN KEY (`sale_id`) 
    REFERENCES `sales` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sale_item_product` FOREIGN KEY (`product_id`) 
    REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Purchases Table
CREATE TABLE `purchases` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `supplier_id` INT NOT NULL,
  `total_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `purchase_date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_purchase_supplier` FOREIGN KEY (`supplier_id`) 
    REFERENCES `suppliers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Purchase Items Table
CREATE TABLE `purchase_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `purchase_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `purchase_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `subtotal` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  CONSTRAINT `fk_purchase_item_purchase` FOREIGN KEY (`purchase_id`) 
    REFERENCES `purchases` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_purchase_item_product` FOREIGN KEY (`product_id`) 
    REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
