const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const store = require('../utils/store-mysql');
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

async function ensureAdminExists() {
  const admin = await store.getUserByEmail(config.admin.email);
  if (!admin) {
    await store.createUser({
      email: config.admin.email,
      name: config.admin.name,
      password: hash(config.admin.password),
      role: 'admin'
    });
  }
}

function sign(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiry
  });
}

async function login(email, password) {
  await ensureAdminExists();
  const u = await store.getUserByEmail(email);
  if (!u || !verify(password || '', u.password)) {
    throw Object.assign(new Error('Invalid email or password'), { status: 401 });
  }
  return { token: sign(u), user: { id: u.id, email: u.email, name: u.name, role: u.role } };
}

async function register({ name, email, password }) {
  if (!name || !email || !password || password.length < 6) {
    throw Object.assign(new Error('Name, email and a password of 6+ characters are required'), { status: 400 });
  }

  const existing = await store.getUserByEmail(email);
  if (existing) {
    throw Object.assign(new Error('An account with this email already exists'), { status: 409 });
  }

  const u = await store.createUser({
    email,
    name,
    password: hash(password),
    role: 'customer'
  });

  return { token: sign(u), user: { id: u.id, email: u.email, name: u.name, role: u.role } };
}

// ---------- admin user management ----------
function sanitize(u) {
  return { id: u.id, email: u.email, name: u.name, role: u.role, createdAt: u.createdAt || null };
}

async function listUsers() {
  const users = await store.getAllUsers();
  return users.map(sanitize);
}

async function createUser({ name, email, password, role }) {
  const { user } = await register({ name, email, password });
  if (role === 'admin') return updateUser(user.id, { role: 'admin' });
  return user;
}

async function updateUser(id, { name, role, password }) {
  const u = await store.getUserById(Number(id));
  if (!u) return null;

  const updates = {};
  if (name) updates.name = name;

  if (role && ['admin', 'customer'].includes(role)) {
    if (u.role === 'admin' && role !== 'admin') {
      const allUsers = await store.getAllUsers();
      const adminCount = allUsers.filter(x => x.role === 'admin').length;
      if (adminCount === 1) {
        throw Object.assign(new Error('Cannot demote the only admin'), { status: 400 });
      }
    }
    updates.role = role;
  }

  if (password) {
    if (password.length < 6) throw Object.assign(new Error('Password must be 6+ characters'), { status: 400 });
    updates.password = hash(password);
  }

  const updated = await store.updateUser(Number(id), updates);
  return sanitize(updated);
}

async function removeUser(id, actingId) {
  const u = await store.getUserById(Number(id));
  if (!u) return false;

  if (u.id === Number(actingId)) throw Object.assign(new Error('You cannot delete your own account'), { status: 400 });

  if (u.role === 'admin') {
    const allUsers = await store.getAllUsers();
    const adminCount = allUsers.filter(x => x.role === 'admin').length;
    if (adminCount === 1) {
      throw Object.assign(new Error('Cannot delete the only admin'), { status: 400 });
    }
  }

  await store.deleteUser(Number(id));
  return true;
}

module.exports = { login, register, listUsers, createUser, updateUser, removeUser };
