import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// In-memory presence store: sessionId -> Map(deviceId -> lastSeenMs)
const presence = new Map();

// Config
const ONLINE_TTL_MS = 90_000;   // 90s के अंदर ping आया तो online माने
const CLEANUP_EVERY_MS = 30_000;

function touch(sessionId, deviceId) {
  if (!presence.has(sessionId)) presence.set(sessionId, new Map());
  presence.get(sessionId).set(deviceId, Date.now());
}

function getOnlinePeers(sessionId) {
  const now = Date.now();
  const map = presence.get(sessionId) || new Map();
  // TTL के आधार पर साफ करना
  for (const [dev, seen] of [...map.entries()]) {
    if (now - seen > ONLINE_TTL_MS) map.delete(dev);
  }
  // अगर खाली हो गया तो session हटाओ
  if (map.size === 0) presence.delete(sessionId);
  return [...map.keys()];
}

// हर 30s global cleanup
setInterval(() => {
  for (const sid of [...presence.keys()]) getOnlinePeers(sid);
}, CLEANUP_EVERY_MS);

// 1) Heartbeat ping (POST/GET दोनों सपोर्ट)
app.post("/ping", (req, res) => {
  const { sessionId, deviceId } = req.body || {};
  if (!sessionId || !deviceId) return res.status(400).json({ ok: false, error: "sessionId & deviceId required" });
  touch(sessionId, deviceId);
  const peers = getOnlinePeers(sessionId);
  res.json({ ok: true, onlineCount: peers.length, peers });
});

app.get("/ping", (req, res) => {
  const { sessionId, deviceId } = req.query;
  if (!sessionId || !deviceId) return res.status(400).json({ ok: false, error: "sessionId & deviceId required" });
  touch(sessionId, deviceId);
  const peers = getOnlinePeers(sessionId);
  res.json({ ok: true, onlineCount: peers.length, peers });
});

// 2) Presence status
app.get("/presence", (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ ok: false, error: "sessionId required" });
  const peers = getOnlinePeers(sessionId);
  res.json({ ok: true, onlineCount: peers.length, peers });
});

// 3) Simple health
app.get("/", (req, res) => res.send("Presence server running (no websockets)"));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Presence server listening on", port));
