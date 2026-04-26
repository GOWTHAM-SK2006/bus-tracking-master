/**
 * BusTrack Client - Real-Time Bus Tracking
 * Displays live bus locations on map from backend
 */

// =========================================
// Configuration
// =========================================
// Helper to detect WebSocket URL based on environment
function getWebSocketUrl(endpoint) {
  const host = window.location.hostname;
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const port = window.location.port;

  // Capacitor Support: Default to production URL
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    return `wss://bus-tracking-master-production.up.railway.app${endpoint}`;
  }

  // File protocol fallback - use production URL for Capacitor
  if (window.location.protocol === "file:") {
    return `wss://bus-tracking-master-production.up.railway.app${endpoint}`;
  }

  // VS Code Dev Tunnels
  if (host.includes(".devtunnels.ms")) {
    const tunnelMatch = host.match(/^([^-]+)-\d+\.(.+)$/);
    if (tunnelMatch) {
      return `${protocol}//${tunnelMatch[1]}-8080.${tunnelMatch[2]}${endpoint}`;
    }
  }

  // Standard production ports or specified ports
  if (port && port !== "80" && port !== "443") {
    return `${protocol}//${host}:${port}${endpoint}`;
  }

  return `${protocol}//${host}${endpoint}`;
}

function getApiBaseUrl() {
  const host = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;

  // Capacitor Support: Default to production URL
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    return "https://bus-tracking-master-production.up.railway.app";
  }

  // File protocol fallback - use production URL for Capacitor
  if (window.location.protocol === "file:") {
    return "https://bus-tracking-master-production.up.railway.app";
  }

  // VS Code Dev Tunnels
  if (host.includes(".devtunnels.ms")) {
    const tunnelMatch = host.match(/^([^-]+)-\d+\.(.+)$/);
    if (tunnelMatch) {
      return `${protocol}//${tunnelMatch[1]}-8080.${tunnelMatch[2]}`;
    }
  }

  if (port && port !== "80" && port !== "443") {
    return `${protocol}//${host}:${port}`;
  }

  return `${protocol}//${host}`;
}

const CONFIG = {
  // API - Dynamically detects Dev Tunnels or localhost
  WS_URL: (() => {
    const url = getWebSocketUrl("/ws/user");
    console.log("[CONFIG] Client WS_URL:", url);
    return url;
  })(),

  // MapTiler Configuration
  MAPTILER_API_KEY: "qT5xViuAuUmEXe01G0oI",
  MAPTILER_STYLE_URL:
    "https://api.maptiler.com/maps/019bfffb-7613-7306-82a6-88f9659c6bff/style.json",
  MAPTILER_DARK_STYLE_URL:
    "https://api.maptiler.com/maps/darkmatter/style.json",

  // Map Defaults
  MAP_CENTER: [80.2707, 13.0827], // [lng, lat]
  MAP_ZOOM: 12,
  MAP_MIN_ZOOM: 10,
  MAP_MAX_ZOOM: 18,
  ANIMATION_DURATION: 100,
  SEARCH_DEBOUNCE: 300,

  WEBSOCKET_ENABLED: true,
  DEMO_MODE: false,
  UPDATE_INTERVAL: 2000, // Reduce polling frequency for performance
  STALE_THRESHOLD: 5000, // 5 seconds of no data = Inactive
  RECONNECT_TIMEOUT: 5000,
  RECONNECT_MAX_ATTEMPTS: Infinity, // Never stop retrying — WhatsApp-style
};

