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
    return `wss://bus-tracking-master-production-2d22.up.railway.app${endpoint}`;
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

function getApiBaseUrl() {
  const host = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;

  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    return "https://bus-tracking-master-production-2d22.up.railway.app";
  }

  if (protocol === "file:") {
    return "https://bus-tracking-master-production-2d22.up.railway.app";
  }

  if (host.includes(".devtunnels.ms")) {
    const tunnelMatch = host.match(/^([^-]+)-\d+\.(.+)$/);
    if (tunnelMatch)
      return `${protocol}//${tunnelMatch[1]}-8080.${tunnelMatch[2]}`;
  }

  if (port && port !== "80" && port !== "443") {
    return `${protocol}//${host}:${port}`;
  }

  return `${protocol}//${host}`;
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
  RECONNECT_MAX_ATTEMPTS: Infinity, // Never stop retrying
};

// =========================================
// State
// =========================================
const adminState = {
  buses: new Map(),
  selectedBusId: null,
  isConnected: false,
  isConnected: false,
  activePanel: null, // 'buses' or 'export' or 'routes' or 'route-details' or null
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
    return document.getElementById("dashboardPanel");
  },
  get busesPanel() {
    return document.getElementById("busesView");
  },
  get exportPanel() {
    return document.getElementById("exportView");
  },
  get studentsPanel() {
    return document.getElementById("studentsView");
  },
  get systemSettingsPanel() {
    return document.getElementById("systemSettingsView");
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

  // Routes
  get routesPanel() {
    return document.getElementById("routesView");
  },
  get routeDetailsPanel() {
    return document.getElementById("routeDetailsView");
  },
  get routesListContainer() {
    return document.getElementById("routesListContainer");
  },
  get routeBusesTableBody() {
    return document.getElementById("routeBusesTableBody");
  },
  get totalRoutes() {
    return document.getElementById("totalRoutes");
  },
  get routeDetailsTitle() {
    return document.getElementById("routeDetailsTitle");
  },
  get routeDetailsCount() {
    return document.getElementById("routeDetailsCount");
  },
  get routeDetailsBackBtn() {
    return document.getElementById("routeDetailsBackBtn");
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
    return (
      document.getElementById("accountToggleBtn") ||
      document.getElementById("mobileAccountToggleBtn")
    );
  },
  get toggleSlider() {
    const desktop = document.querySelector("#accountToggleBtn .toggle-slider");
    const mobile = document.querySelector(
      "#mobileAccountToggleBtn .toggle-slider",
    );
    return desktop || mobile;
  },
  get allAccountToggleBtns() {
    return [
      document.getElementById("accountToggleBtn"),
      document.getElementById("mobileAccountToggleBtn"),
    ].filter((el) => el);
  },
  get allAccountToggleSliders() {
    const desktop = document.querySelector("#accountToggleBtn .toggle-slider");
    const mobile = document.querySelector(
      "#mobileAccountToggleBtn .toggle-slider",
    );
    return [desktop, mobile].filter((el) => el);
  },

  // Driver Sign In
  get driverSignInToggleBtn() {
    return (
      document.getElementById("driverSignInToggleBtn") ||
      document.getElementById("mobileDriverSignInToggleBtn")
    );
  },
  get driverSignInSlider() {
    return (
      document.getElementById("driverSignInSlider") ||
      document.getElementById("mobileDriverSignInSlider")
    );
  },
  get allDriverSignInToggleBtns() {
    return [
      document.getElementById("driverSignInToggleBtn"),
      document.getElementById("mobileDriverSignInToggleBtn"),
    ].filter((el) => el);
  },
  get allDriverSignInSliders() {
    const desktopSlider = document.getElementById("driverSignInSlider");
    const mobileSlider = document.getElementById("mobileDriverSignInSlider");
    return [desktopSlider, mobileSlider].filter((el) => el);
  },

  // Student Sign In
  get studentSignInToggleBtn() {
    return (
      document.getElementById("studentSignInToggleBtn") ||
      document.getElementById("mobileStudentSignInToggleBtn")
    );
  },
  get studentSignInSlider() {
    return (
      document.getElementById("studentSignInSlider") ||
      document.getElementById("mobileStudentSignInSlider")
    );
  },
  get allStudentSignInToggleBtns() {
    return [
      document.getElementById("studentSignInToggleBtn"),
      document.getElementById("mobileStudentSignInToggleBtn"),
    ].filter((el) => el);
  },
  get allStudentSignInSliders() {
    const desktopSlider = document.getElementById("studentSignInSlider");
    const mobileSlider = document.getElementById("mobileStudentSignInSlider");
    return [desktopSlider, mobileSlider].filter((el) => el);
  },

  // Toast
  get toastContainer() {
    return document.getElementById("toastContainer");
  },
};

// =========================================
// Helper: Close Mobile Menu
// =========================================
function closeMobileMenu() {
  const menu = document.getElementById("mobileMenu");
  const header = document.querySelector(".admin-header");
  const btn = document.getElementById("mobileMenuBtn");

  if (menu) menu.classList.remove("open");
  if (header) header.classList.remove("menu-open");
  if (btn) btn.classList.remove("active");
}

// =========================================
// Mobile Menu Manager
// =========================================
const MobileMenuManager = {
  init() {
    const btn = document.getElementById("mobileMenuBtn");
    const menu = document.getElementById("mobileMenu");
    const header = document.querySelector(".admin-header");

    if (!btn || !menu) return;

    // Toggle menu
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("open");
      header.classList.toggle("menu-open");
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (menu.classList.contains("open") && !header.contains(e.target)) {
        menu.classList.remove("open");
        header.classList.remove("menu-open");
      }
    });

    // Close when a menu item is clicked
    const menuItems = menu.querySelectorAll(".mobile-menu-item");
    menuItems.forEach((item) => {
      item.addEventListener("click", () => {
        menu.classList.remove("open");
        header.classList.remove("menu-open");
      });
    });

    console.log("[MobileMenu] Initialized");
  },
};

// =========================================
// Panel Manager (Page Navigation)
// =========================================
const PanelManager = {
  init() {
    DOM.tabBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const target = btn.dataset.tab;
        this.togglePanel(target);
      });
    });

    DOM.closePanelBtns.forEach((btn) => {
      btn.addEventListener("click", () => this.closeAllPanels());
    });
  },

  togglePanel(panelName) {
    console.log(`[Panel] Navigating to: ${panelName}`);
    const routeMap = {
      'dashboard': 'dashboard.html',
      'buses': 'buses.html',
      'routes': 'routes.html',
      'feedback': 'feedback.html',
      'export': 'export.html',
      'students': 'students.html',
      'system-settings': 'settings.html',
      'profile': 'profile.html',
      'map': 'live-map.html'
    };
    window.location.href = routeMap[panelName] || 'dashboard.html';
  },

  closeAllPanels() {
    if (typeof MapManager !== "undefined" && MapManager.closeInfoPanel) {
      MapManager.closeInfoPanel();
    }
    window.location.href = 'dashboard.html';
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

  updateDashboardStats() {
    const dashTotalBuses = document.getElementById("dashTotalBuses");
    const dashActiveBuses = document.getElementById("dashActiveBuses");

    if (dashTotalBuses) dashTotalBuses.textContent = adminState.buses.size;

    let activeCount = 0;
    adminState.buses.forEach(bus => {
      if (bus.gpsOn) activeCount++;
    });
    if (dashActiveBuses) dashActiveBuses.textContent = activeCount;

    // Update name
    const adminSessionStr = localStorage.getItem("admin");
    if (adminSessionStr) {
      try {
        const adminSession = JSON.parse(adminSessionStr);
        const nameDisplay = document.getElementById("adminNameDisplayDashboard");
        if (nameDisplay) nameDisplay.textContent = adminSession.name || "Admin";
      } catch (e) { }
    }
  }
};

