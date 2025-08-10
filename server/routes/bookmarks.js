const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {getBookmarks, addBookmark, reorderBookmarks, refreshSummary, deleteBookmark} = require('../controllers/bookmarkController');
const router = express.Router();

router.get('/', authMiddleware, getBookmarks);
router.post('/', authMiddleware, addBookmark);
router.post('/reorder', authMiddleware, reorderBookmarks);
router.post('/:id/refresh-summary', authMiddleware, refreshSummary);
router.delete('/:id', authMiddleware, deleteBookmark);

module.exports = router;