// =========================================
// State
// =========================================
const state = {
  buses: new Map(),
  stops: new Map(),
  selectedBusId: null,
  isConnected: false,
  reconnectAttempts: 0,
  pollingInterval: null,
  searchFilter: "", // Added for global filtering
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
// DOM Elements
// =========================================
const DOM = {
  // Welcome Modal
  welcomeSearchModal: document.getElementById("welcomeSearchModal"),
  welcomeSearchForm: document.getElementById("welcomeSearchForm"),
  welcomeSearchInput: document.getElementById("welcomeSearchInput"),
  welcomeSearchDropdown: document.getElementById("welcomeSearchDropdown"),
  welcomeSearchDropdownContent: document.getElementById(
    "welcomeSearchDropdownContent",
  ),

  // Header
  searchInput: document.getElementById("searchInput"),
  searchClear: document.getElementById("searchClear"),
  searchDropdown: document.getElementById("searchDropdown"),
  searchDropdownContent: document.getElementById("searchDropdownContent"),
  connectionBadge: document.getElementById("connectionBadge"),
  mobileMenuBtn: document.getElementById("mobileMenuBtn"),
  // Profile Elements (Adding these back)
  usernameDisplay: document.getElementById("usernameDisplay"),
  logoutBtn: document.getElementById("logoutBtn"),

  // Map Controls
  // Removed traffic and route toggles

  // Tabs
  tabBtns: document.querySelectorAll(".bottom-nav-btn"),
  tabContents: document.querySelectorAll(".tab-content"),

  // Map
  mapContainer: document.getElementById("map"),
  activeBusCount: document.getElementById("activeBusCount"),
  busInfoPanel: document.getElementById("busInfoPanel"),
  panelCloseBtn: document.getElementById("panelCloseBtn"),

  // Panel
  panelBusNo: document.getElementById("panelBusNo"),
  panelBusName: document.getElementById("panelBusName"),
  panelBusRoute: document.getElementById("panelBusRoute"),
  panelLocation: document.getElementById("panelLocation"),
  panelDriver: document.getElementById("panelDriver"),
  panelPhone: document.getElementById("panelPhone"),
  panelEtaContainer: document.getElementById("panelEtaContainer"),
  panelDistance: document.getElementById("panelDistance"),
  panelEta: document.getElementById("panelEta"),
  panelSpeed: document.getElementById("panelSpeed"),

  // Lists
  busGrid: document.getElementById("busGrid"),
  totalBuses: document.getElementById("totalBuses"),
  busesEmpty: document.getElementById("busesEmpty"),

  // Loading
  loadingScreen: document.getElementById("loadingScreen"),
  toastContainer: document.getElementById("toastContainer"),
};

// =========================================
// Map Manager
// =========================================
const MapManager = {
  map: null,
  markers: new Map(),
  isNavigating: false,
  navTimeout: null,
  lockTimeout: null,
  selectedStopMarker: null,

  // Smooth Animation State
  animationTargets: new Map(), // Stores target positions for each bus
  animationLoopId: null, // RequestAnimationFrame ID

  // Route definitions removed

  init() {
    console.log("[Map] Initializing MapTiler SDK...");

    // MapTiler SDK Initialization
    maptilersdk.config.apiKey = CONFIG.MAPTILER_API_KEY;

    // Determine initial style based on theme
    const currentTheme = localStorage.getItem("theme") || "light";
    const initialStyle =
      currentTheme === "dark"
        ? `${CONFIG.MAPTILER_DARK_STYLE_URL}?key=${CONFIG.MAPTILER_API_KEY}`
        : CONFIG.MAPTILER_STYLE_URL;

    this.map = new maptilersdk.Map({
      container: DOM.mapContainer,
      style: initialStyle,
      center: CONFIG.MAP_CENTER, // [lng, lat]
      zoom: CONFIG.MAP_ZOOM,
      minZoom: CONFIG.MAP_MIN_ZOOM,
      maxZoom: CONFIG.MAP_MAX_ZOOM,
      fadeDuration: 0,
      renderWorldCopies: false,
      attributionControl: false,
      touchPitch: false,
      maxTileCacheSize: 200,
      refreshExpiredTiles: false,
    });

    // Add navigation controls
    this.map.addControl(new maptilersdk.NavigationControl(), "top-right");

    // Ensure animation loop is killed on re-init
    if (this.animationLoopId) {
      cancelAnimationFrame(this.animationLoopId);
    }
    this.startAnimationLoop();

    console.log("[Map] MapTiler SDK Map Initialized");

    // Load saved stop if exists
    this.loadSavedStop();
  },

  loadSavedStop() {
    const savedStop = localStorage.getItem("userSavedStop");
    if (savedStop) {
      try {
        const stop = JSON.parse(savedStop);
        this.updateSavedStopMarker(stop.lng, stop.lat);
      } catch (e) {
        console.error("[Map] Failed to load saved stop:", e);
      }
    }
  },

  updateSavedStopMarker(lng, lat) {
    if (this.selectedStopMarker) {
      this.selectedStopMarker.remove();
    }

    const el = document.createElement("div");
    el.className = "saved-stop-marker";
    el.innerHTML = `
      <div class="stop-marker-ring"></div>
      <div class="stop-marker-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </div>
      <div class="stop-marker-label">My Stop</div>
    `;

    this.selectedStopMarker = new maptilersdk.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(this.map);

    console.log(`[Map] Saved stop marker placed at ${lng}, ${lat}`);
  },

  removeSavedStopMarker() {
    if (this.selectedStopMarker) {
      this.selectedStopMarker.remove();
      this.selectedStopMarker = null;
    }
  },

  createBusElement(bus, isSelected = false) {
    const el = document.createElement("div");
    this.updateMarkerElement(el, bus, isSelected);

    // Click handler on the ROOT element of the marker
    el.addEventListener("click", (e) => {
      console.log(`[Map] Marker Root clicked! Bus: ${bus.busNo}`);
      e.stopPropagation(); // Stop from reaching map
      this.selectBus(bus.busId || bus.busNo);
    });

    return el;
  },

  // Update marker element IN-PLACE (preserves TomTom's DOM reference)
  updateMarkerElement(el, bus, isSelected) {
    const statusClass = bus.gpsOn ? "status-active" : "status-inactive";
    el.className = `bus-marker-container ${statusClass} ${isSelected ? "selected" : ""}`;
    el.dataset.busId = String(bus.busId || bus.busNo);
    el.innerHTML = `
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
        `;
  },

  async updateBusMarker(bus) {
    const busId = String(bus.busId || bus.busNo);
    const isSelected = String(state.selectedBusId) === busId;
    const isGpsOn = bus.gpsOn;

    const latitude = parseFloat(
      bus.latitude !== undefined ? bus.latitude : bus.lastLat,
    );
    const longitude = parseFloat(
      bus.longitude !== undefined ? bus.longitude : bus.lastLng,
    );

    if (
      isNaN(latitude) ||
      isNaN(longitude) ||
      (latitude === 0 && longitude === 0)
    ) {
      return;
    }

    let marker = this.markers.get(busId);

    if (!marker) {
      console.log(`[Map] Creating NEW marker for bus ${busId}`);

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

      // Initialize animation state for new marker
      this.animationTargets.set(busId, {
        startLngLat: [longitude, latitude],
        targetLngLat: [longitude, latitude],
        startTime: performance.now(),
        duration: 1100, // 1.1s (Matches 1s update rate + buffer)
      });

      // Start loop if not running
      if (!this.animationLoopId) {
        this.startAnimationLoop();
      }
    } else {
      const prevGpsOn = marker.prevGpsOn;

      // Update icon if state changed
      if (marker.currentIsSelected !== isSelected || prevGpsOn !== isGpsOn) {
        const el = marker.getElement();
        el.innerHTML = this.createMarkerHTML(bus, isSelected);
        marker.currentIsSelected = isSelected;
        marker.prevGpsOn = isGpsOn;
      }

      marker.busData = bus;
    }

    // Set new target for animation
    const currentTarget = this.animationTargets.get(busId);
    if (currentTarget) {
      // Only update target if changed significantly to avoid jitter
      const targetLng = currentTarget.targetLngLat[0];
      const targetLat = currentTarget.targetLngLat[1];

      if (targetLng !== longitude || targetLat !== latitude) {
        // Use current ACTUAL position as start, not old target
        // This prevents "jumping" if the previous animation wasn't finished
        const currentPos = marker.getLngLat();

        this.animationTargets.set(busId, {
          startLngLat: [currentPos.lng, currentPos.lat],
          targetLngLat: [longitude, latitude],
          startTime: performance.now(),
          duration: 1100, // 1.1s interpolation
        });
      }
    }
  },

  // =========================================
  // Smooth Animation Loop
  // =========================================
  startAnimationLoop() {
    const animate = () => {
      this.interpolateMarkers();
      this.animationLoopId = requestAnimationFrame(animate);
    };
    this.animationLoopId = requestAnimationFrame(animate);
    console.log("[Map] Animation loop started");
  },

  interpolateMarkers() {
    const now = performance.now();
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    this.animationTargets.forEach((anim, busId) => {
      const marker = this.markers.get(busId);
      if (!marker) return;

      const elapsed = now - anim.startTime;
      let progress = Math.min(elapsed / anim.duration, 1);

      // Apply easing
      const eased = easeOutCubic(progress);

      const startLng = anim.startLngLat[0];
      const startLat = anim.startLngLat[1];
      const targetLng = anim.targetLngLat[0];
      const targetLat = anim.targetLngLat[1];

      // Interpolate
      const newLng = startLng + (targetLng - startLng) * eased;
      const newLat = startLat + (targetLat - startLat) * eased;

      // Update marker position
      marker.setLngLat([newLng, newLat]);

      // Camera follow if selected and tracking
      if (
        state.selectedBusId === busId &&
        !this.isNavigating &&
        state.isConnected
      ) {
        // Smooth pan only if distance is small
        this.map.easeTo({
          center: [newLng, newLat],
          duration: 0, // Instant update for camera frame
          essential: true,
        });
      }

      // Cleanup separate entries if done (optional optimization,
      // but keeping them map-based is fine for <100 buses)
    });
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

  createPopupContent(bus) {
    const stopsHtml =
      bus.stops && bus.stops.length > 0
        ? bus.stops.slice(0, 3).join(" → ") +
        (bus.stops.length > 3 ? "..." : "")
        : "No stops";

    return `
            <div style="min-width: 160px; font-family: 'Poppins', sans-serif;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="background: #1e88e5; color: white; padding: 4px 10px; border-radius: 6px; font-weight: 600;">
                        ${bus.busNo}
                    </span>
                </div>
                <div style="font-weight: 500; margin-bottom: 4px; color: #333;">${bus.busName}</div>
                <div style="font-size: 0.8rem; color: #666;">${stopsHtml}</div>
            </div>
        `;
  },

  animateMarker(marker, targetLng, targetLat, duration) {
    // Guard against null/NaN coordinates
    if (
      typeof targetLng !== "number" ||
      typeof targetLat !== "number" ||
      isNaN(targetLng) ||
      isNaN(targetLat)
    ) {
      console.warn("[Map] animateMarker skipped - invalid target coordinates");
      return;
    }

    const startPos = marker.getLatLng();
    if (!startPos) return;

    const startLat = startPos.lat;
    const startLng = startPos.lng;

    if (typeof startLat !== "number" || typeof startLng !== "number") return;

    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const linearProgress = progress;

      const newLat = startLat + (targetLat - startLat) * linearProgress;
      const newLng = startLng + (targetLng - startLng) * linearProgress;

      // Final null check before setLngLat
      if (!isNaN(newLng) && !isNaN(newLat)) {
        marker.setLngLat([newLng, newLat]);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  },

  async selectBus(busId) {
    if (!busId) return;
    const id = String(busId);
    console.log(`[Map] selectBus triggered for: ${id}`);

    // 1. Deselect previous marker
    if (state.selectedBusId && this.markers.has(String(state.selectedBusId))) {
      const prevMarker = this.markers.get(String(state.selectedBusId));
      if (prevMarker) {
        prevMarker.currentIsSelected = false;
        try {
          const el = prevMarker.getElement();
          if (el) {
            el.innerHTML = this.createMarkerHTML(prevMarker.busData, false);
          }
        } catch (e) {
          console.warn("[Map] Error updating previous marker:", e);
        }
      }
    }

    state.selectedBusId = id;

    // 2. Identify Target Data
    const marker = this.markers.get(id);
    const busData = marker
      ? marker.busData
      : state.buses.get(id) ||
      Array.from(state.buses.values()).find((b) => String(b.busId) === id);

    if (!busData) {
      console.error(
        `[Map] Bus data not found for ID: ${id}. Available:`,
        Array.from(state.buses.keys()),
      );
      return;
    }

    // 3. Handle Tab Switch
    const mapView = document.getElementById("mapView");
    const isMapVisible = mapView && mapView.classList.contains("active");

    if (!isMapVisible) {
      console.log("[Map] Switching to map tab for selection");
      TabManager.switchTab("map");
    }

    // 4. Update Panel (Immediate)
    this.updatePanel(busData);
    DOM.busInfoPanel.classList.add("active");

    // 5. Navigate Map (With Sync Delay)
    const delay = isMapVisible ? 50 : 350;

    if (marker) {
      const freshBus = state.buses.get(id) || busData;
      console.log(`[Map] Found marker for ${id}, flying to it...`);
      marker.currentIsSelected = true;

      // Update marker style
      try {
        const el = marker.getElement();
        el.innerHTML = this.createMarkerHTML(freshBus, true);
      } catch (e) {
        console.warn("[Map] Error updating marker selection style:", e);
      }

      this.navTimeout = setTimeout(() => {
        this.isNavigating = true;
        this.map.resize();

        // Validate Coordinates
        if (
          typeof freshBus.latitude !== "number" ||
          typeof freshBus.longitude !== "number" ||
          (Math.abs(freshBus.latitude) < 0.0001 &&
            Math.abs(freshBus.longitude) < 0.0001)
        ) {
          console.warn(
            "[Map] GPS coordinates are unavailable. Aborting FlyTo.",
          );
          this.isNavigating = false;
          return;
        }

        // MapTiler flyTo
        console.log(
          `[Map] Starting flyTo navigation to [${freshBus.longitude}, ${freshBus.latitude}]`,
        );

        this.map.flyTo({
          center: [freshBus.longitude, freshBus.latitude],
          zoom: 16.5,
          duration: 2000,
        });

        this.lockTimeout = setTimeout(() => {
          this.isNavigating = false;
          console.log("[Map] Navigation lock released");
        }, 2100);
      }, delay);
    } else {
      // Fallback if no marker (shouldn't happen often if data exists)
      if (
        busData.latitude &&
        busData.longitude &&
        Math.abs(busData.latitude) > 0.0001
      ) {
        this.navTimeout = setTimeout(() => {
          this.isNavigating = true;
          this.map.resize();
          this.map.flyTo({
            center: [busData.longitude, busData.latitude],
            zoom: 16.5,
            duration: 2000,
          });

          this.lockTimeout = setTimeout(() => {
            this.isNavigating = false;
          }, 2100);
        }, delay);
      }
    }
  },

  async updatePanel(bus) {
    console.log(`[Map] Updating panel for bus: ${bus.busNo}`, bus);

    // Skip update if panel is not visible
    if (!DOM.busInfoPanel || !DOM.busInfoPanel.classList.contains("active")) {
      return;
    }

    // Badge = Bus Number, Title = Bus Name (Standard Layout)
    DOM.panelBusNo.textContent = bus.busNo;
    DOM.panelBusName.textContent = bus.busName || `Bus ${bus.busNo}`;
    DOM.panelBusRoute.textContent = `Route: ${bus.routeName || "Unknown"}`;

    // Update status in panel
    const statusEl = DOM.busInfoPanel.querySelector(".bus-status");
    if (statusEl) {
      if (bus.gpsOn) {
        statusEl.style.color = "var(--success)";
        statusEl.innerHTML =
          '<span class="status-dot" style="background: var(--success)"></span>Online';
      } else {
        statusEl.style.color = "var(--danger)";
        statusEl.innerHTML =
          '<span class="status-dot" style="background: var(--danger)"></span>Offline';
      }
    }

    // Update Travel Stats (Distance & ETA) if user has a saved stop
    this.updateTravelStats(bus);

    const hasValidCoords =
      bus.latitude != null &&
      bus.longitude != null &&
      !isNaN(bus.latitude) &&
      !isNaN(bus.longitude) &&
      (Math.abs(bus.latitude) >= 0.0001 || Math.abs(bus.longitude) >= 0.0001);

    if (bus.address && hasValidCoords) {
      DOM.panelLocation.textContent = bus.address;
    } else if (hasValidCoords) {
      DOM.panelLocation.textContent = `${bus.latitude.toFixed(6)}, ${bus.longitude.toFixed(6)}`;
      // Fetch address in background
      if (window.TomTomServices) {
        const address = await window.TomTomServices.ReverseGeocoding.getAddress(
          bus.latitude,
          bus.longitude,
        );
        if (address) {
          bus.address = address;
          DOM.panelLocation.textContent = address;
        }
      }
    } else {
      DOM.panelLocation.textContent = "Location unavailable";
      if (DOM.panelEtaContainer) DOM.panelEtaContainer.classList.add("hidden");
    }

    // Update Driver Info
    if (DOM.panelDriver)
      DOM.panelDriver.textContent = bus.driverName || "Unknown";
    if (DOM.panelPhone) DOM.panelPhone.textContent = bus.driverPhone || "N/A";
  },

  async updateTravelStats(bus) {
    const savedStop = localStorage.getItem("userSavedStop");
    if (!savedStop || !DOM.panelEtaContainer) {
      if (DOM.panelEtaContainer) DOM.panelEtaContainer.classList.add("hidden");
      return;
    }

    try {
      const stop = JSON.parse(savedStop);
      const stats = await this.getTravelStats(bus.latitude, bus.longitude, stop.lat, stop.lng);

      if (stats) {
        DOM.panelEtaContainer.classList.remove("hidden");

        // Calculate Speed
        const speed = this.calculateSpeed(bus.busId, bus.latitude, bus.longitude);
        DOM.panelSpeed.textContent = speed;

        // Calculate accurate ETA based on current speed if moving
        // Fallback to routing ETA if speed is too low (< 5km/h)
        let finalEta = stats.durationMinutes;
        if (speed >= 5) {
          const hours = parseFloat(stats.distanceKm) / speed;
          finalEta = Math.ceil(hours * 60);
        }

        DOM.panelDistance.textContent = stats.distanceKm;
        DOM.panelEta.textContent = finalEta;
      } else {
        DOM.panelEtaContainer.classList.add("hidden");
      }
    } catch (e) {
      console.error("[Map] Failed to calculate travel stats:", e);
      DOM.panelEtaContainer.classList.add("hidden");
    }
  },

  async getTravelStats(busLat, busLng, stopLat, stopLng) {
    if (!window.TomTomServices || !window.TomTomServices.Routing) return null;

    try {
      const routeData = await window.TomTomServices.Routing.calculateRoute(
        [busLng, busLat],
        [stopLng, stopLat]
      );

      return window.TomTomServices.Routing.getRouteSummary(routeData);
    } catch (e) {
      console.error("[Map] Routing error:", e);
      return null;
    }
  },

  calculateSpeed(busId, lat, lng) {
    const bus = state.buses.get(busId);
    if (!bus) return 0;

    const now = Date.now();
    if (!bus.prevCoords) {
      bus.prevCoords = { lat, lng, time: now };
      return 0;
    }

    const timeDiff = (now - bus.prevCoords.time) / 1000; // seconds
    if (timeDiff < 3) return bus.currentSpeed || 0; // Throttle updates

    const dist = this.getHaversineDistance(bus.prevCoords.lat, bus.prevCoords.lng, lat, lng);
    const speedKmh = Math.round((dist / 1000) / (timeDiff / 3600));

    // Smooth speed (moving average or simple cap)
    const finalSpeed = Math.min(speedKmh, 100); // Cap at 100km/h for stability

    bus.prevCoords = { lat, lng, time: now };
    bus.currentSpeed = finalSpeed;

    return finalSpeed;
  },

  getHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  },

  closePanel() {
    console.log("[Map] closePanel() called");

    // Clear any pending timeouts
    if (this.navTimeout) clearTimeout(this.navTimeout);
    if (this.lockTimeout) clearTimeout(this.lockTimeout);
    this.navTimeout = null;
    this.lockTimeout = null;

    // Reset state
    state.selectedBusId = null;
    this.isNavigating = false;

    // Hide panel
    DOM.busInfoPanel.classList.remove("active");
    console.log("[Map] Panel closed");
  },

  removeBusMarker(busId) {
    if (this.markers.has(busId)) {
      const marker = this.markers.get(busId);
      marker.remove();
      this.markers.delete(busId);
    }
  },

  fitToBuses() {
    if (this.markers.size === 0) return;
    const group = L.featureGroup(Array.from(this.markers.values()));
    this.map.fitBounds(group.getBounds(), { padding: [50, 50] });
  },
};

// =========================================
// WebSocket Manager
// =========================================
const WebSocketManager = {
  socket: null,
  updateInterval: null,
  heartbeatInterval: null,
  HEARTBEAT_RATE: 20000, // 20 seconds keep-alive

  connect() {
    if (CONFIG.DEMO_MODE) {
      console.log("[App] DEMO MODE ACTIVE - Initializing simulated data");
      this.updateConnectionUI("connected");
      if (window.BusTrackDemo) {
        window.BusTrackDemo.init();
      }
      return;
    }

    console.log("[WS] Connecting to " + CONFIG.WS_URL);
    this.socket = new WebSocket(CONFIG.WS_URL);

    this.socket.onopen = () => {
      console.log("[WS] Connected");
      this.updateConnectionUI("connected");
      state.isConnected = true;
      this.startPolling();
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "PONG") {
          console.log("[WS] Heartbeat PONG received");
          return;
        }

        // Handle driver bus selection START/STOP messages
        if (data.action === "START" && data.busNumber) {
          console.log(
            `[WS] Driver started tracking bus ${data.busNumber} (${data.busName})`,
          );
          const busId = data.busNumber;
          console.log(`[WS] Looking for bus ID: "${busId}", current buses:`, Array.from(state.buses.keys()));

          // IMPORTANT: When ONE bus is selected, ALL other buses must be marked offline
          // Clear Active status from all buses first
          state.buses.forEach((bus, id) => {
            if (id !== busId) {
              bus.gpsOn = false; // Mark all OTHER buses as Offline
            }
          });

          if (state.buses.has(busId)) {
            const bus = state.buses.get(busId);
            console.log(`[WS] Found bus ${busId}, setting as Active`);
            bus.gpsOn = true; // Mark the selected bus as Active
            // Sync updated driver info if included
            if (data.busName) bus.busName = data.busName;
            if (data.driverName) bus.driverName = data.driverName;
            if (data.driverPhone) bus.driverPhone = data.driverPhone;
            state.buses.set(busId, bus);
            MapManager.updateMapDisplay();
          } else {
            // Bus not in cache - create placeholder with START data
            console.log(`[WS] Bus ${busId} not in cache on student page, creating placeholder`);
            const placeholderBus = {
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
            state.buses.set(busId, placeholderBus);
            console.log(`[WS] Created placeholder for bus ${busId}, marking as Active on student page`);
            MapManager.updateMapDisplay();
          }
          return;
        } else if (data.action === "STOP" && data.busNumber) {
          console.log(`[WS] Driver stopped tracking bus ${data.busNumber}`);
          const busId = data.busNumber;
          if (state.buses.has(busId)) {
            const bus = state.buses.get(busId);
            bus.gpsOn = false; // Mark as Offline
            state.buses.set(busId, bus);
            MapManager.updateMapDisplay();
          }
          return;
        }

        this.handleMessage(data);
      } catch (error) {
        console.error("[WS] Parse error:", error);
      }
    };

    this.socket.onclose = () => {
      console.log("[WS] Disconnected");
      state.isConnected = false;
      this.stopPolling();
      this.stopHeartbeat();

      // Reconnect with exponential backoff
      if (state.reconnectAttempts < CONFIG.RECONNECT_MAX_ATTEMPTS) {
        state.reconnectAttempts++;
        const delay = Math.min(2000 * Math.pow(2, state.reconnectAttempts - 1), 20000); // Cap at 20s
        this.updateConnectionUI("reconnecting");
        console.log(`[WS] Reconnecting in ${delay / 1000}s (${state.reconnectAttempts}/${CONFIG.RECONNECT_MAX_ATTEMPTS})`);
        setTimeout(() => this.connect(), delay);
      } else {
        this.updateConnectionUI("disconnected");
        console.log("[WS] Max reconnect attempts reached");
      }
    };

    this.socket.onerror = (error) => {
      console.error("[WS] Error:", error);
      this.updateConnectionUI("error");
    };
  },

  handleMessage(data) {
    if (Array.isArray(data)) {
      // New backend returns List<BusData>
      BusTracker.handleBusData(data);
    }
  },

  startPolling() {
    console.log("[WS] Starting update polling...");
    this.updateInterval = setInterval(() => {
      this.requestUpdate();
    }, CONFIG.UPDATE_INTERVAL);
    this.requestUpdate(); // Initial request
    this.startHeartbeat(); // Start heartbeat to keep connection alive
  },

  stopPolling() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
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

  /**
   * The new backend UserHandler requires a search message to return data.
   * Since we want all buses for the live map, we iterate through common stops
   * and known buses to ensure discovery.
   */
  requestUpdate() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      // Simply ask for ALL active buses for discovery
      this.socket.send(
        JSON.stringify({
          type: "ALL",
          value: "",
        }),
      );
    }
  },

  async fetchStops() {
    // Since the new backend doesn't have a stops REST API,
    // we'll rely on the data coming in via WebSockets to populate stops.
    console.log("[App] Stops will be updated via live bus data");
    return Promise.resolve([]);
  },

  updateConnectionUI(status) {
    const badge = DOM.connectionBadge;
    const text = badge.querySelector(".badge-text");

    badge.className = "connection-badge " + status;

    switch (status) {
      case "connected":
        text.textContent = "Live";
        break;
      case "reconnecting":
        text.textContent = "Reconnecting...";
        badge.className = "connection-badge reconnecting";
        break;
      case "error":
        text.textContent = "Error";
        badge.className = "connection-badge disconnected";
        break;
      default:
        text.textContent = "Disconnected";
    }
  },
};

