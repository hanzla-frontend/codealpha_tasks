const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// These should be simple route handlers, no middleware issues
router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;