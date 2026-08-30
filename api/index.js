const app = require('../server/index.js');

module.exports = async (req, res) => {
  try {
    await app(req, res);
  } catch (err) {
    console.error('Serverless Function Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Serverless Function Execution Failed', details: err.message || String(err) });
    }
  }
};