// =========================================
// Network Change Listener — instant reconnect on network recovery
// =========================================
window.addEventListener("online", () => {
  console.log("[Network] Back online — forcing WebSocket reconnect");
  state.reconnectAttempts = 0; // Reset backoff so reconnect is instant
  if (!state.isConnected) {
    WebSocketManager.connect();
  }
});

window.addEventListener("offline", () => {
  console.log("[Network] Offline detected");
  WebSocketManager.updateConnectionUI("reconnecting");
});

// =========================================
// Bus Tracker
// =========================================
const BusTracker = {
  updateBus(busData) {
    const busId = busData.busId;
    const mappedBus = {
      busId: busData.busNumber || busData.busId,
      busNo: busData.busNumber || busData.busNo,
      busName: busData.busName || "Bus " + (busData.busNumber || busData.busNo),
      latitude: busData.latitude,
      longitude: busData.longitude,
      status: busData.status,
      gpsOn:
        busData.status &&
        (busData.status.toUpperCase() === "RUNNING" ||
          busData.status.toUpperCase() === "GPS_ACTIVE"),
      stops: busData.busStop ? [busData.busStop] : busData.stops || [],
      lastUpdate: new Date().toISOString(),
    };

    // 30-second grace period: track when bus was last seen active
    const existing = state.buses.get(mappedBus.busId);
    if (mappedBus.gpsOn) {
      mappedBus.lastSeenActive = Date.now();
    } else if (existing && existing.lastSeenActive) {
      // Just track when it was last active, no more forcing it to RUNNING.
      mappedBus.lastSeenActive = existing.lastSeenActive;
    }

    state.buses.set(mappedBus.busId, mappedBus);

    const hasValidCoords =
      mappedBus.latitude != null &&
      mappedBus.longitude != null &&
      !isNaN(mappedBus.latitude) &&
      !isNaN(mappedBus.longitude) &&
      (Math.abs(mappedBus.latitude) >= 0.0001 ||
        Math.abs(mappedBus.longitude) >= 0.0001);
    if (hasValidCoords) {
      if (SearchManager.shouldShowBus(mappedBus)) {
        MapManager.updateBusMarker(mappedBus);
      } else {
        MapManager.removeBusMarker(mappedBus.busId);
      }
    } else {
      MapManager.removeBusMarker(mappedBus.busId);
    }

    let activeCount = 0;
    state.buses.forEach((b) => {
      if (b.gpsOn) activeCount++;
    });

    DOM.activeBusCount.textContent = `${activeCount} Active`;
    DOM.totalBuses.textContent = state.buses.size;

    UIManager.renderBusesList();

    if (state.selectedBusId === mappedBus.busId) {
      MapManager.updatePanel(mappedBus);
    }

    // Extract stops
    const stops = mappedBus.stops;
    if (stops && stops.length > 0) {
      stops.forEach((stopName) => {
        if (!state.stops.has(stopName)) {
          state.stops.set(stopName, {
            name: stopName,
            buses: [mappedBus.busNo],
          });
        } else {
          const stop = state.stops.get(stopName);
          if (!stop.buses.includes(mappedBus.busNo)) {
            stop.buses.push(mappedBus.busNo);
          }
        }
      });
      UIManager.renderStopsList();
    }
  },

  removeBus(busId) {
    state.buses.delete(busId);
    MapManager.removeBusMarker(busId);

    DOM.activeBusCount.textContent = state.buses.size;
    DOM.totalBuses.textContent = state.buses.size;

    UIManager.renderBusesList();
  },

  handleBusData(buses) {
    if (!buses) return;

    const now = Date.now();
    console.log(`[WS] Received data for ${buses.length} buses`);
    // console.log('[WS] Sample bus data:', buses[0]);

    // Map backend data to frontend state format
    const mappedBuses = buses.map((bus) => ({
      busId: bus.busNumber || bus.busId,
      busNo: bus.busNumber || bus.busNo,
      busName: bus.busName || "Bus " + (bus.busNumber || bus.busNo), // Display name
      routeName:
        bus.busName ||
        bus.route ||
        bus.busRoute ||
        bus.routePath ||
        `Bus ${bus.busNumber || bus.busNo}`,
      latitude: bus.latitude,
      longitude: bus.longitude,
      status: bus.status,
      gpsOn:
        bus.status &&
        (bus.status.toUpperCase() === "RUNNING" ||
          bus.status.toUpperCase() === "GPS_ACTIVE"),
      // Use static route if available, otherwise fallback to single stop
      stops:
        ROUTE_DEFINITIONS[bus.busNumber || bus.busNo] ||
        (bus.busStop ? [bus.busStop] : bus.stops || []),
      driverName: bus.driverName || "Unknown Driver",
      driverPhone: bus.driverPhone || "No Phone",
      lastUpdate: new Date().toISOString(),
      lastSeen: now, // For staleness tracking
    }));

    if (MapManager.map) {
      MapManager.map.resize();
    }

    // Update state Map (Merge with Coordinate Preservation)
    mappedBuses.forEach((bus) => {
      // If already exists, preserve valid coordinates if new ones are empty/zero
      if (state.buses.has(bus.busId)) {
        const oldBus = state.buses.get(bus.busId);
        const isNewInvalid =
          !bus.latitude ||
          !bus.longitude ||
          (Math.abs(bus.latitude) < 0.0001 && Math.abs(bus.longitude) < 0.0001);
        const isOldValid =
          oldBus.latitude &&
          oldBus.longitude &&
          (Math.abs(oldBus.latitude) > 0.0001 ||
            Math.abs(oldBus.longitude) > 0.0001);

        if (isNewInvalid && isOldValid) {
          // console.warn(`[Map] Preserving valid coordinates for ${bus.busNo} despite invalid update (0,0)`);
          bus.latitude = oldBus.latitude;
          bus.longitude = oldBus.longitude;
        }
      }
      state.buses.set(bus.busId, bus);
    });

    // Run staleness check to catch buses that stopped sending data
    this.checkStaleBuses(now);

    // Update UI Count
    let activeCount = 0;
    state.buses.forEach((bus) => {
      if (bus.gpsOn) activeCount++;
    });

    DOM.activeBusCount.textContent = `${activeCount} Active`;
    DOM.totalBuses.textContent = state.buses.size;

    // Update markers and panel for active buses
    const hasValidCoords = (bus) =>
      bus.latitude != null &&
      bus.longitude != null &&
      !isNaN(bus.latitude) &&
      !isNaN(bus.longitude) &&
      (Math.abs(bus.latitude) >= 0.0001 || Math.abs(bus.longitude) >= 0.0001);
    state.buses.forEach((bus) => {
      if (hasValidCoords(bus)) {
        if (SearchManager.shouldShowBus(bus)) {
          MapManager.updateBusMarker(bus);
        } else {
          MapManager.removeBusMarker(bus.busId);
        }
        if (state.selectedBusId === bus.busId) {
          MapManager.updatePanel(bus);
        }
      } else {
        MapManager.removeBusMarker(bus.busId);
        if (state.selectedBusId === bus.busId) {
          MapManager.updatePanel(bus);
        }
      }
    });

    // Update list views
    UIManager.renderBusesList();
  },

  checkStaleBuses(now) {
    state.buses.forEach((bus) => {
      if (bus.gpsOn && now - (bus.lastSeen || 0) > CONFIG.STALE_THRESHOLD) {
        console.log(
          `[BusTracker] Bus ${bus.busNo} went stale. Marking Inactive.`,
        );
        bus.gpsOn = false;
        bus.status = "STOPPED";
      }
    });
  },
};

