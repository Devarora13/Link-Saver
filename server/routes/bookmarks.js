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

// Helper: build correct Jina AI summary URL
function buildJinaUrl(rawUrl) {
    // Jina accepts pattern: https://r.jina.ai/https://example.com/path
    // Ensure rawUrl starts with http or https
    if (!/^https?:\/\//i.test(rawUrl)) {
        rawUrl = 'https://' + rawUrl; // default to https
    }
    // Do NOT double prefix with http://http://; just append directly
    return `https://r.jina.ai/${rawUrl}`;
}

async function fetchSummary(targetUrl) {
    const jinaUrl = buildJinaUrl(targetUrl);
    try {
        const res = await axios.get(jinaUrl, { timeout: 10000 });
        return { summary: res.data, status: res.status };
    } catch (e) {
        return { summary: '[Summary unavailable]', status: e.response ? e.response.status : null, error: e.message || 'unknown error' };
    }
}

// Get bookmarks with optional tag filtering
router.get('/', authMiddleware, (req, res) => {
    const { tag, tags, mode } = req.query;
    const db = readDB();
    let bookmarks = db.bookmarks.filter(b => b.userId === req.user.id);

    // Collect filter tags (case-insensitive)
    let filterTags = [];
    if (tag) filterTags.push(tag);
    if (tags) {
        filterTags = filterTags.concat(tags.split(',').map(t=>t.trim()).filter(Boolean));
    }
    filterTags = [...new Set(filterTags.map(t=>t.toLowerCase()))];

    if (filterTags.length > 0) {
        const matchAll = (mode || 'any').toLowerCase() === 'all';
        bookmarks = bookmarks.filter(b => {
            const bt = (b.tags || []).map(t=>t.toLowerCase());
            if (matchAll) return filterTags.every(t=> bt.includes(t));
            return filterTags.some(t=> bt.includes(t));
        });
    }
    bookmarks.sort((a,b)=> (a.order ?? 0) - (b.order ?? 0));
    res.json(bookmarks);
});

// Add bookmark
router.post('/', authMiddleware, async (req, res) => {
    const { url, tags = [] } = req.body;
    if (!url) return res.status(400).json({ message: 'URL required' });

    try {
        const favicon = `https://www.google.com/s2/favicons?sz=64&domain_url=${url}`;
        const target = encodeURIComponent(url);
    let summary = '';
    let summaryError = null;
    let summaryStatus = null;
    let fallbackUsed = false;
    const fetched = await fetchSummary(url);
    summary = fetched.summary;
    summaryStatus = fetched.status;
    summaryError = fetched.error || null;

        // Fallback: if summary unavailable, attempt lightweight extraction directly from page
        if (summary === '[Summary unavailable]') {
            try {
                const pageRes = await axios.get(url, { timeout: 12000 });
                const raw = pageRes.data;
                // Strip scripts/styles and tags to get text, then condense whitespace
                const text = raw
                  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
                  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
                  .replace(/<[^>]+>/g, ' ')
                  .replace(/&nbsp;|&#160;/g, ' ')
                  .replace(/&amp;/g, '&')
                  .replace(/\s+/g, ' ') // collapse
                  .trim();
                if (text) {
                    summary = text.slice(0, 800) + (text.length > 800 ? '…' : '');
                    fallbackUsed = true;
                }
            } catch (fallbackErr) {
                // leave summary as unavailable, append note once
                if (!summaryError) summaryError = fallbackErr.message;
            }
        }

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
            summary,
            tags: Array.isArray(tags) ? tags : [],
            order: (db.bookmarks.filter(b=>b.userId===req.user.id).length) || 0,
            createdAt: new Date().toISOString(),
            summaryError,
            summaryStatus,
            fallbackUsed
        };
        db.bookmarks.push(newBookmark);
        writeDB(db);

        res.status(201).json(newBookmark);
    } catch (err) {
        res.status(500).json({ message: 'Error saving bookmark' });
    }
});

// Reorder bookmarks (drag & drop) expects array of ids in desired order
router.post('/reorder', authMiddleware, (req, res) => {
    const { order } = req.body; // array of bookmark ids
    if (!Array.isArray(order)) return res.status(400).json({ message: 'order must be array of ids' });
    const db = readDB();
    const userBookmarks = db.bookmarks.filter(b => b.userId === req.user.id);
    const idSet = new Set(userBookmarks.map(b=>b.id));
    // validate provided ids all belong to user
    if (!order.every(id => idSet.has(id))) {
        return res.status(400).json({ message: 'One or more ids invalid' });
    }
    // assign order index
    order.forEach((id, idx) => {
        const bm = db.bookmarks.find(b => b.id === id);
        if (bm) bm.order = idx;
    });
    writeDB(db);
    res.json({ message: 'Reordered' });
});

// Refresh summary for a bookmark
router.post('/:id/refresh-summary', authMiddleware, async (req, res) => {
    const db = readDB();
    const bm = db.bookmarks.find(b => b.id === req.params.id && b.userId === req.user.id);
    if (!bm) return res.status(404).json({ message: 'Not found' });
    try {
        const fetched = await fetchSummary(bm.url);
        bm.summary = fetched.summary;
        bm.summaryError = fetched.error || null;
        bm.summaryStatus = fetched.status;
        bm.fallbackUsed = false;
        if (bm.summary === '[Summary unavailable]') {
            // attempt fallback extraction
            bm.summaryError = bm.summaryError || 'summary unavailable';
            try {
                const pageRes = await axios.get(bm.url, { timeout: 12000 });
                const raw = pageRes.data;
                const text = raw
                  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
                  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
                  .replace(/<[^>]+>/g, ' ')
                  .replace(/&nbsp;|&#160;/g, ' ')
                  .replace(/&amp;/g, '&')
                  .replace(/\s+/g, ' ')
                  .trim();
                if (text) {
                    bm.summary = text.slice(0, 800) + (text.length > 800 ? '…' : '');
                    bm.fallbackUsed = true;
                }
            } catch (_) {}
        }
        writeDB(db);
        if (bm.summary === '[Summary unavailable]') {
            return res.status(502).json({ message: 'Failed to refresh summary', error: bm.summaryError, status: bm.summaryStatus });
        }
        return res.json({ summary: bm.summary, fallbackUsed: bm.fallbackUsed });
    } catch (e) {
        bm.summaryError = e.message || 'unknown error';
        bm.summaryStatus = e.response ? e.response.status : null;
        try {
            const pageRes = await axios.get(bm.url, { timeout: 12000 });
            const raw = pageRes.data;
            const text = raw
              .replace(/<script[\s\S]*?<\/script>/gi, ' ')
              .replace(/<style[\s\S]*?<\/style>/gi, ' ')
              .replace(/<[^>]+>/g, ' ')
              .replace(/&nbsp;|&#160;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/\s+/g, ' ')
              .trim();
            if (text) {
                bm.summary = text.slice(0, 800) + (text.length > 800 ? '…' : '');
                bm.fallbackUsed = true;
                writeDB(db);
                return res.json({ summary: bm.summary, fallbackUsed: true, note: 'Fallback extraction used' });
            }
        } catch (_) {}
        writeDB(db);
        return res.status(502).json({ message: 'Failed to refresh summary', error: bm.summaryError, status: bm.summaryStatus });
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
