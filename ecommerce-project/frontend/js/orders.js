// frontend/js/orders.js
// API_URL is already defined in auth.js

let allOrders = [];
let currentFilter = 'all';

async function fetchOrders() {
    const token = localStorage.getItem('token');
    if (!token) return [];
    
    try {
        const response = await fetch(`${API_URL}/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.clear();
                window.location.href = 'login.html';
                return [];
            }
            throw new Error('Failed to fetch orders');
        }
        
        const orders = await response.json();
        console.log('Orders fetched:', orders);
        return orders;
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
}

async function loadOrders() {
    allOrders = await fetchOrders();
    displayOrders();
}

function displayOrders() {
    const container = document.getElementById('ordersContent');
    
    if (!container) return;
    
    // Filter orders
    let filteredOrders = allOrders;
    if (currentFilter !== 'all') {
        filteredOrders = allOrders.filter(order => order.status === currentFilter);
    }
    
    if (filteredOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-orders">
                <i class="fas fa-box-open"></i>
                <h2>No Orders Found</h2>
                <p>${allOrders.length === 0 ? "You haven't placed any orders yet." : `No ${currentFilter} orders found.`}</p>
                <a href="products.html" class="shop-now-btn">
                    <i class="fas fa-store"></i> Start Shopping
                </a>
            </div>
        `;
        return;
    }
    
    // Calculate stats
    const totalOrders = allOrders.length;
    const totalSpent = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const deliveredOrders = allOrders.filter(order => order.status === 'delivered').length;
    
    // Stats HTML
    const statsHtml = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-shopping-bag"></i>
                </div>
                <div class="stat-number">${totalOrders}</div>
                <div class="stat-label">Total Orders</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-dollar-sign"></i>
                </div>
                <div class="stat-number">$${totalSpent.toFixed(2)}</div>
                <div class="stat-label">Total Spent</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-number">${deliveredOrders}</div>
                <div class="stat-label">Delivered</div>
            </div>
        </div>
        
        <div class="filter-tabs">
            <div class="filter-tab ${currentFilter === 'all' ? 'active' : ''}" onclick="filterOrders('all')">All Orders</div>
            <div class="filter-tab ${currentFilter === 'pending' ? 'active' : ''}" onclick="filterOrders('pending')">Pending</div>
            <div class="filter-tab ${currentFilter === 'processing' ? 'active' : ''}" onclick="filterOrders('processing')">Processing</div>
            <div class="filter-tab ${currentFilter === 'shipped' ? 'active' : ''}" onclick="filterOrders('shipped')">Shipped</div>
            <div class="filter-tab ${currentFilter === 'delivered' ? 'active' : ''}" onclick="filterOrders('delivered')">Delivered</div>
            <div class="filter-tab ${currentFilter === 'cancelled' ? 'active' : ''}" onclick="filterOrders('cancelled')">Cancelled</div>
        </div>
    `;
    
    // Orders HTML
    const ordersHtml = filteredOrders.map(order => {
        const statusClass = `status-${order.status}`;
        const statusIcon = getStatusIcon(order.status);
        
        // Calculate item total for display
        const itemTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        return `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-info">
                        <div class="order-info-item">
                            <span class="order-info-label">Order ID</span>
                            <span class="order-info-value">#${order._id.slice(-8).toUpperCase()}</span>
                        </div>
                        <div class="order-info-item">
                            <span class="order-info-label">Order Date</span>
                            <span class="order-info-value">${new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div class="order-info-item">
                            <span class="order-info-label">Payment Method</span>
                            <span class="order-info-value">${order.paymentMethod || 'Credit Card'}</span>
                        </div>
                    </div>
                    <div class="order-status ${statusClass}">
                        <i class="${statusIcon}"></i>
                        ${order.status.toUpperCase()}
                    </div>
                </div>
                
                <div class="order-body">
                    <div class="order-items">
                        ${order.items.map(item => `
                            <div class="order-item">
                                <img src="${item.image || 'https://via.placeholder.com/80'}" alt="${item.name}" class="order-item-image" onerror="this.src='https://via.placeholder.com/80'">
                                <div class="order-item-details">
                                    <div class="order-item-name">${item.name}</div>
                                    <div class="order-item-price">$${item.price.toFixed(2)} each</div>
                                    <div class="order-item-quantity">Quantity: ${item.quantity}</div>
                                </div>
                                <div class="order-item-total">$${(item.price * item.quantity).toFixed(2)}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="shipping-info">
                        <div class="shipping-title">
                            <i class="fas fa-truck"></i> Shipping Address
                        </div>
                        <div class="shipping-address">
                            ${order.shippingAddress?.street || 'N/A'}<br>
                            ${order.shippingAddress?.city || 'N/A'}, ${order.shippingAddress?.postalCode || 'N/A'}<br>
                            ${order.shippingAddress?.country || 'N/A'}
                        </div>
                    </div>
                    
                    <div class="order-footer">
                        <div class="order-total">
                            <span class="order-total-label">Total Amount:</span>
                            <span class="order-total-value">$${order.totalAmount.toFixed(2)}</span>
                        </div>
                        <div class="order-actions">
                            <button class="btn-track" onclick="trackOrder('${order._id}', '${order.status}')">
                                <i class="fas fa-map-marker-alt"></i> Track Order
                            </button>
                            ${order.status === 'pending' || order.status === 'processing' ? 
                                `<button class="btn-cancel" onclick="cancelOrder('${order._id}')">
                                    <i class="fas fa-times"></i> Cancel Order
                                </button>` : ''
                            }
                            ${order.status === 'delivered' ? 
                                `<button class="btn-reorder" onclick="reorder('${order._id}')">
                                    <i class="fas fa-redo"></i> Buy Again
                                </button>` : ''
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = statsHtml + ordersHtml;
}

function getStatusIcon(status) {
    switch(status) {
        case 'pending': return 'fas fa-clock';
        case 'processing': return 'fas fa-cog fa-spin';
        case 'shipped': return 'fas fa-shipping-fast';
        case 'delivered': return 'fas fa-check-circle';
        case 'cancelled': return 'fas fa-ban';
        default: return 'fas fa-box';
    }
}

function filterOrders(status) {
    currentFilter = status;
    displayOrders();
}

async function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            showToast('Order cancelled successfully!');
            await loadOrders(); // Reload orders
        } else {
            const data = await response.json();
            showToast(data.message || 'Failed to cancel order', true);
        }
    } catch (error) {
        console.error('Error cancelling order:', error);
        showToast('Network error. Please try again.', true);
    }
}

async function reorder(orderId) {
    const order = allOrders.find(o => o._id === orderId);
    if (!order) return;
    
    const token = localStorage.getItem('token');
    
    showToast('Adding items to cart...');
    
    try {
        // Add each item to cart
        for (const item of order.items) {
            await fetch(`${API_URL}/cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: item.productId || item.product,
                    quantity: item.quantity
                })
            });
        }
        
        showToast('Items added to cart! Redirecting...');
        setTimeout(() => {
            window.location.href = 'cart.html';
        }, 1500);
    } catch (error) {
        console.error('Error reordering:', error);
        showToast('Error adding items to cart', true);
    }
}

