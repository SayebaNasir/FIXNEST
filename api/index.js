const express = require('express');
const app = express();

app.get('/api/providers', (req, res) => {
  res.json({ message: "Express serverless working on Vercel!" });
});

module.exports = app;
