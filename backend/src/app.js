const express = require('express');
const cors = require('cors');
const config = require('./config');
const apiRoutes = require('./routes/api');
const imageRoutes = require('./routes/images');

const app = express();

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
// changes immediately (ETags make revalidation cheap).
// Product photography under img/real/ gets the same treatment: the image pipeline
// rewrites those files IN PLACE (backdrop swaps, re-mattes) while the filename
// stays put, so a long max-age would serve stale artwork for a day. Revalidation
// still 304s when nothing changed, so this costs a header round-trip, not bytes.
// Everything else (logo, favicon, video) is versioned with ?v=N and can cache hard.
app.use(express.static(config.frontendDir, {
  extensions: ['html'],
  etag: true,
  setHeaders(res, filePath) {
    if (/\.(html|js|css|json)$/i.test(filePath) || /[\\/]img[\\/]real[\\/]/i.test(filePath)) {
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
