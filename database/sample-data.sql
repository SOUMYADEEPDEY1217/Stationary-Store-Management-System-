-- ==========================================================
-- Stationery Store Management System - Sample Seed Data
-- ==========================================================

USE `stationery_store`;

-- 1. Insert Users (Pass: admin123 and staff123 hashed with bcrypt)
-- Plain passwords: admin123 -> $2a$10$wWwMv8eYVq5VbM3X4R0UeO7Q9hP.p.k3q0K7M1K7n8hVp/F.k5hUa (or app auto-handles)
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`) VALUES
(1, 'Store Administrator', 'admin@stationery.com', '$2a$10$c1xW90d402tC7q287cT28eZ9o1XmB0vT7kQ1z7a3kQeW5YyU7dY8e', 'admin'),
(2, 'Rahul Sharma (Staff)', 'staff@stationery.com', '$2a$10$c1xW90d402tC7q287cT28eZ9o1XmB0vT7kQ1z7a3kQeW5YyU7dY8e', 'staff');

-- 2. Insert Categories
INSERT INTO `categories` (`id`, `name`, `description`) VALUES
(1, 'Notebooks & Registers', 'Hardbound, spiral, ruled, unruled notebooks and exercise books'),
(2, 'Pens & Writing', 'Ball pens, gel pens, fountain pens, ink and rollerball pens'),
(3, 'Pencils & Erasers', 'Graphite pencils, mechanical pencils, erasers and sharpeners'),
(4, 'Paper & Printing', 'A4 paper, chart paper, tracing sheets and printer papers'),
(5, 'Office Supplies', 'Staplers, punchers, sticky notes, paper clips and pins'),
(6, 'Art & Drawing', 'Color pencils, sketchbooks, acrylics, brushes and palettes'),
(7, 'Files & Folders', 'Ring binders, expanding files, clear bags and document folders'),
(8, 'Desk Electronics', 'Scientific calculators, standard calculators, desk lamps and USB flash drives'),
(9, 'School Supplies', 'Geometry boxes, compasses, scales, school bags and lunch boxes'),
(10, 'Adhesives & Tapes', 'Liquid glue, glue sticks, double-sided tapes and cello tapes');

-- 3. Insert Products
INSERT INTO `products` (`id`, `name`, `category_id`, `brand`, `description`, `sku`, `purchase_price`, `selling_price`, `quantity`, `minimum_stock`, `unit`) VALUES
(1, 'Classmate Spiral Notebook A4 (300 pgs)', 1, 'Classmate', 'Premium 300 pages spiral single line notebook', 'NB-CLM-300', 95.00, 140.00, 48, 10, 'Pieces'),
(2, 'Reynolds 045 Fine Carbure Ball Pen (Blue)', 2, 'Reynolds', 'Smooth classic ballpoint pen with fine tip', 'PEN-REY-045', 6.00, 10.00, 180, 30, 'Pieces'),
(3, 'Apsara Platinum Extra Dark Pencils (Pack of 10)', 3, 'Apsara', 'Extra dark graphite pencils with sharpener & eraser inside', 'PCL-APS-10', 45.00, 70.00, 65, 15, 'Packs'),
(4, 'Camlin Exam Eraser (Large)', 3, 'Camlin', 'Dust-free clean white eraser', 'ERS-CAM-01', 3.00, 5.00, 120, 25, 'Pieces'),
(5, 'Casio FX-991CW Scientific Calculator', 8, 'Casio', 'ClassWiz advanced scientific calculator with 540 functions', 'CALC-CAS-991', 1150.00, 1495.00, 8, 4, 'Pieces'),
(6, 'JK Copier A4 Paper Rim (75 GSM, 500 Sheets)', 4, 'JK Paper', 'High quality 75 GSM multipurpose office copier paper', 'PPR-JK-A4', 240.00, 330.00, 25, 10, 'Rims'),
(7, 'Kangaro Stapler No. 10 with Pins Box', 5, 'Kangaro', 'Durable metal stapler with 1000 pins box included', 'STP-KNG-10', 65.00, 95.00, 32, 8, 'Packs'),
(8, 'Doms Geometry Mathematical Box', 9, 'Doms', 'Precision metal geometry instrument kit with compass & divider', 'GEO-DOM-01', 90.00, 145.00, 22, 6, 'Boxes'),
(9, 'Fevicol MR Squeeze Bottle (100g)', 10, 'Pidilite', 'Synthetic craft adhesive for paper, cardboard and wood', 'GLU-FEV-100', 28.00, 40.00, 55, 12, 'Bottles'),
(10, 'Faber-Castell Connector Pens (25 Shades)', 6, 'Faber-Castell', 'Washable vibrant sketch marker pens with clip connectors', 'ART-FAB-25', 110.00, 160.00, 18, 5, 'Packs'),
(11, 'Luxor Highlighters Assorted (Set of 5)', 2, 'Luxor', 'Fluorescent text highlighters with chisel tips', 'HL-LUX-05', 75.00, 110.00, 14, 8, 'Sets'),
(12, 'Solo Display Book 20 Pockets A4', 7, 'Solo', 'Executive clear pocket document display folder', 'FOL-SOL-20', 85.00, 125.00, 4, 10, 'Pieces'), -- Low stock
(13, 'Cello Whiteboard Marker Black', 2, 'Cello', 'Non-toxic refillable dry erase whiteboard marker', 'MKR-CEL-BLK', 18.00, 30.00, 2, 15, 'Pieces'), -- Critical low stock
(14, 'Chart Paper Neon Sheets Pack (10 Sheets)', 4, 'PaperCraft', 'Fluorescent presentation poster chart papers', 'PPR-CHT-10', 40.00, 65.00, 0, 10, 'Packs'); -- Out of stock

-- 4. Insert Customers
INSERT INTO `customers` (`id`, `name`, `phone`, `email`, `address`) VALUES
(1, 'Walk-in Customer', '9999999999', 'walkin@store.local', 'Store Counter'),
(2, 'Amitabh Sengupta', '9830112233', 'amitabh.s@gmail.com', '12 Lake View Road, Kolkata'),
(3, 'Priya Nair', '9845098765', 'priya.nair@outlook.com', 'Flat 402, Green Meadows, Bengaluru'),
(4, 'St. Xavier High School', '9820054321', 'office@stxaviers.edu', 'Institutional Admin Desk, Mumbai'),
(5, 'Apex Tutorials & Academy', '9711099887', 'admin@apextutorials.in', 'Sector 15, Noida');

-- 5. Insert Suppliers
INSERT INTO `suppliers` (`id`, `name`, `contact_person`, `phone`, `email`, `address`) VALUES
(1, 'National Stationery Wholesale Distributors', 'Rajesh Kulkarni', '9822012345', 'sales@nationalstationery.com', 'GIDC Industrial Area, Pune'),
(2, 'Paper Hub & Co.', 'Sunil Agarwal', '9811056789', 'orders@paperhub.in', 'Chawri Bazar, Delhi'),
(3, 'Art & Craft Global Imports', 'Meena Merchant', '9833098712', 'contact@artcraftglobal.com', 'Fort Commercial Hub, Mumbai');

-- 6. Insert Sample Sales
INSERT INTO `sales` (`id`, `invoice_number`, `customer_id`, `user_id`, `subtotal`, `discount`, `tax`, `total_amount`, `payment_method`, `created_at`) VALUES
(1, 'INV-2026-0001', 2, 1, 490.00, 20.00, 23.50, 493.50, 'UPI', '2026-08-22 11:30:00'),
(2, 'INV-2026-0002', 1, 2, 280.00, 0.00, 14.00, 294.00, 'Cash', '2026-08-23 15:45:00'),
(3, 'INV-2026-0003', 4, 1, 3300.00, 150.00, 157.50, 3307.50, 'Card', '2026-08-24 10:15:00'),
(4, 'INV-2026-0004', 3, 2, 1635.00, 50.00, 79.25, 1664.25, 'UPI', '2026-08-25 09:20:00');

-- 7. Insert Sale Items
INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `quantity`, `price`, `subtotal`) VALUES
(1, 1, 1, 2, 140.00, 280.00),
(2, 1, 3, 3, 70.00, 210.00),
(3, 2, 1, 2, 140.00, 280.00),
(4, 3, 6, 10, 330.00, 3300.00),
(5, 4, 5, 1, 1495.00, 1495.00),
(6, 4, 1, 1, 140.00, 140.00);

-- 8. Insert Purchases
INSERT INTO `purchases` (`id`, `supplier_id`, `total_amount`, `purchase_date`) VALUES
(1, 1, 14250.00, '2026-08-10'),
(2, 2, 6000.00, '2026-08-18');

-- 9. Insert Purchase Items
INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `quantity`, `purchase_price`, `subtotal`) VALUES
(1, 1, 1, 50, 95.00, 4750.00),
(2, 1, 5, 5, 1150.00, 5750.00),
(3, 1, 8, 25, 90.00, 2250.00),
(4, 1, 9, 50, 28.00, 1400.00),
(5, 2, 6, 25, 240.00, 6000.00);
