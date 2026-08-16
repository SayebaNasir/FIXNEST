const express = require('express');
const router = express.Router();
const SSLCommerzPayment = require('sslcommerz-lts');
const Booking = require('../models/Booking');
const Provider = require('../models/Provider');
const User = require('../models/User');
const auth = require('../middleware/auth');

const store_id = process.env.SSLCOMMERZ_STORE_ID;
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
const is_live = process.env.SSLCOMMERZ_IS_LIVE === 'true';

const getAppUrl = () => process.env.APP_URL || 'http://localhost:5173';
const getApiUrl = () => process.env.API_URL || 'http://localhost:5001';

// tran_id prefixes distinguish which payment a callback belongs to, since a
// single booking/user can have more than one kind of payment in flight.
const BOOKING_PREFIX = 'BOOK_';
const CANCELFEE_PREFIX = 'CANCELFEE_';
const SUB_MONTHLY_PREFIX = 'SUBM_';
const SUB_YEARLY_PREFIX = 'SUBY_';

const SUBSCRIPTION_PRICES = { monthly: 299, yearly: 2990 };

// SSLCommerz posts back as application/x-www-form-urlencoded
router.use(express.urlencoded({ extended: true }));

const buildCustomerData = ({ name, email, address }, productName, productCategory) => ({
  currency: 'BDT',
  shipping_method: 'NO',
  product_name: productName,
  product_category: productCategory,
  product_profile: 'general',
  cus_name: name,
  cus_email: email,
  cus_add1: address || 'N/A',
  cus_city: 'Dhaka',
  cus_postcode: '1000',
  cus_country: 'Bangladesh',
  cus_phone: '01700000000',
  num_of_item: 1
});

// -----------------------------------------------
// POST /init/:bookingId — Homeowner starts payment for their own booking
// -----------------------------------------------
router.post('/init/:bookingId', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (String(booking.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to pay for this booking' });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'This booking has already been paid for' });
    }

    const amount = booking.finalPrice || booking.price || 0;
    if (amount < 10) {
      return res.status(400).json({ message: 'Booking amount is too low to process payment' });
    }

    const provider = await Provider.findById(booking.providerId);
    const tran_id = `${BOOKING_PREFIX}${booking._id}_${Date.now()}`;

    const data = {
      total_amount: amount,
      tran_id,
      success_url: `${getApiUrl()}/api/payment/success`,
      fail_url: `${getApiUrl()}/api/payment/fail`,
      cancel_url: `${getApiUrl()}/api/payment/cancel`,
      ipn_url: `${getApiUrl()}/api/payment/ipn`,
      ...buildCustomerData(
        { name: booking.userName, email: booking.userEmail, address: booking.userAddress },
        provider ? `${provider.serviceType} Service` : 'FIXNEST Service Booking',
        'Service'
      )
    };

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const apiResponse = await sslcz.init(data);

    if (!apiResponse?.GatewayPageURL) {
      console.error('SSLCommerz init failed:', apiResponse);
      return res.status(502).json({ message: 'Unable to start payment session' });
    }

    booking.transactionId = tran_id;
    await booking.save();

    res.json({ GatewayPageURL: apiResponse.GatewayPageURL });
  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({ message: 'Server error initiating payment' });
  }
});

