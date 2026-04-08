// backend/routes/computers.js
const express = require('express');
const router = express.Router();
const Computer = require('../models/Computer');
const { protect, adminOnly } = require('../middleware/auth');

// GET all computers
router.get('/', protect, async (req, res) => {
  try {
    const computers = await Computer.find().populate('current_session');
    res.json(computers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH update computer status
router.patch('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const computer = await Computer.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!computer) return res.status(404).json({ message: 'Computer not found' });
    res.json(computer);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST add new computer (admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const computer = await Computer.create(req.body);
    res.status(201).json(computer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE computer
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Computer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Computer removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;