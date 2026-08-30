const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const providerRoutes = require('../server/routes/providers');
const bookingRoutes = require('../server/routes/bookings');
const authRoutes = require('../server/routes/auth');
const geocodeRoutes = require('../server/routes/geocode');
const analyticsRoutes = require('../server/routes/analytics');
const paymentRoutes = require('../server/routes/payment');
const subscriptionRoutes = require('../server/routes/subscription');
const messageRoutes = require('../server/routes/messages');

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

app.use('/api/providers', providerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/messages', messageRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
});

module.exports = (req, res) => {
  return app(req, res);
};
