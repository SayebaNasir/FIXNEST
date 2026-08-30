const app = require('../server/index.js');

module.exports = (req, res) => {
  try {
    app(req, res);
  } catch (error) {
    console.error('Vercel Execution Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Serverless Function Error', message: error.message || String(error) });
    }
  }
};
