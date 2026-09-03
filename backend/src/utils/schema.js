// Creates the real relational tables this app runs on (products, mixmatch,
// hero_slides, orders, users) and retires the old generic JSON-blob
// `kv_store` table. Call once at boot — promise-cached like mysql-db's
// initDb(), so a serverless entry point can safely await this on every
// invocation with only the first cold start paying the cost.
const db = require('./mysql-db');
const crypto = require('crypto');
const catalog = require('../data/catalog');
const config = require('../config');

let initPromise = null;

function init() {
  if (initPromise) return initPromise;
  initPromise = doInit().catch((err) => { initPromise = null; throw err; });
  return initPromise;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${key}`;
}

// Same shape for both products and mix & match items — mixmatch just adds a
// required `mix` column and starts its ids at 100001 so a product id and a
// mixmatch id can never collide (cart/order lines only ever carry one id,
// no separate "which table" flag needed).
async function createTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      gender VARCHAR(20),
      ageGroup VARCHAR(20),
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
      palette VARCHAR(50),
      matches JSON,
      material TEXT,
      description TEXT,
      photo VARCHAR(500),
      photoCut VARCHAR(500),
      spotlight BOOLEAN DEFAULT FALSE,
      sizes JSON,
      stockBySize JSON,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS mixmatch (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      gender VARCHAR(20),
      ageGroup VARCHAR(20),
      category VARCHAR(50),
      type VARCHAR(50),
      color VARCHAR(100),
      hex VARCHAR(7),
      accent VARCHAR(7),
      motif VARCHAR(50),
      price INT,
      mrp INT,
      mix VARCHAR(10) NOT NULL,
      palette VARCHAR(50),
      matches JSON,
      material TEXT,
      description TEXT,
      photo VARCHAR(500),
      photoCut VARCHAR(500),
      sizes JSON,
      stockBySize JSON,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  await db.query('ALTER TABLE mixmatch AUTO_INCREMENT = 100001');

  await db.query(`
    CREATE TABLE IF NOT EXISTS hero_slides (
      id INT PRIMARY KEY AUTO_INCREMENT,
      file VARCHAR(500) NOT NULL,
      title VARCHAR(255),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(50) PRIMARY KEY,
      status VARCHAR(20) DEFAULT 'placed',
      payment VARCHAR(20) DEFAULT 'cod',
      userId INT,
      userName VARCHAR(255),
      userEmail VARCHAR(255),
      customerName VARCHAR(255),
      customerPhone VARCHAR(20),
      customerAddress TEXT,
      summary JSON NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'customer',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function seedIfEmpty() {
  // Fresh-database bootstrap only — a database that already has rows (ours,
  // migrated from kv_store) is left exactly as-is.
  const productCount = (await db.queryOne('SELECT COUNT(*) AS c FROM products')).c;
  if (productCount === 0) await seedProducts();

  const mixmatchCount = (await db.queryOne('SELECT COUNT(*) AS c FROM mixmatch')).c;
  if (mixmatchCount === 0) await seedMixmatch();

  const userCount = (await db.queryOne('SELECT COUNT(*) AS c FROM users')).c;
  if (userCount === 0) {
    await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [config.admin.name, config.admin.email, hashPassword(config.admin.password), 'admin']
    );
  }
}

async function doInit() {
  await db.query('DROP TABLE IF EXISTS kv_store');
  await createTables();
  await seedIfEmpty();
  console.log('✓ Schema ready (MySQL/TiDB) — products, mixmatch, hero_slides, orders, users');
}

async function seedProducts() {
  for (const p of catalog.products) {
    await db.query(
      `INSERT INTO products (id, name, gender, ageGroup, category, type, color, hex, accent, motif,
       price, mrp, rating, ratings, badge, palette, matches, material, description, photo, photoCut,
       spotlight, sizes, stockBySize)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id, p.name, p.gender, p.ageGroup, p.category, p.type, p.color, p.hex, p.accent, p.motif,
        p.price, p.mrp, p.rating, p.ratings || 0, p.badge, p.palette, JSON.stringify(p.matches || []),
        p.material, p.description, p.photo || null, p.photoCut || null,
        !!p.spotlight, JSON.stringify(p.sizes || []), JSON.stringify(buildStockBySize(p))
      ]
    );
  }
}

async function seedMixmatch() {
  for (const p of catalog.mixmatch || []) {
    await db.query(
      `INSERT INTO mixmatch (name, gender, ageGroup, category, type, color, hex, accent, motif,
       price, mrp, mix, palette, matches, material, description, photo, photoCut, sizes, stockBySize)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.name, p.gender, p.ageGroup, p.category, p.type, p.color, p.hex, p.accent, p.motif,
        p.price, p.mrp, p.mix, p.palette, JSON.stringify(p.matches || []),
        p.material, p.description, p.photo || null, p.photoCut || null,
        JSON.stringify(p.sizes || []), JSON.stringify(buildStockBySize(p))
      ]
    );
  }
}

function buildStockBySize(p) {
  const SIZE_SETS = {
    newborn: ['0-3M', '3-6M', '6-9M', '9-12M'],
    toddler: ['1Y', '2Y', '3Y'],
    kids: ['4Y', '5Y', '6Y', '7Y', '8Y', '10Y', '12Y']
  };
  const sizes = (p.sizes && p.sizes.length) ? p.sizes : (SIZE_SETS[p.ageGroup] || SIZE_SETS.kids);
  const out = {};
  sizes.forEach((s) => { out[s] = 12; });
  return out;
}

module.exports = { init, createTables };
