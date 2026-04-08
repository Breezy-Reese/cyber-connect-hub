const express = require('express');
const router = express.Router();
const { protect: authenticate, adminOnly: adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Session = require('../models/Session');
const Computer = require('../models/Computer');
const Request = require('../models/Request');
const ActivityLog = require('../models/ActivityLog');
const PrintJob = require('../models/PrintJob');
const TicketCode = require('../models/TicketCode');

// Get dashboard statistics
router.get('/dashboard', authenticate, adminAuth, async (req, res) => {
  try {
    const activeSessions = await Session.countDocuments({ status: 'active' });
    const totalUsers = await User.countDocuments({ role: 'client' });
    const pendingRequests = await Request.countDocuments({ status: 'pending' });
    const availableComputers = await Computer.countDocuments({ status: 'available' });
    
    // Get today's earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySessions = await Session.find({
      end_time: { $gte: today },
      status: 'ended'
    });
    
    const todayEarnings = todaySessions.reduce((sum, session) => sum + (session.total_cost || 0), 0);
    
    // Get recent activity
    const recentActivities = await ActivityLog.find()
      .populate('user', 'username full_name')
      .sort({ created_at: -1 })
      .limit(10);
    
    res.json({
      success: true,
      data: {
        activeSessions,
        totalUsers,
        pendingRequests,
        availableComputers,
        todayEarnings,
        recentActivities
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all users
router.get('/users', authenticate, adminAuth, async (req, res) => {
  try {
    const users = await User.find({ role: 'client' })
      .select('-password')
      .sort({ created_at: -1 });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single user
router.get('/users/:userId', authenticate, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user balance
router.put('/users/:userId/balance', authenticate, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, action } = req.body;
    
    if (!amount || !action) {
      return res.status(400).json({ success: false, error: 'Amount and action are required' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    if (action === 'add') {
      user.balance += amount;
    } else if (action === 'subtract') {
      if (user.balance < amount) {
        return res.status(400).json({ success: false, error: 'Insufficient balance' });
      }
      user.balance -= amount;
    } else {
      return res.status(400).json({ success: false, error: 'Invalid action. Use "add" or "subtract"' });
    }
    
    await user.save();
    
    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'balance_updated',
      details: {
        targetUser: userId,
        action,
        amount,
        newBalance: user.balance
      }
    });
    
    res.json({
      success: true,
      message: 'Balance updated successfully',
      data: {
        id: user._id,
        username: user.username,
        balance: user.balance
      }
    });
  } catch (error) {
    console.error('Update balance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all print jobs
router.get('/print-jobs', authenticate, adminAuth, async (req, res) => {
  try {
    const printJobs = await PrintJob.find()
      .populate('user', 'username full_name')
      .populate('session')
      .sort({ created_at: -1 })
      .limit(100);
    
    res.json({
      success: true,
      data: printJobs
    });
  } catch (error) {
    console.error('Get print jobs error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update print job status
router.put('/print-jobs/:jobId', authenticate, adminAuth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status, printer_name, error_message } = req.body;
    
    const printJob = await PrintJob.findById(jobId);
    if (!printJob) {
      return res.status(404).json({ success: false, error: 'Print job not found' });
    }
    
    printJob.status = status;
    if (printer_name) printJob.printer_name = printer_name;
    if (status === 'completed') {
      printJob.completed_at = new Date();
    }
    if (status === 'failed' && error_message) {
      printJob.error_message = error_message;
    }
    
    await printJob.save();
    
    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'print_job_updated',
      details: {
        jobId,
        status,
        printer_name
      }
    });
    
    res.json({
      success: true,
      message: 'Print job updated successfully',
      data: printJob
    });
  } catch (error) {
    console.error('Update print job error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all tickets
router.get('/tickets', authenticate, adminAuth, async (req, res) => {
  try {
    const tickets = await TicketCode.find()
      .populate('created_by', 'username')
      .populate('used_by', 'username')
      .sort({ created_at: -1 });
    
    res.json({
      success: true,
      data: tickets
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate ticket
router.post('/tickets', authenticate, adminAuth, async (req, res) => {
  try {
    const { duration, expiryDays = 7 } = req.body;
    
    if (!duration || duration < 15 || duration > 480) {
      return res.status(400).json({ success: false, error: 'Duration must be between 15 and 480 minutes' });
    }
    
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + expiryDays);
    
    const ticket = await TicketCode.create({
      duration,
      created_by: req.user._id,
      expires_at
    });
    
    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'ticket_generated',
      details: {
        ticketCode: ticket.code,
        duration,
        expires_at
      }
    });
    
    res.json({
      success: true,
      message: 'Ticket generated successfully',
      data: {
        code: ticket.code,
        duration: ticket.duration,
        expires_at: ticket.expires_at
      }
    });
  } catch (error) {
    console.error('Generate ticket error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get system logs
router.get('/logs', authenticate, adminAuth, async (req, res) => {
  try {
    const { limit = 100, user, action } = req.query;
    let query = {};
    
    if (user) {
      query.user = user;
    }
    if (action) {
      query.action = action;
    }
    
    const logs = await ActivityLog.find(query)
      .populate('user', 'username full_name')
      .sort({ created_at: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all active sessions
router.get('/active-sessions', authenticate, adminAuth, async (req, res) => {
  try {
    const activeSessions = await Session.find({ status: 'active' })
      .populate('user', 'username full_name')
      .populate('computer', 'computer_name hourly_rate')
      .sort({ start_time: -1 });
    
    res.json({
      success: true,
      data: activeSessions
    });
  } catch (error) {
    console.error('Get active sessions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all pending requests
router.get('/pending-requests', authenticate, adminAuth, async (req, res) => {
  try {
    const pendingRequests = await Request.find({ status: 'pending' })
      .populate('user', 'username full_name')
      .populate('session')
      .sort({ created_at: -1 });
    
    res.json({
      success: true,
      data: pendingRequests
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approve request
router.put('/requests/:requestId/approve', authenticate, adminAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { response } = req.body;
    
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }
    
    request.status = 'approved';
    request.admin_response = response;
    request.resolved_at = new Date();
    await request.save();
    
    // Handle time extension approval
    if (request.type === 'time_extension' && request.session) {
      const session = await Session.findById(request.session);
      if (session && session.status === 'active') {
        const minutes = request.details.minutes;
        session.remaining_time += minutes * 60;
        const cost = (minutes / 60) * session.hourly_rate_at_start;
        session.total_cost += cost;
        await session.save();
      }
    }
    
    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'request_approved',
      details: {
        requestId,
        type: request.type,
        response
      }
    });
    
    res.json({
      success: true,
      message: 'Request approved successfully',
      data: request
    });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reject request
router.put('/requests/:requestId/reject', authenticate, adminAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { response } = req.body;
    
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }
    
    request.status = 'rejected';
    request.admin_response = response;
    request.resolved_at = new Date();
    await request.save();
    
    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'request_rejected',
      details: {
        requestId,
        type: request.type,
        response
      }
    });
    
    res.json({
      success: true,
      message: 'Request rejected',
      data: request
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;