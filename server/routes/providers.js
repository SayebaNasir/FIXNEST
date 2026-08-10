const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const router = express.Router();

const Provider = require('../models/Provider');
const Review = require('../models/Review');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');

const uploadDir = path.join(__dirname, '..', 'uploads', 'certifications');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const saveCertificationFile = (fileData, fileName) => {
  if (!fileData) {
    return null;
  }

  const buffer = Buffer.from(fileData, 'base64');
  const safeName = (fileName || 'certificate.pdf').replace(/[^\w.-]/g, '_');
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const destinationPath = path.join(uploadDir, `${uniqueSuffix}-${safeName}`);

  fs.writeFileSync(destinationPath, buffer);

  return `/uploads/certifications/${path.basename(destinationPath)}`;
};

const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getOptionalUser = async (req) => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.id);

    if (!user) {
      return null;
    }

    return {
      ...decoded,
      id: user._id.toString(),
      role: user.role,
      accountStatus: user.accountStatus
    };
  } catch (error) {
    return null;
  }
};

const parseArrayField = (value) => {
  if (Array.isArray(value)) return value;

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  return [];
};

const normalizeAvailability = (value) => {
  const source = Array.isArray(value) ? value : [];

  return dayOrder.map((day) => {
    const existingEntry = source.find((entry) => entry.day === day);

    return {
      day,
      slots: Array.isArray(existingEntry?.slots)
        ? existingEntry.slots
          .map((slot) => (typeof slot === 'string' ? slot.trim() : ''))
          .filter(Boolean)
        : []
    };
  });
};

const normalizeQualifications = (value) => {
  return parseArrayField(value).map((item) => {
    if (typeof item === 'string') {
      return {
        qualification: item,
        institution: '',
        year: ''
      };
    }

    return {
      qualification: item?.qualification || '',
      institution: item?.institution || '',
      year: item?.year || ''
    };
  });
};

const normalizeCertifications = (value) => {
  const source = parseArrayField(value);

  return source.map((item) => {
    const entry = {
      name: '',
      link: '',
      fileName: '',
      filePath: ''
    };

    if (typeof item === 'string') {
      entry.name = item;
    } else {
      entry.name = item?.name || '';
      entry.link = item?.link || '';
      entry.fileName = item?.fileName || '';
      entry.filePath = item?.filePath || '';
    }

    if (item?.fileData) {
      entry.fileName = item?.fileName || 'certificate.pdf';
      entry.filePath = saveCertificationFile(item.fileData, entry.fileName);
    }

    return entry;
  });
};

const notifyAdmins = async (provider) => {
  const admins = await User.find({ role: 'admin', accountStatus: 'active' });

  const notifications = [];

  for (const admin of admins) {
    const existingUnread = await Notification.findOne({
      recipientId: admin._id,
      providerId: provider._id,
      type: 'provider_verification',
      title: 'New provider profile submitted',
      isRead: false
    });

    if (!existingUnread) {
      notifications.push({
        recipientId: admin._id,
        type: 'provider_verification',
        title: 'New provider profile submitted',
        message: `Provider ${provider.name || 'Unknown'} has submitted a profile for review.`,
        providerId: provider._id,
        providerName: provider.name || 'Unknown',
        isRead: false
      });
    }
  }

  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }
};

const notifyProvider = async (provider, title, message) => {
  if (!provider?.userId) return;

  await Notification.create({
    recipientId: provider.userId,
    type: 'provider_verification',
    title,
    message,
    providerId: provider._id,
    providerName: provider.name || 'Unknown',
    isRead: false
  });
};

