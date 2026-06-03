class CommentManager {
    constructor() {
        console.log('💬 CommentManager constructor called');
        
        // Get DOM elements
        this.modal = document.getElementById('commentModal');
        this.commentsList = document.getElementById('commentsList');
        this.commentText = document.getElementById('commentText');
        this.addCommentBtn = document.getElementById('addCommentBtn');
        this.currentPostId = null;
        
        console.log('Modal element:', this.modal);
        console.log('Comments list:', this.commentsList);
        console.log('Add comment button:', this.addCommentBtn);
        
        this.init();
    }

    init() {
        console.log('Initializing CommentManager...');
        
        // Add event listener to add comment button
        if (this.addCommentBtn) {
            // Remove existing listeners to avoid duplicates
            const newBtn = this.addCommentBtn.cloneNode(true);
            this.addCommentBtn.parentNode.replaceChild(newBtn, this.addCommentBtn);
            this.addCommentBtn = newBtn;
            this.addCommentBtn.addEventListener('click', () => this.addComment());
            console.log('✅ Add comment button listener added');
        } else {
            console.error('❌ Add comment button not found');
        }
        
        // Add close button listener
        const closeBtn = this.modal ? this.modal.querySelector('.close') : null;
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
            console.log('✅ Close button listener added');
        }
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        console.log('✅ CommentManager ready');
    }

    async openComments(postId) {
        console.log('📬 Opening comments for post:', postId);
        
        if (!postId) {
            console.error('❌ No post ID provided');
            alert('Error: No post selected');
            return;
        }
        
        if (!this.modal) {
            console.error('❌ Modal element not found');
            alert('Comment system error: Modal not found');
            return;
        }
        
        this.currentPostId = postId;
        
        try {
            // Show modal
            this.modal.style.display = 'block';
            console.log('Modal displayed');
            
            // Clear previous content
            if (this.commentText) {
                this.commentText.value = '';
            }
            
            // Load comments
            await this.loadComments(postId);
            
        } catch (error) {
            console.error('❌ Error opening comments:', error);
            alert('Failed to load comments: ' + error.message);
        }
    }

    async loadComments(postId) {
        console.log('📥 Loading comments for post:', postId);
        
        if (!this.commentsList) {
            console.error('❌ Comments list container not found');
            return;
        }
        
        try {
            // Show loading state
            this.commentsList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading comments...</div>';
            
            // Fetch comments from API
            const comments = await api.getComments(postId);
            console.log('Comments received:', comments.length);
            
            if (!comments || comments.length === 0) {
                this.commentsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-comments"></i>
                        <p>No comments yet. Be the first to comment!</p>
                    </div>
                `;
                return;
            }
            
            this.renderComments(comments);
            
        } catch (error) {
            console.error('❌ Error loading comments:', error);
            this.commentsList.innerHTML = `
                <div class="loading error">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error: ${error.message}</p>
                    <button onclick="commentManager.loadComments('${postId}')" class="retry-btn">Try Again</button>
                </div>
            `;
        }
    }

    renderComments(comments) {
        console.log('🎨 Rendering comments, count:', comments.length);
        
        if (!this.commentsList) return;
        
        let html = '';
        for (const comment of comments) {
            const username = comment.userId?.username || 'Unknown User';
            const avatarUrl = comment.userId?.avatar || 'https://via.placeholder.com/32';
            const commentText = comment.text || '';
            const commentDate = this.formatDate(comment.createdAt);
            const isOwner = window.currentUserId && comment.userId?._id === window.currentUserId;
            
            html += `
                <div class="comment-item" data-comment-id="${comment._id}">
                    <img src="${avatarUrl}" 
                         alt="${username}" 
                         class="comment-avatar"
                         onerror="this.src='https://via.placeholder.com/32'">
                    <div class="comment-content">
                        <div class="comment-username">${this.escapeHtml(username)}</div>
                        <div class="comment-text">${this.escapeHtml(commentText)}</div>
                        <div class="comment-time">${commentDate}</div>
                    </div>
                    ${isOwner ? `
                        <button class="delete-comment-btn" onclick="commentManager.deleteComment('${comment._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            `;
        }
        
        this.commentsList.innerHTML = html;
        console.log('✅ Comments rendered successfully');
    }

    async addComment() {
        console.log('📝 Adding comment...');
        
        if (!this.currentPostId) {
            console.error('❌ No post selected');
            alert('Error: No post selected');
            return;
        }
        
        const text = this.commentText ? this.commentText.value.trim() : '';
        
        if (!text) {
            alert('Please enter a comment');
            if (this.commentText) this.commentText.focus();
            return;
        }
        
        // Show loading state on button
        const originalText = this.addCommentBtn.innerHTML;
        this.addCommentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
        this.addCommentBtn.disabled = true;
        
        try {
            console.log('Sending comment to API...');
            await api.createComment(this.currentPostId, text);
            console.log('✅ Comment added successfully');
            
            // Clear input
            if (this.commentText) {
                this.commentText.value = '';
            }
            
            // Show success message
            this.showMessage('Comment added successfully!', 'success');
            
            // Reload comments
            await this.loadComments(this.currentPostId);
            
        } catch (error) {
            console.error('❌ Error adding comment:', error);
            alert('Failed to add comment: ' + error.message);
        } finally {
            // Reset button
            this.addCommentBtn.innerHTML = originalText;
            this.addCommentBtn.disabled = false;
        }
    }

    async deleteComment(commentId) {
        console.log('🗑️ Deleting comment:', commentId);
        
        if (!confirm('Are you sure you want to delete this comment?')) {
            return;
        }
        
        try {
            await api.deleteComment(commentId);
            console.log('✅ Comment deleted successfully');
            this.showMessage('Comment deleted!', 'success');
            
            // Reload comments
            await this.loadComments(this.currentPostId);
            
        } catch (error) {
            console.error('❌ Error deleting comment:', error);
            alert('Failed to delete comment: ' + error.message);
        }
    }

    closeModal() {
        console.log('🔒 Closing comment modal');
        
        if (this.modal) {
            this.modal.style.display = 'none';
            this.currentPostId = null;
            if (this.commentText) {
                this.commentText.value = '';
            }
        }
    }

    formatDate(date) {
        const now = new Date();
        const commentDate = new Date(date);
        const diffSeconds = Math.floor((now - commentDate) / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffSeconds < 60) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
        
        return commentDate.toLocaleDateString();
    }

    showMessage(message, type = 'info') {
        // Remove existing toast
        const existing = document.querySelector('.comment-toast');
        if (existing) existing.remove();
        
        // Create toast
        const toast = document.createElement('div');
        toast.className = `comment-toast toast-${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                     type === 'error' ? 'fa-exclamation-circle' : 
                     type === 'warning' ? 'fa-exclamation-triangle' : 
                     'fa-info-circle';
        
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
const commentManager = new CommentManager();

// Make it available globally
window.commentManager = commentManager;

console.log('✅ CommentManager fully loaded and ready');