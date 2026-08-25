// Vercel serverless entry point — Express app is exported directly,
// Vercel's Node runtime treats it as a (req, res) handler.
module.exports = require('../backend/src/app');
