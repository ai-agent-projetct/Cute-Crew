const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const productService = require('../services/productService');
const heroService = require('../services/heroService');
const orderService = require('../services/orderService');
const authService = require('../services/authService');
const catalog = require('../data/catalog');

const router = express.Router();

// ---------- uploads (admin hero images -> 3D mockups) ----------
if (!fs.existsSync(config.uploadsDir)) fs.mkdirSync(config.uploadsDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, config.uploadsDir),
    filename: (req, file, cb) => {
      const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
      cb(null, `hero-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    }
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'].includes((path.extname(file.originalname) || '').toLowerCase());
    cb(ok ? null : new Error('Only image files are allowed'), ok);
  }
});

// ---------- catalog ----------
router.get('/products', (req, res) => res.json(productService.query(req.query)));
router.get('/products/:id', (req, res) => {
  const p = productService.byId(req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  res.json({ product: p, related: productService.related(p.id) });
});
router.get('/categories', (req, res) => res.json({ categories: catalog.categories, ages: catalog.ages }));

// ---------- mix & match ----------
router.get('/mixmatch', (req, res) => res.json(productService.mixmatch(req.query.gender)));

// ---------- hero (3D scrollable) ----------
router.get('/hero', (req, res) => res.json({ slides: heroService.slides() }));

// ---------- cart pricing / orders ----------
router.post('/cart/price', (req, res) => res.json(orderService.priceCart(req.body.items, req.body.coupon)));
// Ordering requires a customer profile (login) — the order is linked to the account.
router.post('/orders', requireAuth, (req, res, next) => {
  try {
    res.status(201).json(orderService.create(Object.assign({}, req.body, { user: req.user })));
  } catch (e) { next(e); }
});
// Logged-in customer's own order history
router.get('/my/orders', requireAuth, (req, res) => {
  res.json({ orders: orderService.all().filter((o) => o.user && o.user.id === req.user.id) });
});

// ---------- auth ----------
router.post('/auth/login', (req, res, next) => {
  try { res.json(authService.login(req.body.email, req.body.password)); } catch (e) { next(e); }
});
router.post('/auth/register', (req, res, next) => {
  try { res.status(201).json(authService.register(req.body)); } catch (e) { next(e); }
});

// ---------- admin ----------
router.get('/admin/stats', requireAdmin, (req, res) => {
  const orders = orderService.all();
  const revenue = orders.reduce((s, o) => s + (o.summary?.total || 0), 0);
  res.json({
    products: productService.all().length,
    orders: orders.length,
    revenue,
    heroImages: heroService.uploaded().length,
    recentOrders: orders.slice(0, 6),
    stockAlerts: productService.stockAlerts()
  });
});

// Live stock alerts (out-of-stock + low-stock) for the notification badge
router.get('/admin/stock-alerts', requireAdmin, (req, res) => res.json(productService.stockAlerts()));

// Quick set stock for one size (restock button)
router.patch('/admin/products/:id/stock', requireAdmin, (req, res) => {
  const p = productService.setSizeStock(req.params.id, req.body.size, req.body.qty);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  res.json(p);
});

router.post('/admin/hero', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image received' });
  res.status(201).json({ slides: heroService.add(req.file.filename, req.body.title) });
});
router.delete('/admin/hero/:file', requireAdmin, (req, res) => {
  res.json({ slides: heroService.remove(path.basename(req.params.file)) });
});

// Generic image upload (product photos etc.) — returns a URL to store on the product
router.post('/admin/upload', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image received' });
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

// ---------- admin: users ----------
router.get('/admin/users', requireAdmin, (req, res) => {
  const orders = orderService.all();
  const users = authService.listUsers().map((u) => Object.assign({}, u, {
    orders: orders.filter((o) => o.user && o.user.id === u.id).length,
    spent: orders.filter((o) => o.user && o.user.id === u.id).reduce((s, o) => s + (o.summary?.total || 0), 0)
  }));
  res.json({ users });
});
router.post('/admin/users', requireAdmin, (req, res, next) => {
  try { res.status(201).json(authService.createUser(req.body)); } catch (e) { next(e); }
});
router.put('/admin/users/:id', requireAdmin, (req, res, next) => {
  try {
    const u = authService.updateUser(req.params.id, req.body);
    if (!u) return res.status(404).json({ error: 'User not found' });
    res.json(u);
  } catch (e) { next(e); }
});
router.delete('/admin/users/:id', requireAdmin, (req, res, next) => {
  try {
    if (!authService.removeUser(req.params.id, req.user.id)) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post('/admin/products', requireAdmin, (req, res) => res.status(201).json(productService.create(req.body)));
router.put('/admin/products/:id', requireAdmin, (req, res) => {
  const p = productService.update(req.params.id, req.body);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  res.json(p);
});
router.delete('/admin/products/:id', requireAdmin, (req, res) => {
  productService.remove(req.params.id);
  res.json({ ok: true });
});

router.get('/admin/orders', requireAdmin, (req, res) => res.json({ orders: orderService.all() }));
router.patch('/admin/orders/:id', requireAdmin, (req, res) => {
  const o = orderService.updateStatus(req.params.id, req.body.status);
  if (!o) return res.status(404).json({ error: 'Order not found' });
  res.json(o);
});

module.exports = router;
