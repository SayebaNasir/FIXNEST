const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

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
initSocket(httpServer);
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

// Routes
app.use('/api/providers', providerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/messages', messageRoutes);

// Connect to MongoDB (reusing active connection if present)
let isConnected = false;
const tryConnectMongo = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  const candidates = [process.env.MONGO_URI, fallbackMongoURI].filter(Boolean);
  let lastError = null;

  for (const uri of candidates) {
    try {
      await mongoose.connect(uri);
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

if (process.env.VERCEL) {
  // Connect MongoDB on invocation in Vercel Serverless environment
  app.use(async (req, res, next) => {
    try {
      await tryConnectMongo();
      next();
    } catch (err) {
      console.error('MongoDB Serverless Connection Error:', err);
      res.status(500).json({ error: 'Database connection failed' });
    }
  });
} else {
  // Standalone server mode (Local / VPS)
  tryConnectMongo()
    .then(() => {
      httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch(err => {
      console.error('Error connecting to MongoDB:', err);
    });
}

module.exports = app;

