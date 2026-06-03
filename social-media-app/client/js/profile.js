class ProfileManager {
    constructor() {
        console.log('👤 ProfileManager initialized');
        
        // Get DOM elements
        this.profileUsername = document.getElementById('profileUsername');
        this.profileBio = document.getElementById('profileBio');
        this.profileAvatar = document.getElementById('profileAvatar');
        this.followersCount = document.getElementById('followersCount');
        this.followingCount = document.getElementById('followingCount');
        this.postsCount = document.getElementById('postsCount');
        this.userPostsContainer = document.getElementById('userPostsContainer');
        this.editProfileBtn = document.getElementById('editProfileBtn');
        this.editModal = document.getElementById('editProfileModal');
        this.editForm = document.getElementById('editProfileForm');
        this.currentUser = null;
        
        // Log elements for debugging
        console.log('Edit Profile Button:', this.editProfileBtn);
        console.log('Edit Modal:', this.editModal);
        console.log('Edit Form:', this.editForm);
        
        this.init();
    }

    init() {
        console.log('Initializing ProfileManager...');
        
        // Edit profile button - Make sure it exists
        if (this.editProfileBtn) {
            // Remove any existing listeners
            const newBtn = this.editProfileBtn.cloneNode(true);
            this.editProfileBtn.parentNode.replaceChild(newBtn, this.editProfileBtn);
            this.editProfileBtn = newBtn;
            
            this.editProfileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Edit profile button clicked!');
                this.openEditModal();
            });
            console.log('✅ Edit profile button listener added');
        } else {
            console.error('❌ Edit profile button not found!');
        }
        
        // Edit form
        if (this.editForm) {
            this.editForm.addEventListener('submit', (e) => this.updateProfile(e));
            console.log('✅ Edit form listener added');
        }
        
        // Close modal buttons
        const closeBtn = document.querySelector('#editProfileModal .close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeEditModal());
            console.log('✅ Close button listener added');
        }
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.editModal) {
                this.closeEditModal();
            }
        });
        
        // Listen for events
        window.addEventListener('postCreated', () => {
            console.log('Post created event - refreshing profile');
            this.loadUserStats();
            this.loadUserPosts();
        });
        
        window.addEventListener('followChanged', () => {
            console.log('Follow changed event - refreshing profile');
            this.loadUserStats();
        });
    }

    async loadProfile() {
        console.log('🔄 Loading profile...');
        
        if (!api.isLoggedIn()) {
            console.log('User not logged in');
            return;
        }
        
        try {
            // Show loading state
            if (this.profileUsername) this.profileUsername.textContent = 'Loading...';
            if (this.profileBio) this.profileBio.textContent = 'Loading...';
            
            // Get profile data
            this.currentUser = await api.getProfile();
            console.log('✅ Profile loaded:', this.currentUser);
            
            // Set global user ID
            window.currentUserId = this.currentUser._id;
            
            // Update profile UI
            if (this.profileUsername) {
                this.profileUsername.textContent = this.currentUser.username;
            }
            
            if (this.profileBio) {
                this.profileBio.textContent = this.currentUser.bio || 'No bio yet';
            }
            
            if (this.profileAvatar) {
                this.profileAvatar.src = this.currentUser.avatar || 'https://via.placeholder.com/120';
                this.profileAvatar.onerror = () => {
                    this.profileAvatar.src = 'https://via.placeholder.com/120';
                };
            }
            
            // Update avatar in create post section
            const currentUserAvatar = document.getElementById('currentUserAvatar');
            if (currentUserAvatar) {
                currentUserAvatar.src = this.currentUser.avatar || 'https://via.placeholder.com/48';
            }
            
            // Load user statistics
            await this.loadUserStats();
            
            // Load user posts
            await this.loadUserPosts();
            
        } catch (error) {
            console.error('❌ Error loading profile:', error);
            if (this.profileUsername) {
                this.profileUsername.textContent = 'Error loading profile';
            }
            if (this.profileBio) {
                this.profileBio.textContent = 'Please refresh the page';
            }
        }
    }

    async loadUserStats() {
        console.log('📊 Loading user statistics...');
        
        if (!this.currentUser && !window.currentUserId) {
            console.log('No user ID available');
            return;
        }
        
        const userId = this.currentUser ? this.currentUser._id : window.currentUserId;
        console.log('Loading stats for user ID:', userId);
        
        try {
            // Get followers
            const followers = await api.getFollowers(userId);
            const followersCount = Array.isArray(followers) ? followers.length : 0;
            console.log('Followers count:', followersCount);
            
            // Get following
            const following = await api.getFollowing(userId);
            const followingCount = Array.isArray(following) ? following.length : 0;
            console.log('Following count:', followingCount);
            
            // Get all posts and filter by user
            const allPosts = await api.getPosts();
            const userPosts = allPosts.filter(post => {
                return post.userId && post.userId._id === userId;
            });
            const postsCount = userPosts.length;
            console.log('User posts count:', postsCount);
            
            // Update UI
            if (this.followersCount) this.followersCount.textContent = followersCount;
            if (this.followingCount) this.followingCount.textContent = followingCount;
            if (this.postsCount) this.postsCount.textContent = postsCount;
            
            console.log('✅ Stats updated');
            
        } catch (error) {
            console.error('❌ Error loading stats:', error);
            if (this.followersCount) this.followersCount.textContent = '0';
            if (this.followingCount) this.followingCount.textContent = '0';
            if (this.postsCount) this.postsCount.textContent = '0';
        }
    }

    async loadUserPosts() {
        console.log('📝 Loading user posts...');
        
        if (!this.userPostsContainer) {
            console.error('User posts container not found');
            return;
        }
        
        if (!this.currentUser && !window.currentUserId) {
            console.log('No user ID available');
            return;
        }
        
        const userId = this.currentUser ? this.currentUser._id : window.currentUserId;
        
        try {
            this.userPostsContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading your posts...</div>';
            
            const allPosts = await api.getPosts();
            const userPosts = allPosts.filter(post => {
                return post.userId && post.userId._id === userId;
            });
            
            console.log('User posts found:', userPosts.length);
            
            if (userPosts.length === 0) {
                this.userPostsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-newspaper"></i>
                        <p>You haven't created any posts yet.</p>
                        <button onclick="document.getElementById('postContent').focus()" class="create-post-btn">
                            Create Your First Post
                        </button>
                    </div>
                `;
                return;
            }
            
            this.renderUserPosts(userPosts);
            
        } catch (error) {
            console.error('❌ Error loading user posts:', error);
            this.userPostsContainer.innerHTML = `
                <div class="loading error">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading posts: ${error.message}</p>
                    <button onclick="profileManager.loadUserPosts()" class="retry-btn">Try Again</button>
                </div>
            `;
        }
    }

    renderUserPosts(posts) {
        console.log('🎨 Rendering user posts, count:', posts.length);
        
        const username = this.currentUser ? this.currentUser.username : 'User';
        const avatar = this.currentUser ? this.currentUser.avatar : 'https://via.placeholder.com/48';
        
        const sortedPosts = [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        let html = '';
        for (const post of sortedPosts) {
            const likesCount = post.likes ? post.likes.length : 0;
            const postDate = this.formatDate(post.createdAt);
            
            html += `
                <div class="post-card" data-post-id="${post._id}">
                    <div class="post-header">
                        <img src="${avatar}" 
                             alt="${username}" 
                             class="avatar"
                             onerror="this.src='https://via.placeholder.com/48'">
                        <div class="post-user-info">
                            <div class="post-username">${this.escapeHtml(username)}</div>
                            <div class="post-time">
                                <i class="far fa-clock"></i> ${postDate}
                            </div>
                        </div>
                        <div class="post-menu">
                            <button class="delete-post-btn" onclick="postManager.deletePost('${post._id}')" title="Delete post">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="post-content">
                        <p>${this.escapeHtml(post.content)}</p>
                    </div>
                    <div class="post-stats">
                        <span class="likes-count">
                            <i class="fas fa-heart"></i>
                            ${likesCount} ${likesCount === 1 ? 'like' : 'likes'}
                        </span>
                    </div>
                </div>
            `;
        }
        
        this.userPostsContainer.innerHTML = html;
        console.log('✅ User posts rendered successfully');
    }

    openEditModal() {
        console.log('📝 Opening edit profile modal');
        
        if (!this.editModal) {
            console.error('❌ Edit modal not found!');
            alert('Edit modal not found. Please refresh the page.');
            return;
        }
        
        if (!this.currentUser) {
            console.error('❌ No user data available');
            // Try to reload profile first
            this.loadProfile().then(() => {
                if (this.currentUser) {
                    this.openEditModal();
                }
            });
            return;
        }
        
        console.log('Current user data:', this.currentUser);
        
        // Fill form with current data
        const editUsername = document.getElementById('editUsername');
        const editBio = document.getElementById('editBio');
        const editAvatar = document.getElementById('editAvatar');
        
        if (editUsername) editUsername.value = this.currentUser.username;
        if (editBio) editBio.value = this.currentUser.bio || '';
        if (editAvatar) editAvatar.value = this.currentUser.avatar || '';
        
        // Show modal
        this.editModal.style.display = 'block';
        console.log('Modal should be visible now');
    }

    closeEditModal() {
        console.log('🔒 Closing edit profile modal');
        
        if (this.editModal) {
            this.editModal.style.display = 'none';
        }
    }

    async updateProfile(event) {
        event.preventDefault();
        console.log('💾 Updating profile...');
        
        const username = document.getElementById('editUsername').value.trim();
        const bio = document.getElementById('editBio').value.trim();
        const avatar = document.getElementById('editAvatar').value.trim();
        
        if (!username) {
            this.showMessage('Username is required', 'error');
            return;
        }
        
        const updateData = { username };
        if (bio) updateData.bio = bio;
        if (avatar) updateData.avatar = avatar;
        
        const submitBtn = this.editForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            submitBtn.disabled = true;
            
            await api.updateProfile(updateData);
            console.log('✅ Profile updated successfully');
            
            // Reload profile data
            await this.loadProfile();
            
            this.closeEditModal();
            this.showMessage('Profile updated successfully!', 'success');
            
        } catch (error) {
            console.error('❌ Error updating profile:', error);
            this.showMessage('Failed to update profile: ' + error.message, 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    formatDate(date) {
        const now = new Date();
        const postDate = new Date(date);
        const diffSeconds = Math.floor((now - postDate) / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffSeconds < 60) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
        
        return postDate.toLocaleDateString();
    }

    showMessage(message, type = 'info') {
        const existing = document.querySelector('.profile-toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = `profile-toast toast-${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                     type === 'error' ? 'fa-exclamation-circle' : 
                     'fa-info-circle';
        
        toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
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
const profileManager = new ProfileManager();
console.log('✅ ProfileManager ready');