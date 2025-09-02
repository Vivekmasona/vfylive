import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const sessionUsers = {}; // sessionId -> Set of socketIds

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // User joins a session
  socket.on("joinSession", (sessionId) => {
    socket.sessionId = sessionId;
    if (!sessionUsers[sessionId]) sessionUsers[sessionId] = new Set();
    sessionUsers[sessionId].add(socket.id);

    // Agar 2 ya usse zyada users same sessionId pe hain, dusro ko notify karo
    if (sessionUsers[sessionId].size > 1) {
      socket.broadcast.emit("sessionOnline", { sessionId });
    }
  });

  socket.on("disconnect", () => {
    const sessionId = socket.sessionId;
    if (sessionId && sessionUsers[sessionId]) {
      sessionUsers[sessionId].delete(socket.id);
      if (sessionUsers[sessionId].size === 0) delete sessionUsers[sessionId];
    }
  });
});

server.listen(3000, () => console.log("Server running on port 3000"));
