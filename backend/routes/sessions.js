// backend/routes/sessions.js
const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const Computer = require('../models/Computer');
const { protect, adminOnly } = require('../middleware/auth');

// GET all active sessions (admin)
router.get('/active', protect, adminOnly, async (req, res) => {
  try {
    const sessions = await Session.getActiveSessions();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET current user's active session ← FIXED: req.user._id
router.get('/my', protect, async (req, res) => {
  try {
    const session = await Session.getUserActiveSession(req.user._id);
    if (!session) return res.status(404).json({ message: 'No active session' });
    res.json({ session });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST start a new session (admin assigns)
router.post('/start', protect, adminOnly, async (req, res) => {
  try {
    const { userId, computerId, durationMinutes = 60 } = req.body;

    const computer = await Computer.findById(computerId);
    if (!computer) return res.status(404).json({ message: 'Computer not found' });
    if (computer.status !== 'available') {
      return res.status(400).json({ message: 'Computer is not available' });
    }

    const session = await Session.create({
      user: userId,
      computer: computerId,
      remaining_time: durationMinutes * 60,
      hourly_rate_at_start: computer.hourly_rate,
      status: 'active',
    });

    await Computer.findByIdAndUpdate(computerId, {
      status: 'in_use',
      current_session: session._id,
    });

    // Notify via socket
    const io = req.app.get('io');
    if (io) io.to(`user_${userId}`).emit('session_started', session);

    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST add time to session (admin)
router.post('/:id/add-time', protect, adminOnly, async (req, res) => {
  try {
    const { minutes = 30 } = req.body;
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const result = session.addTime(minutes);
    await session.save();

    const io = req.app.get('io');
    if (io) io.to(`user_${session.user}`).emit('time_added', { minutes, session });

    res.json({ message: `Added ${minutes} minutes`, ...result, session });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST end session (admin)
router.post('/:id/end', protect, adminOnly, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const ended = await session.endSession();

    const io = req.app.get('io');
    if (io) io.to(`user_${session.user}`).emit('session_ended', ended);

    res.json(ended);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;