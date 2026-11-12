# CodeVerse: Local MongoDB Replica Set Setup Guide

## Overview

CodeVerse uses multi-document ACID transactions to authoritatively guarantee that level completion records (`CampaignProgress`) and player balance updates (`User.totalXp`, `User.level`, `User.coins`, `User.currentStreak`) are applied atomically.

In MongoDB, **multi-document transactions require a replica set or sharded cluster topology**. A standalone `mongod` instance does not support transactions.

To ensure deterministic currency accounting and prevent orphaned rewards, CodeVerse enforces a strict fail-fast policy:
- When connected to a standalone database, reward-bearing operations reject with `503 TRANSACTIONS_UNAVAILABLE`.
- Process health (`GET /api/health`) exposes `database: "connected"` and `transactions: false`, clearly indicating transaction readiness without pretending a standalone server supports transactions.
- When connected to a replica set, `GET /api/health` exposes `transactions: true`.

---

## Option 1: Native Windows / POSIX `mongod` (Recommended for Local Dev)

### Step 1: Create a Persistent Storage Directory
```powershell
New-Item -ItemType Directory -Force -Path "$HOME\codeverse_mongodb_data"
```

### Step 2: Start `mongod` with Replica Set Configuration
```powershell
mongod --replSet rs0 --dbpath "$HOME\codeverse_mongodb_data" --port 27017 --bind_ip 127.0.0.1
```

### Step 3: Initiate the Single-Node Replica Set (One-time Setup)
In a separate terminal:
```powershell
mongosh --port 27017 --eval 'rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27017" }] })'
```

Wait 2–5 seconds for the node to transition to `PRIMARY`. You can verify status with:
```powershell
mongosh --port 27017 --eval 'rs.status().members[0].stateStr'
# Output should be: PRIMARY
```

---

## Option 2: Docker with Named Persistent Volume

### Step 1: Start Container with Persistent Volume
```bash
docker run -d \
  --name codeverse-mongo-rs \
  -p 27017:27017 \
  -v codeverse_mongo_data:/data/db \
  mongo:7 \
  --replSet rs0 \
  --bind_ip_all
```

### Step 2: Initiate the Replica Set
```bash
docker exec -it codeverse-mongo-rs mongosh --eval 'rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27017" }] })'
```

---

## Environment Configuration

Configure the replica-set connection string in your `.env` or execution environment:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/codeverse?replicaSet=rs0&directConnection=true
```

For test execution:
```env
MONGODB_TEST_URI=mongodb://127.0.0.1:27017/codeverse_campaign_test?replicaSet=rs0&directConnection=true
```

---

## Observability & Verification

### Health Probe Verification
Send a GET request to the health probe:
```bash
curl http://localhost:5000/api/health
```

Expected response when replica set is active:
```json
{
  "status": "ok",
  "service": "CodeVerse API Gateway",
  "uptime": 42.12,
  "timestamp": "2026-11-12T16:00:00.000Z",
  "database": "connected",
  "transactions": true
}
```

If connected to a standalone server without replica set support:
```json
{
  "status": "ok",
  "service": "CodeVerse API Gateway",
  "uptime": 42.12,
  "timestamp": "2026-11-12T16:00:00.000Z",
  "database": "connected",
  "transactions": false
}
```
In this state, `GET /api/game/levels` succeeds, but `POST /api/game/levels/:id/run` returns `503 TRANSACTIONS_UNAVAILABLE` on successful runs rather than performing an uncoordinated, non-atomic write.
