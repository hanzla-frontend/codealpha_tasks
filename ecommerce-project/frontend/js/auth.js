// frontend/js/auth.js
const API_URL = 'http://localhost:5000/api';

function isAuthenticated() {
    return localStorage.getItem('token') !== null;
}

function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

async function register(name, email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify({ _id: data._id, name: data.name, email: data.email }));
            updateAuthUI();
            return { success: true };
        } else {
            return { success: false, error: data.message };
        }
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
}

async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify({ _id: data._id, name: data.name, email: data.email }));
            updateAuthUI();
            return { success: true };
        } else {
            return { success: false, error: data.message };
        }
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateAuthUI();
    window.location.href = 'index.html';
}

function updateAuthUI() {
    const token = localStorage.getItem('token');
    const user = getUser();
    const authNav = document.getElementById('authNav');
    const userNav = document.getElementById('userNav');
    
    if (authNav && userNav) {
        if (token && user) {
            authNav.style.display = 'none';
            userNav.style.display = 'flex';
            const userNameSpan = document.getElementById('userName');
            if (userNameSpan) userNameSpan.textContent = `Hi, ${user.name}`;
        } else {
            authNav.style.display = 'flex';
            userNav.style.display = 'none';
        }
    }
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Update cart count in navbar
async function updateCartCount() {
    const token = localStorage.getItem('token');
    if (!token) {
        const cartCountSpan = document.getElementById('cartCount');
        if (cartCountSpan) cartCountSpan.textContent = '0';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/cart`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const cart = await response.json();
            const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
            const cartCountSpan = document.getElementById('cartCount');
            if (cartCountSpan) cartCountSpan.textContent = count;
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

// Initialize auth UI and logout button
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});