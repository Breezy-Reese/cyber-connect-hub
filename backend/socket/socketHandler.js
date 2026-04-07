const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const Request = require('../models/Request');
const Message = require('../models/Message');
const PrintJob = require('../models/PrintJob');
const ActivityLog = require('../models/ActivityLog');

function setupSocketHandlers(io) {
  // Store connected clients with their user IDs
  const connectedClients = new Map();
  
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }
      
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.user.role})`);
    
    // Store client connection
    connectedClients.set(socket.user._id.toString(), socket.id);
    
    // Join user-specific room
    socket.join(`user:${socket.user._id}`);
    
    // Admin joins admin room
    if (socket.user.role === 'admin') {
      socket.join('admin-room');
    }
    
    // Send initial data based on role
    if (socket.user.role === 'client') {
      sendClientInitialData(socket);
    } else if (socket.user.role === 'admin') {
      sendAdminInitialData(socket);
    }
    
    // Handle client requests
    socket.on('request:service', async (data) => {
      try {
        const { type, details } = data;
        const activeSession = await Session.getUserActiveSession(socket.user._id);
        
        if (!activeSession) {
          socket.emit('error', { message: 'No active session found' });
          return;
        }
        
        const request = await Request.create({
          user: socket.user._id,
          session: activeSession._id,
          type: type,
          details: details
        });
        
        await request.populate('user', 'username full_name');
        
        // Notify admin
        io.to('admin-room').emit('notification:new_request', {
          request,
          user: socket.user
        });
        
        socket.emit('request:submitted', { request });
        
        // Log activity
        await ActivityLog.log(socket.user._id, `${type}_request`, details, socket.handshake);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    // Handle time extension request
    socket.on('request:time_extension', async (data) => {
      try {
        const { minutes } = data;
        const activeSession = await Session.getUserActiveSession(socket.user._id);
        
        if (!activeSession) {
          socket.emit('error', { message: 'No active session found' });
          return;
        }
        
        const request = await Request.create({
          user: socket.user._id,
          session: activeSession._id,
          type: 'time_extension',
          details: { minutes }
        });
        
        io.to('admin-room').emit('notification:time_extension_request', {
          request,
          user: socket.user,
          minutes
        });
        
        socket.emit('request:submitted', { request });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    // Handle printing request
    socket.on('request:print', async (data) => {
      try {
        const { fileName, copies, color, pages } = data;
        const activeSession = await Session.getUserActiveSession(socket.user._id);
        
        if (!activeSession) {
          socket.emit('error', { message: 'No active session found' });
          return;
        }
        
        const printJob = new PrintJob({
          user: socket.user._id,
          session: activeSession._id,
          file_name: fileName,
          copies: copies || 1,
          color: color || false,
          pages: pages || 1
        });
        
        printJob.calculateCost();
        await printJob.save();
        
        // Create request record
        await Request.create({
          user: socket.user._id,
          session: activeSession._id,
          type: 'print',
          details: {
            printJobId: printJob._id,
            fileName,
            copies,
            color
          }
        });
        
        io.to('admin-room').emit('notification:print_request', {
          printJob,
          user: socket.user,
          fileName,
          copies
        });
        
        socket.emit('print:submitted', { success: true, printJob });
        
        // Log activity
        await ActivityLog.log(socket.user._id, 'print_request', { fileName, copies }, socket.handshake);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    // Handle messages
    socket.on('message:send', async (data) => {
      try {
        const { receiverId, message } = data;
        const newMessage = await Message.create({
          sender: socket.user._id,
          receiver: receiverId,
          message: message
        });
        
        await newMessage.populate('sender', 'username full_name');
        await newMessage.populate('receiver', 'username full_name');
        
        // Send to receiver if connected
        const receiverSocketId = connectedClients.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('message:received', newMessage);
        }
        
        socket.emit('message:sent', newMessage);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    // Admin actions
    socket.on('admin:approve_request', async (data) => {
      try {
        const { requestId, response } = data;
        const request = await Request.findById(requestId);
        
        if (!request) {
          socket.emit('error', { message: 'Request not found' });
          return;
        }
        
        await request.approve(response);
        
        if (request.type === 'time_extension') {
          const session = await Session.findById(request.session);
          if (session) {
            const { minutes } = request.details;
            session.addTime(minutes);
            await session.save();
            
            // Notify client
            io.to(`user:${request.user}`).emit('notification:time_added', {
              minutes,
              newRemainingTime: session.remaining_time,
              request: request
            });
          }
        } else if (request.type === 'print') {
          const printJob = await PrintJob.findById(request.details.printJobId);
          if (printJob) {
            printJob.status = 'printing';
            await printJob.save();
            
            io.to(`user:${request.user}`).emit('notification:print_approved', {
              request: request,
              printJob: printJob
            });
          }
        }
        
        io.to('admin-room').emit('admin:request_processed', { request });
        
        // Log activity
        await ActivityLog.log(socket.user._id, 'request_approved', { requestId, type: request.type }, socket.handshake);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    socket.on('admin:reject_request', async (data) => {
      try {
        const { requestId, response } = data;
        const request = await Request.findById(requestId);
        
        if (!request) {
          socket.emit('error', { message: 'Request not found' });
          return;
        }
        
        await request.reject(response);
        
        io.to(`user:${request.user}`).emit('notification:request_rejected', {
          request,
          response
        });
        
        io.to('admin-room').emit('admin:request_processed', { request });
        
        // Log activity
        await ActivityLog.log(socket.user._id, 'request_rejected', { requestId, type: request.type }, socket.handshake);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    socket.on('admin:end_session', async (data) => {
      try {
        const { sessionId } = data;
        const session = await Session.findById(sessionId).populate('user', 'username full_name');
        
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }
        
        const endedSession = await session.endSession();
        
        io.to(`user:${session.user._id}`).emit('session:ended', {
          sessionId: endedSession._id,
          total_cost: endedSession.total_cost,
          duration: endedSession.elapsed_minutes
        });
        
        io.to('admin-room').emit('admin:session_ended', { session: endedSession });
        
        // Update admin dashboard
        sendAdminInitialData(socket);
        
        // Log activity
        await ActivityLog.log(socket.user._id, 'session_ended_admin', { sessionId }, socket.handshake);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    socket.on('admin:lock_computer', async (data) => {
      try {
        const { computerId, sessionId } = data;
        io.to(`user:${socket.user._id}`).emit('computer:locked', { computerId });
        io.to('admin-room').emit('admin:computer_locked', { computerId, sessionId });
        
        await ActivityLog.log(socket.user._id, 'computer_lock', { computerId }, socket.handshake);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username}`);
      connectedClients.delete(socket.user._id.toString());
    });
  });
}

