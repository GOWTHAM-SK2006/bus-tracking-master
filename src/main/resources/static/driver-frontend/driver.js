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
function getWebSocketUrl(endpoint) {
    const host = window.location.hostname;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    // VS Code Dev Tunnels: hostname format is "xxx-PORT.inc1.devtunnels.ms"
    if (host.includes('.devtunnels.ms')) {
        // Extract the tunnel ID prefix and replace port with 8080
        const tunnelMatch = host.match(/^([^-]+)-\d+\.(.+)$/);
        if (tunnelMatch) {
            return `${protocol}//${tunnelMatch[1]}-8080.${tunnelMatch[2]}${endpoint}`;
        }
    }

    // Standard localhost or IP-based deployment
    return `${protocol}//${host}:8080${endpoint}`;
}

// Helper to get backend HTTP URL
function getApiBaseUrl() {
    const host = window.location.hostname;
    const protocol = window.location.protocol;

    // VS Code Dev Tunnels
    if (host.includes('.devtunnels.ms')) {
        const tunnelMatch = host.match(/^([^-]+)-\d+\.(.+)$/);
        if (tunnelMatch) {
            return `${protocol}//${tunnelMatch[1]}-8080.${tunnelMatch[2]}`;
        }
    }

    return `${protocol}//${host}:8080`;
}

const CONFIG = {
    /**
     * Backend WebSocket URL
     * Dynamically detects Dev Tunnels or localhost
     */
    WS_URL: (() => {
        const url = getWebSocketUrl('/ws/driver');
        console.log('[CONFIG] Calculated WS_URL:', url);
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
        maximumAge: 0
    },

    /**
     * Maximum log entries to keep
     */
    MAX_LOG_ENTRIES: 100
};

// =========================================
// Application State
// =========================================
const state = {
    // Bus information (from form)
    busNumber: '',
    busName: '',

    // Tracking state
    isTracking: false,
    isConfigured: false,

    // GPS state
    watchId: null,
    lastPosition: null,
    gpsStatus: 'inactive', // inactive | active | error
    gpsPermissionGranted: false,
    gpsErrorCount: 0,

    // Transmission state
    sendInterval: null,
    updateCount: 0,
    lastUpdateTime: null,

    // WebSocket state
    socket: null,
    isConnected: false
};

// =========================================
// DOM Element References
// =========================================
const DOM = {
    // Navigation
    navTabs: document.querySelectorAll('.nav-tab'),
    tabPanels: document.querySelectorAll('.tab-panel'),
    connectionIndicator: document.getElementById('connectionIndicator'),

    // Dashboard elements
    dashGpsStatus: document.getElementById('dashGpsStatus'),
    dashTrackingStatus: document.getElementById('dashTrackingStatus'),
    dashGetStartedBtn: document.getElementById('dashGetStartedBtn'),
    dashUpdateCount: document.getElementById('dashUpdateCount'),
    dashLastUpdate: document.getElementById('dashLastUpdate'),
    dashStartBtn: document.getElementById('dashStartBtn'),
    dashStopBtn: document.getElementById('dashStopBtn'),
    dashHelpText: document.getElementById('dashHelpText'),
    dashLatitude: document.getElementById('dashLatitude'),
    dashLongitude: document.getElementById('dashLongitude'),
    dashAccuracy: document.getElementById('dashAccuracy'),

    // Dashboard details (new)
    dashDriverName: document.getElementById('dashDriverName'),
    dashDriverPhone: document.getElementById('dashDriverPhone'),
    dashBusNumber: document.getElementById('dashBusNumber'),
    dashBusName: document.getElementById('dashBusName'),

    // Setup elements (new)
    setupForm: document.getElementById('setupForm'),
    setupName: document.getElementById('setupName'),
    setupPhone: document.getElementById('setupPhone'),
    setupBusNumber: document.getElementById('setupBusNumber'),
    setupBusName: document.getElementById('setupBusName'),
    mainNavbarNav: document.getElementById('mainNavbarNav'),

    // Tracking status elements
    trackingIndicator: document.getElementById('trackingIndicator'),
    trackingStateText: document.getElementById('trackingStateText'),
    trackingStateDesc: document.getElementById('trackingStateDesc'),
    startTrackingBtn: document.getElementById('startTrackingBtn'),
    stopTrackingBtn: document.getElementById('stopTrackingBtn'),
    gpsStatusBadge: document.getElementById('gpsStatusBadge'),
    gpsStatusValue: document.getElementById('gpsStatusValue'),
    latitudeValue: document.getElementById('latitudeValue'),
    longitudeValue: document.getElementById('longitudeValue'),
    accuracyValue: document.getElementById('accuracyValue'),
    lastUpdatedValue: document.getElementById('lastUpdatedValue'),

    // Log
    logContainer: document.getElementById('logContainer'),
    clearLogBtn: document.getElementById('clearLogBtn'),

    // Alerts
    alertContainer: document.getElementById('alertContainer'),

    // Profile elements
    profileForm: document.getElementById('profileForm'),
    profileName: document.getElementById('profileName'),
    profilePhone: document.getElementById('profilePhone'),
    profileBusNumber: document.getElementById('profileBusNumber'),
    profileBusName: document.getElementById('profileBusName'),
    profileUsername: document.getElementById('profileUsername'),
    logoutBtn: document.getElementById('logoutBtn'),

    // Tracking Info Panel
    infoDriverName: document.getElementById('infoDriverName'),
    infoDriverPhone: document.getElementById('infoDriverPhone')
};

// =========================================
// Navigation Controller
// =========================================
const NavigationController = {
    /**
     * Initialize navigation tab functionality
     */
    init() {
        DOM.navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
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
        DOM.navTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });

        // Update panels
        DOM.tabPanels.forEach(panel => {
            const panelId = panel.id.replace('-panel', '');
            panel.classList.toggle('active', panelId === tabId);
        });
    }
};


