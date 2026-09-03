const fs = require('fs');
const path = require('path');
const db = require('../utils/mysql-db');
const config = require('../config');

// Second-angle shots live beside the main one as mk-<id>-b.png. Discovered from
// disk rather than declared per product, so adding a hover frame is a file drop.
// Cached after the first read; a restart picks up newly added files.
const PHOTO_DIR = path.join(config.frontendDir, 'assets', 'img', 'real');
let hoverIds = null;
function hoverPhoto(id) {
  if (!hoverIds) {
    try {
      hoverIds = new Set(fs.readdirSync(PHOTO_DIR)
        .filter((f) => /^mk-\d+-b\.png$/.test(f))
        .map((f) => Number(f.match(/\d+/)[0])));
    } catch (e) { hoverIds = new Set(); }
  }
  return hoverIds.has(id) ? `/assets/img/real/mk-${id}-b.png` : null;
}

// The image pipeline rewrites product photos in place, so the filename alone is a
// stale cache key — a browser that cached the old artwork keeps serving it until
// its max-age lapses, no matter what headers we send afterwards. Stamping URLs
// with the newest mtime in the photo directory makes a rebuilt image a new URL,
// so refreshed artwork always wins. Computed once; a restart picks up rebuilds.
let assetVer = null;
function ver() {
  if (assetVer === null) {
    try {
      assetVer = Math.round(fs.readdirSync(PHOTO_DIR).reduce((m, f) => {
        try { return Math.max(m, fs.statSync(path.join(PHOTO_DIR, f)).mtimeMs); } catch (e) { return m; }
      }, 0));
    } catch (e) { assetVer = 0; }
  }
  return assetVer;
}
const stamp = (url) =>
  (url && url.startsWith('/assets/img/real/') && !url.includes('?') ? `${url}?v=${ver()}` : url);

// Size sets per age group (mirrors catalog.js)
const SIZE_SETS = {
  newborn: ['0-3M', '3-6M', '6-9M', '9-12M'],
  toddler: ['1Y', '2Y', '3Y'],
  kids: ['4Y', '5Y', '6Y', '7Y', '8Y', '10Y', '12Y']
};
const LOW_STOCK = 5;          // at/below this (and > 0) counts as "low stock"

// mysql2 auto-parses JSON columns into objects/arrays already; only parse if
// we got a raw string back (e.g. from a driver that doesn't auto-parse).
function asJson(v, fallback) {
  if (v == null) return fallback;
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch { return fallback; }
  }
  return v;
}

function fromRow(row) {
  return Object.assign({}, row, {
    matches: asJson(row.matches, []),
    sizes: asJson(row.sizes, []),
    stockBySize: asJson(row.stockBySize, {}),
    spotlight: !!row.spotlight
  });
}

// ---- per-size stock helpers ----
function buildStockBySize(p) {
  const sizes = (p.sizes && p.sizes.length) ? p.sizes : (SIZE_SETS[p.ageGroup] || SIZE_SETS.kids);
  const per = 12;
  const out = {};
  sizes.forEach((s) => { out[s] = per; });
  return out;
}

function totalStock(p) {
  if (p.stockBySize) return Object.values(p.stockBySize).reduce((s, n) => s + (Number(n) || 0), 0);
  return 0;
}

async function all() {
  const rows = await db.query('SELECT * FROM products ORDER BY id');
  return rows.map(fromRow);
}

function withImage(p) {
  const stock = totalStock(p);
  return Object.assign({}, p, {
    image: stamp(p.photo) || `/img/p/${p.id}.svg`,
    // an admin-uploaded flip image always wins over the mk-<id>-b.png fallback
    imageHover: stamp(p.photoHover || hoverPhoto(p.id)),
    imageCut: stamp(p.photoCut || p.photo) || `/img/p/${p.id}.svg?bg=none`,
    art: `/img/p/${p.id}.svg`,
    discount: p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0,
    stock,
    stockBySize: p.stockBySize || {},
    inStock: stock > 0
  });
}