// =========================================
// Search Manager
// =========================================
const SearchManager = {
  debounceTimer: null,

  shouldShowBus(bus) {
    if (!state.searchFilter) return false; // Hide all buses until user searches
    const q = state.searchFilter.toLowerCase();

    // Match only by bus number, name, or route — not individual stops
    const matchesNo = bus.busNo && bus.busNo.toLowerCase().includes(q);
    const matchesName = bus.busName && bus.busName.toLowerCase().includes(q);
    const matchesRoute =
      bus.routeName && bus.routeName.toLowerCase().includes(q);

    return matchesNo || matchesName || matchesRoute;
  },

  initWelcomeSearch() {
    // If the user already has a saved bus stop, auto-apply it and skip the modal
    const clientData = localStorage.getItem("client");
    if (clientData) {
      try {
        const client = JSON.parse(clientData);
        if (client.savedBusStop) {
          console.log(
            "[Search] Auto-applying saved bus stop:",
            client.savedBusStop,
          );
          this.applyWelcomeFilter(client.savedBusStop);
          return; // Skip welcome modal
        }
      } catch (e) {
        console.error("[Search] Failed to parse client data:", e);
      }
    }

    if (DOM.welcomeSearchModal) {
      DOM.welcomeSearchModal.style.display = "flex";

      // Focus input
      setTimeout(() => {
        if (DOM.welcomeSearchInput) DOM.welcomeSearchInput.focus();
      }, 100);

      // Input Listener for Dropdown
      if (DOM.welcomeSearchInput) {
        DOM.welcomeSearchInput.addEventListener("input", (e) => {
          const val = e.target.value;
          if (val.trim()) {
            DOM.welcomeSearchDropdown.style.display = "block";
            this.handleSearch(val, "welcome");
          } else {
            DOM.welcomeSearchDropdown.style.display = "none";
          }
        });
      }

      DOM.welcomeSearchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const query = DOM.welcomeSearchInput.value.trim();
        this.saveBusStop(query); // Save to profile which triggers list refresh
        this.applyWelcomeFilter(query);
      });

      // Close dropdown on outside click
      document.addEventListener("click", (e) => {
        if (
          DOM.welcomeSearchDropdown &&
          !DOM.welcomeSearchInput.contains(e.target) &&
          !DOM.welcomeSearchDropdown.contains(e.target)
        ) {
          DOM.welcomeSearchDropdown.style.display = "none";
        }
      });
    }
  },

  applyWelcomeFilter(query) {
    if (query) {
      state.searchFilter = query;
      if (DOM.welcomeSearchModal) DOM.welcomeSearchModal.style.display = "none";

      // Sync all search inputs
      if (DOM.searchInput) {
        DOM.searchInput.value = query;
        DOM.searchClear.classList.remove("hidden");
      }
      if (DOM.busFilterInput) {
        DOM.busFilterInput.value = query;
      }

      this.refreshFilteredView();
    }
  },

  refreshFilteredView() {
    const hasValidCoords = (b) =>
      b.latitude != null &&
      b.longitude != null &&
      !isNaN(b.latitude) &&
      !isNaN(b.longitude) &&
      (Math.abs(b.latitude) >= 0.0001 || Math.abs(b.longitude) >= 0.0001);
    state.buses.forEach((bus) => {
      if (hasValidCoords(bus)) {
        if (this.shouldShowBus(bus)) {
          MapManager.updateBusMarker(bus);
        } else {
          MapManager.removeBusMarker(bus.busId);
        }
      } else {
        MapManager.removeBusMarker(bus.busId);
      }
    });

    // Update search clear button visibility
    if (DOM.searchClear) {
      DOM.searchClear.classList.toggle("hidden", !state.searchFilter);
    }

    UIManager.renderBusesList();
  },

  init() {
    // Main Search Bar
    DOM.searchInput.addEventListener("input", (e) => {
      // Update filter state immediately
      state.searchFilter = e.target.value.trim();

      // Re-apply filter to map markers
      this.refreshFilteredView();

      // Existing dropdown logic
      this.handleSearch(e.target.value);
      DOM.searchClear.classList.toggle("hidden", !e.target.value);
    });

    DOM.searchInput.addEventListener("focus", () => {
      if (DOM.searchInput.value.trim()) {
        DOM.searchDropdown.classList.add("active");
      }
    });

    DOM.searchClear.addEventListener("click", () => {
      // Reset to saved bus stop filter if available, otherwise show all
      const clientData = localStorage.getItem("client");
      let defaultFilter = "";
      if (clientData) {
        try {
          const client = JSON.parse(clientData);
          if (client.savedBusStop) defaultFilter = client.savedBusStop;
        } catch (e) {
          /* ignore */
        }
      }
      DOM.searchInput.value = defaultFilter;
      state.searchFilter = defaultFilter;
      this.refreshFilteredView();

      DOM.searchDropdown.classList.remove("active");
      DOM.searchClear.classList.toggle("hidden", !defaultFilter);
      DOM.searchInput.focus();
    });

    document.addEventListener("click", (e) => {
      if (
        !DOM.searchInput.contains(e.target) &&
        !DOM.searchDropdown.contains(e.target)
      ) {
        DOM.searchDropdown.classList.remove("active");
      }
    });
  },

  handleSearch(query, context = "header") {
    clearTimeout(this.debounceTimer);

    if (!query.trim()) {
      if (context === "header") DOM.searchDropdown.classList.remove("active");
      else if (context === "welcome")
        DOM.welcomeSearchDropdown.style.display = "none";
      return;
    }

    this.debounceTimer = setTimeout(() => {
      const q = query.toLowerCase().trim();

      // Trigger WebSocket search for bus discovery
      if (
        WebSocketManager.socket &&
        WebSocketManager.socket.readyState === WebSocket.OPEN
      ) {
        WebSocketManager.socket.send(
          JSON.stringify({
            type: "BUS_NUMBER",
            value: query,
          }),
        );
      }

      this.performSearch(q, context);
    }, CONFIG.SEARCH_DEBOUNCE);
  },

  async performSearch(query, context) {
    const q = query.toLowerCase().trim();
    const results = [];
    const matchedNames = new Map(); // Name -> example bus object
    const directBusMatches = [];

    // Local Search
    state.buses.forEach((bus, busId) => {
      const busName = bus.busName || "";
      const matchesName = busName.toLowerCase().includes(q);
      const matchesNo = bus.busNo && bus.busNo.toLowerCase().includes(q);
      const matchesRoute = bus.routeName && bus.routeName.toLowerCase().includes(q);

      if (matchesName) {
        if (!matchedNames.has(busName)) {
          matchedNames.set(busName, bus);
        }
      } else if (matchesNo || matchesRoute) {
        directBusMatches.push({ type: "bus", ...bus });
      }
    });

    // Add unique names to results first
    matchedNames.forEach((bus, name) => {
      results.push({ type: "name", name: name, routeName: bus.routeName });
    });

    // Add specific bus matches (where name didn't match but number/route did)
    directBusMatches.forEach(bus => {
      results.push(bus);
    });

    if (results.length > 0) {
      this.renderResults(results, true, context);
    } else {
      this.renderNoResults(context);
    }
  },

  renderNoResults(context) {
    const container =
      context === "welcome"
        ? DOM.welcomeSearchDropdownContent
        : DOM.searchDropdownContent;
    if (!container) return;

    container.innerHTML = `
            <div class="dropdown-no-results" style="padding: 1.5rem; text-align: center; color: var(--text-secondary);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 32px; height: 32px; margin-bottom: 0.5rem; opacity: 0.5;">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <p style="font-size: 0.9rem;">No results found</p>
            </div>
        `;

    if (context === "welcome")
      DOM.welcomeSearchDropdown.style.display = "block";
    else DOM.searchDropdown.classList.add("active");
  },

  renderResults(results, initial, context) {
    const container =
      context === "welcome"
        ? DOM.welcomeSearchDropdownContent
        : DOM.searchDropdownContent;
    if (!container) return;

    if (results.length === 0) {
      if (initial)
        container.innerHTML = '<div class="searching-hint">Searching...</div>';
      return;
    }

    container.innerHTML = results
      .map((result) => {
        if (result.type === "name") {
          return `
                <div class="dropdown-item" data-type="name" data-value="${result.name}">
                    <div class="dropdown-item-header">
                        <span class="dropdown-bus-name">${result.name}</span>
                    </div>
                    <div class="dropdown-route">View all buses for this name</div>
                </div>
            `;
        }
        return `
            <div class="dropdown-item" data-type="bus" data-id="${result.busId}">
                <div class="dropdown-item-header">
                    <span class="dropdown-bus-number">${result.busNo}</span>
                    <span class="dropdown-bus-name">${result.busName}</span>
                </div>
                ${result.routeName ? `<div class="dropdown-route">${result.routeName}</div>` : ""}
            </div>
        `;
      })
      .join("");

    // Event listeners for results
    container.querySelectorAll(".dropdown-item").forEach((item) => {
      item.addEventListener("click", () => {
        const type = item.dataset.type;
        const id = item.dataset.id;
        const val = item.dataset.value;

        if (context === "welcome") {
          if (type === "name") {
            DOM.welcomeSearchInput.value = val;
            this.applyWelcomeFilter(val);
          } else {
            const bus = state.buses.get(id);
            if (bus) {
              DOM.welcomeSearchInput.value = bus.busName || bus.busNo;
              this.applyWelcomeFilter(bus.busName || bus.busNo);
            }
          }
        } else {
          if (type === "name") {
            this.selectNameResult(val);
          } else {
            this.selectBusResult(id);
          }
        }
      });
    });

    if (context === "welcome")
      DOM.welcomeSearchDropdown.style.display = "block";
    else DOM.searchDropdown.classList.add("active");
  },

  selectNameResult(name) {
    DOM.searchDropdown.classList.remove("active");

    // Set filter state
    state.searchFilter = name;

    // Sync the search input
    if (DOM.searchInput) DOM.searchInput.value = name;

    // Ensure clear button is visible
    if (DOM.searchClear) DOM.searchClear.classList.remove("hidden");

    // Switch to buses tab to show all matching buses
    TabManager.switchTab("buses");
    this.refreshFilteredView();
  },

  selectBusResult(busId) {
    DOM.searchDropdown.classList.remove("active");
    DOM.searchInput.value = "";
    DOM.searchClear.classList.add("hidden");

    TabManager.switchTab("map");
    MapManager.selectBus(busId);
  },

  async saveBusStop(stopName) {
    const client = JSON.parse(localStorage.getItem("client"));
    if (!client) return;

    try {
      const response = await fetch(
        getApiBaseUrl() + "/api/client/bus-stop/save",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: client.id,
            busStop: stopName,
          }),
        },
      );
      const data = await response.json();

      if (data.success) {
        // Update session storage
        localStorage.setItem("client", JSON.stringify(data.client));
        showToast(`Saved ${stopName} as your original bus stop!`, "success");
        DOM.searchDropdown.classList.remove("active");

        // Auto-apply saved stop as filter
        DOM.searchInput.value = stopName;
        state.searchFilter = stopName;
        DOM.searchClear.classList.toggle("hidden", !stopName);
        this.refreshFilteredView();

        // Refresh profile display if needed
        if (DOM.usernameDisplay) {
          // Profile saved stop can be displayed somewhere else if needed
        }
      } else {
        showToast(data.message, "error");
      }
    } catch (err) {
      console.error("[Search] Failed to save bus stop:", err);
      showToast("Failed to save bus stop", "error");
    }
  },
};

