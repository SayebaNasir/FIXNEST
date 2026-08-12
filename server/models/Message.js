const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Speeds up fetching a conversation between two users, ordered by time
messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);