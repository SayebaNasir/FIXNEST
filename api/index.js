let app;
let initError = null;

try {
  app = require('../server/index.js');
} catch (err) {
  initError = err;
}

module.exports = (req, res) => {
  if (initError) {
    return res.status(500).json({
      error: 'Serverless Function Init Failed',
      message: initError.message,
      stack: initError.stack
    });
  }
  return app(req, res);
};
