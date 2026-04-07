const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Request = require('../models/Request');

// Get user's requests
router.get('/', authenticate, async (req, res) => {
  try {
    const requests = await Request.getUserRequests(req.user._id);
    res.json(requests);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new request
router.post('/', authenticate, async (req, res) => {
  try {
    const { type, details, sessionId } = req.body;
    
    const request = await Request.create({
      user: req.user._id,
      session: sessionId,
      type,
      details
    });
    
    res.status(201).json(request);
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific request
router.get('/:requestId', authenticate, async (req, res) => {
  try {
    const request = await Request.findById(req.params.requestId)
      .populate('user', 'username full_name')
      .populate('session');
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    // Check if user owns the request or is admin
    if (request.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(request);
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;