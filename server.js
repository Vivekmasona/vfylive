// server.js
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

// Map: sessionId -> { deviceId -> lastSeen }
const sessions = new Map();

// हर /ping पर user का lastSeen update होगा
app.get("/ping", (req, res) => {
  const { sessionId, deviceId } = req.query;
  if (!sessionId || !deviceId) {
    return res.json({ ok: false });
  }

  const now = Date.now();
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, new Map());
  }

  const devices = sessions.get(sessionId);
  devices.set(deviceId, now);

  // inactive devices साफ करो ( >15s से कोई ping नहीं आया)
  for (let [d, last] of devices.entries()) {
    if (now - last > 15000) {
      devices.delete(d);
    }
  }

  const onlineCount = devices.size;
  res.json({ ok: true, onlineCount });
});

// सिर्फ debug/test के लिए
app.get("/status", (req, res) => {
  const output = {};
  for (let [sid, devices] of sessions.entries()) {
    output[sid] = Array.from(devices.keys());
  }
  res.json(output);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on ${port}`));
