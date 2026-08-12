const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth'); // your existing shared middleware
const Message = require('../models/Message');
const User = require('../models/User');

// requireAuth sets req.user = decoded token payload.
// This assumes your login route signs the token with an `id` claim
// (jwt.sign({ id: user._id }, ...)). If it uses `_id` or `userId` instead,
// swap every `req.user.id` below for the matching field name.

// List the other side's users available to chat with
// (providers see homeowners, homeowners see providers)
router.get('/contacts', requireAuth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
    const targetRole = me.role === 'provider' ? 'homeowner' : 'provider';
    const contacts = await User.find({ role: targetRole }).select('name role');
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ message: 'Server error fetching contacts' });
  }
});

// One row per conversation partner, with the most recent message
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'name role')
      .populate('receiver', 'name role');

    const conversations = new Map();
    messages.forEach((msg) => {
      const isSender = String(msg.sender._id) === String(userId);
      const partner = isSender ? msg.receiver : msg.sender;
      const key = String(partner._id);
      if (!conversations.has(key)) {
        conversations.set(key, {
          partnerId: partner._id,
          partnerName: partner.name,
          partnerRole: partner.role,
          lastMessage: msg.text,
          lastMessageAt: msg.createdAt,
          unread: !isSender && !msg.read
        });
      }
    });

    res.json(Array.from(conversations.values()));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error fetching conversations' });
  }
});

// Full message history with one specific user, marks their messages as read
router.get('/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id }
      ]
    }).sort({ createdAt: 1 });

    await Message.updateMany(
      { sender: userId, receiver: req.user.id, read: false },
      { $set: { read: true } }
    );

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
});

// HTTP fallback for sending a message (socket is the primary path)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { receiver, text } = req.body;
    if (!receiver || !text) {
      return res.status(400).json({ message: 'receiver and text are required' });
    }
    const message = await Message.create({ sender: req.user.id, receiver, text });
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
});

module.exports = router;