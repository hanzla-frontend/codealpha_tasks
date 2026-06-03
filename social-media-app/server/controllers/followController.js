const Follow = require('../models/Follow');
const User = require('../models/User');

const followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.userId);
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }
    const existingFollow = await Follow.findOne({
      followerId: req.user._id,
      followingId: req.params.userId,
    });
    if (existingFollow) {
      return res.status(400).json({ message: 'Already following' });
    }
    await Follow.create({
      followerId: req.user._id,
      followingId: req.params.userId,
    });
    res.json({ message: 'User followed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const unfollowUser = async (req, res) => {
  try {
    const follow = await Follow.findOneAndDelete({
      followerId: req.user._id,
      followingId: req.params.userId,
    });
    if (!follow) {
      return res.status(404).json({ message: 'Not following this user' });
    }
    res.json({ message: 'User unfollowed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFollowers = async (req, res) => {
  try {
    const followers = await Follow.find({ followingId: req.params.userId })
      .populate('followerId', 'username avatar bio');
    res.json(followers.map(f => f.followerId));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFollowing = async (req, res) => {
  try {
    const following = await Follow.find({ followerId: req.params.userId })
      .populate('followingId', 'username avatar bio');
    res.json(following.map(f => f.followingId));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
};