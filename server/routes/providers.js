const express = require('express');
const router = express.Router();
const Provider = require('../models/Provider');
const Review = require('../models/Review');
const auth = require('../middleware/auth');

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

// Get my provider profile
router.get('/profile/me', auth, async (req, res) => {
  try {
    const provider = await Provider.findOne({ userId: req.user.id });
    res.json(provider);
  } catch (error) {
    console.error('Error fetching my profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or update provider profile
router.post('/profile', auth, async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can create profiles' });
    }

    const { name, serviceType, address, pricePerHour, bio, lat, lng } = req.body;
    
    // Use provided lat/lng or default Dhaka coordinates
    const coordinates = (lat && lng) ? [Number(lng), Number(lat)] : [90.4125, 23.8103];
    
    const profileData = {
      userId: req.user.id,
      name,
      serviceType,
      address,
      pricePerHour: Number(pricePerHour),
      bio,
      location: { type: 'Point', coordinates }
    };

    let provider = await Provider.findOne({ userId: req.user.id });

    if (provider) {
      // Update
      provider = await Provider.findOneAndUpdate(
        { userId: req.user.id },
        { $set: profileData },
        { new: true }
      );
    } else {
      // Create with default availability if new
      profileData.availability = [
        { day: 'Monday', slots: ['09:00', '12:00', '15:00'] },
        { day: 'Tuesday', slots: ['09:00', '12:00', '15:00'] },
        { day: 'Wednesday', slots: ['09:00', '12:00', '15:00'] },
        { day: 'Thursday', slots: ['09:00', '12:00', '15:00'] },
        { day: 'Friday', slots: ['09:00', '12:00'] }
      ];
      provider = new Provider(profileData);
      await provider.save();
    }

    res.json(provider);
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ message: 'Server error saving profile' });
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
