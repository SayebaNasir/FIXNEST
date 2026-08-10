const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Provider = require('../models/Provider');

// Operating hours (08:00 to 20:00)
const HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00'
];

// Helper: Extract start hour from slot string (e.g. "10:00 - 11:00" -> "10:00")
const extractSlotHour = (slot) => {
  if (typeof slot !== 'string') return '';
  const match = slot.match(/(\d{1,2}):(\d{2})/);
  if (!match) return slot.trim();
  return `${match[1].padStart(2, '0')}:${match[2]}`;
};

// -----------------------------------------------------------------
// GET /api/analytics/offpeak-heatmap — Returns time-slot demand analytics
// ONLY counts UNBOOKED providers (excludes providers already booked in slot)
// -----------------------------------------------------------------
router.get('/offpeak-heatmap', async (req, res) => {
  try {
    const { serviceType, day, date } = req.query;

    // 1. Fetch active providers
    const providerQuery = { verificationStatus: { $ne: 'rejected' } };
    if (serviceType) providerQuery.serviceType = serviceType;
    const providers = await Provider.find(providerQuery);

    // 2. Fetch existing active bookings to check booked slots
    const bookingQuery = { status: { $in: ['pending', 'accepted', 'in-progress'] } };
    if (date) bookingQuery.date = date;
    const existingBookings = await Booking.find(bookingQuery);

    // Map of booked provider IDs by time slot: timeSlot -> Set of providerIds
    const bookedProvidersByHour = {};
    HOURS.forEach(h => { bookedProvidersByHour[h] = new Set(); });

    existingBookings.forEach(b => {
      const hourKey = extractSlotHour(b.time);
      if (bookedProvidersByHour[hourKey]) {
        bookedProvidersByHour[hourKey].add(b.providerId.toString());
      }
    });

    // 3. Count UNBOOKED available providers per time slot (hour)
    const unbookedProvidersByHour = {};
    HOURS.forEach(h => { unbookedProvidersByHour[h] = new Set(); });

    providers.forEach(p => {
      const pIdStr = p._id.toString();
      (p.availability || []).forEach(avail => {
        if (!day || avail.day.toLowerCase() === day.toLowerCase()) {
          (avail.slots || []).forEach(slot => {
            const startHour = extractSlotHour(slot);
            if (unbookedProvidersByHour[startHour] !== undefined) {
              // Only count if provider is NOT already booked in this slot!
              if (!bookedProvidersByHour[startHour]?.has(pIdStr)) {
                unbookedProvidersByHour[startHour].add(pIdStr);
              }
            }
          });
        }
      });
    });

    // 4. Count job demand per time slot
    const jobCountsByHour = {};
    HOURS.forEach(h => { jobCountsByHour[h] = 0; });

    existingBookings.forEach(b => {
      const hourKey = extractSlotHour(b.time);
      if (jobCountsByHour[hourKey] !== undefined) {
        jobCountsByHour[hourKey] += 1;
      }
    });

    // 5. Compute Time-Slot summary & heatmap cells
    let totalOffPeakSlots = 0;
    let totalPeakSlots = 0;
    let totalUnavailableSlots = 0;

    const timeSlotsAnalytics = HOURS.map(hour => {
      const jobCount = jobCountsByHour[hour] || 0;
      const availableProvidersCount = unbookedProvidersByHour[hour]?.size || 0;
      const hasProvider = availableProvidersCount > 0;

      let demandLevel = 'no_provider';
      let isOffPeak = false;
      let discountPercentage = 0;
      let discountLabel = 'Unavailable';

      if (!hasProvider) {
        demandLevel = 'no_provider';
        isOffPeak = false;
        discountPercentage = 0;
        discountLabel = 'No Provider Available';
        totalUnavailableSlots++;
      } else if (jobCount >= 4) {
        demandLevel = 'high';
        isOffPeak = false;
        discountPercentage = 0;
        discountLabel = 'High Demand';
        totalPeakSlots++;
      } else if (jobCount >= 2) {
        demandLevel = 'medium';
        isOffPeak = false;
        discountPercentage = 0;
        discountLabel = 'Standard Rate';
      } else {
        // Low demand time slot with UNBOOKED available provider => 10% OFF!
        demandLevel = 'low';
        isOffPeak = true;
        discountPercentage = 10;
        discountLabel = '10% OFF';
        totalOffPeakSlots++;
      }

      return {
        hour,
        jobCount,
        availableProviders: availableProvidersCount,
        hasProvider,
        demandLevel,
        isOffPeak,
        discountPercentage,
        discountLabel
      };
    });

    // Featured off-peak time slots (Purely Time-Based with Unbooked Providers)
    const featuredOffPeakSlots = timeSlotsAnalytics
      .filter(s => s.isOffPeak)
      .map(s => ({
        timeSlot: s.hour,
        availableProvidersCount: s.availableProviders,
        discount: '10% OFF',
        label: `Book at ${s.hour} and save 10%`
      }));

    res.json({
      hours: HOURS,
      timeSlotsAnalytics,
      stats: {
        totalBookingsAnalyzed: existingBookings.length,
        totalIdleSlots: totalOffPeakSlots,
        totalPeakSlots,
        totalUnavailableSlots,
        offPeakDiscountRate: 10
      },
      topOffPeakDeals: featuredOffPeakSlots
    });

  } catch (error) {
    console.error('Error generating off-peak heatmap:', error);
    res.status(500).json({ message: 'Server error generating heatmap analytics' });
  }
});

