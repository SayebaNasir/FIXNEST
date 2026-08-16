const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

const PLAN_PRICES = { monthly: 299, yearly: 2990 };

// -----------------------------------------------
// GET /status — Current user's subscription plan, billing cycle, and expiry
// -----------------------------------------------
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      role: user.role,
      plan: user.subscriptionPlan,
      billingCycle: user.subscriptionBillingCycle,
      expiresAt: user.subscriptionExpiresAt,
      paymentStatus: user.subscriptionPaymentStatus,
      prices: PLAN_PRICES
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ message: 'Server error fetching subscription status' });
  }
});

module.exports = router;
