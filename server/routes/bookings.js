const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const BookingNotification = require('../models/BookingNotification');
const Provider = require('../models/Provider');
const auth = require('../middleware/auth');

const normalizeTimeSlot = (slot) => {
  if (typeof slot !== 'string') return '';
  const trimmed = slot.trim();
  const match = trimmed.match(/(\d{1,2}):(\d{2})/);
  if (!match) return trimmed;
  return `${match[1].padStart(2, '0')}:${match[2]}`;
};

const STATUS_MESSAGES = {
  accepted:      (name) => `Great news! ${name} has accepted your service request.`,
  rejected:      (name) => `${name} was unable to accept your service request.`,
  'in-progress': (name) => `Your job with ${name} is now in progress.`,
  completed:     (name) => `Your service with ${name} has been completed!`,
};

// -----------------------------------------------
// POST / — Homeowner creates a new booking request
// -----------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { providerId, userName, userEmail, userAddress, description, date, time } = req.body;

    if (!providerId || !date || !time) {
      return res.status(400).json({ message: 'Provider, date and time are required' });
    }

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const requestedDay = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    const requestedSlot = normalizeTimeSlot(time);
    const availabilityEntry = provider.availability?.find((entry) => entry.day === requestedDay);
    const availableSlots = (availabilityEntry?.slots || []).map(normalizeTimeSlot);

    if (!availabilityEntry || !availableSlots.includes(requestedSlot)) {
      return res.status(400).json({ message: 'Provider is not available at the selected time.' });
    }

    const existingBooking = await Booking.findOne({ providerId, date, time: requestedSlot });
    if (existingBooking) {
      return res.status(409).json({ message: 'This time slot is already booked.' });
    }

    const newBooking = new Booking({
      providerId,
      userName,
      userEmail: userEmail.toLowerCase(),
      userAddress,
      description,
      date,
      time: requestedSlot,
      status: 'pending',
      statusHistory: [{ status: 'pending', note: 'Request submitted by homeowner' }]
    });

    const savedBooking = await newBooking.save();
    res.status(201).json({ message: 'Booking request created successfully', booking: savedBooking });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error creating booking' });
  }
});

// -----------------------------------------------
// GET /my — Homeowner tracks their requests by email
// -----------------------------------------------
router.get('/my', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const bookings = await Booking.find({ userEmail: email.toLowerCase() })
      .populate('providerId', 'name serviceType')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ message: 'Server error fetching bookings' });
  }
});

// -----------------------------------------------
// GET /notifications — Homeowner fetches notifications
// -----------------------------------------------
router.get('/notifications', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const notifications = await BookingNotification.find({ userEmail: email.toLowerCase() })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

// -----------------------------------------------
// PATCH /notifications/read — Mark notifications read
// -----------------------------------------------
router.patch('/notifications/read', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    await BookingNotification.updateMany(
      { userEmail: email.toLowerCase(), isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// -----------------------------------------------
// GET /provider — Provider gets their incoming requests
// -----------------------------------------------
router.get('/provider', auth, async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can access this route' });
    }

    const provider = await Provider.findOne({ userId: req.user.id });
    if (!provider) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const bookings = await Booking.find({ providerId: provider._id }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching provider bookings:', error);
    res.status(500).json({ message: 'Server error fetching bookings' });
  }
});

// -----------------------------------------------
// PATCH /:id/status — Provider updates booking status
// IMPORTANT: must come AFTER /notifications/read
// -----------------------------------------------
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can update booking status' });
    }

    const { status } = req.body;
    const allowed = ['accepted', 'rejected', 'in-progress', 'completed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}` });
    }

    const provider = await Provider.findOne({ userId: req.user.id });
    if (!provider) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.providerId.toString() !== provider._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this booking' });
    }

    // Update status and append to history
    booking.status = status;
    booking.statusHistory.push({
      status,
      note: `Status updated to "${status}" by provider`
    });
    await booking.save();

    // Create a homeowner notification
    const msgFn = STATUS_MESSAGES[status];
    if (msgFn) {
      await BookingNotification.create({
        userEmail: booking.userEmail,
        bookingId: booking._id,
        providerName: provider.name,
        serviceType: provider.serviceType || '',
        status,
        message: msgFn(provider.name)
      });
    }

    res.json({ message: 'Booking status updated', booking });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Server error updating booking status' });
  }
});

module.exports = router;
