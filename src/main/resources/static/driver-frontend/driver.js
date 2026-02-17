/**
 * Bus Tracking - Driver Panel
 * Enterprise-grade GPS tracking and data transmission module
 *
 * @version 1.0.0
 * @description Handles GPS acquisition, data formatting, and REST API communication
 */

// =========================================
// Configuration Constants
// Modify these values to match your backend
// =========================================
// Helper to detect WebSocket URL based on environment
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

// Helper to get backend HTTP URL
function getApiBaseUrl() {
  const host = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;

  // Capacitor Support: Default to production URL
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    return "https://bus-tracking-master-production.up.railway.app";
  }

  // File protocol fallback - use production URL for Capacitor
  if (protocol === "file:") {
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
  /**
   * Backend WebSocket URL
   * Dynamically detects Dev Tunnels or localhost
   */
  WS_URL: (() => {
    const url = getWebSocketUrl("/ws/driver");
    console.log("[CONFIG] Calculated WS_URL:", url);
    return url;
  })(),

  /**
   * GPS update interval in milliseconds
   */
  UPDATE_INTERVAL: 1000,

  /**
   * Geolocation API options
   */
  GPS_OPTIONS: {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
  },

  /**
   * Maximum log entries to keep
   */
  MAX_LOG_ENTRIES: 100,
};

// =========================================
// Application State
// =========================================
const state = {
  // Bus information (from form)
  busNumber: "",
  busName: "",

  // Tracking state
  isTracking: false,
  isConfigured: false,

  // GPS state
  watchId: null,
  lastPosition: null,
  gpsStatus: "inactive", // inactive | active | error
  gpsPermissionGranted: false,
  gpsErrorCount: 0,
  backgroundWatcherId: null, // Capacitor Background Watcher ID

  // Transmission state
  sendInterval: null,
  updateCount: 0,
  lastUpdateTime: null,

  // WebSocket state
  socket: null,
  isConnected: false,

  // Wake Lock (keeps CPU alive while tracking)
  wakeLock: null,
};

// =========================================
// DOM Element References
// =========================================
const DOM = {
  // Navigation
  navTabs: document.querySelectorAll(".nav-tab"),
  tabPanels: document.querySelectorAll(".tab-panel"),
  connectionIndicator: document.getElementById("connectionIndicator"),

  // Dashboard elements
  dashGpsStatus: document.getElementById("dashGpsStatus"),
  dashTrackingStatus: document.getElementById("dashTrackingStatus"),
  dashGetStartedBtn: document.getElementById("dashGetStartedBtn"),
  dashLastUpdate: document.getElementById("dashLastUpdate"),
  dashStartBtn: document.getElementById("dashStartBtn"),
  dashStopBtn: document.getElementById("dashStopBtn"),
  dashHelpText: document.getElementById("dashHelpText"),

  // Dashboard details (new)
  dashDriverName: document.getElementById("dashDriverName"),
  dashDriverPhone: document.getElementById("dashDriverPhone"),
  dashBusNumber: document.getElementById("dashBusNumber"),
  dashBusName: document.getElementById("dashBusName"),

  // Setup elements (new)
  setupForm: document.getElementById("setupForm"),
  setupName: document.getElementById("setupName"),
  setupPhone: document.getElementById("setupPhone"),
  setupBusNumber: document.getElementById("setupBusNumber"),
  setupBusName: document.getElementById("setupBusName"),
  mainNavbarNav: document.getElementById("mainNavbarNav"),

  // Tracking status elements
  trackingIndicator: document.getElementById("trackingIndicator"),
  trackingStateText: document.getElementById("trackingStateText"),
  trackingStateDesc: document.getElementById("trackingStateDesc"),
  startTrackingBtn: document.getElementById("startTrackingBtn"),
  stopTrackingBtn: document.getElementById("stopTrackingBtn"),
  gpsStatusBadge: document.getElementById("gpsStatusBadge"),
  gpsStatusValue: document.getElementById("gpsStatusValue"),
  lastUpdatedValue: document.getElementById("lastUpdatedValue"),

  // Log
  logContainer: document.getElementById("logContainer"),
  clearLogBtn: document.getElementById("clearLogBtn"),

  // Alerts
  alertContainer: document.getElementById("alertContainer"),

  // Profile elements
  profileForm: document.getElementById("profileForm"),
  profileName: document.getElementById("profileName"),
  profilePhone: document.getElementById("profilePhone"),
  profileBusNumber: document.getElementById("profileBusNumber"),
  profileBusName: document.getElementById("profileBusName"),
  profileUsername: document.getElementById("profileUsername"),
  logoutBtn: document.getElementById("logoutBtn"),
  deleteAccountBtn: document.getElementById("deleteAccountBtn"),

  // Tracking Info Panel
  infoDriverName: document.getElementById("infoDriverName"),
  infoDriverPhone: document.getElementById("infoDriverPhone"),
};

// =========================================
// Navigation Controller
// =========================================
const NavigationController = {
  /**
   * Initialize navigation tab functionality
   */
  init() {
    DOM.navTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const targetId = tab.dataset.tab;
        this.switchTab(targetId);
      });
    });
  },

  /**
   * Switch to specified tab
   * @param {string} tabId - Target tab identifier
   */
  switchTab(tabId) {
    // Update tab buttons
    DOM.navTabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === tabId);
    });

    // Update panels
    DOM.tabPanels.forEach((panel) => {
      const panelId = panel.id.replace("-panel", "");
      panel.classList.toggle("active", panelId === tabId);
    });
  },
};

