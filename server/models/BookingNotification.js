const mongoose = require('mongoose');

// Notifications sent to homeowners about their booking status changes
const bookingNotificationSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, lowercase: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  providerName: { type: String, required: true },
  serviceType: { type: String, default: '' },
  status: { type: String, required: true }, // the new status that triggered this notification
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BookingNotification', bookingNotificationSchema);
