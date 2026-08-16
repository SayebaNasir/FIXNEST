const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  note: { type: String, default: '' }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  isEmergency: { type: Boolean, default: false },
  userAddress: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancelledAt: { type: Date },
  cancellationFee: { type: Number, default: 0 },
  feeWaived: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  originalPrice: { type: Number, default: 0 },
  discountApplied: { type: Number, default: 0 }, // Discount in percentage e.g. 10
  finalPrice: { type: Number, default: 0 },
  isOffPeak: { type: Boolean, default: false },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'failed'],
    default: 'unpaid'
  },
  transactionId: { type: String, default: '' },
  cancellationFeePaymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'failed'],
    default: 'unpaid'
  },
  cancellationFeeTransactionId: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  statusHistory: { type: [statusHistorySchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
