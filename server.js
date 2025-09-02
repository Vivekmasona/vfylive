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

const sessions = new Map();

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-session", (data) => {
    const sessionId = data.sessionId || "unknown";
    socket.data.sessionId = sessionId;

    if (!sessions.has(sessionId)) sessions.set(sessionId, new Set());
    sessions.get(sessionId).add(socket.id);

    const count = sessions.get(sessionId).size;

    // emit both-present to all in session
    sessions.get(sessionId).forEach(sId => {
      io.to(sId).emit("both-present", { sessionId, bothPresent: count >= 2 });
    });
  });

  socket.on("disconnect", () => {
    const sessionId = socket.data.sessionId;
    if (sessionId && sessions.has(sessionId)) {
      sessions.get(sessionId).delete(socket.id);
      const count = sessions.get(sessionId).size;
      sessions.get(sessionId).forEach(sId => {
        io.to(sId).emit("both-present", { sessionId, bothPresent: count >= 2 });
      });
      if (count === 0) sessions.delete(sessionId);
    }
  });
});

server.listen(port, () => console.log(`Server running on port ${port}`));
