-- Database Management Interface - Test Database Setup
-- Run this in MySQL to populate the nomad_db database with sample data

-- Use the existing database
USE nomad_db;

-- Create categories table
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table with foreign key
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INT DEFAULT 0,
  category_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_category (category_id),
  INDEX idx_price (price)
);

-- Create customers table
CREATE TABLE customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  INDEX idx_customer (customer_id),
  INDEX idx_status (status)
);

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices, gadgets, and accessories'),
('Books', 'Physical and digital books, magazines'),
('Clothing', 'Apparel, shoes, and fashion accessories'),
('Home & Garden', 'Furniture, decor, and garden supplies'),
('Sports', 'Sporting goods and fitness equipment');

-- Insert sample products
INSERT INTO products (name, description, price, stock, category_id) VALUES
('Laptop Pro 15"', 'High-performance laptop with 16GB RAM and 512GB SSD', 1299.99, 10, 1),
('Wireless Mouse', 'Ergonomic wireless mouse with 3 DPI settings', 29.99, 50, 1),
('USB-C Hub', '7-in-1 USB-C hub with HDMI and ethernet', 49.99, 30, 1),
('Smartphone X', 'Latest flagship smartphone with 5G', 899.99, 15, 1),

('JavaScript: The Good Parts', 'Essential JavaScript programming guide', 39.99, 25, 2),
('Python for Data Science', 'Comprehensive guide to Python and data analysis', 49.99, 18, 2),
('Web Design Handbook', 'Modern web design principles and practices', 34.99, 20, 2),

('Blue Cotton T-Shirt', 'Comfortable 100% cotton t-shirt - Size M', 19.99, 100, 3),
('Denim Jeans', 'Classic fit denim jeans - Size 32', 59.99, 45, 3),
('Running Shoes', 'Lightweight running shoes with cushioning', 89.99, 35, 3),

('Office Chair', 'Ergonomic office chair with lumbar support', 249.99, 12, 4),
('Desk Lamp LED', 'Adjustable LED desk lamp with touch control', 39.99, 40, 4),

('Yoga Mat', 'Non-slip yoga mat with carrying strap', 24.99, 60, 5),
('Dumbbell Set', '5-25 lbs adjustable dumbbell set', 149.99, 8, 5);

-- Insert sample customers
INSERT INTO customers (first_name, last_name, email, phone, address, city) VALUES
('John', 'Doe', 'john.doe@email.com', '123-456-7890', '123 Main St', 'New York'),
('Jane', 'Smith', 'jane.smith@email.com', '098-765-4321', '456 Oak Ave', 'Los Angeles'),
('Bob', 'Johnson', 'bob.j@email.com', '555-123-4567', '789 Pine Rd', 'Chicago'),
('Alice', 'Williams', 'alice.w@email.com', '555-987-6543', '321 Elm St', 'Houston'),
('Charlie', 'Brown', 'charlie.b@email.com', '555-246-8135', '654 Maple Dr', 'Phoenix');

-- Insert sample orders
INSERT INTO orders (customer_id, total_amount, status) VALUES
(1, 1329.98, 'delivered'),  -- Laptop + Mouse
(2, 89.99, 'shipped'),       -- Running Shoes
(3, 249.99, 'processing'),   -- Office Chair
(1, 79.98, 'delivered'),     -- Two books
(4, 59.99, 'pending'),       -- Jeans
(5, 174.98, 'processing');   -- Yoga Mat + Dumbbell Set

-- Display summary
SELECT 'Database setup complete!' as Message;
SELECT COUNT(*) as TotalTables FROM information_schema.tables WHERE table_schema = 'nomad_db';
SELECT 
  (SELECT COUNT(*) FROM categories) as Categories,
  (SELECT COUNT(*) FROM products) as Products,
  (SELECT COUNT(*) FROM customers) as Customers,
  (SELECT COUNT(*) FROM orders) as Orders;
