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
// Panel Manager (Replaces TabManager)
// =========================================
const PanelManager = {
  init() {
    DOM.tabBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const target = btn.dataset.tab;
        if (target === "map") {
          this.closeAllPanels();
        } else if (target === "buses") {
          this.togglePanel("buses");
        } else if (target === "routes") {
          this.togglePanel("routes");
        } else if (target === "export") {
          this.togglePanel("export");
        } else if (target === "feedback") {
          this.togglePanel("feedback");
        } else if (target === "profile") {
          this.togglePanel("profile");
        }
      });
    });

    // Back button in route details
    DOM.routeDetailsBackBtn?.addEventListener("click", () => {
      this.togglePanel("routes");
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
    if (panelName === "buses" && DOM.busesPanel) {
      DOM.busesPanel.classList.add("visible");
      this.updateActiveTab("buses");
    } else if (panelName === "routes" && DOM.routesPanel) {
      DOM.routesPanel.classList.add("visible");
      this.updateActiveTab("routes");
      RouteManager.renderRoutes();
    } else if (panelName === "route-details" && DOM.routeDetailsPanel) {
      DOM.routeDetailsPanel.classList.add("visible");
      this.updateActiveTab("routes");
    } else if (panelName === "export" && DOM.exportPanel) {
      DOM.exportPanel.classList.add("visible");
      this.updateActiveTab("export");
    } else if (panelName === "feedback") {
      const fp = document.getElementById("feedbackView");
      if (fp) {
        fp.classList.add("visible");
        this.updateActiveTab("feedback");
        FeedbackManager.loadFeedback();
      }
    } else if (panelName === "profile") {
      const pp = document.getElementById("profileView");
      if (pp) {
        pp.classList.add("visible");
        this.updateActiveTab("profile");
        loadAdminProfile();
      }
    }

    adminState.activePanel = panelName;
  },

  closeAllPanels() {
    const bp = DOM.busesPanel;
    const ep = DOM.exportPanel;
    const rp = DOM.routesPanel;
    const rdp = DOM.routeDetailsPanel;
    const fp = document.getElementById("feedbackView");
    const pp = document.getElementById("profileView");
    if (bp) bp.classList.remove("visible");
    if (ep) ep.classList.remove("visible");
    if (rp) rp.classList.remove("visible");
    if (rdp) rdp.classList.remove("visible");
    if (fp) fp.classList.remove("visible");
    if (pp) pp.classList.remove("visible");

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
// Mobile Menu Tab Click Handler
// =========================================
function mobileMenuTabClick(tabName) {
  // Close the mobile menu
  const menu = document.getElementById("mobileMenu");
  const header = document.querySelector(".admin-header");
  if (menu) menu.classList.remove("open");
  if (header) header.classList.remove("menu-open");

  // Toggle the panel
  PanelManager.togglePanel(tabName);

  // Update active tab in mobile menu
  const menuItems = document.querySelectorAll(".mobile-menu-item");
  menuItems.forEach((item) => {
    if (item.dataset.tab === tabName) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
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

  // --- Driver Info Modal Logic ---

  openDriverInfoModal(driverId, driverName, driverPhone) {
    if (!driverId || driverId === "undefined" || driverId === "null") {
      showToast("No driver associated with this bus.", "warning");
      return;
    }

    this.currentDriverId = driverId;
    document.getElementById("infoDriverName").textContent =
      driverName || "Unknown";
    document.getElementById("infoDriverPhone").textContent =
      driverPhone || "N/A";

    document.getElementById("adminDriverBusModal").style.display = "flex";

    // Hide form by default
    document.getElementById("driverAddBusForm").style.display = "none";

    // Fetch buses for this driver
    this.fetchDriverBuses(driverId);
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

  handleBusData(buses) {
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
      MapManager.updateBusMarker(bus);
    });

    // Remove buses that are no longer reported by the server (disconnected/stopped)
    for (const [busId] of adminState.buses) {
      if (!currentBusIds.has(busId)) {
        console.log(`[BusManager] Removing disconnected bus: ${busId}`);
        adminState.buses.delete(busId);
        // Remove marker from map
        const marker = MapManager.markers.get(busId);
        if (marker) {
          marker.remove();
          MapManager.markers.delete(busId);
        }
        // Close info panel if this bus was selected
        if (adminState.selectedBusId === busId) {
          MapManager.closeInfoPanel();
        }
      }
    }

    DOM.activeBusCount.textContent = activeCount;
    if (DOM.totalBuses) DOM.totalBuses.textContent = adminState.buses.size;

    this.renderBusesTable();

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

    if (DOM.totalRoutes) DOM.totalRoutes.textContent = routes.length;

    if (routes.length === 0) {
      DOM.routesListContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #999; background: rgba(0,0,0,0.02); border-radius: 12px;">
          <div style="font-size: 2rem; margin-bottom: 8px;">📍</div>
          ${query ? "No routes matching your search" : "No routes available"}
        </div>`;
      return;
    }

    DOM.routesListContainer.innerHTML = routes
      .map(
        (route) => `
      <div class="route-item" onclick="RouteManager.showRouteDetails('${route.name.replace(/'/g, "\\\\'")}')" 
           style="background: white; padding: 16px 20px; border-radius: 16px; border: 1px solid rgba(0,0,0,0.05); cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 40px; height: 40px; background: rgba(30, 64, 175, 0.1); color: var(--secondary, #1e40af); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
            🗺️
          </div>
          <div>
            <div style="font-weight: 700; color: #1f2937; font-size: 1.05rem;">${route.name}</div>
            <div style="font-size: 0.85rem; color: #6b7280; font-weight: 500;">Service Route</div>
          </div>
        </div>
        <div style="background: rgba(30, 64, 175, 0.08); color: var(--secondary, #1e40af); padding: 6px 14px; border-radius: 999px; font-size: 0.85rem; font-weight: 700;">
          ${route.busCount} ${route.busCount === 1 ? "bus" : "buses"}
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

    PanelManager.togglePanel("route-details");
  },
};

function toggleRoutesPanel(show) {
  if (show === false) PanelManager.closeAllPanels();
  else PanelManager.togglePanel("routes");
}

function toggleRouteDetailsPanel(show) {
  if (show === false) PanelManager.togglePanel("routes");
  else PanelManager.togglePanel("route-details");
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
            BusManager.handleBusData(data.buses);
          } else if (data.action === "START" && data.busNumber) {
            // Driver selected a bus and started tracking - immediately mark it as Active
            console.log(
              `[WS] Driver started tracking bus ${data.busNumber} (${data.busName})`,
            );
            const busId = String(data.busNumber);
            
            // IMPORTANT: When ONE bus is selected, ALL other buses must be marked offline
            // Clear Active status from all buses first
            adminState.buses.forEach((bus, id) => {
              if (id !== busId) {
                bus.gpsOn = false; // Mark all OTHER buses as Offline
              }
            });
            
            if (adminState.buses.has(busId)) {
              const bus = adminState.buses.get(busId);
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
              // Bus not in cache - fetch fresh data from server
              console.log(
                `[WS] Bus ${busId} not in cache, fetching fresh data from server`,
              );
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
      const response = await fetch(url, { cache: "reload" });
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
function updateConnectionBadge(isConnected, customText) {
  const badge = DOM.connectionBadge;
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

  DOM.toastContainer.appendChild(toast);
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
        sessionStorage.removeItem("admin");
        sessionStorage.removeItem("adminEmail");

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
  if (show) PanelManager.togglePanel("buses");
  else PanelManager.closeAllPanels();
}

function toggleExportPanel(show) {
  if (show) PanelManager.togglePanel("export");
  else PanelManager.closeAllPanels();
}

function toggleProfilePanel(show) {
  if (show) PanelManager.togglePanel("profile");
  else PanelManager.closeAllPanels();
}

function mobileMenuTabClick(tabName) {
  if (tabName === "profile") {
    PanelManager.togglePanel("profile");
  } else {
    PanelManager.togglePanel(tabName);
  }
}

function loadAdminProfile() {
  const adminData = JSON.parse(sessionStorage.getItem("admin"));
  if (adminData) {
    document.getElementById("profileName").textContent =
      adminData.name || "Admin";
    document.getElementById("adminEmail").value = adminData.email || "";
  }
}

function updateAdminProfile() {
  const password = document.getElementById("adminPassword").value;

  // Simple validation and alert
  if (password) {
    alert("Profile updated and password changed successfully!");
  } else {
    alert("Profile updated successfully!");
  }

  // Close the panel
  PanelManager.closeAllPanels();
}

// =========================================
// Initialization
// =========================================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("[App] Initializing Admin Panel");
  updateDebugStatus("System: Initializing Components...");

  try {
    // Clear any stale bus data from previous sessions before displaying anything
    adminState.buses.clear();
    adminState.selectedBusId = null;

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

    // 3. Bus Manager & Route Manager
    updateDebugStatus("Step 3/5: Bus Logic...");
    BusManager.init();
    RouteManager.init();

    // 4. WebSocket & Auth
    updateDebugStatus("Step 4/5: Connecting...");
    WebSocketManager.init();
    await loadAccountCreationState();

    // 5. Default view is map
    updateDebugStatus("Ready!");

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
        document.getElementById("totalFeedback").textContent =
          this.allFeedback.length;
        this.applyFilter();
      }
    } catch (e) {
      console.error("[Feedback] Load error:", e);
    }
  },

  applyFilter() {
    const filter = document.getElementById("feedbackFilter").value;
    let list = this.allFeedback;
    if (filter !== "all") {
      list = list.filter((f) => f.status === filter);
    }
    this.renderTable(list);
  },

  renderTable(list) {
    const tbody = document.getElementById("feedbackTableBody");
    if (!tbody) return;
    if (list.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align:center;padding:30px;color:#94a3b8;">No feedback reports found</td></tr>';
      return;
    }
    tbody.innerHTML = list
      .map((f) => {
        const statusColor = f.status === "resolved" ? "#10b981" : "#f59e0b";
        const statusBg = f.status === "resolved" ? "#ecfdf5" : "#fef3c7";
        const time = f.createdAt
          ? new Date(f.createdAt).toLocaleString()
          : "--";
        return `<tr style="cursor:pointer;" onclick="FeedbackManager.openDetail(${f.id})">
        <td style="font-weight:600;">${f.busNumber || "--"}</td>
        <td>${f.routeName || "--"}</td>
        <td>${f.studentName || "--"}</td>
        <td><span style="padding:3px 10px;background:#fef3c7;color:#92400e;border-radius:20px;font-size:0.75rem;font-weight:600;">${f.issueType || "--"}</span></td>
        <td><span style="padding:3px 10px;background:${statusBg};color:${statusColor};border-radius:20px;font-size:0.75rem;font-weight:600;text-transform:capitalize;">${f.status}</span></td>
        <td style="font-size:0.8rem;color:#64748b;">${time}</td>
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
    document.getElementById("fdStudentName").textContent =
      f.studentName || "--";
    document.getElementById("fdStudentEmail").textContent =
      f.studentEmail || "--";
    document.getElementById("fdIssueType").textContent = f.issueType || "--";
    document.getElementById("fdMessage").textContent = f.message || "--";
    document.getElementById("fdCreatedAt").textContent = f.createdAt
      ? new Date(f.createdAt).toLocaleString()
      : "--";
    const resolveBtn = document.getElementById("fdResolveBtn");
    if (f.status === "resolved") {
      resolveBtn.style.background = "#94a3b8";
      resolveBtn.textContent = "\u2713 Already Resolved";
      resolveBtn.disabled = true;
    } else {
      resolveBtn.style.background = "#10b981";
      resolveBtn.textContent = "\u2713 Mark as Resolved";
      resolveBtn.disabled = false;
    }
    document.getElementById("feedbackDetailModal").style.display = "flex";
  },

  closeDetail() {
    document.getElementById("feedbackDetailModal").style.display = "none";
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
        this.closeDetail();
        this.loadFeedback();
      } else {
        alert(data.message || "Failed to resolve");
      }
    } catch (e) {
      alert("Could not connect to server");
    }
  },

  async deleteCurrentFeedback() {
    if (!this.currentFeedbackId) return;
    if (!confirm("Are you sure you want to delete this feedback?")) return;
    try {
      const resp = await fetch(
        getApiBaseUrl() + "/api/feedback/" + this.currentFeedbackId,
        { method: "DELETE" },
      );
      const data = await resp.json();
      if (data.success) {
        this.closeDetail();
        this.loadFeedback();
      } else {
        alert(data.message || "Failed to delete");
      }
    } catch (e) {
      alert("Could not connect to server");
    }
  },
};

function toggleFeedbackPanel(show) {
  const panel = document.getElementById("feedbackView");
  if (panel) {
    if (show) {
      panel.classList.add("visible");
      FeedbackManager.loadFeedback();
    } else {
      panel.classList.remove("visible");
      adminState.activePanel = null;
      PanelManager.updateActiveTab("map");
    }
  }
}

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
    return "https://bus-tracking-master-production.up.railway.app";
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

// Load guest code on page init
document.addEventListener("DOMContentLoaded", () => {
  loadGuestCode();
});
