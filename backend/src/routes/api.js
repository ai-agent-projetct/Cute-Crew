const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const productService = require('../services/productService');
const heroService = require('../services/heroService');
const orderService = require('../services/orderService');
const authService = require('../services/authService');
const catalog = require('../data/catalog');
const { upload, storeFile } = require('../utils/uploads');

const router = express.Router();

// ---------- catalog ----------
router.get('/products', async (req, res, next) => {
  try { res.json(await productService.query(req.query)); } catch (e) { next(e); }
});
router.get('/products/:id', async (req, res, next) => {
  try {
    const p = await productService.byId(req.params.id);
    if (!p) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: p, related: await productService.related(p.id) });
  } catch (e) { next(e); }
});
router.get('/categories', (req, res) => res.json({ categories: catalog.categories, ages: catalog.ages }));

// ---------- mix & match ----------
router.get('/mixmatch', async (req, res, next) => {
  try { res.json(await productService.mixmatch(req.query.gender)); } catch (e) { next(e); }
});

// ---------- hero (3D scrollable) ----------
router.get('/hero', async (req, res, next) => {
  try { res.json({ slides: await heroService.slides() }); } catch (e) { next(e); }
});

// ---------- cart pricing / orders ----------
router.post('/cart/price', async (req, res, next) => {
  try { res.json(await orderService.priceCart(req.body.items, req.body.coupon)); } catch (e) { next(e); }
});
// Ordering requires a customer profile (login) — the order is linked to the account.
router.post('/orders', requireAuth, async (req, res, next) => {
  try {
    const order = await orderService.create(Object.assign({}, req.body, { user: req.user }));
    res.status(201).json(order);
  } catch (e) { next(e); }
});
// Logged-in customer's own order history
router.get('/my/orders', requireAuth, async (req, res, next) => {
  try {
    const orders = await orderService.all();
    res.json({ orders: orders.filter((o) => o.user && o.user.id === req.user.id) });
  } catch (e) { next(e); }
});

// ---------- auth ----------
router.post('/auth/login', async (req, res, next) => {
  try { res.json(await authService.login(req.body.email, req.body.password)); } catch (e) { next(e); }
});
router.post('/auth/register', async (req, res, next) => {
  try { res.status(201).json(await authService.register(req.body)); } catch (e) { next(e); }
});

// ---------- admin ----------
router.get('/admin/stats', requireAdmin, async (req, res, next) => {
  try {
    const orders = await orderService.all();
    const revenue = orders.reduce((s, o) => s + (o.summary?.total || 0), 0);
    const products = await productService.all();
    const heroImages = await heroService.uploaded();
    res.json({
      products: products.length,
      orders: orders.length,
      revenue,
      heroImages: heroImages.length,
      recentOrders: orders.slice(0, 6),
      stockAlerts: await productService.stockAlerts()
    });
  } catch (e) { next(e); }
});

// Live stock alerts (out-of-stock + low-stock) for the notification badge
router.get('/admin/stock-alerts', requireAdmin, async (req, res, next) => {
  try { res.json(await productService.stockAlerts()); } catch (e) { next(e); }
});

// Quick set stock for one size (restock button)
router.patch('/admin/products/:id/stock', requireAdmin, async (req, res, next) => {
  try {
    const p = await productService.setSizeStock(req.params.id, req.body.size, req.body.qty);
    if (!p) return res.status(404).json({ error: 'Product not found' });
    res.json(p);
  } catch (e) { next(e); }
});

router.post('/admin/hero', requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image received' });
    const url = await storeFile(req.file, 'hero');
    res.status(201).json({ slides: await heroService.add(url, req.body.title) });
  } catch (e) { next(e); }
});
router.delete('/admin/hero/:file', requireAdmin, async (req, res, next) => {
  try {
    // `file` is the exact value stored on the hero_slides row (either `/uploads/xxx`
    // or a full Blob URL) — pass it through as-is so it matches on delete.
    res.json({ slides: await heroService.remove(decodeURIComponent(req.params.file)) });
  } catch (e) { next(e); }
});

// Generic image upload (product photos etc.) — returns a URL to store on the product
router.post('/admin/upload', requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image received' });
    res.status(201).json({ url: await storeFile(req.file, 'product') });
  } catch (e) { next(e); }
});

// ---------- admin: users ----------
router.get('/admin/users', requireAdmin, async (req, res, next) => {
  try {
    const orders = await orderService.all();
    const userList = await authService.listUsers();
    const users = userList.map((u) => Object.assign({}, u, {
      orders: orders.filter((o) => o.user && o.user.id === u.id).length,
      spent: orders.filter((o) => o.user && o.user.id === u.id).reduce((s, o) => s + (o.summary?.total || 0), 0)
    }));
    res.json({ users });
  } catch (e) { next(e); }
});
router.post('/admin/users', requireAdmin, async (req, res, next) => {
  try { res.status(201).json(await authService.createUser(req.body)); } catch (e) { next(e); }
});
router.put('/admin/users/:id', requireAdmin, async (req, res, next) => {
  try {
    const u = await authService.updateUser(req.params.id, req.body);
    if (!u) return res.status(404).json({ error: 'User not found' });
    res.json(u);
  } catch (e) { next(e); }
});
router.delete('/admin/users/:id', requireAdmin, async (req, res, next) => {
  try {
    const removed = await authService.removeUser(req.params.id, req.user.id);
    if (!removed) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post('/admin/products', requireAdmin, async (req, res, next) => {
  try { res.status(201).json(await productService.create(req.body)); } catch (e) { next(e); }
});
router.put('/admin/products/:id', requireAdmin, async (req, res, next) => {
  try {
    const p = await productService.update(req.params.id, req.body);
    if (!p) return res.status(404).json({ error: 'Product not found' });
    res.json(p);
  } catch (e) { next(e); }
});
router.delete('/admin/products/:id', requireAdmin, async (req, res, next) => {
  try {
    await productService.remove(req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get('/admin/orders', requireAdmin, async (req, res, next) => {
  try { res.json({ orders: await orderService.all() }); } catch (e) { next(e); }
});
router.patch('/admin/orders/:id', requireAdmin, async (req, res, next) => {
  try {
    const o = await orderService.updateStatus(req.params.id, req.body.status);
    if (!o) return res.status(404).json({ error: 'Order not found' });
    res.json(o);
  } catch (e) { next(e); }
});

module.exports = router;
