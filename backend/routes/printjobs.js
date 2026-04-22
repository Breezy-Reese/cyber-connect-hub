// backend/routes/printjobs.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PrintJob = require('../models/PrintJob');
const { protect, adminOnly } = require('../middleware/auth');

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/print');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Use PDF, DOC, DOCX, TXT, or images.'));
    }
  },
});

// GET all print jobs (admin)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const jobs = await PrintJob.getPendingJobs();
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET current user's print jobs
router.get('/my', protect, async (req, res) => {
  try {
    const jobs = await PrintJob.find({ user: req.user._id })
      .sort({ created_at: -1 })
      .limit(20);
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST submit a print job with file upload
router.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    const { copies = 1, color = false, pages = 1, sessionId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const job = await PrintJob.create({
      user: req.user._id,
      session: sessionId || null,
      file_name: req.file.originalname,
      file_path: req.file.path,
      file_size: req.file.size,
      copies: parseInt(copies),
      color: color === 'true' || color === true,
      pages: parseInt(pages),
      status: 'pending',
    });

    // Calculate cost
    job.calculateCost();
    await job.save();

    await job.populate('user', 'username');

    // Notify admin via socket
    const io = req.app.get('io');
    if (io) io.emit('new_print_job', job);

    res.status(201).json({ job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH update print job status (admin)
router.patch('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { status, printer_name } = req.body;
    const job = await PrintJob.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Print job not found' });

    job.status = status;
    if (printer_name) job.printer_name = printer_name;
    if (status === 'completed') job.completed_at = new Date();

    await job.save();

    const io = req.app.get('io');
    if (io) io.emit('print_job_updated', job);

    res.json({ job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE cancel print job (client can cancel their own pending job)
router.delete('/:id', protect, async (req, res) => {
  try {
    const job = await PrintJob.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Print job not found' });
    if (job.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (job.status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending jobs' });
    }
    job.status = 'cancelled';
    await job.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;