const API_URL = 'http://localhost:5000/api';

class API {
    constructor() {
        this.token = localStorage.getItem('token');
        console.log('🌐 API Service Initialized');
        console.log('API URL:', API_URL);
        console.log('Token present:', !!this.token);
    }

    // Get token from localStorage
    getToken() {
        const token = localStorage.getItem('token');
        if (token) {
            this.token = token;
        }
        return this.token;
    }

    // Set token in localStorage
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
            console.log('✅ Token saved');
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            console.log('❌ Token removed');
        }
    }

    // Get headers with authentication
    getHeaders() {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    // Make API request
    async request(endpoint, options = {}) {
        const url = `${API_URL}${endpoint}`;
        const headers = this.getHeaders();
        
        console.log(`📡 ${options.method || 'GET'} ${url}`);
        
        try {
            const response = await fetch(url, {
                ...options,
                headers: headers,
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                // Handle unauthorized
                if (response.status === 401) {
                    console.error('🔒 Unauthorized - Clearing token');
                    this.setToken(null);
                    if (window.authManager) {
                        window.authManager.showAuth();
                    }
                }
                throw new Error(data.message || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('❌ API Error:', error.message);
            throw error;
        }
    }

    // ========== AUTH ENDPOINTS ==========
    
    async register(userData) {
        console.log('📝 Registering:', userData.email);
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        
        if (response.token) {
            this.setToken(response.token);
            localStorage.setItem('user', JSON.stringify(response));
        }
        return response;
    }

    async login(credentials) {
        console.log('🔐 Logging in:', credentials.email);
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
        
        if (response.token) {
            this.setToken(response.token);
            localStorage.setItem('user', JSON.stringify(response));
        }
        return response;
    }

    logout() {
        console.log('🚪 Logging out');
        this.setToken(null);
    }

    // ========== POSTS ENDPOINTS ==========
    
    async getPosts() {
        console.log('📰 Fetching posts');
        return this.request('/posts');
    }

    async createPost(content) {
        console.log('✏️ Creating post');
        return this.request('/posts', {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    }

    async likePost(postId) {
        console.log('❤️ Liking post:', postId);
        return this.request(`/posts/${postId}/like`, {
            method: 'PUT',
        });
    }

    async unlikePost(postId) {
        console.log('💔 Unliking post:', postId);
        return this.request(`/posts/${postId}/unlike`, {
            method: 'PUT',
        });
    }

    async deletePost(postId) {
        console.log('🗑️ Deleting post:', postId);
        return this.request(`/posts/${postId}`, {
            method: 'DELETE',
        });
    }

    // ========== COMMENTS ENDPOINTS ==========
    
    async getComments(postId) {
        console.log('💬 Fetching comments for post:', postId);
        return this.request(`/comments/post/${postId}`);
    }

    async createComment(postId, text) {
        console.log('💬 Adding comment to post:', postId);
        return this.request(`/comments/post/${postId}`, {
            method: 'POST',
            body: JSON.stringify({ text }),
        });
    }

    async deleteComment(commentId) {
        console.log('🗑️ Deleting comment:', commentId);
        return this.request(`/comments/${commentId}`, {
            method: 'DELETE',
        });
    }

    // ========== USER ENDPOINTS ==========
    
    async getProfile() {
        console.log('👤 Fetching profile');
        return this.request('/users/profile');
    }

    async updateProfile(userData) {
        console.log('✏️ Updating profile');
        const response = await this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
        
        // Update stored user data
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            const updatedUser = { ...currentUser, ...response };
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        return response;
    }

    async getAllUsers() {
        console.log('👥 Fetching all users');
        return this.request('/users');
    }

    // ========== FOLLOW ENDPOINTS ==========
    
    async followUser(userId) {
        console.log('➕ Following user:', userId);
        return this.request(`/follow/follow/${userId}`, {
            method: 'POST',
        });
    }

    async unfollowUser(userId) {
        console.log('➖ Unfollowing user:', userId);
        return this.request(`/follow/unfollow/${userId}`, {
            method: 'DELETE',
        });
    }

    async getFollowers(userId) {
        console.log('👥 Fetching followers for:', userId);
        return this.request(`/follow/followers/${userId}`);
    }

    async getFollowing(userId) {
        console.log('👥 Fetching following for:', userId);
        return this.request(`/follow/following/${userId}`);
    }

    // ========== HELPER METHODS ==========
    
    isLoggedIn() {
        const token = this.getToken();
        return !!token;
    }

    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                return null;
            }
        }
        return null;
    }
}

// Create global instance
const api = new API();
console.log('✅ API Service Ready');