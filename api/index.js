// Vercel serverless entry point — the Express app is normally handed to Vercel's
// Node runtime directly as a (req, res) handler, but the store needs its one-time
// MySQL/TiDB load (see store.init()) to finish first. init() is promise-cached, so
// this await is instant on every invocation after a container's first cold start.
const app = require('../backend/src/app');
const schema = require('../backend/src/utils/schema');

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
