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
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const port = window.location.port;

    // File protocol fallback (local testing)
    if (window.location.protocol === 'file:') {
        return `ws://localhost:8080${endpoint}`;
    }

    // VS Code Dev Tunnels
    if (host.includes('.devtunnels.ms')) {
        const tunnelMatch = host.match(/^([^-]+)-\d+\.(.+)$/);
        if (tunnelMatch) {
            return `${protocol}//${tunnelMatch[1]}-8080.${tunnelMatch[2]}${endpoint}`;
        }
    }

    // Standard production ports or specified ports
    if (port && port !== '80' && port !== '443') {
        return `${protocol}//${host}:${port}${endpoint}`;
    }

    return `${protocol}//${host}${endpoint}`;
}

const CONFIG = {
    // API - Dynamically detects Dev Tunnels or localhost
    WS_URL: (() => {
        const url = getWebSocketUrl('/ws/user');
        console.log('[CONFIG] Client WS_URL:', url);
        return url;
    })(),

    // MapTiler Configuration
    MAPTILER_API_KEY: 'qT5xViuAuUmEXe01G0oI',
    MAPTILER_STYLE_URL: 'https://api.maptiler.com/maps/019bfffb-7613-7306-82a6-88f9659c6bff/style.json',

    // Map Defaults
    MAP_CENTER: [80.2707, 13.0827], // [lng, lat]
    MAP_ZOOM: 12,
    MAP_MIN_ZOOM: 10,
    MAP_MAX_ZOOM: 18,
    ANIMATION_DURATION: 100,
    SEARCH_DEBOUNCE: 300,

    WEBSOCKET_ENABLED: true,
    DEMO_MODE: false,
    UPDATE_INTERVAL: 500, // Faster refresh rate
    STALE_THRESHOLD: 5000, // 5 seconds of no data = Inactive
    RECONNECT_TIMEOUT: 5000,
    RECONNECT_MAX_ATTEMPTS: 10,
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
    searchFilter: '' // Added for global filtering
};

// =========================================
// Route Definitions (Static)
// =========================================
const ROUTE_DEFINITIONS = {
    "12": ["Central Station", "Egmore", "Kilpauk", "Anna Nagar", "Koyambedu", "College"],
    "45": ["Tambaram", "Chromepet", "Pallavaram", "Guindy", "Ashok Pillar", "College"],
    "21": ["Adyar", "Thiruvanmiyur", "ECR", "Sholinganallur", "Medavakkam", "College"],
    "56": ["Velachery", "Madipakkam", "Keelkattalai", "Pallavaram", "College"]
};

