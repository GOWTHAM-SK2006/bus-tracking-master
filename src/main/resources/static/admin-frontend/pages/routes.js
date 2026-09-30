// =========================================
// Routes Page Module
// =========================================
const RoutesPage = {
  render() {
    return `
      <section class="floating-panel panel-glass animate-fade-in-up visible" id="routesView">
        <div class="panel-container">
          <div class="routes-header-new">
            <h2>Service Routes</h2>
            <p><span id="totalRoutes">0</span> Active Service Paths</p>
          </div>

          <div class="search-wrapper-new">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
             <input type="text" id="routeFilterInput" placeholder="Search routes by name..." />
          </div>
          <div class="routes-list" id="routesListContainer" style="padding: 16px; display: grid; gap: 12px">
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
  }
};

window.RoutesPage = RoutesPage;
