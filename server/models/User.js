const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'provider', 'admin', 'premium_user'], default: 'user' },
  accountStatus: { type: String, enum: ['active', 'deleted'], default: 'active' },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  deletionReason: { type: String, default: '' },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Provider', default: [] }],
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  premiumCancellationsUsed: { type: Number, default: 0 },
  premiumCancellationsMonth: { type: String, default: '' },
  subscriptionPlan: { type: String, enum: ['free', 'premium'], default: 'free' },
  subscriptionBillingCycle: { type: String, default: null }, // 'monthly' | 'yearly' | null
  subscriptionExpiresAt: { type: Date, default: null },
  subscriptionTransactionId: { type: String, default: '' },
  subscriptionPaymentStatus: {
    type: String,
    enum: ['none', 'pending', 'paid', 'failed'],
    default: 'none'
  },
  rewardPoints: { type: Number, default: 0 },
});

module.exports = mongoose.model('User', userSchema);

