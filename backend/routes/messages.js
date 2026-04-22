// backend/routes/messages.js
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect, adminOnly } = require('../middleware/auth');

// GET messages for current client (their conversation with admin)
router.get('/my', protect, async (req, res) => {
  try {
    const messages = await Message.getConversation(req.user._id);
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all messages from clients (admin only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const messages = await Message.getAllClientMessages();
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET conversation with a specific client (admin only)
router.get('/conversation/:userId', protect, adminOnly, async (req, res) => {
  try {
    const messages = await Message.getConversation(req.params.userId);
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST send message (client → admin)
router.post('/', protect, async (req, res) => {
  try {
    const { text, sessionId } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const message = await Message.create({
      from: req.user._id,
      to: null, // broadcast to all admins
      session: sessionId || null,
      text: text.trim(),
      role: req.user.role,
    });

    await message.populate('from', 'username role');

    // Emit via socket if available (attached to app)
    const io = req.app.get('io');
    if (io) {
      io.emit('new_message', message);
    }

    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST admin reply to a client
router.post('/reply/:userId', protect, adminOnly, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const message = await Message.create({
      from: req.user._id,
      to: req.params.userId,
      text: text.trim(),
      role: 'admin',
    });

    await message.populate('from', 'username role');

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${req.params.userId}`).emit('new_message', message);
      io.emit('admin_reply', message);
    }

    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH mark messages as read (admin)
router.patch('/read/:userId', protect, adminOnly, async (req, res) => {
  try {
    await Message.updateMany(
      { from: req.params.userId, read: false },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;