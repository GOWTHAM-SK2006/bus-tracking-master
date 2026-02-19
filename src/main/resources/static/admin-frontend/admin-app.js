// =========================================
// Global Error & Status Handling (Debug)
// =========================================
window.onerror = function (msg, url, lineNo, columnNo, error) {
  const errorMsg = `[CRITICAL ERROR] ${msg} at line ${lineNo}`;
  console.error(errorMsg, error);
  updateDebugStatus(errorMsg, "error");
  return false;
};

function updateDebugStatus(message, type = "info") {
  let debugBar = document.getElementById("debug-trace-bar");
  if (!debugBar) {
    debugBar = document.createElement("div");
    debugBar.id = "debug-trace-bar";
    debugBar.style =
      "position:fixed; top:0; left:50%; transform:translateX(-50%); z-index:10000; background:rgba(0,0,0,0.8); color:white; padding:4px 12px; font-size:11px; font-family:monospace; border-radius:0 0 8px 8px; pointer-events:none; transition: all 0.3s;";
    document.body.appendChild(debugBar);
  }
  debugBar.textContent = message;
  if (type === "error") debugBar.style.background = "#F44336";
  else if (type === "success") debugBar.style.background = "#4CAF50";
}

updateDebugStatus("System: Initializing...");

// =========================================
// Configuration
// =========================================
function getWebSocketUrl(endpoint) {
  const host = window.location.hostname;
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const port = window.location.port;

  // Capacitor Support: Default to production URL
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    return `wss://bus-tracking-master-production.up.railway.app${endpoint}`;
  }

  if (host.includes(".devtunnels.ms")) {
    const tunnelMatch = host.match(/^([^-]+)-\d+\.(.+)$/);
    if (tunnelMatch)
      return `${protocol}//${tunnelMatch[1]}-8080.${tunnelMatch[2]}${endpoint}`;
  }

  // In production (port 80/443), window.location.port is often empty
  if (port && port !== "80" && port !== "443") {
    return `${protocol}//${host}:${port}${endpoint}`;
  }

  // For production or default ports
  return `${protocol}//${host}${endpoint}`;
}

const CONFIG = {
  WS_URL: (() => {
    const url = getWebSocketUrl("/ws/admin");
    console.log("[CONFIG] Admin WS_URL:", url);
    return url;
  })(),
  // MapTiler Configuration
  MAPTILER_API_KEY: "qT5xViuAuUmEXe01G0oI",
  MAPTILER_STYLE_URL:
    "https://api.maptiler.com/maps/019bfffb-7613-7306-82a6-88f9659c6bff/style.json",
  // Map defaults: store as [lng, lat]
  MAP_CENTER: [80.2707, 13.0827],
  MAP_ZOOM: 12,
  MAP_MIN_ZOOM: 10,
  MAP_MAX_ZOOM: 18,
  RECONNECT_TIMEOUT: 5000,
  RECONNECT_MAX_ATTEMPTS: 10,
};

// =========================================
// State
// =========================================
const adminState = {
  buses: new Map(),
  selectedBusId: null,
  isConnected: false,
  activePanel: null, // 'buses' or 'export' or null
  isInitialized: false,
};

// =========================================
// DOM Elements (Lazy getters to prevent null errors)
// =========================================
const DOM = {
  // Header
  get connectionBadge() {
    return document.getElementById("connectionBadge");
  },
  get adminNameDisplay() {
    return document.getElementById("adminNameDisplay");
  },

  // Navigation
  get tabBtns() {
    return document.querySelectorAll(".bottom-nav-btn");
  },

  // Panels
  get dashboardPanel() {
    return document.getElementById("dashboardView");
  },
  get busesPanel() {
    return document.getElementById("busesView");
  },
  get exportPanel() {
    return document.getElementById("exportView");
  },
  get closePanelBtns() {
    return document.querySelectorAll(".close-panel-btn");
  },

  // Map
  get mapContainer() {
    return document.getElementById("map");
  },
  get activeBusCount() {
    return document.getElementById("activeBusCount");
  },

  // Bus Info Panel (Right Side)
  get busInfoPanel() {
    return document.getElementById("busInfoPanel");
  },
  get panelCloseBtn() {
    return document.getElementById("panelCloseBtn");
  },
  get panelBusNo() {
    return document.getElementById("panelBusNo");
  },
  get panelBusName() {
    return document.getElementById("panelBusName");
  },
  get panelBusRoute() {
    return document.getElementById("panelBusRoute");
  },
  get panelLocation() {
    return document.getElementById("panelLocation");
  },
  get panelDriver() {
    return document.getElementById("panelDriver");
  },
  get panelPhone() {
    return document.getElementById("panelPhone");
  },

  // Buses Table
  get busesTableBody() {
    return document.getElementById("busesTableBody");
  },
  get busFilterInput() {
    return document.getElementById("busFilterInput");
  },
  get totalBuses() {
    return document.getElementById("totalBuses");
  },

  // Account Creation
  get accountToggleBtn() {
    return document.getElementById("accountToggleBtn");
  },
  get toggleSlider() {
    return document.querySelector("#accountToggleBtn .toggle-slider");
  },

  // Driver Sign In
  get driverSignInToggleBtn() {
    return document.getElementById("driverSignInToggleBtn");
  },
  get driverSignInSlider() {
    return document.getElementById("driverSignInSlider");
  },

  // Student Sign In
  get studentSignInToggleBtn() {
    return document.getElementById("studentSignInToggleBtn");
  },
  get studentSignInSlider() {
    return document.getElementById("studentSignInSlider");
  },

  // Toast
  get toastContainer() {
    return document.getElementById("toastContainer");
  },
};

