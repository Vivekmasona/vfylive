const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const port = process.env.PORT || 3000;

// Track sessionId -> set of socket IDs
const sessions = new Map();

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('join-room', (sessionId) => {
        if (!sessionId) return;

        socket.sessionId = sessionId;

        if (!sessions.has(sessionId)) sessions.set(sessionId, new Set());
        const users = sessions.get(sessionId);
        users.add(socket.id);

        // Agar ek se zyada user same sessionId se connected hai
        if (users.size > 1) {
            // Notify all clients with this sessionId
            users.forEach(id => {
                io.to(id).emit('same-session-connected', { message: "Another user joined with the same session ID!" });
            });
        }

        console.log(`Session ${sessionId} has ${users.size} users`);
    });

    socket.on('disconnect', () => {
        const sessionId = socket.sessionId;
        if (sessionId && sessions.has(sessionId)) {
            sessions.get(sessionId).delete(socket.id);
            if (sessions.get(sessionId).size === 0) {
                sessions.delete(sessionId);
            }
        }
        console.log('Client disconnected');
    });
});

server.listen(port, () => console.log(`Server running on port ${port}`));
