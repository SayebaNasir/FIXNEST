const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const providerRoutes = require('../server/routes/providers');

const app = express();
const fallbackMongoURI = 'mongodb+srv://fixnestAdmin:123fixnest@cluster0.q7gvbmz.mongodb.net/fixnest?appName=Cluster0';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

let isConnected = false;
const tryConnectMongo = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }
  const mongoURI = (process.env.MONGO_URI && !process.env.MONGO_URI.includes('127.0.0.1'))
    ? process.env.MONGO_URI
    : fallbackMongoURI;
    
  await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });
  isConnected = true;
};

app.use(async (req, res, next) => {
  try {
    await tryConnectMongo();
    next();
  } catch (err) {
    console.error('MongoDB Serverless Connection Error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Match both /api/providers and / (since Vercel invokes api/providers.js directly)
app.use('/api/providers', providerRoutes);
app.use('/', providerRoutes);

module.exports = app;