// =========================================
// Setup Controller (New)
// =========================================
const SetupController = {
    init() {
        if (!DOM.setupForm) return;

        DOM.setupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSetup();
        });

        this.loadInitialData();
    },

    loadInitialData() {
        const driverData = sessionStorage.getItem('driver');
        if (!driverData) return;

        const driver = JSON.parse(driverData);
        if (DOM.setupName) DOM.setupName.value = driver.name || '';
        if (DOM.setupPhone) DOM.setupPhone.value = driver.phone || '';
        if (DOM.setupBusNumber) DOM.setupBusNumber.value = driver.busNumber || '';
        if (DOM.setupBusName) DOM.setupBusName.value = driver.busName || '';
    },

    async handleSetup() {
        const name = DOM.setupName.value.trim();
        const phone = DOM.setupPhone.value.trim();
        const busNumber = DOM.setupBusNumber.value.trim();
        const busName = DOM.setupBusName.value.trim();

        if (!name || !phone || !busNumber || !busName) {
            AlertController.show('Validation Error', 'Please fill in all required fields.', 'error');
            return;
        }

        const driverData = sessionStorage.getItem('driver');
        if (!driverData) {
            AlertController.show('Session Error', 'No driver session found. Please login again.', 'error');
            return;
        }

        const driver = JSON.parse(driverData);

        // Debug logging
        console.log('[Setup] Driver data:', driver);
        console.log('[Setup] Driver ID:', driver.id);

        if (!driver.id) {
            AlertController.show('Session Error', 'Driver ID is missing. Please login again.', 'error');
            console.error('[Setup] Driver ID is undefined or null');
            return;
        }

        try {
            const baseUrl = getApiBaseUrl();
            const url = `${baseUrl}/api/driver/${driver.id}/profile`;
            console.log('[Setup] Calling API:', url);
            console.log('[Setup] Payload:', { name, phone, busNumber, busName });

            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, busNumber, busName })
            });

            const data = await response.json();
            console.log('[Setup] Response:', data);

            if (data.success) {
                // Update local storage and app state
                sessionStorage.setItem('driver', JSON.stringify(data.driver));
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
                AlertController.show('Error', data.message || 'Failed to update setup information', 'error');
                console.error('[Setup] Backend error:', data.message);
            }
        } catch (error) {
            console.error('Setup error:', error);
            AlertController.show('Network Error', 'Failed to connect to server. Check console for details.', 'error');
        }
    },

    finishSetup() {
        // Show navigation
        if (DOM.mainNavbarNav) DOM.mainNavbarNav.style.display = 'flex';

        // Switch to dashboard
        NavigationController.switchTab('dashboard');

        LogController.add('Setup complete. Session started.', 'success');
        AlertController.show('Welcome', 'Tracking session started successfully!', 'success');
    }
};
const ProfileController = {
    /**
     * Initialize profile management
     */
    init() {
        if (!DOM.profileForm) return;

        DOM.profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProfile();
        });

        if (DOM.logoutBtn) {
            DOM.logoutBtn.addEventListener('click', () => logout());
        }

        this.loadProfileData();
    },

    /**
     * Load current driver data into profile form
     */
    loadProfileData() {
        const driverData = sessionStorage.getItem('driver');
        if (!driverData) return;

        const driver = JSON.parse(driverData);

        if (DOM.profileUsername) DOM.profileUsername.textContent = driver.username;
        if (DOM.profileName) DOM.profileName.value = driver.name || '';
        if (DOM.profilePhone) DOM.profilePhone.value = driver.phone || '';
        if (DOM.profileBusNumber) DOM.profileBusNumber.value = driver.busNumber || '';
        if (DOM.profileBusName) DOM.profileBusName.value = driver.busName || '';

        // Also update tracking panel info
        if (DOM.infoDriverName) DOM.infoDriverName.textContent = driver.name || '--';
        if (DOM.infoDriverPhone) DOM.infoDriverPhone.textContent = driver.phone || '--';

        // Update dashboard details
        if (DOM.dashDriverName) DOM.dashDriverName.textContent = driver.name || '--';
        if (DOM.dashDriverPhone) DOM.dashDriverPhone.textContent = driver.phone || '--';
        if (DOM.dashBusNumber) DOM.dashBusNumber.textContent = driver.busNumber || '--';
        if (DOM.dashBusName) DOM.dashBusName.textContent = driver.busName || '--';

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
                    ? 'Tracking is active. Click Stop to end the session.'
                    : 'Click Start Tracking to begin GPS transmission.';
            } else {
                DOM.dashHelpText.textContent = 'Please update your profile information to enable tracking.';
            }
        }
    },

    /**
     * Update profile details
     */
    async updateProfile() {
        const driverData = sessionStorage.getItem('driver');
        if (!driverData) return;

        const driver = JSON.parse(driverData);

        const name = DOM.profileName.value.trim();
        const phone = DOM.profilePhone.value.trim();
        const busNumber = DOM.profileBusNumber.value.trim();
        const busName = DOM.profileBusName.value.trim();

        if (!name || !phone || !busNumber || !busName) {
            AlertController.show('Validation Error', 'Reference Name, Phone, Bus Number and Route Name are required.', 'error');
            return;
        }

        try {
            const baseUrl = getApiBaseUrl();
            const response = await fetch(`${baseUrl}/api/driver/${driver.id}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, phone, busNumber, busName })
            });

            const data = await response.json();

            if (data.success) {
                // Update local storage
                sessionStorage.setItem('driver', JSON.stringify(data.driver));

                // Update app state
                state.busNumber = busNumber;
                state.busName = busName;
                state.isConfigured = true;

                // Sync UI
                this.loadProfileData();

                AlertController.show('Success', 'Profile updated successfully', 'success');
                LogController.add('Profile and bus details updated', 'success');
            } else {
                AlertController.show('Error', data.message || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            AlertController.show('Network Error', 'Failed to connect to server', 'error');
        }
    }
};

/**
 * Logout utility
 */
function logout() {
    sessionStorage.removeItem('driver');
    window.location.href = 'login.html';
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
        return 'geolocation' in navigator;
    },

    /**
     * Request GPS permission and start watching position
     * @param {Function} onSuccess - Success callback
     * @param {Function} onError - Error callback
     * @returns {number|null} Watch ID or null on failure
     */
    startWatching(onSuccess, onError) {
        if (!this.isSupported()) {
            onError({
                code: 0,
                message: 'Geolocation API is not supported by this browser.'
            });
            return null;
        }

        LogController.add('Requesting GPS permission...', 'info');
        this.updateStatus('waiting');

        return navigator.geolocation.watchPosition(
            (position) => {
                state.lastPosition = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                };

                this.updateStatus('active');
                this.updateDisplay();
                onSuccess(state.lastPosition);
            },
            (error) => {
                this.updateStatus('error');
                onError(error);
            },
            CONFIG.GPS_OPTIONS
        );
    },

    /**
     * Stop watching GPS position
     * @param {number} watchId - Watch ID to clear
     */
    stopWatching(watchId) {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
        }
        this.updateStatus('inactive');
    },

    /**
     * Update GPS status in UI
     * @param {string} status - Status: inactive | waiting | active | error
     */
    updateStatus(status) {
        state.gpsStatus = status;

        const statusTexts = {
            inactive: 'Inactive',
            waiting: 'Requesting Permission...',
            active: 'Active',
            error: 'Permission Denied'
        };

        const badgeClasses = {
            inactive: '',
            waiting: 'badge-warning',
            active: 'badge-success',
            error: 'badge-danger'
        };

        // Update status badge
        DOM.gpsStatusBadge.textContent = statusTexts[status];
        DOM.gpsStatusBadge.className = 'badge ' + (badgeClasses[status] || '');

        // Update status value
        DOM.gpsStatusValue.textContent = statusTexts[status];

        // Update dashboard
        DOM.dashGpsStatus.textContent = statusTexts[status];
    },

    /**
     * Update GPS display values
     */
    updateDisplay() {
        if (!state.lastPosition) return;

        const { latitude, longitude, accuracy } = state.lastPosition;
        const formattedLat = latitude.toFixed(6);
        const formattedLng = longitude.toFixed(6);
        const formattedAcc = `±${Math.round(accuracy)}m`;

        // Tracking panel
        DOM.latitudeValue.textContent = formattedLat;
        DOM.longitudeValue.textContent = formattedLng;
        DOM.accuracyValue.textContent = formattedAcc;

        // Dashboard
        DOM.dashLatitude.textContent = formattedLat;
        DOM.dashLongitude.textContent = formattedLng;
        DOM.dashAccuracy.textContent = formattedAcc;
    }
};

// =========================================
// WebSocket Controller
// =========================================
const WebSocketController = {
    reconnectAttempts: 0,
    maxReconnectAttempts: 10,
    shouldReconnect: true,
    reconnectTimeout: null,

    connect() {
        return new Promise((resolve, reject) => {
            if (state.socket && state.socket.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }

            const wsUrl = CONFIG.WS_URL;
            LogController.add('Connecting to: ' + wsUrl, 'info');
            console.log('[WebSocket] Attempting connection to:', wsUrl);

            try {
                state.socket = new WebSocket(wsUrl);
            } catch (e) {
                LogController.add('WebSocket creation failed: ' + e.message, 'error');
                reject(e);
                return;
            }

            state.socket.onopen = () => {
                state.isConnected = true;
                this.reconnectAttempts = 0; // Reset on successful connection
                this.updateUI('connected');
                LogController.add('Connected to backend successfully', 'success');
                resolve();
            };

            state.socket.onclose = (event) => {
                state.isConnected = false;
                this.updateUI('offline');
                LogController.add(`Disconnected (code: ${event.code}, reason: ${event.reason || 'none'})`, 'warning');

                // Auto-reconnect if tracking is active and we should reconnect
                if (state.isTracking && this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000); // Exponential backoff, max 30s
                    LogController.add(`Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`, 'info');

                    this.reconnectTimeout = setTimeout(() => {
                        this.connect().then(() => {
                            // Re-send START action after reconnecting
                            const driverData = JSON.parse(sessionStorage.getItem('driver'));
                            const startPayload = {
                                busNumber: state.busNumber,
                                busName: state.busName, // Added busName
                                busStop: 'College',
                                action: 'START',
                                driverName: driverData ? driverData.name : '',
                                driverPhone: driverData ? driverData.phone : ''
                            };
                            this.send(startPayload);
                            LogController.add('Reconnected and resumed session', 'success');
                        }).catch(err => {
                            LogController.add('Reconnection failed: ' + err.message, 'error');
                        });
                    }, delay);
                }
            };

            state.socket.onerror = (event) => {
                const errorMsg = 'Connection failed - Is port 8080 forwarded in Dev Tunnels?';
                LogController.add(errorMsg, 'error');
                console.error('[WebSocket] Error event:', event);
                this.updateUI('error');
                reject(new Error(errorMsg));
            };

            state.socket.onmessage = (event) => {
                LogController.add('Received from server: ' + event.data, 'info');
            };
        });
    },

    disconnect() {
        this.shouldReconnect = false; // Prevent auto-reconnect on intentional disconnect
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
        const text = indicator.querySelector('.indicator-text');

        indicator.classList.remove('connected', 'error');

        switch (status) {
            case 'connected':
                indicator.classList.add('connected');
                text.textContent = 'Online';
                break;
            case 'error':
                indicator.classList.add('error');
                text.textContent = 'Error';
                break;
            default:
                text.textContent = 'Offline';
        }
    }
};

// =========================================
// Tracking Controller
// =========================================
const TrackingController = {
    /**
     * Initialize tracking controls
     */
    init() {
        DOM.dashStartBtn.addEventListener('click', async () => {
            await this.start();
            NavigationController.switchTab('tracking-status');
        });
        DOM.dashStopBtn.addEventListener('click', () => this.stop());

        // Tracking panel buttons
        DOM.startTrackingBtn.addEventListener('click', () => this.start());
        DOM.stopTrackingBtn.addEventListener('click', () => this.stop());
    },

    /**
     * Start GPS tracking and data transmission
     */
    async start() {
        if (!state.isConfigured) {
            AlertController.show('Configuration Required', 'Please enter bus details before starting tracking.', 'error');
            return;
        }

        if (state.isTracking) {
            return;
        }

        try {
            // Enable auto-reconnection for this tracking session
            WebSocketController.shouldReconnect = true;

            // Step 1: Request GPS permission FIRST (critical for mobile)
            // Mobile browsers require user interaction to trigger GPS permission
            LogController.add('Requesting GPS permission...', 'info');
            this.updateTrackingUI('starting');

            // Use getCurrentPosition first to trigger the permission prompt
            await new Promise((resolve, reject) => {
                if (!GPSController.isSupported()) {
                    reject(new Error('Geolocation is not supported by this browser'));
                    return;
                }

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        LogController.add('GPS permission granted!', 'success');
                        state.lastPosition = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                            timestamp: position.timestamp
                        };
                        GPSController.updateStatus('active');
                        GPSController.updateDisplay();
                        resolve();
                    },
                    (error) => {
                        GPSController.updateStatus('error');
                        reject(error);
                    },
                    { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
                );
            });

            // Step 2: Connect WebSocket
            LogController.add('Connecting to backend...', 'info');
            await WebSocketController.connect();

            // Step 3: Send START action
            const driverData = JSON.parse(sessionStorage.getItem('driver'));
            const startPayload = {
                busNumber: state.busNumber,
                busName: state.busName, // Added busName
                busStop: 'College',
                action: 'START',
                driverName: driverData ? driverData.name : '',
                driverPhone: driverData ? driverData.phone : ''
            };
            WebSocketController.send(startPayload);
            LogController.add('Bus session started on server', 'success');

            // Step 4: Start continuous GPS watching
            state.watchId = GPSController.startWatching(
                (position) => {
                    if (!state.isTracking) {
                        // First successful position
                        state.isTracking = true;
                        state.gpsPermissionGranted = true;
                        state.gpsErrorCount = 0;

                        // Send GPS_ACTIVE action to backend
                        WebSocketController.send({
                            busNumber: state.busNumber,
                            action: 'GPS_ACTIVE'
                        });
                        LogController.add('GPS active - backend notified', 'success');

                        this.updateTrackingUI('active');
                        this.startDataTransmission();
                        LogController.add('GPS tracking active', 'success');
                    }
                },
                (error) => {
                    this.handleGPSError(error);
                }
            );

        } catch (error) {
            const errorMsg = error.message || 'Unknown error';
            LogController.add('Failed to initialize tracking: ' + errorMsg, 'error');
            AlertController.show('Tracking Error', 'Could not start tracking: ' + errorMsg, 'error');
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

        LogController.add('Stopping GPS tracking...', 'info');

        // Send STOP action to backend
        if (state.isTracking) {
            WebSocketController.send({
                busNumber: state.busNumber,
                action: 'STOP'
            });
            LogController.add('Bus session stopped on server', 'info');
        }

        // Stop GPS
        GPSController.stopWatching(state.watchId);
        state.watchId = null;

        // Stop data transmission
        this.stopDataTransmission();

        // Disconnect WebSocket
        WebSocketController.disconnect();

        // Update state
        state.isTracking = false;
        state.lastPosition = null;

        // Reset display values
        DOM.latitudeValue.textContent = '--';
        DOM.longitudeValue.textContent = '--';
        DOM.accuracyValue.textContent = '--';
        DOM.lastUpdatedValue.textContent = '--';
        DOM.dashLatitude.textContent = '--';
        DOM.dashLongitude.textContent = '--';
        DOM.dashAccuracy.textContent = '--';

        this.updateTrackingUI('stopped');

        LogController.add('GPS tracking stopped', 'success');
    },

    /**
     * Start interval-based data transmission
     */
    startDataTransmission() {
        if (state.sendInterval) {
            clearInterval(state.sendInterval);
        }

        // Send immediately
        this.sendUpdate();

        // Then send at interval
        state.sendInterval = setInterval(() => {
            this.sendUpdate();
        }, CONFIG.UPDATE_INTERVAL);

        this.updateConnectionIndicator('connected');
    },

    /**
     * Stop data transmission
     */
    stopDataTransmission() {
        if (state.sendInterval) {
            clearInterval(state.sendInterval);
            state.sendInterval = null;
        }

        this.updateConnectionIndicator('offline');
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
            longitude: state.lastPosition.longitude
        };

        const success = WebSocketController.send(payload);

        if (success) {
            // Update counters
            state.updateCount++;
            state.lastUpdateTime = new Date();
            this.updateCounterDisplay();
        } else {
            LogController.add('Transmission failed: WebSocket not connected', 'error');
            WebSocketController.updateUI('error');
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
                title = 'GPS Permission Denied';
                message = 'Please allow location access in your browser settings to use tracking.';
                shouldStopTracking = true; // Must stop - permission denied
                break;
            case error.POSITION_UNAVAILABLE:
                title = 'Location Unavailable';
                message = 'GPS signal lost. Waiting for GPS to reconnect...';
                shouldStopTracking = false; // Don't stop - GPS might come back
                break;
            case error.TIMEOUT:
                title = 'GPS Timeout';
                message = 'Location request timed out. Retrying...';
                shouldStopTracking = false; // Don't stop - just a timeout
                break;
            default:
                title = 'GPS Error';
                message = error.message || 'An unknown GPS error occurred.';
                shouldStopTracking = false;
        }

        // Only show alert for permission denied (critical error)
        if (error.code === error.PERMISSION_DENIED) {
            AlertController.show(title, message, 'error');
        } else {
            // For other errors, just log (GPS might recover)
            LogController.add(`${title}: ${message}`, 'warning');
        }

        // Send GPS_ERROR action to backend to mark bus as inactive
        state.gpsPermissionGranted = false;
        state.gpsErrorCount++;

        if (state.isTracking && state.socket && state.socket.readyState === WebSocket.OPEN) {
            WebSocketController.send({
                busNumber: state.busNumber,
                action: 'GPS_ERROR',
                errorCode: error.code,
                errorMessage: title
            });
            LogController.add('GPS error reported to backend', 'info');
        }

        // Only stop tracking if permission was denied
        if (shouldStopTracking) {
            this.stop();
        } else {
            // Keep tracking active but update UI to show GPS is unavailable
            GPSController.updateStatus('error');
            this.updateTrackingUI('error');
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
            starting: { main: 'Starting...', sub: 'Requesting GPS permission' },
            active: { main: 'Tracking Active', sub: 'Transmitting location data' },
            stopped: { main: 'Stopped', sub: 'Click Start to begin GPS tracking' },
            error: { main: 'Error', sub: 'GPS error occurred' }
        };

        const t = texts[status] || texts.stopped;
        DOM.trackingStateText.textContent = t.main;
        DOM.trackingStateDesc.textContent = t.sub;

        // Dashboard status
        DOM.dashTrackingStatus.textContent = status === 'active' ? 'Running' : 'Stopped';

        // Update dashboard buttons
        ProfileController.updateDashboardButtons();

        // Indicator styling
        indicator.classList.remove('active', 'error');
        if (status === 'active') {
            indicator.classList.add('active');
        } else if (status === 'error') {
            indicator.classList.add('error');
        }
    },

    /**
     * Update counter displays
     */
    updateCounterDisplay() {
        DOM.dashUpdateCount.textContent = state.updateCount;

        if (state.lastUpdateTime) {
            const timeStr = state.lastUpdateTime.toLocaleTimeString('en-US', { hour12: false });
            DOM.dashLastUpdate.textContent = timeStr;
            DOM.lastUpdatedValue.textContent = timeStr;
        }
    },

    /**
     * Update connection indicator
     * @param {string} status - connected | offline | error
     */
    updateConnectionIndicator(status) {
        WebSocketController.updateUI(status);
    }
};

// =========================================
// Log Controller
// =========================================
const LogController = {
    /**
     * Initialize log controls
     */
    init() {
        DOM.clearLogBtn.addEventListener('click', () => this.clear());
    },

    /**
     * Add log entry
     * @param {string} message - Log message
     * @param {string} type - info | success | error | warning
     */
    add(message, type = 'info') {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });

        const entry = document.createElement('div');
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
        DOM.logContainer.innerHTML = '';
        this.add('Log cleared', 'info');
    }
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
    show(title, message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;

        const iconSvg = type === 'error'
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
            : type === 'success'
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
        alert.querySelector('.alert-close').addEventListener('click', () => {
            alert.remove();
        });

        DOM.alertContainer.appendChild(alert);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.style.opacity = '0';
                alert.style.transform = 'translateX(100%)';
                setTimeout(() => alert.remove(), 300);
            }
        }, 5000);
    }
};

// =========================================
// Application Initialization
// =========================================
// =========================================
// Application Initialization
// =========================================
function initApp() {
    console.log('[Driver Panel] Initializing...');

    // Check Authentication
    const driverData = sessionStorage.getItem('driver');
    if (!driverData) {
        window.location.href = 'login.html';
        return;
    }

    // Prefill form from localStorage (from signup) or sessionStorage (from login)
    try {
        const savedConfig = localStorage.getItem('driverConfig');
        const driverObj = JSON.parse(driverData);

        // Priority: 1. localStorage (new signup), 2. sessionStorage (existing profile), 3. Empty
        const config = savedConfig ? JSON.parse(savedConfig) : {};

        if (DOM.setupName) DOM.setupName.value = config.name || driverObj.name || '';
        if (DOM.setupPhone) DOM.setupPhone.value = config.phone || driverObj.phone || '';
        if (DOM.setupBusNumber) DOM.setupBusNumber.value = config.busNumber || driverObj.busNumber || '';
        if (DOM.setupBusName) DOM.setupBusName.value = config.busName || driverObj.busName || '';

        // Clear temp storage to prevent stale data
        if (savedConfig) {
            localStorage.removeItem('driverConfig');
        }

    } catch (e) {
        console.error('Error prefilling driver config:', e);
    }

    // Check GPS support
    if (!GPSController.isSupported()) {
        AlertController.show(
            'GPS Not Supported',
            'Your browser does not support the Geolocation API. Please use a modern browser.',
            'error'
        );
    }

    // Initialize controllers
    NavigationController.init();
    TrackingController.init();
    LogController.init();
    ProfileController.init();
    SetupController.init();

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
    LogController.add('System initialized. Ready for tracking.', 'info');

    // Check if tracking is already active (on refresh)
    if (state.isTracking) {
        SetupController.finishSetup();
    }

    // Warn before page close if tracking
    window.addEventListener('beforeunload', (e) => {
        if (state.isTracking) {
            e.preventDefault();
            e.returnValue = 'GPS tracking is still active. Are you sure you want to leave?';
            return e.returnValue;
        }
    });

    console.log('[Driver Panel] Initialization complete');
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

// Export for debugging
window.DriverPanel = {
    CONFIG,
    state,
    GPSController,
    TrackingController
};
