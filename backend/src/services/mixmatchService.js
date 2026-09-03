// Mix & Match catalog — a real table separate from `products` (see schema.js),
// so a top/bottom built for the outfit wheel is no longer also a regular shop
// listing. Its ids start at 100001 (ALTER TABLE ... AUTO_INCREMENT in
// schema.js) so a mix & match id never collides with a product id — cart and
// order lines only ever carry one id, no separate "which table" flag needed.
const db = require('../utils/mysql-db');

const SIZE_SETS = {
  newborn: ['0-3M', '3-6M', '6-9M', '9-12M'],
  toddler: ['1Y', '2Y', '3Y'],
  kids: ['4Y', '5Y', '6Y', '7Y', '8Y', '10Y', '12Y']
};
const LOW_STOCK = 5;
const ID_FLOOR = 100000;

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
    stockBySize: asJson(row.stockBySize, {})
  });
}

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
  const rows = await db.query('SELECT * FROM mixmatch ORDER BY id');
  return rows.map(fromRow);
}

function withImage(p) {
  const stock = totalStock(p);
  return Object.assign({}, p, {
    image: p.photo || `/img/mm/${p.id}.svg`,
    imageCut: p.photoCut || p.photo || `/img/mm/${p.id}.svg?bg=none`,
    art: `/img/mm/${p.id}.svg`,
    discount: p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0,
    stock,
    stockBySize: p.stockBySize || {},
    inStock: stock > 0,
    rating: p.rating != null ? p.rating : 4.5,
    ratings: p.ratings != null ? p.ratings : 0,
    category: p.category || (p.mix === 'bottom' ? 'bottoms' : 'tops'),
    material: p.material || '100% Organic Cotton',
    description: p.description || 'Ultra-soft premium fabric, tailored for all-day comfort and play.'
  });
}

async function byId(id) {
  const row = await db.queryOne('SELECT * FROM mixmatch WHERE id = ?', [Number(id)]);
  return row ? withImage(fromRow(row)) : null;
}

// Mirrors the old contract exactly: { gender, tops, bottoms }.
async function list(gender) {
  const g = gender === 'boys' ? 'boys' : 'girls';
  const items = await all();
  const tops = items.filter((p) => p.mix === 'top' && (p.gender === g || p.gender === 'unisex')).map(withImage);
  const bottoms = items.filter((p) => p.mix === 'bottom' && (p.gender === g || p.gender === 'unisex')).map(withImage);
  return { gender: g, tops, bottoms };
}

function cleanStock(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    out[k] = Math.max(0, Math.floor(Number(v) || 0));
  }
  return out;
}

async function create(data) {
  if (data.mix !== 'top' && data.mix !== 'bottom') {
    throw Object.assign(new Error('Mix & Match item must be a top or a bottom'), { status: 400 });
  }
  const p = Object.assign(
    {
      gender: 'unisex', ageGroup: 'kids', category: 'tops', type: 'tshirt',
      color: 'Pastel Blue', hex: '#9cc6ff', accent: '#ffffff', motif: 'star',
      price: 599, mrp: 899, palette: 'blue', matches: [],
      material: '100% Organic Cotton', sizes: SIZE_SETS.kids.slice(),
      description: 'Ultra-soft premium fabric, tailored for all-day comfort and play.'
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
    `INSERT INTO mixmatch (name, gender, ageGroup, category, type, color, hex, accent, motif,
     price, mrp, mix, palette, matches, material, description, photo, photoCut, sizes, stockBySize)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      p.name, p.gender, p.ageGroup, p.category, p.type, p.color, p.hex, p.accent, p.motif,
      p.price, p.mrp, p.mix, p.palette, JSON.stringify(p.matches),
      p.material, p.description, p.photo || null, p.photoCut || null,
      JSON.stringify(p.sizes), JSON.stringify(p.stockBySize)
    ]
  );
  return byId(result.insertId);
}

async function update(id, data) {
  const existing = await db.queryOne('SELECT * FROM mixmatch WHERE id = ?', [Number(id)]);
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
    `UPDATE mixmatch SET name=?, gender=?, ageGroup=?, category=?, type=?, color=?, hex=?, accent=?,
     motif=?, price=?, mrp=?, mix=?, palette=?, matches=?, material=?, description=?, photo=?,
     photoCut=?, sizes=?, stockBySize=? WHERE id=?`,
    [
      merged.name, merged.gender, merged.ageGroup, merged.category, merged.type, merged.color,
      merged.hex, merged.accent, merged.motif, merged.price, merged.mrp, merged.mix, merged.palette,
      JSON.stringify(merged.matches || []), merged.material, merged.description,
      merged.photo || null, merged.photoCut || null,
      JSON.stringify(merged.sizes || []), JSON.stringify(merged.stockBySize || {}),
      Number(id)
    ]
  );
  return byId(id);
}

async function remove(id) {
  await db.query('DELETE FROM mixmatch WHERE id = ?', [Number(id)]);
  return true;
}

async function checkAndDecrement(lines) {
  const rows = await Promise.all(lines.map((l) => db.queryOne('SELECT * FROM mixmatch WHERE id = ?', [Number(l.id)])));

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
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const stockBySize = asJson(rows[i].stockBySize, {});
    stockBySize[l.size] = Math.max(0, (stockBySize[l.size] || 0) - l.qty);
    await db.query('UPDATE mixmatch SET stockBySize = ? WHERE id = ?', [JSON.stringify(stockBySize), Number(l.id)]);
  }
}

async function setSizeStock(id, size, qty) {
  const row = await db.queryOne('SELECT * FROM mixmatch WHERE id = ?', [Number(id)]);
  if (!row) return null;
  const stockBySize = asJson(row.stockBySize, {});
  const sizes = asJson(row.sizes, []);
  stockBySize[size] = Math.max(0, Math.floor(Number(qty) || 0));
  if (!sizes.includes(size)) sizes.push(size);
  await db.query('UPDATE mixmatch SET stockBySize = ?, sizes = ? WHERE id = ?',
    [JSON.stringify(stockBySize), JSON.stringify(sizes), Number(id)]);
  return byId(id);
}

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
  all, byId, list, create, update, remove, withImage,
  checkAndDecrement, setSizeStock, stockAlerts, SIZE_SETS, LOW_STOCK, ID_FLOOR
};