// -----------------------------------------------
// POST /init-cancellation-fee/:bookingId — Homeowner pays the late-cancellation fee
// -----------------------------------------------
router.post('/init-cancellation-fee/:bookingId', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (String(booking.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to pay for this booking' });
    }

    if (booking.status !== 'cancelled' || booking.feeWaived || !booking.cancellationFee) {
      return res.status(400).json({ message: 'No cancellation fee is owed on this booking' });
    }

    if (booking.cancellationFeePaymentStatus === 'paid') {
      return res.status(400).json({ message: 'The cancellation fee has already been paid' });
    }

    const provider = await Provider.findById(booking.providerId);
    const tran_id = `${CANCELFEE_PREFIX}${booking._id}_${Date.now()}`;

    const data = {
      total_amount: booking.cancellationFee,
      tran_id,
      success_url: `${getApiUrl()}/api/payment/success`,
      fail_url: `${getApiUrl()}/api/payment/fail`,
      cancel_url: `${getApiUrl()}/api/payment/cancel`,
      ipn_url: `${getApiUrl()}/api/payment/ipn`,
      ...buildCustomerData(
        { name: booking.userName, email: booking.userEmail, address: booking.userAddress },
        'Late-Cancellation Fee',
        'Service'
      )
    };

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const apiResponse = await sslcz.init(data);

    if (!apiResponse?.GatewayPageURL) {
      console.error('SSLCommerz init failed:', apiResponse);
      return res.status(502).json({ message: 'Unable to start payment session' });
    }

    booking.cancellationFeeTransactionId = tran_id;
    await booking.save();

    res.json({ GatewayPageURL: apiResponse.GatewayPageURL });
  } catch (error) {
    console.error('Error initiating cancellation fee payment:', error);
    res.status(500).json({ message: 'Server error initiating payment' });
  }
});