// ---------------------------------------------------------
// GET /api/providers
// Search and filter providers
// ---------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const { serviceType, rating, maxPrice, lat, lng, radius } = req.query;
    const currentUser = await getOptionalUser(req);

    const query = {
      verificationStatus: 'verified'
    };

    // if (currentUser?.role === 'provider') {
    //   query.userId = { $ne: currentUser.id };
    // }

    if (serviceType) {
      query.serviceType = {
        $regex: new RegExp(serviceType, 'i')
      };
    }

    if (rating) {
      query.rating = {
        $gte: Number(rating)
      };
    }

    if (maxPrice) {
      query.pricePerHour = {
        $lte: Number(maxPrice)
      };
    }

    if (lat && lng && radius) {
      const radiusInRadians = Number(radius) / 6371;

      query.location = {
        $geoWithin: {
          $centerSphere: [
            [Number(lng), Number(lat)],
            radiusInRadians
          ]
        }
      };
    }

    const providers = await Provider.find(query);

    res.json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);

    res.status(500).json({
      message: 'Server error fetching providers'
    });
  }
});


// ---------------------------------------------------------
// GET /api/providers/profile/me
// Get logged-in provider's own profile
// ---------------------------------------------------------
router.get('/profile/me', auth, async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({
        message: 'Only providers can access this profile'
      });
    }

    const provider = await Provider.findOne({
      userId: req.user.id
    });

    if (!provider) {
      return res.status(404).json({
        message: 'Provider profile not found'
      });
    }

    res.json(provider);
  } catch (error) {
    console.error('Error fetching my profile:', error);

    res.status(500).json({
      message: 'Server error fetching profile'
    });
  }
});


// ---------------------------------------------------------
// GET /api/providers/analytics/me
// Get analytics for logged-in provider
// ---------------------------------------------------------
router.get('/analytics/me', auth, async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can access analytics' });
    }

    const provider = await Provider.findOne({ userId: req.user.id });
    if (!provider) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    // 1. Fetch Bookings & Revenue
    const bookings = await Booking.find({ providerId: provider._id });

    let totalCompletedJobs = 0;
    let totalRevenue = 0;
    const monthlyEarnings = Array(12).fill(0);
    const serviceDemand = {}; // Track demand by month
    const dayDemand = {}; // Track demand by day of week

    bookings.forEach(booking => {
      const bookingDate = new Date(booking.date);
      const month = bookingDate.getMonth(); // 0-11

      const monthName = bookingDate.toLocaleString('default', { month: 'short' });
      serviceDemand[monthName] = (serviceDemand[monthName] || 0) + 1;
      
      const dayName = bookingDate.toLocaleString('default', { weekday: 'long' });
      dayDemand[dayName] = (dayDemand[dayName] || 0) + 1;

      if (booking.status === 'completed') {
        totalCompletedJobs += 1;
        // Use the price stored on the booking (falls back to provider's current rate for old bookings)
        const earned = booking.price || provider.pricePerHour || 0;
        totalRevenue += earned;
        if (!isNaN(month)) {
          monthlyEarnings[month] += earned;
        }
      }
    });

    // Format Peak Demand
    const peakDemand = Object.keys(serviceDemand).map(month => ({
      month,
      bookings: serviceDemand[month]
    })).sort((a, b) => b.bookings - a.bookings); // Highest first

    const peakDemandDays = Object.keys(dayDemand).map(day => ({
      day,
      bookings: dayDemand[day]
    })).sort((a, b) => b.bookings - a.bookings);

    // 2. Fetch Reviews & Rating Trends
    const reviews = await Review.find({ providerId: provider._id, $or: [{ targetType: 'provider' }, { targetType: { $exists: false } }] });
    const providerGivenReviewsRaw = await Review.find({ providerId: provider._id, targetType: 'homeowner' }).sort({ date: -1 });

    const providerGivenReviews = providerGivenReviewsRaw.map(r => {
      const matchingBooking = bookings.find(b => b._id.toString() === r.bookingId.toString());
      return {
        ...r.toObject(),
        homeownerName: matchingBooking ? matchingBooking.userName : 'Homeowner'
      };
    });

    let averageRating = 0;
    const ratingTrends = []; // average rating per month
    const ratingByMonth = {};

    if (reviews.length > 0) {
      const totalStars = reviews.reduce((sum, r) => sum + r.rating, 0);
      averageRating = (totalStars / reviews.length).toFixed(1);

      reviews.forEach(review => {
        if (!review.date) return;
        const d = new Date(review.date);
        const m = d.toLocaleString('default', { month: 'short' });
        if (!ratingByMonth[m]) ratingByMonth[m] = { total: 0, count: 0 };
        ratingByMonth[m].total += review.rating;
        ratingByMonth[m].count += 1;
      });

      for (const [month, data] of Object.entries(ratingByMonth)) {
        ratingTrends.push({
          month,
          average: (data.total / data.count).toFixed(1)
        });
      }
    }

    res.json({
      totalCompletedJobs,
      totalRevenue,
      monthlyEarnings,
      averageRating,
      totalReviews: reviews.length,
      peakDemand,
      peakDemandDays,
      ratingTrends,
      providerGivenReviews
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
});


