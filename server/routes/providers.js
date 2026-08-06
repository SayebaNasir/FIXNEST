const express = require('express');
const router = express.Router();
const Provider = require('../models/Provider');
const Review = require('../models/Review');

// Search and filter providers
router.get('/', async (req, res) => {
  try {
    const { serviceType, rating, maxPrice, lat, lng, radius } = req.query;
    
    let query = {};
    
    if (serviceType) {
      query.serviceType = { $regex: new RegExp(serviceType, 'i') };
    }
    
    if (rating) {
      query.rating = { $gte: Number(rating) };
    }
    
    if (maxPrice) {
      query.pricePerHour = { $lte: Number(maxPrice) };
    }
    
    if (lat && lng && radius) {
      // Radius in radians (radius in km / radius of earth in km)
      const radiusInRadians = Number(radius) / 6371;
      query.location = {
        $geoWithin: {
          $centerSphere: [[Number(lng), Number(lat)], radiusInRadians]
        }
      };
    }
    
    const providers = await Provider.find(query);
    res.json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ message: 'Server error fetching providers' });
  }
});

// Get provider details including reviews
router.get('/:id', async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    
    const reviews = await Review.find({ providerId: provider._id }).sort({ date: -1 });
    
    res.json({ provider, reviews });
  } catch (error) {
    console.error('Error fetching provider details:', error);
    res.status(500).json({ message: 'Server error fetching provider details' });
  }
});

module.exports = router;
