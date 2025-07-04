const express = require('express');
const { register, login, getUser, updateUser, deleteUser } = require('../controllers/userController');
const { authenticateToken } = require('../controllers/authMiddleware');

const router = express.Router();

router.post('/royxatdan-otish', register);
router.post('/kirish', login);
router.get('/profil', authenticateToken, getUser);
router.put('/profil', authenticateToken, updateUser);
router.delete('/profil', authenticateToken, deleteUser);

module.exports = router;