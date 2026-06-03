class UserManager {
    constructor() {
        console.log('👥 UserManager initialized');
        
        // Get DOM elements
        this.usersContainer = document.getElementById('usersContainer');
        this.allUsers = [];
        
        // Bind methods
        this.loadUsers = this.loadUsers.bind(this);
        this.followUser = this.followUser.bind(this);
        
        this.init();
    }

    init() {
        console.log('Initializing UserManager...');
        
        if (this.usersContainer) {
            console.log('✅ Users container found');
        } else {
            console.error('❌ Users container not found!');
        }
    }

    async loadUsers() {
        console.log('🔄 loadUsers called');
        console.log('Current user ID:', window.currentUserId);
        console.log('Is logged in:', api.isLoggedIn());
        
        if (!this.usersContainer) {
            console.error('❌ Users container not found');
            return;
        }
        
        // Check if user is logged in
        if (!window.currentUserId && !api.isLoggedIn()) {
            console.log('⚠️ User not logged in, showing message');
            this.usersContainer.innerHTML = '<div class="loading">Please login to see users</div>';
            return;
        }
        
        try {
            // Show loading state
            this.usersContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading users...</div>';
            
            console.log('📡 Fetching users from API...');
            const users = await api.getAllUsers();
            console.log('✅ Users received:', users);
            console.log('Number of users:', users.length);
            
            this.allUsers = users;
            
            if (!users || users.length === 0) {
                this.usersContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <p>No users found. Invite friends to join!</p>
                    </div>
                `;
                return;
            }
            
            this.renderUsers(users);
            
        } catch (error) {
            console.error('❌ Error loading users:', error);
            this.usersContainer.innerHTML = `
                <div class="loading error">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error: ${error.message}</p>
                    <button onclick="userManager.loadUsers()" class="retry-btn">Try Again</button>
                </div>
            `;
        }
    }

    renderUsers(users) {
        console.log('🎨 Rendering users, count:', users.length);
        
        if (!this.usersContainer) return;
        
        // Filter out current user
        const otherUsers = users.filter(user => user._id !== window.currentUserId);
        console.log('Other users count:', otherUsers.length);
        
        if (otherUsers.length === 0) {
            this.usersContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>No other users found. Invite friends to join!</p>
                </div>
            `;
            return;
        }
        
        let html = '<div class="users-grid">';
        
        for (const user of otherUsers) {
            const username = user.username || 'Unknown User';
            const bio = user.bio || 'No bio yet';
            const avatarUrl = user.avatar || 'https://via.placeholder.com/80';
            
            html += `
                <div class="user-card" data-user-id="${user._id}">
                    <img src="${avatarUrl}" 
                         alt="${username}" 
                         class="user-avatar"
                         onerror="this.src='https://via.placeholder.com/80'">
                    <div class="user-name">${this.escapeHtml(username)}</div>
                    <div class="user-bio">${this.escapeHtml(bio)}</div>
                    <button class="follow-btn" onclick="userManager.followUser('${user._id}', this)">
                        <i class="fas fa-user-plus"></i> Follow
                    </button>
                </div>
            `;
        }
        
        html += '</div>';
        this.usersContainer.innerHTML = html;
        console.log('✅ Users rendered successfully');
    }

    async followUser(userId, button) {
        console.log('➕ Follow user clicked:', userId);
        
        if (!button) {
            console.error('Button element not found');
            return;
        }
        
        // Check if already following
        if (button.innerHTML.includes('Following')) {
            this.showToast('Already following this user', 'info');
            return;
        }
        
        try {
            // Change button text to show loading
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Following...';
            button.disabled = true;
            
            console.log('Sending follow request...');
            await api.followUser(userId);
            console.log('✅ Followed successfully');
            
            // Update button
            button.innerHTML = '<i class="fas fa-check"></i> Following';
            button.style.background = '#4caf50';
            button.style.borderColor = '#4caf50';
            
            this.showToast('User followed successfully!', 'success');
            
            // TRIGGER EVENT FOR PROFILE UPDATE
            console.log('📢 Dispatching followChanged event');
            document.dispatchEvent(new CustomEvent('followChanged', { detail: { userId, action: 'follow' } }));
            window.dispatchEvent(new CustomEvent('followChanged', { detail: { userId, action: 'follow' } }));
            
            // Directly update profile stats
            if (window.profileManager) {
                console.log('🔄 Updating profile stats...');
                setTimeout(() => {
                    profileManager.loadUserStats();
                }, 500);
            }
            
        } catch (error) {
            console.error('❌ Failed to follow:', error);
            button.innerHTML = '<i class="fas fa-user-plus"></i> Follow';
            button.disabled = false;
            this.showToast('Failed to follow: ' + error.message, 'error');
        }
    }

    async unfollowUser(userId, button) {
        console.log('➖ Unfollow user clicked:', userId);
        
        try {
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Unfollowing...';
            button.disabled = true;
            
            await api.unfollowUser(userId);
            console.log('✅ Unfollowed successfully');
            
            button.innerHTML = '<i class="fas fa-user-plus"></i> Follow';
            button.style.background = '';
            button.style.borderColor = '';
            
            this.showToast('User unfollowed', 'info');
            
            // TRIGGER EVENT FOR PROFILE UPDATE
            document.dispatchEvent(new CustomEvent('followChanged', { detail: { userId, action: 'unfollow' } }));
            
            if (window.profileManager) {
                profileManager.loadUserStats();
            }
            
        } catch (error) {
            console.error('❌ Failed to unfollow:', error);
            button.innerHTML = '<i class="fas fa-check"></i> Following';
            button.disabled = false;
            this.showToast('Failed to unfollow: ' + error.message, 'error');
        }
    }

    showToast(message, type = 'info') {
        // Remove existing toast
        const existingToast = document.querySelector('.user-toast');
        if (existingToast) existingToast.remove();
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `user-toast toast-${type}`;
        
        let icon = 'fa-info-circle';
        if (type === 'success') icon = 'fa-check-circle';
        if (type === 'error') icon = 'fa-exclamation-circle';
        if (type === 'warning') icon = 'fa-exclamation-triangle';
        
        toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create global instance
const userManager = new UserManager();

// Make available globally
window.userManager = userManager;

console.log('✅ UserManager ready');