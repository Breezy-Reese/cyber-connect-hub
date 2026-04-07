// src/hooks/useSocket.ts
// Drop-in hook — call once per page, subscribe to events via the returned socket

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

let sharedSocket: Socket | null = null;

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Reuse existing connection if already established
    if (sharedSocket && sharedSocket.connected) {
      socketRef.current = sharedSocket;
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", (reason) => console.log("Socket disconnected:", reason));
    socket.on("connect_error", (err) => console.error("Socket error:", err.message));

    sharedSocket = socket;
    socketRef.current = socket;

    return () => {
      // Don't disconnect — keep alive across route changes
      // Only disconnect on explicit logout (call disconnectSocket())
    };
  }, []);

  return socketRef.current;
};

// Call this on logout
export const disconnectSocket = () => {
  if (sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
  }
};