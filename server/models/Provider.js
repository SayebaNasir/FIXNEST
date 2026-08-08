const mongoose = require('mongoose');

const qualificationSchema = new mongoose.Schema({
  qualification: { type: String, default: '' },
  institution: { type: String, default: '' },
  year: { type: String, default: '' }
}, { _id: false });

const certificationSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  link: { type: String, default: '' },
  fileName: { type: String, default: '' },
  filePath: { type: String, default: '' }
}, { _id: false });

const providerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },

  serviceType: {
    type: String,
    required: true
  },

  address: {
    type: String,
    trim: true
  },

  // Location for map-based search
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

  // Professional Information
  qualifications: {
    type: [qualificationSchema],
    default: []
  },

  certifications: {
    type: [certificationSchema],
    default: []
  },

  experience: {
    type: String,
    default: ''
  },

  // Services offered by the provider
  serviceAreas: {
    type: [String],
    default: []
  },

  // Pricing
  pricePerHour: {
    type: Number,
    required: true,
    min: 0
  },

  // Provider availability
  availability: [
    {
      day: {
        type: String,
        required: true
      },
      slots: {
        type: [String],
        default: []
      }
    }
  ],

  // Portfolio image URLs
  portfolio: {
    type: [String],
    default: []
  },

  // Provider description
  bio: {
    type: String,
    default: ''
  },

  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },

  rejectionReason: {
    type: String,
    default: ''
  },

  verifiedAt: {
    type: Date,
    default: null
  },

  verificationUpdatedAt: {
    type: Date,
    default: Date.now
  },

  // Rating information
  rating: {
    type: Number,
    default: 0
  },

  reviewCount: {
    type: Number,
    default: 0
  }
});

providerSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Provider', providerSchema);