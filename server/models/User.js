const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'provider', 'admin', 'premium_user'], default: 'user' },
  accountStatus: { type: String, enum: ['active', 'deleted'], default: 'active' },
  deletedAt: { type: Date, default: null },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  premiumCancellationsUsed: { type: Number, default: 0 },
  premiumCancellationsMonth: { type: String, default: '' },
});

module.exports = mongoose.model('User', userSchema);
