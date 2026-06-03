const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  unlikePost
} = require('../controllers/postController');

// Protect all routes
router.use(protect);

router.route('/')
  .get(getAllPosts)
  .post(createPost);

router.route('/:id')
  .get(getPostById)
  .put(updatePost)
  .delete(deletePost);

router.put('/:id/like', likePost);
router.put('/:id/unlike', unlikePost);

module.exports = router;