// =========================================
// Mobile Menu Tab Click Handler
// =========================================
function mobileMenuTabClick(tabName) {
  // Close the mobile menu
  const menu = document.getElementById("mobileMenu");
  const header = document.querySelector(".admin-header");
  if (menu) menu.classList.remove("open");
  if (header) header.classList.remove("menu-open");

  const tabToPage = {
    'dashboard': 'dashboard.html',
    'map': 'live-map.html',
    'buses': 'buses.html',
    'routes': 'routes.html',
    'feedback': 'feedback.html',
    'export': 'export.html',
    'students': 'students.html',
    'system-settings': 'settings.html',
    'profile': 'profile.html',
  };
  window.location.href = tabToPage[tabName] || 'dashboard.html';
}

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
    if (!DOM.mapContainer) {
      console.log("[Map] No map container on this page.");
      return;
    }
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
    if (!this.map) return;
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
    if (this.map && bus.latitude && bus.longitude && Math.abs(bus.latitude) > 0.0001) {
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
// Admin Bus Configuration Manager
// =========================================
const AdminBusManager = {
  openAddModal() {
    const modal = document.getElementById("addBusModal");
    if (modal) {
      document.getElementById("adminBusNumber").value = "";
      document.getElementById("adminBusName").value = "";
      modal.style.display = "flex";
    }
  },

  closeAddModal() {
    const modal = document.getElementById("addBusModal");
    if (modal) {
      modal.style.display = "none";
    }
  },

  async saveBus() {
    const busNumber = document.getElementById("adminBusNumber").value.trim();
    const busName = document.getElementById("adminBusName").value.trim();

    if (!busNumber || !busName) {
      showToast("Please enter both Bus Number and Route Name.", "error");
      return;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/bus/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ busNumber, busName }),
      });

      const data = await response.json();
      if (data.success) {
        showToast(`Bus ${busName} added successfully!`, "success");
        this.closeAddModal();
        // The WebSocket broadcast will automatically update the table,
        // but we can also force a fetch if needed:
        WebSocketManager.syncAndFetchBuses();
      } else {
        showToast(data.message || "Failed to add bus.", "error");
      }
    } catch (error) {
      console.error("[AdminBusManager] Error adding bus:", error);
      showToast("Failed to connect to server.", "error");
    }
  },

  deleteBus(busNumber, busName) {
    showConfirmDialog({
      title: "Delete Bus Configuration",
      message: `Are you sure you want to delete bus "${busName}" (${busNumber})? This will remove it from the system and drivers will no longer see it.`,
      icon: "🗑️",
      iconBg: "rgba(239, 68, 68, 0.15)",
      btnText: "Delete Bus",
      btnColor: "#ef4444",
      onConfirm: async () => {
        try {
          const response = await fetch(
            `${getApiBaseUrl()}/api/bus/config/${encodeURIComponent(busNumber)}`,
            {
              method: "DELETE",
            },
          );
          const data = await response.json();
          if (data.success) {
            showToast(`Bus ${busNumber} deleted successfully.`, "success");
            // WebSocket will update the table automatically, or:
            WebSocketManager.syncAndFetchBuses();
          } else {
            showToast(data.message || "Failed to delete bus.", "error");
          }
        } catch (error) {
          console.error("[AdminBusManager] Error deleting bus:", error);
          showToast("Failed to connect to server.", "error");
        }
      },
    });
  },

  // --- Driver & Bus Info Modal Logic ---

  openBusDetailsModal(busNo, driverId, driverName, driverPhone) {
    const modal = document.getElementById("adminDriverBusModal");
    if (!modal) return;

    let bus = adminState.buses.get(String(busNo));
    if (!bus) {
      for (const b of adminState.buses.values()) {
        if (String(b.busNo) === String(busNo) || String(b.busId) === String(busNo)) {
          bus = b;
          break;
        }
      }
    }

    const titleEl = document.getElementById("infoModalTitle");
    if (titleEl) titleEl.textContent = `Bus ${busNo || ''} Details`;

    const nameEl = document.getElementById("infoDriverName");
    if (nameEl) nameEl.textContent = driverName || (bus && bus.driverName) || "Unassigned";

    const phoneEl = document.getElementById("infoDriverPhone");
    if (phoneEl) phoneEl.textContent = driverPhone || (bus && bus.driverPhone) || "N/A";

    modal.style.display = "flex";

    const form = document.getElementById("driverAddBusForm");
    if (form) form.style.display = "none";

    const validDriverId = driverId && driverId !== "undefined" && driverId !== "null" && driverId !== "";

    if (validDriverId) {
      this.currentDriverId = driverId;
      this.fetchDriverBuses(driverId);
    } else {
      this.currentDriverId = null;
      const container = document.getElementById("driverBusListContainer");
      if (container) {
        const routeName = (bus && bus.routeName) || "N/A";
        const isOnline = bus && bus.gpsOn;
        const statusText = isOnline ? "Online" : "Offline";
        const statusColor = isOnline ? "#10b981" : "#ef4444";

        container.innerHTML = `
          <div style="background:var(--bg-gray, #f8fafc); border:1px solid var(--border-light, #e2e8f0); border-radius:12px; padding:16px; margin-top:8px;">
            <div style="font-size:0.8rem; font-weight:700; color:var(--text-secondary, #64748b); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:12px;">
              Bus System Summary
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; font-size:0.9rem;">
              <div>
                <span style="color:#64748b; font-size:0.75rem; text-transform:uppercase; display:block;">Bus Number</span>
                <div style="font-weight:700; color:#1e293b; font-size:1.1rem; margin-top:2px;">${busNo || '--'}</div>
              </div>
              <div>
                <span style="color:#64748b; font-size:0.75rem; text-transform:uppercase; display:block;">Route</span>
                <div style="font-weight:600; color:#1e293b; margin-top:2px;">${routeName}</div>
              </div>
              <div>
                <span style="color:#64748b; font-size:0.75rem; text-transform:uppercase; display:block;">GPS Status</span>
                <div style="font-weight:600; color:${statusColor}; margin-top:2px;">● ${statusText}</div>
              </div>
              <div>
                <span style="color:#64748b; font-size:0.75rem; text-transform:uppercase; display:block;">Driver</span>
                <div style="font-weight:600; color:#1e293b; margin-top:2px;">${driverName || "Unassigned"}</div>
              </div>
            </div>
          </div>
        `;
      }
    }
  },

  openDriverInfoModal(driverId, driverName, driverPhone) {
    this.openBusDetailsModal("--", driverId, driverName, driverPhone);
  },

  closeDriverInfoModal() {
    this.currentDriverId = null;
    document.getElementById("adminDriverBusModal").style.display = "none";
  },

  toggleDriverAddBusForm() {
    const form = document.getElementById("driverAddBusForm");
    if (form.style.display === "none") {
      form.style.display = "block";
      document.getElementById("driverAddBusNumber").value = "";
      document.getElementById("driverAddBusName").value = "";
    } else {
      form.style.display = "none";
    }
  },

  async fetchDriverBuses(driverId) {
    const container = document.getElementById("driverBusListContainer");
    container.innerHTML = `<div style="text-align:center; color:var(--text-secondary); padding:20px;">Loading buses...</div>`;

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/bus/driver/${driverId}`,
      );
      const buses = await response.json();

      if (response.ok) {
        this.renderDriverBuses(buses);
      } else {
        container.innerHTML = `<div style="text-align:center; color:var(--danger); padding:20px;">Failed to load buses</div>`;
      }
    } catch (e) {
      console.error("Error fetching driver buses:", e);
      container.innerHTML = `<div style="text-align:center; color:var(--danger); padding:20px;">Network error</div>`;
    }
  },

  renderDriverBuses(buses) {
    const container = document.getElementById("driverBusListContainer");

    if (!buses || buses.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; color:var(--text-secondary); padding:30px; background:var(--bg-gray); border-radius:8px;">
           <div style="font-size:2rem; margin-bottom:8px;">🚌</div>
           No buses assigned to this driver yet.
        </div>
      `;
      return;
    }

    container.innerHTML = buses
      .map((bus) => {
        const isRunning =
          bus.status === "RUNNING" || bus.status === "GPS_ACTIVE";
        const statusColor = isRunning
          ? "var(--success)"
          : "var(--text-secondary)";

        // Merge live data from adminState.buses
        const liveBus = adminState.buses.get(String(bus.busNumber));
        const hasLiveData = liveBus && liveBus.gpsOn;
        const lat =
          liveBus && liveBus.latitude ? liveBus.latitude.toFixed(6) : "--";
        const lng =
          liveBus && liveBus.longitude ? liveBus.longitude.toFixed(6) : "--";
        const lastUpdate =
          liveBus && liveBus.lastUpdate
            ? new Date(liveBus.lastUpdate).toLocaleTimeString()
            : "--";
        const gpsStatusText = hasLiveData ? "Active" : "Inactive";
        const gpsStatusColor = hasLiveData ? "#4CAF50" : "#f44336";
        const trackingText = hasLiveData ? "Running" : "Stopped";
        const trackingColor = hasLiveData ? "#2196F3" : "#999";

        return `
        <div style="background:#fff; border:1px solid var(--border-light); border-radius:12px; padding:12px; transition:all 0.2s;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="background:var(--bg-gray); width:40px; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; color:var(--primary); font-weight:700;">
                ${bus.busNumber}
              </div>
              <div>
                <div style="font-weight:600; color:var(--text-dark);">${bus.busName || `Bus ${bus.busNumber}`}</div>
                <div style="font-size:0.75rem; color:${statusColor}; font-weight:500; display:flex; align-items:center; gap:4px; margin-top:2px;">
                  <span style="width:6px; height:6px; background:${statusColor}; border-radius:50%; display:inline-block;"></span>
                  ${isRunning ? "Active" : "Offline"}
                </div>
              </div>
            </div>
            <button onclick="AdminBusManager.deleteDriverBus(${bus.id})" style="background:transparent; border:none; color:var(--danger); cursor:pointer; padding:8px; border-radius:6px; transition:background 0.2s;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
          </div>
          <!-- Live Metrics -->
          <div style="margin-top:10px; padding-top:10px; border-top:1px solid var(--border-light);">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <div style="background:var(--bg-gray); padding:8px 10px; border-radius:8px;">
                <div style="font-size:0.65rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.05em;">GPS Status</div>
                <div style="font-size:0.85rem; font-weight:600; color:${gpsStatusColor}; margin-top:2px;">${gpsStatusText}</div>
              </div>
              <div style="background:var(--bg-gray); padding:8px 10px; border-radius:8px;">
                <div style="font-size:0.65rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.05em;">Tracking</div>
                <div style="font-size:0.85rem; font-weight:600; color:${trackingColor}; margin-top:2px;">${trackingText}</div>
              </div>
              <div style="background:var(--bg-gray); padding:8px 10px; border-radius:8px;">
                <div style="font-size:0.65rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.05em;">Latitude</div>
                <div style="font-size:0.8rem; font-weight:500; color:var(--text-dark); font-family:monospace; margin-top:2px;">${lat}</div>
              </div>
              <div style="background:var(--bg-gray); padding:8px 10px; border-radius:8px;">
                <div style="font-size:0.65rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.05em;">Longitude</div>
                <div style="font-size:0.8rem; font-weight:500; color:var(--text-dark); font-family:monospace; margin-top:2px;">${lng}</div>
              </div>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:8px; padding:6px 10px; background:var(--bg-gray); border-radius:8px;">
              <span style="font-size:0.7rem; color:var(--text-secondary);">Last Update</span>
              <span style="font-size:0.8rem; font-weight:600; color:var(--text-dark);">${lastUpdate}</span>
            </div>
          </div>
        </div>
      `;
      })
      .join("");
  },

  async saveDriverBus() {
    const driverId = this.currentDriverId;
    if (!driverId) return;

    const busNumber = document
      .getElementById("driverAddBusNumber")
      .value.trim();
    const busName = document.getElementById("driverAddBusName").value.trim();

    if (!busNumber || !busName) {
      showToast("Please enter both Bus Number and Route Name.", "error");
      return;
    }

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/bus/driver/${driverId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ busNumber, busName }),
        },
      );

      const data = await response.json();
      if (data.success) {
        showToast(`Bus added successfully!`, "success");
        document.getElementById("driverAddBusNumber").value = "";
        document.getElementById("driverAddBusName").value = "";
        this.fetchDriverBuses(driverId); // Refresh internal list
        // WebSocket broadcast will update the main table behind the modal
      } else {
        showToast(data.message || "Failed to add bus.", "error");
      }
    } catch (error) {
      console.error("[AdminBusManager] Error adding driver bus:", error);
      showToast("Failed to connect to server.", "error");
    }
  },

  async deleteDriverBus(busId) {
    if (!confirm("Are you sure you want to delete this bus?")) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/bus/id/${busId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        showToast("Bus deleted.", "success");
        if (this.currentDriverId) {
          this.fetchDriverBuses(this.currentDriverId); // Refresh internal list
        }
      } else {
        showToast(data.message || "Failed to delete bus.", "error");
      }
    } catch (error) {
      console.error("[AdminBusManager] Error deleting driver bus:", error);
      showToast("Error deleting bus.", "error");
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

  handleBusData(buses, shouldDeleteOldBuses = false) {
    if (!buses) return;

    // Build a set of current bus IDs from the server update
    const currentBusIds = new Set();

    const mappedBuses = buses.map((bus) => {
      const hasValidCoords =
        bus.latitude != null &&
        bus.longitude != null &&
        (Math.abs(bus.latitude) > 0.0001 || Math.abs(bus.longitude) > 0.0001);

      const statusRunning =
        bus.status &&
        (bus.status.toUpperCase() === "RUNNING" ||
          bus.status.toUpperCase() === "GPS_ACTIVE");

      return {
        busId: String(bus.busNumber || bus.busId || bus.busNo),
        busNo: bus.busNumber || bus.busNo,
        busName: bus.busName || bus.busNumber || bus.busNo,
        routeName:
          bus.busName ||
          bus.route ||
          bus.busRoute ||
          bus.routePath ||
          `Route ${bus.busNumber || bus.busNo}`,
        latitude: bus.latitude,
        longitude: bus.longitude,
        status: bus.status,
        // Only mark as GPS on if status is RUNNING AND coordinates are valid (not 0,0)
        gpsOn: statusRunning && hasValidCoords,
        stops:
          ROUTE_DEFINITIONS[bus.busNumber || bus.busNo] ||
          (bus.busStop ? [bus.busStop] : bus.stops || []),
        driverId: bus.driverId,
        driverName: bus.driverName || "Unknown",
        driverPhone: bus.driverPhone || "N/A",
        address: bus.address,
        lastUpdate: bus.lastUpdate || new Date().toISOString(),
      };
    });

    let activeCount = 0;
    mappedBuses.forEach((bus) => {
      currentBusIds.add(bus.busId);
      adminState.buses.set(bus.busId, bus);
      if (bus.gpsOn) activeCount++;
      if (typeof MapManager !== "undefined" && MapManager.updateBusMarker) {
        MapManager.updateBusMarker(bus);
      }
    });

    // Only remove buses if this is a full sync/initial load (shouldDeleteOldBuses = true)
    // Partial updates from BUS_UPDATE should NOT delete buses
    if (shouldDeleteOldBuses) {
      for (const [busId] of adminState.buses) {
        if (!currentBusIds.has(busId)) {
          console.log(`[BusManager] Removing bus: ${busId} (full sync)`);
          adminState.buses.delete(busId);
          // Remove marker from map
          if (typeof MapManager !== "undefined" && MapManager.markers) {
            const marker = MapManager.markers.get(busId);
            if (marker) {
              marker.remove();
              MapManager.markers.delete(busId);
            }
            if (adminState.selectedBusId === busId && MapManager.closeInfoPanel) {
              MapManager.closeInfoPanel();
            }
          }
        }
      }
    }

    const totalCount = adminState.buses.size;
    const offlineCount = Math.max(0, totalCount - activeCount);

    if (DOM.activeBusCount) DOM.activeBusCount.textContent = activeCount;
    if (DOM.totalBuses) DOM.totalBuses.textContent = totalCount;

    const statTotalFleet = document.getElementById("statTotalFleet");
    const statLiveCount = document.getElementById("statLiveCount");
    const statOfflineCount = document.getElementById("statOfflineCount");

    if (statTotalFleet) statTotalFleet.textContent = totalCount;
    if (statLiveCount) statLiveCount.textContent = activeCount;
    if (statOfflineCount) statOfflineCount.textContent = offlineCount;

    // Update Dashboard Stats if it's open or about to be
    if (typeof PanelManager !== 'undefined' && PanelManager.updateDashboardStats) {
      PanelManager.updateDashboardStats();
    }

    this.renderBusesTable();

    if (typeof RouteManager !== 'undefined' && RouteManager.renderRoutes) {
      RouteManager.renderRoutes();
    }

    if (
      adminState.selectedBusId &&
      adminState.buses.has(adminState.selectedBusId) &&
      typeof MapManager !== "undefined" &&
      MapManager.updateInfoPanel
    ) {
      MapManager.updateInfoPanel(
        adminState.buses.get(adminState.selectedBusId),
      );
    }
  },

  renderBusesTable() {
    // If there's an active search filter, re-apply it instead of showing all buses
    const filterInput = DOM.busFilterInput;
    if (filterInput && filterInput.value.trim()) {
      this.filterBuses(filterInput.value);
      return;
    }
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

  filterByStatus(status, pillEl) {
    if (pillEl) {
      const container = pillEl.parentElement;
      if (container) {
        container.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pillEl.classList.add('active');
      }
    }

    const allBuses = Array.from(adminState.buses.values());
    if (status === 'online') {
      const filtered = allBuses.filter(b => b.gpsOn);
      this.renderTableRows(filtered);
    } else if (status === 'offline') {
      const filtered = allBuses.filter(b => !b.gpsOn);
      this.renderTableRows(filtered);
    } else {
      this.renderBusesTable();
    }
  },

  renderTableRows(buses) {
    if (!DOM.busesTableBody) return;
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
            <tr>
                <td data-label="Bus No"><span class="bus-number-badge">${bus.busNo}</span></td>
                <td data-label="Driver" style="font-weight: 500;">${bus.driverName}</td>
                <td data-label="Route" style="color: var(--text-secondary);">${bus.routeName}</td>
                <td data-label="Status">
                    <span class="status-badge ${bus.gpsOn ? "active" : "inactive"}">
                        ${bus.gpsOn ? "Online" : "Offline"}
                    </span>
                </td>
                <td data-label="Action">
                    <div class="table-actions">
                        <button class="action-btn locate" onclick="event.stopPropagation(); window.location.href='live-map.html?busId=${encodeURIComponent(bus.busNo)}';">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            Locate
                        </button>
                        <button class="action-btn info" onclick="event.stopPropagation(); AdminBusManager.openBusDetailsModal('${bus.busNo}', '${bus.driverId || ''}', '${(bus.driverName || 'Unknown').replace(/'/g, "\\'")}', '${(bus.driverPhone || 'N/A').replace(/'/g, "\\'")}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                            Details
                        </button>
                    </div>
                </td>
            </tr>
        `,
      )
      .join("");
  },
};

// =========================================
// Route Manager
// =========================================
const RouteManager = {
  init() {
    const input = document.getElementById("routeFilterInput");
    if (input) {
      input.addEventListener("input", () => {
        this.renderRoutes(input.value);
      });
    }
  },

  renderRoutes(filterQuery) {
    if (!DOM.routesListContainer) return;
    const buses = Array.from(adminState.buses.values());
    const routesMap = new Map();

    buses.forEach((bus) => {
      const routeName = bus.routeName || "Unknown Route";
      if (!routesMap.has(routeName)) {
        routesMap.set(routeName, {
          name: routeName,
          busCount: 0,
          buses: [],
        });
      }
      const routeData = routesMap.get(routeName);
      routeData.busCount++;
      routeData.buses.push(bus);
    });

    let routes = Array.from(routesMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    // Apply search filter
    const query = (filterQuery || "").toLowerCase().trim();
    if (query) {
      routes = routes.filter((route) =>
        route.name.toLowerCase().includes(query),
      );
    }

    const totalRoutesCount = routesMap.size;
    const totalBusesAssigned = buses.length;
    const avgBuses = totalRoutesCount > 0 ? (totalBusesAssigned / totalRoutesCount).toFixed(1) : "0";

    if (DOM.totalRoutes) DOM.totalRoutes.textContent = totalRoutesCount;

    const statActiveRoutes = document.getElementById("statActiveRoutes");
    const statAssignedBuses = document.getElementById("statAssignedBuses");
    const statAvgBuses = document.getElementById("statAvgBuses");

    if (statActiveRoutes) statActiveRoutes.textContent = totalRoutesCount;
    if (statAssignedBuses) statAssignedBuses.textContent = totalBusesAssigned;
    if (statAvgBuses) statAvgBuses.textContent = avgBuses;

    if (routes.length === 0) {
      DOM.routesListContainer.className = "routes-grid-new";
      DOM.routesListContainer.innerHTML = `
        <div class="no-routes-placeholder" style="grid-column: 1 / -1; text-align:center; padding:40px; background:rgba(255,255,255,0.7); border-radius:16px;">
          <div style="font-size:2.5rem; margin-bottom:12px;">📍</div>
          <h3 style="color:var(--text-dark); font-size:1.1rem; font-weight:600;">${query ? "No routes matching your search" : "No service routes available"}</h3>
          <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:4px;">Try refining your search terms or add a new bus configuration.</p>
        </div>`;
      return;
    }

    DOM.routesListContainer.className = "routes-grid-new";
    DOM.routesListContainer.innerHTML = routes
      .map(
        (route) => `
      <div class="route-card-new hover-lift" onclick="RouteManager.showRouteDetails('${route.name.replace(/'/g, "\\\\")}')">
        <div class="route-card-top">
          <div class="route-card-left">
            <div class="route-icon-new">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div class="route-details-new">
              <h3>${route.name}</h3>
              <p>Active Service Path</p>
            </div>
          </div>
          <div class="route-badge-new">
            <span class="dot-online"></span>
            ${route.busCount} ${route.busCount === 1 ? "Vehicle" : "Vehicles"}
          </div>
        </div>
        <div class="route-card-bottom">
          <span>Fleet Coverage Active</span>
          <div class="route-action-link">
            <span>View Details</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </div>
        </div>
      </div>
    `,
      )
      .join("");
  },

  showRouteDetails(routeName) {
    const buses = Array.from(adminState.buses.values()).filter(
      (bus) => (bus.routeName || "Unknown Route") === routeName,
    );

    if (DOM.routeDetailsTitle) DOM.routeDetailsTitle.textContent = routeName;
    if (DOM.routeDetailsCount)
      DOM.routeDetailsCount.textContent = `${buses.length} ${buses.length === 1 ? "bus" : "buses"}`;

    if (!DOM.routeBusesTableBody) return;

    DOM.routeBusesTableBody.innerHTML = buses
      .map(
        (bus) => `
      <tr>
        <td data-label="Bus No"><strong>${bus.busNo}</strong></td>
        <td data-label="Driver">${bus.driverName}</td>
        <td data-label="Route">${bus.routeName}</td>
        <td data-label="Status">
          <span class="status-badge ${bus.gpsOn ? "active" : "inactive"}">
            ${bus.gpsOn ? "Active" : "Offline"}
          </span>
        </td>
        <td data-label="Action">
          <div style="display: flex; gap: 4px; flex-wrap: wrap;">
            <button class="btn btn-sm btn-secondary" style="padding: 4px 8px; font-size: 12px;" onclick="event.stopPropagation(); PanelManager.closeAllPanels(); MapManager.selectBus('${bus.busId}')">
              Locate
            </button>
            <button class="btn btn-sm" style="padding: 4px 8px; font-size: 12px; background: var(--primary); color: #fff; border: none; border-radius: 6px; cursor: pointer;" onclick="event.stopPropagation(); PanelManager.closeAllPanels(); AdminBusManager.openDriverInfoModal('${bus.driverId}', '${bus.driverName.replace(/'/g, "\\'")}', '${bus.driverPhone.replace(/'/g, "\\'")}')">
              Info
            </button>
          </div>
        </td>
      </tr>
    `,
      )
      .join("");

    // Show route details sub-panel within the routes page
    const routesView = document.getElementById('routesView');
    const routeDetailsView = document.getElementById('routeDetailsView');
    if (routesView) routesView.classList.remove('visible');
    if (routeDetailsView) routeDetailsView.classList.add('visible');
  },
};

function toggleRoutesPanel(show) {
  if (show === false) window.location.hash = '#/live-map';
  else window.location.hash = '#/routes';
}

function toggleRouteDetailsPanel(show) {
  if (show === false) window.location.hash = '#/routes';
  // route-details is handled within the routes page
}

// =========================================
// WebSocket Manager
// =========================================
const WebSocketManager = {
  socket: null,
  reconnectAttempts: 0,
  heartbeatInterval: null,
  pollingInterval: null,
  HEARTBEAT_RATE: 20000, // 20 seconds keep-alive
  POLLING_RATE: 5000, // 5 seconds status polling

  init() {
    console.log("[WS] Initializing connection...");
    this.fetchInitialBuses(true);
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
        this.startHeartbeat();
        showToast("Connected to system", "success");

        // Sync BUS_MAP with DB first (removes deleted accounts), then fetch initial buses
        this.syncAndFetchBuses();

        // Start polling for bus status updates (reliable fallback for missed WS broadcasts)
        this.startPolling();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "PONG") {
            console.log("[WS] Heartbeat PONG received");
            return;
          }
          console.log("[WS] Message received, type:", data.type);
          if (data.type === "BUS_UPDATE" && data.buses) {
            console.log(
              `[WS] BUS_UPDATE received: ${data.buses.length} buses (source: ${data.source || "unknown"})`,
            );
            // Partial update from WebSocket - don't delete other buses
            BusManager.handleBusData(data.buses, false);
          } else if (data.action === "START" && data.busNumber) {
            // Driver selected a bus and started tracking - immediately mark it as Active
            console.log(
              `[WS] Driver started tracking bus ${data.busNumber} (${data.busName})`,
            );
            const busId = String(data.busNumber); // Convert to string for consistent lookup

            console.log(`[WS] Looking for bus ID: "${busId}", current buses:`, Array.from(adminState.buses.keys()));

            // IMPORTANT: When ONE bus is selected, ALL other buses must be marked offline
            // Clear Active status from all buses first
            adminState.buses.forEach((bus, id) => {
              if (id !== busId) {
                bus.gpsOn = false; // Mark all OTHER buses as Offline
              }
            });

            if (adminState.buses.has(busId)) {
              const bus = adminState.buses.get(busId);
              console.log(`[WS] Found bus ${busId}, setting as Active`);
              bus.gpsOn = true; // Mark the selected bus as Active
              // Sync any updated driver info that may have changed (e.g., bus name, driver phone)
              if (data.busName) bus.busName = data.busName;
              if (data.driverName) bus.driverName = data.driverName;
              if (data.driverPhone) bus.driverPhone = data.driverPhone;
              adminState.buses.set(busId, bus);
              BusManager.renderBusesTable();
              // Update info panel if this bus is selected
              if (adminState.selectedBusId === busId) {
                MapManager.updateInfoPanel(bus);
              }
            } else {
              // Bus not in cache - create a placeholder with START data and fetch full details
              console.log(
                `[WS] Bus ${busId} not in cache, creating placeholder and fetching fresh data`,
              );
              // Create a placeholder bus object with info from START message
              const placeholderBus = {
                id: data.busNumber ? parseInt(data.busNumber) : null,
                busNumber: data.busNumber,
                busName: data.busName || "Unknown Bus",
                driverId: data.driverId,
                driverName: data.driverName || "Unknown Driver",
                driverPhone: data.driverPhone || "",
                status: "RUNNING",
                gpsOn: true, // Mark as Active immediately
                latitude: 0,
                longitude: 0,
              };
              adminState.buses.set(busId, placeholderBus);
              console.log(`[WS] Created placeholder for bus ${busId}, marking as Active`);
              BusManager.renderBusesTable();
              // Fetch fresh full data to get coordinates and other details
              WebSocketManager.fetchInitialBuses();
            }
          } else if (data.action === "STOP" && data.busNumber) {
            // Driver stopped tracking - mark bus as Offline
            console.log(`[WS] Driver stopped tracking bus ${data.busNumber}`);
            const busId = String(data.busNumber);
            if (adminState.buses.has(busId)) {
              const bus = adminState.buses.get(busId);
              bus.gpsOn = false; // Mark as Offline
              // Sync any updated driver info if included
              if (data.busName) bus.busName = data.busName;
              if (data.driverName) bus.driverName = data.driverName;
              if (data.driverPhone) bus.driverPhone = data.driverPhone;
              adminState.buses.set(busId, bus);
              BusManager.renderBusesTable();
              // Update info panel if this bus was selected
              if (adminState.selectedBusId === busId) {
                MapManager.updateInfoPanel(bus);
              }
            } else {
              // Bus not in cache - fetch fresh data from server
              console.log(`[WS] Bus ${busId} not in cache, fetching fresh data from server`);
              WebSocketManager.fetchInitialBuses();
            }
          } else if (
            data.type === "BUS_CONFIG_ADDED" ||
            data.type === "BUS_CONFIG_DELETED"
          ) {
            // If the driver info panel is open for this driver, refresh it
            if (
              AdminBusManager &&
              AdminBusManager.currentDriverId === data.driverId
            ) {
              AdminBusManager.fetchDriverBuses(data.driverId);
            }
          }
        } catch (error) {
          console.error("[WS] Parse error:", error);
        }
      };

      this.socket.onclose = () => {
        console.log("[WS] Closed");
        adminState.isConnected = false;
        this.stopHeartbeat();
        this.stopPolling();
        updateConnectionBadge(false, "Reconnecting...");
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

  async syncAndFetchBuses() {
    try {
      const baseUrl = getApiBaseUrl();
      // Sync: remove stale BUS_MAP entries for deleted accounts
      await fetch(`${baseUrl}/api/admin/sync-buses`, { method: "POST" });
      console.log("[WS] Bus sync completed");
    } catch (error) {
      console.warn("[WS] Sync failed (non-critical):", error);
    }
    // Now fetch the clean initial bus list
    this.fetchInitialBuses();
  },

  attemptReconnect() {
    if (this.reconnectAttempts < CONFIG.RECONNECT_MAX_ATTEMPTS) {
      this.reconnectAttempts++;
      const delay = Math.min(2000 * this.reconnectAttempts, 20000); // Cap at 20s
      console.log(`[WS] Reconnecting in ${delay}ms...`);
      setTimeout(() => this.connect(), delay);
    } else {
      updateConnectionBadge(false);
    }
  },

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: "PING" }));
      }
    }, this.HEARTBEAT_RATE);
  },

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  },

  startPolling() {
    this.stopPolling();
    this.pollingInterval = setInterval(() => {
      this.fetchInitialBuses();
    }, this.POLLING_RATE);
  },

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  },

  async fetchInitialBuses(forceReload = false) {
    try {
      const baseUrl = getApiBaseUrl();
      const url =
        `${baseUrl}/api/bus/all` + (forceReload ? `?t=${Date.now()}` : "");
      let response = null;
      try {
        response = await fetch(url, { cache: "no-store" });
      } catch (e1) {
        response = null;
      }

      // Fallback strategies if primary URL fails or returns non-200
      if (!response || !response.ok) {
        const prodFallback = `https://bus-tracking-master-production-2d22.up.railway.app/api/bus/all` + (forceReload ? `?t=${Date.now()}` : "");
        try {
          response = await fetch(prodFallback, { cache: "no-store" });
        } catch (e2) {
          try {
            response = await fetch(`/api/bus/all` + (forceReload ? `?t=${Date.now()}` : ""));
          } catch (e3) {
            response = null;
          }
        }
      }

      if (response && response.ok) {
        const buses = await response.json();
        if (Array.isArray(buses)) {
          console.log(`[WS] Fetched ${buses.length} initial buses via REST`);
          // This is a full sync from server
          BusManager.handleBusData(buses, true);
        }
      } else {
        console.warn("[WS] Initial bus fetch response not OK:", response ? response.status : "No response");
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
function updateConnectionBadge(isConnected, customText) {
  const badge = DOM.connectionBadge;
  if (!badge) return;
  const dot = badge.querySelector(".badge-dot");
  const text = badge.querySelector(".badge-text");

  if (isConnected) {
    badge.style.background = "var(--success)";
    text.textContent = "Connected";
    dot.style.animation = "pulse 2s infinite";
  } else {
    badge.style.background = customText
      ? "var(--warning, #f59e0b)"
      : "var(--danger)";
    text.textContent = customText || "Disconnected";
    dot.style.animation = customText ? "pulse 1s infinite" : "none";
  }
}

// =========================================
// Network Change Listener
// =========================================
window.addEventListener("online", () => {
  console.log("[Network] Back online — forcing WebSocket reconnect");
  WebSocketManager.reconnectAttempts = 0;
  if (!adminState.isConnected) {
    WebSocketManager.connect();
  }
});

window.addEventListener("offline", () => {
  console.log("[Network] Offline detected");
  updateConnectionBadge(false, "Reconnecting...");
});

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

  if (DOM.toastContainer) DOM.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
  // If a bus/account was deleted, force reload buses
  if (message && message.toLowerCase().includes("deleted")) {
    setTimeout(() => {
      if (
        WebSocketManager &&
        typeof WebSocketManager.fetchInitialBuses === "function"
      ) {
        WebSocketManager.fetchInitialBuses(true);
      }
    }, 1000);
  }
}