// =========================================
// Setup Controller (New)
// =========================================
const SetupController = {
  init() {
    if (!DOM.setupForm) return;

    DOM.setupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSetup();
    });

    this.loadInitialData();
  },

  loadInitialData() {
    const driverData = sessionStorage.getItem("driver");
    if (!driverData) return;

    const driver = JSON.parse(driverData);
    if (DOM.setupName) DOM.setupName.value = driver.name || "";
    if (DOM.setupPhone) DOM.setupPhone.value = driver.phone || "";
    if (DOM.setupBusNumber) DOM.setupBusNumber.value = driver.busNumber || "";
    if (DOM.setupBusName) DOM.setupBusName.value = driver.busName || "";
  },

  async handleSetup() {
    console.log("[Setup] handleSetup triggered");
    const name = DOM.setupName.value.trim();
    const phone = DOM.setupPhone.value.trim();
    const busNumber = DOM.setupBusNumber.value.trim();
    const busName = DOM.setupBusName.value.trim();

    if (!name || !phone || !busNumber || !busName) {
      AlertController.show(
        "Validation Error",
        "Please fill in all required fields.",
        "error",
      );
      return;
    }

    const driverData = sessionStorage.getItem("driver");
    if (!driverData) {
      AlertController.show(
        "Session Error",
        "No driver session found. Please login again.",
        "error",
      );
      return;
    }

    const driver = JSON.parse(driverData);

    // Debug logging
    console.log("[Setup] Driver data:", driver);
    console.log("[Setup] Driver ID:", driver.id);

    if (!driver.id) {
      AlertController.show(
        "Session Error",
        "Driver ID is missing. Please login again.",
        "error",
      );
      console.error("[Setup] Driver ID is undefined or null");
      return;
    }

    try {
      const baseUrl = getApiBaseUrl();
      const url = `${baseUrl}/api/driver/${driver.id}/profile`;
      console.log("[Setup] Calling API:", url);
      console.log("[Setup] Payload:", { name, phone, busNumber, busName });

      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, busNumber, busName }),
      });

      const data = await response.json();
      console.log("[Setup] Response:", data);

      if (data.success) {
        // Update local storage and app state
        sessionStorage.setItem("driver", JSON.stringify(data.driver));
        state.busNumber = busNumber;
        state.busName = busName;
        state.isConfigured = true;

        // Sync all UI components
        ProfileController.loadProfileData();

        // Start Tracking automatically
        await TrackingController.start();

        // Transition to Dashboard
        this.finishSetup();
      } else {
        AlertController.show(
          "Error",
          data.message || "Failed to update setup information",
          "error",
        );
        console.error("[Setup] Backend error:", data.message);
      }
    } catch (error) {
      console.error("Setup error:", error);
      AlertController.show(
        "Network Error",
        "Failed to connect to server. Check console for details.",
        "error",
      );
    }
  },

  finishSetup() {
    // Show navigation
    if (DOM.mainNavbarNav) DOM.mainNavbarNav.style.display = "flex";

    // Switch to dashboard
    NavigationController.switchTab("dashboard");

    LogController.add("Setup complete. Session started.", "success");
    AlertController.show(
      "Welcome",
      "Tracking session started successfully!",
      "success",
    );
  },
};
const ProfileController = {
  /**
   * Initialize profile management
   */
  init() {
    if (!DOM.profileForm) return;

    DOM.profileForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.updateProfile();
    });

    if (DOM.logoutBtn) {
      DOM.logoutBtn.addEventListener("click", () => logout());
    }

    if (DOM.deleteAccountBtn) {
      DOM.deleteAccountBtn.addEventListener("click", () =>
        this.deleteAccount(),
      );
    }

    this.loadProfileData();
  },

  /**
   * Load current driver data into profile form
   */
  loadProfileData() {
    const driverData = sessionStorage.getItem("driver");
    if (!driverData) return;

    const driver = JSON.parse(driverData);

    if (DOM.profileUsername) DOM.profileUsername.textContent = driver.username;
    if (DOM.profileName) DOM.profileName.value = driver.name || "";
    if (DOM.profilePhone) DOM.profilePhone.value = driver.phone || "";
    if (DOM.profileBusNumber)
      DOM.profileBusNumber.value = driver.busNumber || "";
    if (DOM.profileBusName) DOM.profileBusName.value = driver.busName || "";

    // Also update tracking panel info
    if (DOM.infoDriverName)
      DOM.infoDriverName.textContent = driver.name || "--";
    if (DOM.infoDriverPhone)
      DOM.infoDriverPhone.textContent = driver.phone || "--";

    // Update dashboard details
    if (DOM.dashDriverName)
      DOM.dashDriverName.textContent = driver.name || "--";
    if (DOM.dashDriverPhone)
      DOM.dashDriverPhone.textContent = driver.phone || "--";
    if (DOM.dashBusNumber)
      DOM.dashBusNumber.textContent = driver.busNumber || "--";
    if (DOM.dashBusName) DOM.dashBusName.textContent = driver.busName || "--";

    this.updateDashboardButtons();
  },

  /**
   * Update dashboard buttons based on configuration
   */
  updateDashboardButtons() {
    const canStart = state.isConfigured && !state.isTracking;
    const canStop = state.isTracking;

    if (DOM.dashStartBtn) DOM.dashStartBtn.disabled = !canStart;
    if (DOM.dashStopBtn) DOM.dashStopBtn.disabled = !canStop;
    if (DOM.startTrackingBtn) DOM.startTrackingBtn.disabled = !canStart;
    if (DOM.stopTrackingBtn) DOM.stopTrackingBtn.disabled = !canStop;

    if (DOM.dashHelpText) {
      if (state.isConfigured) {
        DOM.dashHelpText.textContent = state.isTracking
          ? "Tracking is active. Click Stop to end the session."
          : "Click Start Tracking to begin GPS transmission.";
      } else {
        DOM.dashHelpText.textContent =
          "Please update your profile information to enable tracking.";
      }
    }
  },

  /**
   * Update profile details
   */
  async updateProfile() {
    const driverData = sessionStorage.getItem("driver");
    if (!driverData) return;

    const driver = JSON.parse(driverData);

    const name = DOM.profileName.value.trim();
    const phone = DOM.profilePhone.value.trim();
    const busNumber = DOM.profileBusNumber.value.trim();
    const busName = DOM.profileBusName.value.trim();

    if (!name || !phone || !busNumber || !busName) {
      AlertController.show(
        "Validation Error",
        "Reference Name, Phone, Bus Number and Route Name are required.",
        "error",
      );
      return;
    }

    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(
        `${baseUrl}/api/driver/${driver.id}/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, phone, busNumber, busName }),
        },
      );

      const data = await response.json();

      if (data.success) {
        // Update local storage
        sessionStorage.setItem("driver", JSON.stringify(data.driver));

        // Update app state
        state.busNumber = busNumber;
        state.busName = busName;
        state.isConfigured = true;

        // Sync UI
        this.loadProfileData();

        AlertController.show(
          "Success",
          "Profile updated successfully",
          "success",
        );
        LogController.add("Profile and bus details updated", "success");
      } else {
        AlertController.show(
          "Error",
          data.message || "Failed to update profile",
          "error",
        );
      }
    } catch (error) {
      console.error("Profile update error:", error);
      AlertController.show(
        "Network Error",
        "Failed to connect to server",
        "error",
      );
    }
  },

  /**
   * Delete driver account
   */
  async deleteAccount() {
    const driverData = sessionStorage.getItem("driver");
    if (!driverData) return;

    const driver = JSON.parse(driverData);

    showConfirmDialog({
      title: "Delete Account",
      message:
        "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.",
      icon: "⚠️",
      iconBg: "rgba(239, 68, 68, 0.15)",
      btnText: "Delete Account",
      btnColor: "#ef4444",
      onConfirm: async () => {
        try {
          const baseUrl = getApiBaseUrl();
          const response = await fetch(`${baseUrl}/api/driver/${driver.id}`, {
            method: "DELETE",
          });

          const data = await response.json();

          if (data.success) {
            AlertController.show(
              "Success",
              "Your account has been deleted successfully.",
              "success",
            );
            setTimeout(() => {
              sessionStorage.removeItem("driver");
              window.location.href = "login.html";
            }, 2000);
          } else {
            AlertController.show(
              "Error",
              data.message || "Failed to delete account",
              "error",
            );
          }
        } catch (error) {
          console.error("Account deletion error:", error);
          AlertController.show(
            "Network Error",
            "Failed to connect to server",
            "error",
          );
        }
      },
    });
  },
};

/**
 * Confirmation dialog utility
 */
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

/**
 * Logout utility
 */
function logout() {
  showConfirmDialog({
    title: "Logout",
    message:
      "Are you sure you want to logout? You will need to sign in again to access your account.",
    icon: "🚪",
    iconBg: "rgba(251, 146, 60, 0.15)",
    btnText: "Logout",
    btnColor: "#f97316",
    onConfirm: () => {
      sessionStorage.removeItem("driver");
      window.location.href = "login.html";
    },
  });
}

// =========================================
// GPS Controller
// =========================================
const GPSController = {
  /**
   * Check if Geolocation API is supported
   * @returns {boolean}
   */
  isSupported() {
    return "geolocation" in navigator;
  },

  /**
   * Request GPS permission and start watching position
   * @param {Function} onSuccess - Success callback
   * @param {Function} onError - Error callback
   * @returns {number|null} Watch ID or null on failure
   */
  async startWatching(onSuccess, onError) {
    if (
      window.Capacitor &&
      window.Capacitor.isPluginAvailable("BackgroundGeolocation")
    ) {
      LogController.add("Using Capacitor Background Geolocation", "info");
      const { BackgroundGeolocation } = window.Capacitor.Plugins;

      this.updateStatus("waiting");

      try {
        // Use await to handle both Promise and direct value returns safely
        const watcherId = await BackgroundGeolocation.addWatcher(
          {
            backgroundMessage: "Location tracking active",
            backgroundTitle: "Bus Tracking Running",
            requestPermissions: true,
            stale: false,
            distanceFilter: 0, // Update on every small change
          },
          (location, error) => {
            if (error) {
              this.updateStatus("error");
              onError(error);
              return;
            }
            if (location) {
              state.lastPosition = {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                timestamp: location.time,
              };
              this.updateStatus("active");
              onSuccess(state.lastPosition);
            }
          },
        );

        state.backgroundWatcherId = watcherId;
        return "capacitor-watcher";
      } catch (e) {
        LogController.add("Background Watcher Error: " + e.message, "error");
        console.error(e);
        // Fallback to standard geolocation if plugin fails
      }
    }

    if (!this.isSupported()) {
      onError({
        code: 0,
        message: "Geolocation API is not supported by this browser.",
      });
      return null;
    }

    LogController.add("Requesting GPS permission...", "info");
    this.updateStatus("waiting");

    return navigator.geolocation.watchPosition(
      (position) => {
        state.lastPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        this.updateStatus("active");
        this.updateDisplay();
        onSuccess(state.lastPosition);
      },
      (error) => {
        this.updateStatus("error");
        onError(error);
      },
      CONFIG.GPS_OPTIONS,
    );
  },

  /**
   * Stop watching GPS position
   * @param {number} watchId - Watch ID to clear
   */
  stopWatching(watchId) {
    if (window.Capacitor && state.backgroundWatcherId) {
      const { BackgroundGeolocation } = window.Capacitor.Plugins;
      BackgroundGeolocation.removeWatcher({ id: state.backgroundWatcherId });
      state.backgroundWatcherId = null;
    } else if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
    this.updateStatus("inactive");
  },

  /**
   * Update GPS status in UI
   * @param {string} status - Status: inactive | waiting | active | error
   */
  updateStatus(status) {
    state.gpsStatus = status;

    const statusTexts = {
      inactive: "Inactive",
      waiting: "Requesting Permission...",
      active: "Active",
      error: "GPS Error",
    };

    const badgeClasses = {
      inactive: "",
      waiting: "badge-warning",
      active: "badge-success",
      error: "badge-danger",
    };

    // Update status badge
    DOM.gpsStatusBadge.textContent = statusTexts[status];
    DOM.gpsStatusBadge.className = "badge " + (badgeClasses[status] || "");

    // Update status value
    DOM.gpsStatusValue.textContent = statusTexts[status];

    // Update dashboard
    DOM.dashGpsStatus.textContent = statusTexts[status];
  },

  /**
   * Update GPS display values
   * Note: Display removed from driver UI - data still tracked for backend transmission
   */
  updateDisplay() {
    // GPS coordinates no longer displayed in driver UI
    // Data is still captured in state.lastPosition for backend transmission
  },

  /**
   * Open App Settings to allow user to disable battery optimization or change permissions
   */
  async openSettings() {
    if (
      window.Capacitor &&
      window.Capacitor.isPluginAvailable("BackgroundGeolocation")
    ) {
      const { BackgroundGeolocation } = window.Capacitor.Plugins;
      try {
        await BackgroundGeolocation.openSettings();
      } catch (e) {
        console.warn("Could not open settings", e);
      }
    }
  },

  /**
   * Acquire a Wake Lock to prevent the CPU from sleeping during tracking.
   * Uses the Web Wake Lock API (supported in Android WebView 84+).
   */
  async acquireWakeLock() {
    if (!("wakeLock" in navigator)) {
      console.log("[WakeLock] API not available");
      return;
    }
    try {
      state.wakeLock = await navigator.wakeLock.request("screen");
      console.log("[WakeLock] Acquired");
      LogController.add("Wake lock acquired for background tracking", "info");

      state.wakeLock.addEventListener("release", () => {
        console.log("[WakeLock] Released by system");
      });
    } catch (e) {
      console.warn("[WakeLock] Failed to acquire:", e);
    }
  },

  /**
   * Release the Wake Lock when tracking stops.
   */
  async releaseWakeLock() {
    if (state.wakeLock) {
      try {
        await state.wakeLock.release();
        state.wakeLock = null;
        console.log("[WakeLock] Released");
      } catch (e) {
        console.warn("[WakeLock] Release error:", e);
      }
    }
  },
};

// =========================================
// WebSocket Controller
// =========================================
const WebSocketController = {
  reconnectAttempts: 0,
  maxReconnectAttempts: 10,
  shouldReconnect: true,
  reconnectTimeout: null,
  heartbeatInterval: null,
  HEARTBEAT_RATE: 30000, // 30 seconds keep-alive

  connectingPromise: null,

  connect() {
    if (this.connectingPromise) {
      return this.connectingPromise;
    }

    if (state.socket && state.socket.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    this.connectingPromise = new Promise((resolve, reject) => {
      const wsUrl = CONFIG.WS_URL;
      LogController.add("Connecting to: " + wsUrl, "info");
      console.log("[WebSocket] Attempting connection to:", wsUrl);

      try {
        // Close existing socket if any (cleanup)
        if (state.socket) {
          state.socket.onopen = null;
          state.socket.onclose = null;
          state.socket.onerror = null;
          state.socket.onmessage = null;
          try {
            state.socket.close();
          } catch (e) {}
        }

        state.socket = new WebSocket(wsUrl);
      } catch (e) {
        this.connectingPromise = null;
        LogController.add("WebSocket creation failed: " + e.message, "error");
        reject(e);
        return;
      }

      state.socket.onopen = () => {
        this.connectingPromise = null;
        state.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.updateUI("connected");
        LogController.add("Connected to backend successfully", "success");
        resolve();
      };

      state.socket.onclose = (event) => {
        this.connectingPromise = null;
        state.isConnected = false;
        this.stopHeartbeat();
        this.updateUI("offline");

        const reason = event.reason || "none";
        LogController.add(
          `Disconnected (code: ${event.code}, reason: ${reason})`,
          "warning",
        );

        if (
          state.isTracking &&
          this.shouldReconnect &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this.reconnectAttempts++;
          const delay = Math.min(
            1000 * Math.pow(2, this.reconnectAttempts - 1),
            30000,
          );
          LogController.add(
            `Retrying in ${delay / 1000}s (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
            "info",
          );

          if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = setTimeout(() => {
            this.connect()
              .then(() => {
                const driverData = JSON.parse(sessionStorage.getItem("driver"));
                const startPayload = {
                  busNumber: state.busNumber,
                  busName: state.busName,
                  busStop: "College",
                  action: "START",
                  driverId: driverData ? driverData.id : null,
                  driverName: driverData ? driverData.name : "",
                  driverPhone: driverData ? driverData.phone : "",
                };
                this.send(startPayload);
              })
              .catch((err) => console.error("Auto-reconnect failed", err));
          }, delay);
        }
      };

      state.socket.onerror = (event) => {
        this.connectingPromise = null;
        LogController.add("Connection error occurred", "error");
        console.error("[WebSocket] Error:", event);
        this.updateUI("error");
        reject(new Error("WebSocket connection error"));
      };

      state.socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "PING") return;
          LogController.add("Received from server: " + event.data, "info");
        } catch (e) {}
      };
    });

    return this.connectingPromise;
  },

  disconnect() {
    this.shouldReconnect = false; // Prevent auto-reconnect on intentional disconnect
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (state.socket) {
      state.socket.close();
      state.socket = null;
    }
    this.reconnectAttempts = 0;
  },

  send(data) {
    if (state.socket && state.socket.readyState === WebSocket.OPEN) {
      state.socket.send(JSON.stringify(data));
      return true;
    }
    return false;
  },

  updateUI(status) {
    const indicator = DOM.connectionIndicator;
    const text = indicator.querySelector(".indicator-text");

    indicator.classList.remove("connected", "error");

    switch (status) {
      case "connected":
        indicator.classList.add("connected");
        text.textContent = "Online";
        break;
      case "error":
        indicator.classList.add("error");
        text.textContent = "Error";
        break;
      default:
        text.textContent = "Offline";
    }
  },

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (state.socket && state.socket.readyState === WebSocket.OPEN) {
        // Send light-weight PING to keep connection alive
        state.socket.send(JSON.stringify({ type: "PING" }));
        console.log("[WebSocket] Sent PING");
      }
    }, this.HEARTBEAT_RATE);
  },

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  },
};

