const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  // Get token from header
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.accountStatus === 'deleted') {
      return res.status(403).json({
        message: 'Your account has been deleted by an administrator.',
        deletionReason: user.deletionReason || 'No reason provided.',
        accountStatus: user.accountStatus
      });
    }

    // Lazily downgrade an expired Premium subscription back to Free.
    if (user.role === 'premium_user' && user.subscriptionExpiresAt && user.subscriptionExpiresAt < new Date()) {
      user.role = 'user';
      user.subscriptionPlan = 'free';
      user.subscriptionBillingCycle = null;
      await user.save();
    }

    req.user = {
      ...decoded,
      role: user.role,
      accountStatus: user.accountStatus
    };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
