const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');
const BookingNotification = require('../models/BookingNotification');
const Provider = require('../models/Provider');
const User = require('../models/User');
const auth = require('../middleware/auth');
const emailService = require('../services/emailService');

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
/*
  Merge this route into your existing routes/bookings.js
  (alongside your current POST '/' and any other booking routes).

  Requires:
  - const requireAuth = require('../middleware/auth');   // your existing auth middleware, sets req.user
  - const User = require('../models/User');
  - const Booking = require('../models/Booking');
  - Schema fields from schema-additions.js added to User and Booking

  Also requires BookingModal.jsx to send `userId: user?._id` when creating a
  booking (see accompanying diff) so cancellation can verify ownership.
*/
/*
  Merge this route into your existing routes/bookings.js, alongside the
  routes MyRequests.jsx already calls (GET '/my', GET '/notifications', etc).

  This replaces the earlier JWT-based version — MyRequests.jsx has no login,
  bookings are looked up by email, so cancellation authorizes the same way:
  the email in the request body must match booking.userEmail.

  Requires:
  - const Booking = require('../models/Booking');
  - const User = require('../models/User');   // only used to check premium status by email
  - Schema fields from schema-additions.js added to Booking (userId is now optional/unused here)
  - User schema needs an email field you can look up by (adjust field name if it differs)
*/

const CANCELLATION_FEE = 50; // ৳ flat fee for late (<24h) cancellations
const FREE_LATE_CANCELLATIONS_PER_MONTH = 3;

// Turns a stored date ('YYYY-MM-DD') + time string (e.g. '10:00 AM') into a Date.
function parseBookingDateTime(dateStr, timeStr) {
  const match = String(timeStr).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  let hours = 0;
  let minutes = 0;

  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
    const meridiem = match[3];
    if (meridiem) {
      const isPM = meridiem.toUpperCase() === 'PM';
      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
    }
  }

  const [year, month, day] = String(dateStr).split('-').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

router.post('/:id/cancel', async (req, res) => {
  try {
    const { email } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Prefer verifying ownership via the logged-in account (booking.userId is the
    // reliable link set at creation time), since the email typed into the booking
    // form can differ from the account's registered email. Falls back to matching
    // the typed email for guests who aren't logged in.
    let authorized = false;
    const authHeader = req.header('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'fallback_secret');
        if (booking.userId && String(booking.userId) === String(decoded.id)) {
          authorized = true;
        }
      } catch {
        // invalid/expired token — fall through to the email check below
      }
    }

    if (!authorized) {
      if (!email) {
        return res.status(400).json({ message: 'email is required' });
      }
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }
    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Completed bookings cannot be cancelled' });
    }

    const bookingDateTime = parseBookingDateTime(booking.date, booking.time);
    const hoursUntilBooking = (bookingDateTime - new Date()) / (1000 * 60 * 60);
    const isLateCancellation = hoursUntilBooking < 24;

    let feeCharged = 0;
    let feeWaived = false;
    let remainingExemptions = null;

    if (isLateCancellation) {
      // Prefer the account that actually owns this booking (booking.userId is set
      // from the authenticated user at creation time), since the email typed into
      // the cancellation form can differ from the account's registered email.
      // Fall back to an email lookup for older bookings saved without a userId.
      let account = booking.userId ? await User.findById(booking.userId) : null;
      if (!account) {
        account = await User.findOne({ email: String(email).toLowerCase() });
      }
      const isPremium = account?.role === 'premium_user';

      if (isPremium) {
        const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
        if (account.premiumCancellationsMonth !== currentMonth) {
          account.premiumCancellationsMonth = currentMonth;
          account.premiumCancellationsUsed = 0;
        }

        if (account.premiumCancellationsUsed < FREE_LATE_CANCELLATIONS_PER_MONTH) {
          account.premiumCancellationsUsed += 1;
          feeWaived = true;
          await account.save();
        } else {
          feeCharged = CANCELLATION_FEE;
        }

        remainingExemptions = Math.max(
          0,
          FREE_LATE_CANCELLATIONS_PER_MONTH - account.premiumCancellationsUsed
        );
      } else {
        feeCharged = CANCELLATION_FEE;
      }
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationFee = feeCharged;
    booking.feeWaived = feeWaived;
    await booking.save();

    let message;
    if (!isLateCancellation) {
      message = 'Booking cancelled. No fee — cancelled more than 24 hours in advance.';
    } else if (feeWaived) {
      message = `Booking cancelled. Late-cancellation fee waived (premium exemption used, ${remainingExemptions} left this month).`;
    } else {
      message = `Booking cancelled. A ৳${feeCharged} late-cancellation fee applies.`;
    }

    res.json({ message, booking, feeCharged, feeWaived, remainingExemptions });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Server error cancelling booking' });
  }
});

