class PostManager {
    constructor() {
        console.log('📝 PostManager initialized');
        
        // Get DOM elements
        this.postsContainer = document.getElementById('postsContainer');
        this.createPostBtn = document.getElementById('createPostBtn');
        this.postContent = document.getElementById('postContent');
        this.allPosts = [];
        
        // Bind methods
        this.loadPosts = this.loadPosts.bind(this);
        this.createPost = this.createPost.bind(this);
        this.toggleLike = this.toggleLike.bind(this);
        this.deletePost = this.deletePost.bind(this);
        this.showComments = this.showComments.bind(this);
        
        this.init();
    }

    init() {
        console.log('Initializing PostManager...');
        
        if (this.createPostBtn) {
            // Remove existing listeners to avoid duplicates
            const newBtn = this.createPostBtn.cloneNode(true);
            this.createPostBtn.parentNode.replaceChild(newBtn, this.createPostBtn);
            this.createPostBtn = newBtn;
            this.createPostBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.createPost();
            });
            console.log('✅ Create post button listener added');
        }
        
        // Auto load posts when user is logged in
        setTimeout(() => {
            if (window.currentUserId || api.isLoggedIn()) {
                this.loadPosts();
            }
        }, 500);
    }

    async loadPosts() {
        console.log('🔄 loadPosts called');
        console.log('Current user ID:', window.currentUserId);
        
        if (!this.postsContainer) {
            console.error('❌ Posts container not found');
            return;
        }
        
        // Check if user is logged in
        if (!window.currentUserId && !api.isLoggedIn()) {
            console.log('⚠️ User not logged in');
            this.postsContainer.innerHTML = '<div class="loading">Please login to see posts</div>';
            return;
        }
        
        try {
            // Show loading state
            this.postsContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading posts...</div>';
            
            console.log('📡 Fetching posts from API...');
            const posts = await api.getPosts();
            console.log('✅ Posts received:', posts);
            console.log('Number of posts:', posts.length);
            
            this.allPosts = posts;
            
            if (!posts || posts.length === 0) {
                this.postsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-newspaper"></i>
                        <p>No posts yet. Create the first post!</p>
                    </div>
                `;
                return;
            }
            
            this.renderPosts(posts);
            
        } catch (error) {
            console.error('❌ Error loading posts:', error);
            this.postsContainer.innerHTML = `
                <div class="loading error">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error: ${error.message}</p>
                    <button onclick="postManager.loadPosts()" class="retry-btn">Try Again</button>
                </div>
            `;
        }
    }

    renderPosts(posts) {
        console.log('🎨 Rendering posts, count:', posts.length);
        
        if (!this.postsContainer) return;
        
        // Sort posts by newest first
        const sortedPosts = [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        let html = '';
        for (const post of sortedPosts) {
            const isLiked = post.likes && window.currentUserId && post.likes.includes(window.currentUserId);
            const likesCount = post.likes ? post.likes.length : 0;
            const isCurrentUser = window.currentUserId && post.userId && post.userId._id === window.currentUserId;
            const postDate = this.formatDate(post.createdAt);
            const username = post.userId?.username || 'Unknown User';
            const avatarUrl = post.userId?.avatar || 'https://via.placeholder.com/48';
            
            html += `
                <div class="post-card" data-post-id="${post._id}">
                    <div class="post-header">
                        <img src="${avatarUrl}" 
                             alt="${username}" 
                             class="avatar"
                             onerror="this.src='https://via.placeholder.com/48'">
                        <div class="post-user-info">
                            <div class="post-username">${this.escapeHtml(username)}</div>
                            <div class="post-time">
                                <i class="far fa-clock"></i> ${postDate}
                            </div>
                        </div>
                        ${isCurrentUser ? `
                            <div class="post-menu">
                                <button class="delete-post-btn" onclick="postManager.deletePost('${post._id}')" title="Delete post">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    <div class="post-content">
                        <p>${this.escapeHtml(post.content)}</p>
                    </div>
                    <div class="post-stats">
                        <span class="likes-count">
                            <i class="fas fa-heart ${isLiked ? 'liked' : ''}"></i>
                            ${likesCount} ${likesCount === 1 ? 'like' : 'likes'}
                        </span>
                    </div>
                    <div class="post-actions">
                        <button class="post-action-btn ${isLiked ? 'liked' : ''}" onclick="postManager.toggleLike('${post._id}')">
                            <i class="fas fa-heart"></i>
                            <span>Like</span>
                        </button>
                        <button class="post-action-btn" onclick="postManager.showComments('${post._id}')">
                            <i class="fas fa-comment"></i>
                            <span>Comment</span>
                        </button>
                    </div>
                </div>
            `;
        }
        
        this.postsContainer.innerHTML = html;
        console.log('✅ Posts rendered successfully');
    }

    async createPost() {
        const content = this.postContent.value.trim();
        
        if (!content) {
            this.showToast('Please enter some content', 'warning');
            this.postContent.focus();
            return;
        }
        
        if (content.length < 3) {
            this.showToast('Post must be at least 3 characters', 'warning');
            return;
        }
        
        const originalText = this.createPostBtn.innerHTML;
        
        try {
            // Show loading state
            this.createPostBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
            this.createPostBtn.disabled = true;
            
            console.log('📝 Creating post:', content);
            const newPost = await api.createPost(content);
            console.log('✅ Post created successfully:', newPost);
            
            // Clear textarea
            this.postContent.value = '';
            
            // Show success message
            this.showToast('Post created successfully!', 'success');
            
            // Reload posts to show the new one
            await this.loadPosts();
            
            // Dispatch event for profile update
            console.log('📢 Dispatching postCreated event');
            window.dispatchEvent(new CustomEvent('postCreated', { detail: newPost }));
            document.dispatchEvent(new CustomEvent('postCreated', { detail: newPost }));
            
            // Directly update profile stats
            if (window.profileManager) {
                console.log('🔄 Updating profile stats...');
                setTimeout(() => {
                    if (typeof profileManager.loadUserStats === 'function') {
                        profileManager.loadUserStats();
                    }
                    if (typeof profileManager.loadUserPosts === 'function') {
                        profileManager.loadUserPosts();
                    }
                }, 500);
            }
            
        } catch (error) {
            console.error('❌ Failed to create post:', error);
            this.showToast('Failed to create post: ' + error.message, 'error');
        } finally {
            // Restore button
            this.createPostBtn.innerHTML = originalText;
            this.createPostBtn.disabled = false;
        }
    }

    async toggleLike(postId) {
        console.log('❤️ Toggling like for post:', postId);
        
        try {
            const post = this.allPosts.find(p => p._id === postId);
            if (!post) {
                console.error('Post not found');
                return;
            }
            
            const isLiked = post.likes && post.likes.includes(window.currentUserId);
            
            if (isLiked) {
                await api.unlikePost(postId);
                this.showToast('Post unliked', 'info');
            } else {
                await api.likePost(postId);
                this.showToast('Post liked!', 'success');
            }
            
            // Reload posts to update like status
            await this.loadPosts();
            
        } catch (error) {
            console.error('❌ Failed to toggle like:', error);
            this.showToast('Failed to update like: ' + error.message, 'error');
        }
    }

    async deletePost(postId) {
        if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            console.log('🗑️ Deleting post:', postId);
            
            try {
                await api.deletePost(postId);
                this.showToast('Post deleted successfully!', 'success');
                await this.loadPosts();
                
                // Dispatch event for profile update
                window.dispatchEvent(new CustomEvent('postDeleted', { detail: { postId } }));
                document.dispatchEvent(new CustomEvent('postDeleted', { detail: { postId } }));
                
                // Directly update profile stats
                if (window.profileManager) {
                    console.log('🔄 Updating profile stats after deletion...');
                    setTimeout(() => {
                        if (typeof profileManager.loadUserStats === 'function') {
                            profileManager.loadUserStats();
                        }
                        if (typeof profileManager.loadUserPosts === 'function') {
                            profileManager.loadUserPosts();
                        }
                    }, 500);
                }
                
            } catch (error) {
                console.error('❌ Failed to delete post:', error);
                this.showToast('Failed to delete post: ' + error.message, 'error');
            }
        }
    }

    showComments(postId) {
        console.log('💬 Showing comments for post:', postId);
        if (window.commentManager) {
            window.commentManager.openComments(postId);
        } else {
            this.showToast('Comment system is initializing...', 'warning');
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
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) === 1 ? '' : 's'} ago`;
        
        return postDate.toLocaleDateString();
    }

    showToast(message, type = 'info') {
        // Remove existing toast
        const existingToast = document.querySelector('.post-toast');
        if (existingToast) existingToast.remove();
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `post-toast toast-${type}`;
        
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
const postManager = new PostManager();
console.log('✅ PostManager ready');