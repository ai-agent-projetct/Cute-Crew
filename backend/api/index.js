// Vercel serverless entry point for the standalone backend-only deployment.
// See ../../api/index.js — same reasoning: await the one-time (promise-cached)
// MySQL/TiDB store load before the Express app handles each request.
const app = require('../src/app');
const schema = require('../src/utils/schema');

module.exports = async (req, res) => {
  try {
    await schema.init();
  } catch (err) {
    console.error('Database connection failed:', err.message);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Database unavailable' }));
    return;
  }
  app(req, res);
};
