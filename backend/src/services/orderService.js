const db = require('../utils/mysql-db');
const productService = require('./productService');
const mixmatchService = require('./mixmatchService');

const COUPONS = { WELCOME10: 0.10, CREW20: 0.20 };

function asJson(v, fallback) {
  if (v == null) return fallback;
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch { return fallback; }
  }
  return v;
}

function fromRow(row) {
  return {
    id: row.id,
    at: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    status: row.status,
    payment: row.payment,
    user: row.userId ? { id: row.userId, name: row.userName, email: row.userEmail } : null,
    customer: { name: row.customerName, phone: row.customerPhone, address: row.customerAddress },
    summary: asJson(row.summary, {})
  };
}

async function all() {
  const rows = await db.query('SELECT * FROM orders ORDER BY createdAt DESC');
  return rows.map(fromRow);
}

// Product ids and Mix & Match ids live in separate, non-overlapping id spaces
// (see mixmatchService's ID_FLOOR), so a cart/order line only needs the id —
// this resolves which table actually owns it.
function findItem(id) {
  return productService.byId(id).then((p) => {
    if (p) return { item: p, service: productService };
    return mixmatchService.byId(id).then((m) => (m ? { item: m, service: mixmatchService } : null));
  });
}

async function priceCart(items, couponCode) {
  let mrpTotal = 0;
  let subtotal = 0;
  const lines = [];
  for (const it of items || []) {
    const found = await findItem(it.id);
    const p = found && found.item;
    if (!p) continue;
    const qty = Math.max(1, Math.min(10, Number(it.qty) || 1));
    lines.push({ id: p.id, name: p.name, image: p.image, color: p.color, size: it.size || p.sizes[0], qty, price: p.price, mrp: p.mrp });
    subtotal += p.price * qty;
    mrpTotal += p.mrp * qty;
  }
  const couponPct = COUPONS[(couponCode || '').toUpperCase()] || 0;
  const couponOff = Math.round(subtotal * couponPct);
  const shipping = subtotal - couponOff >= 999 || subtotal === 0 ? 0 : 79;
  const total = subtotal - couponOff + shipping;
  return {
    lines, mrpTotal, subtotal,
    bagDiscount: mrpTotal - subtotal,
    coupon: couponPct ? (couponCode || '').toUpperCase() : null,
    couponOff, shipping, total,
    rewardPoints: Math.floor(total / 100) * 5
  };
}

async function create({ items, coupon, customer, payment, user }) {
  const summary = await priceCart(items, coupon);
  if (!summary.lines.length) throw Object.assign(new Error('Cart is empty'), { status: 400 });
  if (!customer || !customer.name || !customer.phone || !customer.address) {
    throw Object.assign(new Error('Name, phone and address are required'), { status: 400 });
  }

  // Reserve stock — throws (409) if any size is out of stock, otherwise decrements it.
  // Lines can belong to either table, so group by owner and decrement each group.
  const groups = new Map();
  for (const l of summary.lines) {
    const found = await findItem(l.id);
    if (!found) throw Object.assign(new Error('A product in your bag is no longer available'), { status: 409 });
    if (!groups.has(found.service)) groups.set(found.service, []);
    groups.get(found.service).push(l);
  }
  for (const [service, groupLines] of groups) await service.checkAndDecrement(groupLines);

  const id = 'CC' + Date.now().toString(36).toUpperCase();
  await db.query(
    `INSERT INTO orders (id, status, payment, userId, userName, userEmail,
     customerName, customerPhone, customerAddress, summary)
     VALUES (?, 'placed', ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, payment === 'cod' ? 'cod' : payment || 'cod',
      user ? user.id : null, user ? user.name : null, user ? user.email : null,
      customer.name, customer.phone, customer.address,
      JSON.stringify(summary)
    ]
  );
  const row = await db.queryOne('SELECT * FROM orders WHERE id = ?', [id]);
  return fromRow(row);
}

async function updateStatus(id, status) {
  const row = await db.queryOne('SELECT * FROM orders WHERE id = ?', [id]);
  if (!row) return null;
  await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
  return fromRow(Object.assign({}, row, { status }));
}

module.exports = { all, priceCart, create, updateStatus, COUPONS };
