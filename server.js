const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Map sessionId -> Set of socketIds
const sessions = new Map();

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Client joins a sessionId
  socket.on("join-session", (sessionId) => {
    socket.sessionId = sessionId;

    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, new Set());
    }

    const clients = sessions.get(sessionId);
    clients.add(socket.id);
    sessions.set(sessionId, clients);

    // Notify all clients in the same session
    io.to(sessionId).emit("update-status", {
      onlineCount: clients.size,
      message: "A device joined this session"
    });

    socket.join(sessionId);
  });

  // Disconnect
  socket.on("disconnect", () => {
    const sessionId = socket.sessionId;
    if (sessionId && sessions.has(sessionId)) {
      const clients = sessions.get(sessionId);
      clients.delete(socket.id);
      if (clients.size === 0) {
        sessions.delete(sessionId);
      } else {
        sessions.set(sessionId, clients);
        io.to(sessionId).emit("update-status", {
          onlineCount: clients.size,
          message: "A device left this session"
        });
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
