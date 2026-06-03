const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing
} = require('../controllers/followController');

// Protect all routes
router.use(protect);

router.post('/follow/:userId', followUser);
router.delete('/unfollow/:userId', unfollowUser);
router.get('/followers/:userId', getFollowers);
router.get('/following/:userId', getFollowing);

module.exports = router;