// =========================================
// Mobile Menu Manager
// =========================================
const MobileMenuManager = {
  init() {
    const btn = document.getElementById("mobileMenuBtn");
    const header = document.querySelector(".admin-header");
    if (!btn || !header) return;

    // Toggle menu
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      header.classList.toggle("menu-open");
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (
        header.classList.contains("menu-open") &&
        !header.contains(e.target)
      ) {
        header.classList.remove("menu-open");
      }
    });

    // Close when a tab is clicked
    const tabs = document.querySelectorAll(".bottom-nav-btn");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        header.classList.remove("menu-open");
      });
    });

    console.log("[MobileMenu] Initialized");
  },
};

// =========================================
// Panel Manager (Replaces TabManager)
// =========================================
const PanelManager = {
  init() {
    DOM.tabBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const target = btn.dataset.tab;
        if (target === "map") {
          this.closeAllPanels();
        } else if (target === "dashboard") {
          this.togglePanel("dashboard");
        } else if (target === "buses") {
          this.togglePanel("buses");
        } else if (target === "export") {
          this.togglePanel("export");
        }
      });
    });

    DOM.closePanelBtns.forEach((btn) => {
      btn.addEventListener("click", () => this.closeAllPanels());
    });
  },

  togglePanel(panelName) {
    console.log(`[Panel] Toggling: ${panelName}`);
    // If clicking the same panel, close it
    if (adminState.activePanel === panelName) {
      this.closeAllPanels();
      return;
    }

    // Close others first
    this.closeAllPanels();

    // Open target
    if (panelName === "dashboard" && DOM.dashboardPanel) {
      DOM.dashboardPanel.classList.add("visible");
      this.updateActiveTab("dashboard");
    } else if (panelName === "buses" && DOM.busesPanel) {
      DOM.busesPanel.classList.add("visible");
      this.updateActiveTab("buses");
    } else if (panelName === "export" && DOM.exportPanel) {
      DOM.exportPanel.classList.add("visible");
      this.updateActiveTab("export");
    }

    adminState.activePanel = panelName;
  },

  closeAllPanels() {
    const bp = DOM.busesPanel;
    const ep = DOM.exportPanel;
    const dp = DOM.dashboardPanel;
    if (bp) bp.classList.remove("visible");
    if (ep) ep.classList.remove("visible");
    if (dp) dp.classList.remove("visible");

    // Also close the right-side info panel if MapManager is initialized
    if (typeof MapManager !== "undefined" && MapManager.closeInfoPanel) {
      MapManager.closeInfoPanel();
    }

    adminState.activePanel = null;
    this.updateActiveTab("map");
  },

  updateActiveTab(tabName) {
    DOM.tabBtns.forEach((btn) => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  },
};

