const path = require('path');

module.exports = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || 'cute-crew-dev-secret-change-in-production',
  jwtExpiry: '7d',
  dataDir: path.join(__dirname, 'data', 'db'),
  uploadsDir: path.join(__dirname, '..', 'uploads'),
  frontendDir: path.join(__dirname, '..', '..', 'frontend'),
  admin: { email: 'admin', password: 'admin123', name: 'Store Admin', role: 'admin' },
  mysql: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cute_crew',
    // TiDB Cloud / other managed MySQL need TLS; a bare local install doesn't.
    ssl: process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined
  }
};
