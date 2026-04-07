const express = require('express');
const router = express.Router();
const { authenticate, adminAuth } = require('../middleware/auth');
const Computer = require('../models/Computer');
const ActivityLog = require('../models/ActivityLog');

// Get all computers
router.get('/', authenticate, async (req, res) => {
  try {
    const computers = await Computer.find().sort({ computer_name: 1 });
    res.json({
      success: true,
      data: computers
    });
  } catch (error) {
    console.error('Get computers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get available computers
router.get('/available', authenticate, async (req, res) => {
  try {
    const computers = await Computer.find({ status: 'available' });
    res.json({
      success: true,
      data: computers
    });
  } catch (error) {
    console.error('Get available computers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single computer
router.get('/:computerId', authenticate, async (req, res) => {
  try {
    const { computerId } = req.params;
    const computer = await Computer.findById(computerId);
    
    if (!computer) {
      return res.status(404).json({ success: false, error: 'Computer not found' });
    }
    
    res.json({
      success: true,
      data: computer
    });
  } catch (error) {
    console.error('Get computer error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add new computer (admin only)
router.post('/', authenticate, adminAuth, async (req, res) => {
  try {
    const { computer_name, ip_address, hourly_rate, specifications } = req.body;
    
    const existingComputer = await Computer.findOne({ computer_name });
    if (existingComputer) {
      return res.status(400).json({ success: false, error: 'Computer name already exists' });
    }
    
    const computer = await Computer.create({
      computer_name,
      ip_address,
      hourly_rate: hourly_rate || 2.50,
      specifications,
      status: 'available'
    });
    
    await ActivityLog.create({
      user: req.user._id,
      action: 'computer_added',
      details: { computer: computer.computer_name }
    });
    
    res.status(201).json({
      success: true,
      message: 'Computer added successfully',
      data: computer
    });
  } catch (error) {
    console.error('Add computer error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update computer
router.put('/:computerId', authenticate, adminAuth, async (req, res) => {
  try {
    const { computerId } = req.params;
    const updates = req.body;
    
    const computer = await Computer.findByIdAndUpdate(
      computerId,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!computer) {
      return res.status(404).json({ success: false, error: 'Computer not found' });
    }
    
    await ActivityLog.create({
      user: req.user._id,
      action: 'computer_updated',
      details: { computerId, updates }
    });
    
    res.json({
      success: true,
      message: 'Computer updated successfully',
      data: computer
    });
  } catch (error) {
    console.error('Update computer error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete computer
router.delete('/:computerId', authenticate, adminAuth, async (req, res) => {
  try {
    const { computerId } = req.params;
    
    const computer = await Computer.findById(computerId);
    if (!computer) {
      return res.status(404).json({ success: false, error: 'Computer not found' });
    }
    
    if (computer.status === 'in_use') {
      return res.status(400).json({ success: false, error: 'Cannot delete computer that is in use' });
    }
    
    await computer.deleteOne();
    
    await ActivityLog.create({
      user: req.user._id,
      action: 'computer_deleted',
      details: { computerId: computerId, computerName: computer.computer_name }
    });
    
    res.json({
      success: true,
      message: 'Computer deleted successfully'
    });
  } catch (error) {
    console.error('Delete computer error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;