// =========================================
// Map Manager
// =========================================
var MapManager = {
  map: null,
  markers: new Map(),
  isNavigating: false,
  navTimeout: null,
  lockTimeout: null,

  init() {
    console.log("[Map] Initializing MapTiler SDK...");

    // MapTiler SDK Initialization
    maptilersdk.config.apiKey = CONFIG.MAPTILER_API_KEY;

    this.map = new maptilersdk.Map({
      container: DOM.mapContainer,
      style: CONFIG.MAPTILER_STYLE_URL,
      center: CONFIG.MAP_CENTER, // [lng, lat]
      zoom: CONFIG.MAP_ZOOM,
      minZoom: CONFIG.MAP_MIN_ZOOM,
      maxZoom: CONFIG.MAP_MAX_ZOOM,
    });

    // Add navigation controls
    this.map.addControl(new maptilersdk.NavigationControl(), "top-right");

    console.log("[Map] MapTiler SDK Map Initialized");
    this.map.resize();

    // Delegated listener for panel close button (more robust)
    document.addEventListener("click", (e) => {
      if (e.target.closest("#panelCloseBtn")) {
        console.log("[Map] Panel close button clicked (delegated)");
        e.preventDefault();
        e.stopPropagation();
        this.closeInfoPanel();
      }
    });
  },

  updateBusMarker(bus) {
    const busId = String(bus.busId || bus.busNo);
    const isSelected = String(adminState.selectedBusId) === busId;
    const isGpsOn = bus.gpsOn;

    const latitude = parseFloat(bus.latitude);
    const longitude = parseFloat(bus.longitude);

    if (
      isNaN(latitude) ||
      isNaN(longitude) ||
      (latitude === 0 && longitude === 0)
    ) {
      return;
    }

    let marker = this.markers.get(busId);

    if (!marker) {
      // Create HTML element for marker
      const el = document.createElement("div");
      el.className = "custom-bus-marker-container";
      el.innerHTML = this.createMarkerHTML(bus, isSelected);

      // Create MapTiler marker
      marker = new maptilersdk.Marker({ element: el })
        .setLngLat([longitude, latitude])
        .addTo(this.map);

      // Add click handler
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        this.selectBus(busId);
      });

      marker.currentIsSelected = isSelected;
      marker.busData = bus;
      marker.prevGpsOn = isGpsOn;
      this.markers.set(busId, marker);
    } else {
      // Update marker if state changed
      if (
        marker.currentIsSelected !== isSelected ||
        marker.prevGpsOn !== isGpsOn
      ) {
        const el = marker.getElement();
        el.innerHTML = this.createMarkerHTML(bus, isSelected);
        marker.currentIsSelected = isSelected;
        marker.prevGpsOn = isGpsOn;
      }
      marker.busData = bus;
    }

    const currentPos = marker.getLngLat();
    const distance = Math.sqrt(
      Math.pow((currentPos.lng - longitude) * 111320, 2) +
        Math.pow((currentPos.lat - latitude) * 110540, 2),
    );

    if (distance > 5) {
      marker.setLngLat([longitude, latitude]);

      if (isSelected && !this.isNavigating) {
        this.map.panTo([longitude, latitude], { duration: 1000 });
      }
    }
  },

  createMarkerHTML(bus, isSelected) {
    const statusClass = bus.gpsOn ? "status-active" : "status-inactive";
    const selectedClass = isSelected ? "selected" : "";
    return `
            <div class="bus-marker-container ${statusClass} ${selectedClass}" style="position: relative; width: 100%; height: 100%;">
                <div class="marker-pulse"></div>
                <div class="bus-icon-container">
                    <svg viewBox="0 0 24 24" class="bus-svg">
                        <path fill="currentColor" d="M18,11H6V6H18M16.5,17A1.5,1.5 0 0,1 15,15.5A1.5,1.5 0 0,1 16.5,14A1.5,1.5 0 0,1 18,15.5A1.5,1.5 0 0,1 16.5,17M7.5,17A1.5,1.5 0 0,1 6,15.5A1.5,1.5 0 0,1 7.5,14A1.5,1.5 0 0,1 9,15.5A1.5,1.5 0 0,1 7.5,17M4,16C4,16.88 4.39,17.67 5,18.22V20A1,1 0 0,0 6,21H7A1,1 0 0,0 8,20V19H16V20A1,1 0 0,0 17,21H18A1,1 0 0,0 19,20V18.22C19.61,17.67 20,16.88 20,16V6C20,1.5 16,2 12,2C8,2 4,1.5 4,6V16Z" />
                    </svg>
                    <div class="bus-number-overlay">${bus.busNo}</div>
                </div>
                <div class="marker-tooltip">
                    <strong>Bus ${bus.busNo}</strong>
                    <span class="status-text">${bus.gpsOn ? "Live" : "Last Seen"}</span>
                </div>
            </div>
        `;
  },

  async selectBus(busId) {
    if (!busId) return;
    const id = String(busId);

    // 1. Identify Target Data
    const bus = adminState.buses.get(id);
    if (!bus) return;

    // 2. Deselect previous
    if (adminState.selectedBusId) {
      const prevBus = adminState.buses.get(adminState.selectedBusId);
      if (prevBus) {
        const prevMarker = this.markers.get(adminState.selectedBusId);
        if (prevMarker) {
          prevMarker.currentIsSelected = false;
          this.updateBusMarker(prevBus); // Re-render to remove selection style
        }
      }
    }

    adminState.selectedBusId = id;

    // 3. Update new selection
    const marker = this.markers.get(id);
    if (marker) {
      marker.currentIsSelected = true;
      this.updateBusMarker(bus);
    }

    this.updateInfoPanel(bus);
    this.showInfoPanel();

    // 4. Fly to location
    if (bus.latitude && bus.longitude && Math.abs(bus.latitude) > 0.0001) {
      this.isNavigating = true;
      this.map.resize();
      this.map.flyTo({
        center: [bus.longitude, bus.latitude],
        zoom: 16.5,
        duration: 2000,
      });

      if (this.lockTimeout) clearTimeout(this.lockTimeout);
      this.lockTimeout = setTimeout(() => {
        this.isNavigating = false;
      }, 2100);
    }
  },

  updateInfoPanel(bus) {
    DOM.panelBusNo.textContent = bus.busNo;
    DOM.panelBusName.textContent = bus.busName || `Bus ${bus.busNo}`;
    DOM.panelBusRoute.textContent = `Route: ${bus.routeName || "Unknown"}`;
    DOM.panelLocation.textContent =
      bus.address || `${bus.latitude.toFixed(6)}, ${bus.longitude.toFixed(6)}`;
    DOM.panelDriver.textContent = bus.driverName || "Unknown";
    DOM.panelPhone.textContent = bus.driverPhone || "N/A";

    const statusEl = DOM.busInfoPanel.querySelector(".bus-status");
    if (statusEl) {
      if (bus.gpsOn) {
        statusEl.style.color = "var(--success)";
        statusEl.innerHTML =
          '<span class="status-dot" style="background: var(--success)"></span>Live Now';
      } else {
        statusEl.style.color = "var(--danger)";
        statusEl.innerHTML =
          '<span class="status-dot" style="background: var(--danger)"></span>Offline';
      }
    }
  },

  showInfoPanel() {
    DOM.busInfoPanel.classList.add("visible");
  },

  closeInfoPanel() {
    console.log("[Map] Closing Info Panel");
    if (DOM.busInfoPanel) {
      DOM.busInfoPanel.classList.remove("visible");
    }
    const prevId = adminState.selectedBusId;
    adminState.selectedBusId = null;
    if (prevId) {
      const bus = adminState.buses.get(prevId);
      if (bus) this.updateBusMarker(bus);
    }

    if (this.lockTimeout) clearTimeout(this.lockTimeout);
    this.isNavigating = false;
  },
};

