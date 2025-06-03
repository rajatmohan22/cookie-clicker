const express = require("express");
const app = express();
const Redis = require("ioredis");
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const FRONTEND = "http://localhost:5173";
const { createClient } = require("@clickhouse/client");
const io = new Server(server, {
  cors: { origin: FRONTEND },
});

const DB = process.env.DB || "redis";
const redis = DB === "redis" ? new Redis() : null;
const clickhouse =
  DB === "clickhouse"
    ? createClient({
        host: "http://localhost:8123",
        database: "clickgame",
        username: "default",
        password: "mysecret",
      })
    : null;

async function ensureClickHouseSchema(clickhouse) {
  // Create database if not exists
  await clickhouse.command({
    query: "CREATE DATABASE IF NOT EXISTS clickgame",
  });

  // Create table if not exists
  await clickhouse.command({
    query: `
      CREATE TABLE IF NOT EXISTS clickgame.clicks (
        user String,
        clicks Int32,
        ts DateTime
      ) ENGINE = MergeTree() ORDER BY ts
    `,
  });
}

async function startServer() {
  if (DB === "clickhouse") {
    await ensureClickHouseSchema(clickhouse);
    console.log("ClickHouse DB and table ensured.");
  }
  // ...rest of your server startup code (app.listen, etc.)
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

const bodyParser = require("body-parser");
const cors = require("cors");

const port = 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const addHit = async (user) => {
  if (DB === "redis") {
    await redis.zincrby("clicks", 1, user);
  } else {
    await clickhouse.insert({
      table: "clicks",
      format: "JSONEachRow",
      values: [{ user, clicks: 1 }],
    });
  }
};

app.get("/", (_, res) => {
  res.send("Welcome to the Cookie Clicker Game!");
});

app.post("/hit", async (req, res) => {
  const { user } = req.body || {};
  if (!user) {
    return res.status(400).json({ error: "user required." });
  }
  await addHit(user);
  await BroadcastLB();
  res.json({ status: "ok" });
});

let chBuffer = []; // holds rows until flush
const BATCH_MS = 50; // flush every 50 ms
const BATCH_MAX = 500; // or after 500 rows

if (DB === "clickhouse") {
  setInterval(async () => {
    if (chBuffer.length === 0) return;
    const rows = chBuffer.splice(0, chBuffer.length); // take & clear
    try {
      await clickhouse.insert({
        table: "clicks",
        format: "JSONEachRow",
        values: rows,
      });
    } catch (err) {
      console.error("CH batch insert failed:", err);
    }
  }, BATCH_MS);
}

const topN = async (n = 10) => {
  if (DB === "redis") {
    const data = Number(n) || 10;
    const flat = await redis.zrevrange("clicks", 0, data - 1, "WITHSCORES");

    const list = [];

    for (let i = 0; i < flat.length; i += 2) {
      list.push({ user: flat[i], clicks: Number(flat[i + 1]) });
    }

    return list;
  }
  const stream = await clickhouse.query({
    query: `
      SELECT user,
             sum(clicks) AS clicks
      FROM   clicks
      GROUP  BY user
      ORDER  BY clicks DESC
      LIMIT  {n:UInt8}
    `,
    query_params: { n },
    format: "JSON",
  });
  const result = await stream.json();
  return result.data;
};

const BroadcastLB = async () => {
  io.emit("leaderboard", await topN());
};

io.on("connection", async (socket) => {
  console.log("socket connected", socket.id);
  await BroadcastLB();
});

if (DB === "clickhouse") {
  const CH_BUFFER = [];
  const CH_BATCH_MS = 50;
  const CH_BATCH_MAX = 500;

  /* flush helper */
  async function flushBuffer() {
    if (CH_BUFFER.length === 0) return;
    const rows = CH_BUFFER.splice(0, CH_BUFFER.length);
    try {
      await clickhouse.insert({
        table: "clicks",
        format: "JSONEachRow",
        values: rows,
      });
    } catch (err) {
      console.error("Buffered insert failed:", err.message);
      CH_BUFFER.unshift(...rows); // push back if you want retry
    }
  }

  setInterval(flushBuffer, CH_BATCH_MS);

  app.post("/hit-fast", async (req, res) => {
    const { user } = req.body || {};
    if (!user) return res.status(400).json({ error: "user required" });

    CH_BUFFER.push({ user, clicks: 1 });

    if (CH_BUFFER.length >= CH_BATCH_MAX) await flushBuffer();

    res.json({ status: "queued" });
  });

  console.log("🔸  /hit-fast enabled (batched ClickHouse inserts)");
}
server.listen(port, () => {
  console.log(`Server is running on port ${port} Backend DB: ${DB}`);
  if (DB === "redis") {
    console.log("Using Redis as the backend database.");
  } else if (DB === "clickhouse") {
    console.log("Using ClickHouse as the backend database.");
  }
});