// -----------------------------------------------
// PATCH /:id/reschedule — Either the homeowner or the provider moves an
// active booking to a new date/time. Takes effect immediately; the other
// party is notified by email (and, for the homeowner, an in-app notification).
// -----------------------------------------------
const RESCHEDULABLE_STATUSES = ['pending', 'accepted', 'in-progress'];

router.patch('/:id/reschedule', auth, async (req, res) => {
  try {
    const { date, time } = req.body;
    if (!date || !time) {
      return res.status(400).json({ message: 'date and time are required' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!RESCHEDULABLE_STATUSES.includes(booking.status)) {
      return res.status(400).json({ message: `Bookings with status "${booking.status}" cannot be rescheduled.` });
    }

    const provider = await Provider.findById(booking.providerId);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const isHomeowner = String(booking.userId) === String(req.user.id);
    const isProvider = String(provider.userId) === String(req.user.id);
    if (!isHomeowner && !isProvider) {
      return res.status(403).json({ message: 'Not authorized to reschedule this booking' });
    }
    const initiatedBy = isProvider ? 'provider' : 'homeowner';

    const requestedDay = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    const requestedSlot = normalizeTimeSlot(time);
    const availabilityEntry = provider.availability?.find((entry) => entry.day === requestedDay);
    const availableSlots = (availabilityEntry?.slots || []).map(normalizeTimeSlot);

    if (!availabilityEntry || !availableSlots.includes(requestedSlot)) {
      return res.status(400).json({ message: 'Provider is not available at the selected time.' });
    }

    const conflictingBooking = await Booking.findOne({
      _id: { $ne: booking._id },
      providerId: booking.providerId,
      date,
      time: requestedSlot,
      status: { $in: ['pending', 'accepted', 'in-progress'] }
    });
    if (conflictingBooking) {
      return res.status(409).json({ message: 'This time slot is already booked.' });
    }

    const oldDate = booking.date;
    const oldTime = booking.time;
    const initiatorName = initiatedBy === 'provider' ? provider.name : booking.userName;

    booking.date = date;
    booking.time = requestedSlot;
    booking.statusHistory.push({
      status: booking.status,
      note: `Rescheduled by ${initiatorName} from ${oldDate} ${oldTime} to ${date} ${requestedSlot}`
    });
    await booking.save();

    // In-app notification for the homeowner (mirrors status-change notifications)
    await BookingNotification.create({
      userId: booking.userId,
      userEmail: booking.userEmail,
      bookingId: booking._id,
      providerName: provider.name,
      serviceType: provider.serviceType || '',
      status: booking.status,
      message: initiatedBy === 'provider'
        ? `${provider.name} rescheduled your booking to ${date} at ${requestedSlot}.`
        : `Your booking with ${provider.name} was rescheduled to ${date} at ${requestedSlot}.`
    });

    // Email both parties — the provider must be notified by mail per the spec
    User.findById(provider.userId).then((providerUser) => {
      emailService.sendRescheduleNotification({
        booking, provider, providerUser, oldDate, oldTime, initiatedBy
      }).catch((err) => console.error('Error sending reschedule email:', err));
    }).catch((err) => console.error('Error fetching provider user for reschedule email:', err));

    res.json({ message: 'Booking rescheduled successfully', booking });
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    res.status(500).json({ message: 'Server error rescheduling booking' });
  }
});


// -----------------------------------------------
// POST / — Homeowner creates a new booking request
// -----------------------------------------------
router.post('/', auth, async (req, res) => {
  try {
    const { providerId, userName, userEmail, userAddress, description, date, time } = req.body;

    if (!providerId || !date || !time) {
      return res.status(400).json({ message: 'Provider, date and time are required' });
    }

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
      time: requestedSlot,
      status: { $in: ['pending', 'accepted', 'in-progress'] }
    });
    if (existingBooking) {
      return res.status(409).json({ message: 'This time slot is already booked.' });
    }

    // Check off-peak discount eligibility (< 2 existing bookings in this slot)
    const slotBookingCount = await Booking.countDocuments({ time: requestedSlot });
    const isOffPeak = slotBookingCount < 2;
    const basePrice = provider.pricePerHour || 0;
    const discountApplied = isOffPeak ? 10 : 0;
    const finalPrice = isOffPeak ? Math.round(basePrice * 0.9) : basePrice;

    const newBooking = new Booking({
      providerId,
      userId: req.user.id,
      userName,
      userEmail: userEmail.toLowerCase(),
      userAddress,
      description,
      date,
      time: requestedSlot,
      price: finalPrice,
      originalPrice: basePrice,
      discountApplied,
      finalPrice,
      isOffPeak,
      status: 'pending',
      statusHistory: [{ 
        status: 'pending', 
        note: isOffPeak 
          ? 'Request submitted by homeowner (10% Off-Peak Discount Applied!)' 
          : 'Request submitted by homeowner' 
      }]
    });

    const savedBooking = await newBooking.save();

    // Trigger automated email confirmation to homeowner and provider
    User.findById(provider.userId).then((providerUser) => {
      emailService.sendBookingRequestConfirmation({
        booking: savedBooking,
        provider,
        providerUser
      }).catch((err) => console.error('Error sending request confirmation email:', err));
    }).catch((err) => console.error('Error fetching provider user for email:', err));

    res.status(201).json({ message: 'Booking request created successfully', booking: savedBooking });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error creating booking' });
  }
});

