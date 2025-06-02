## Table of Contents

1. [Features](#features)  
2. [Architecture Overview](#architecture-overview)  
3. [Prerequisites](#prerequisites)  
4. [Getting Started](#getting-started)  
   1. [Clone the Repo](#clone-the-repo)  
   2. [Environment Variables](#environment-variables)  
   3. [Starting Redis](#starting-redis)  
   4. [Starting ClickHouse](#starting-clickhouse)  
   5. [Installing Dependencies](#installing-dependencies)  
   6. [Running the Backend](#running-the-backend)  
   7. [Running the Front End](#running-the-front-end)  
5. [Endpoints & Usage](#endpoints--usage)  
   1. [`POST /hit` (Redis mode)](#post-hit-redis-mode)  
   2. [`POST /hit-fast` (ClickHouse mode)](#post-hit-fast-clickhouse-mode)  
   3. [`GET /` (Health Check)](#get--health-check)  
   4. [WebSocket `/leaderboard` Events](#websocket-leaderboard-events)  
6. [Benchmarking with `hey`](#benchmarking-with-hey)  
   1. [Redis-Only Throughput](#redis-only-throughput)  
   2. [ClickHouse Batched Throughput](#clickhouse-batched-throughput)  
7. [Configuration & Tuning](#configuration--tuning)  
   1. [Batching Parameters](#batching-parameters)  
   2. [Leaderboard Polling Interval](#leaderboard-polling-interval)  
8. [Understanding the Results](#understanding-the-results)  
9. [Why `/hit-fast` Is Legitimate](#why-hit-fast-is-legitimate)  
10. [Contributing](#contributing)  
11. [License](#license)  

---

## Features

- **Dual-Mode Backend**: Switch between Redis and ClickHouse via the `DB` environment variable  
- **Redis Mode**:  
  - `INCR` (or `ZINCRBY`) per click  
  - Pure-increment endpoint for ~29 k req/sec  
  - (Optional) Live ranking on every click for ~10 k req/sec  
- **ClickHouse Mode**:  
  - `/hit-fast` pushes clicks into an in-memory buffer  
  - Bulk inserts into ClickHouse every 50 ms (or once 500 rows accumulate)  
  - Leaderboard computed every 250 ms  
  - Achieves up to ~49 k req/sec once warmed  
- **WebSocket Leaderboard**: Clients subscribe to real-time “top 10” updates broadcast by the server  
- **Simple React Front End**: Click a “🍪 HIT ME!” button, view live leaderboard  
- **Benchmarks Included**: Example `hey` commands and sample output show exact requests/sec and latency metrics  

---

## Architecture Overview

1. **Browser Clients (React)**  
   - Display a big “🍪 HIT ME!” button and a top-10 leaderboard  
   - On click: send `POST /hit` (Redis mode) or `POST /hit-fast` (ClickHouse mode)  
   - Maintain a WebSocket connection to receive `leaderboard` events from the backend  

2. **Backend (Node.js + Express, using Socket.io)**  
   - Reads `DB=redis` or `DB=clickhouse` from environment  
   - **Redis Mode (`DB=redis`)**:  
     - `/hit` endpoint runs `redis.zincrby("clicks", 1, user)` per click  
     - `BroadcastLB()` fetches top 10 via `redis.zrevrange("clicks", 0, 9, "WITHSCORES")` and emits via WebSocket  
   - **ClickHouse Mode (`DB=clickhouse`)**:  
     - `/hit-fast` endpoint simply buffers `{user, clicks: 1}` in an in-memory array  
     - Every 50 ms (or once buffer ≥ 500 rows), `flushBuffer()` bulk-inserts into ClickHouse  
     - Every 250 ms, `BroadcastLB()` runs a  
       ```sql
       SELECT user, sum(clicks) AS clicks
       FROM   clickgame.clicks
       GROUP  BY user
       ORDER  BY clicks DESC
       LIMIT  {n:UInt8}
       ```  
       query and emits via WebSocket  

3. **Databases (Redis & ClickHouse)**  
   - Redis at `localhost:6379` (in-memory, very fast for single increments)  
   - ClickHouse at `localhost:8123` (columnar, disk-based, extremely efficient for bulk writes and analytics)  

---

## Prerequisites

- **Node.js** v16+ and npm  
- **Docker** & **Docker Compose** (or ability to run standalone `docker run` commands)  
- A modern browser (Chrome/Firefox/Edge) to run the React front end  
- `hey` (optional) for benchmarking, or any HTTP load tester  

---

## Getting Started

### Clone the Repo

```bash
git clone https://github.com/yourname/cookie-click-db-duel.git
cd cookie-click-db-duel
