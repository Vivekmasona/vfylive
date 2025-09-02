import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.json());

// In-memory store for session IDs (replace with DB for production)
let sessions = {};

app.post("/register-session", (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).send("No sessionId provided");

    sessions[sessionId] = Date.now(); // Store timestamp
    res.send({ status: "ok" });
});

// Serve static files (frontend)
app.use(express.static("public"));

// Socket.io for real-time online detection
io.on("connection", (socket) => {
    socket.on("join-session", (sessionId) => {
        socket.join(sessionId);

        // Notify other devices with same sessionId
        socket.to(sessionId).emit("user-online", { sessionId });
    });

    socket.on("disconnect", () => {
        // Optional: handle disconnect
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
