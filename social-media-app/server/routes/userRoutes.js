const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  getUserById
} = require('../controllers/userController');

// Protect all routes
router.use(protect);

router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.get('/', getAllUsers);
router.get('/:id', getUserById);

module.exports = router;