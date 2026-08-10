const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Provider = require('../models/Provider');
const auth = require('../middleware/auth');

const normalizeTimeSlot = (slot) => {
  if (typeof slot !== 'string') return '';

  const trimmed = slot.trim();
  const match = trimmed.match(/(\d{1,2}):(\d{2})/);

  if (!match) {
    return trimmed;
  }

  return `${match[1].padStart(2, '0')}:${match[2]}`;
};

// Create a new booking request
router.post('/', auth, async (req, res) => {
  try {
    const { providerId, userName, userEmail, userAddress, description, date, time } = req.body;

    if (!providerId || !date || !time) {
      return res.status(400).json({ message: 'Provider, date and time are required' });
    }

    // Check if provider exists
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    if (String(provider.userId) === String(req.user.id)) {
      return res.status(403).json({ message: 'You cannot book your own service.' });
    }

    const requestedDay = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    const requestedSlot = normalizeTimeSlot(time);
    const availabilityEntry = provider.availability?.find((entry) => entry.day === requestedDay);
    const availableSlots = (availabilityEntry?.slots || []).map(normalizeTimeSlot);

    if (!availabilityEntry || !availableSlots.includes(requestedSlot)) {
      return res.status(400).json({ message: 'Provider is not available at the selected time.' });
    }

    const existingBooking = await Booking.findOne({
      providerId,
      date,
      time: requestedSlot
    });

    if (existingBooking) {
      return res.status(409).json({ message: 'This time slot is already booked.' });
    }

    const newBooking = new Booking({
      providerId,
      userName,
      userEmail,
      userAddress,
      description,
      date,
      time: requestedSlot,
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
