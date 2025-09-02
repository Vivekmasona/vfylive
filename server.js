// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const onlineSessions = new Set();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinSession", (sessionId) => {
    socket.sessionId = sessionId;
    onlineSessions.add(sessionId);

    // Notify other users with same sessionId
    socket.broadcast.emit("sessionOnline", { sessionId });
  });

  socket.on("disconnect", () => {
    if (socket.sessionId) {
      onlineSessions.delete(socket.sessionId);
      socket.broadcast.emit("sessionOffline", { sessionId: socket.sessionId });
    }
  });
});

server.listen(3000, () => console.log("Server running on port 3000"));
