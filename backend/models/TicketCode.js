const mongoose = require('mongoose');
const crypto = require('crypto');

const ticketCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  duration: {
    type: Number, // in minutes
    required: true,
  },
  generated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  used_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  is_used: {
    type: Boolean,
    default: false,
  },
  expires_at: {
    type: Date,
    required: true,
  },
  used_at: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

// Generate a new ticket code (admin only)
ticketCodeSchema.statics.generateTicket = async function (adminId, duration) {
  const code = crypto.randomBytes(6).toString('hex').toUpperCase(); // e.g. "A3F9B2C1D4E5"
  const expires_at = new Date(Date.now() + duration * 60 * 1000);

  const ticket = await this.create({
    code,
    duration,
    generated_by: adminId,
    expires_at,
  });

  return ticket;
};

// Use a ticket code — validates and marks as used
ticketCodeSchema.statics.useTicket = async function (code, userId) {
  const ticket = await this.findOne({ code });

  if (!ticket) {
    throw new Error('Invalid ticket code');
  }
  if (ticket.is_used) {
    throw new Error('Ticket code has already been used');
  }
  if (new Date() > ticket.expires_at) {
    throw new Error('Ticket code has expired');
  }

  ticket.is_used = true;
  ticket.used_by = userId;
  ticket.used_at = new Date();
  await ticket.save();

  return ticket;
};

module.exports = mongoose.model('TicketCode', ticketCodeSchema);