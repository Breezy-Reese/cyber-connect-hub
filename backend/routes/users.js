// backend/routes/users.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Admin access required' });
  next();
};

router.get('/', authenticate, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ is_online: -1, last_login: -1 });

    const activeSessions = await Session.find({ status: 'active' })
      .populate('computer', 'computer_name')
      .lean();

    const sessionMap = {};
    for (const s of activeSessions) {
      if (s.user) sessionMap[s.user.toString()] = s;
    }

    const result = users.map((u) => {
      const s = sessionMap[u._id.toString()];
      return {
        _id: u._id,
        username: u.username,
        email: u.email || null,
        role: u.role,
        is_online: u.is_online,
        last_login: u.last_login,
        created_at: u.createdAt,
        total_sessions: u.total_sessions || 0,
        total_spent: u.total_spent || 0,
        active_session: s
          ? {
              computer_name: s.computer?.computer_name || 'Unknown',
              start_time: s.start_time || s.createdAt,
              remaining_time: s.remainingSeconds || s.remaining_time || 0,
            }
          : null,
      };
    });

    res.json({ users: result });
  } catch (err) {
    console.error('GET /users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/kick', authenticate, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { is_online: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: `${user.username} has been kicked` });
  } catch (err) {
    console.error('Kick error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;