async function query(q = {}) {
  let list = await all();

  if (q.gender) {
    const g = String(q.gender).toLowerCase();
    list = list.filter((p) => p.gender === g || (g !== 'unisex' && p.gender === 'unisex'));
  }
  if (q.age) list = list.filter((p) => p.ageGroup === q.age);
  if (q.category) {
    const cats = String(q.category).split(',');
    list = list.filter((p) => cats.includes(p.category));
  }
  if (q.type) list = list.filter((p) => p.type === q.type);
  if (q.spotlight) list = list.filter((p) => p.spotlight);
  if (q.color) {
    const colors = String(q.color).toLowerCase().split(',');
    list = list.filter((p) => colors.some((c) => (p.color || '').toLowerCase().includes(c) || p.palette === c));
  }
  if (q.minPrice) list = list.filter((p) => p.price >= Number(q.minPrice));
  if (q.maxPrice) list = list.filter((p) => p.price <= Number(q.maxPrice));
  if (q.badge) list = list.filter((p) => p.badge === q.badge);
  if (q.search) {
    const s = String(q.search).toLowerCase();
    list = list.filter((p) =>
      [p.name, p.color, p.category, p.gender, p.type].join(' ').toLowerCase().includes(s)
    );
  }

  const total = list.length;

  switch (q.sort) {
    case 'price_asc': list.sort((a, b) => a.price - b.price); break;
    case 'price_desc': list.sort((a, b) => b.price - a.price); break;
    case 'rating': list.sort((a, b) => b.rating - a.rating); break;
    case 'new': list.sort((a, b) => b.id - a.id); break;
    default: {
      const score = (p) => p.rating * Math.log10(p.ratings + 1);
      list.sort((a, b) => ((b.photo ? 1 : 0) - (a.photo ? 1 : 0)) || (score(b) - score(a)));
    }
  }

  const offset = Number(q.offset) || 0;
  const limit = Math.min(Number(q.limit) || 48, 100);
  return { total, items: list.slice(offset, offset + limit).map(withImage) };
}

async function byId(id) {
  const row = await db.queryOne('SELECT * FROM products WHERE id = ?', [Number(id)]);
  return row ? withImage(fromRow(row)) : null;
}

async function related(id, count = 4) {
  const list = await all();
  const p = list.find((x) => x.id === Number(id));
  if (!p) return [];
  return list
    .filter((x) => x.id !== p.id && (x.category === p.category || x.gender === p.gender))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, count)
    .map(withImage);
}

function isMatch(top, bottom) {
  if (!top || !bottom) return false;
  return (top.matches || []).includes(bottom.palette) || (bottom.matches || []).includes(top.palette) || top.palette === bottom.palette;
}

// Normalise a stockBySize object coming from the admin form: keys -> non-negative ints
function cleanStock(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    out[k] = Math.max(0, Math.floor(Number(v) || 0));
  }
  return out;
}