// =========================================
// DOM Elements
// =========================================
const DOM = {
    // Welcome Modal
    welcomeSearchModal: document.getElementById('welcomeSearchModal'),
    welcomeSearchForm: document.getElementById('welcomeSearchForm'),
    welcomeSearchInput: document.getElementById('welcomeSearchInput'),
    welcomeSearchDropdown: document.getElementById('welcomeSearchDropdown'),
    welcomeSearchDropdownContent: document.getElementById('welcomeSearchDropdownContent'),

    // Header
    searchInput: document.getElementById('searchInput'),
    searchClear: document.getElementById('searchClear'),
    searchDropdown: document.getElementById('searchDropdown'),
    searchDropdownContent: document.getElementById('searchDropdownContent'),
    connectionBadge: document.getElementById('connectionBadge'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    // Profile Elements (Adding these back)
    usernameDisplay: document.getElementById('usernameDisplay'),
    logoutBtn: document.getElementById('logoutBtn'),

    // Map Controls
    // Removed traffic and route toggles

    // Tabs
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),

    // Map
    mapContainer: document.getElementById('map'),
    activeBusCount: document.getElementById('activeBusCount'),
    busInfoPanel: document.getElementById('busInfoPanel'),
    panelCloseBtn: document.getElementById('panelCloseBtn'),

    // Panel
    panelBusNo: document.getElementById('panelBusNo'),
    panelBusName: document.getElementById('panelBusName'),
    panelBusRoute: document.getElementById('panelBusRoute'),
    panelLocation: document.getElementById('panelLocation'),
    panelDriver: document.getElementById('panelDriver'),
    panelPhone: document.getElementById('panelPhone'),

    // Lists
    busGrid: document.getElementById('busGrid'),
    totalBuses: document.getElementById('totalBuses'),
    busesEmpty: document.getElementById('busesEmpty'),

    // Loading
    loadingScreen: document.getElementById('loadingScreen'),
    toastContainer: document.getElementById('toastContainer')
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

    // Smooth Animation State
    animationTargets: new Map(), // Stores target positions for each bus
    animationLoopId: null,      // RequestAnimationFrame ID

    // Route definitions removed


    init() {
        console.log('[Map] Initializing MapTiler SDK...');

        // MapTiler SDK Initialization
        maptilersdk.config.apiKey = CONFIG.MAPTILER_API_KEY;

        this.map = new maptilersdk.Map({
            container: DOM.mapContainer,
            style: CONFIG.MAPTILER_STYLE_URL,
            center: CONFIG.MAP_CENTER, // [lng, lat]
            zoom: CONFIG.MAP_ZOOM,
            minZoom: CONFIG.MAP_MIN_ZOOM,
            maxZoom: CONFIG.MAP_MAX_ZOOM
        });

        // Add navigation controls
        this.map.addControl(new maptilersdk.NavigationControl(), 'top-right');

        // Ensure animation loop is killed on re-init
        if (this.animationLoopId) {
            cancelAnimationFrame(this.animationLoopId);
        }
        this.startAnimationLoop();

        console.log('[Map] MapTiler SDK Map Initialized');
    },

    createBusElement(bus, isSelected = false) {
        const el = document.createElement('div');
        this.updateMarkerElement(el, bus, isSelected);

        // Click handler on the ROOT element of the marker
        el.addEventListener('click', (e) => {
            console.log(`[Map] Marker Root clicked! Bus: ${bus.busNo}`);
            e.stopPropagation(); // Stop from reaching map
            this.selectBus(bus.busId || bus.busNo);
        });

        return el;
    },

    // Update marker element IN-PLACE (preserves TomTom's DOM reference)
    updateMarkerElement(el, bus, isSelected) {
        const statusClass = bus.gpsOn ? 'status-active' : 'status-inactive';
        el.className = `bus-marker-container ${statusClass} ${isSelected ? 'selected' : ''}`;
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
                <span class="status-text">${bus.gpsOn ? 'Live' : 'Last Seen'}</span>
            </div>
        `;
    },

    async updateBusMarker(bus) {
        const busId = String(bus.busId || bus.busNo);
        const isSelected = String(state.selectedBusId) === busId;
        const isGpsOn = bus.gpsOn;

        const latitude = parseFloat(bus.latitude !== undefined ? bus.latitude : bus.lastLat);
        const longitude = parseFloat(bus.longitude !== undefined ? bus.longitude : bus.lastLng);

        if (isNaN(latitude) || isNaN(longitude) || (latitude === 0 && longitude === 0)) {
            return;
        }

        let marker = this.markers.get(busId);

        if (!marker) {
            console.log(`[Map] Creating NEW marker for bus ${busId}`);

            // Create HTML element for marker
            const el = document.createElement('div');
            el.className = 'custom-bus-marker-container';
            el.innerHTML = this.createMarkerHTML(bus, isSelected);

            // Create MapTiler marker
            marker = new maptilersdk.Marker({ element: el })
                .setLngLat([longitude, latitude])
                .addTo(this.map);

            // Add click handler
            el.addEventListener('click', (e) => {
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
                duration: 1100 // 1.1s (Matches 1s update rate + buffer)
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
                    duration: 1100 // 1.1s interpolation
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
        console.log('[Map] Animation loop started');
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
            if (state.selectedBusId === busId && !this.isNavigating && state.isConnected) {
                // Smooth pan only if distance is small
                this.map.easeTo({
                    center: [newLng, newLat],
                    duration: 0, // Instant update for camera frame
                    essential: true
                });
            }

            // Cleanup separate entries if done (optional optimization, 
            // but keeping them map-based is fine for <100 buses)
        });
    },

    createMarkerHTML(bus, isSelected) {
        const statusClass = bus.gpsOn ? 'status-active' : 'status-inactive';
        const selectedClass = isSelected ? 'selected' : '';
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
                     <span class="status-text">${bus.gpsOn ? 'Live' : 'Last Seen'}</span>
                 </div>
            </div>
        `;
    },

    createPopupContent(bus) {
        const stopsHtml = bus.stops && bus.stops.length > 0
            ? bus.stops.slice(0, 3).join(' → ') + (bus.stops.length > 3 ? '...' : '')
            : 'No stops';

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
        if (typeof targetLng !== 'number' || typeof targetLat !== 'number' ||
            isNaN(targetLng) || isNaN(targetLat)) {
            console.warn('[Map] animateMarker skipped - invalid target coordinates');
            return;
        }

        const startPos = marker.getLatLng();
        if (!startPos) return;

        const startLat = startPos.lat;
        const startLng = startPos.lng;

        if (typeof startLat !== 'number' || typeof startLng !== 'number') return;

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
                    console.warn('[Map] Error updating previous marker:', e);
                }
            }
        }

        state.selectedBusId = id;

        // 2. Identify Target Data
        const marker = this.markers.get(id);
        const busData = marker ? marker.busData : (state.buses.get(id) || Array.from(state.buses.values()).find(b => String(b.busId) === id));

        if (!busData) {
            console.error(`[Map] Bus data not found for ID: ${id}. Available:`, Array.from(state.buses.keys()));
            return;
        }

        // 3. Handle Tab Switch
        const mapView = document.getElementById('mapView');
        const isMapVisible = mapView && mapView.classList.contains('active');

        if (!isMapVisible) {
            console.log('[Map] Switching to map tab for selection');
            TabManager.switchTab('map');
        }

        // 4. Update Panel (Immediate)
        this.updatePanel(busData);
        DOM.busInfoPanel.classList.add('active');

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
                console.warn('[Map] Error updating marker selection style:', e);
            }

            this.navTimeout = setTimeout(() => {
                this.isNavigating = true;
                this.map.resize();

                // Validate Coordinates
                if (typeof freshBus.latitude !== 'number' || typeof freshBus.longitude !== 'number' ||
                    (Math.abs(freshBus.latitude) < 0.0001 && Math.abs(freshBus.longitude) < 0.0001)) {

                    console.warn('[Map] GPS coordinates are unavailable. Aborting FlyTo.');
                    this.isNavigating = false;
                    return;
                }

                // MapTiler flyTo
                console.log(`[Map] Starting flyTo navigation to [${freshBus.longitude}, ${freshBus.latitude}]`);

                this.map.flyTo({
                    center: [freshBus.longitude, freshBus.latitude],
                    zoom: 16.5,
                    duration: 2000
                });

                this.lockTimeout = setTimeout(() => {
                    this.isNavigating = false;
                    console.log('[Map] Navigation lock released');
                }, 2100);
            }, delay);
        } else {
            // Fallback if no marker (shouldn't happen often if data exists)
            if (busData.latitude && busData.longitude && (Math.abs(busData.latitude) > 0.0001)) {
                this.navTimeout = setTimeout(() => {
                    this.isNavigating = true;
                    this.map.resize();
                    this.map.flyTo({
                        center: [busData.longitude, busData.latitude],
                        zoom: 16.5,
                        duration: 2000
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

        // Badge = Bus Number, Title = Bus Name (Standard Layout)
        DOM.panelBusNo.textContent = bus.busNo;
        DOM.panelBusName.textContent = bus.busName || `Bus ${bus.busNo}`;
        DOM.panelBusRoute.textContent = `Route: ${bus.routeName || 'Unknown'}`;

        // Update status in panel
        const statusEl = DOM.busInfoPanel.querySelector('.bus-status');
        if (statusEl) {
            if (bus.gpsOn) {
                statusEl.style.color = 'var(--success)';
                statusEl.innerHTML = '<span class="status-dot" style="background: var(--success)"></span>Live Now';
            } else {
                statusEl.style.color = 'var(--danger)';
                statusEl.innerHTML = '<span class="status-dot" style="background: var(--danger)"></span>Inactive';
            }
        }

        // Show address if available, otherwise show coordinates
        if (bus.address) {
            DOM.panelLocation.textContent = bus.address;
        } else if (bus.latitude !== null && bus.longitude !== null && !isNaN(bus.latitude) && !isNaN(bus.longitude)) {
            DOM.panelLocation.textContent = `${bus.latitude.toFixed(6)}, ${bus.longitude.toFixed(6)}`;
            // Fetch address in background
            if (window.TomTomServices) {
                const address = await window.TomTomServices.ReverseGeocoding.getAddress(bus.latitude, bus.longitude);
                if (address) {
                    bus.address = address;
                    DOM.panelLocation.textContent = address;
                }
            }
        } else {
            DOM.panelLocation.textContent = 'Location unavailable';
        }

        // Update Driver Info
        if (DOM.panelDriver) DOM.panelDriver.textContent = bus.driverName || 'Unknown';
        if (DOM.panelPhone) DOM.panelPhone.textContent = bus.driverPhone || 'N/A';

        // Remove Stops List (User Request)
        DOM.panelStops.innerHTML = '';
        // Hide the stops section container if possible, or just leave empty. 
        // We'll leave it empty for now as it minimalizes DOM code changes.
        // Or better, put "No stops" or just nothing.
        // User said "remove route stops insted of that add bus name". 
        // Bus Name is already in Title.
    },

    closePanel() {
        console.log('[Map] closePanel() called');

        // Clear any pending timeouts
        if (this.navTimeout) clearTimeout(this.navTimeout);
        if (this.lockTimeout) clearTimeout(this.lockTimeout);
        this.navTimeout = null;
        this.lockTimeout = null;

        // Reset state
        state.selectedBusId = null;
        this.isNavigating = false;

        // Hide panel
        DOM.busInfoPanel.classList.remove('active');
        console.log('[Map] Panel closed');
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
    }
};

// =========================================
// WebSocket Manager
// =========================================
const WebSocketManager = {
    socket: null,
    updateInterval: null,

    connect() {
        if (CONFIG.DEMO_MODE) {
            console.log('[App] DEMO MODE ACTIVE - Initializing simulated data');
            this.updateConnectionUI('connected');
            if (window.BusTrackDemo) {
                window.BusTrackDemo.init();
            }
            return;
        }

        console.log('[WS] Connecting to ' + CONFIG.WS_URL);
        this.socket = new WebSocket(CONFIG.WS_URL);

        this.socket.onopen = () => {
            console.log('[WS] Connected');
            this.updateConnectionUI('connected');
            state.isConnected = true;
            this.startPolling();
        };

        this.socket.onmessage = (event) => {
            try {
                // console.log('[WS] Raw message:', event.data);
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (e) {
                console.error('[WS] Error processing message:', e, 'Data:', event.data);
            }
        };

        this.socket.onclose = () => {
            console.log('[WS] Disconnected');
            this.updateConnectionUI('disconnected');
            state.isConnected = false;
            this.stopPolling();
            // Simple reconnect
            setTimeout(() => this.connect(), 5000);
        };

        this.socket.onerror = (error) => {
            console.error('[WS] Error:', error);
            this.updateConnectionUI('error');
        };
    },

    handleMessage(data) {
        if (Array.isArray(data)) {
            // New backend returns List<BusData>
            BusTracker.handleBusData(data);
        }
    },

    startPolling() {
        console.log('[WS] Starting update polling...');
        this.updateInterval = setInterval(() => {
            this.requestUpdate();
        }, CONFIG.UPDATE_INTERVAL);
        this.requestUpdate(); // Initial request
    },

    stopPolling() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
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
            this.socket.send(JSON.stringify({
                type: 'ALL',
                value: ''
            }));
        }
    },

    async fetchStops() {
        // Since the new backend doesn't have a stops REST API, 
        // we'll rely on the data coming in via WebSockets to populate stops.
        console.log('[App] Stops will be updated via live bus data');
        return Promise.resolve([]);
    },

    updateConnectionUI(status) {
        const badge = DOM.connectionBadge;
        const text = badge.querySelector('.badge-text');

        badge.className = 'connection-badge ' + status;

        switch (status) {
            case 'connected':
                text.textContent = 'Live';
                break;
            case 'error':
                text.textContent = 'Error';
                badge.className = 'connection-badge disconnected';
                break;
            default:
                text.textContent = 'Disconnected';
        }
    }
};

// =========================================
// Bus Tracker
// =========================================
const BusTracker = {
    updateBus(busData) {
        const busId = busData.busId;
        const mappedBus = {
            busId: busData.busNumber || busData.busId,
            busNo: busData.busNumber || busData.busNo,
            busName: busData.busName || ("Bus " + (busData.busNumber || busData.busNo)),
            latitude: busData.latitude,
            longitude: busData.longitude,
            status: busData.status,
            gpsOn: (busData.status && (busData.status.toUpperCase() === 'RUNNING' || busData.status.toUpperCase() === 'GPS_ACTIVE')),
            stops: busData.busStop ? [busData.busStop] : (busData.stops || []),
            lastUpdate: new Date().toISOString()
        };

        state.buses.set(mappedBus.busId, mappedBus);

        if (mappedBus.latitude !== 0 || mappedBus.longitude !== 0) {
            // Apply filtering: Only show if matches filter
            if (SearchManager.shouldShowBus(mappedBus)) {
                MapManager.updateBusMarker(mappedBus);
            } else {
                MapManager.removeBusMarker(mappedBus.busId);
            }
        }

        let activeCount = 0;
        state.buses.forEach(b => {
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
            stops.forEach(stopName => {
                if (!state.stops.has(stopName)) {
                    state.stops.set(stopName, {
                        name: stopName,
                        buses: [mappedBus.busNo]
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
        const mappedBuses = buses.map(bus => ({
            busId: bus.busNumber || bus.busId,
            busNo: bus.busNumber || bus.busNo,
            busName: bus.busName || ("Bus " + (bus.busNumber || bus.busNo)), // Display name
            routeName: bus.busName || bus.route || bus.busRoute || bus.routePath || `Bus ${bus.busNumber || bus.busNo}`,
            latitude: bus.latitude,
            longitude: bus.longitude,
            status: bus.status,
            gpsOn: (bus.status && (bus.status.toUpperCase() === 'RUNNING' || bus.status.toUpperCase() === 'GPS_ACTIVE')),
            // Use static route if available, otherwise fallback to single stop
            stops: ROUTE_DEFINITIONS[bus.busNumber || bus.busNo] || (bus.busStop ? [bus.busStop] : (bus.stops || [])),
            driverName: bus.driverName || 'Unknown Driver',
            driverPhone: bus.driverPhone || 'No Phone',
            lastUpdate: new Date().toISOString(),
            lastSeen: now // For staleness tracking
        }));

        if (MapManager.map) {
            MapManager.map.resize();
        }

        // Update state Map (Merge with Coordinate Preservation)
        mappedBuses.forEach(bus => {
            // If already exists, preserve valid coordinates if new ones are empty/zero
            if (state.buses.has(bus.busId)) {
                const oldBus = state.buses.get(bus.busId);
                const isNewInvalid = !bus.latitude || !bus.longitude || (Math.abs(bus.latitude) < 0.0001 && Math.abs(bus.longitude) < 0.0001);
                const isOldValid = oldBus.latitude && oldBus.longitude && (Math.abs(oldBus.latitude) > 0.0001 || Math.abs(oldBus.longitude) > 0.0001);

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
        state.buses.forEach(bus => {
            if (bus.gpsOn) activeCount++;
        });

        DOM.activeBusCount.textContent = `${activeCount} Active`;
        DOM.totalBuses.textContent = state.buses.size;

        // Update markers and panel for active buses
        state.buses.forEach(bus => {
            // Note: We only draw markers for buses with valid coordinates
            if (bus.latitude !== 0 || bus.longitude !== 0) {
                // Apply filtering
                if (SearchManager.shouldShowBus(bus)) {
                    MapManager.updateBusMarker(bus);
                } else {
                    MapManager.removeBusMarker(bus.busId);
                }

                if (state.selectedBusId === bus.busId) {
                    MapManager.updatePanel(bus);
                }
            }
        });

        // Update list views
        UIManager.renderBusesList();
    },

    checkStaleBuses(now) {
        state.buses.forEach(bus => {
            if (bus.gpsOn && (now - (bus.lastSeen || 0) > CONFIG.STALE_THRESHOLD)) {
                console.log(`[BusTracker] Bus ${bus.busNo} went stale. Marking Inactive.`);
                bus.gpsOn = false;
                bus.status = 'STOPPED';
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
        if (!state.searchFilter) return true;
        const q = state.searchFilter.toLowerCase();

        // Check for direct matches
        const matchesNo = bus.busNo && bus.busNo.toLowerCase().includes(q);
        const matchesName = bus.busName && bus.busName.toLowerCase().includes(q);
        const matchesRoute = bus.routeName && bus.routeName.toLowerCase().includes(q);

        // Check stops - explicitly ignore "college" to avoid generic matches
        const matchesStop = bus.stops && bus.stops.some(stop =>
            stop.toLowerCase().includes(q) && stop.toLowerCase() !== 'college'
        );

        return matchesNo || matchesName || matchesRoute || matchesStop;
    },

    initWelcomeSearch() {
        if (DOM.welcomeSearchModal) {
            DOM.welcomeSearchModal.style.display = 'flex';

            // Focus input
            setTimeout(() => {
                if (DOM.welcomeSearchInput) DOM.welcomeSearchInput.focus();
            }, 100);

            // Input Listener for Dropdown
            if (DOM.welcomeSearchInput) {
                DOM.welcomeSearchInput.addEventListener('input', (e) => {
                    const val = e.target.value;
                    if (val.trim()) {
                        DOM.welcomeSearchDropdown.style.display = 'block';
                        this.handleSearch(val, 'welcome');
                    } else {
                        DOM.welcomeSearchDropdown.style.display = 'none';
                    }
                });
            }

            DOM.welcomeSearchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = DOM.welcomeSearchInput.value.trim();
                this.applyWelcomeFilter(query);
            });

            // Close dropdown on outside click
            document.addEventListener('click', (e) => {
                if (DOM.welcomeSearchDropdown &&
                    !DOM.welcomeSearchInput.contains(e.target) &&
                    !DOM.welcomeSearchDropdown.contains(e.target)) {
                    DOM.welcomeSearchDropdown.style.display = 'none';
                }
            });
        }
    },

    applyWelcomeFilter(query) {
        if (query) {
            state.searchFilter = query;
            if (DOM.welcomeSearchModal) DOM.welcomeSearchModal.style.display = 'none';
            if (DOM.searchInput) DOM.searchInput.value = query;
            BusTracker.handleBusData(Array.from(state.buses.values()));
        }
    },

    init() {
        // Main Search Bar
        DOM.searchInput.addEventListener('input', (e) => {
            // Update filter state immediately
            state.searchFilter = e.target.value.trim();

            // Refresh view
            BusTracker.handleBusData(Array.from(state.buses.values()));

            // Existing dropdown logic
            this.handleSearch(e.target.value);
            DOM.searchClear.classList.toggle('hidden', !e.target.value);
        });

        DOM.searchInput.addEventListener('focus', () => {
            if (DOM.searchInput.value.trim()) {
                DOM.searchDropdown.classList.add('active');
            }
        });

        DOM.searchClear.addEventListener('click', () => {
            DOM.searchInput.value = '';
            state.searchFilter = ''; // Clear filter
            BusTracker.handleBusData(Array.from(state.buses.values())); // Reset view

            DOM.searchDropdown.classList.remove('active');
            DOM.searchClear.classList.add('hidden');
            DOM.searchInput.focus();
        });

        document.addEventListener('click', (e) => {
            if (!DOM.searchInput.contains(e.target) && !DOM.searchDropdown.contains(e.target)) {
                DOM.searchDropdown.classList.remove('active');
            }
        });
    },

    handleSearch(query, context = 'header') {
        clearTimeout(this.debounceTimer);

        if (!query.trim()) {
            if (context === 'header') DOM.searchDropdown.classList.remove('active');
            else if (context === 'welcome') DOM.welcomeSearchDropdown.style.display = 'none';
            return;
        }

        this.debounceTimer = setTimeout(() => {
            const q = query.toLowerCase().trim();

            // Trigger WebSocket search for discovery
            if (WebSocketManager.socket && WebSocketManager.socket.readyState === WebSocket.OPEN) {
                WebSocketManager.socket.send(JSON.stringify({
                    type: 'BUS_NUMBER',
                    value: query
                }));
                WebSocketManager.socket.send(JSON.stringify({
                    type: 'BUS_STOP',
                    value: query
                }));
            }

            this.performSearch(q, context);
        }, CONFIG.SEARCH_DEBOUNCE);
    },

    async performSearch(query, context) {
        const results = [];

        // 1. Local Search (Buses)
        state.buses.forEach((bus, busId) => {
            const matchesNo = bus.busNo.toLowerCase().includes(query);
            const matchesName = bus.busName.toLowerCase().includes(query);
            const matchesStop = bus.stops && bus.stops.some(stop =>
                stop.toLowerCase().includes(query) && stop.toLowerCase() !== 'college'
            );

            if (matchesNo || matchesName || matchesStop) {
                results.push({ type: 'bus', ...bus });
            }
        });

        // 2. Clear previous results before adding remote ones
        this.renderResults(results, true, context);

        // 3. Remote Search (Bus Stops from Drivers)
        try {
            const response = await fetch(`/api/bus-stops/search?query=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (data.success && data.busStops.length > 0) {
                const stopResults = data.busStops.map(stop => ({ type: 'stop', name: stop }));
                // Append stops to results
                this.renderResults([...results, ...stopResults], false, context);
            } else if (results.length === 0) {
                this.renderNoResults(context);
            }
        } catch (err) {
            console.error('[Search] Remote search failed:', err);
        }
    },

    renderNoResults(context) {
        const container = context === 'welcome' ? DOM.welcomeSearchDropdownContent : DOM.searchDropdownContent;
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

        if (context === 'welcome') DOM.welcomeSearchDropdown.style.display = 'block';
        else DOM.searchDropdown.classList.add('active');
    },

    renderResults(results, initial, context) {
        const container = context === 'welcome' ? DOM.welcomeSearchDropdownContent : DOM.searchDropdownContent;
        if (!container) return;

        if (results.length === 0) {
            if (initial) container.innerHTML = '<div class="searching-hint">Searching...</div>';
            return;
        }

        container.innerHTML = results.map(result => {
            if (result.type === 'bus') {
                return `
                    <div class="dropdown-item" data-type="bus" data-id="${result.busId}">
                        <div class="dropdown-item-header">
                            <span class="dropdown-bus-number">${result.busNo}</span>
                            <span class="dropdown-bus-name">${result.busName}</span>
                        </div>
                        <div class="dropdown-stops">
                            ${result.stops ? result.stops.slice(0, 4).map(stop =>
                    `<span class="dropdown-stop-tag">${stop}</span>`
                ).join('') : ''}
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="dropdown-item stop-item" data-type="stop" data-name="${result.name}" 
                         style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-4);">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="background: var(--primary-100); color: var(--primary-600); width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                            </div>
                            <div>
                                <div style="font-weight: 600; font-size: 0.95rem;">${result.name}</div>
                                <div style="font-size: 0.75rem; color: var(--text-secondary);">Available Bus Stop</div>
                            </div>
                        </div>
                        <button class="save-stop-btn" data-name="${result.name}" 
                                style="padding: 6px 12px; border-radius: 6px; border: 1px solid var(--primary); background: transparent; color: var(--primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                            Save Stop
                        </button>
                    </div>
                `;
            }
        }).join('');

        // Event listeners for results
        container.querySelectorAll('.dropdown-item').forEach(item => {
            if (item.dataset.type === 'bus') {
                item.addEventListener('click', () => {
                    if (context === 'welcome') {
                        const bus = state.buses.get(item.dataset.id);
                        if (bus) {
                            DOM.welcomeSearchInput.value = bus.busNo;
                            this.applyWelcomeFilter(bus.busNo);
                        }
                    } else {
                        this.selectBusResult(item.dataset.id);
                    }
                });
            }
        });

        // Event listeners for Save Stop buttons
        container.querySelectorAll('.save-stop-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.saveBusStop(btn.dataset.name);
            });
        });

        if (context === 'welcome') DOM.welcomeSearchDropdown.style.display = 'block';
        else DOM.searchDropdown.classList.add('active');
    },

    selectBusResult(busId) {
        DOM.searchDropdown.classList.remove('active');
        DOM.searchInput.value = '';
        DOM.searchClear.classList.add('hidden');

        TabManager.switchTab('map');
        MapManager.selectBus(busId);
    },

    async saveBusStop(stopName) {
        const client = JSON.parse(sessionStorage.getItem('client'));
        if (!client) return;

        try {
            const response = await fetch('/api/client/bus-stop/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: client.id,
                    busStop: stopName
                })
            });
            const data = await response.json();

            if (data.success) {
                // Update session storage
                sessionStorage.setItem('client', JSON.stringify(data.client));
                showToast(`Saved ${stopName} as your original bus stop!`, 'success');
                DOM.searchDropdown.classList.remove('active');
                DOM.searchInput.value = '';
                DOM.searchClear.classList.add('hidden');

                // Refresh profile display if needed
                if (DOM.usernameDisplay) {
                    // Profile saved stop can be displayed somewhere else if needed
                }
            } else {
                showToast(data.message, 'error');
            }
        } catch (err) {
            console.error('[Search] Failed to save bus stop:', err);
            showToast('Failed to save bus stop', 'error');
        }
    }
};

// =========================================
// Tab Manager
// =========================================
const TabManager = {
    init() {
        DOM.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                this.switchTab(tabName);
            });
        });
    },

    switchTab(tabName) {
        // Update Buttons
        DOM.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Toggle Floating Panels
        // If tab is 'map', we just want to close all panels (map is always visible in background)
        const panels = document.querySelectorAll('.floating-panel');
        panels.forEach(panel => {
            panel.classList.remove('active');
        });

        if (tabName !== 'map') {
            const targetPanel = document.getElementById(`${tabName}View`); // e.g. busesView, stopsView
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        } else {
            // If switching to map, maybe we want to resize just to be safe, 
            // though it's always visible now.
            if (MapManager.map) {
                setTimeout(() => MapManager.map.resize(), 50);
            }
        }

        document.querySelector('.nav-tabs').classList.remove('active'); // Close mobile menu
    }
};

// =========================================
// UI Manager
// =========================================
const UIManager = {
    renderBusesList() {
        if (state.buses.size === 0) {
            DOM.busesEmpty.style.display = 'block';
            return;
        }

        DOM.busesEmpty.style.display = 'none';

        state.buses.forEach((bus, busId) => {
            // Apply filtering
            if (!SearchManager.shouldShowBus(bus)) return;

            let card = DOM.busGrid.querySelector(`.bus-card[data-bus-id="${busId}"]`);
            if (card) {
                // Update existing card status & details
                const statusBadge = card.querySelector('.bus-card-status');
                const badgeEl = card.querySelector('.bus-card-number');
                const nameEl = card.querySelector('.bus-card-name');

                if (badgeEl) badgeEl.textContent = bus.busNo; // Badge = Number
                if (nameEl) nameEl.textContent = bus.busName || ''; // Title = Name

                if (statusBadge) {
                    const isGpsOn = bus.gpsOn;
                    statusBadge.textContent = isGpsOn ? 'Active' : 'Inactive';
                    statusBadge.className = `bus-card-status ${isGpsOn ? 'status-active' : 'status-inactive'}`;

                    // Toggle dot style
                    statusBadge.style.color = isGpsOn ? 'var(--success)' : 'var(--danger)';
                    statusBadge.style.background = isGpsOn ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)';
                }
            } else {
                card = this.createBusCard(bus);
                DOM.busGrid.appendChild(card);
            }
        });

        // Remove cards for buses no longer present OR filtered out
        DOM.busGrid.querySelectorAll('.bus-card').forEach(card => {
            const bus = state.buses.get(card.dataset.busId);
            if (!bus || !SearchManager.shouldShowBus(bus)) {
                card.remove();
            }
        });
    },

    createBusCard(bus) {
        const card = document.createElement('div');
        card.className = 'bus-card';
        card.dataset.busId = bus.busId;

        const isGpsOn = bus.gpsOn;
        const statusColor = isGpsOn ? 'var(--success)' : 'var(--danger)';
        const statusBg = isGpsOn ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)';

        card.innerHTML = `
            <div class="bus-card-header">
                <span class="bus-card-number">${bus.busNo}</span>
                <span class="bus-card-status" style="color: ${statusColor}; background: ${statusBg}">
                    ${isGpsOn ? 'Active' : 'Inactive'}
                </span>
            </div>
            <div class="bus-card-name">${bus.busName || ''}</div>
            <div class="bus-card-route">${bus.routeName || 'Unknown Route'}</div>
            <!-- Stops removed as per user request -->
        `;

        card.addEventListener('click', () => {
            console.log(`[Dashboard] Card clicked for bus ${bus.busNo}`);
            TabManager.switchTab('map');
            MapManager.selectBus(bus.busId || bus.busNo);
        });

        return card;
    },

    renderStopsList() {
        DOM.totalStops.textContent = state.stops.size;

        if (state.stops.size === 0) {
            DOM.stopsEmpty.style.display = 'block';
            return;
        }

        DOM.stopsEmpty.style.display = 'none';

        const cards = [];
        state.stops.forEach((stop, stopId) => {
            cards.push(this.createStopCard(stop));
        });

        DOM.stopsGrid.innerHTML = '';
        cards.forEach(card => DOM.stopsGrid.appendChild(card));
        DOM.stopsGrid.appendChild(DOM.stopsEmpty);
        DOM.stopsEmpty.style.display = 'none';
    },

    createStopCard(stop) {
        const card = document.createElement('div');
        card.className = 'stop-card';

        const busCount = stop.buses ? stop.buses.length : 0;

        card.innerHTML = `
            <div class="stop-card-icon">📍</div>
            <div class="stop-card-name">${stop.name}</div>
            <div class="stop-card-buses">
                <span>${busCount}</span> bus${busCount !== 1 ? 'es' : ''} serve this stop
            </div>
        `;

        return card;
    }
};

// =========================================
// Toast
// =========================================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// =========================================
// Mobile Menu
// =========================================
function initMobileMenu() {
    DOM.mobileMenuBtn.addEventListener('click', () => {
        document.querySelector('.nav-tabs').classList.toggle('active');
    });
}

// =========================================
// TomTom Services Integration
// =========================================
function initTomTomServices() {
    if (!window.TomTomServices) {
        console.warn('[App] TomTom Services not loaded');
        return;
    }

    console.log('[App] TomTom Services initialized (Traffic/Routes disabled)');
}

// =========================================
// Initialization
// =========================================
async function init() {
    console.log('[App] Initializing...');

    try {
        MapManager.init();
        TabManager.init();
        SearchManager.init();
        SearchManager.initWelcomeSearch(); // Activate welcome prompt
        initMobileMenu();
        initTomTomServices();

        DOM.panelCloseBtn.addEventListener('click', (e) => {
            console.log('[App] Close Button Clicked! Event:', e);
            MapManager.closePanel();
            console.log('[App] closePanel() method finished');
        });

        // Connect to WebSocket
        WebSocketManager.connect();

        // Fetch stops
        WebSocketManager.fetchStops().catch(() => {
            console.log('[App] Could not fetch stops');
        });

        // Load and display username and profile picture
        const clientData = sessionStorage.getItem('client');
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
                    DOM.profileImageHeader.innerHTML = ''; // Remove SVG icon
                }
            } catch (e) {
                console.error('[App] Failed to load client data:', e);
            }
        }

        // Hide loading
        setTimeout(() => {
            DOM.loadingScreen.classList.add('hidden');
        }, 1000);

        console.log('[App] Ready');

    } catch (error) {
        console.error('[App] Init failed:', error);
        showToast('Failed to initialize', 'error');
    }
}

document.addEventListener('DOMContentLoaded', init);

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
        MapManager.markers.forEach(marker => marker.remove());
        MapManager.markers.clear();

        // Clear bus/stops state
        state.buses.clear();
        state.stops.clear();
        state.selectedBusId = null;

        // Reset counts
        if (DOM.activeBusCount) DOM.activeBusCount.textContent = '0 Active';
        if (DOM.totalBuses) DOM.totalBuses.textContent = '0';
        if (DOM.totalStops) DOM.totalStops.textContent = '0';

        // Clear lists
        if (DOM.busGrid) DOM.busGrid.innerHTML = '';
        if (DOM.stopsGrid) DOM.stopsGrid.innerHTML = '';

        // Show "empty" placeholders
        if (DOM.busesEmpty) DOM.busesEmpty.style.display = 'block';
        if (DOM.stopsEmpty) DOM.stopsEmpty.style.display = 'block';

        // Close side panel if open
        MapManager.closePanel();

        // Optional: stop polling if you want a full reset
        if (WebSocketManager.pollingInterval) {
            clearInterval(WebSocketManager.pollingInterval);
            WebSocketManager.pollingInterval = null;
        }

        console.log('[App] Cleared all bus data, markers, and routes');
    }
};
