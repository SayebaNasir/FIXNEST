const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },

  // Who wrote this review
  reviewerType: { type: String, enum: ['homeowner', 'provider'], required: true },
  reviewerName: { type: String, required: true },

  // Who is being reviewed
  targetType: { type: String, enum: ['provider', 'homeowner'], required: true },
  targetEmail: { type: String, default: '' }, // homeowner email (when target is homeowner)

  // Overall rating (auto-calculated as average of sub-ratings)
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },

  // Homeowner → Provider sub-ratings
  professionalism: { type: Number, min: 1, max: 5, default: null },
  quality: { type: Number, min: 1, max: 5, default: null },
  punctuality: { type: Number, min: 1, max: 5, default: null },

  // Provider → Homeowner sub-ratings
  behavior: { type: Number, min: 1, max: 5, default: null },
  paymentPromptness: { type: Number, min: 1, max: 5, default: null },

  date: { type: Date, default: Date.now }
});

// Prevent duplicate reviews: one review per reviewer type per booking
reviewSchema.index({ bookingId: 1, reviewerType: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
