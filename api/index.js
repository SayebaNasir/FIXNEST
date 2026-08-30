const app = require('../server/index.js');

module.exports = (req, res) => {
  try {
    return app(req, res);
  } catch (err) {
    console.error('Serverless Function Error:', err);
    res.status(500).json({ error: 'Serverless Function Execution Failed', details: err.message });
  }
};