// =========================================
// Route Definitions (Static)
// =========================================
const ROUTE_DEFINITIONS = {
  12: [
    "Central Station",
    "Egmore",
    "Kilpauk",
    "Anna Nagar",
    "Koyambedu",
    "College",
  ],
  45: [
    "Tambaram",
    "Chromepet",
    "Pallavaram",
    "Guindy",
    "Ashok Pillar",
    "College",
  ],
  21: [
    "Adyar",
    "Thiruvanmiyur",
    "ECR",
    "Sholinganallur",
    "Medavakkam",
    "College",
  ],
  56: ["Velachery", "Madipakkam", "Keelkattalai", "Pallavaram", "College"],
};

// =========================================
// Dashboard Manager
// =========================================
const DashboardManager = {
  selectedBusId: null,
  busUpdateCounts: new Map(), // Track update counts per bus

  init() {
    const searchInput = document.getElementById("dashboardBusSearch");
    const dropdown = document.getElementById("dashboardBusDropdown");
    if (!searchInput || !dropdown) return;

    // Handle search input
    searchInput.addEventListener("input", (e) => {
      this.filterBuses(e.target.value);
    });

    // Handle focus - show all buses
    searchInput.addEventListener("focus", () => {
      this.filterBuses(searchInput.value);
    });

    // Handle click outside to close dropdown
    document.addEventListener("click", (e) => {
      if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });
  },

  populateBusSelector() {
    // This will be called when buses are updated
    // If search is active, re-filter
    const searchInput = document.getElementById("dashboardBusSearch");
    if (searchInput && searchInput === document.activeElement) {
      this.filterBuses(searchInput.value);
    }
  },

  filterBuses(searchTerm) {
    const dropdown = document.getElementById("dashboardBusDropdown");
    if (!dropdown) return;

    const buses = Array.from(adminState.buses.values());
    const term = searchTerm.toLowerCase().trim();

    // Filter buses based on search term
    const filteredBuses = buses.filter((bus) => {
      const busNo = bus.busNo.toLowerCase();
      const routeName = bus.routeName.toLowerCase();
      return busNo.includes(term) || routeName.includes(term);
    });

    // Clear dropdown
    dropdown.innerHTML = "";

    if (filteredBuses.length === 0) {
      dropdown.innerHTML =
        '<div style="padding: 12px; text-align: center; color: #999;">No buses found</div>';
      dropdown.style.display = "block";
      return;
    }

    // Populate dropdown with filtered results
    filteredBuses.forEach((bus) => {
      const item = document.createElement("div");
      item.style.cssText =
        "padding: 10px 12px; cursor: pointer; border-bottom: 1px solid #f0f0f0; transition: background 0.2s;";
      item.innerHTML = `
                <div style="font-weight: 600; color: #333;">Bus ${bus.busNo}</div>
                <div style="font-size: 12px; color: #666;">${bus.routeName}</div>
            `;

      // Hover effect
      item.addEventListener("mouseenter", () => {
        item.style.background = "#f8f9fa";
      });
      item.addEventListener("mouseleave", () => {
        item.style.background = "white";
      });

      // Click to select
      item.addEventListener("click", () => {
        this.selectBus(bus.busId);
        document.getElementById("dashboardBusSearch").value =
          `Bus ${bus.busNo} - ${bus.routeName}`;
        dropdown.style.display = "none";
      });

      dropdown.appendChild(item);
    });

    dropdown.style.display = "block";
  },

  selectBus(busId) {
    if (!busId) {
      this.hideDashboard();
      return;
    }

    this.selectedBusId = busId;
    const bus = adminState.buses.get(busId);

    if (!bus) {
      this.hideDashboard();
      return;
    }

    this.showDashboard();
    this.updateDashboard(bus);
  },

  showDashboard() {
    const container = document.getElementById("dashboardDataContainer");
    if (container) container.style.display = "block";
  },

  hideDashboard() {
    const container = document.getElementById("dashboardDataContainer");
    if (container) container.style.display = "none";
    this.selectedBusId = null;
  },

  updateDashboard(bus) {
    if (!bus) return;

    // Bus Info Header
    const busNumber = document.getElementById("dashBusNumber");
    const busRoute = document.getElementById("dashBusRoute");
    if (busNumber) busNumber.textContent = `Bus ${bus.busNo}`;
    if (busRoute) busRoute.textContent = `Route: ${bus.routeName}`;

    // GPS Status
    const gpsStatus = document.getElementById("dashGpsStatus");
    if (gpsStatus) {
      gpsStatus.textContent = bus.gpsOn ? "Active" : "Inactive";
      gpsStatus.style.color = bus.gpsOn ? "#4CAF50" : "#f44336";
    }

    // Tracking Status
    const trackingStatus = document.getElementById("dashTrackingStatus");
    if (trackingStatus) {
      trackingStatus.textContent = bus.gpsOn ? "Running" : "Stopped";
      trackingStatus.style.color = bus.gpsOn ? "#2196F3" : "#999";
    }

    // GPS Coordinates
    const latitude = document.getElementById("dashLatitude");
    const longitude = document.getElementById("dashLongitude");
    const accuracy = document.getElementById("dashAccuracy");

    if (latitude && bus.latitude) {
      latitude.textContent = bus.latitude.toFixed(6);
    }
    if (longitude && bus.longitude) {
      longitude.textContent = bus.longitude.toFixed(6);
    }
    if (accuracy && bus.accuracy) {
      accuracy.textContent = `±${Math.round(bus.accuracy)}m`;
    } else if (accuracy) {
      accuracy.textContent = "N/A";
    }

    // Updates Sent Counter
    const updatesSent = document.getElementById("dashUpdatesSent");
    if (updatesSent) {
      const count = this.busUpdateCounts.get(bus.busId) || 0;
      updatesSent.textContent = count;
    }

    // Last Update
    const lastUpdate = document.getElementById("dashLastUpdate");
    if (lastUpdate && bus.lastUpdate) {
      const date = new Date(bus.lastUpdate);
      lastUpdate.textContent = date.toLocaleTimeString();
    }

    // Driver Info
    const driverName = document.getElementById("dashDriverName");
    const driverPhone = document.getElementById("dashDriverPhone");
    if (driverName) driverName.textContent = bus.driverName || "--";
    if (driverPhone) driverPhone.textContent = bus.driverPhone || "--";
  },

  handleBusUpdate(bus) {
    // Increment update counter for this bus
    const currentCount = this.busUpdateCounts.get(bus.busId) || 0;
    this.busUpdateCounts.set(bus.busId, currentCount + 1);

    // Update dashboard if this bus is selected
    if (this.selectedBusId === bus.busId) {
      this.updateDashboard(bus);
    }
  },
};

