const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'client'],
      default: 'client',
    },
    assignedPC: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    is_online: { type: Boolean, default: false },
    last_login: { type: Date, default: null },
    total_sessions: { type: Number, default: 0 },
    total_spent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
