const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const providerRoutes = require('./routes/providers');
const bookingRoutes = require('./routes/bookings');
const authRoutes = require('./routes/auth');
const geocodeRoutes = require('./routes/geocode');
const app = express();
const PORT = process.env.PORT || 5001;
const fallbackMongoURI = 'mongodb://127.0.0.1:27017/fixnest';

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
}));

app.use(express.json());

// Routes
app.use('/api/providers', providerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/geocode', geocodeRoutes);

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
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });
