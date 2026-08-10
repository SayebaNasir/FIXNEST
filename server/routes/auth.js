const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Provider = require('../models/Provider');
const auth = require('../middleware/auth');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'user'
    });

    await user.save();

    // Create JWT
    const payload = { id: user._id, role: user.role, name: user.name, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });

    res.status(201).json({ token, user: payload });
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.accountStatus === 'deleted') {
      return res.status(403).json({
        message: 'Your account has been deleted by an administrator.',
        deletionReason: user.deletionReason || 'No reason provided.',
        accountStatus: user.accountStatus
      });
    }

    // Create JWT
    const payload = { id: user._id, role: user.role, name: user.name, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });

    res.json({ token, user: payload });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

router.get('/admin/users', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view users' });
    }

    const users = await User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 });
    const providers = await Provider.find({}).lean();
    const providerMap = new Map(providers.map((provider) => [String(provider.userId), provider]));

    const payload = users.map((userDoc) => ({
      ...userDoc.toObject(),
      providerProfile: providerMap.get(String(userDoc._id)) || null
    }));

    res.json(payload);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

const deactivateUserAccount = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can deactivate users' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.accountStatus === 'deleted') {
      return res.status(409).json({ message: 'This account has already been deleted.' });
    }

    const reason = req.body?.reason || req.query?.reason || 'No reason provided.';

    user.accountStatus = 'deleted';
    user.deletedAt = new Date();
    user.deletedBy = req.user.id;
    user.deletionReason = reason;
    await user.save();

    if (user.role === 'provider') {
      await Provider.findOneAndDelete({ userId: user._id });
    }

    res.json({
      message: 'User account deactivated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        deletionReason: user.deletionReason
      }
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ message: 'Server error deactivating user' });
  }
};

router.post('/admin/users/:id/deactivate', auth, deactivateUserAccount);
router.delete('/admin/users/:id/deactivate', auth, deactivateUserAccount);

router.get('/favorites', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const favoriteIds = (user.favorites || []).filter(Boolean);
    const providers = favoriteIds.length > 0
      ? await Provider.find({ _id: { $in: favoriteIds } }).sort({ name: 1 })
      : [];

    res.json(providers);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Server error fetching favorites' });
  }
});

router.post('/favorites/:providerId', auth, async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.providerId);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    if (String(provider.userId) === String(req.user.id)) {
      return res.status(400).json({ message: 'You cannot favorite yourself.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const alreadyFavorite = user.favorites.some((favoriteId) => favoriteId.toString() === provider._id.toString());
    if (alreadyFavorite) {
      return res.status(409).json({ message: 'Provider is already in your favorites.' });
    }

    user.favorites.push(provider._id);
    await user.save();

    res.json({ message: 'Provider added to favorites', provider });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ message: 'Server error adding favorite' });
  }
});

router.delete('/favorites/:providerId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.favorites = user.favorites.filter((favoriteId) => favoriteId.toString() !== req.params.providerId);
    await user.save();

    res.json({ message: 'Provider removed from favorites' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ message: 'Server error removing favorite' });
  }
});

module.exports = router;
