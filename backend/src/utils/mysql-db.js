const mysql = require('mysql2/promise');
const config = require('../config');

let pool = null;

async function getPool() {
  if (!pool) {
    pool = mysql.createPool(config.mysql);
  }
  return pool;
}

let initPromise = null;

async function initDb() {
  // Reuse the in-flight/completed init across warm serverless invocations
  if (initPromise) return initPromise;
  initPromise = doInit();
  return initPromise;
}

async function doInit() {
  // On managed platforms (TiDB Cloud, PlanetScale, etc.) the database itself is
  // already created via the provider's console — the app user may not even have
  // CREATE DATABASE privilege. Only try to create it for a bare local MySQL install.
  if (!process.env.VERCEL && config.mysql.host === 'localhost') {
    const connection = await mysql.createConnection({
      host: config.mysql.host,
      user: config.mysql.user,
      password: config.mysql.password,
      port: config.mysql.port
    });
    try {
      await connection.execute(`CREATE DATABASE IF NOT EXISTS ${config.mysql.database}`);
      console.log(`✓ Database '${config.mysql.database}' ready`);
    } catch (err) {
      console.error('Failed to create database:', err.message);
      if (err.message.includes('Access denied')) {
        console.error('\n❌ MySQL Authentication Failed');
        console.error('Please set environment variables:');
        console.error('  export DB_USER=your_mysql_user');
        console.error('  export DB_PASSWORD=your_mysql_password');
        process.exit(1);
      }
      throw err;
    } finally {
      await connection.end();
    }
  }

  const pool = await getPool();
  const dbConnection = await pool.getConnection();

  try {
    // Create tables
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        gender VARCHAR(50),
        ageGroup VARCHAR(50),
        category VARCHAR(50),
        type VARCHAR(50),
        color VARCHAR(100),
        hex VARCHAR(7),
        accent VARCHAR(7),
        motif VARCHAR(50),
        price INT,
        mrp INT,
        rating DECIMAL(3,1),
        ratings INT DEFAULT 0,
        badge VARCHAR(50),
        mix VARCHAR(20),
        palette VARCHAR(50),
        material TEXT,
        description TEXT,
        photo VARCHAR(255),
        photoCut VARCHAR(255),
        spotlight BOOLEAN DEFAULT FALSE,
        sizes JSON,
        matches JSON,
        stockBySize JSON,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'customer') DEFAULT 'customer',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        userId INT,
        status VARCHAR(50) DEFAULT 'placed',
        payment VARCHAR(50) DEFAULT 'cod',
        customerName VARCHAR(255),
        customerEmail VARCHAR(255),
        customerPhone VARCHAR(20),
        customerAddress TEXT,
        items JSON NOT NULL,
        summary JSON NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS hero_slides (
        id INT PRIMARY KEY AUTO_INCREMENT,
        file VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        uploaded BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✓ All tables created successfully');
  } finally {
    dbConnection.release();
  }
}

async function query(sql, values) {
  const pool = await getPool();
  const [results] = await pool.execute(sql, values);
  return results;
}

async function queryOne(sql, values) {
  const results = await query(sql, values);
  return results[0] || null;
}

async function close() {
  if (pool) {
    await pool.end();
  }
}

module.exports = {
  getPool,
  query,
  queryOne,
  initDb,
  close
};
