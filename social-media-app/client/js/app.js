class App {
    constructor() {
        console.log('App initialized');
        this.setupNavigation();
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.showPage(page);
                
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }

    showPage(page) {
        console.log('Showing page:', page);
        
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => {
            p.style.display = 'none';
        });
        
        // Show selected page
        const activePage = document.getElementById(`${page}Page`);
        if (activePage) {
            activePage.style.display = 'block';
        }
        
        // Load page data
        if (page === 'feed' && window.postManager) {
            console.log('Reloading feed posts');
            postManager.loadPosts();
        } else if (page === 'explore' && window.userManager) {
            userManager.loadUsers();
        } else if (page === 'profile' && window.profileManager) {
            profileManager.loadProfile();
        }
    }
}

// Initialize app
const app = new App();