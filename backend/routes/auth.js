const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Ticket = require('../models/TicketCode');

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (role === 'admin' && user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const token = signToken({ id: user._id, role: user.role });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        pc: user.assignedPC || null,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/ticket', async (req, res) => {
  try {
    const { ticketCode } = req.body;

    if (!ticketCode) {
      return res.status(400).json({ message: 'Ticket code is required' });
    }

    const ticket = await Ticket.findOne({ code: ticketCode.toUpperCase() });

    if (!ticket) {
      return res.status(404).json({ message: 'Invalid ticket code' });
    }

    if (ticket.status === 'used') {
      return res.status(400).json({ message: 'Ticket has already been used' });
    }

    if (ticket.status === 'expired' || ticket.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Ticket has expired' });
    }

    ticket.status = 'used';
    ticket.usedAt = new Date();
    await ticket.save();

    const token = signToken({ id: ticket._id, role: 'client', ticketId: ticket._id });

    res.json({
      token,
      user: {
        id: ticket._id,
        username: `Guest-${ticketCode}`,
        role: 'client',
        sessionId: ticket._id,
        pc: ticket.assignedPC || null,
      },
    });
  } catch (err) {
    console.error('Ticket login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
