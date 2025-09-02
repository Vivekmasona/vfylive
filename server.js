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

const port = process.env.PORT || 3000;

// Map: sessionId -> Set of socket ids
const sessions = new Map();

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-session", (data) => {
    const sessionId = (data && data.sessionId) ? String(data.sessionId) : "unknown";
    socket.data.sessionId = sessionId;

    if (!sessions.has(sessionId)) sessions.set(sessionId, new Set());
    sessions.get(sessionId).add(socket.id);

    const count = sessions.get(sessionId).size;

    for (let sId of sessions.get(sessionId)) {
      io.to(sId).emit("session-count", { sessionId, count });
      io.to(sId).emit("both-present", { sessionId, bothPresent: count >= 2 });
    }
  });

  socket.on("disconnect", () => {
    const sessionId = socket.data.sessionId;
    if (sessionId && sessions.has(sessionId)) {
      sessions.get(sessionId).delete(socket.id);
      const count = sessions.get(sessionId).size;
      for (let sId of sessions.get(sessionId)) {
        io.to(sId).emit("session-count", { sessionId, count });
        io.to(sId).emit("both-present", { sessionId, bothPresent: count >= 2 });
      }
      if (count === 0) sessions.delete(sessionId);
    }
  });
});

app.get("/", (req, res) => {
  res.send("Socket.IO server is running ✅");
});

server.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
