class AuthManager {
    constructor() {
        console.log('🔐 AuthManager initialized');
        
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.authSection = document.getElementById('authSection');
        this.appSection = document.getElementById('appSection');
        this.navbar = document.getElementById('navbar');
        
        this.init();
    }

    init() {
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(e);
            });
        }
        
        if (this.registerForm) {
            this.registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister(e);
            });
        }
        
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        
        // Check if already logged in
        this.checkAuth();
    }

    async checkAuth() {
        const token = localStorage.getItem('token');
        console.log('Checking auth, token:', !!token);
        
        if (token) {
            api.setToken(token);
            try {
                const profile = await api.getProfile();
                window.currentUserId = profile._id;
                console.log('Already logged in as:', profile.username);
                this.showApp();
            } catch (error) {
                console.log('Invalid token');
                this.showAuth();
            }
        } else {
            this.showAuth();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        console.log('Login:', email);
        
        try {
            const userData = await api.login({ email, password });
            window.currentUserId = userData._id;
            console.log('Login success:', userData.username);
            this.showApp();
        } catch (error) {
            alert('Login failed: ' + error.message);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('regUsername').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const confirm = document.getElementById('regConfirmPassword').value;
        
        if (password !== confirm) {
            alert('Passwords do not match');
            return;
        }
        
        try {
            const userData = await api.register({ username, email, password });
            window.currentUserId = userData._id;
            console.log('Register success:', username);
            this.showApp();
        } catch (error) {
            alert('Register failed: ' + error.message);
        }
    }

    handleLogout() {
        api.logout();
        window.currentUserId = null;
        this.showAuth();
    }

    showApp() {
        console.log('Showing app, user ID:', window.currentUserId);
        
        if (this.authSection) this.authSection.style.display = 'none';
        if (this.appSection) this.appSection.style.display = 'block';
        if (this.navbar) this.navbar.style.display = 'block';
        
        // Load posts immediately
        setTimeout(() => {
            if (window.postManager) {
                console.log('Loading posts...');
                postManager.loadPosts();
            }
            if (window.profileManager) {
                profileManager.loadProfile();
            }
            if (window.userManager) {
                userManager.loadUsers();
            }
        }, 100);
    }

    showAuth() {
        if (this.authSection) this.authSection.style.display = 'flex';
        if (this.appSection) this.appSection.style.display = 'none';
        if (this.navbar) this.navbar.style.display = 'none';
    }
}

window.currentUserId = null;
const authManager = new AuthManager();