// =========================================
// Tab Manager
// =========================================
const TabManager = {
  init() {
    DOM.tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabName = btn.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Add swipe-to-close for floating panels
    const panels = document.querySelectorAll(".floating-panel");
    panels.forEach((panel) => {
      let startY = 0;
      let currentY = 0;
      let isDragging = false;

      // The scrollable area is usually the child container
      const scrollable = panel.querySelector(".panel-container") || panel;

      panel.addEventListener("touchstart", (e) => {
        // Only initiate drag if we are at the top of the scroll view
        if (scrollable.scrollTop <= 0) {
          startY = e.touches[0].clientY;
          isDragging = true;
          // Temporarily remove transition for instant dragging
          panel.style.transition = "none";
        }
      }, { passive: true });

      panel.addEventListener("touchmove", (e) => {
        if (!isDragging) return;
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;

        // If pulling down
        if (deltaY > 0) {
          if (e.cancelable) e.preventDefault(); // Stop normal scroll
          panel.style.transform = `translateY(${deltaY}px)`;
        } else {
          panel.style.transform = `translateY(0px)`;
        }
      }, { passive: false });

      panel.addEventListener("touchend", (e) => {
        if (!isDragging) return;
        isDragging = false;

        // Restore CSS transition
        panel.style.transition = "all 0.45s cubic-bezier(0.16, 1, 0.3, 1)";

        const deltaY = currentY - startY;
        if (deltaY > 150) {
          // Swiped down far enough to close
          this.switchTab("map");

          setTimeout(() => {
            panel.style.transform = "";
          }, 450);
        } else {
          // Snap back to top
          panel.style.transform = "translateY(0px)";
          setTimeout(() => {
            panel.style.transform = "";
          }, 450);
        }
      });
    });
  },

  switchTab(tabName) {
    // Update Buttons
    DOM.tabBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    // Update dashboard internal tabs if they exist
    document.querySelectorAll(".dash-tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    // Toggle Floating Panels
    // If tab is 'map', we just want to close all panels (map is always visible in background)
    const panels = document.querySelectorAll(".floating-panel");
    panels.forEach((panel) => {
      panel.classList.remove("active");
    });

    if (tabName !== "map") {
      const targetPanel = document.getElementById(`${tabName}View`); // e.g. busesView, profileView
      if (targetPanel) {
        targetPanel.classList.add("active");
      }
      // Refresh profile data when switching to profile tab
      if (tabName === "profile" && typeof ProfileManager !== "undefined") {
        ProfileManager.loadProfile();
      }
    } else {
      // If switching to map, maybe we want to resize just to be safe,
      // though it's always visible now.
      if (MapManager.map) {
        setTimeout(() => MapManager.map.resize(), 50);
      }
    }

    // Bottom nav doesn't need mobile menu toggle
  },
};

// =========================================
// UI Manager
// =========================================
const UIManager = {
  renderBusesList() {
    if (state.buses.size === 0) {
      DOM.busesEmpty.style.display = "block";
      return;
    }

    DOM.busesEmpty.style.display = "none";

    state.buses.forEach((bus, busId) => {
      // Apply filtering
      if (!SearchManager.shouldShowBus(bus)) return;

      let card = DOM.busGrid.querySelector(`.bus-card[data-bus-id="${busId}"]`);
      if (card) {
        // Update existing card status & details
        const statusBadge = card.querySelector(".bus-card-status");
        const badgeEl = card.querySelector(".bus-card-number");
        const nameEl = card.querySelector(".bus-card-name");

        if (badgeEl) badgeEl.textContent = bus.busNo; // Badge = Number
        if (nameEl) nameEl.textContent = bus.busName || ""; // Title = Name

        if (statusBadge) {
          const isGpsOn = bus.gpsOn;
          statusBadge.textContent = isGpsOn ? "Online" : "Offline";
          statusBadge.className = `bus-card-status ${isGpsOn ? "status-active" : "status-inactive"}`;

          // Toggle dot style
          statusBadge.style.color = isGpsOn
            ? "var(--success)"
            : "var(--danger)";
          statusBadge.style.background = isGpsOn
            ? "rgba(76, 175, 80, 0.1)"
            : "rgba(244, 67, 54, 0.1)";
        }
      } else {
        card = this.createBusCard(bus);
        DOM.busGrid.appendChild(card);
      }
    });

    // Remove cards for buses no longer present OR filtered out
    DOM.busGrid.querySelectorAll(".bus-card").forEach((card) => {
      const bus = state.buses.get(card.dataset.busId);
      if (!bus || !SearchManager.shouldShowBus(bus)) {
        card.remove();
      }
    });
  },

  createBusCard(bus) {
    const card = document.createElement("div");
    card.className = "bus-card";
    card.dataset.busId = bus.busId;

    const isGpsOn = bus.gpsOn;
    const statusColor = isGpsOn ? "var(--success)" : "var(--danger)";
    const statusBg = isGpsOn
      ? "rgba(76, 175, 80, 0.1)"
      : "rgba(244, 67, 54, 0.1)";

    card.innerHTML = `
            <div class="bus-card-header">
                <span class="bus-card-number">${bus.busNo}</span>
                <span class="bus-card-status" style="color: ${statusColor}; background: ${statusBg}">
                    ${isGpsOn ? "Online" : "Offline"}
                </span>
            </div>
            <div class="bus-card-name">${bus.busName || ""}</div>
            <div class="bus-card-route">${bus.routeName || "Unknown Route"}</div>
            <!-- Stops removed as per user request -->
        `;

    card.addEventListener("click", () => {
      console.log(`[Dashboard] Card clicked for bus ${bus.busNo}`);
      BusDetailPopup.show(bus.busId || bus.busNo);
    });

    return card;
  },

  renderStopsList() {
    DOM.totalStops.textContent = state.stops.size;

    if (state.stops.size === 0) {
      DOM.stopsEmpty.style.display = "block";
      return;
    }

    DOM.stopsEmpty.style.display = "none";

    const cards = [];
    state.stops.forEach((stop, stopId) => {
      cards.push(this.createStopCard(stop));
    });

    DOM.stopsGrid.innerHTML = "";
    cards.forEach((card) => DOM.stopsGrid.appendChild(card));
    DOM.stopsGrid.appendChild(DOM.stopsEmpty);
    DOM.stopsEmpty.style.display = "none";
  },

  createStopCard(stop) {
    const card = document.createElement("div");
    card.className = "stop-card";

    const busCount = stop.buses ? stop.buses.length : 0;

    card.innerHTML = `
            <div class="stop-card-icon">📍</div>
            <div class="stop-card-name">${stop.name}</div>
            <div class="stop-card-buses">
                <span>${busCount}</span> bus${busCount !== 1 ? "es" : ""} serve this stop
            </div>
        `;

    return card;
  },
};

// =========================================
// Toast
// =========================================
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// =========================================
// Mobile Menu
// =========================================
function initMobileMenu() {
  // Bottom nav bar is always visible, no mobile menu needed
}

// =========================================
// TomTom Services Integration
// =========================================
function initTomTomServices() {
  if (!window.TomTomServices) {
    console.warn("[App] TomTom Services not loaded");
    return;
  }

  console.log("[App] TomTom Services initialized (Traffic/Routes disabled)");
}

// =========================================
// Theme Manager
// =========================================
// =========================================
// Bus Detail Popup Manager
// =========================================
const BusDetailPopup = {
  overlay: null,
  closeBtn: null,
  trackBtn: null,
  currentBusId: null,

  init() {
    this.overlay = document.getElementById("busDetailPopupOverlay");
    this.closeBtn = document.getElementById("busDetailCloseBtn");
    this.trackBtn = document.getElementById("popupTrackBtn");

    if (!this.overlay) {
      console.warn("[BusDetailPopup] Overlay element not found");
      return;
    }

    // Close button
    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.close();
      });
    }

    // Click on backdrop to close
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // Track on Map button
    if (this.trackBtn) {
      this.trackBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (this.currentBusId) {
          this.close();
          TabManager.switchTab("map");
          MapManager.selectBus(this.currentBusId);
        }
      });
    }

    // ESC key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.overlay && !this.overlay.classList.contains("hidden")) {
        this.close();
      }
    });

    console.log("[BusDetailPopup] Initialized");
  },

  show(busId) {
    const id = String(busId);
    this.currentBusId = id;

    // Find bus data
    const bus = state.buses.get(id) ||
      Array.from(state.buses.values()).find((b) => String(b.busId) === id || String(b.busNo) === id);

    if (!bus) {
      console.error(`[BusDetailPopup] No bus data found for ID: ${id}`);
      return;
    }

    console.log(`[BusDetailPopup] Showing details for bus ${bus.busNo}`);

    // Populate fields
    const popupBusNo = document.getElementById("popupBusNo");
    const popupBusName = document.getElementById("popupBusName");
    const popupBusRoute = document.getElementById("popupBusRoute");
    const popupBusStatus = document.getElementById("popupBusStatus");
    const popupLocation = document.getElementById("popupLocation");
    const popupDriver = document.getElementById("popupDriver");
    const popupPhone = document.getElementById("popupPhone");
    const popupCoords = document.getElementById("popupCoords");

    if (popupBusNo) popupBusNo.textContent = bus.busNo;
    if (popupBusName) popupBusName.textContent = bus.busName || `Bus ${bus.busNo}`;
    if (popupBusRoute) popupBusRoute.textContent = `Route: ${bus.routeName || "Unknown"}`;

    // Status
    if (popupBusStatus) {
      const isOnline = bus.gpsOn;
      popupBusStatus.className = `bus-detail-status ${isOnline ? "online" : "offline"}`;
      popupBusStatus.innerHTML = `
        <span class="status-dot"></span>
        <span>${isOnline ? "Online" : "Offline"}</span>
      `;
    }

    // Location
    if (popupLocation) {
      const hasValidCoords = bus.latitude != null && bus.longitude != null &&
        !isNaN(bus.latitude) && !isNaN(bus.longitude) &&
        (Math.abs(bus.latitude) >= 0.0001 || Math.abs(bus.longitude) >= 0.0001);

      if (bus.address && hasValidCoords) {
        popupLocation.textContent = bus.address;
      } else if (hasValidCoords) {
        popupLocation.textContent = `${parseFloat(bus.latitude).toFixed(6)}, ${parseFloat(bus.longitude).toFixed(6)}`;
      } else {
        popupLocation.textContent = "Location unavailable";
      }
    }

    // Driver & Phone
    if (popupDriver) popupDriver.textContent = bus.driverName || "Unknown";
    if (popupPhone) popupPhone.textContent = bus.driverPhone || "N/A";

    // Coordinates
    if (popupCoords) {
      const hasCoords = bus.latitude != null && bus.longitude != null &&
        !isNaN(bus.latitude) && !isNaN(bus.longitude) &&
        (Math.abs(bus.latitude) >= 0.0001 || Math.abs(bus.longitude) >= 0.0001);
      if (hasCoords) {
        popupCoords.textContent = `${parseFloat(bus.latitude).toFixed(6)}, ${parseFloat(bus.longitude).toFixed(6)}`;
      } else {
        popupCoords.textContent = "N/A";
      }
    }

    // Show overlay
    if (this.overlay) {
      this.overlay.classList.remove("hidden", "fade-out");
    }
  },

  close() {
    if (!this.overlay) return;

    // Animate out
    this.overlay.classList.add("fade-out");
    setTimeout(() => {
      this.overlay.classList.add("hidden");
      this.overlay.classList.remove("fade-out");
      this.currentBusId = null;
    }, 280);
  }
};

