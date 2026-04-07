const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const TicketCode = require('../models/TicketCode');
const ActivityLog = require('../models/ActivityLog');
const { authenticate } = require('../middleware/auth');

// Login endpoint
router.post('/login', [
  body('username').notEmpty().trim(),
  body('password').optional(),
  body('loginType').isIn(['password', 'ticket']),
  body('ticketCode').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { username, password, loginType, ticketCode } = req.body;
    let user;
    
    if (loginType === 'password') {
      user = await User.findOne({ username });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } else if (loginType === 'ticket') {
      try {
        const ticket = await TicketCode.useTicket(ticketCode, null);
        
        // Create temporary user for ticket access
        const tempUsername = `guest_${ticketCode.slice(0, 8)}`;
        user = await User.findOne({ username: tempUsername });
        
        if (!user) {
          user = await User.create({
            username: tempUsername,
            password: Math.random().toString(36).slice(-8),
            full_name: 'Guest User',
            email: `${tempUsername}@guest.cybercafe.com`,
            role: 'client',
            balance: 0
          });
        }
        
        // Mark ticket as used with user
        ticket.used_by = user._id;
        await ticket.save();
      } catch (error) {
        return res.status(401).json({ error: error.message });
      }
    }
    
    // Update last login
    user.last_login = new Date();
    await user.save();
    
    // Log activity
    await ActivityLog.log(user._id, 'login', { method: loginType }, req);
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        balance: user.balance
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register new client
router.post('/register', [
  body('username').notEmpty().trim().isLength({ min: 3 }),
  body('password').notEmpty().isLength({ min: 6 }),
  body('email').isEmail(),
  body('full_name').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { username, password, email, full_name } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const user = await User.create({
      username,
      password,
      email,
      full_name,
      role: 'client'
    });
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate ticket code (admin only)
router.post('/generate-ticket', [
  authenticate,
  body('duration').isInt({ min: 15, max: 480 })
], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { duration } = req.body;
    const ticket = await TicketCode.generateTicket(req.user._id, duration);
    
    await ActivityLog.log(req.user._id, 'ticket_generated', { 
      ticketCode: ticket.code, 
      duration 
    }, req);
    
    res.json({
      ticketCode: ticket.code,
      duration: ticket.duration,
      expires_at: ticket.expires_at,
      message: 'Ticket code generated successfully'
    });
  } catch (error) {
    console.error('Ticket generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint
router.post('/logout', authenticate, async (req, res) => {
  try {
    await ActivityLog.log(req.user._id, 'logout', {}, req);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;