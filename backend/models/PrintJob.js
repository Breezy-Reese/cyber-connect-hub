const mongoose = require('mongoose');

const printJobSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  file_name: {
    type: String,
    required: true
  },
  file_path: {
    type: String
  },
  file_size: {
    type: Number
  },
  copies: {
    type: Number,
    default: 1,
    min: 1,
    max: 100
  },
  color: {
    type: Boolean,
    default: false
  },
  pages: {
    type: Number,
    default: 1
  },
  cost: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'printing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  completed_at: {
    type: Date
  },
  printer_name: {
    type: String
  },
  error_message: {
    type: String
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Method to calculate cost
printJobSchema.methods.calculateCost = function(pageRate = 0.10) {
  this.cost = this.pages * this.copies * pageRate;
  if (this.color) this.cost *= 2;
  return this.cost;
};

// Method to complete print job
printJobSchema.methods.complete = async function() {
  this.status = 'completed';
  this.completed_at = new Date();
  await this.save();
  return this;
};

// Method to fail print job
printJobSchema.methods.fail = async function(error) {
  this.status = 'failed';
  this.error_message = error;
  await this.save();
  return this;
};

// Static method to get pending print jobs
printJobSchema.statics.getPendingJobs = function() {
  return this.find({ status: 'pending' })
    .populate('user', 'username full_name')
    .populate('session')
    .sort({ created_at: 1 });
};

module.exports = mongoose.model('PrintJob', printJobSchema);