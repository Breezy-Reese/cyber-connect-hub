const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
    // e.g. 'login', 'logout', 'ticket_generated', etc.
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ip_address: {
    type: String,
    default: null,
  },
  user_agent: {
    type: String,
    default: null,
  },
}, { timestamps: true });

// Static log method used throughout auth.js
activityLogSchema.statics.log = async function (userId, action, details = {}, req = null) {
  const entry = {
    user: userId,
    action,
    details,
  };

  if (req) {
    entry.ip_address = req.ip || req.headers['x-forwarded-for'] || null;
    entry.user_agent = req.headers['user-agent'] || null;
  }

  return await this.create(entry);
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);