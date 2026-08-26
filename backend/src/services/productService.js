const store = require('../utils/store');
const catalog = require('../data/catalog');

// Size sets per age group (mirrors catalog.js)
const SIZE_SETS = {
  newborn: ['0-3M', '3-6M', '6-9M', '9-12M'],
  toddler: ['1Y', '2Y', '3Y'],
  kids: ['4Y', '5Y', '6Y', '7Y', '8Y', '10Y', '12Y']
};
const LOW_STOCK = 5;          // at/below this (and > 0) counts as "low stock"

// ---- per-size stock helpers ----
function buildStockBySize(p) {
  const sizes = (p.sizes && p.sizes.length) ? p.sizes : (SIZE_SETS[p.ageGroup] || SIZE_SETS.kids);
  // seed data only had a single `stock` total — start every size at a healthy default
  const per = 12;
  const out = {};
  sizes.forEach((s) => { out[s] = per; });
  return out;
}

function totalStock(p) {
  if (p.stockBySize) return Object.values(p.stockBySize).reduce((s, n) => s + (Number(n) || 0), 0);
  return Number(p.stock) || 0;
}

function all() {
  const list = store.read('products', () => catalog.products);
  let changed = false;

  // The store is written once and read forever after, so products added to the
  // seed catalog later would never surface. Merge them in by id — existing rows
  // are left alone, so admin edits and stock counts always win.
  const known = new Set(list.map((p) => p.id));
  for (const seed of catalog.products) {
    if (!known.has(seed.id)) { list.push(Object.assign({}, seed)); changed = true; }
  }

  // one-time migration: give every product per-size stock
  for (const p of list) {
    if (!p.stockBySize || typeof p.stockBySize !== 'object') {
      p.stockBySize = buildStockBySize(p);
      changed = true;
    }
  }
  if (changed) store.write('products', list);
  return list;
}

function save(list) {
  return store.write('products', list);
}

function withImage(p) {
  const stock = totalStock(p);
  return Object.assign({}, p, {
    image: p.photo || `/img/p/${p.id}.svg`,
    imageCut: p.photoCut || p.photo || `/img/p/${p.id}.svg?bg=none`,
    art: `/img/p/${p.id}.svg`,
    discount: p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0,
    stock,
    stockBySize: p.stockBySize || {},
    inStock: stock > 0
  });
}

function query(q = {}) {
  let list = all().slice();

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
  if (q.mix) list = list.filter((p) => p.mix === q.mix);
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

function byId(id) {
  const p = all().find((x) => x.id === Number(id));
  return p ? withImage(p) : null;
}

function related(id, count = 4) {
  const p = all().find((x) => x.id === Number(id));
  if (!p) return [];
  return all()
    .filter((x) => x.id !== p.id && (x.category === p.category || x.gender === p.gender))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, count)
    .map(withImage);
}

function mixmatch(gender) {
  const g = gender === 'boys' ? 'boys' : 'girls';
  const tops = all().filter((p) => p.mix === 'top' && (p.gender === g || p.gender === 'unisex')).map(withImage);
  const bottoms = all().filter((p) => p.mix === 'bottom' && (p.gender === g || p.gender === 'unisex')).map(withImage);
  return { gender: g, tops, bottoms };
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

function create(data) {
  const list = all().slice();
  const id = list.reduce((m, p) => Math.max(m, p.id), 0) + 1;
  const p = Object.assign(
    {
      id, gender: 'unisex', ageGroup: 'kids', category: 'tops', type: 'tshirt',
      color: 'Pastel Blue', hex: '#9cc6ff', accent: '#ffffff', motif: 'star',
      price: 599, mrp: 899, rating: 4.2, ratings: 12, badge: 'New', mix: null,
      palette: 'blue', matches: [], spotlight: false, material: '100% Organic Cotton',
      sizes: SIZE_SETS.kids.slice(), description: 'Ultra-soft premium fabric, tailored for all-day comfort and play.'
    },
    data,
    { id }
  );
  p.price = Number(p.price) || 599;
  p.mrp = Number(p.mrp) || Math.round(p.price * 1.5);
  if (data.stockBySize && typeof data.stockBySize === 'object') {
    p.stockBySize = cleanStock(data.stockBySize);
    p.sizes = Object.keys(p.stockBySize);
  } else {
    p.stockBySize = buildStockBySize(p);
  }
  delete p.stock;
  list.push(p);
  save(list);
  return withImage(p);
}

function update(id, data) {
  const list = all().slice();
  const i = list.findIndex((p) => p.id === Number(id));
  if (i === -1) return null;
  delete data.id;
  const merged = Object.assign({}, list[i], data);
  if (data.price) merged.price = Number(data.price);
  if (data.mrp) merged.mrp = Number(data.mrp);
  if (data.stockBySize && typeof data.stockBySize === 'object') {
    merged.stockBySize = cleanStock(data.stockBySize);
    merged.sizes = Object.keys(merged.stockBySize);
  }
  delete merged.stock;
  list[i] = merged;
  save(list);
  return withImage(list[i]);
}

function remove(id) {
  const list = all().filter((p) => p.id !== Number(id));
  save(list);
  return true;
}

// Reserve stock for an order. Validates every line, then decrements atomically.
// lines: [{ id, size, qty }]
function checkAndDecrement(lines) {
  const list = all().slice();
  const find = (id) => list.find((x) => x.id === Number(id));

  // 1) validate all lines first
  for (const l of lines) {
    const p = find(l.id);
    if (!p) throw Object.assign(new Error('A product in your bag is no longer available'), { status: 409 });
    const avail = (p.stockBySize && p.stockBySize[l.size] != null) ? p.stockBySize[l.size] : 0;
    if (avail < l.qty) {
      throw Object.assign(
        new Error(`Sorry, "${p.name}" in size ${l.size || '—'} is out of stock (only ${avail} left)`),
        { status: 409 }
      );
    }
  }
  // 2) decrement
  for (const l of lines) {
    const p = find(l.id);
    p.stockBySize[l.size] = Math.max(0, (p.stockBySize[l.size] || 0) - l.qty);
  }
  save(list);
}

// Add/set stock for one size (admin quick actions)
function setSizeStock(id, size, qty) {
  const list = all().slice();
  const p = list.find((x) => x.id === Number(id));
  if (!p) return null;
  if (!p.stockBySize) p.stockBySize = {};
  p.stockBySize[size] = Math.max(0, Math.floor(Number(qty) || 0));
  if (!p.sizes.includes(size)) p.sizes.push(size);
  save(list);
  return withImage(p);
}

// Out-of-stock + low-stock lists for the admin dashboard notification
function stockAlerts() {
  const items = all().map(withImage);
  const out = items.filter((p) => p.stock === 0)
    .map((p) => ({ id: p.id, name: p.name, image: p.image, sizes: p.sizes }));
  const low = items.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK)
    .map((p) => ({ id: p.id, name: p.name, image: p.image, stock: p.stock,
      lowSizes: Object.entries(p.stockBySize).filter(([, n]) => n > 0 && n <= 2).map(([s]) => s) }));
  return { out, low, outCount: out.length, lowCount: low.length };
}

module.exports = {
  all, query, byId, related, mixmatch, isMatch, create, update, remove, withImage,
  checkAndDecrement, setSizeStock, stockAlerts, SIZE_SETS, LOW_STOCK
};
