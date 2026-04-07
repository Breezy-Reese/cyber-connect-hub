const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  type: {
    type: String,
    enum: ['print', 'time_extension', 'assistance', 'service', 'food', 'drink'],
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  admin_response: {
    type: String,
    default: null
  },
  resolved_at: {
    type: Date
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Method to approve request
requestSchema.methods.approve = async function(response = null) {
  this.status = 'approved';
  this.admin_response = response;
  this.resolved_at = new Date();
  await this.save();
  return this;
};

// Method to reject request
requestSchema.methods.reject = async function(response) {
  this.status = 'rejected';
  this.admin_response = response;
  this.resolved_at = new Date();
  await this.save();
  return this;
};

// Static method to get pending requests
requestSchema.statics.getPendingRequests = function() {
  return this.find({ status: 'pending' })
    .populate('user', 'username full_name')
    .populate('session', 'computer start_time')
    .sort({ created_at: -1 });
};

// Static method to get user requests
requestSchema.statics.getUserRequests = function(userId, limit = 50) {
  return this.find({ user: userId })
    .populate('session', 'computer')
    .sort({ created_at: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Request', requestSchema);