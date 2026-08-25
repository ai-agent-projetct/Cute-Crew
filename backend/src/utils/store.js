// Tiny JSON-file persistence layer (repository pattern).
// Swap this module for a MySQL repository without touching services.
const fs = require('fs');
const path = require('path');
const config = require('../config');

const cache = {};

function fileFor(name) {
  return path.join(config.dataDir, `${name}.json`);
}

function ensureDir() {
  if (!fs.existsSync(config.dataDir)) fs.mkdirSync(config.dataDir, { recursive: true });
}

function read(name, fallback) {
  if (cache[name] !== undefined) return cache[name];
  ensureDir();
  const file = fileFor(name);
  if (fs.existsSync(file)) {
    try {
      cache[name] = JSON.parse(fs.readFileSync(file, 'utf8'));
      return cache[name];
    } catch (e) {
      console.error(`store: failed to parse ${file}, using fallback`, e.message);
    }
  }
  cache[name] = typeof fallback === 'function' ? fallback() : fallback;
  return cache[name];
}

function write(name, data) {
  ensureDir();
  cache[name] = data;
  fs.writeFileSync(fileFor(name), JSON.stringify(data, null, 2));
  return data;
}

module.exports = { read, write };
