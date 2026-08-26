const path = require('path');

module.exports = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || 'cute-crew-dev-secret-change-in-production',
  jwtExpiry: '7d',
  dataDir: path.join(__dirname, 'data', 'db'),
  uploadsDir: path.join(__dirname, '..', 'uploads'),
  frontendDir: path.join(__dirname, '..', '..', 'frontend'),
  admin: { email: 'admin', password: 'admin123', name: 'Store Admin', role: 'admin' }
};