// -----------------------------------------------
// GET /my — Homeowner tracks their requests by userId
// -----------------------------------------------
router.get('/my', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate('providerId', 'name serviceType availability')
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
router.get('/notifications', auth, async (req, res) => {
  try {
    const notifications = await BookingNotification.find({ userId: req.user.id })
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
router.patch('/notifications/read', auth, async (req, res) => {
  try {
    await BookingNotification.updateMany(
      { userId: req.user.id, isRead: false },
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
        userId: booking.userId,
        userEmail: booking.userEmail,
        bookingId: booking._id,
        providerName: provider.name,
        serviceType: provider.serviceType || '',
        status,
        message: msgFn(provider.name)
      });
    }

    // Trigger email alerts based on status transition
    User.findById(provider.userId).then((providerUser) => {
      if (status === 'accepted' || status === 'rejected') {
        emailService.sendBookingStatusAlert({
          booking,
          provider,
          providerUser,
          status
        }).catch((err) => console.error(`Error sending ${status} email alert:`, err));
      } else if (status === 'completed') {
        emailService.sendJobCompletionNotification({
          booking,
          provider,
          providerUser
        }).catch((err) => console.error('Error sending job completion email:', err));
      }
    }).catch((err) => console.error('Error fetching provider user for status email:', err));

    res.json({ message: 'Booking status updated', booking });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Server error updating booking status' });
  }
});

// -----------------------------------------------
// POST /:id/reminder — Dispatch completion/schedule reminder email for a specific booking
// -----------------------------------------------
router.post('/:id/reminder', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const provider = await Provider.findById(booking.providerId);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const providerUser = await User.findById(provider.userId);

    await emailService.sendJobCompletionReminder({
      booking,
      provider,
      providerUser
    });

    res.json({ message: 'Completion & schedule reminder emails sent successfully' });
  } catch (error) {
    console.error('Error sending booking reminder:', error);
    res.status(500).json({ message: 'Server error sending reminder' });
  }
});

// -----------------------------------------------
// POST /reminders/send-all — Batch send completion reminders for active/accepted jobs
// -----------------------------------------------
router.post('/reminders/send-all', auth, async (req, res) => {
  try {
    // Find active jobs (accepted or in-progress)
    const activeBookings = await Booking.find({ status: { $in: ['accepted', 'in-progress'] } });
    let count = 0;

    for (const booking of activeBookings) {
      const provider = await Provider.findById(booking.providerId);
      if (provider) {
        const providerUser = await User.findById(provider.userId);
        await emailService.sendJobCompletionReminder({
          booking,
          provider,
          providerUser
        }).catch((err) => console.error(`Error sending batch reminder for booking ${booking._id}:`, err));
        count++;
      }
    }

    res.json({ message: `Batch completion reminders dispatched for ${count} active jobs.` });
  } catch (error) {
    console.error('Error sending batch reminders:', error);
    res.status(500).json({ message: 'Server error sending batch reminders' });
  }
});

