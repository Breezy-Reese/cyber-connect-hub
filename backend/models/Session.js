const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  computer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Computer',
    required: true
  },
  start_time: {
    type: Date,
    default: Date.now,
    required: true
  },
  end_time: {
    type: Date
  },
  remaining_time: {
    type: Number, // in seconds
    default: 3600 // default 1 hour
  },
  total_cost: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'ended', 'expired', 'paused'],
    default: 'active'
  },
  hourly_rate_at_start: {
    type: Number,
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Virtual for remaining minutes
sessionSchema.virtual('remaining_minutes').get(function() {
  return Math.floor(this.remaining_time / 60);
});

// Virtual for elapsed seconds
sessionSchema.virtual('elapsed_seconds').get(function() {
  if (!this.start_time) return 0;
  const now = this.end_time || new Date();
  return Math.floor((now - this.start_time) / 1000);
});

// Virtual for elapsed minutes
sessionSchema.virtual('elapsed_minutes').get(function() {
  return Math.floor(this.elapsed_seconds / 60);
});

// Method to calculate current cost
sessionSchema.methods.calculateCurrentCost = function() {
  const hours = this.elapsed_seconds / 3600;
  return hours * this.hourly_rate_at_start;
};

// Method to add time
sessionSchema.methods.addTime = function(minutes) {
  this.remaining_time += minutes * 60;
  const cost = (minutes / 60) * this.hourly_rate_at_start;
  this.total_cost += cost;
  return { minutes, cost };
};

// Method to end session
sessionSchema.methods.endSession = async function() {
  this.end_time = new Date();
  this.status = 'ended';
  this.total_cost = this.calculateCurrentCost();
  await this.save();
  
  // Update computer status
  const Computer = mongoose.model('Computer');
  await Computer.findByIdAndUpdate(this.computer, {
    status: 'available',
    current_session: null
  });
  
  return this;
};

// Static method to get active sessions
sessionSchema.statics.getActiveSessions = function() {
  return this.find({ status: 'active' })
    .populate('user', 'username full_name')
    .populate('computer', 'computer_name hourly_rate')
    .sort({ start_time: -1 });
};

// Static method to get user active session
sessionSchema.statics.getUserActiveSession = function(userId) {
  return this.findOne({ user: userId, status: 'active' })
    .populate('computer', 'computer_name hourly_rate');
};

module.exports = mongoose.model('Session', sessionSchema);