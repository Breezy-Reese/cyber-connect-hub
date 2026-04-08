// backend/routes/requests.js
const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const { protect, adminOnly } = require('../middleware/auth');

// GET pending requests (admin)
router.get('/pending', protect, adminOnly, async (req, res) => {
  try {
    const requests = await Request.getPendingRequests();
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET all requests (admin)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const requests = await Request.find()
      .populate('user', 'username')
      .populate('session', 'computer start_time')
      .sort({ created_at: -1 })
      .limit(100);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST create request (client)
router.post('/', protect, async (req, res) => {
  try {
    const { type, details, sessionId } = req.body;
    const request = await Request.create({
      user: req.user.id,
      session: sessionId || null,
      type,
      details: details || {},
    });
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH approve request
router.patch('/:id/approved', protect, adminOnly, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    await request.approve(req.body.response || null);
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH reject request
router.patch('/:id/rejected', protect, adminOnly, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    await request.reject(req.body.response || 'Request rejected');
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;