// -----------------------------------------------------------------
// GET /api/analytics/offpeak-providers — List providers for a specific off-peak time slot
// Returns ONLY available providers who are NOT booked in this slot, with 10% OFF pricing!
// -----------------------------------------------------------------
router.get('/offpeak-providers', async (req, res) => {
  try {
    const { time, date, day, serviceType } = req.query;
    if (!time) {
      return res.status(400).json({ message: 'Time slot is required' });
    }

    const hourKey = extractSlotHour(time);

    // 1. Fetch active providers matching optional serviceType
    const providerQuery = { verificationStatus: { $ne: 'rejected' } };
    if (serviceType) providerQuery.serviceType = serviceType;
    const providers = await Provider.find(providerQuery).lean();

    // 2. Fetch existing bookings for this time slot (and date/day)
    const bookingQuery = { 
      status: { $in: ['pending', 'accepted', 'in-progress'] }
    };
    if (date) bookingQuery.date = date;
    const existingBookings = await Booking.find(bookingQuery);

    const bookedProviderIds = new Set(
      existingBookings
        .filter(b => extractSlotHour(b.time) === hourKey)
        .map(b => b.providerId.toString())
    );

    // 3. Filter providers who offer this slot AND are NOT booked
    const eligibleProviders = providers.filter(p => {
      const pIdStr = p._id.toString();
      if (bookedProviderIds.has(pIdStr)) return false; // Exclude already booked providers!

      return (p.availability || []).some(a => {
        if (day && a.day.toLowerCase() !== day.toLowerCase()) return false;
        return (a.slots || []).some(s => extractSlotHour(s) === hourKey);
      });
    }).map(p => {
      const originalPrice = p.pricePerHour || 0;
      const discountedPrice = Math.round(originalPrice * 0.9);
      return {
        ...p,
        originalPrice,
        discountedPrice,
        discountApplied: 10,
        isOffPeak: true
      };
    });

    res.json({
      timeSlot: hourKey,
      totalAvailable: eligibleProviders.length,
      discountPercentage: 10,
      providers: eligibleProviders
    });

  } catch (error) {
    console.error('Error fetching off-peak providers:', error);
    res.status(500).json({ message: 'Server error fetching off-peak providers' });
  }
});

// -----------------------------------------------------------------
// GET /api/analytics/check-slot — Check off-peak status (Time Slot based)
// -----------------------------------------------------------------
router.get('/check-slot', async (req, res) => {
  try {
    const { time, date } = req.query;
    if (!time) {
      return res.json({ isOffPeak: false, discountPercentage: 0 });
    }

    const hourKey = extractSlotHour(time);

    // Count active providers offering this time slot
    const providers = await Provider.find({ verificationStatus: { $ne: 'rejected' } });

    // Exclude providers booked at this time slot
    const bookingQuery = { status: { $in: ['pending', 'accepted', 'in-progress'] } };
    if (date) bookingQuery.date = date;
    const existingBookings = await Booking.find(bookingQuery);
    const bookedProviderIds = new Set(
      existingBookings
        .filter(b => extractSlotHour(b.time) === hourKey)
        .map(b => b.providerId.toString())
    );

    const availableProviders = providers.filter(p => {
      if (bookedProviderIds.has(p._id.toString())) return false;
      return (p.availability || []).some(a => (a.slots || []).some(s => extractSlotHour(s) === hourKey));
    }).length;

    // Count job bookings in this time slot
    const jobCount = existingBookings.filter(b => extractSlotHour(b.time) === hourKey).length;

    // Low demand (< 3 bookings) + at least 1 UNBOOKED provider available => 10% OFF!
    const isOffPeak = jobCount < 3 && availableProviders > 0;
    const discountPercentage = isOffPeak ? 10 : 0;

    res.json({
      time: hourKey,
      availableProviders,
      jobCount,
      isOffPeak,
      discountPercentage,
      message: isOffPeak 
        ? `Off-Peak Special: 10% discount applies for booking at ${hourKey}!` 
        : 'Standard Rate'
    });
  } catch (error) {
    console.error('Error checking slot off-peak status:', error);
    res.status(500).json({ message: 'Server error checking slot status' });
  }
});

module.exports = router;
