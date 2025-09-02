const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const sessions = {}; // sessionId -> set of socketIds

io.on("connection", (socket) => {
    let currentSession = null;

    socket.on("join-session", (sessionId) => {
        currentSession = sessionId;
        if (!sessions[sessionId]) sessions[sessionId] = new Set();
        sessions[sessionId].add(socket.id);

        io.to(sessionId).emit("update-online", sessions[sessionId].size);
        socket.join(sessionId);
    });

    socket.on("disconnect", () => {
        if (currentSession && sessions[currentSession]) {
            sessions[currentSession].delete(socket.id);
            io.to(currentSession).emit("
