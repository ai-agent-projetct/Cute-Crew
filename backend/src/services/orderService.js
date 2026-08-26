const store = require('../utils/store');
const productService = require('./productService');

const COUPONS = { WELCOME10: 0.10, CREW20: 0.20 };

function all() {
  return store.read('orders', []);
}

function priceCart(items, couponCode) {
  let mrpTotal = 0;
  let subtotal = 0;
  const lines = [];
  for (const it of items || []) {
    const p = productService.byId(it.id);
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

function create({ items, coupon, customer, payment, user }) {
  const summary = priceCart(items, coupon);
  if (!summary.lines.length) throw Object.assign(new Error('Cart is empty'), { status: 400 });
  if (!customer || !customer.name || !customer.phone || !customer.address) {
    throw Object.assign(new Error('Name, phone and address are required'), { status: 400 });
  }
  // reserve stock — throws (409) if any size is out of stock, otherwise decrements it
  productService.checkAndDecrement(summary.lines);
  const orders = all().slice();
  const order = {
    id: 'CC' + Date.now().toString(36).toUpperCase(),
    at: new Date().toISOString(),
    status: 'placed',
    payment: payment === 'cod' ? 'cod' : payment || 'cod',
    user: user ? { id: user.id, email: user.email, name: user.name } : null,
    customer,
    summary
  };
  orders.unshift(order);
  store.write('orders', orders);
  return order;
}

function updateStatus(id, status) {
  const orders = all().slice();
  const o = orders.find((x) => x.id === id);
  if (!o) return null;
  o.status = status;
  store.write('orders', orders);
  return o;
}

module.exports = { all, priceCart, create, updateStatus, COUPONS };