// =========================================
// Tracking Controller
// =========================================
const TrackingController = {
  /**
   * Initialize tracking controls
   */
  init() {
    DOM.dashStartBtn.addEventListener("click", async () => {
      // Switch to tracking tab first for better UX
      NavigationController.switchTab("tracking-status");
      await this.start();
    });
    DOM.dashStopBtn.addEventListener("click", () => this.stop());

    // Tracking panel buttons
    DOM.startTrackingBtn.addEventListener("click", () => this.start());
    DOM.stopTrackingBtn.addEventListener("click", () => this.stop());
  },

  /**
   * Start GPS tracking and data transmission
   */
  async start() {
    if (!state.isConfigured) {
      AlertController.show(
        "Configuration Required",
        "Please enter bus details before starting tracking.",
        "error",
      );
      return;
    }

    if (state.isTracking) {
      return;
    }

    try {
      // Enable auto-reconnection for this tracking session
      WebSocketController.shouldReconnect = true;

      // Step 1: Request GPS permission (immediate if already granted)
      LogController.add("Initiating tracking...", "info");
      this.updateTrackingUI("starting");

      // Acquire wake lock to prevent CPU sleep
      await GPSController.acquireWakeLock();

      // Explicit permission request for Android 10+
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        const { Geolocation } = window.Capacitor.Plugins;
        try {
          const status = await Geolocation.checkPermissions();
          LogController.add(
            "Permission status: " + JSON.stringify(status),
            "info",
          );

          if (status.location !== "granted") {
            const perm = await Geolocation.requestPermissions();
            if (perm.location !== "granted") {
              LogController.add(
                "Permission denied: Tracking may fail in background",
                "error",
              );
              AlertController.show(
                "Permission Required",
                'Please set Location to "Allow all the time" in App Settings for background tracking.',
                "warning",
              );
            }
          }
        } catch (e) {
          console.warn("Geolocation permission check failed", e);
        }

        // Request battery optimization exemption (critical for Samsung, Xiaomi, etc.)
        try {
          if (window.Capacitor.Plugins.BackgroundGeolocation) {
            LogController.add(
              "Requesting battery optimization exemption...",
              "info",
            );
          }
        } catch (e) {
          console.warn("Battery optimization request failed", e);
        }
      }

      // Step 2 & 3: Connect WebSocket and Start Watcher in parallel
      LogController.add("Connecting to service...", "info");

      // Initiate connections simultaneously
      const [connectionResult, watcherResult] = await Promise.allSettled([
        WebSocketController.connect(),
        GPSController.startWatching(
          (position) => {
            // Position update logic
            if (!state.isTracking) {
              state.isTracking = true;
              state.gpsPermissionGranted = true;
              state.gpsErrorCount = 0;

              WebSocketController.send({
                busNumber: state.busNumber,
                action: "GPS_ACTIVE",
              });

              this.updateTrackingUI("active");
              this.startDataTransmission();
              LogController.add("GPS tracking active", "success");
            }
            this.sendUpdate();
          },
          (error) => this.handleGPSError(error),
        ),
      ]);

      if (connectionResult.status === "rejected") {
        throw new Error(
          "Server connection failed: " + connectionResult.reason.message,
        );
      }

      state.watchId =
        watcherResult.status === "fulfilled" ? watcherResult.value : null;

      // Step 4: Send START action - Immediately notify server
      const driverData = JSON.parse(sessionStorage.getItem("driver"));
      const startPayload = {
        busNumber: state.busNumber,
        busName: state.busName,
        busStop: "College",
        action: "START",
        driverId: driverData ? driverData.id : null,
        driverName: driverData ? driverData.name : "",
        driverPhone: driverData ? driverData.phone : "",
      };

      if (WebSocketController.send(startPayload)) {
        LogController.add("Session started immediately", "success");

        // CRITICAL: Remind driver about background settings
        AlertController.show(
          "Tracking Background Active",
          'To keep tracking while the screen is off:\n1. Select "Allow all the time" in Location settings.\n2. Disable "Battery Optimization" for this app.',
          "info",
        );

        // Don't wait for first GPS fix to show active IF we already have a location
        if (state.lastPosition) {
          this.updateTrackingUI("active");
          this.startDataTransmission();
        }
      }
    } catch (error) {
      const errorMsg = error.message || "Unknown error";
      LogController.add("Failed to initialize: " + errorMsg, "error");
      AlertController.show(
        "Tracking Error",
        "Could not start tracking: " + errorMsg,
        "error",
      );
      this.stop();
    }
  },

  /**
   * Stop GPS tracking and data transmission
   */
  stop() {
    if (!state.isTracking && state.watchId === null) {
      return;
    }

    LogController.add("Stopping GPS tracking...", "info");

    // Send STOP action to backend
    if (state.isTracking) {
      WebSocketController.send({
        busNumber: state.busNumber,
        action: "STOP",
      });
      LogController.add("Bus session stopped on server", "info");
    }

    // Stop GPS
    GPSController.stopWatching(state.watchId);
    state.watchId = null;

    // Stop data transmission
    this.stopDataTransmission();

    // Release wake lock
    GPSController.releaseWakeLock();

    // Disconnect WebSocket
    WebSocketController.disconnect();

    // Update state
    state.isTracking = false;
    state.lastPosition = null;

    this.updateTrackingUI("stopped");

    LogController.add("GPS tracking stopped", "success");
  },

  /**
   * Start interval-based data transmission
   */
  startDataTransmission() {
    if (state.sendInterval) {
      clearInterval(state.sendInterval);
      state.sendInterval = null;
    }

    // Send immediately
    this.sendUpdate();

    // CRITICAL: Periodic fallback every 5 seconds.
    // The background geolocation plugin delivers location natively, but the
    // JS bridge can sometimes stall when the WebView is deprioritised.
    // This interval acts as a heartbeat that re-sends the latest cached
    // position so the server always has fresh data.
    state.sendInterval = setInterval(() => {
      if (state.isTracking && state.lastPosition) {
        this.sendUpdate();
      }
    }, 5000);

    this.updateConnectionIndicator("connected");
  },

  /**
   * Stop data transmission
   */
  stopDataTransmission() {
    if (state.sendInterval) {
      clearInterval(state.sendInterval);
      state.sendInterval = null;
    }

    this.updateConnectionIndicator("offline");
  },

  /**
   * Send single location update to backend
   */
  sendUpdate() {
    if (!state.lastPosition || !state.isTracking) {
      return;
    }

    const payload = {
      busNumber: state.busNumber,
      latitude: state.lastPosition.latitude,
      longitude: state.lastPosition.longitude,
    };

    const success = WebSocketController.send(payload);

    if (success) {
      state.updateCount++;
      state.lastUpdateTime = new Date();
      this.updateCounterDisplay();
    } else {
      // Is it actually disconnected or just connecting?
      const isConnecting =
        (state.socket && state.socket.readyState === WebSocket.CONNECTING) ||
        WebSocketController.connectingPromise;

      if (!isConnecting) {
        LogController.add(
          "WebSocket offline, attempting reconnection...",
          "warning",
        );
        WebSocketController.updateUI("error");
        WebSocketController.connect().catch((e) =>
          console.warn("Background reconnect failed", e),
        );
      } else {
        // Silent if already connecting to avoid spamming the log
        console.log("[Tracking] Skipping update: Socket is connecting");
      }
    }
  },

  /**
   * Handle GPS errors
   * @param {GeolocationPositionError} error
   */
  handleGPSError(error) {
    let title, message;
    let shouldStopTracking = true;

    switch (error.code) {
      case error.PERMISSION_DENIED:
        title = "GPS Permission Denied";
        const isSecure =
          window.location.protocol === "https:" ||
          window.location.hostname === "localhost";
        if (!isSecure) {
          message =
            "Browser blocked GPS because the connection is not secure. YOU MUST USE HTTPS.";
        } else {
          message =
            "Please allow location access in your browser settings to use tracking.";
        }
        shouldStopTracking = true; // Must stop - permission denied
        break;
      case error.POSITION_UNAVAILABLE:
        title = "Location Unavailable";
        message = "GPS signal lost. Waiting for GPS to reconnect...";
        shouldStopTracking = false; // Don't stop - GPS might come back
        break;
      case error.TIMEOUT:
        title = "GPS Timeout";
        message = "Location request timed out. Retrying...";
        shouldStopTracking = false; // Don't stop - just a timeout
        break;
      default:
        title = "GPS Error";
        message = error.message || "An unknown GPS error occurred.";
        shouldStopTracking = false;
    }

    // Only show alert for permission denied (critical error)
    if (error.code === error.PERMISSION_DENIED) {
      AlertController.show(title, message, "error");
    } else {
      // For other errors, just log (GPS might recover)
      LogController.add(`${title}: ${message}`, "warning");
    }

    // Send GPS_ERROR action to backend to mark bus as inactive
    state.gpsPermissionGranted = false;
    state.gpsErrorCount++;

    if (
      state.isTracking &&
      state.socket &&
      state.socket.readyState === WebSocket.OPEN
    ) {
      WebSocketController.send({
        busNumber: state.busNumber,
        action: "GPS_ERROR",
        errorCode: error.code,
        errorMessage: title,
      });
      LogController.add("GPS error reported to backend", "info");
    }

    // Only stop tracking if permission was denied
    if (shouldStopTracking) {
      this.stop();
    } else {
      // Keep tracking active but update UI to show GPS is unavailable
      GPSController.updateStatus("error");
      this.updateTrackingUI("error");
    }
  },

  /**
   * Update tracking UI state
   * @param {string} status - starting | active | stopped | error
   */
  updateTrackingUI(status) {
    const indicator = DOM.trackingIndicator;

    // Status texts
    const texts = {
      starting: { main: "Starting...", sub: "Requesting GPS permission" },
      active: { main: "Tracking Active", sub: "Transmitting location data" },
      stopped: { main: "Stopped", sub: "Click Start to begin GPS tracking" },
      error: { main: "Error", sub: "GPS error occurred" },
    };

    const t = texts[status] || texts.stopped;
    DOM.trackingStateText.textContent = t.main;
    DOM.trackingStateDesc.textContent = t.sub;

    // Dashboard status
    DOM.dashTrackingStatus.textContent =
      status === "active" ? "Running" : "Stopped";

    // Update dashboard buttons
    ProfileController.updateDashboardButtons();

    // Indicator styling
    indicator.classList.remove("active", "error");
    if (status === "active") {
      indicator.classList.add("active");
    } else if (status === "error") {
      indicator.classList.add("error");
    }
  },

  /**
   * Update counter displays
   */
  updateCounterDisplay() {
    // Update last update timestamp
    if (state.lastUpdateTime) {
      const timeStr = state.lastUpdateTime.toLocaleTimeString("en-US", {
        hour12: false,
      });
      if (DOM.dashLastUpdate) {
        DOM.dashLastUpdate.textContent = timeStr;
      }
      if (DOM.lastUpdatedValue) {
        DOM.lastUpdatedValue.textContent = timeStr;
      }
    }
  },

  /**
   * Update connection indicator
   * @param {string} status - connected | offline | error
   */
  updateConnectionIndicator(status) {
    WebSocketController.updateUI(status);
  },
};