const ThemeManager = {
  icons: {
    sun: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
    moon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
  },

  init() {
    console.log("[Theme] Initializing ThemeManager...");
    const savedTheme = localStorage.getItem("theme") || "light";
    this.applyTheme(savedTheme, false);

    const toggleBtn = document.getElementById("themeToggleBtn");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        const currentTheme = localStorage.getItem("theme") || "light";
        const newTheme = currentTheme === "light" ? "dark" : "light";
        this.applyTheme(newTheme, true);
      });
    }
  },

  applyTheme(theme, updateMap = true) {
    console.log(`[Theme] Applying theme: ${theme}`);
    const body = document.body;
    const toggleBtn = document.getElementById("themeToggleBtn");

    if (theme === "dark") {
      body.classList.add("dark-theme");
      if (toggleBtn) toggleBtn.innerHTML = this.icons.sun;
    } else {
      body.classList.remove("dark-theme");
      if (toggleBtn) toggleBtn.innerHTML = this.icons.moon;
    }

    localStorage.setItem("theme", theme);

    if (updateMap && MapManager.map) {
      const styleUrl =
        theme === "dark"
          ? `${CONFIG.MAPTILER_DARK_STYLE_URL}?key=${CONFIG.MAPTILER_API_KEY}`
          : CONFIG.MAPTILER_STYLE_URL;

      console.log("[Theme] Updating map style...");
      MapManager.map.setStyle(styleUrl);
    }
  },
};

