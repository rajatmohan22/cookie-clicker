## Features

- Dual-mode backend supporting **Redis** and **ClickHouse**  
- Real-time leaderboard via WebSockets  
- Batched writes for ClickHouse (`/hit-fast`) to maximize throughput  
- Simple React front end for “cookie-clicker” clicks and leaderboard display  
- Included `hey` benchmarking scripts for performance comparison  

---

## Architecture Overview

1. **Frontend (React + Vite)**  
   - “🍪 HIT ME!” button triggers a POST to `/hit` (Redis) or `/hit-fast` (ClickHouse)  
   - Maintains a Socket.io connection to receive live “leaderboard” events  

2. **Backend (Node.js + Express + Socket.io)**  
   - Reads `DB` environment variable to choose between Redis or ClickHouse mode  
   - **Redis mode**: each click runs `ZINCRBY("clicks", 1, user)` and immediately broadcasts top‐10 via `ZREVRANGE`  
   - **ClickHouse mode**: `/hit-fast` pushes events into an in-memory buffer; every 50 ms (or 500 rows) the buffer is flushed as a bulk insert; top‐10 is queried every 250 ms  

3. **Datastores**  
   - **Redis** for low-latency single-row increments (`localhost:6379`)  
   - **ClickHouse** for high-throughput batch analytics (`localhost:8123` & `9000`)  

---

## Prerequisites

- **Node.js** v16 or higher (with npm)  
- **Docker** (with Docker Compose) or ability to run `docker run`  
- A modern web browser (Chrome, Firefox, etc.)  
- (Optional) **hey** installed locally for load testing  

---

## Getting Started

### Clone the Repo

git clone https://github.com/rajatmohan22/cookie-clicker.git
cd cookie-clicker/src/backend

text

### Environment Variables

Create a file named `.env` in `src/backend` containing:

DB=redis

text

Change to `DB=clickhouse` when switching to ClickHouse mode.

If using ClickHouse, add:

CLICKHOUSE_HOST=http://localhost:8123
CLICKHOUSE_DB=clickgame
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=mysecret

text

### Starting Redis

Run Redis in Docker (or install locally):

docker run -d --name redis-server -p 6379:6379 redis:7-alpine

text

Redis will be available at `localhost:6379`.

### Starting ClickHouse

In `src/backend`, there’s a `docker-compose.yml`. Simply run:

docker-compose up -d

text

This will:

- Launch ClickHouse container exposing 8123 (HTTP) and 9000 (native)
- Auto‐execute `init-db.sql` to create `clickgame` database and `clicks` table

### Installing Dependencies

From `src/backend`, install Node.js packages:

npm install

text

### Running the Backend

With environment set (`DB=redis` or `DB=clickhouse`), start the server:

node index.js

text

You should see console output confirming the mode and any ClickHouse schema setup.

### Running the Front End

Open a new terminal, go to the front-end folder:

cd ../frontend
npm install
npm run dev

text

Visit [http://localhost:5173](http://localhost:5173) in your browser.

Click “🍪 HIT ME!” to send clicks, watch the live leaderboard update via WebSocket.

---

## Benchmarking with hey

### Redis-Only Throughput

Ensure `DB=redis` and backend is running (`node index.js`).

Run:

hey -z 30s -c 200 -m POST
-H "Content-Type: application/json"
-d '{"user":"bot"}'
http://localhost:8080/hit

text

Observe ~29k req/sec for pure ZINCRBY increments (with no extra ranking).

### ClickHouse Batched Throughput

Ensure `DB=clickhouse` and backend is running.

Run:

hey -z 30s -c 200 -m POST
-H "Content-Type: application/json"
-d '{"user":"bot"}'
http://localhost:8080/hit-fast
