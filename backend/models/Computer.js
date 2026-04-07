const mongoose = require('mongoose');

const computerSchema = new mongoose.Schema({
  computer_name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  ip_address: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['available', 'in_use', 'maintenance', 'offline'],
    default: 'available'
  },
  hourly_rate: {
    type: Number,
    default: 2.50,
    min: 0
  },
  current_session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    default: null
  },
  specifications: {
    processor: String,
    ram: String,
    storage: String,
    os: String
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Method to check if computer is available
computerSchema.methods.isAvailable = function() {
  return this.status === 'available';
};

// Static method to get available computers
computerSchema.statics.getAvailableComputers = function() {
  return this.find({ status: 'available' });
};

// Static method to get computers in use
computerSchema.statics.getComputersInUse = function() {
  return this.find({ status: 'in_use' }).populate('current_session');
};

module.exports = mongoose.model('Computer', computerSchema);