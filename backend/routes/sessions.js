const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Session = require('../models/Session');
const Computer = require('../models/Computer');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { authenticate } = require('../middleware/auth');

// Start a session
router.post('/start', [
  authenticate,
  body('computerId').isMongoId(),
  body('duration').optional().isInt({ min: 15 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Check if user already has active session
    const activeSession = await Session.getUserActiveSession(req.user._id);
    if (activeSession) {
      return res.status(400).json({ error: 'You already have an active session' });
    }
    
    const { computerId, duration } = req.body;
    
    // Check if computer exists and is available
    const computer = await Computer.findById(computerId);
    if (!computer) {
      return res.status(404).json({ error: 'Computer not found' });
    }
    
    if (!computer.isAvailable()) {
      return res.status(400).json({ error: 'Computer is not available' });
    }
    
    // Check user balance if required
    if (req.user.balance < computer.hourly_rate) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Create session
    const session = new Session({
      user: req.user._id,
      computer: computerId,
      remaining_time: (duration || 60) * 60,
      hourly_rate_at_start: computer.hourly_rate,
      status: 'active'
    });
    
    await session.save();
    
    // Update computer status
    computer.status = 'in_use';
    computer.current_session = session._id;
    await computer.save();
    
    // Log activity
    await ActivityLog.log(req.user._id, 'session_start', { 
      computer: computer.computer_name,
      sessionId: session._id
    }, req);
    
    res.json({
      message: 'Session started successfully',
      session: {
        id: session._id,
        computer: computer.computer_name,
        start_time: session.start_time,
        remaining_time: session.remaining_time,
        hourly_rate: session.hourly_rate_at_start
      }
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// End current session
router.post('/end', authenticate, async (req, res) => {
  try {
    const session = await Session.getUserActiveSession(req.user._id);
    if (!session) {
      return res.status(400).json({ error: 'No active session found' });
    }
    
    const endedSession = await session.endSession();
    
    // Update user balance
    const user = await User.findById(req.user._id);
    user.balance -= endedSession.total_cost;
    await user.save();
    
    // Log activity
    await ActivityLog.log(req.user._id, 'session_end', { 
      sessionId: session._id,
      duration: endedSession.elapsed_minutes,
      cost: endedSession.total_cost
    }, req);
    
    res.json({
      message: 'Session ended successfully',
      session: {
        id: endedSession._id,
        start_time: endedSession.start_time,
        end_time: endedSession.end_time,
        duration_minutes: endedSession.elapsed_minutes,
        total_cost: endedSession.total_cost
      }
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current session info
router.get('/current', authenticate, async (req, res) => {
  try {
    const session = await Session.getUserActiveSession(req.user._id);
    if (!session) {
      return res.status(404).json({ message: 'No active session' });
    }
    
    res.json({
      id: session._id,
      computer: session.computer.computer_name,
      start_time: session.start_time,
      elapsed_minutes: session.elapsed_minutes,
      remaining_minutes: session.remaining_minutes,
      current_cost: session.calculateCurrentCost(),
      hourly_rate: session.hourly_rate_at_start
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get session history
router.get('/history', authenticate, async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user._id })
      .populate('computer', 'computer_name')
      .sort({ start_time: -1 })
      .limit(50);
    
    res.json(sessions.map(session => ({
      id: session._id,
      computer: session.computer.computer_name,
      start_time: session.start_time,
      end_time: session.end_time,
      duration_minutes: session.elapsed_minutes,
      total_cost: session.total_cost,
      status: session.status
    })));
  } catch (error) {
    console.error('Get session history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;