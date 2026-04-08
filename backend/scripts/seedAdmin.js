// backend/scripts/seedAdmin.js
// Run once to create your first admin account:
//   node backend/scripts/seedAdmin.js

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ username: 'admin' });
  if (existing) {
    console.log('Admin user already exists — skipping.');
    process.exit(0);
  }

  await User.create({
    username: 'basil59mutuku@gmail.com',
    password: '#Basil123',   // change this after first login!
    role: 'admin',
  });

  console.log('✅ Admin user created — username: admin  password: admin123');
  console.log('⚠  Change the password immediately after first login.');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});