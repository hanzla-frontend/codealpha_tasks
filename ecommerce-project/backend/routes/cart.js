// backend/routes/cart.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Product = require('../models/Product');

// Cart is stored in memory (in production, you'd use Redis or a database)
// This is a simple implementation for demo purposes
let userCarts = new Map();

// @route   GET /api/cart
// @desc    Get user's cart
router.get('/', protect, (req, res) => {
  const cart = userCarts.get(req.user._id.toString()) || { items: [], total: 0 };
  res.json(cart);
});

// @route   POST /api/cart
// @desc    Add item to cart
router.post('/', protect, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const userId = req.user._id.toString();
    let cart = userCarts.get(userId) || { items: [], total: 0 };
    
    const existingItem = cart.items.find(item => item.productId === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: quantity,
      });
    }
    
    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    userCarts.set(userId, cart);
    
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/cart/:productId
// @desc    Update cart item quantity
router.put('/:productId', protect, (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.user._id.toString();
    const cart = userCarts.get(userId);
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }
    
    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }
    
    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    userCarts.set(userId, cart);
    
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/cart/:productId
// @desc    Remove item from cart
router.delete('/:productId', protect, (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id.toString();
    const cart = userCarts.get(userId);
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    cart.items = cart.items.filter(item => item.productId !== productId);
    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    userCarts.set(userId, cart);
    
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/cart
// @desc    Clear cart
router.delete('/', protect, (req, res) => {
  const userId = req.user._id.toString();
  userCarts.delete(userId);
  res.json({ message: 'Cart cleared', cart: { items: [], total: 0 } });
});

module.exports = router;