// =========================================
// Dashboard Manager
// =========================================
const DashboardManager = {
  selectionMap: null,
  tempMarker: null,
  selectedCoords: null,

  init() {
    console.log("[Dashboard] Initializing DashboardManager...");

    // UI elements
    this.setStopBtn = document.getElementById("setStopBtn");
    this.changeStopBtn = document.getElementById("changeStopBtn");
    this.removeStopBtn = document.getElementById("removeStopBtn");
    this.overlay = document.getElementById("stopSelectionOverlay");
    this.cancelOverlayBtn = document.getElementById("cancelStopSelection");
    this.confirmPopup = document.getElementById("confirmStopPopup");
    this.confirmBtn = document.getElementById("confirmStopBtn");
    this.cancelMarkerBtn = document.getElementById("cancelMarkerBtn");

    this.stopActionCard = document.getElementById("stopActionCard");
    this.stopActionTitle = document.getElementById("stopActionTitle");
    this.stopActionSub = document.getElementById("stopActionSub");
    this.stopDetailsPanel = document.getElementById("stopDetailsPanel");

    this.savedStopLocation = document.getElementById("savedStopLocation");
    this.savedStopCoords = document.getElementById("savedStopCoords");

    // Event listeners
    if (this.stopActionCard) {
      this.stopActionCard.onclick = () => {
        const savedStop = localStorage.getItem("userSavedStop");
        if (savedStop) {
          // Toggle expansion
          this.stopDetailsPanel.classList.toggle("hidden");
        } else {
          // Open map selection
          this.openSelectionMap();
        }
      };
    }

    if (this.changeStopBtn) this.changeStopBtn.onclick = (e) => {
      e.stopPropagation();
      this.openSelectionMap();
    };

    if (this.removeStopBtn) this.removeStopBtn.onclick = (e) => {
      e.stopPropagation();
      this.removeStop();
    };

    if (this.cancelOverlayBtn) this.cancelOverlayBtn.onclick = () => this.closeSelectionMap();
    if (this.confirmBtn) this.confirmBtn.onclick = () => this.confirmStop();
    if (this.cancelMarkerBtn) this.cancelMarkerBtn.onclick = () => this.clearTempMarker();

    // Internal Dashboard Tabs
    document.querySelectorAll(".dash-tab-btn").forEach(btn => {
      btn.onclick = () => {
        const tab = btn.dataset.tab;
        TabManager.switchTab(tab);
      };
    });

    this.updateDashboardUI();
  },

  updateDashboardUI() {
    const savedStop = localStorage.getItem("userSavedStop");
    if (savedStop) {
      try {
        const stop = JSON.parse(savedStop);

        // Update Action Card to show "Your Stop"
        if (this.stopActionTitle) this.stopActionTitle.textContent = "Your Stop";
        if (this.stopActionSub) this.stopActionSub.textContent = "Tap to view details";

        this.savedStopCoords.textContent = `${stop.lat.toFixed(4)}, ${stop.lng.toFixed(4)}`;

        // Reverse geocode to get name if possible
        if (stop.name) {
          this.savedStopLocation.textContent = stop.name;
        } else {
          this.fetchStopName(stop.lat, stop.lng);
        }
      } catch (e) {
        console.error("[Dashboard] Error parsing saved stop:", e);
      }
    } else {
      // Update Action Card to show "Set My Stop"
      if (this.stopActionTitle) this.stopActionTitle.textContent = "Set My Stop";
      if (this.stopActionSub) this.stopActionSub.textContent = "Manage your location";
      if (this.stopDetailsPanel) this.stopDetailsPanel.classList.add("hidden");
    }
  },

  async fetchStopName(lat, lng) {
    if (window.TomTomServices) {
      const address = await window.TomTomServices.ReverseGeocoding.getAddress(lat, lng);
      if (address) {
        this.savedStopLocation.textContent = address;
        // Update storage with name
        const savedStop = JSON.parse(localStorage.getItem("userSavedStop"));
        savedStop.name = address;
        localStorage.setItem("userSavedStop", JSON.stringify(savedStop));
      } else {
        this.savedStopLocation.textContent = "Custom Location";
      }
    } else {
      this.savedStopLocation.textContent = "Custom Location";
    }
  },

  openSelectionMap() {
    this.overlay.classList.remove("hidden");

    if (!this.selectionMap) {
      this.initSelectionMap();
    } else {
      this.selectionMap.resize();
    }
  },

  closeSelectionMap() {
    this.overlay.classList.add("hidden");
    this.clearTempMarker();
  },

  initSelectionMap() {
    maptilersdk.config.apiKey = CONFIG.MAPTILER_API_KEY;

    const currentTheme = localStorage.getItem("theme") || "light";
    const initialStyle = currentTheme === "dark"
      ? `${CONFIG.MAPTILER_DARK_STYLE_URL}?key=${CONFIG.MAPTILER_API_KEY}`
      : CONFIG.MAPTILER_STYLE_URL;

    this.selectionMap = new maptilersdk.Map({
      container: "stopSelectionMap",
      style: initialStyle,
      center: CONFIG.MAP_CENTER,
      zoom: 14,
      attributionControl: false
    });

    // Handle selection (Both click and right-click/contextmenu)
    const handleSelection = (e) => {
      if (e.originalEvent && e.originalEvent.type === "contextmenu") {
        e.originalEvent.preventDefault();
      }
      const { lng, lat } = e.lngLat;
      this.placeTempMarker(lng, lat);
    };

    this.selectionMap.on("click", handleSelection);
    this.selectionMap.on("contextmenu", handleSelection);
  },

  placeTempMarker(lng, lat) {
    this.selectedCoords = { lng, lat };

    if (this.tempMarker) {
      this.tempMarker.remove();
    }

    // Create a custom element for the "Add" button and 10m radius
    const el = document.createElement("div");
    el.className = "temp-stop-container";
    el.innerHTML = `
      <div class="stop-radius-circle"></div>
      <div class="add-stop-popup">
        <button class="add-stop-btn">Add</button>
      </div>
    `;

    // Add click event to the "Add" button
    const addBtn = el.querySelector(".add-stop-btn");
    addBtn.onclick = (e) => {
      e.stopPropagation();
      this.confirmStop();
    };

    this.tempMarker = new maptilersdk.Marker({
      element: el,
      anchor: 'center'
    })
      .setLngLat([lng, lat])
      .addTo(this.selectionMap);

    // Hide the old confirm popup from index.html if it exists
    if (this.confirmPopup) this.confirmPopup.classList.add("hidden");

    this.selectionMap.easeTo({
      center: [lng, lat],
      zoom: 17,
      duration: 800
    });
  },

  clearTempMarker() {
    if (this.tempMarker) {
      this.tempMarker.remove();
      this.tempMarker = null;
    }
    this.confirmPopup.classList.add("hidden");
    this.selectedCoords = null;
  },

  confirmStop() {
    if (!this.selectedCoords) return;

    const stopData = {
      lat: this.selectedCoords.lat,
      lng: this.selectedCoords.lng,
      timestamp: Date.now()
    };

    localStorage.setItem("userSavedStop", JSON.stringify(stopData));

    // Update main map marker
    MapManager.updateSavedStopMarker(stopData.lng, stopData.lat);

    // Update Dashboard UI
    this.updateDashboardUI();

    // Close overlay
    this.closeSelectionMap();

    showToast("Stop saved successfully!", "success");
  },

  removeStop() {
    if (confirm("Are you sure you want to remove your saved stop?")) {
      localStorage.removeItem("userSavedStop");
      MapManager.removeSavedStopMarker();
      this.updateDashboardUI();
      showToast("Stop removed", "info");
    }
  }
};

