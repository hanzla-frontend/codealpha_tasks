// backend/simple-server.js - Simplified version that works without MongoDB
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage (no MongoDB needed)
let users = [];
let products = [
    {
        _id: "1",
        name: "Premium Wireless Headphones",
        description: "High-quality wireless headphones with noise cancellation",
        price: 199.99,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
        category: "Electronics",
        stock: 25
    },
    {
        _id: "2",
        name: "Minimalist Leather Backpack",
        description: "Handcrafted genuine leather backpack",
        price: 89.99,
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
        category: "Fashion",
        stock: 15
    },
    {
        _id: "3",
        name: "Smart Fitness Watch",
        description: "Track your health metrics and workouts",
        price: 149.99,
        image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500",
        category: "Electronics",
        stock: 30
    },
    {
        _id: "4",
        name: "Ceramic Coffee Mug Set",
        description: "Set of 4 handmade ceramic mugs",
        price: 34.99,
        image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500",
        category: "Home",
        stock: 50
    },
    {
        _id: "5",
        name: "Men's Casual Watch",
        description: "Elegant stainless steel watch",
        price: 79.99,
        image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500",
        category: "Accessories",
        stock: 20
    },
    {
        _id: "6",
        name: "Yoga Mat Premium",
        description: "Eco-friendly non-slip yoga mat",
        price: 45.99,
        image: "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=500",
        category: "Sports",
        stock: 40
    }
];

let carts = new Map(); // Store carts per user
let orders = [];

// JWT Secret
const JWT_SECRET = 'your_secret_key_here';

// Routes
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { 
        _id: Date.now().toString(), 
        name, 
        email, 
        password: hashedPassword 
    };
    users.push(user);
    
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
    
    res.json({ _id: user._id, name, email, token });
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ _id: user._id, name: user.name, email, token });
});

app.get('/api/products', (req, res) => {
    res.json(products);
});

app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p._id === req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
});

// Middleware to verify token
const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

app.get('/api/cart', auth, (req, res) => {
    const userCart = carts.get(req.userId) || { items: [], total: 0 };
    res.json(userCart);
});

app.post('/api/cart', auth, (req, res) => {
    const { productId, quantity } = req.body;
    const product = products.find(p => p._id === productId);
    
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    let userCart = carts.get(req.userId) || { items: [], total: 0 };
    const existingItem = userCart.items.find(item => item.productId === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        userCart.items.push({
            productId: product._id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: quantity
        });
    }
    
    userCart.total = userCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    carts.set(req.userId, userCart);
    
    res.json(userCart);
});

app.delete('/api/cart/:productId', auth, (req, res) => {
    const userCart = carts.get(req.userId);
    if (userCart) {
        userCart.items = userCart.items.filter(item => item.productId !== req.params.productId);
        userCart.total = userCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        carts.set(req.userId, userCart);
    }
    res.json({ message: 'Item removed' });
});

app.post('/api/orders', auth, (req, res) => {
    const { items, shippingAddress } = req.body;
    const userCart = carts.get(req.userId);
    
    if (!userCart || userCart.items.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
    }
    
    const order = {
        _id: Date.now().toString(),
        user: req.userId,
        items: userCart.items,
        totalAmount: userCart.total,
        shippingAddress,
        status: 'pending',
        createdAt: new Date()
    };
    
    orders.push(order);
    carts.delete(req.userId); // Clear cart after order
    
    res.status(201).json(order);
});

app.get('/api/orders', auth, (req, res) => {
    const userOrders = orders.filter(order => order.user === req.userId);
    res.json(userOrders);
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api/products`);
    console.log('\nTest credentials:');
    console.log('Register a new user or use:');
    console.log('Email: test@example.com');
    console.log('Password: 123456');
});