// -----------------------------------------------
// POST /init-subscription — Homeowner subscribes to (or renews) Premium
// -----------------------------------------------
router.post('/init-subscription', auth, async (req, res) => {
  try {
    const { billingCycle } = req.body;
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return res.status(400).json({ message: 'billingCycle must be "monthly" or "yearly"' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role === 'provider' || user.role === 'admin') {
      return res.status(403).json({ message: 'Subscriptions are only available for homeowner accounts' });
    }

    const amount = SUBSCRIPTION_PRICES[billingCycle];
    const prefix = billingCycle === 'yearly' ? SUB_YEARLY_PREFIX : SUB_MONTHLY_PREFIX;
    const tran_id = `${prefix}${user._id}_${Date.now()}`;

    const data = {
      total_amount: amount,
      tran_id,
      success_url: `${getApiUrl()}/api/payment/success`,
      fail_url: `${getApiUrl()}/api/payment/fail`,
      cancel_url: `${getApiUrl()}/api/payment/cancel`,
      ipn_url: `${getApiUrl()}/api/payment/ipn`,
      ...buildCustomerData(
        { name: user.name, email: user.email },
        `FIXNEST Premium Subscription (${billingCycle})`,
        'Subscription'
      )
    };

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const apiResponse = await sslcz.init(data);

    if (!apiResponse?.GatewayPageURL) {
      console.error('SSLCommerz init failed:', apiResponse);
      return res.status(502).json({ message: 'Unable to start payment session' });
    }

    user.subscriptionTransactionId = tran_id;
    user.subscriptionPaymentStatus = 'pending';
    await user.save();

    res.json({ GatewayPageURL: apiResponse.GatewayPageURL });
  } catch (error) {
    console.error('Error initiating subscription payment:', error);
    res.status(500).json({ message: 'Server error initiating payment' });
  }
});

// Finds who/what a tran_id belongs to, based on its prefix.
async function resolvePaymentTarget(tran_id) {
  if (!tran_id) return { kind: null, target: null, billingCycle: null };

  if (tran_id.startsWith(CANCELFEE_PREFIX)) {
    const booking = await Booking.findOne({ cancellationFeeTransactionId: tran_id });
    return { kind: 'cancellation_fee', target: booking, billingCycle: null };
  }

  if (tran_id.startsWith(SUB_MONTHLY_PREFIX) || tran_id.startsWith(SUB_YEARLY_PREFIX)) {
    const user = await User.findOne({ subscriptionTransactionId: tran_id });
    const billingCycle = tran_id.startsWith(SUB_YEARLY_PREFIX) ? 'yearly' : 'monthly';
    return { kind: 'subscription', target: user, billingCycle };
  }

  const booking = await Booking.findOne({ transactionId: tran_id });
  return { kind: 'booking', target: booking, billingCycle: null };
}

async function markPaid({ kind, target, billingCycle }) {
  if (!target) return;

  if (kind === 'cancellation_fee') {
    target.cancellationFeePaymentStatus = 'paid';
  } else if (kind === 'subscription') {
    const days = billingCycle === 'yearly' ? 365 : 30;
    const now = new Date();
    // Renewing before expiry stacks on top of the remaining time instead of resetting it.
    const base = target.subscriptionExpiresAt && target.subscriptionExpiresAt > now
      ? target.subscriptionExpiresAt
      : now;
    target.subscriptionExpiresAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    target.subscriptionPlan = 'premium';
    target.subscriptionBillingCycle = billingCycle;
    target.subscriptionPaymentStatus = 'paid';
    target.role = 'premium_user';
  } else {
    target.paymentStatus = 'paid';
  }

  await target.save();
}

async function markFailed({ kind, target }) {
  if (!target) return;

  if (kind === 'cancellation_fee') {
    if (target.cancellationFeePaymentStatus !== 'paid') target.cancellationFeePaymentStatus = 'failed';
  } else if (kind === 'subscription') {
    if (target.subscriptionPaymentStatus !== 'paid') target.subscriptionPaymentStatus = 'failed';
  } else if (target.paymentStatus !== 'paid') {
    target.paymentStatus = 'failed';
  }

  await target.save();
}

// -----------------------------------------------
// POST /success — SSLCommerz redirects the browser here after a successful payment
// -----------------------------------------------
router.post('/success', async (req, res) => {
  try {
    const { tran_id, val_id } = req.body;
    const resolved = await resolvePaymentTarget(tran_id);

    if (resolved.target && val_id) {
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      const validation = await sslcz.validate({ val_id });

      if (validation?.status === 'VALID' || validation?.status === 'VALIDATED') {
        await markPaid(resolved);
      }
    }

    res.redirect(`${getAppUrl()}/payment-result?status=success&type=${resolved.kind || ''}&bookingId=${resolved.target?._id || ''}`);
  } catch (error) {
    console.error('Error handling payment success callback:', error);
    res.redirect(`${getAppUrl()}/payment-result?status=fail`);
  }
});

// -----------------------------------------------
// POST /fail — SSLCommerz redirects the browser here after a failed payment
// -----------------------------------------------
router.post('/fail', async (req, res) => {
  try {
    const { tran_id } = req.body;
    const resolved = await resolvePaymentTarget(tran_id);
    if (resolved.target) {
      await markFailed(resolved);
    }
    res.redirect(`${getAppUrl()}/payment-result?status=fail&type=${resolved.kind || ''}&bookingId=${resolved.target?._id || ''}`);
  } catch (error) {
    console.error('Error handling payment fail callback:', error);
    res.redirect(`${getAppUrl()}/payment-result?status=fail`);
  }
});

// -----------------------------------------------
// POST /cancel — SSLCommerz redirects the browser here if the payer cancels
// -----------------------------------------------
router.post('/cancel', async (req, res) => {
  const { tran_id } = req.body;
  const resolved = await resolvePaymentTarget(tran_id);
  res.redirect(`${getAppUrl()}/payment-result?status=cancel&type=${resolved.kind || ''}&bookingId=${resolved.target?._id || ''}`);
});

// -----------------------------------------------
// POST /ipn — Server-to-server Instant Payment Notification (async confirmation)
// -----------------------------------------------
router.post('/ipn', async (req, res) => {
  try {
    const { tran_id, val_id } = req.body;
    const resolved = await resolvePaymentTarget(tran_id);

    const alreadyPaid = resolved.kind === 'cancellation_fee'
      ? resolved.target?.cancellationFeePaymentStatus === 'paid'
      : resolved.kind === 'subscription'
        ? resolved.target?.subscriptionPaymentStatus === 'paid'
        : resolved.target?.paymentStatus === 'paid';

    if (resolved.target && val_id && !alreadyPaid) {
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      const validation = await sslcz.validate({ val_id });
      if (validation?.status === 'VALID' || validation?.status === 'VALIDATED') {
        await markPaid(resolved);
      }
    }

    res.status(200).send('IPN received');
  } catch (error) {
    console.error('Error handling IPN:', error);
    res.status(200).send('IPN received');
  }
});

module.exports = router;