// =========================================
// Initialization
// =========================================
async function init() {
  console.log("[App] Initializing...");

  try {
    // Initialize Theme First
    ThemeManager.init();

    // Clear any stale bus data from previous sessions before displaying anything
    state.buses.clear();
    state.stops.clear();
    state.selectedBusId = null;

    MapManager.init();
    TabManager.init();
    SearchManager.init();
    SearchManager.initWelcomeSearch(); // Activate welcome prompt
    DashboardManager.init();
    BusDetailPopup.init();
    initMobileMenu();
    initTomTomServices();

    // Main search logic is handled by SearchManager.init()
    // which now points to the single search input in the Buses tab.

    DOM.panelCloseBtn.addEventListener("click", (e) => {
      console.log("[App] Close Button Clicked! Event:", e);
      MapManager.closePanel();
      console.log("[App] closePanel() method finished");
    });

    // Connect to WebSocket
    WebSocketManager.connect();

    // Fetch stops
    WebSocketManager.fetchStops().catch(() => {
      console.log("[App] Could not fetch stops");
    });

    // Load and display username and profile picture
    const clientData = localStorage.getItem("client");
    if (clientData) {
      try {
        const client = JSON.parse(clientData);

        // Update username
        if (DOM.usernameDisplay && client.username) {
          DOM.usernameDisplay.textContent = client.username;
        }

        // Update profile picture
        if (DOM.profileImageHeader && client.profilePicture) {
          DOM.profileImageHeader.style.backgroundImage = `url(${client.profilePicture})`;
          DOM.profileImageHeader.innerHTML = ""; // Remove SVG icon
        }
      } catch (e) {
        console.error("[App] Failed to load client data:", e);
      }
    }

    // Hide loading
    setTimeout(() => {
      DOM.loadingScreen.classList.add("hidden");
    }, 1000);

    console.log("[App] Ready");
  } catch (error) {
    console.error("[App] Init failed:", error);
    showToast("Failed to initialize", "error");
  }
}

document.addEventListener("DOMContentLoaded", init);

// Export
window.BusTrackApp = {
  CONFIG,
  state,
  MapManager,
  WebSocketManager,
  BusTracker,
  SearchManager,
  // Helper to clear all buses, markers, routes, and related UI state
  clearAll() {
    // Clear markers from map
    MapManager.markers.forEach((marker) => marker.remove());
    MapManager.markers.clear();

    // Clear bus/stops state
    state.buses.clear();
    state.stops.clear();
    state.selectedBusId = null;

    // Reset counts
    if (DOM.activeBusCount) DOM.activeBusCount.textContent = "0 Active";
    if (DOM.totalBuses) DOM.totalBuses.textContent = "0";
    if (DOM.totalStops) DOM.totalStops.textContent = "0";

    // Clear lists
    if (DOM.busGrid) DOM.busGrid.innerHTML = "";
    if (DOM.stopsGrid) DOM.stopsGrid.innerHTML = "";

    // Show "empty" placeholders
    if (DOM.busesEmpty) DOM.busesEmpty.style.display = "block";
    if (DOM.stopsEmpty) DOM.stopsEmpty.style.display = "block";

    // Close side panel if open
    MapManager.closePanel();

    // Optional: stop polling if you want a full reset
    if (WebSocketManager.pollingInterval) {
      clearInterval(WebSocketManager.pollingInterval);
      WebSocketManager.pollingInterval = null;
    }

    console.log("[App] Cleared all bus data, markers, and routes");
  },
};
