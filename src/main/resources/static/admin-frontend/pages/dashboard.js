// =========================================
// Dashboard Page Module
// =========================================
const DashboardPage = {
  render() {
    return `
      <div class="dashboard-panel panel-glass animate-slide-in-left active" id="dashboardPanel" style="position:relative; height:100%; overflow-y:auto;">
        <div class="dashboard-panel-header" style="padding: 100px 40px 32px;">
          <div class="dashboard-user">
            <div class="user-avatar">AD</div>
            <div class="user-info">
              <h3>Admin Dashboard</h3>
              <p>Welcome back, <span id="adminNameDisplayDashboard">Admin</span></p>
            </div>
          </div>
        </div>

        <div class="dashboard-panel-body">
          <div class="dashboard-container">
            <!-- Summary Stats -->
            <div class="dashboard-section animate-fade-in-up">
              <div class="section-flex">
                <h3 class="dashboard-section-title">System Overview</h3>
                <span class="live-indicator">
                  <span class="status-dot"></span> Live System
                </span>
              </div>
              <div class="stats-grid">
                <div class="stat-card glass-card">
                  <div class="stat-icon" style="background: rgba(59, 130, 246, 0.1); color: var(--secondary-light);">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="6" width="18" height="12" rx="2"></rect>
                      <circle cx="7" cy="18" r="2"></circle>
                      <circle cx="17" cy="18" r="2"></circle>
                    </svg>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value" id="dashTotalBuses">0</div>
                    <div class="stat-label">Total Registered Buses</div>
                  </div>
                </div>
                <div class="stat-card glass-card">
                  <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--success);">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value" id="dashActiveBuses">0</div>
                    <div class="stat-label">Buses Currently Live</div>
                  </div>
                </div>
                <div class="stat-card glass-card">
                  <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1); color: var(--warning);">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">99.9%</div>
                    <div class="stat-label">System Uptime</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quick Navigation -->
            <div class="dashboard-section animate-fade-in-up-delayed">
              <h3 class="dashboard-section-title">Quick Access & Management</h3>
              <div class="dashboard-menu">
                <a href="#/live-map" class="dash-menu-item glass-card">
                  <span class="dash-menu-icon"
                    style="background: rgba(59, 130, 246, 0.1); color: var(--secondary);">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                      <line x1="8" y1="2" x2="8" y2="18"></line>
                      <line x1="16" y1="6" x2="16" y2="22"></line>
                    </svg>
                  </span>
                  <div class="dash-menu-text">
                    <h4>Live Tracking Map</h4>
                    <p>Real-time fleet monitoring</p>
                  </div>
                </a>
                <a href="#/buses" class="dash-menu-item glass-card">
                  <span class="dash-menu-icon"
                    style="background: rgba(245, 158, 11, 0.1); color: var(--primary);">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="6" width="18" height="12" rx="2"></rect>
                      <circle cx="7" cy="18" r="2"></circle>
                      <circle cx="17" cy="18" r="2"></circle>
                    </svg>
                  </span>
                  <div class="dash-menu-text">
                    <h4>Bus Details</h4>
                    <p>Manage fleet configurations</p>
                  </div>
                </a>
                <a href="#/routes" class="dash-menu-item glass-card">
                  <span class="dash-menu-icon"
                    style="background: rgba(16, 185, 129, 0.1); color: var(--success);">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 18l-2-1-5 2V7l5-2 6 3 5-2v12l-5 2-4-2z"></path>
                      <line x1="9" y1="4" x2="9" y2="19"></line>
                      <line x1="15" y1="5" x2="15" y2="20"></line>
                    </svg>
                  </span>
                  <div class="dash-menu-text">
                    <h4>Routes</h4>
                    <p>Route optimization & paths</p>
                  </div>
                </a>
                <a href="#/feedback" class="dash-menu-item glass-card">
                  <span class="dash-menu-icon"
                    style="background: rgba(239, 68, 68, 0.1); color: var(--danger);">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </span>
                  <div class="dash-menu-text">
                    <h4>Feedback</h4>
                    <p>Student safety & issue logs</p>
                  </div>
                </a>
                <a href="#/export" class="dash-menu-item glass-card">
                  <span class="dash-menu-icon" style="background: rgba(249, 115, 22, 0.1); color: #f97316;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  </span>
                  <div class="dash-menu-text">
                    <h4>Export Reports</h4>
                    <p>Analytical data downloads</p>
                  </div>
                </a>
                <a href="#/profile" class="dash-menu-item glass-card">
                  <span class="dash-menu-icon"
                    style="background: rgba(71, 85, 105, 0.1); color: var(--text-dark);">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </span>
                  <div class="dash-menu-text">
                    <h4>Admin Profile</h4>
                    <p>Account settings & preferences</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  init() {
    // Update dashboard stats
    if (typeof PanelManager !== 'undefined' && PanelManager.updateDashboardStats) {
      PanelManager.updateDashboardStats();
    }
    if (typeof WebSocketManager !== 'undefined' && WebSocketManager.fetchInitialBuses) {
      WebSocketManager.fetchInitialBuses(true);
    }
  }
};

window.DashboardPage = DashboardPage;

// Auto initialize DashboardPage when script is loaded on dashboard.html
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(() => DashboardPage.init(), 50);
} else {
  document.addEventListener('DOMContentLoaded', () => DashboardPage.init());
}