// =========================================
// Bus Manager
// =========================================
const BusManager = {
  init() {
    DOM.busFilterInput?.addEventListener("input", (e) => {
      this.filterBuses(e.target.value);
    });
  },

  handleBusData(buses) {
    if (!buses) return;

    const mappedBuses = buses.map((bus) => ({
      busId: String(bus.busNumber || bus.busId),
      busNo: bus.busNumber || bus.busNo,
      busName: "College Bus " + (bus.busNumber || bus.busNo),
      // Robust route name detection matching client
      routeName:
        bus.busName ||
        bus.route ||
        bus.busRoute ||
        bus.routePath ||
        `Route ${bus.busNumber || bus.busNo}`,
      latitude: bus.latitude,
      longitude: bus.longitude,
      status: bus.status,
      gpsOn:
        bus.status &&
        (bus.status.toUpperCase() === "RUNNING" ||
          bus.status.toUpperCase() === "GPS_ACTIVE"),
      // Use static route logic for parity, though currently just stored
      stops:
        ROUTE_DEFINITIONS[bus.busNumber || bus.busNo] ||
        (bus.busStop ? [bus.busStop] : bus.stops || []),
      driverName: bus.driverName || "Unknown",
      driverPhone: bus.driverPhone || "N/A",
      address: bus.address, // Preserve if available
      lastUpdate: bus.lastUpdate || new Date().toISOString(),
    }));

    let activeCount = 0;
    mappedBuses.forEach((bus) => {
      adminState.buses.set(bus.busId, bus);
      if (bus.gpsOn) activeCount++;
      MapManager.updateBusMarker(bus);

      // Notify dashboard of bus update
      DashboardManager.handleBusUpdate(bus);
    });

    DOM.activeBusCount.textContent = activeCount;
    if (DOM.totalBuses) DOM.totalBuses.textContent = mappedBuses.length;

    this.renderBusesTable();

    // Populate dashboard bus selector
    DashboardManager.populateBusSelector();

    if (
      adminState.selectedBusId &&
      adminState.buses.has(adminState.selectedBusId)
    ) {
      MapManager.updateInfoPanel(
        adminState.buses.get(adminState.selectedBusId),
      );
    }
  },

  renderBusesTable() {
    const buses = Array.from(adminState.buses.values());
    this.renderTableRows(buses);
  },

  filterBuses(query) {
    const lowerQuery = query.toLowerCase();
    const filtered = Array.from(adminState.buses.values()).filter(
      (bus) =>
        String(bus.busNo).toLowerCase().includes(lowerQuery) ||
        String(bus.routeName).toLowerCase().includes(lowerQuery) ||
        String(bus.driverName).toLowerCase().includes(lowerQuery),
    );
    this.renderTableRows(filtered);
  },

  renderTableRows(buses) {
    if (buses.length === 0) {
      DOM.busesTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 30px; color: #999;">
                        No buses found
                    </td>
                </tr>
            `;
      return;
    }

    DOM.busesTableBody.innerHTML = buses
      .map(
        (bus) => `
            <tr onclick="PanelManager.closeAllPanels(); MapManager.selectBus('${bus.busId}')" style="cursor: pointer;">
                <td data-label="Bus No"><strong>${bus.busNo}</strong></td>
                <td data-label="Driver">${bus.driverName}</td>
                <td data-label="Route">${bus.routeName}</td>
                <td data-label="Status">
                    <span class="status-badge ${bus.gpsOn ? "active" : "inactive"}">
                        ${bus.gpsOn ? "Active" : "Offline"}
                    </span>
                </td>
                <td data-label="Action">
                    <button class="btn btn-sm btn-secondary" style="padding: 4px 8px; font-size: 12px;">
                        Locate
                    </button>
                </td>
            </tr>
        `,
      )
      .join("");
  },
};

// =========================================
// WebSocket Manager
// =========================================
const WebSocketManager = {
  socket: null,
  reconnectAttempts: 0,
  pollInterval: null,

  init() {
    console.log("[WS] Initializing connection...");
    this.connect();
  },

  connect() {
    console.log("[WS] Connecting to:", CONFIG.WS_URL);
    try {
      this.socket = new WebSocket(CONFIG.WS_URL);

      this.socket.onopen = () => {
        console.log("[WS] Connected");
        adminState.isConnected = true;
        this.reconnectAttempts = 0;
        updateConnectionBadge(true);
        showToast("Connected to system", "success");

        // Fetch all registered buses via REST as fallback
        this.fetchInitialBuses();

        // Start periodic polling for real-time sync (every 3 seconds)
        this.startPolling();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "BUS_UPDATE") {
            BusManager.handleBusData(data.buses);
          }
        } catch (error) {
          console.error("[WS] Parse error:", error);
        }
      };

      this.socket.onclose = () => {
        console.log("[WS] Closed");
        adminState.isConnected = false;
        updateConnectionBadge(false);
        this.stopPolling();
        this.attemptReconnect();
      };

      this.socket.onerror = () => {
        updateConnectionBadge(false);
      };
    } catch (error) {
      console.error("[WS] Error:", error);
      this.attemptReconnect();
    }
  },

  startPolling() {
    this.stopPolling();
    this.pollInterval = setInterval(() => {
      this.fetchLatestBuses();
    }, 3000);
    console.log("[WS] Polling started (every 3s)");
  },

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  },

  async fetchLatestBuses() {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/bus/all`);
      if (response.ok) {
        const buses = await response.json();
        if (buses) {
          BusManager.handleBusData(buses);
        }
      }
    } catch (error) {
      // Silent fail - WebSocket push is primary, polling is fallback
    }
  },

  attemptReconnect() {
    if (this.reconnectAttempts < CONFIG.RECONNECT_MAX_ATTEMPTS) {
      this.reconnectAttempts++;
      const delay = 2000 * this.reconnectAttempts;
      console.log(`[WS] Reconnecting in ${delay}ms...`);
      setTimeout(() => this.connect(), delay);
    }
  },

  async fetchInitialBuses() {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/bus/all`);
      if (response.ok) {
        const buses = await response.json();
        if (buses && buses.length > 0) {
          console.log(`[WS] Fetched ${buses.length} initial buses via REST`);
          BusManager.handleBusData(buses);
        }
      }
    } catch (error) {
      console.warn(
        "[WS] Initial bus fetch failed (will rely on WebSocket):",
        error,
      );
    }
  },
};

// =========================================
// Utility Functions
// =========================================
function updateConnectionBadge(isConnected) {
  const badge = DOM.connectionBadge;
  const dot = badge.querySelector(".badge-dot");
  const text = badge.querySelector(".badge-text");

  if (isConnected) {
    badge.style.background = "var(--success)";
    text.textContent = "Connected";
    dot.style.animation = "pulse 2s infinite";
  } else {
    badge.style.background = "var(--danger)";
    text.textContent = "Disconnected";
    dot.style.animation = "none";
  }
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

  DOM.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// =========================================
// Account Creation Toggle & Auth
// =========================================
function getApiBaseUrl() {
  const host = window.location.hostname;
  const protocol = window.location.protocol;

  // Default to Railway production URL as per user instruction
  const productionUrl = "https://bus-tracking-master-production.up.railway.app";

  // If we are already on the production domain, return empty string (relative calls)
  if (host.includes("railway.app")) {
    return "";
  }

  // Capacitor / Local Testing
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    return productionUrl;
  }

  // VS Code Dev Tunnels
  if (host.includes(".devtunnels.ms")) {
    const tunnelMatch = host.match(/^([^-]+)-\d+\.(.+)$/);
    if (tunnelMatch) {
      return `${protocol}//${tunnelMatch[1]}-8080.${tunnelMatch[2]}`;
    }
  }

  if (window.location.port) {
    return `${protocol}//${host}:${window.location.port}`;
  }

  return `${protocol}//${host}`;
}