async function create(data) {
  const p = Object.assign(
    {
      gender: 'unisex', ageGroup: 'kids', category: 'tops', type: 'tshirt',
      color: 'Pastel Blue', hex: '#9cc6ff', accent: '#ffffff', motif: 'star',
      price: 599, mrp: 899, rating: 4.2, ratings: 12, badge: 'New',
      palette: 'blue', matches: [], spotlight: false, material: '100% Organic Cotton',
      sizes: SIZE_SETS.kids.slice(), description: 'Ultra-soft premium fabric, tailored for all-day comfort and play.'
    },
    data
  );
  p.price = Number(p.price) || 599;
  p.mrp = Number(p.mrp) || Math.round(p.price * 1.5);
  if (data.stockBySize && typeof data.stockBySize === 'object') {
    p.stockBySize = cleanStock(data.stockBySize);
    p.sizes = Object.keys(p.stockBySize);
  } else {
    p.stockBySize = buildStockBySize(p);
  }

  const result = await db.query(
    `INSERT INTO products (name, gender, ageGroup, category, type, color, hex, accent, motif,
     price, mrp, rating, ratings, badge, palette, matches, material, description, photo, photoCut,
     photoHover, spotlight, sizes, stockBySize)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      p.name, p.gender, p.ageGroup, p.category, p.type, p.color, p.hex, p.accent, p.motif,
      p.price, p.mrp, p.rating, p.ratings, p.badge, p.palette, JSON.stringify(p.matches),
      p.material, p.description, p.photo || null, p.photoCut || null,
      p.photoHover || null, !!p.spotlight, JSON.stringify(p.sizes), JSON.stringify(p.stockBySize)
    ]
  );
  return byId(result.insertId);
}

async function update(id, data) {
  const existing = await db.queryOne('SELECT * FROM products WHERE id = ?', [Number(id)]);
  if (!existing) return null;
  const current = fromRow(existing);
  delete data.id;
  const merged = Object.assign({}, current, data);
  if (data.price) merged.price = Number(data.price);
  if (data.mrp) merged.mrp = Number(data.mrp);
  if (data.stockBySize && typeof data.stockBySize === 'object') {
    merged.stockBySize = cleanStock(data.stockBySize);
    merged.sizes = Object.keys(merged.stockBySize);
  }

  await db.query(
    `UPDATE products SET name=?, gender=?, ageGroup=?, category=?, type=?, color=?, hex=?, accent=?,
     motif=?, price=?, mrp=?, rating=?, ratings=?, badge=?, palette=?, matches=?, material=?,
     description=?, photo=?, photoCut=?, photoHover=?, spotlight=?, sizes=?, stockBySize=? WHERE id=?`,
    [
      merged.name, merged.gender, merged.ageGroup, merged.category, merged.type, merged.color,
      merged.hex, merged.accent, merged.motif, merged.price, merged.mrp, merged.rating,
      merged.ratings, merged.badge, merged.palette, JSON.stringify(merged.matches || []),
      merged.material, merged.description, merged.photo || null, merged.photoCut || null,
      merged.photoHover || null, !!merged.spotlight, JSON.stringify(merged.sizes || []),
      JSON.stringify(merged.stockBySize || {}), Number(id)
    ]
  );
  return byId(id);
}

async function remove(id) {
  await db.query('DELETE FROM products WHERE id = ?', [Number(id)]);
  return true;
}

// Reserve stock for an order. Validates every line, then decrements atomically.
// lines: [{ id, size, qty }]
async function checkAndDecrement(lines) {
  const rows = await Promise.all(lines.map((l) => db.queryOne('SELECT * FROM products WHERE id = ?', [Number(l.id)])));

  // 1) validate all lines first
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const row = rows[i];
    if (!row) throw Object.assign(new Error('A product in your bag is no longer available'), { status: 409 });
    const stockBySize = asJson(row.stockBySize, {});
    const avail = stockBySize[l.size] != null ? stockBySize[l.size] : 0;
    if (avail < l.qty) {
      throw Object.assign(
        new Error(`Sorry, "${row.name}" in size ${l.size || '—'} is out of stock (only ${avail} left)`),
        { status: 409 }
      );
    }
  }
  // 2) decrement
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const stockBySize = asJson(rows[i].stockBySize, {});
    stockBySize[l.size] = Math.max(0, (stockBySize[l.size] || 0) - l.qty);
    await db.query('UPDATE products SET stockBySize = ? WHERE id = ?', [JSON.stringify(stockBySize), Number(l.id)]);
  }
}

// Add/set stock for one size (admin quick actions)
async function setSizeStock(id, size, qty) {
  const row = await db.queryOne('SELECT * FROM products WHERE id = ?', [Number(id)]);
  if (!row) return null;
  const stockBySize = asJson(row.stockBySize, {});
  const sizes = asJson(row.sizes, []);
  stockBySize[size] = Math.max(0, Math.floor(Number(qty) || 0));
  if (!sizes.includes(size)) sizes.push(size);
  await db.query('UPDATE products SET stockBySize = ?, sizes = ? WHERE id = ?',
    [JSON.stringify(stockBySize), JSON.stringify(sizes), Number(id)]);
  return byId(id);
}

// Out-of-stock + low-stock lists for the admin dashboard notification
async function stockAlerts() {
  const items = (await all()).map(withImage);
  const out = items.filter((p) => p.stock === 0)
    .map((p) => ({ id: p.id, name: p.name, image: p.image, sizes: p.sizes }));
  const low = items.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK)
    .map((p) => ({ id: p.id, name: p.name, image: p.image, stock: p.stock,
      lowSizes: Object.entries(p.stockBySize).filter(([, n]) => n > 0 && n <= 2).map(([s]) => s) }));
  return { out, low, outCount: out.length, lowCount: low.length };
}

module.exports = {
  all, query, byId, related, isMatch, create, update, remove, withImage,
  checkAndDecrement, setSizeStock, stockAlerts, SIZE_SETS, LOW_STOCK
};
