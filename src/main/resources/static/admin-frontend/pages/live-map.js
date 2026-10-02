// =========================================
// Live Map Page Module
// =========================================
const LiveMapPage = {
  render() {
    return `
      <!-- Map is persistent in the background, just show the map overlays -->
      <div class="map-overlays" id="mapOverlays">
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
              </div>
            </div>
          </div>
          <div class="panel-body">
            <div class="info-row">
              <span class="info-value" id="panelLocation">--</span>
            </div>
            <div class="info-row">
              <span class="info-label" style="display: inline-flex; align-items: center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg> Driver
              </span>
              <span class="info-value" id="panelDriver">--</span>
            </div>
            <div class="info-row">
              <span class="info-label" style="display: inline-flex; align-items: center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg> Phone
              </span>
              <span class="info-value" id="panelPhone">--</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  init() {
    // Map is persistent and already initialized
    // Just make sure the map container is visible
    const mapBg = document.querySelector('.map-background');
    if (mapBg) mapBg.style.display = 'block';
    
    // Re-bind the panel close button
    document.addEventListener("click", (e) => {
      if (e.target.closest("#panelCloseBtn")) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof MapManager !== 'undefined' && MapManager.closeInfoPanel) {
          MapManager.closeInfoPanel();
        }
      }
    });

    // Resize map to fill properly
    if (typeof MapManager !== 'undefined' && MapManager.map) {
      setTimeout(() => MapManager.map.resize(), 100);
    }

    // Check URL parameters for bus locate requests
    this.checkUrlParamsAndLocate();
  },

  checkUrlParamsAndLocate() {
    const params = new URLSearchParams(window.location.search);
    const targetBusId = params.get('busId') || params.get('locate') || params.get('bus');
    if (!targetBusId) return;

    let attempts = 0;
    const tryLocate = () => {
      attempts++;
      if (typeof MapManager !== 'undefined' && MapManager.map && typeof adminState !== 'undefined' && adminState.buses) {
        let busToSelect = adminState.buses.get(String(targetBusId));
        if (!busToSelect) {
          for (const b of adminState.buses.values()) {
            if (String(b.busNo) === String(targetBusId) || String(b.busId) === String(targetBusId)) {
              busToSelect = b;
              break;
            }
          }
        }
        if (busToSelect) {
          console.log(`[LiveMapPage] Auto-locating bus: ${busToSelect.busId}`);
          MapManager.selectBus(busToSelect.busId);
          return;
        }
      }
      if (attempts < 25) {
        setTimeout(tryLocate, 300);
      }
    };

    setTimeout(tryLocate, 300);
  }
};

window.LiveMapPage = LiveMapPage;

// Auto initialize LiveMapPage if loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(() => LiveMapPage.init(), 100);
} else {
  document.addEventListener('DOMContentLoaded', () => LiveMapPage.init());
}
