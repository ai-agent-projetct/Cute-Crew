const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../utils/mysql-db');
const config = require('../config');

function hash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${key}`;
}

function verify(password, stored) {
  const [salt, key] = String(stored).split(':');
  if (!salt || !key) return false;
  const test = crypto.scryptSync(password, salt, 32).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(test, 'hex'));
}

async function users() {
  return db.query('SELECT * FROM users ORDER BY id');
}

function sign(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiry
  });
}

async function login(email, password) {
  const list = await users();
  const u = list.find((x) => x.email.toLowerCase() === String(email || '').toLowerCase());
  if (!u || !verify(password || '', u.password)) {
    throw Object.assign(new Error('Invalid email or password'), { status: 401 });
  }
  return { token: sign(u), user: { id: u.id, email: u.email, name: u.name, role: u.role } };
}

async function register({ name, email, password }) {
  if (!name || !email || !password || password.length < 6) {
    throw Object.assign(new Error('Name, email and a password of 6+ characters are required'), { status: 400 });
  }
  const list = await users();
  if (list.some((x) => x.email.toLowerCase() === email.toLowerCase())) {
    throw Object.assign(new Error('An account with this email already exists'), { status: 409 });
  }
  const result = await db.query(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, hash(password), 'customer']
  );
  const u = { id: result.insertId, email, name, role: 'customer' };
  return { token: sign(u), user: u };
}

// ---------- admin user management ----------
function sanitize(u) {
  return { id: u.id, email: u.email, name: u.name, role: u.role, createdAt: u.createdAt || null };
}

async function listUsers() {
  return (await users()).map(sanitize);
}

async function createUser({ name, email, password, role }) {
  const { user } = await register({ name, email, password });
  if (role === 'admin') return updateUser(user.id, { role: 'admin' });
  return user;
}

async function updateUser(id, { name, role, password }) {
  const list = await users();
  const u = list.find((x) => x.id === Number(id));
  if (!u) return null;
  if (name) u.name = name;
  if (role && ['admin', 'customer'].includes(role)) {
    if (u.role === 'admin' && role !== 'admin' && list.filter((x) => x.role === 'admin').length === 1) {
      throw Object.assign(new Error('Cannot demote the only admin'), { status: 400 });
    }
    u.role = role;
  }
  if (password) {
    if (password.length < 6) throw Object.assign(new Error('Password must be 6+ characters'), { status: 400 });
    u.password = hash(password);
  }
  await db.query('UPDATE users SET name = ?, role = ?, password = ? WHERE id = ?', [u.name, u.role, u.password, u.id]);
  return sanitize(u);
}

async function removeUser(id, actingId) {
  const list = await users();
  const u = list.find((x) => x.id === Number(id));
  if (!u) return false;
  if (u.id === Number(actingId)) throw Object.assign(new Error('You cannot delete your own account'), { status: 400 });
  if (u.role === 'admin' && list.filter((x) => x.role === 'admin').length === 1) {
    throw Object.assign(new Error('Cannot delete the only admin'), { status: 400 });
  }
  await db.query('DELETE FROM users WHERE id = ?', [u.id]);
  return true;
}

module.exports = { login, register, listUsers, createUser, updateUser, removeUser };