// ---------------------------------------------------------
// POST /api/providers/profile
// Create or update provider profile
// ---------------------------------------------------------
router.post('/profile', auth, async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({
        message: 'Only providers can create or update profiles'
      });
    }

    const {
      name,
      serviceType,
      address,
      pricePerHour,
      bio,
      lat,
      lng,
      qualifications,
      certifications,
      experience,
      serviceAreas,
      availability,
      portfolio
    } = req.body;

    // Basic validation
    if (!name || !serviceType || !address || pricePerHour === undefined) {
      return res.status(400).json({
        message: 'Name, service type, address and price are required'
      });
    }

    // Use supplied coordinates or existing/default Dhaka coordinates
    const latitude =
      lat !== undefined && lat !== ''
        ? Number(lat)
        : 23.8103;

    const longitude =
      lng !== undefined && lng !== ''
        ? Number(lng)
        : 90.4125;

    const profileData = {
      userId: req.user.id,
      name: name.trim(),
      serviceType,
      address: address.trim(),
      pricePerHour: Number(pricePerHour),
      bio: bio || '',
      verificationStatus: 'pending',
      rejectionReason: '',
      verifiedAt: null,
      verificationUpdatedAt: new Date(),

      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },

      qualifications: normalizeQualifications(qualifications),
      certifications: normalizeCertifications(certifications),
      experience: experience || '',
      serviceAreas: parseArrayField(serviceAreas),
      availability: normalizeAvailability(availability),
      portfolio: parseArrayField(portfolio)
    };

    let provider = await Provider.findOne({
      userId: req.user.id
    });

    if (provider) {
      // UPDATE existing profile
      provider = await Provider.findOneAndUpdate(
        { userId: req.user.id },
        { $set: profileData },
        {
          new: true,
          runValidators: true
        }
      );

      await notifyAdmins(provider);

      return res.json({
        message: 'Provider profile updated successfully',
        provider
      });
    }

    // CREATE new profile
    provider = new Provider(profileData);

    await provider.save();
    await notifyAdmins(provider);

    res.status(201).json({
      message: 'Provider profile created successfully',
      provider
    });

  } catch (error) {
    console.error('Error saving profile:', error);

    res.status(500).json({
      message: 'Server error saving provider profile'
    });
  }
});


// ---------------------------------------------------------
// DELETE /api/providers/profile
// Delete logged-in provider's profile
// ---------------------------------------------------------
router.delete('/profile', auth, async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({
        message: 'Only providers can delete profiles'
      });
    }

    const provider = await Provider.findOneAndDelete({
      userId: req.user.id
    });

    if (!provider) {
      return res.status(404).json({
        message: 'Provider profile not found'
      });
    }

    res.json({
      message: 'Provider profile deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting profile:', error);

    res.status(500).json({
      message: 'Server error deleting provider profile'
    });
  }
});


// ---------------------------------------------------------
// GET /api/providers/admin/pending
// List providers waiting for review
// ---------------------------------------------------------
router.get('/admin/pending', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can review providers' });
    }

    const providers = await Provider.find({
      verificationStatus: { $in: ['pending', 'rejected'] }
    }).sort({ verificationUpdatedAt: -1 });

    res.json(providers);
  } catch (error) {
    console.error('Error fetching pending providers:', error);
    res.status(500).json({ message: 'Server error fetching pending providers' });
  }
});