async function sendClientInitialData(socket) {
  try {
    const activeSession = await Session.getUserActiveSession(socket.user._id);
    socket.emit('initial:session', activeSession);
    
    const unreadMessages = await Message.getUnreadMessages(socket.user._id);
    socket.emit('initial:messages', unreadMessages);
    
    const pendingRequests = await Request.getUserRequests(socket.user._id);
    socket.emit('initial:requests', pendingRequests);
    
    // Send user balance
    socket.emit('initial:balance', { balance: socket.user.balance });
  } catch (error) {
    console.error('Error sending client initial data:', error);
  }
}

async function sendAdminInitialData(socket) {
  try {
    const activeSessions = await Session.getActiveSessions();
    socket.emit('admin:active_sessions', activeSessions);
    
    const pendingRequests = await Request.getPendingRequests();
    socket.emit('admin:pending_requests', pendingRequests);
    
    const allClients = await User.getAllClients();
    socket.emit('admin:clients', allClients);
    
    const availableComputers = await require('../models/Computer').getAvailableComputers();
    socket.emit('admin:computers', availableComputers);
    
    const recentActivities = await require('../models/ActivityLog').getRecentActivities(20);
    socket.emit('admin:recent_activities', recentActivities);
  } catch (error) {
    console.error('Error sending admin initial data:', error);
  }
}

module.exports = setupSocketHandlers;