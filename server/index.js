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
const messageRoutes = require('./routes/messages');
const initSocket = require('./socket');
const app = express();
const httpServer = http.createServer(app);
initSocket(httpServer);
const PORT = process.env.PORT || 5001;
const fallbackMongoURI = 'mongodb+srv://fixnestAdmin:123fixnest@cluster0.q7gvbmz.mongodb.net/fixnest?appName=Cluster0';

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
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
app.use('/api/messages', messageRoutes);

// Connect to MongoDB
const tryConnectMongo = async () => {
  const candidates = [process.env.MONGO_URI, fallbackMongoURI].filter(Boolean);
  let lastError = null;

  for (const uri of candidates) {
    try {
      await mongoose.connect(uri);
      console.log(`Connected to MongoDB at ${uri}`);
      return uri;
    } catch (error) {
      lastError = error;
      console.warn(`Failed to connect to MongoDB at ${uri}:`, error.message);
    }
  }

  throw lastError;
};

tryConnectMongo()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });
