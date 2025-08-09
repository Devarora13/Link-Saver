const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const dbPath = path.join(__dirname, '../db.json');

function readDB() {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}
function writeDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Get bookmarks
router.get('/', authMiddleware, (req, res) => {
    const db = readDB();
    const bookmarks = db.bookmarks.filter(b => b.userId === req.user.id);
    res.json(bookmarks);
});

// Add bookmark
router.post('/', authMiddleware, async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL required' });

    try {
        const favicon = `https://www.google.com/s2/favicons?sz=64&domain_url=${url}`;
        const target = encodeURIComponent(url);
        const summaryRes = await axios.get(`https://r.jina.ai/http://${target}`);
        const summary = summaryRes.data;

        // Try to fetch page title
        let title = url;
        try {
            const htmlRes = await axios.get(url);
            const match = htmlRes.data.match(/<title>(.*?)<\/title>/i);
            if (match && match[1]) title = match[1];
        } catch (err) {}

        const db = readDB();
        const newBookmark = {
            id: uuidv4(),
            userId: req.user.id,
            url,
            title,
            favicon,
            summary
        };
        db.bookmarks.push(newBookmark);
        writeDB(db);

        res.status(201).json(newBookmark);
    } catch (err) {
        res.status(500).json({ message: 'Error saving bookmark' });
    }
});

// Delete bookmark
router.delete('/:id', authMiddleware, (req, res) => {
    const db = readDB();
    const idx = db.bookmarks.findIndex(b => b.id === req.params.id && b.userId === req.user.id);
    if (idx === -1) return res.status(404).json({ message: 'Not found' });

    db.bookmarks.splice(idx, 1);
    writeDB(db);

    res.json({ message: 'Deleted successfully' });
});

module.exports = router;