function trackOrder(orderId, status) {
    const modal = document.getElementById('trackingModal');
    const stepsContainer = document.getElementById('trackingSteps');
    const trackingInfo = document.getElementById('trackingInfo');
    
    // Define tracking steps
    const steps = [
        { name: 'Order Placed', status: 'pending', icon: 'fas fa-check-circle' },
        { name: 'Processing', status: 'processing', icon: 'fas fa-cog' },
        { name: 'Shipped', status: 'shipped', icon: 'fas fa-truck' },
        { name: 'Delivered', status: 'delivered', icon: 'fas fa-home' }
    ];
    
    const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
    const currentStepIndex = statusOrder.indexOf(status);
    
    // Generate tracking steps HTML
    stepsContainer.innerHTML = steps.map((step, index) => {
        let stepClass = '';
        if (index < currentStepIndex) {
            stepClass = 'completed';
        } else if (index === currentStepIndex) {
            stepClass = 'active';
        }
        
        return `
            <div class="step ${stepClass}">
                <div class="step-circle">
                    <i class="${step.icon}"></i>
                </div>
                <div class="step-label">${step.name}</div>
            </div>
        `;
    }).join('');
    
    // Add tracking info based on status
    let trackingMessage = '';
    const orderDate = new Date().toLocaleDateString();
    
    switch(status) {
        case 'pending':
            trackingMessage = `Your order has been confirmed and is waiting to be processed. Estimated delivery: 5-7 business days.`;
            break;
        case 'processing':
            trackingMessage = `Your order is being prepared for shipment. We'll notify you when it's on the way!`;
            break;
        case 'shipped':
            trackingMessage = `Your order is on the way! Track your package using the tracking number sent to your email.`;
            break;
        case 'delivered':
            trackingMessage = `Your order has been delivered. Thank you for shopping with us!`;
            break;
        case 'cancelled':
            trackingMessage = `This order has been cancelled. Please contact support if you have any questions.`;
            break;
        default:
            trackingMessage = `Order status: ${status}`;
    }
    
    trackingInfo.innerHTML = `
        <i class="fas fa-info-circle" style="margin-right: 8px;"></i>
        ${trackingMessage}
        ${status === 'shipped' ? '<br><br><strong>Tracking Number:</strong> SHIP' + orderId.slice(-10).toUpperCase() : ''}
    `;
    
    modal.classList.add('active');
}

function closeTrackingModal() {
    document.getElementById('trackingModal').classList.remove('active');
}

// Make functions global
window.filterOrders = filterOrders;
window.cancelOrder = cancelOrder;
window.reorder = reorder;
window.trackOrder = trackOrder;
window.closeTrackingModal = closeTrackingModal;