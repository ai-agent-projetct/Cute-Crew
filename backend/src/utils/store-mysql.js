// MySQL-based persistence layer (replaces store.js)
// Same interface as JSON store — services don't need to change
const db = require('./mysql-db');

// mysql2 auto-parses JSON columns into objects/arrays already; only parse if we got a raw string
function asJson(v, fallback) {
  if (v == null) return fallback;
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch { return fallback; }
  }
  return v;
}

// ==================== PRODUCTS ====================

async function getProductById(id) {
  const result = await db.queryOne('SELECT * FROM products WHERE id = ?', [id]);
  if (result) {
    result.sizes = asJson(result.sizes, []);
    result.matches = asJson(result.matches, []);
    result.stockBySize = asJson(result.stockBySize, {});
  }
  return result;
}

async function getAllProducts() {
  const results = await db.query('SELECT * FROM products ORDER BY id');
  return results.map(p => ({
    ...p,
    sizes: asJson(p.sizes, []),
    matches: asJson(p.matches, []),
    stockBySize: asJson(p.stockBySize, {})
  }));
}

async function createProduct(data) {
  const sizes = JSON.stringify(data.sizes || []);
  const matches = JSON.stringify(data.matches || []);
  const stockBySize = JSON.stringify(data.stockBySize || {});
  const n = (v) => (v === undefined ? null : v);

  const result = await db.query(
    `INSERT INTO products (name, gender, ageGroup, category, type, color, hex, accent, motif,
     price, mrp, rating, ratings, badge, mix, palette, material, description, photo,
     photoCut, spotlight, sizes, matches, stockBySize)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      n(data.name), n(data.gender), n(data.ageGroup), n(data.category), n(data.type), n(data.color), n(data.hex),
      n(data.accent), n(data.motif), n(data.price), n(data.mrp), n(data.rating), data.ratings || 0, n(data.badge),
      n(data.mix), n(data.palette), n(data.material), n(data.description), n(data.photo), n(data.photoCut),
      data.spotlight || false, sizes, matches, stockBySize
    ]
  );

  return getProductById(result.insertId);
}

async function updateProduct(id, data) {
  const product = await getProductById(id);
  if (!product) return null;

  const updated = { ...product, ...data };
  const sizes = JSON.stringify(updated.sizes || []);
  const matches = JSON.stringify(updated.matches || []);
  const stockBySize = JSON.stringify(updated.stockBySize || {});
  const n = (v) => (v === undefined ? null : v);

  await db.query(
    `UPDATE products SET name = ?, gender = ?, ageGroup = ?, category = ?, type = ?,
     color = ?, hex = ?, accent = ?, motif = ?, price = ?, mrp = ?, rating = ?,
     ratings = ?, badge = ?, mix = ?, palette = ?, material = ?, description = ?,
     photo = ?, photoCut = ?, spotlight = ?, sizes = ?, matches = ?, stockBySize = ?
     WHERE id = ?`,
    [
      n(updated.name), n(updated.gender), n(updated.ageGroup), n(updated.category), n(updated.type),
      n(updated.color), n(updated.hex), n(updated.accent), n(updated.motif), n(updated.price), n(updated.mrp),
      n(updated.rating), n(updated.ratings), n(updated.badge), n(updated.mix), n(updated.palette),
      n(updated.material), n(updated.description), n(updated.photo), n(updated.photoCut),
      updated.spotlight || false, sizes, matches, stockBySize, id
    ]
  );

  return getProductById(id);
}

async function deleteProduct(id) {
  await db.query('DELETE FROM products WHERE id = ?', [id]);
  return true;
}

async function updateProductStockBySize(id, size, qty) {
  const product = await getProductById(id);
  if (!product) return null;

  product.stockBySize[size] = Math.max(0, Math.floor(Number(qty) || 0));
  if (!product.sizes.includes(size)) {
    product.sizes.push(size);
  }

  await db.query(
    'UPDATE products SET stockBySize = ?, sizes = ? WHERE id = ?',
    [JSON.stringify(product.stockBySize), JSON.stringify(product.sizes), id]
  );

  return getProductById(id);
}

async function decrementStock(lines) {
  // lines: [{ id, size, qty }]
  for (const line of lines) {
    const product = await getProductById(line.id);
    if (!product) throw new Error(`Product ${line.id} not found`);

    const avail = product.stockBySize[line.size] || 0;
    if (avail < line.qty) {
      throw Object.assign(
        new Error(`Sorry, "${product.name}" in size ${line.size || '—'} is out of stock (only ${avail} left)`),
        { status: 409 }
      );
    }
  }

  // Decrement all
  for (const line of lines) {
    const product = await getProductById(line.id);
    product.stockBySize[line.size] = Math.max(0, (product.stockBySize[line.size] || 0) - line.qty);
    await db.query(
      'UPDATE products SET stockBySize = ? WHERE id = ?',
      [JSON.stringify(product.stockBySize), line.id]
    );
  }
}

// ==================== USERS ====================

async function getAllUsers() {
  return db.query('SELECT * FROM users ORDER BY id');
}

async function getUserByEmail(email) {
  return db.queryOne('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
}

async function getUserById(id) {
  return db.queryOne('SELECT * FROM users WHERE id = ?', [id]);
}

async function createUser(data) {
  const result = await db.query(
    'INSERT INTO users (email, name, password, role, createdAt) VALUES (?, ?, ?, ?, NOW())',
    [data.email, data.name, data.password, data.role || 'customer']
  );
  return getUserById(result.insertId);
}

async function updateUser(id, data) {
  const fields = [];
  const values = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.role !== undefined) { fields.push('role = ?'); values.push(data.role); }
  if (data.password !== undefined) { fields.push('password = ?'); values.push(data.password); }

  if (fields.length === 0) return getUserById(id);

  values.push(id);
  await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  return getUserById(id);
}

async function deleteUser(id) {
  await db.query('DELETE FROM users WHERE id = ?', [id]);
  return true;
}

// ==================== ORDERS ====================

async function getAllOrders() {
  const results = await db.query('SELECT * FROM orders ORDER BY createdAt DESC');
  return results.map(o => ({
    ...o,
    items: asJson(o.items, []),
    summary: asJson(o.summary, {}),
    customer: {
      name: o.customerName,
      email: o.customerEmail,
      phone: o.customerPhone,
      address: o.customerAddress
    },
    user: o.userId ? { id: o.userId } : null
  }));
}

async function getOrderById(id) {
  const result = await db.queryOne('SELECT * FROM orders WHERE id = ?', [id]);
  if (result) {
    return {
      ...result,
      items: asJson(result.items, []),
      summary: asJson(result.summary, {}),
      customer: {
        name: result.customerName,
        email: result.customerEmail,
        phone: result.customerPhone,
        address: result.customerAddress
      },
      user: result.userId ? { id: result.userId } : null
    };
  }
  return null;
}

function toMysqlDatetime(isoString) {
  return new Date(isoString).toISOString().slice(0, 19).replace('T', ' ');
}

async function createOrder(data) {
  const { id, at, status, payment, user, customer, summary } = data;

  await db.query(
    `INSERT INTO orders (id, userId, status, payment, customerName, customerEmail,
     customerPhone, customerAddress, items, summary, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      user?.id || null,
      status,
      payment,
      customer.name,
      customer.email || null,
      customer.phone,
      customer.address,
      JSON.stringify(summary.lines || []),
      JSON.stringify(summary),
      toMysqlDatetime(at)
    ]
  );

  return getOrderById(id);
}

async function updateOrderStatus(id, status) {
  await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
  return getOrderById(id);
}

// ==================== HERO SLIDES ====================

async function getHeroSlides() {
  return db.query('SELECT * FROM hero_slides ORDER BY createdAt DESC');
}

async function addHeroSlide(file, title) {
  await db.query(
    'INSERT INTO hero_slides (file, title, uploaded, createdAt) VALUES (?, ?, TRUE, NOW())',
    [file, title || '']
  );
}

async function removeHeroSlide(file) {
  await db.query('DELETE FROM hero_slides WHERE file = ?', [file]);
}

module.exports = {
  // Products
  getProductById,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStockBySize,
  decrementStock,
  // Users
  getAllUsers,
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  // Orders
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  // Hero
  getHeroSlides,
  addHeroSlide,
  removeHeroSlide
};
