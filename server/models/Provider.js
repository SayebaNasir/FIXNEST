const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  serviceType: { type: String, required: true },
  location: {
    type: {
      type: String, 
      enum: ['Point'], 
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  address: { type: String },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  pricePerHour: { type: Number, required: true },
  availability: [
    {
      day: String,
      slots: [String]
    }
  ],
  portfolio: [String],
  bio: String
});

providerSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Provider', providerSchema);
