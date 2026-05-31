// frontend/js/cart.js
// API_URL is already defined in auth.js

async function fetchCart() {
    const token = localStorage.getItem('token');
    if (!token) return { items: [], total: 0 };
    
    try {
        const response = await fetch(`${API_URL}/cart`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.clear();
                window.location.href = 'login.html';
                return { items: [], total: 0 };
            }
            throw new Error('Failed to fetch cart');
        }
        
        const cart = await response.json();
        console.log('Cart fetched:', cart);
        return cart;
    } catch (error) {
        console.error('Error fetching cart:', error);
        return { items: [], total: 0 };
    }
}

async function updateCartItem(productId, quantity) {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
        const response = await fetch(`${API_URL}/cart/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ quantity: parseInt(quantity) })
        });
        
        if (response.ok) {
            showToast('Cart updated successfully!');
            await loadCart();
            updateCartCount();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error updating cart:', error);
        showToast('Error updating cart', true);
        return false;
    }
}

async function removeFromCart(productId) {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
        const response = await fetch(`${API_URL}/cart/${productId}`, {
            method: 'DELETE',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            showToast('Item removed from cart');
            await loadCart();
            updateCartCount();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error removing from cart:', error);
        showToast('Error removing item', true);
        return false;
    }
}

async function clearCart() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    if (!confirm('Are you sure you want to clear your entire cart?')) {
        return false;
    }
    
    try {
        const response = await fetch(`${API_URL}/cart`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            showToast('Cart cleared successfully');
            await loadCart();
            updateCartCount();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error clearing cart:', error);
        showToast('Error clearing cart', true);
        return false;
    }
}

async function loadCart() {
    const cart = await fetchCart();
    const container = document.getElementById('cartContent');
    
    if (!container) return;
    
    if (!cart.items || cart.items.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h2>Your Cart is Empty</h2>
                <p>Looks like you haven't added any items to your cart yet.</p>
                <a href="products.html" class="shop-now-btn">
                    <i class="fas fa-store"></i> Start Shopping
                </a>
            </div>
        `;
        return;
    }
    
    // Calculate summary
    const subtotal = cart.total;
    const shipping = subtotal > 50 ? 0 : 5.99;
    const tax = subtotal * 0.1;
    const total = subtotal + shipping + tax;
    
    container.innerHTML = `
        <div class="cart-grid">
            <div class="cart-items-section">
                <div class="cart-items-header">
                    <span>Product</span>
                    <span>Price</span>
                    <span>Quantity</span>
                    <span>Total</span>
                </div>
                <div id="cartItemsList">
                    ${cart.items.map(item => `
                        <div class="cart-item" data-product-id="${item.productId}">
                            <div class="product-info">
                                <img src="${item.image}" alt="${item.name}" class="product-image" onerror="this.src='https://via.placeholder.com/100x100?text=Product'">
                                <div class="product-details">
                                    <h3>${item.name}</h3>
                                    <span class="product-category">${item.category || 'General'}</span>
                                    <div class="product-price-display">$${item.price.toFixed(2)} each</div>
                                </div>
                            </div>
                            <div class="price">$${item.price.toFixed(2)}</div>
                            <div class="quantity-controls">
                                <button class="quantity-btn" onclick="updateQuantity('${item.productId}', ${item.quantity - 1})">-</button>
                                <input type="number" class="quantity-input" id="qty_${item.productId}" value="${item.quantity}" 
                                       min="1" max="99" 
                                       onchange="updateQuantity('${item.productId}', this.value)">
                                <button class="quantity-btn" onclick="updateQuantity('${item.productId}', ${item.quantity + 1})">+</button>
                            </div>
                            <div class="item-total">$${(item.price * item.quantity).toFixed(2)}</div>
                            <button class="remove-btn" onclick="removeFromCart('${item.productId}')">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="cart-summary">
                <div class="summary-title">Order Summary</div>
                <div class="summary-row">
                    <span class="summary-label">Subtotal</span>
                    <span class="summary-value">$${subtotal.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Shipping</span>
                    <span class="summary-value">${shipping === 0 ? 'Free' : '$' + shipping.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Estimated Tax (10%)</span>
                    <span class="summary-value">$${tax.toFixed(2)}</span>
                </div>
                <div class="summary-row total">
                    <span class="summary-label">Total</span>
                    <span class="summary-value total-value">$${total.toFixed(2)}</span>
                </div>
                <button class="checkout-btn" onclick="proceedToCheckout()">
                    <i class="fas fa-credit-card"></i> Proceed to Checkout
                </button>
                <button class="clear-cart-btn" onclick="clearCart()">
                    <i class="fas fa-trash-alt"></i> Clear Cart
                </button>
                <a href="products.html" class="continue-shopping">
                    <i class="fas fa-arrow-left"></i> Continue Shopping
                </a>
            </div>
        </div>
    `;
}

async function updateQuantity(productId, newQuantity) {
    newQuantity = parseInt(newQuantity);
    if (isNaN(newQuantity) || newQuantity < 1) {
        newQuantity = 1;
    }
    if (newQuantity > 99) {
        newQuantity = 99;
    }
    
    await updateCartItem(productId, newQuantity);
}

async function proceedToCheckout() {
    if (!isAuthenticated()) {
        alert('Please login to checkout');
        window.location.href = 'login.html';
        return;
    }
    
    const cart = await fetchCart();
    
    if (cart.items.length === 0) {
        alert('Your cart is empty');
        return;
    }
    
    // Show shipping address modal
    const shippingAddress = prompt(
        'Please enter your shipping address in this format:\n\n' +
        'Street Address, City, Postal Code, Country\n\n' +
        'Example: 123 Main St, New York, 10001, USA'
    );
    
    if (shippingAddress) {
        const addressParts = shippingAddress.split(',').map(part => part.trim());
        const address = {
            street: addressParts[0] || '',
            city: addressParts[1] || '',
            postalCode: addressParts[2] || '',
            country: addressParts[3] || ''
        };
        
        // Show payment method selection
        const paymentMethod = prompt(
            'Select Payment Method:\n\n' +
            '1 - Credit Card\n' +
            '2 - PayPal\n' +
            '3 - Cash on Delivery\n\n' +
            'Enter 1, 2, or 3:'
        );
        
        let paymentType = 'Credit Card';
        if (paymentMethod === '2') paymentType = 'PayPal';
        if (paymentMethod === '3') paymentType = 'Cash on Delivery';
        
        await createOrder(address, paymentType);
    }
}

async function createOrder(shippingAddress, paymentMethod) {
    const token = localStorage.getItem('token');
    const cart = await fetchCart();
    
    if (cart.items.length === 0) {
        alert('Your cart is empty');
        return;
    }
    
    const orderItems = cart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
    }));
    
    // Show loading state
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        checkoutBtn.disabled = true;
    }
    
    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                items: orderItems,
                shippingAddress,
                paymentMethod: paymentMethod
            })
        });
        
        if (response.ok) {
            const order = await response.json();
            showToast(`Order placed successfully! Payment: ${paymentMethod} 🎉`);
            await clearCart();
            setTimeout(() => {
                window.location.href = 'orders.html';
            }, 2000);
        } else {
            const data = await response.json();
            alert('Failed to place order: ' + (data.message || 'Please try again'));
            if (checkoutBtn) {
                checkoutBtn.innerHTML = '<i class="fas fa-credit-card"></i> Proceed to Checkout';
                checkoutBtn.disabled = false;
            }
        }
    } catch (error) {
        console.error('Error creating order:', error);
        alert('Network error. Please try again.');
        if (checkoutBtn) {
            checkoutBtn.innerHTML = '<i class="fas fa-credit-card"></i> Proceed to Checkout';
            checkoutBtn.disabled = false;
        }
    }
}

// Make functions global for onclick handlers
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.proceedToCheckout = proceedToCheckout;