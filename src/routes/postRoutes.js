const express = require('express');
const { createPost, getPosts, getPost, updatePost, deletePost } = require('../controllers/postController');
const { authenticateToken } = require('../controllers/authMiddleware');

const router = express.Router();

router.post('/', authenticateToken, createPost);
router.get('/', getPosts);
router.get('/:id', getPost);
router.put('/:id', authenticateToken, updatePost);
router.delete('/:id', authenticateToken, deletePost);

module.exports = router;