async function loadAccountCreationState() {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/admin/settings`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    const data = await response.json();
    if (data.success) {
      updateToggleUI(data.accountCreationEnabled);
      updateDriverSignInToggleUI(data.driverSignInEnabled !== false);
      updateStudentSignInToggleUI(data.studentSignInEnabled !== false);
    }
  } catch (error) {
    console.error("[Toggle] Error loading state:", error);
  }
}

async function toggleAccountCreation() {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(
      `${baseUrl}/api/admin/toggle-account-creation`,
      { method: "POST" },
    );
    const data = await response.json();

    if (data.success) {
      updateToggleUI(data.accountCreationEnabled);
      showToast(data.message, "success");
    } else {
      showToast("Failed to toggle", "error");
    }
  } catch (error) {
    console.error("[Toggle] Error:", error);
    showToast("Error toggling account creation", "error");
  }
}

function updateToggleUI(isEnabled) {
  const toggleBtn = DOM.accountToggleBtn;
  const slider = DOM.toggleSlider;
  if (!toggleBtn || !slider) return;

  if (isEnabled) {
    toggleBtn.style.background = "#4CAF50";
    slider.style.left = "26px";
  } else {
    toggleBtn.style.background = "#ccc";
    slider.style.left = "2px";
  }
}

async function toggleDriverSignIn() {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/admin/toggle-driver-signin`, {
      method: "POST",
    });
    const data = await response.json();

    if (data.success) {
      updateDriverSignInToggleUI(data.driverSignInEnabled);
      showToast(data.message, "success");
    } else {
      showToast("Failed to toggle", "error");
    }
  } catch (error) {
    console.error("[Toggle] Error:", error);
    showToast("Error toggling driver sign-in", "error");
  }
}

