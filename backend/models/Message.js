// backend/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null means "to all admins"
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    default: null
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  role: {
    type: String,
    enum: ['client', 'admin'],
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Get conversation between a client and admins
messageSchema.statics.getConversation = function(userId, limit = 50) {
  return this.find({
    $or: [{ from: userId }, { to: userId }]
  })
    .populate('from', 'username role')
    .populate('to', 'username role')
    .sort({ created_at: 1 })
    .limit(limit);
};

// Get all client messages (for admin view)
messageSchema.statics.getAllClientMessages = function() {
  return this.find({ role: 'client' })
    .populate('from', 'username role')
    .sort({ created_at: -1 })
    .limit(100);
};

module.exports = mongoose.model('Message', messageSchema);