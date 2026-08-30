const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dns = require('dns');
require('dotenv').config();

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const providerRoutes = require('./routes/providers');
const bookingRoutes = require('./routes/bookings');
const authRoutes = require('./routes/auth');
const geocodeRoutes = require('./routes/geocode');
const analyticsRoutes = require('./routes/analytics');
const paymentRoutes = require('./routes/payment');
const subscriptionRoutes = require('./routes/subscription');
const messageRoutes = require('./routes/messages');
const initSocket = require('./socket');
const app = express();
const httpServer = http.createServer(app);
if (!process.env.VERCEL) {
  initSocket(httpServer);
}
const PORT = process.env.PORT || 5001;
const fallbackMongoURI = 'mongodb+srv://fixnestAdmin:123fixnest@cluster0.q7gvbmz.mongodb.net/fixnest?appName=Cluster0';

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.) or allowed origins
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive CORS for deployed Vercel previews
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
}));

app.use(express.json());

// Connect to MongoDB (reusing active connection if present)
let isConnected = false;
const tryConnectMongo = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  const rawCandidates = [process.env.MONGO_URI, fallbackMongoURI].filter(Boolean);
  // On Vercel serverless environment, filter out localhost / 127.0.0.1 URIs
  const candidates = process.env.VERCEL
    ? rawCandidates.filter(uri => !uri.includes('127.0.0.1') && !uri.includes('localhost'))
    : rawCandidates;

  if (candidates.length === 0) {
    candidates.push(fallbackMongoURI);
  }

  let lastError = null;

  for (const uri of candidates) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        family: 4
      });
      isConnected = true;
      console.log(`Connected to MongoDB at ${uri}`);
      return uri;
    } catch (error) {
      lastError = error;
      console.warn(`Failed to connect to MongoDB at ${uri}:`, error.message);
    }
  }

  throw lastError;
};

// Ensure MongoDB is connected before handling any API route requests
app.use(async (req, res, next) => {
  try {
    await tryConnectMongo();
    next();
  } catch (err) {
    console.error('MongoDB Connection Middleware Error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Routes
app.use('/api/providers', providerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/messages', messageRoutes);

if (!process.env.VERCEL) {
  // Standalone server mode (Local / VPS)
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;


