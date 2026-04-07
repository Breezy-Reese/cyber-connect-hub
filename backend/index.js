const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Session = require("../models/Session");

// Map: userId -> socketId (for targeting individual clients)
const connectedClients = new Map();

const initSocket = (io) => {
  // Authenticate socket connection via JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error("Authentication error: no token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("Authentication error: user not found"));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error: invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const user = socket.user;
    console.log(`Socket connected: ${user.username} [${user.role}] — ${socket.id}`);

    connectedClients.set(user._id.toString(), socket.id);

    // Admins join a dedicated room to receive all events
    if (user.role === "admin") {
      socket.join("admins");
    }

    // Clients join their PC room based on active session
    if (user.role === "client") {
      const session = await Session.findOne({
        user: user._id,
        status: { $in: ["active", "paused", "locked"] },
      });
      if (session) {
        socket.join(session.pcId);
        socket.sessionId = session._id;
        socket.pcId = session.pcId;

        // Start countdown ticker for this client
        startSessionTimer(io, socket, session);
      }
    }

    // Client explicitly joins their PC room (e.g. after session start)
    socket.on("session:join", async ({ pcId }) => {
      socket.join(pcId);
      socket.pcId = pcId;

      const session = await Session.findOne({
        user: user._id,
        pcId,
        status: { $in: ["active", "paused"] },
      });
      if (session) {
        socket.sessionId = session._id;
        startSessionTimer(io, socket, session);
      }
    });

    // Admin joins a specific PC room to monitor it
    socket.on("admin:joinPc", ({ pcId }) => {
      socket.join(pcId);
    });

    socket.on("disconnect", () => {
      connectedClients.delete(user._id.toString());
      console.log(`Socket disconnected: ${user.username}`);
    });
  });
};

// Tick every second, push remaining time to client and notify admin every 10s
const startSessionTimer = (io, socket, session) => {
  // Prevent duplicate timers
  if (socket._timerInterval) clearInterval(socket._timerInterval);

  let remaining = session.remainingSeconds;

  socket._timerInterval = setInterval(async () => {
    if (remaining <= 0) {
      clearInterval(socket._timerInterval);

      // Auto-end session
      try {
        await Session.findByIdAndUpdate(session._id, {
          status: "ended",
          endTime: new Date(),
          remainingSeconds: 0,
        });
      } catch (_) {}

      socket.emit("session:expired");
      io.to("admins").emit("session:expired", { pcId: session.pcId, sessionId: session._id });
      return;
    }

    remaining -= 1;

    // Push to client every second
    socket.emit("session:tick", { remainingSeconds: remaining });

    // Persist every 30 seconds to avoid excessive DB writes
    if (remaining % 30 === 0) {
      Session.findByIdAndUpdate(session._id, { remainingSeconds: remaining }).catch(() => {});
    }

    // Notify admin every 10 seconds
    if (remaining % 10 === 0) {
      io.to("admins").emit("session:tick", {
        sessionId: session._id,
        pcId: session.pcId,
        remainingSeconds: remaining,
      });
    }
  }, 1000);

  // Clean up timer on disconnect
  socket.on("disconnect", () => {
    clearInterval(socket._timerInterval);
    // Persist last known remaining time
    Session.findByIdAndUpdate(session._id, { remainingSeconds: remaining }).catch(() => {});
  });
};

module.exports = { initSocket, connectedClients };