// ---------------------------------------------------------
// GET /api/providers/admin/notifications
// List notifications for current admin
// ---------------------------------------------------------
router.get('/admin/notifications', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view notifications' });
    }

    const notifications = await Notification.find({ recipientId: req.user.id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

router.get('/admin/notifications/unread-count', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view notifications' });
    }

    const count = await Notification.countDocuments({ recipientId: req.user.id, isRead: false });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({ message: 'Server error fetching notification count' });
  }
});

router.post('/admin/notifications/:id/read', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update notifications' });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user.id },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ message: 'Server error updating notification' });
  }
});

// ---------------------------------------------------------
// POST /api/providers/admin/:id/verify
// Approve a provider profile
// ---------------------------------------------------------
router.post('/admin/:id/verify', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can verify providers' });
    }

    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    provider.verificationStatus = 'verified';
    provider.rejectionReason = '';
    provider.verifiedAt = new Date();
    provider.verificationUpdatedAt = new Date();
    await provider.save();

    await notifyProvider(provider, 'Profile verified', 'Your provider profile has been approved and is now visible to customers.');

    res.json({ message: 'Provider verified successfully', provider });
  } catch (error) {
    console.error('Error verifying provider:', error);
    res.status(500).json({ message: 'Server error verifying provider' });
  }
});

// ---------------------------------------------------------
// POST /api/providers/admin/:id/reject
// Reject a provider profile
// ---------------------------------------------------------
router.post('/admin/:id/reject', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can reject providers' });
    }

    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const reason = req.body.reason || 'Your profile did not meet our review requirements.';

    provider.verificationStatus = 'rejected';
    provider.rejectionReason = reason;
    provider.verifiedAt = null;
    provider.verificationUpdatedAt = new Date();
    await provider.save();

    await notifyProvider(provider, 'Profile rejected', `Your provider profile was rejected. ${reason}`);

    res.json({ message: 'Provider rejected successfully', provider });
  } catch (error) {
    console.error('Error rejecting provider:', error);
    res.status(500).json({ message: 'Server error rejecting provider' });
  }
});

// ---------------------------------------------------------
// POST/DELETE /api/providers/admin/:id/account
// Deactivate a provider account
// ---------------------------------------------------------
const deactivateProviderAccount = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can deactivate accounts' });
    }

    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const user = await User.findById(provider.userId);
    if (user) {
      if (user.accountStatus === 'deleted') {
        return res.status(409).json({ message: 'This provider account is already deleted.' });
      }

      user.accountStatus = 'deleted';
      user.deletedAt = new Date();
      user.deletedBy = req.user.id;
      user.deletionReason = req.body?.reason || req.query?.reason || 'Provider account deactivated by administrator.';
      await user.save();
    }

    await Provider.findByIdAndDelete(req.params.id);

    res.json({ message: 'Provider account deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating account:', error);
    res.status(500).json({ message: 'Server error deactivating account' });
  }
};

router.post('/admin/:id/account', auth, deactivateProviderAccount);
router.delete('/admin/:id/account', auth, deactivateProviderAccount);

// ---------------------------------------------------------
// GET /api/providers/:id
// Get public provider details including reviews
// ---------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);

    if (!provider) {
      return res.status(404).json({
        message: 'Provider not found'
      });
    }

    const reviews = await Review.find({
      providerId: provider._id,
      $or: [
        { targetType: 'provider' },
        { targetType: { $exists: false } }
      ]
    }).sort({
      date: -1
    });

    let calculatedRating = provider.rating;
    let reviewCount = reviews.length;

    if (reviewCount > 0) {
      const totalStars = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
      calculatedRating = Math.round((totalStars / reviewCount) * 10) / 10;
      
      if (provider.rating !== calculatedRating || provider.reviewCount !== reviewCount) {
        provider.rating = calculatedRating;
        provider.reviewCount = reviewCount;
        await provider.save();
      }
    } else {
      if (provider.rating !== 0 || provider.reviewCount !== 0) {
        provider.rating = 0;
        provider.reviewCount = 0;
        await provider.save();
      }
    }

    res.json({
      provider,
      reviews
    });

  } catch (error) {
    console.error('Error fetching provider details:', error);

    res.status(500).json({
      message: 'Server error fetching provider details'
    });
  }
});


module.exports = router;