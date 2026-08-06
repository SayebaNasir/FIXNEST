const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Provider = require('../models/Provider');

// Create a new booking request
router.post('/', async (req, res) => {
  try {
    const { providerId, userName, userEmail, userAddress, description, date, time } = req.body;
    
    // Check if provider exists
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    
    const newBooking = new Booking({
      providerId,
      userName,
      userEmail,
      userAddress,
      description,
      date,
      time,
      status: 'pending'
    });
    
    const savedBooking = await newBooking.save();
    res.status(201).json({ message: 'Booking request created successfully', booking: savedBooking });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error creating booking' });
  }
});

module.exports = router;
