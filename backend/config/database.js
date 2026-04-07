const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if MongoDB URI is defined - using MONGO_URI (not MONGODB_URI)
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    
    console.log('Attempting to connect to MongoDB Atlas...');
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    
    // Create default admin user if not exists
    const User = require('../models/User');
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await User.create({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        full_name: 'System Administrator',
        email: 'admin@cybercafe.com',
        balance: 0
      });
      
      console.log('✅ Default admin user created: username=admin, password=admin123');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    // Create default computers if none exist
    const Computer = require('../models/Computer');
    const computerCount = await Computer.countDocuments();
    
    if (computerCount === 0) {
      const defaultComputers = [
        { computer_name: 'PC-01', ip_address: '192.168.1.101', hourly_rate: 2.50, status: 'available' },
        { computer_name: 'PC-02', ip_address: '192.168.1.102', hourly_rate: 2.50, status: 'available' },
        { computer_name: 'PC-03', ip_address: '192.168.1.103', hourly_rate: 2.50, status: 'available' },
        { computer_name: 'PC-04', ip_address: '192.168.1.104', hourly_rate: 3.00, status: 'available' },
        { computer_name: 'PC-05', ip_address: '192.168.1.105', hourly_rate: 3.00, status: 'available' }
      ];
      
      await Computer.insertMany(defaultComputers);
      console.log('✅ Default computers created');
    } else {
      console.log(`✅ ${computerCount} computers already exist`);
    }
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('\nPlease check:');
    console.error('1. Your MongoDB Atlas connection string is correct');
    console.error('2. Your IP is whitelisted in MongoDB Atlas');
    console.error('3. Username and password are correct');
    process.exit(1);
  }
};

module.exports = connectDB;