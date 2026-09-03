const mysql = require('mysql2/promise');
const config = require('../config');

let pool = null;

async function getPool() {
  if (!pool) {
    pool = mysql.createPool(config.mysql);
  }
  return pool;
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
  close
};