// =========================================
// Log Controller
// =========================================
const LogController = {
  /**
   * Initialize log controls
   */
  init() {
    DOM.clearLogBtn.addEventListener("click", () => this.clear());
  },

  /**
   * Add log entry
   * @param {string} message - Log message
   * @param {string} type - info | success | error | warning
   */
  add(message, type = "info") {
    const time = new Date().toLocaleTimeString("en-US", { hour12: false });

    const entry = document.createElement("div");
    entry.className = `log-entry log-${type}`;
    entry.innerHTML = `
            <span class="log-time">${time}</span>
            <span class="log-message">${message}</span>
        `;

    DOM.logContainer.appendChild(entry);

    // Scroll to bottom
    DOM.logContainer.scrollTop = DOM.logContainer.scrollHeight;

    // Limit entries
    while (DOM.logContainer.children.length > CONFIG.MAX_LOG_ENTRIES) {
      DOM.logContainer.removeChild(DOM.logContainer.firstChild);
    }

    // Console log
    console.log(`[${type.toUpperCase()}] ${message}`);
  },

  /**
   * Clear all log entries
   */
  clear() {
    DOM.logContainer.innerHTML = "";
    this.add("Log cleared", "info");
  },
};

// =========================================
// Alert Controller
// =========================================
const AlertController = {
  /**
   * Show alert notification
   * @param {string} title - Alert title
   * @param {string} message - Alert message
   * @param {string} type - error | success | warning
   */
  show(title, message, type = "info") {
    const alert = document.createElement("div");
    alert.className = `alert alert-${type}`;

    const iconSvg =
      type === "error"
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
        : type === "success"
          ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
          : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

    alert.innerHTML = `
            <div class="alert-icon">${iconSvg}</div>
            <div class="alert-content">
                <div class="alert-title">${title}</div>
                <div class="alert-message">${message}</div>
            </div>
            <button class="alert-close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;

    // Close button handler
    alert.querySelector(".alert-close").addEventListener("click", () => {
      alert.remove();
    });

    DOM.alertContainer.appendChild(alert);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (alert.parentNode) {
        alert.style.opacity = "0";
        alert.style.transform = "translateX(100%)";
        setTimeout(() => alert.remove(), 300);
      }
    }, 5000);
  },
};

// =========================================
// Network Controller
// Handles connectivity changes for robust background tracking
// =========================================
const NetworkController = {
  async init() {
    if (window.Capacitor && window.Capacitor.isPluginAvailable("Network")) {
      const { Network } = window.Capacitor.Plugins;

      Network.addListener("networkStatusChange", (status) => {
        console.log("[Network] Status changed:", status);

        if (status.connected) {
          LogController.add(
            "Network restored: " + (status.connectionType || "online"),
            "info",
          );
          // If tracking is active but socket is dead, reconnect immediately
          if (
            state.isTracking &&
            (!state.socket || state.socket.readyState !== WebSocket.OPEN)
          ) {
            LogController.add("Attempting background reconnection...", "info");
            WebSocketController.connect().catch((e) =>
              console.warn("Background network reconnect failed", e),
            );
          }
        } else {
          LogController.add("Network lost: Connection suspended", "warning");
          WebSocketController.updateUI("offline");
        }
      });

      const status = await Network.getStatus();
      console.log("[Network] Initial status:", status);
    }
  },
};

// =========================================
// Application Initialization
// =========================================
function initApp() {
  console.log("[Driver Panel] Initializing...");

  // Check Authentication
  const driverData = sessionStorage.getItem("driver");
  if (!driverData) {
    window.location.href = "login.html";
    return;
  }

  // Prefill form from localStorage (from signup) or sessionStorage (from login)
  try {
    const savedConfig = localStorage.getItem("driverConfig");
    const driverObj = JSON.parse(driverData);

    // Priority: 1. localStorage (new signup), 2. sessionStorage (existing profile), 3. Empty
    const config = savedConfig ? JSON.parse(savedConfig) : {};

    if (DOM.setupName)
      DOM.setupName.value = config.name || driverObj.name || "";
    if (DOM.setupPhone)
      DOM.setupPhone.value = config.phone || driverObj.phone || "";
    if (DOM.setupBusNumber)
      DOM.setupBusNumber.value = config.busNumber || driverObj.busNumber || "";
    if (DOM.setupBusName)
      DOM.setupBusName.value = config.busName || driverObj.busName || "";

    // Clear temp storage to prevent stale data
    if (savedConfig) {
      localStorage.removeItem("driverConfig");
    }
  } catch (e) {
    console.error("Error prefilling driver config:", e);
  }

  // Check GPS support
  if (!GPSController.isSupported()) {
    AlertController.show(
      "GPS Not Supported",
      "Your browser does not support the Geolocation API. Please use a modern browser.",
      "error",
    );
  }

  // New: Check for HTTPS
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const isLocal =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.includes(".devtunnels.ms");

  if (protocol !== "https:" && !isLocal) {
    AlertController.show(
      "Insecure Connection",
      'GPS Tracking REQUIRES a secure HTTPS connection. Please use "https://" instead of "http://".',
      "error",
    );
    LogController.add(
      "CRITICAL: GPS requires HTTPS on non-local networks.",
      "error",
    );
  }

  // Initialize controllers
  NavigationController.init();
  TrackingController.init();
  LogController.init();
  ProfileController.init();
  SetupController.init();
  NetworkController.init();

  // Initialize state from existing data
  if (driverData) {
    const driver = JSON.parse(driverData);
    if (driver.busNumber) {
      state.busNumber = driver.busNumber;
      state.busName = driver.busName || driver.busNumber;
      state.isConfigured = true;
    }
  }

  // Population
  ProfileController.loadProfileData();

  // Initial log
  LogController.add("System initialized. Ready for tracking.", "info");

  // Check if tracking is already active (on refresh)
  if (state.isTracking) {
    SetupController.finishSetup();
  }

  // Re-acquire wake lock when app returns to foreground (system releases it on screen off)
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "visible" && state.isTracking) {
      console.log("[Visibility] App resumed — re-acquiring wake lock");
      await GPSController.acquireWakeLock();

      // Also ensure WebSocket is alive
      if (!state.socket || state.socket.readyState !== WebSocket.OPEN) {
        LogController.add("Reconnecting after resume...", "info");
        WebSocketController.connect().catch((e) =>
          console.warn("Resume reconnect failed", e),
        );
      }
    }
  });

  // Warn before page close if tracking
  window.addEventListener("beforeunload", (e) => {
    if (state.isTracking) {
      e.preventDefault();
      e.returnValue =
        "GPS tracking is still active. Are you sure you want to leave?";
      return e.returnValue;
    }
  });

  console.log("[Driver Panel] Initialization complete");
}

// Start application when DOM is ready
document.addEventListener("DOMContentLoaded", initApp);

// Export for debugging
window.DriverPanel = {
  CONFIG,
  state,
  GPSController,
  TrackingController,
};