function updateDriverSignInToggleUI(isEnabled) {
  const toggleBtn = DOM.driverSignInToggleBtn;
  const slider = DOM.driverSignInSlider;
  if (!toggleBtn || !slider) return;

  if (isEnabled) {
    toggleBtn.style.background = "#4CAF50";
    slider.style.left = "26px";
  } else {
    toggleBtn.style.background = "#ccc";
    slider.style.left = "2px";
  }
}

async function toggleStudentSignIn() {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/admin/toggle-student-signin`, {
      method: "POST",
    });
    const data = await response.json();

    if (data.success) {
      updateStudentSignInToggleUI(data.studentSignInEnabled);
      showToast(data.message, "success");
    } else {
      showToast("Failed to toggle", "error");
    }
  } catch (error) {
    console.error("[Toggle] Error:", error);
    showToast("Error toggling student sign-in", "error");
  }
}

function updateStudentSignInToggleUI(isEnabled) {
  const toggleBtn = DOM.studentSignInToggleBtn;
  const slider = DOM.studentSignInSlider;
  if (!toggleBtn || !slider) return;

  if (isEnabled) {
    toggleBtn.style.background = "#4CAF50";
    slider.style.left = "26px";
  } else {
    toggleBtn.style.background = "#ccc";
    slider.style.left = "2px";
  }
}

function showConfirmDialog({
  title,
  message,
  icon,
  iconBg,
  btnText,
  btnColor,
  onConfirm,
}) {
  let modal = document.getElementById("confirmModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "confirmModal";
    modal.innerHTML = `
      <div style="background:#1e1e2e; border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:28px 24px; max-width:380px; width:90%; text-align:center; box-shadow:0 20px 60px rgba(0,0,0,0.5); animation:modalPop 0.25s ease;">
        <div id="confirmIcon" style="width:56px; height:56px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; font-size:28px;"></div>
        <h3 id="confirmTitle" style="color:#fff; font-size:1.15rem; font-weight:700; margin-bottom:8px;"></h3>
        <p id="confirmMessage" style="color:#a1a1aa; font-size:0.9rem; line-height:1.5; margin-bottom:24px;"></p>
        <div style="display:flex; gap:12px;">
          <button id="confirmCancel" style="flex:1; padding:12px; border-radius:10px; border:1px solid rgba(255,255,255,0.15); background:transparent; color:#fff; font-weight:600; cursor:pointer; transition:all 0.2s;">Cancel</button>
          <button id="confirmAction" style="flex:1; padding:12px; border-radius:10px; border:none; font-weight:600; cursor:pointer; transition:all 0.2s;"></button>
        </div>
      </div>`;
    Object.assign(modal.style, {
      display: "none",
      position: "fixed",
      inset: "0",
      zIndex: "9999",
      background: "rgba(0,0,0,0.55)",
      backdropFilter: "blur(4px)",
      alignItems: "center",
      justifyContent: "center",
    });
    const style = document.createElement("style");
    style.textContent =
      "@keyframes modalPop { from { opacity:0; transform:scale(0.9) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } } #confirmCancel:hover { background:rgba(255,255,255,0.1); }";
    document.head.appendChild(style);
    document.body.appendChild(modal);
  }
  document.getElementById("confirmTitle").textContent = title;
  document.getElementById("confirmMessage").textContent = message;
  document.getElementById("confirmIcon").textContent = icon;
  document.getElementById("confirmIcon").style.background = iconBg;
  const actionBtn = document.getElementById("confirmAction");
  actionBtn.textContent = btnText;
  actionBtn.style.background = btnColor;
  actionBtn.style.color = "#fff";
  modal.style.display = "flex";
  document.getElementById("confirmCancel").onclick = () => {
    modal.style.display = "none";
  };
  actionBtn.onclick = () => {
    modal.style.display = "none";
    onConfirm();
  };
  modal.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
  };
}

function adminLogout() {
  showConfirmDialog({
    title: "Logout",
    message: "Are you sure you want to logout from the admin panel?",
    icon: "🚪",
    iconBg: "rgba(251, 146, 60, 0.15)",
    btnText: "Logout",
    btnColor: "#f97316",
    onConfirm: () => {
      sessionStorage.removeItem("admin");
      sessionStorage.removeItem("adminEmail");
      if (WebSocketManager.socket) WebSocketManager.socket.close();
      window.location.href = "admin-login.html";
    },
  });
}

function exportBusReport() {
  const buses = Array.from(adminState.buses.values());
  if (buses.length === 0) {
    showToast("No buses to export", "error");
    return;
  }
  generateBusPDF(buses, "Total Registered Buses Report");
}

function exportActiveBusesPDF() {
  const buses = Array.from(adminState.buses.values()).filter((b) => b.gpsOn);
  if (buses.length === 0) {
    showToast("No active buses to export", "error");
    return;
  }
  generateBusPDF(buses, "Active Buses Real-time Report");
}

function exportDateRangePDF() {
  const start = document.getElementById("exportStartDate").value;
  const end = document.getElementById("exportEndDate").value;

  if (!start || !end) {
    showToast("Please select both start and end dates", "error");
    return;
  }

  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime() + 24 * 60 * 60 * 1000; // End of day

  const filtered = Array.from(adminState.buses.values()).filter((bus) => {
    const updateTime = new Date(bus.lastUpdate).getTime();
    return updateTime >= startTime && updateTime <= endTime;
  });

  if (filtered.length === 0) {
    showToast("No buses found in this date range", "error");
    return;
  }

  generateBusPDF(filtered, `Buses Report (${start} to ${end})`);
}

function generateBusPDF(buses, title) {
  showToast("Generating PDF...", "info");

  const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #FF6B35; padding-bottom: 10px; margin-bottom: 20px;">
                <h1 style="color: #333; margin: 0;">${title}</h1>
                <div style="text-align: right;">
                    <p style="margin: 0; font-weight: bold; color: #FF6B35;">BusTrack Admin</p>
                    <p style="margin: 0; font-size: 12px; color: #666;">Generated: ${new Date().toLocaleString()}</p>
                </div>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px;">
                <thead>
                    <tr style="background: #f8f9fa; color: #333;">
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Bus #</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Route Name</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Driver Details</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Live Status</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Last Known Location</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Last Update</th>
                    </tr>
                </thead>
                <tbody>
                    ${buses
                      .map(
                        (bus) => `
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;"><strong>${bus.busNo}</strong></td>
                            <td style="padding: 10px; border: 1px solid #ddd;">${bus.routeName}</td>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                <div>${bus.driverName}</div>
                                <div style="color: #666; font-size: 10px;">${bus.driverPhone}</div>
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center; color: ${bus.gpsOn ? "#2ecc71" : "#e74c3c"}; font-weight: bold;">
                                ${bus.gpsOn ? "RUNNING" : "OFFLINE"}
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd; font-size: 9px;">${bus.address || "N/A"}</td>
                            <td style="padding: 10px; border: 1px solid #ddd;">${new Date(bus.lastUpdate).toLocaleString()}</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
            
            <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; display: flex; justify-content: space-between; font-size: 10px; color: #999;">
                <div>Total Buses in Report: ${buses.length}</div>
                <div>© ${new Date().getFullYear()} BusTrack System</div>
            </div>
        </div>
    `;

  const element = document.createElement("div");
  element.innerHTML = html;

  const options = {
    margin: [10, 10, 10, 10],
    filename: `${title.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { orientation: "landscape", unit: "mm", format: "a4" },
  };

  html2pdf()
    .set(options)
    .from(element)
    .save()
    .then(() => showToast("PDF Exported Successfully", "success"))
    .catch((err) => {
      console.error("PDF Export Error:", err);
      showToast("Failed to export PDF", "error");
    });
}

