const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createComment,
  getCommentsByPost,
  deleteComment
} = require('../controllers/commentController');

// Protect all routes
router.use(protect);

router.route('/post/:postId')
  .get(getCommentsByPost)
  .post(createComment);

router.delete('/:id', deleteComment);

module.exports = router;