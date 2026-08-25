const store = require('../utils/store-mysql');
const catalog = require('../data/catalog');

const SIZE_SETS = {
  newborn: ['0-3M', '3-6M', '6-9M', '9-12M'],
  toddler: ['1Y', '2Y', '3Y'],
  kids: ['4Y', '5Y', '6Y', '7Y', '8Y', '10Y', '12Y']
};
const LOW_STOCK = 5;

function buildStockBySize(p) {
  const sizes = (p.sizes && p.sizes.length) ? p.sizes : (SIZE_SETS[p.ageGroup] || SIZE_SETS.kids);
  const per = 12;
  const out = {};
  sizes.forEach((s) => { out[s] = per; });
  return out;
}

function totalStock(p) {
  if (p.stockBySize) return Object.values(p.stockBySize).reduce((s, n) => s + (Number(n) || 0), 0);
  return Number(p.stock) || 0;
}

let seeded = false;

async function ensureSeeded() {
  if (seeded) return;
  seeded = true;
  const list = await store.getAllProducts();
  if (list.length === 0) {
    for (const p of catalog.products) {
      const data = Object.assign({}, p, { stockBySize: buildStockBySize(p) });
      delete data.stock;
      delete data.id;
      await store.createProduct(data);
    }
  }
}

async function all() {
  await ensureSeeded();
  let list = await store.getAllProducts();

  // One-time migration: give every product per-size stock
  let changed = false;
  for (const p of list) {
    if (!p.stockBySize || typeof p.stockBySize !== 'object' || Object.keys(p.stockBySize).length === 0) {
      p.stockBySize = buildStockBySize(p);
      await store.updateProduct(p.id, { stockBySize: p.stockBySize, sizes: Object.keys(p.stockBySize) });
      changed = true;
    }
  }

  if (changed) {
    list = await store.getAllProducts();
  }
  return list;
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

async function byId(id) {
  await ensureSeeded();
  const p = await store.getProductById(Number(id));
  return p ? withImage(p) : null;
}

async function related(id, count = 4) {
  const p = await store.getProductById(Number(id));
  if (!p) return [];

  let list = await all();
  list = list.filter((x) => x.id !== p.id && (x.category === p.category || x.gender === p.gender))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, count)
    .map(withImage);
  return list;
}

async function mixmatch(gender) {
  const g = gender === 'boys' ? 'boys' : 'girls';
  const list = await all();
  const tops = list.filter((p) => p.mix === 'top' && (p.gender === g || p.gender === 'unisex')).map(withImage);
  const bottoms = list.filter((p) => p.mix === 'bottom' && (p.gender === g || p.gender === 'unisex')).map(withImage);
  return { gender: g, tops, bottoms };
}

function isMatch(top, bottom) {
  if (!top || !bottom) return false;
  return (top.matches || []).includes(bottom.palette) || (bottom.matches || []).includes(top.palette) || top.palette === bottom.palette;
}

function cleanStock(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    out[k] = Math.max(0, Math.floor(Number(v) || 0));
  }
  return out;
}

async function create(data) {
  const list = await all();
  const id = list.reduce((m, p) => Math.max(m, p.id || 0), 0) + 1;

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

  const created = await store.createProduct(p);
  return withImage(created);
}

async function update(id, data) {
  const p = await store.getProductById(Number(id));
  if (!p) return null;

  delete data.id;
  const merged = Object.assign({}, p, data);

  if (data.price) merged.price = Number(data.price);
  if (data.mrp) merged.mrp = Number(data.mrp);
  if (data.stockBySize && typeof data.stockBySize === 'object') {
    merged.stockBySize = cleanStock(data.stockBySize);
    merged.sizes = Object.keys(merged.stockBySize);
  }

  delete merged.stock;

  const updated = await store.updateProduct(Number(id), merged);
  return withImage(updated);
}

async function remove(id) {
  await store.deleteProduct(Number(id));
  return true;
}

async function checkAndDecrement(lines) {
  const list = await all();
  const find = (id) => list.find((x) => x.id === Number(id));

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

  await store.decrementStock(lines);
}

async function setSizeStock(id, size, qty) {
  const p = await store.getProductById(Number(id));
  if (!p) return null;

  const updated = await store.updateProductStockBySize(Number(id), size, qty);
  return withImage(updated);
}

async function stockAlerts() {
  const items = (await all()).map(withImage);
  const out = items.filter((p) => p.stock === 0)
    .map((p) => ({ id: p.id, name: p.name, image: p.image, sizes: p.sizes }));
  const low = items.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK)
    .map((p) => ({
      id: p.id, name: p.name, image: p.image, stock: p.stock,
      lowSizes: Object.entries(p.stockBySize || {}).filter(([, n]) => n > 0 && n <= 2).map(([s]) => s)
    }));
  return { out, low, outCount: out.length, lowCount: low.length };
}

module.exports = {
  all, query, byId, related, mixmatch, isMatch, create, update, remove, withImage,
  checkAndDecrement, setSizeStock, stockAlerts, SIZE_SETS, LOW_STOCK
};
