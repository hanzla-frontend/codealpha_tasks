// frontend/js/products.js
// API_URL is already defined in auth.js, so we don't declare it again

async function fetchProducts() {
    try {
        console.log('Fetching products from API...');
        const response = await fetch(`${API_URL}/products`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json();
        console.log('Products fetched:', products);
        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

// Load featured products on index page
async function loadFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;
    
    container.innerHTML = '<p>Loading products...</p>';
    
    const products = await fetchProducts();
    const featuredProducts = products.slice(0, 4); // Show first 4 products
    
    if (featuredProducts.length === 0) {
        container.innerHTML = '<p>No products available.</p>';
        return;
    }
    
    container.innerHTML = featuredProducts.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <div class="product-actions">
                    <a href="product-detail.html?id=${product._id}" class="btn-outline">View Details</a>
                    <button onclick="addToCart('${product._id}')" class="btn-primary">Add to Cart</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Load all products on products page
async function loadAllProducts() {
    const container = document.getElementById('productsList');
    if (!container) return;
    
    container.innerHTML = '<p>Loading products...</p>';
    
    let products = await fetchProducts();
    
    // Apply filters
    const category = document.getElementById('categoryFilter')?.value;
    const sort = document.getElementById('sortFilter')?.value;
    
    if (category) {
        products = products.filter(p => p.category === category);
    }
    
    if (sort === 'price-low') {
        products.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
        products.sort((a, b) => b.price - a.price);
    } else if (sort === 'name') {
        products.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    if (products.length === 0) {
        container.innerHTML = '<p>No products found.</p>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <div class="product-actions">
                    <a href="product-detail.html?id=${product._id}" class="btn-outline">View Details</a>
                    <button onclick="addToCart('${product._id}')" class="btn-primary">Add to Cart</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Load single product detail
async function loadProductDetail(productId) {
    const container = document.getElementById('productDetail');
    if (!container) return;
    
    container.innerHTML = '<p>Loading product...</p>';
    
    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        if (!response.ok) throw new Error('Product not found');
        
        const product = await response.json();
        
        container.innerHTML = `
            <div class="product-detail">
                <img src="${product.image}" alt="${product.name}" class="product-detail-image" onerror="this.src='https://via.placeholder.com/500x500?text=No+Image'">
                <div class="product-detail-info">
                    <h1>${product.name}</h1>
                    <p class="product-detail-price">$${product.price.toFixed(2)}</p>
                    <p class="product-detail-description">${product.description}</p>
                    <p><strong>Category:</strong> ${product.category}</p>
                    <p><strong>In Stock:</strong> ${product.stock} units</p>
                    <div class="quantity-selector">
                        <label>Quantity:</label>
                        <input type="number" id="quantity" value="1" min="1" max="${product.stock}">
                    </div>
                    <button onclick="addToCart('${product._id}')" class="btn-primary">Add to Cart</button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading product:', error);
        container.innerHTML = '<p>Error loading product. Please try again later.</p>';
    }
}

// Add to cart function
async function addToCart(productId) {
    const token = localStorage.getItem('token');
    const quantityInput = document.getElementById('quantity');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    
    if (!token) {
        if (confirm('Please login to add items to cart. Go to login page?')) {
            window.location.href = 'login.html';
        }
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/cart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productId, quantity })
        });
        
        if (response.ok) {
            alert('Item added to cart!');
            updateCartCount();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to add to cart');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Network error. Make sure backend server is running.');
    }
}