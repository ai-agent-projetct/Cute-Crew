// Vercel serverless entry point for the standalone backend-only deployment.
// The Express app is exported directly — Vercel's Node runtime treats it as a (req, res) handler.
module.exports = require('../src/app');
