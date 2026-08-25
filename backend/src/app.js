const express = require('express');
const cors = require('cors');
const config = require('./config');
const apiRoutes = require('./routes/api');
const imageRoutes = require('./routes/images');
const db = require('./utils/mysql-db');

const app = express();

// Initialize MySQL database on startup
db.initDb().catch(err => {
  console.error('Failed to initialize database:', err.message);
  process.exit(1);
});

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// APIs
app.use('/api', apiRoutes);
app.use('/img', imageRoutes);

// Admin-uploaded hero images
app.use('/uploads', express.static(config.uploadsDir, { maxAge: '1d' }));

// Frontend (static).
// HTML/JS/CSS are served with no-cache so browsers always revalidate and pick up
// changes immediately (ETags make revalidation cheap). Images/videos keep a long
// cache because their URLs are versioned (?v=N) when they change.
app.use(express.static(config.frontendDir, {
  extensions: ['html'],
  etag: true,
  setHeaders(res, filePath) {
    if (/\.(html|js|css|json)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// 404 for unknown API routes
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Central error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'Something went wrong' });
});

module.exports = app;
