// backend/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const Product = require('./models/Product');

dotenv.config();
connectDB();

const app = express();

// Update CORS configuration - Add this before routes
app.use(cors({
    origin: 'http://127.0.0.1:5500',  // Allow your Live Server origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Sample products data for initial setup
const sampleProducts = [
  {
    name: "Premium Wireless Headphones",
    description: "High-quality wireless headphones with noise cancellation and 30-hour battery life.",
    price: 199.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    category: "Electronics",
    stock: 25
  },
  {
    name: "Minimalist Leather Backpack",
    description: "Handcrafted genuine leather backpack perfect for daily commute and travel.",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
    category: "Fashion",
    stock: 15
  },
  {
    name: "Smart Fitness Watch",
    description: "Track your health metrics, receive notifications, and monitor your workouts.",
    price: 149.99,
    image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500",
    category: "Electronics",
    stock: 30
  },
  {
    name: "Ceramic Coffee Mug Set",
    description: "Set of 4 handmade ceramic mugs with unique glaze finish.",
    price: 34.99,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500",
    category: "Home",
    stock: 50
  },
  {
    name: "Men's Casual Watch",
    description: "Elegant stainless steel watch with genuine leather strap.",
    price: 79.99,
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500",
    category: "Accessories",
    stock: 20
  },
  {
    name: "Yoga Mat Premium",
    description: "Eco-friendly non-slip yoga mat with carrying strap.",
    price: 45.99,
    image: "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=500",
    category: "Sports",
    stock: 40
  }
];

// Initialize sample products if database is empty
const initProducts = async () => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany(sampleProducts);
      console.log('Sample products added to database');
    }
  } catch (error) {
    console.error('Error initializing products:', error);
  }
};

initProducts();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for http://127.0.0.1:5500`);
});