const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const store = require('../utils/store');
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

function users() {
  return store.read('users', () => [
    { id: 1, email: config.admin.email, name: config.admin.name, role: 'admin', password: hash(config.admin.password) }
  ]);
}

function sign(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiry
  });
}

function login(email, password) {
  const u = users().find((x) => x.email.toLowerCase() === String(email || '').toLowerCase());
  if (!u || !verify(password || '', u.password)) {
    throw Object.assign(new Error('Invalid email or password'), { status: 401 });
  }
  return { token: sign(u), user: { id: u.id, email: u.email, name: u.name, role: u.role } };
}

function register({ name, email, password }) {
  if (!name || !email || !password || password.length < 6) {
    throw Object.assign(new Error('Name, email and a password of 6+ characters are required'), { status: 400 });
  }
  const list = users().slice();
  if (list.some((x) => x.email.toLowerCase() === email.toLowerCase())) {
    throw Object.assign(new Error('An account with this email already exists'), { status: 409 });
  }
  const u = { id: list.reduce((m, x) => Math.max(m, x.id), 0) + 1, email, name, role: 'customer', password: hash(password), createdAt: new Date().toISOString() };
  list.push(u);
  store.write('users', list);
  return { token: sign(u), user: { id: u.id, email: u.email, name: u.name, role: u.role } };
}

// ---------- admin user management ----------
function sanitize(u) {
  return { id: u.id, email: u.email, name: u.name, role: u.role, createdAt: u.createdAt || null };
}

function listUsers() {
  return users().map(sanitize);
}

function createUser({ name, email, password, role }) {
  const { user } = register({ name, email, password });
  if (role === 'admin') return updateUser(user.id, { role: 'admin' });
  return user;
}

function updateUser(id, { name, role, password }) {
  const list = users().slice();
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
  store.write('users', list);
  return sanitize(u);
}

function removeUser(id, actingId) {
  const list = users().slice();
  const u = list.find((x) => x.id === Number(id));
  if (!u) return false;
  if (u.id === Number(actingId)) throw Object.assign(new Error('You cannot delete your own account'), { status: 400 });
  if (u.role === 'admin' && list.filter((x) => x.role === 'admin').length === 1) {
    throw Object.assign(new Error('Cannot delete the only admin'), { status: 400 });
  }
  store.write('users', list.filter((x) => x.id !== u.id));
  return true;
}

module.exports = { login, register, listUsers, createUser, updateUser, removeUser };
