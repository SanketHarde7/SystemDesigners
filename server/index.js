import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 5000;
const DB_FILE = path.resolve('./db.json');

app.use(cors());
app.use(express.json());

// Initialize local JSON database if not exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(
    DB_FILE,
    JSON.stringify({
      leaderboard: [
        { username: 'Principal_Neo', stars: 24, avgLatency: 14, rank: 'Principal Architect', updatedAt: new Date().toISOString() },
        { username: 'Cloud_Samurai', stars: 21, avgLatency: 22, rank: 'Principal Architect', updatedAt: new Date().toISOString() }
      ],
      savedBlueprints: [],
      customMissions: []
    }, null, 2)
  );
}

const readDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// 1. GET Global Leaderboard
app.get('/api/leaderboard', (req, res) => {
  const db = readDB();
  const sorted = db.leaderboard.sort((a, b) => b.stars - a.stars || a.avgLatency - b.avgLatency);
  res.json(sorted.slice(0, 20));
});

// 2. POST Save Player Score & Architecture Blueprint
app.post('/api/siege-record', (req, res) => {
  const { username = 'Anonymous_Architect', missionId, grade, stars, avgLatency, totalCost, nodes, connections } = req.body;
  const db = readDB();

  // Save blueprint
  const blueprint = {
    id: `bp-${Date.now()}`,
    username,
    missionId,
    grade,
    stars,
    avgLatency,
    totalCost,
    nodes,
    connections,
    createdAt: new Date().toISOString()
  };
  db.savedBlueprints.push(blueprint);

  // Update Leaderboard
  const existingUser = db.leaderboard.find(u => u.username === username);
  if (existingUser) {
    existingUser.stars = Math.max(existingUser.stars, existingUser.stars + stars);
    existingUser.avgLatency = Math.round((existingUser.avgLatency + avgLatency) / 2);
    existingUser.updatedAt = new Date().toISOString();
  } else {
    db.leaderboard.push({
      username,
      stars,
      avgLatency,
      rank: stars >= 18 ? 'Principal Architect' : 'Senior Cloud Engineer',
      updatedAt: new Date().toISOString()
    });
  }

  writeDB(db);
  res.status(201).json({ status: 'success', blueprintId: blueprint.id });
});

// 3. GET & POST Custom Community Missions
app.get('/api/custom-missions', (req, res) => {
  const db = readDB();
  res.json(db.customMissions);
});

app.post('/api/custom-missions', (req, res) => {
  const db = readDB();
  const newMission = {
    ...req.body,
    id: `custom-${Date.now()}`
  };
  db.customMissions.push(newMission);
  writeDB(db);
  res.status(201).json(newMission);
});

app.listen(PORT, () => {
  console.log(`🛡️ ARCH-ARSENAL Backend running on http://localhost:${PORT}`);
});