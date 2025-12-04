# 🗄️ Database Management Interface

A modern, web-based database management interface - a mini phpMyAdmin built for educational purposes with a premium, sleek design.

![Database Manager](https://img.shields.io/badge/Database-MySQL-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 📊 Dashboard
- Real-time database statistics (table count, size, indexes, keys)
- Visual charts showing table size distribution
- Premium glassmorphism UI with smooth animations

### 📋 Tables Explorer
- List all tables with metadata (rows, size, engine)
- View detailed table schema (columns, types, keys, indexes, foreign keys)
- Browse table content with pagination
- Search and sort functionality

### ⚡ SQL Playground
- **DDL**: Execute CREATE, ALTER, DROP statements
- **DML**: Run INSERT, UPDATE, DELETE queries
- **DQL**: Execute SELECT queries with formatted results
- Syntax highlighting and error feedback

### 🎨 Design
- Modern dark theme with vibrant gradients
- Glassmorphism effects and smooth micro-animations
- Fully responsive layout
- Premium typography using Inter font

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL or MariaDB server running

### Setup Steps

1. **Clone or navigate to the project directory**
   ```bash
   cd d:\webdev2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment** (optional)
   ```bash
   copy .env.example .env
   ```
   Edit `.env` and set your preferred PORT and SESSION_SECRET

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📝 Usage

### Connecting to a Database

1. On the login page, enter your MySQL credentials:
   - **Host**: localhost (or your MySQL server address)
   - **Username**: Your MySQL username (e.g., root)
   - **Password**: Your MySQL password
   - **Database Name**: The database you want to manage

2. Click "Connect to Database"

### Creating a Test Database

If you don't have a database yet, connect to MySQL and run:

```sql
-- Create test database
CREATE DATABASE test_shop;
USE test_shop;

-- Create tables
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INT DEFAULT 0,
  category_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and gadgets'),
('Books', 'Physical and digital books'),
('Clothing', 'Apparel and accessories');

INSERT INTO products (name, description, price, stock, category_id) VALUES
('Laptop Pro 15', 'High-performance laptop', 1299.99, 10, 1),
('Wireless Mouse', 'Ergonomic wireless mouse', 29.99, 50, 1),
('JavaScript Guide', 'Complete JavaScript programming guide', 39.99, 30, 2),
('T-Shirt Blue', 'Cotton blue t-shirt', 19.99, 100, 3);

INSERT INTO customers (first_name, last_name, email, phone) VALUES
('John', 'Doe', 'john.doe@email.com', '123-456-7890'),
('Jane', 'Smith', 'jane.smith@email.com', '098-765-4321'),
('Bob', 'Johnson', 'bob.j@email.com', '555-123-4567');
```

Then connect using database name: `test_shop`

## 🔒 Security Warning

**⚠️ IMPORTANT**: This tool is designed for **development and educational purposes only**.

- It executes arbitrary SQL commands
- Database credentials are stored in session (temporary)
- No SQL injection protection for user queries
- **DO NOT** use in production environments
- **DO NOT** expose to the public internet
- Always use on trusted, local networks only

## 🛠️ Technology Stack

- **Backend**: Node.js + Express
- **Database Driver**: mysql2 with Promise support
- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: Custom CSS with modern design system
- **Charts**: Chart.js
- **Session Management**: express-session

## 📁 Project Structure

```
webdev2/
├── public/
│   ├── css/
│   │   └── style.css        # Premium design system
│   ├── js/
│   │   └── app.js           # Frontend application
│   └── index.html           # Main HTML
├── routes/
│   └── api.js               # API endpoints
├── utils/
│   └── database.js          # Database utilities
├── server.js                # Express server
├── package.json             # Dependencies
└── .env.example             # Environment template
```

## 🎯 API Endpoints

- `POST /api/connect` - Test and establish database connection
- `GET /api/disconnect` - Disconnect and clear session
- `GET /api/dashboard` - Get database statistics
- `GET /api/tables` - List all tables
- `GET /api/tables/:name/info` - Get table schema
- `GET /api/tables/:name/content` - Get table data with pagination
- `POST /api/query/ddl` - Execute DDL queries
- `POST /api/query/dml` - Execute DML queries
- `POST /api/query/dql` - Execute SELECT queries

## 🤝 Contributing

This is an educational project. Feel free to fork and modify for your learning purposes!

## 📄 License

MIT License - Feel free to use this project for educational purposes.

## 🐛 Troubleshooting

### Cannot connect to MySQL
- Ensure MySQL server is running
- Check credentials are correct
- Verify the database exists
- Check MySQL user has proper permissions

### npm install fails
- Make sure Node.js is installed (v14+)
- Try clearing npm cache: `npm cache clean --force`
- Delete `node_modules` and try again

### Page won't load
- Check the server is running on port 3000
- Look for errors in the terminal
- Check browser console for JavaScript errors

## 📞 Support

For issues or questions, this is a learning project - experiment, break things, and learn!
