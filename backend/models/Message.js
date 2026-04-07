const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  is_read: {
    type: Boolean,
    default: false
  },
  read_at: {
    type: Date
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Method to mark as read
messageSchema.methods.markAsRead = async function() {
  if (!this.is_read) {
    this.is_read = true;
    this.read_at = new Date();
    await this.save();
  }
  return this;
};

// Static method to get conversation
messageSchema.statics.getConversation = async function(userId1, userId2, limit = 50) {
  return this.find({
    $or: [
      { sender: userId1, receiver: userId2 },
      { sender: userId2, receiver: userId1 }
    ]
  })
  .populate('sender', 'username full_name')
  .populate('receiver', 'username full_name')
  .sort({ created_at: -1 })
  .limit(limit);
};

// Static method to get unread messages
messageSchema.statics.getUnreadMessages = function(userId) {
  return this.find({ receiver: userId, is_read: false })
    .populate('sender', 'username full_name')
    .sort({ created_at: -1 });
};

module.exports = mongoose.model('Message', messageSchema);