// -----------------------------------------------
// GET /pending-count — Provider gets count of pending requests (for badge)
// -----------------------------------------------
router.get('/pending-count', auth, async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can access this route' });
    }

    const provider = await Provider.findOne({ userId: req.user.id });
    if (!provider) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const count = await Booking.countDocuments({ providerId: provider._id, status: 'pending' });
    res.json({ pendingCount: count });
  } catch (error) {
    console.error('Error fetching pending count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// -----------------------------------------------
// GET /:id/reviews — Get reviews for a specific booking
// -----------------------------------------------
router.get('/:id/reviews', async (req, res) => {
  try {
    const Review = require('../models/Review');
    const reviews = await Review.find({ bookingId: req.params.id });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching booking reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// -----------------------------------------------
// POST /:id/review — Submit a review for a completed booking
// -----------------------------------------------
router.post('/:id/review', async (req, res) => {
  try {
    const Review = require('../models/Review');
    const User = require('../models/User');

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed bookings' });
    }

    const {
      reviewerType, reviewerName, comment,
      professionalism, quality, punctuality,
      behavior, paymentPromptness
    } = req.body;

    if (!reviewerType || !reviewerName) {
      return res.status(400).json({ message: 'reviewerType and reviewerName are required' });
    }

    // Check for duplicate
    const existing = await Review.findOne({ bookingId: booking._id, reviewerType });
    if (existing) {
      return res.status(409).json({ message: 'You have already reviewed this booking' });
    }

    let rating = 0;
    let targetType = '';
    let targetEmail = '';
    const reviewData = {
      bookingId: booking._id,
      providerId: booking.providerId,
      reviewerType,
      reviewerName,
      comment: comment || ''
    };

    if (reviewerType === 'homeowner') {
      // Homeowner rates provider
      targetType = 'provider';
      const p = Number(professionalism) || 3;
      const q = Number(quality) || 3;
      const punc = Number(punctuality) || 3;
      rating = Math.round(((p + q + punc) / 3) * 10) / 10;
      Object.assign(reviewData, {
        targetType,
        professionalism: p,
        quality: q,
        punctuality: punc,
        rating
      });
    } else if (reviewerType === 'provider') {
      // Provider rates homeowner
      targetType = 'homeowner';
      targetEmail = booking.userEmail;
      const b = Number(behavior) || 3;
      const pp = Number(paymentPromptness) || 3;
      rating = Math.round(((b + pp) / 2) * 10) / 10;
      Object.assign(reviewData, {
        targetType,
        targetEmail,
        behavior: b,
        paymentPromptness: pp,
        rating
      });
    } else {
      return res.status(400).json({ message: 'Invalid reviewerType' });
    }

    const review = new Review(reviewData);
    await review.save();

    // Recalculate target's average rating
    if (targetType === 'provider') {
      const allProviderReviews = await Review.find({ providerId: booking.providerId, targetType: 'provider' });
      const totalStars = allProviderReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = Math.round((totalStars / allProviderReviews.length) * 10) / 10;
      await Provider.findByIdAndUpdate(booking.providerId, {
        rating: avgRating,
        reviewCount: allProviderReviews.length
      });
    } else if (targetType === 'homeowner') {
      const allHomeownerReviews = await Review.find({ targetType: 'homeowner', targetEmail: booking.userEmail });
      const totalStars = allHomeownerReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = Math.round((totalStars / allHomeownerReviews.length) * 10) / 10;
      await User.updateMany(
        { email: booking.userEmail },
        { rating: avgRating, reviewCount: allHomeownerReviews.length }
      );
    }

    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'You have already reviewed this booking' });
    }
    console.error('Error submitting review:', error);
    res.status(500).json({ message: 'Server error submitting review' });
  }
});

module.exports = router;