function toggleBusesPanel(show) {
  if (show) PanelManager.togglePanel("buses");
  else PanelManager.closeAllPanels();
}

function toggleExportPanel(show) {
  if (show) PanelManager.togglePanel("export");
  else PanelManager.closeAllPanels();
}

function toggleDashboardPanel(show) {
  if (show) PanelManager.togglePanel("dashboard");
  else PanelManager.closeAllPanels();
}

// =========================================
// Initialization
// =========================================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("[App] Initializing Admin Panel");
  updateDebugStatus("System: Initializing Components...");

  try {
    // 0. Mobile Menu
    MobileMenuManager.init();

    // 1. Panel Manager
    updateDebugStatus("Step 1/4: UI Panels...");
    PanelManager.init();

    // 2. Map Manager
    updateDebugStatus("Step 2/4: Map System...");
    try {
      MapManager.init();
    } catch (mapErr) {
      console.error("Map Init Failed:", mapErr);
      updateDebugStatus("Map Failed (Continuing...)", "error");
    }

    // 3. Bus Manager
    updateDebugStatus("Step 3/5: Bus Logic...");
    BusManager.init();

    // 4. Dashboard Manager
    updateDebugStatus("Step 4/5: Dashboard...");
    DashboardManager.init();

    // 5. WebSocket & Auth
    updateDebugStatus("Step 5/5: Connecting...");
    WebSocketManager.init();
    await loadAccountCreationState();

    adminState.isInitialized = true;
    updateDebugStatus("System: Operational", "success");

    // Hide trace bar after 5 seconds if successful
    setTimeout(() => {
      const bar = document.getElementById("debug-trace-bar");
      if (bar && !bar.textContent.includes("ERROR")) {
        bar.style.opacity = "0";
        setTimeout(() => bar.remove(), 1000);
      }
    }, 5000);
  } catch (criticalErr) {
    console.error("Critical Init Error:", criticalErr);
    updateDebugStatus("CRITICAL FAILURE: " + criticalErr.message, "error");
  }
});
