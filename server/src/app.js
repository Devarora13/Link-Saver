const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const authRoutes = require('../routes/auth');
const bookmarkRoutes = require('../routes/bookmarks');

const app = express();
app.use(cors(
    {
        origin: [process.env.CLIENT_URL, 'http://localhost:5173'],
        credentials: true
    }
));
app.use(express.json());

// Ensure db.json exists with new schema additions (tags, order)
const dbPath = path.join(__dirname, '..', 'db.json');
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({ users: [], bookmarks: [] }, null, 2));
}

// health
app.get('/health', (_req, res) => res.json({ ok: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookmarks', bookmarkRoutes);

module.exports = { app };