// =========================================
// Account Creation Toggle & Auth
// =========================================
function getApiBaseUrl() {
  const host = window.location.hostname;
  const protocol = window.location.protocol;

  const productionUrl = "https://bus-tracking-master-production-2d22.up.railway.app";

  if (protocol === "file:" || !host) {
    return productionUrl;
  }

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
    if (window.location.port !== "8080" && window.location.port !== "80" && window.location.port !== "443") {
      return `${protocol}//${host}:8080`;
    }
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

async function toggleAccountCreation(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  try {
    const baseUrl = getApiBaseUrl();
    console.log("[Toggle] Toggling account creation, API Base URL:", baseUrl);
    const response = await fetch(
      `${baseUrl}/api/admin/toggle-account-creation`,
      { method: "POST" },
    );
    const data = await response.json();
    console.log("[Toggle] Account creation response:", data);

    if (data.success) {
      updateToggleUI(data.accountCreationEnabled);
      showToast(data.message, "success");
      console.log("[Toggle] Account creation UI updated");
      // Don't auto-close menu - let user close it manually
    } else {
      showToast("Failed to toggle", "error");
    }
  } catch (error) {
    console.error("[Toggle] Error:", error);
    updateDebugStatus("Account toggle failed: " + error.message, "error");
    showToast("Error toggling account creation", "error");
  }
}

function updateToggleUI(isEnabled) {
  // Update all account toggle buttons (desktop + mobile)
  DOM.allAccountToggleBtns.forEach((btn) => {
    if (btn) {
      btn.style.background = isEnabled ? "#4CAF50" : "#ccc";
    }
  });
  // Update all sliders
  DOM.allAccountToggleSliders.forEach((slider) => {
    if (slider) {
      slider.style.left = isEnabled ? "26px" : "2px";
    }
  });
}

async function toggleDriverSignIn(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  try {
    const baseUrl = getApiBaseUrl();
    console.log("[Toggle] Toggling driver sign-in, API Base URL:", baseUrl);
    const response = await fetch(`${baseUrl}/api/admin/toggle-driver-signin`, {
      method: "POST",
    });
    const data = await response.json();
    console.log("[Toggle] Driver sign-in response:", data);

    if (data.success) {
      updateDriverSignInToggleUI(data.driverSignInEnabled);
      showToast(data.message, "success");
      console.log("[Toggle] Driver sign-in UI updated");
      // Don't auto-close menu - let user close it manually
    } else {
      showToast("Failed to toggle", "error");
    }
  } catch (error) {
    console.error("[Toggle] Error:", error);
    updateDebugStatus("Driver toggle failed: " + error.message, "error");
    showToast("Error toggling driver sign-in", "error");
  }
}

function updateDriverSignInToggleUI(isEnabled) {
  // Update all driver sign-in toggle buttons (desktop + mobile)
  DOM.allDriverSignInToggleBtns.forEach((btn) => {
    if (btn) {
      btn.style.background = isEnabled ? "#4CAF50" : "#ccc";
    }
  });
  // Update all sliders
  DOM.allDriverSignInSliders.forEach((slider) => {
    if (slider) {
      slider.style.left = isEnabled ? "26px" : "2px";
    }
  });
}

async function toggleStudentSignIn(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  try {
    const baseUrl = getApiBaseUrl();
    console.log("[Toggle] Toggling student sign-in, API Base URL:", baseUrl);
    const response = await fetch(`${baseUrl}/api/admin/toggle-student-signin`, {
      method: "POST",
    });
    const data = await response.json();
    console.log("[Toggle] Student sign-in response:", data);

    if (data.success) {
      updateStudentSignInToggleUI(data.studentSignInEnabled);
      showToast(data.message, "success");
      console.log("[Toggle] Student sign-in UI updated");
      // Don't auto-close menu - let user close it manually
    } else {
      showToast("Failed to toggle", "error");
    }
  } catch (error) {
    console.error("[Toggle] Error:", error);
    updateDebugStatus("Student toggle failed: " + error.message, "error");
    showToast("Error toggling student sign-in", "error");
  }
}

function updateStudentSignInToggleUI(isEnabled) {
  // Update all student sign-in toggle buttons (desktop + mobile)
  DOM.allStudentSignInToggleBtns.forEach((btn) => {
    if (btn) {
      btn.style.background = isEnabled ? "#4CAF50" : "#ccc";
    }
  });
  // Update all sliders
  DOM.allStudentSignInSliders.forEach((slider) => {
    if (slider) {
      slider.style.left = isEnabled ? "26px" : "2px";
    }
  });
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
  console.log("[Logout] Initiating logout process");
  showConfirmDialog({
    title: "Logout",
    message: "Are you sure you want to logout from the admin panel?",
    icon: "🚪",
    iconBg: "rgba(251, 146, 60, 0.15)",
    btnText: "Logout",
    btnColor: "#f97316",
    onConfirm: () => {
      try {
        console.log("[Logout] Clearing session data");
        localStorage.removeItem("admin");
        localStorage.removeItem("adminEmail");
        localStorage.removeItem("currentUser");

        if (WebSocketManager.socket) {
          console.log("[Logout] Closing WebSocket connection");
          WebSocketManager.socket.close();
        }

        console.log("[Logout] Closing mobile menu");
        closeMobileMenu();

        console.log("[Logout] Redirecting to login page");
        updateDebugStatus("Logging out...", "success");

        setTimeout(() => {
          window.location.href = "admin-login.html";
        }, 300);
      } catch (error) {
        console.error("[Logout] Error during logout:", error);
        updateDebugStatus("Logout error: " + error.message, "error");
        window.location.href = "admin-login.html";
      }
    },
  });
}

function exportActiveBusesPDF() {
  let buses = Array.from(adminState.buses.values()).filter((b) => b.gpsOn);
  if (buses.length === 0) {
    alert(
      "No active buses currently on trip. Exporting all registered buses instead.",
    );
    buses = Array.from(adminState.buses.values());
    if (buses.length === 0) {
      alert("No buses registered in the system.");
      return;
    }
  }
  generateBusPDF(
    buses,
    buses.every((b) => !b.gpsOn)
      ? "All Buses Report (Offline)"
      : "Active Buses Real-time Report",
  );
}

function applyDatePreset(presetType, btnElement) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const endFormatted = `${year}-${month}-${day}`;

  let startFormatted = '';

  if (presetType === 'all') {
    startFormatted = '';
  } else if (presetType === '7days') {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    const sYear = d.getFullYear();
    const sMonth = String(d.getMonth() + 1).padStart(2, '0');
    const sDay = String(d.getDate()).padStart(2, '0');
    startFormatted = `${sYear}-${sMonth}-${sDay}`;
  } else if (presetType === '30days') {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const sYear = d.getFullYear();
    const sMonth = String(d.getMonth() + 1).padStart(2, '0');
    const sDay = String(d.getDate()).padStart(2, '0');
    startFormatted = `${sYear}-${sMonth}-${sDay}`;
  } else if (presetType === '90days') {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    const sYear = d.getFullYear();
    const sMonth = String(d.getMonth() + 1).padStart(2, '0');
    const sDay = String(d.getDate()).padStart(2, '0');
    startFormatted = `${sYear}-${sMonth}-${sDay}`;
  } else if (presetType === 'thisyear') {
    startFormatted = `${year}-01-01`;
  }

  const cardStart = document.getElementById("exportStartDate");
  const cardEnd = document.getElementById("exportEndDate");
  const modalStart = document.getElementById("pdfFromDate");
  const modalEnd = document.getElementById("pdfToDate");

  if (cardStart) cardStart.value = startFormatted;
  if (cardEnd) cardEnd.value = endFormatted;
  if (modalStart) modalStart.value = startFormatted;
  if (modalEnd) modalEnd.value = endFormatted;

  document.querySelectorAll('.preset-pill-btn').forEach((btn) => {
    const onclickAttr = btn.getAttribute('onclick') || '';
    if (onclickAttr.includes(`'${presetType}'`)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function clearPresetActiveState() {
  document.querySelectorAll('.preset-pill-btn').forEach((btn) => btn.classList.remove('active'));
}

function openPdfReportModal() {
  const modal = document.getElementById("pdfReportModal");
  if (modal) {
    const cardStart = document.getElementById("exportStartDate")?.value || "";
    const cardEnd = document.getElementById("exportEndDate")?.value || "";
    const modalStart = document.getElementById("pdfFromDate");
    const modalEnd = document.getElementById("pdfToDate");
    if (modalStart) modalStart.value = cardStart;
    if (modalEnd) modalEnd.value = cardEnd;

    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }
}

function closePdfReportModal() {
  const modal = document.getElementById("pdfReportModal");
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "";
  }
}

function handlePdfModalBackdropClick(e) {
  if (e.target && e.target.id === "pdfReportModal") {
    closePdfReportModal();
  }
}

function syncFromModalInputs() {
  const cardStart = document.getElementById("exportStartDate");
  const cardEnd = document.getElementById("exportEndDate");
  const modalStart = document.getElementById("pdfFromDate");
  const modalEnd = document.getElementById("pdfToDate");

  if (cardStart && modalStart) cardStart.value = modalStart.value;
  if (cardEnd && modalEnd) cardEnd.value = modalEnd.value;
}

function generatePdfFromModal() {
  const start = document.getElementById("pdfFromDate")?.value || document.getElementById("exportStartDate")?.value;
  const end = document.getElementById("pdfToDate")?.value || document.getElementById("exportEndDate")?.value;

  if (!start && !end) {
    showToast("Please select a date range or preset", "error");
    return;
  }

  const cardStart = document.getElementById("exportStartDate");
  const cardEnd = document.getElementById("exportEndDate");
  if (cardStart) cardStart.value = start || "";
  if (cardEnd) cardEnd.value = end || "";

  closePdfReportModal();
  exportDateRangePDF();
}

function exportDateRangePDF() {
  const start = document.getElementById("exportStartDate")?.value || document.getElementById("pdfFromDate")?.value;
  const end = document.getElementById("exportEndDate")?.value || document.getElementById("pdfToDate")?.value;

  if (!start && !end) {
    showToast("Please select a date range or quick preset", "error");
    return;
  }

  let filtered = Array.from(adminState.buses.values());

  if (start) {
    const startTime = new Date(start).getTime();
    filtered = filtered.filter((bus) => new Date(bus.lastUpdate).getTime() >= startTime);
  }

  if (end) {
    const endTime = new Date(end).getTime() + 24 * 60 * 60 * 1000; // End of day
    filtered = filtered.filter((bus) => new Date(bus.lastUpdate).getTime() <= endTime);
  }

  if (filtered.length === 0) {
    showToast("No buses found in this date range", "error");
    return;
  }

  const rangeTitle = start && end ? `${start} to ${end}` : (start ? `From ${start}` : (end ? `Until ${end}` : `All Time`));
  generateBusPDF(filtered, `Buses Report (${rangeTitle})`);
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

  const worker = html2pdf().set(options).from(element);

  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    worker
      .outputPdf("datauristring")
      .then((pdfString) => {
        // Strip out the data:application/pdf;base64, prefix
        const base64Data =
          pdfString.split(",")[1] || pdfString.split("base64,")[1];
        const { Filesystem, Directory } = window.Capacitor.Plugins;
        const { Share } = window.Capacitor.Plugins;

        Filesystem.writeFile({
          path: options.filename,
          data: base64Data,
          directory: Directory.Cache,
        })
          .then((result) => {
            Share.share({
              title: title,
              url: result.uri,
              dialogTitle: "Share PDF Report",
            });
            showToast("PDF Exported Successfully!", "success");
          })
          .catch((err) => {
            console.error("FS Error:", err);
            showToast("Failed to save PDF locally.", "error");
          });
      })
      .catch((err) => {
        console.error("HTML2PDF Error:", err);
        showToast("Failed to generate PDF.", "error");
      });
  } else {
    // Fallback for standard web browsers
    worker
      .save()
      .then(() => showToast("PDF Exported Successfully (Browser)", "success"))
      .catch((err) => {
        console.error("PDF Export Error:", err);
        showToast("Failed to export PDF", "error");
      });
  }
}

function toggleBusesPanel(show) {
  if (show) window.location.href = 'buses.html';
  else window.location.href = 'live-map.html';
}

function toggleExportPanel(show) {
  if (show) window.location.href = 'export.html';
  else window.location.href = 'live-map.html';
}

function toggleProfilePanel(show) {
  if (show) window.location.href = 'profile.html';
  else window.location.href = 'dashboard.html';
}

function loadAdminProfile() {
  const adminData = JSON.parse(localStorage.getItem("admin"));
  if (adminData) {
    const profName = document.getElementById("profileName");
    const profEmail = document.getElementById("adminEmail");
    const profInitials = document.getElementById("profileAvatarInitials");
    if (profName) profName.textContent = adminData.name || "Admin";
    if (profEmail) profEmail.value = adminData.email || "";
    if (profInitials && adminData.name) {
      const parts = adminData.name.trim().split(" ");
      if (parts.length >= 2) {
        profInitials.textContent = (parts[0][0] + parts[1][0]).toUpperCase();
      } else {
        profInitials.textContent = adminData.name.substring(0, 2).toUpperCase();
      }
    }
  }
}

function updateAdminProfile() {
  const passwordInput = document.getElementById("adminPassword");
  const password = passwordInput ? passwordInput.value : "";

  if (password) {
    showAdminToast("Profile updated and password changed successfully!", "success");
  } else {
    showAdminToast("Profile updated successfully!", "success");
  }

  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 1000);
}

// =========================================
// Initialization
// =========================================
// Add initialization handler
document.addEventListener("DOMContentLoaded", async () => {
  console.log("[App] Initializing Admin Panel");
  updateDebugStatus("System: Initializing Components...");

  try {
    adminState.buses.clear();
    adminState.selectedBusId = null;

    // 0. Mobile Menu
    MobileMenuManager.init();

    // 1. Map System (only if #map container exists on page)
    updateDebugStatus("Step 1/3: Map System...");
    try {
      MapManager.init();
    } catch (mapErr) {
      console.error("Map Init Failed:", mapErr);
      updateDebugStatus("Map Failed (Continuing...)", "error");
    }

    // 2. Bus Manager & Route Manager
    updateDebugStatus("Step 2/3: Bus & Route Logic...");
    BusManager.init();
    RouteManager.init();

    // 3. Page-specific initializations
    if (document.getElementById("busesTableBody")) {
      BusManager.renderBusesTable();
    }
    if (document.getElementById("totalFeedback") && typeof FeedbackManager !== 'undefined') {
      FeedbackManager.loadFeedback();
    }
    if (document.getElementById("studentSearchInput") && typeof StudentsManager !== 'undefined') {
      StudentsManager.loadStudents();
    }
    if (document.getElementById("profileName")) {
      loadAdminProfile();
    }
    if (document.getElementById("dashTotalBuses")) {
      PanelManager.updateDashboardStats();
    }

    // 4. WebSocket & Auth
    updateDebugStatus("Step 3/3: Connecting...");
    WebSocketManager.init();
    await loadAccountCreationState();

    adminState.isInitialized = true;
    updateDebugStatus("System: Operational", "success");

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

// =========================================
// Feedback Manager
// =========================================
const FeedbackManager = {
  allFeedback: [],
  currentFeedbackId: null,

  async loadFeedback() {
    try {
      const resp = await fetch(getApiBaseUrl() + "/api/feedback");
      const data = await resp.json();
      if (data.success) {
        this.allFeedback = data.feedback || [];
        this.updateStats();
        this.applyFilter();
      }
    } catch (e) {
      console.error("[Feedback] Load error:", e);
    }
  },

  updateStats() {
    const total = this.allFeedback.length;
    const pending = this.allFeedback.filter((f) => f.status === "pending").length;
    const resolved = this.allFeedback.filter((f) => f.status === "resolved").length;
    const rate = total > 0 ? Math.round((resolved / total) * 100) + "%" : "100%";

    const totalEl = document.getElementById("totalFeedback");
    const pendingEl = document.getElementById("statPendingFeedback");
    const rateEl = document.getElementById("statResolutionRate");

    if (totalEl) totalEl.textContent = total;
    if (pendingEl) pendingEl.textContent = pending;
    if (rateEl) rateEl.textContent = rate;
  },

  applyFilter() {
    const filterEl = document.getElementById("feedbackFilter");
    const searchEl = document.getElementById("feedbackSearchInput");

    const filter = filterEl ? filterEl.value : "all";
    const query = searchEl ? searchEl.value.toLowerCase().trim() : "";

    let list = this.allFeedback;

    if (filter !== "all") {
      list = list.filter((f) => f.status === filter);
    }

    if (query) {
      list = list.filter((f) => {
        const bus = (f.busNumber || "").toLowerCase();
        const route = (f.routeName || "").toLowerCase();
        const student = (f.studentName || "").toLowerCase();
        const email = (f.studentEmail || "").toLowerCase();
        const issue = (f.issueType || "").toLowerCase();
        const msg = (f.message || "").toLowerCase();
        return (
          bus.includes(query) ||
          route.includes(query) ||
          student.includes(query) ||
          email.includes(query) ||
          issue.includes(query) ||
          msg.includes(query)
        );
      });
    }

    this.renderTable(list);
  },

  renderTable(list) {
    const tbody = document.getElementById("feedbackTableBody");
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:48px 20px;">
            <div style="font-size:2.5rem; margin-bottom:12px;">💬</div>
            <h3 style="color:var(--text-dark); font-size:1.1rem; font-weight:700; margin-bottom:4px;">No feedback reports found</h3>
            <p style="color:var(--text-secondary); font-size:0.85rem;">There are no student reports matching your current filter criteria.</p>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = list
      .map((f) => {
        const isResolved = f.status === "resolved";
        const statusBadge = isResolved
          ? `<span class="route-badge-new" style="background:#ecfdf5; color:#047857; border-color:#a7f3d0;"><span class="dot-online" style="background:#10b981;"></span> Resolved</span>`
          : `<span class="route-badge-new" style="background:#fff7ed; color:#c2410c; border-color:#ffedd5;"><span class="pulse-dot" style="width:6px; height:6px; background:#f97316;"></span> Pending</span>`;

        const time = f.createdAt
          ? new Date(f.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
          : "--";

        let issueColor = "#f59e0b";
        let issueBg = "#fef3c7";
        let issueBorder = "#fde68a";
        const issueLower = (f.issueType || "").toLowerCase();
        if (issueLower.includes("delay") || issueLower.includes("time")) {
          issueColor = "#d97706";
          issueBg = "#fffbeb";
        } else if (issueLower.includes("driver") || issueLower.includes("behavior")) {
          issueColor = "#ea580c";
          issueBg = "#fff7ed";
        } else if (issueLower.includes("route") || issueLower.includes("stop")) {
          issueColor = "#0284c7";
          issueBg = "#f0f9ff";
          issueBorder = "#bae6fd";
        } else if (issueLower.includes("ac") || issueLower.includes("condition")) {
          issueColor = "#7c3aed";
          issueBg = "#f5f3ff";
          issueBorder = "#ddd6fe";
        }

        return `
        <tr style="cursor:pointer;" onclick="FeedbackManager.openDetail(${f.id})">
          <td data-label="Bus No"><span class="bus-number-badge">${f.busNumber || "--"}</span></td>
          <td data-label="Route Name" style="font-weight:600; color:var(--text-dark);">${f.routeName || "--"}</td>
          <td data-label="Student Info">
            <div style="display:flex; flex-direction:column;">
              <strong style="color:var(--text-dark); font-size:0.9rem;">${f.studentName || "Anonymous Student"}</strong>
              <span style="font-size:0.78rem; color:var(--text-secondary);">${f.studentEmail || "No email provided"}</span>
            </div>
          </td>
          <td data-label="Issue Type">
            <span style="display:inline-flex; align-items:center; padding:5px 12px; background:${issueBg}; color:${issueColor}; border:1px solid ${issueBorder}; border-radius:20px; font-size:0.78rem; font-weight:700; text-transform:capitalize;">
              ${f.issueType || "General Issue"}
            </span>
          </td>
          <td data-label="Status">${statusBadge}</td>
          <td data-label="Submitted Time" style="font-size:0.83rem; color:var(--text-secondary); font-weight:500;">${time}</td>
          <td data-label="Action" style="text-align:right;">
            <button class="action-btn info" onclick="event.stopPropagation(); FeedbackManager.openDetail(${f.id});">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              Review
            </button>
          </td>
        </tr>`;
      })
      .join("");
  },

  openDetail(id) {
    const f = this.allFeedback.find((fb) => fb.id === id);
    if (!f) return;
    this.currentFeedbackId = id;
    document.getElementById("fdBusNumber").textContent = f.busNumber || "--";
    document.getElementById("fdRouteName").textContent = f.routeName || "--";
    document.getElementById("fdStudentName").textContent = f.studentName || "--";
    document.getElementById("fdStudentEmail").textContent = f.studentEmail || "--";
    
    const issueEl = document.getElementById("fdIssueType");
    if (issueEl) {
      issueEl.textContent = f.issueType || "General Issue";
    }

    document.getElementById("fdMessage").textContent = f.message || "No message provided.";
    document.getElementById("fdCreatedAt").textContent = f.createdAt
      ? new Date(f.createdAt).toLocaleString()
      : "--";

    const resolveBtn = document.getElementById("fdResolveBtn");
    if (f.status === "resolved") {
      resolveBtn.style.background = "#94a3b8";
      resolveBtn.style.boxShadow = "none";
      resolveBtn.textContent = "✓ Already Resolved";
      resolveBtn.disabled = true;
    } else {
      resolveBtn.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
      resolveBtn.style.boxShadow = "0 4px 14px rgba(16, 185, 129, 0.35)";
      resolveBtn.textContent = "✓ Mark as Resolved";
      resolveBtn.disabled = false;
    }

    const modal = document.getElementById("feedbackDetailModal");
    if (modal) modal.style.display = "flex";
  },

  closeDetail() {
    const modal = document.getElementById("feedbackDetailModal");
    if (modal) modal.style.display = "none";
    this.currentFeedbackId = null;
  },

  async resolveCurrentFeedback() {
    if (!this.currentFeedbackId) return;
    try {
      const resp = await fetch(
        getApiBaseUrl() +
        "/api/feedback/" +
        this.currentFeedbackId +
        "/resolve",
        { method: "PUT" },
      );
      const data = await resp.json();
      if (data.success) {
        showToast("Feedback marked as resolved", "success");
        this.closeDetail();
        this.loadFeedback();
      } else {
        showToast(data.message || "Failed to resolve feedback", "error");
      }
    } catch (e) {
      showToast("Could not connect to server", "error");
    }
  },

  async deleteCurrentFeedback() {
    if (!this.currentFeedbackId) return;
    if (!confirm("Are you sure you want to delete this feedback report?")) return;
    try {
      const resp = await fetch(
        getApiBaseUrl() + "/api/feedback/" + this.currentFeedbackId,
        { method: "DELETE" },
      );
      const data = await resp.json();
      if (data.success) {
        showToast("Feedback deleted successfully", "success");
        this.closeDetail();
        this.loadFeedback();
      } else {
        showToast(data.message || "Failed to delete feedback", "error");
      }
    } catch (e) {
      showToast("Could not connect to server", "error");
    }
  },
};

function toggleFeedbackPanel(show) {
  if (show) window.location.hash = '#/feedback';
  else window.location.hash = '#/live-map';
}

// =========================================
// Students Manager
// =========================================
const StudentsManager = {
  allStudents: [],

  async loadStudents() {
    const tableBody = document.getElementById("studentsTableBody");
    if (!tableBody) return;

    // Show loading state
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:48px 20px; color:var(--text-secondary);">Loading registered students...</td></tr>`;

    try {
      let response;
      const adminBaseUrl = (typeof getAdminApiBaseUrl === 'function' ? getAdminApiBaseUrl() : '') || getApiBaseUrl();
      try {
        response = await fetch(`${adminBaseUrl}/api/admin/students`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
      } catch (e1) {
        response = null;
      }

      if (!response || !response.ok) {
        try {
          response = await fetch(`/api/admin/students`, {
            cache: "no-store",
            headers: { "Cache-Control": "no-cache" },
          });
        } catch (e2) {
          response = null;
        }
      }

      if (!response || !response.ok) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:40px; color:var(--text-secondary);">Failed to load student directory</td></tr>`;
        return;
      }

      const data = await response.json();

      if (data.success && data.students) {
        this.allStudents = data.students;
        this.updateStats();
        this.renderStudents(this.allStudents);
        console.log(`[Students] Loaded ${data.total} students`);

        // Attach search handler (only once)
        const searchInput = document.getElementById("studentSearchInput");
        if (searchInput && !searchInput._listenerAttached) {
          searchInput.addEventListener("input", (e) => {
            this.filterStudents(e.target.value);
          });
          searchInput._listenerAttached = true;
        }
      } else {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:40px; color:var(--text-secondary);">Failed to load student directory</td></tr>`;
      }
    } catch (error) {
      console.error("[Students] Error loading students:", error);
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:40px; color:var(--text-secondary);">Error loading students. Check server connection.</td></tr>`;
    }
  },

  updateStats() {
    const total = this.allStudents.length;
    const verified = this.allStudents.filter((s) => s.phoneVerified).length;
    const assignedStops = this.allStudents.filter((s) => s.savedBusStop && s.savedBusStop !== "Not set").length;

    const countEl = document.getElementById("studentsTotalCount");
    const verifiedEl = document.getElementById("statVerifiedStudents");
    const stopsEl = document.getElementById("statAssignedBusStops");

    if (countEl) countEl.textContent = total;
    if (verifiedEl) verifiedEl.textContent = verified;
    if (stopsEl) stopsEl.textContent = assignedStops;
  },

  renderStudents(students) {
    const tableBody = document.getElementById("studentsTableBody");
    if (!tableBody) return;

    if (students.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:48px 20px;">
            <div style="font-size:2.5rem; margin-bottom:12px;">🎓</div>
            <h3 style="color:var(--text-dark); font-size:1.1rem; font-weight:700; margin-bottom:4px;">No students found</h3>
            <p style="color:var(--text-secondary); font-size:0.85rem;">No student accounts match your search query.</p>
          </td>
        </tr>`;
      return;
    }

    tableBody.innerHTML = students.map((student) => {
      const statusBadge = student.phoneVerified
        ? `<span class="route-badge-new" style="background:#ecfdf5; color:#047857; border-color:#a7f3d0;"><span class="dot-online" style="background:#10b981;"></span> Verified</span>`
        : `<span class="route-badge-new" style="background:#fef2f2; color:#b91c1c; border-color:#fecaca;">Unverified</span>`;

      return `
      <tr style="cursor: pointer;" onclick="StudentsManager.openStudentDetails(${student.id})">
        <td data-label="Name"><strong style="color:var(--text-dark); font-size:0.92rem;">${this.escapeHtml(student.name || 'N/A')}</strong></td>
        <td data-label="Student ID"><span class="bus-number-badge" style="background:#f1f5f9; color:#334155; border-color:#cbd5e1;">${this.escapeHtml(student.username || 'N/A')}</span></td>
        <td data-label="Email" style="color:var(--text-secondary); font-size:0.85rem;">${this.escapeHtml(student.email || 'N/A')}</td>
        <td data-label="Phone" style="font-weight:600; color:#475569; font-size:0.85rem;">${this.escapeHtml(student.phoneNumber || 'N/A')}</td>
        <td data-label="Bus Stop">
          <span style="display:inline-flex; align-items:center; gap:4px; font-weight:600; color:var(--primary);">
            📍 ${this.escapeHtml(student.savedBusStop || 'Not set')}
          </span>
        </td>
        <td data-label="Status">${statusBadge}</td>
        <td data-label="Action" style="text-align:right;">
          <button class="action-btn info" onclick="event.stopPropagation(); StudentsManager.openStudentDetails(${student.id});">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Profile
          </button>
        </td>
      </tr>
    `;
    }).join("");
  },

  filterStudents(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
      this.renderStudents(this.allStudents);
      this.updateStats();
      return;
    }

    const filtered = this.allStudents.filter((student) => {
      const name = (student.name || "").toLowerCase();
      const username = (student.username || "").toLowerCase();
      const email = (student.email || "").toLowerCase();
      const busStop = (student.savedBusStop || "").toLowerCase();
      const phone = (student.phoneNumber || "").toLowerCase();
      return name.includes(q) || username.includes(q) || email.includes(q) || busStop.includes(q) || phone.includes(q);
    });

    this.renderStudents(filtered);
    const countEl = document.getElementById("studentsTotalCount");
    if (countEl) countEl.textContent = filtered.length;
  },

  openStudentDetails(id) {
    const student = this.allStudents.find((s) => s.id === id);
    if (!student) return;

    let busNumber = "N/A";
    let routeName = "N/A";

    // Cross reference bus/route if savedBusStop is set
    if (student.savedBusStop && window.adminState && window.adminState.buses) {
      for (const [_, bus] of window.adminState.buses.entries()) {
        if (bus.busStop && bus.busStop.toLowerCase().includes(student.savedBusStop.toLowerCase())) {
          busNumber = bus.busNumber || "N/A";
          routeName = bus.busName || "N/A";
          break;
        }
      }
    }

    const setField = (elemId, val) => {
      const el = document.getElementById(elemId);
      if (el) el.textContent = val || "N/A";
    };

    setField("sdName", student.name);
    setField("sdStudentId", student.username);
    setField("sdEmail", student.email);
    setField("sdPhone", student.phoneNumber);
    setField("sdBusStop", student.savedBusStop || "Not set");
    setField("sdBusNumber", busNumber);
    setField("sdRoute", routeName);
    setField("sdDepartment", "N/A");
    setField("sdYearSemester", "N/A");

    const statusEl = document.getElementById("sdStatus");
    if (statusEl) {
      statusEl.textContent = student.phoneVerified ? "Verified" : "Unverified";
      statusEl.className = `status-badge ${student.phoneVerified ? "active" : "inactive"}`;
    }

    const modal = document.getElementById("studentDetailModal");
    if (modal) {
      modal.style.display = "flex";
    }
  },

  closeStudentDetails() {
    const modal = document.getElementById("studentDetailModal");
    if (modal) {
      modal.style.display = "none";
    }
  },

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
};

// =========================================
// Guest Access Code Management
// =========================================

let guestTimerInterval = null;

function getAdminApiBaseUrl() {
  const host = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;

  // Capacitor Support: Default to production URL for native platforms
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    return "https://bus-tracking-master-production-2d22.up.railway.app";
  }

  if (host.includes("railway.app")) return "";
  if (host.includes(".devtunnels.ms")) {
    const tunnelMatch = host.match(/^([^-]+)-\d+\.(.+)$/);
    if (tunnelMatch)
      return `${protocol}//${tunnelMatch[1]}-8080.${tunnelMatch[2]}`;
  }
  if (port && port !== "80" && port !== "443")
    return `${protocol}//${host}:${port}`;
  return "";
}

async function loadGuestCode() {
  try {
    const apiUrl = getAdminApiBaseUrl() + "/api/guest/code";
    console.log("[GuestAccess] Loading from:", apiUrl);

    const response = await fetch(apiUrl);
    console.log("[GuestAccess] Response status:", response.status);

    const data = await response.json();
    console.log("[GuestAccess] Response data:", data);

    if (data.success) {
      updateGuestCodeUI(data.code, data.expiresAt);
      console.log("[GuestAccess] Code loaded successfully:", data.code);
      updateDebugStatus("Guest code loaded: " + data.code, "success");
    } else {
      console.error("[GuestAccess] API returned failure:", data);
      updateDebugStatus("Guest code failed to load", "error");
    }
  } catch (error) {
    console.error("[GuestAccess] Failed to load guest code:", error);
    updateDebugStatus("Guest code error: " + error.message, "error");
  }
}

async function regenerateGuestCode() {
  const btn = document.getElementById("guestRegenerateBtn");
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = "0.6";
  }

  try {
    const response = await fetch(
      getAdminApiBaseUrl() + "/api/guest/regenerate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
    );
    const data = await response.json();
    if (data.success) {
      updateGuestCodeUI(data.code, data.expiresAt);
      showAdminToast("Guest code regenerated", "success");
    } else {
      showAdminToast("Failed to regenerate code", "error");
    }
  } catch (error) {
    console.error("[GuestAccess] Regeneration failed:", error);
    showAdminToast("Connection error", "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = "1";
    }
  }
}

function updateGuestCodeUI(code, expiresAtStr) {
  const codeEl = document.getElementById("guestCodeDisplay");
  const timerEl = document.getElementById("guestCodeTimer");

  if (codeEl) codeEl.textContent = code;

  // Start countdown timer
  if (guestTimerInterval) clearInterval(guestTimerInterval);

  const expiresAt = new Date(expiresAtStr);

  function updateTimer() {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();

    if (diff <= 0) {
      if (timerEl) timerEl.textContent = "Expired";
      clearInterval(guestTimerInterval);
      // Auto-reload after expiry
      setTimeout(loadGuestCode, 2000);
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (timerEl) timerEl.textContent = `${hours}h ${minutes}m`;
  }

  updateTimer();
  guestTimerInterval = setInterval(updateTimer, 60000); // Update every minute
}

function showAdminToast(message, type) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type || "info"}`;
  toast.textContent = message;
  toast.style.cssText =
    "padding:12px 20px;background:" +
    (type === "success"
      ? "#10b981"
      : type === "error"
        ? "#ef4444"
        : "#3b82f6") +
    ";color:white;border-radius:10px;font-size:0.85rem;font-weight:500;box-shadow:0 4px 15px rgba(0,0,0,0.15);animation:slideUp 0.3s ease-out;margin-bottom:8px;";
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function handleAdminLogoutOnClose() {
  // Optional cleanup on unload
}

// Load guest code on page init
// Logout when user closes browser/tab
window.addEventListener("beforeunload", handleAdminLogoutOnClose);
window.addEventListener("unload", handleAdminLogoutOnClose);

document.addEventListener("DOMContentLoaded", () => {
  loadGuestCode();
});
