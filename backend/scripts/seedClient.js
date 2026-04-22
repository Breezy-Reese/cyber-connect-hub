require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ username: 'zobo' });
  if (existing) {
    console.log('User zobo EXISTS in database');
    console.log('Role:', existing.role);
    process.exit(0);
  }

  await User.create({ username: 'zobo', password: 'zobo123', role: 'client' });
  console.log('User zobo created — login with zobo / zobo123');
  process.exit(0);
};

seed().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
