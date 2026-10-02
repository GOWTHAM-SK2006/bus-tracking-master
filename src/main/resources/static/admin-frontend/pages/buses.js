// =========================================
// Buses Page - Direct DB Fetch Module
// Fetches all buses directly from /api/bus/all on page load
// No dependency on WebSocketManager or adminState timing
// =========================================

const BusesPage = {
  render() {
    return `
      <section class="floating-panel panel-glass animate-fade-in-up visible" id="busesView">
        <div class="panel-container" style="padding: 28px;">
          
          <!-- Title & Top Actions Banner -->
          <div class="page-title-banner">
            <div class="title-content">
              <div class="title-badge">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <rect x="3" y="6" width="18" height="12" rx="2" />
                  <circle cx="7" cy="18" r="2" />
                  <circle cx="17" cy="18" r="2" />
                </svg>
                Fleet Command
              </div>
              <h2>Registered Buses</h2>
              <p class="header-sub">Manage, filter, and monitor your transport fleet real-time</p>
            </div>
            <div class="header-action-group">
              <button class="btn btn-primary add-bus-btn hover-lift" onclick="AdminBusManager.openAddModal()" style="display: flex; align-items: center; gap: 8px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Add Bus Configuration</span>
              </button>
            </div>
          </div>

          <!-- KPI Metric Summary Cards Grid -->
          <div class="metrics-grid">
            <div class="metric-card glass-card hover-lift">
              <div class="metric-icon-box primary-gradient">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="6" width="18" height="12" rx="2" />
                  <circle cx="7" cy="18" r="2" />
                  <circle cx="17" cy="18" r="2" />
                </svg>
              </div>
              <div class="metric-data">
                <span class="metric-value" id="statTotalFleet">0</span>
                <span class="metric-label">Total Registered Fleet</span>
              </div>
            </div>

            <div class="metric-card glass-card hover-lift">
              <div class="metric-icon-box success-gradient">
                <span class="live-pulse-dot"></span>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
              </div>
              <div class="metric-data">
                <span class="metric-value" id="statLiveCount">0</span>
                <span class="metric-label">Active & Online Now</span>
              </div>
            </div>

            <div class="metric-card glass-card hover-lift">
              <div class="metric-icon-box warning-gradient">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <div class="metric-data">
                <span class="metric-value" id="statOfflineCount">0</span>
                <span class="metric-label">Offline / Stationary</span>
              </div>
            </div>
          </div>

          <!-- Table Controls Bar -->
          <div class="table-controls-bar glass-card">
            <div class="search-input-wrapper">
               <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
               <input type="text" placeholder="Search by bus number, driver name, or route..." id="busFilterInput" />
            </div>
            <div class="filter-pills-container">
              <button class="filter-pill active" onclick="BusManager && BusManager.filterByStatus('all', this)">All Fleet</button>
              <button class="filter-pill online-pill" onclick="BusManager && BusManager.filterByStatus('online', this)">
                <span class="dot-online"></span> Online
              </button>
              <button class="filter-pill offline-pill" onclick="BusManager && BusManager.filterByStatus('offline', this)">
                <span class="dot-offline"></span> Offline
              </button>
            </div>
          </div>

          <!-- Buses Table Container -->
          <div class="buses-table-container glass-card">
            <table class="buses-table">
              <thead>
                <tr>
                  <th>Bus No</th>
                  <th>Driver Name</th>
                  <th>Route / Destination</th>
                  <th>Status</th>
                  <th style="text-align: right; padding-right: 28px;">Action</th>
                </tr>
              </thead>
              <tbody id="busesTableBody">
                <!-- Buses will be populated here -->
              </tbody>
            </table>
          </div>

        </div>
      </section>
    `;
  },

  init() {
    // Re-initialize BusManager filter
    const filterInput = document.getElementById('busFilterInput');
    if (filterInput) {
      filterInput.addEventListener('input', (e) => {
        if (typeof BusManager !== 'undefined') {
          BusManager.filterBuses(e.target.value);
        }
      });
    }

    // Always do a direct fetch regardless of WebSocket/adminState state
    BusesPage.fetchAndRenderBuses();
  },

  /**
   * Direct fetch of all buses from the database.
   * Uses /api/bus/all - no dependency on WebSocketManager or adminState.
   * Has timeout + auto-retry to handle Railway cold starts.
   */
  async fetchAndRenderBuses(attempt = 1) {
    const tbody = document.getElementById('busesTableBody');
    const totalEl = document.getElementById('totalBuses');
    const MAX_ATTEMPTS = 5;
    const RETRY_DELAY_MS = 8000;

    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 30px; color: #888;">
            <div style="font-size:1.5rem; margin-bottom:8px;">🔄</div>
            ${attempt === 1
              ? 'Loading buses...'
              : `Server is waking up... (attempt ${attempt}/${MAX_ATTEMPTS})`}
          </td>
        </tr>`;
    }

    try {
      // Detect base URL (same logic used elsewhere in the app)
      function getBase() {
        const host = window.location.hostname;
        const protocol = window.location.protocol;
        const port = window.location.port;
        if (window.Capacitor && window.Capacitor.isNativePlatform())
          return 'https://bus-tracking-master-production-2d22.up.railway.app';
        if (protocol === 'file:')
          return 'https://bus-tracking-master-production-2d22.up.railway.app';
        if (host.includes('.devtunnels.ms')) {
          const m = host.match(/^([^-]+)-\d+\.(.+)$/);
          if (m) return `${protocol}//${m[1]}-8080.${m[2]}`;
        }
        if (port && port !== '80' && port !== '443')
          return `${protocol}//${host}:${port}`;
        return `${protocol}//${host}`;
      }

      const baseUrl = (typeof getApiBaseUrl === 'function') ? getApiBaseUrl() : getBase();
      const url = `${baseUrl}/api/bus/all?t=${Date.now()}`;

      console.log(`[BusesPage] Fetching buses from: ${url} (attempt ${attempt})`);

      // Use AbortController for a 12-second timeout per attempt
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      let response;
      try {
        response = await fetch(url, { cache: 'no-store', signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const buses = await response.json();
      console.log(`[BusesPage] Fetched ${buses.length} buses from DB`);

      // Sync into adminState/BusManager if available (updates map markers, stats, etc.)
      if (typeof BusManager !== 'undefined' && BusManager.handleBusData) {
        BusManager.handleBusData(buses, true);
        // BusManager.handleBusData calls renderBusesTable() internally
        // but it reads DOM.totalBuses — update it explicitly too
        if (totalEl) totalEl.textContent = buses.length;
        return;
      }

      // Fallback: render directly if BusManager not available
      BusesPage.renderTable(buses);

    } catch (err) {
      const isTimeout = err.name === 'AbortError';
      console.warn(`[BusesPage] Fetch attempt ${attempt} failed (${isTimeout ? 'timeout' : err.message})`);

      if (attempt < MAX_ATTEMPTS) {
        // Show retry countdown
        if (tbody) {
          tbody.innerHTML = `
            <tr>
              <td colspan="5" style="text-align: center; padding: 30px; color: #888;">
                <div style="font-size:1.5rem; margin-bottom:8px;">⏳</div>
                Server is starting up — retrying in ${RETRY_DELAY_MS / 1000}s...
                (attempt ${attempt}/${MAX_ATTEMPTS})
              </td>
            </tr>`;
        }
        setTimeout(() => BusesPage.fetchAndRenderBuses(attempt + 1), RETRY_DELAY_MS);
      } else {
        // All attempts exhausted
        console.error('[BusesPage] All fetch attempts failed.');
        if (tbody) {
          tbody.innerHTML = `
            <tr>
              <td colspan="5" style="text-align: center; padding: 30px; color: #e53e3e;">
                ⚠️ Failed to load buses after ${MAX_ATTEMPTS} attempts. 
                <button onclick="BusesPage.fetchAndRenderBuses(1)" 
                  style="margin-left:8px; padding:4px 12px; background:var(--primary,#f97316); color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:600;">
                  Retry
                </button>
              </td>
            </tr>`;
        }
      }
    }
  },

  /**
   * Fallback renderer if BusManager is not available
   */
  renderTable(buses) {
    const tbody = document.getElementById('busesTableBody');
    const totalEl = document.getElementById('totalBuses');
    const statTotalFleet = document.getElementById('statTotalFleet');
    const statLiveCount = document.getElementById('statLiveCount');
    const statOfflineCount = document.getElementById('statOfflineCount');

    const total = buses ? buses.length : 0;
    const online = buses ? buses.filter(b => b.status && (b.status.toUpperCase() === 'RUNNING' || b.status.toUpperCase() === 'GPS_ACTIVE')).length : 0;
    const offline = Math.max(0, total - online);

    if (totalEl) totalEl.textContent = total;
    if (statTotalFleet) statTotalFleet.textContent = total;
    if (statLiveCount) statLiveCount.textContent = online;
    if (statOfflineCount) statOfflineCount.textContent = offline;

    if (!tbody) return;

    if (!buses || buses.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 30px; color: #999;">
            No buses found
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = buses.map(bus => {
      const busNo    = bus.busNumber || bus.busNo || bus.busId || '—';
      const driver   = bus.driverName || 'Unassigned';
      const phone    = bus.driverPhone || '';
      const route    = bus.busName || bus.routeName || `Route ${busNo}`;
      const isActive = bus.status && (bus.status.toUpperCase() === 'RUNNING' || bus.status.toUpperCase() === 'GPS_ACTIVE');
      const driverId = bus.driverId || '';

      return `
        <tr>
          <td data-label="Bus No"><span class="bus-number-badge">${busNo}</span></td>
          <td data-label="Driver" style="font-weight: 500;">${driver}</td>
          <td data-label="Route" style="color: var(--text-secondary);">${route}</td>
          <td data-label="Status">
            <span class="status-badge ${isActive ? 'active' : 'inactive'}">
              ${isActive ? 'Online' : 'Offline'}
            </span>
          </td>
          <td data-label="Action">
            <div class="table-actions">
              <button class="action-btn locate"
                onclick="event.stopPropagation(); window.location.href='live-map.html?busId=${encodeURIComponent(busNo)}';">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Locate
              </button>
              <button class="action-btn info"
                onclick="event.stopPropagation(); AdminBusManager && AdminBusManager.openBusDetailsModal('${busNo}', '${driverId}', '${driver.replace(/'/g, "\\'")}', '${phone.replace(/'/g, "\\'")}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                Details
              </button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }
};

window.BusesPage = BusesPage;

// Auto initialize BusesPage when script is loaded on buses.html
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(() => BusesPage.init(), 100);
} else {
  document.addEventListener('DOMContentLoaded', () => BusesPage.init());
}
