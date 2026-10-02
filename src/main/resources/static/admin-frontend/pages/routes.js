// =========================================
// Routes Page Module
// =========================================
const RoutesPage = {
  render() {
    return `
      <section class="floating-panel panel-glass animate-fade-in-up visible" id="routesView">
        <div class="panel-container">
          <!-- Header Banner -->
          <div class="routes-page-banner">
            <div class="banner-left">
              <h2><span class="gradient-text">Service Routes Overview</span></h2>
              <p class="banner-subtitle">Real-time network map, active routes & vehicle allocation</p>
            </div>
            <div class="banner-right">
              <span class="live-pulse-badge"><span class="pulse-dot"></span> Dynamic Tracking Active</span>
            </div>
          </div>

          <!-- Stats KPI Row -->
          <div class="routes-stats-row">
            <div class="stat-card-new">
              <div class="stat-icon-wrapper bg-gradient-orange">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 18l-2-1-5 2V7l5-2 6 3 5-2v12l-5 2-4-2z"></path><line x1="9" y1="4" x2="9" y2="19"></line><line x1="15" y1="5" x2="15" y2="20"></line></svg>
              </div>
              <div class="stat-info-new">
                <span class="stat-label-new">Active Routes</span>
                <h3 class="stat-value-new" id="statActiveRoutes">0</h3>
                <span class="stat-trend-new positive">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg> Network Paths
                </span>
              </div>
            </div>

            <div class="stat-card-new">
              <div class="stat-icon-wrapper bg-gradient-blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="6" width="18" height="12" rx="2"></rect><circle cx="7" cy="18" r="2"></circle><circle cx="17" cy="18" r="2"></circle></svg>
              </div>
              <div class="stat-info-new">
                <span class="stat-label-new">Assigned Vehicles</span>
                <h3 class="stat-value-new" id="statAssignedBuses">0</h3>
                <span class="stat-trend-new positive">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg> Fleet Operational
                </span>
              </div>
            </div>

            <div class="stat-card-new">
              <div class="stat-icon-wrapper bg-gradient-purple">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <div class="stat-info-new">
                <span class="stat-label-new">Avg Fleet / Route</span>
                <h3 class="stat-value-new" id="statAvgBuses">0.0</h3>
                <span class="stat-trend-new neutral">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg> Coverage Density
                </span>
              </div>
            </div>
          </div>

          <!-- Search & Filter Bar -->
          <div class="routes-action-bar">
            <div class="search-wrapper-new glow-focus">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" id="routeFilterInput" placeholder="Search routes by origin, destination or name..." />
            </div>
            <div class="routes-counter-badge">
              <span id="totalRoutes">0</span> Active Paths
            </div>
          </div>

          <!-- Routes Grid Container -->
          <div class="routes-grid-new" id="routesListContainer">
            <!-- Routes will be populated here -->
          </div>
        </div>
      </section>

      <!-- Route Details Panel (Filtered Buses) -->
      <section class="floating-panel panel-glass animate-fade-in-up" id="routeDetailsView">
        <div class="panel-container">
          <div class="list-header" style="align-items: center">
            <button class="back-btn" id="routeDetailsBackBtn" style="
                  background: none;
                  border: none;
                  color: var(--text-secondary);
                  cursor: pointer;
                  padding: 8px;
                  margin-right: 8px;
                  display: flex;
                  align-items: center;
                ">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <div style="display: flex; flex-direction: column; gap: 4px">
              <h2 id="routeDetailsTitle">Route Name</h2>
              <span class="list-count" id="routeDetailsCount">0 buses</span>
            </div>
            <button class="close-panel-btn" onclick="document.getElementById('routeDetailsView').classList.remove('visible'); document.getElementById('routesView').classList.add('visible');">
              &times;
            </button>
          </div>
          <div class="buses-table-container">
            <table class="buses-table">
              <thead>
                <tr>
                  <th>Bus No</th>
                  <th>Driver</th>
                  <th>Route</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="routeBusesTableBody">
                <!-- Filtered buses will be populated here -->
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  },

  init() {
    // Initialize route filter input
    const input = document.getElementById("routeFilterInput");
    if (input) {
      input.addEventListener("input", () => {
        if (typeof RouteManager !== 'undefined') {
          RouteManager.renderRoutes(input.value);
        }
      });
    }

    // Back button in route details
    const backBtn = document.getElementById("routeDetailsBackBtn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        const rdp = document.getElementById("routeDetailsView");
        if (rdp) rdp.classList.remove("visible");
        const rp = document.getElementById("routesView");
        if (rp) rp.classList.add("visible");
      });
    }

    // Render routes
    if (typeof RouteManager !== 'undefined') {
      RouteManager.renderRoutes();
    }
    if (typeof WebSocketManager !== 'undefined' && WebSocketManager.fetchInitialBuses) {
      WebSocketManager.fetchInitialBuses(true);
    }
  }
};

window.RoutesPage = RoutesPage;

// Auto initialize RoutesPage when script is loaded on routes.html
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(() => RoutesPage.init(), 50);
} else {
  document.addEventListener('DOMContentLoaded', () => RoutesPage.init());
}
