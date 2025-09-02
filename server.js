const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let onlineSessions = new Set();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinSession', (sessionId) => {
    socket.sessionId = sessionId;
    onlineSessions.add(sessionId);
    socket.broadcast.emit('sessionOnline', { sessionId });
  });

  socket.on('disconnect', () => {
    if (socket.sessionId) {
      onlineSessions.delete(socket.sessionId);
      socket.broadcast.emit('sessionOffline', { sessionId: socket.sessionId });
    }
  });
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
