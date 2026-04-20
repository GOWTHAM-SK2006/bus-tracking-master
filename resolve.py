import sys

file_path = "src/main/resources/static/admin-frontend/admin.html"
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
in_conflict = False

replacement = """    <!-- Map Overlays -->
    <div class="map-overlays" id="mapOverlays">
      <!-- Admin Dashboard Panel (Left Side) -->
      <div class="dashboard-panel panel-glass animate-slide-in-left active" id="dashboardPanel">
        <button class="panel-close-btn" id="dashboardCloseBtn" onclick="document.getElementById('dashboardPanel').classList.remove('active');">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="panel-header" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <h2 style="font-size: 1.5rem; color: var(--text-dark); margin: 0; font-weight: 700;">Dashboard</h2>
          <div style="font-size: 0.85rem; color: var(--text-secondary);">Welcome Admin</div>
          <div class="bus-status active" style="margin-top: 4px;">
            <span class="status-dot"></span>
            <span>System Operational</span>
          </div>
        </div>
        <div class="panel-body" style="padding: 16px; overflow-y: auto;">
          <!-- Summary Stats -->
          <div class="dashboard-section">
            <h3 class="dashboard-section-title" style="font-size: 0.9rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Summary Stats</h3>
            <div class="stats-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
              <div class="stat-card" style="background: rgba(241, 245, 249, 0.6); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
                <div class="stat-value" id="dashTotalBuses" style="font-size: 1.5rem; font-weight: 700; color: var(--text-dark);">0</div>
                <div class="stat-label" style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 500;">Total Buses</div>
              </div>
              <div class="stat-card" style="background: rgba(241, 245, 249, 0.6); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
                <div class="stat-value" id="dashActiveBuses" style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">0</div>
                <div class="stat-label" style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 500;">Live Buses</div>
              </div>
              <div class="stat-card" style="background: rgba(241, 245, 249, 0.6); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
                <div class="stat-value" id="dashTotalRoutes" style="font-size: 1.5rem; font-weight: 700; color: var(--text-dark);">0</div>
                <div class="stat-label" style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 500;">Total Routes</div>
              </div>
              <div class="stat-card" style="background: rgba(241, 245, 249, 0.6); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
                <div class="stat-value" id="dashTotalDrivers" style="font-size: 1.5rem; font-weight: 700; color: var(--text-dark);">0</div>
                <div class="stat-label" style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 500;">Active Drivers</div>
              </div>
            </div>
          </div>

          <!-- Quick Links -->
          <div class="dashboard-section">
            <h3 class="dashboard-section-title" style="font-size: 0.9rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Quick Access</h3>
            <div class="dashboard-menu" style="display: flex; flex-direction: column; gap: 10px;">
              <a href="#" class="dash-menu-item" onclick="mobileMenuTabClick('map'); document.getElementById('dashboardPanel').classList.remove('active'); return false;">
                <span class="dash-menu-icon" style="background: rgba(59, 130, 246, 0.1); color: var(--secondary);">📍</span>
                <div class="dash-menu-text">
                  <h4 style="margin: 0; font-size: 0.95rem; color: var(--text-dark);">Live Tracking Map</h4>
                  <p style="margin: 0; font-size: 0.75rem; color: var(--text-secondary);">View real-time locations</p>
                </div>
              </a>
              <a href="#" class="dash-menu-item" onclick="mobileMenuTabClick('buses'); document.getElementById('dashboardPanel').classList.remove('active'); return false;">
                <span class="dash-menu-icon" style="background: rgba(245, 158, 11, 0.1); color: var(--primary);">🚌</span>
                <div class="dash-menu-text">
                  <h4 style="margin: 0; font-size: 0.95rem; color: var(--text-dark);">Bus Details</h4>
                  <p style="margin: 0; font-size: 0.75rem; color: var(--text-secondary);">Manage and view bus status</p>
                </div>
              </a>
              <a href="#" class="dash-menu-item" onclick="mobileMenuTabClick('feedback'); document.getElementById('dashboardPanel').classList.remove('active'); return false;">
                <span class="dash-menu-icon" style="background: rgba(239, 68, 68, 0.1); color: var(--danger);">🔔</span>
                <div class="dash-menu-text">
                  <h4 style="margin: 0; font-size: 0.95rem; color: var(--text-dark);">Notifications</h4>
                  <p style="margin: 0; font-size: 0.75rem; color: var(--text-secondary);">Delay & route alerts</p>
                </div>
              </a>
              <a href="#" class="dash-menu-item" onclick="mobileMenuTabClick('routes'); document.getElementById('dashboardPanel').classList.remove('active'); return false;">
                <span class="dash-menu-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--success);">🗺️</span>
                <div class="dash-menu-text">
                  <h4 style="margin: 0; font-size: 0.95rem; color: var(--text-dark);">Route Management</h4>
                  <p style="margin: 0; font-size: 0.75rem; color: var(--text-secondary);">Manage route assignments</p>
                </div>
              </a>
              <a href="#" class="dash-menu-item" onclick="document.getElementById('busesView').classList.add('active'); if(typeof toggleBusesPanel === 'function') toggleBusesPanel(true); document.getElementById('dashboardPanel').classList.remove('active'); return false;">
                <span class="dash-menu-icon" style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6;">🧑‍✈️</span>
                <div class="dash-menu-text">
                  <h4 style="margin: 0; font-size: 0.95rem; color: var(--text-dark);">Driver Management</h4>
                  <p style="margin: 0; font-size: 0.75rem; color: var(--text-secondary);">Active/inactive tracking</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected Bus Panel (Right Side) -->
      <div class="bus-info-panel panel-glass animate-slide-in-right" id="busInfoPanel">
        <button class="panel-close-btn" id="panelCloseBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="panel-header">
          <div class="bus-badge-large" id="panelBusNo">--</div>
          <div class="bus-details">
            <div class="bus-name-large" id="panelBusName">Select a bus</div>
            <div class="bus-route-label" id="panelBusRoute">Route: --</div>
            <div class="bus-status active">
              <span class="status-dot"></span>
              <span>Active</span>
"""

i = 0
while i < len(lines):
    if "<<<<<<< HEAD" in lines[i]:
        new_lines.append(replacement)
        while i < len(lines) and ">>>>>>>" not in lines[i]:
            i += 1
    else:
        new_lines.append(lines[i])
    i += 1

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)
print("Conflict resolved!")
