import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const sessions = {}; // { sessionId: Set of socketIds }

io.on('connection', (socket) => {
    let currentSession = null;

    socket.on('join-session', (sessionId) => {
        currentSession = sessionId;
        if (!sessions[sessionId]) sessions[sessionId] = new Set();
        sessions[sessionId].add(socket.id);

        // Emit online count
        io.to(sessionId).emit('update-online', sessions[sessionId].size);
        socket.join(sessionId);
    });

    socket.on('disconnect', () => {
        if (currentSession && sessions[currentSession]) {
            sessions[currentSession].delete(socket.id);
            io.to(currentSession).emit('update-online', sessions[currentSession].size);
        }
    });
});

server.listen(3000, () => console.log('Server running on 3000'));
