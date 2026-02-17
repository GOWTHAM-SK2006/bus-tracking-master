// Authentication Manager for Unified Frontend
const AuthManager = {
    // Get API base URL
    getApiBaseUrl() {
        const host = window.location.hostname;
        const protocol = window.location.protocol;

        // File protocol fallback - use production URL for Capacitor
        if (protocol === 'file:') {
            return 'https://bus-tracking-master-production.up.railway.app';
        }

        if (host.includes('.devtunnels.ms')) {
            const tunnelMatch = host.match(/^([^-]+)-\d+\.(.+)$/);
            if (tunnelMatch) return `${protocol}//${tunnelMatch[1]}-8080.${tunnelMatch[2]}`;
        }

        if (window.location.port) {
            return `${protocol}//${host}:${window.location.port}`;
        }

        return `${protocol}//${host}`;
    },

    // Login function
    async login(role, username, password) {
        const baseUrl = this.getApiBaseUrl();
        let endpoint = '';
        let redirectPath = '';

        // Determine endpoint and redirect based on role
        switch (role) {
            case 'client':
                endpoint = '/api/client/login';
                redirectPath = '/client-frontend/index.html';
                break;
            case 'driver':
                endpoint = '/api/driver/login';
                redirectPath = '/driver-frontend/index.html';
                break;
            case 'admin':
                // Admin uses client-side authentication (no backend API)
                // Credentials: admin@college.com / admin123
                if (username === 'admin@college.com' && password === 'admin123') {
                    sessionStorage.setItem('admin', JSON.stringify({
                        id: 1,
                        name: 'Admin',
                        email: username,
                        role: 'ADMIN'
                    }));
                    window.location.href = '/admin-frontend/admin.html';
                    return;
                } else {
                    this.showError('Invalid admin credentials. Use admin@college.com / admin123');
                    return;
                }
            default:
                this.showError('Invalid role selected');
                return;
        }

        // For client and driver roles, call backend API
        try {
            const response = await fetch(`${baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success || response.ok) {
                // Store session data
                const sessionKey = role === 'driver' ? 'driver' : 'client';
                sessionStorage.setItem(sessionKey, JSON.stringify({
                    username: username,
                    role: role,
                    ...data
                }));

                // Redirect to appropriate frontend
                window.location.href = redirectPath;
            } else {
                this.showError(data.message || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Connection error. Please try again.');
        }
    },

    // Show error message
    showError(message) {
        // Remove existing error if any
        const existingError = document.querySelector('.error-message');
        if (existingError) existingError.remove();

        // Create error element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            background: #fee;
            border: 1px solid #fcc;
            color: #c33;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 0.9rem;
            animation: slideDown 0.3s ease-out;
        `;
        errorDiv.textContent = message;

        // Insert before form
        const form = document.getElementById('loginForm');
        form.parentNode.insertBefore(errorDiv, form);

        // Auto-remove after 5 seconds
        setTimeout(() => errorDiv.remove(), 5000);
    }
};

// Make it globally available
window.AuthManager = AuthManager;
