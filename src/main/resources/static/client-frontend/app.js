/**
 * ==========================================================================
 * DYGON Student Application - Real-Time Live Bus Tracking & Navigation System
 * Navigation: 🏠 Dashboard | 🚌 Buses | 📍 Stops | 🕐 Schedules
 * Features: 100% Full-Screen OpenStreetMap (Leaflet.js), Solid White Top Bar,
 * Full-Width Bottom Nav Bar, Live WebSocket Sync, ETA Logic, Bus Directory.
 * ==========================================================================
 */

(function () {
    'use strict';

    // Default Campus Coordinates (Sri Sairam Engineering College area)
    const CAMPUS_COORDS = [12.9602, 80.0573];
    const DEFAULT_ZOOM = 13;

    // State Variables
    let map = null;
    let userLocationMarker = null;
    let busMarkers = {}; // busNumber -> Leaflet Marker
    let busesData = [];
    let busStopsList = [];
    let currentUser = null;
    let preferredStop = localStorage.getItem('client_preferred_stop') || null;
    let selectedBusNumber = null;
    let webSocket = null;
    let wsHeartbeatTimer = null;
    let pollingInterval = null;
    let activeNavTab = 'dashboard';
    let busSubFilter = 'all';
    let scheduleType = 'morning';

    // DOM Elements
    const elements = {
        statusPulse: document.getElementById('statusPulse'),
        statusText: document.getElementById('statusText'),
        refreshBtn: document.getElementById('refreshBtn'),
        navTabBtns: document.querySelectorAll('.nav-tab-btn'),
        tabViews: document.querySelectorAll('.tab-view'),
        drawerOverlay: document.getElementById('drawerOverlay'),
        drawerTitle: document.getElementById('drawerTitle'),
        closeDrawerBtn: document.getElementById('closeDrawerBtn'),
        countAll: document.getElementById('countAll'),
        countRunning: document.getElementById('countRunning'),
        savedStopName: document.getElementById('savedStopName'),
        changeStopBtn: document.getElementById('changeStopBtn'),
        statActiveBuses: document.getElementById('statActiveBuses'),
        statTotalStops: document.getElementById('statTotalStops'),
        busSearchInput: document.getElementById('busSearchInput'),
        clearSearchBtn: document.getElementById('clearSearchBtn'),
        subPillBtns: document.querySelectorAll('.sub-pill-btn'),
        busList: document.getElementById('busList'),
        stopSearchInput: document.getElementById('stopSearchInput'),
        clearStopSearchBtn: document.getElementById('clearStopSearchBtn'),
        stopsList: document.getElementById('stopsList'),
        schedPillBtns: document.querySelectorAll('.sched-pill-btn'),
        scheduleContentList: document.getElementById('scheduleContentList'),
        clientGreeting: document.getElementById('clientGreeting'),
        userName: document.getElementById('userName'),
        userEmail: document.getElementById('userEmail'),
        userAvatar: document.getElementById('userAvatar'),
        themeToggleBtn: document.getElementById('themeToggleBtn'),
        logoutBtn: document.getElementById('logoutBtn'),
        locateUserBtn: document.getElementById('locateUserBtn'),
        recenterCollegeBtn: document.getElementById('recenterCollegeBtn'),
        openFeedbackBtn: document.getElementById('openFeedbackBtn'),
        floatingBusCard: document.getElementById('floatingBusCard'),
        closeFloatingCard: document.getElementById('closeFloatingCard'),
        floatBusBadge: document.getElementById('floatBusBadge'),
        floatBusName: document.getElementById('floatBusName'),
        floatLivePill: document.getElementById('floatLivePill'),
        floatDriverName: document.getElementById('floatDriverName'),
        floatBusStop: document.getElementById('floatBusStop'),
        floatSpeed: document.getElementById('floatSpeed'),
        floatCallBtn: document.getElementById('floatCallBtn'),
        floatFollowBtn: document.getElementById('floatFollowBtn'),
        stopModal: document.getElementById('stopModal'),
        closeStopModal: document.getElementById('closeStopModal'),
        cancelStopModal: document.getElementById('cancelStopModal'),
        stopModalSearch: document.getElementById('stopModalSearch'),
        stopModalOptions: document.getElementById('stopModalOptions'),
        feedbackModal: document.getElementById('feedbackModal'),
        closeFeedbackModal: document.getElementById('closeFeedbackModal'),
        cancelFeedback: document.getElementById('cancelFeedback'),
        feedbackForm: document.getElementById('feedbackForm'),
        feedbackSubject: document.getElementById('feedbackSubject'),
        feedbackBus: document.getElementById('feedbackBus'),
        feedbackMessage: document.getElementById('feedbackMessage'),
        feedbackAlert: document.getElementById('feedbackAlert'),
        submitFeedbackBtn: document.getElementById('submitFeedbackBtn')
    };

    // Helper: Dynamic API Base URL
    function getApiBaseUrl() {
        const host = window.location.hostname;
        const protocol = window.location.protocol;

        if (protocol === 'file:') {
            return 'https://bus-tracking-master-production-3369.up.railway.app';
        }
        if (host.includes('.devtunnels.ms')) {
            const match = host.match(/^([^-]+)-\d+\.(.+)$/);
            if (match) return `${protocol}//${match[1]}-8080.${match[2]}`;
        }
        if (window.location.port) {
            return `${protocol}//${host}:${window.location.port}`;
        }
        return `${protocol}//${host}`;
    }

    // Helper: Dynamic WebSocket URL
    function getWsUrl() {
        const baseUrl = getApiBaseUrl();
        return baseUrl.replace(/^http/, 'ws') + '/ws/user';
    }

    // Initialize App
    function init() {
        loadUserSession();
        initMap();
        setupEventListeners();
        fetchBusStops();
        fetchBusesData();
        connectWebSocket();

        // Start fallback polling every 5 seconds
        pollingInterval = setInterval(fetchBusesData, 5000);
    }

    // Load User Session from localStorage
    function loadUserSession() {
        const storedUser = localStorage.getItem('client');
        if (storedUser) {
            try {
                currentUser = JSON.parse(storedUser);
                elements.userName.textContent = currentUser.name || 'Student';
                elements.userEmail.textContent = currentUser.email || 'student@sairamtap.edu.in';
                elements.clientGreeting.textContent = `Welcome, ${currentUser.name ? currentUser.name.split(' ')[0] : 'Student'}`;
                elements.userAvatar.textContent = (currentUser.name || 'S').charAt(0).toUpperCase();

                if (currentUser.busStop) {
                    preferredStop = currentUser.busStop;
                    localStorage.setItem('client_preferred_stop', preferredStop);
                }
            } catch (e) {
                console.error('Error parsing client session:', e);
            }
        }
        updateSavedStopUI();
    }

    // Update Saved Stop UI
    function updateSavedStopUI() {
        if (elements.savedStopName) {
            elements.savedStopName.textContent = preferredStop || 'Not selected';
        }
    }

    // Initialize OpenStreetMap via Leaflet
    function initMap() {
        map = L.map('map', {
            center: CAMPUS_COORDS,
            zoom: DEFAULT_ZOOM,
            zoomControl: false
        });

        // Add Leaflet Zoom Control to bottom right
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Standard OpenStreetMap Tiles
        const osmTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });

        osmTiles.addTo(map);

        // Auto-locate User on load
        tryLocateUser(false);
    }

    // Locate User with Geolocation API
    function tryLocateUser(panToUser = true) {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;

                    if (userLocationMarker) {
                        userLocationMarker.setLatLng([lat, lng]);
                    } else {
                        const userIcon = L.divIcon({
                            className: 'leaflet-user-icon',
                            iconSize: [20, 20],
                            iconAnchor: [10, 10]
                        });
                        userLocationMarker = L.marker([lat, lng], { icon: userIcon })
                            .bindPopup('<b>You are here</b>')
                            .addTo(map);
                    }

                    if (panToUser) {
                        map.flyTo([lat, lng], 15, { duration: 1.2 });
                    }
                },
                (err) => {
                    console.log('Location access denied or unavailable:', err);
                    if (panToUser) {
                        alert('Could not access your location. Please enable location permissions.');
                    }
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        }
    }

    // Connect WebSocket
    function connectWebSocket() {
        try {
            const wsUrl = getWsUrl();
            console.log('[ClientWS] Connecting to:', wsUrl);
            webSocket = new WebSocket(wsUrl);

            webSocket.onopen = function () {
                console.log('[ClientWS] Connected to live WebSocket');
                elements.statusPulse.classList.add('active');
                elements.statusText.textContent = 'Real-time Live Sync Active';

                webSocket.send(JSON.stringify({ type: 'ALL' }));

                clearInterval(wsHeartbeatTimer);
                wsHeartbeatTimer = setInterval(() => {
                    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
                        webSocket.send(JSON.stringify({ type: 'PING' }));
                    }
                }, 15000);
            };

            webSocket.onmessage = function (event) {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'PONG') return;

                    if (Array.isArray(data)) {
                        updateBusesData(data);
                    } else if (data.type === 'BUS_UPDATE' && Array.isArray(data.buses)) {
                        updateBusesData(data.buses);
                    } else if (data.type === 'START' || data.type === 'STOP') {
                        fetchBusesData();
                    }
                } catch (err) {
                    console.error('[ClientWS] Message parse error:', err);
                }
            };

            webSocket.onclose = function () {
                console.log('[ClientWS] Disconnected from WebSocket');
                elements.statusPulse.classList.remove('active');
                elements.statusText.textContent = 'Polling Feed (WS Reconnecting...)';
                clearInterval(wsHeartbeatTimer);
                setTimeout(connectWebSocket, 5000);
            };

            webSocket.onerror = function (err) {
                console.error('[ClientWS] Socket error:', err);
            };
        } catch (e) {
            console.error('[ClientWS] Failed to setup WebSocket:', e);
        }
    }

    // Fetch Buses via REST
    async function fetchBusesData() {
        try {
            const response = await fetch(`${getApiBaseUrl()}/api/bus/all`);
            if (response.ok) {
                const data = await response.json();
                updateBusesData(data);
            }
        } catch (e) {
            console.error('Failed to fetch buses data:', e);
        }
    }

    // Fetch Bus Stops
    async function fetchBusStops() {
        try {
            const response = await fetch(`${getApiBaseUrl()}/api/bus-stops/all`);
            if (response.ok) {
                const res = await response.json();
                if (res.success && Array.isArray(res.busStops)) {
                    busStopsList = res.busStops;
                    if (elements.statTotalStops) elements.statTotalStops.textContent = busStopsList.length;
                    renderStopsList();
                    renderSchedules();
                }
            }
        } catch (e) {
            console.error('Failed to fetch bus stops:', e);
        }
    }

    // Process & Update Bus Data
    function updateBusesData(newBuses) {
        if (!Array.isArray(newBuses)) return;

        busesData = newBuses;
        updateCounts();
        renderBusList();
        updateMapMarkers();

        if (selectedBusNumber) {
            const bus = busesData.find(b => b.busNumber === selectedBusNumber);
            if (bus) updateFloatingCard(bus);
        }
    }

    // Update Counts
    function updateCounts() {
        const total = busesData.length;
        const running = busesData.filter(b => b.status === 'RUNNING' || b.status === 'MOVING').length;
        if (elements.countAll) elements.countAll.textContent = total;
        if (elements.countRunning) elements.countRunning.textContent = running;
        if (elements.statActiveBuses) elements.statActiveBuses.textContent = running;
    }

    // Render Buses Tab List
    function renderBusList() {
        if (!elements.busList) return;
        const searchTerm = elements.busSearchInput ? elements.busSearchInput.value.toLowerCase().trim() : '';

        let filtered = busesData.filter(b => {
            if (busSubFilter === 'running' && !(b.status === 'RUNNING' || b.status === 'MOVING')) {
                return false;
            }
            if (searchTerm) {
                const num = (b.busNumber || '').toLowerCase();
                const name = (b.busName || '').toLowerCase();
                const driver = (b.driverName || '').toLowerCase();
                const stop = (b.busStop || '').toLowerCase();
                return num.includes(searchTerm) || name.includes(searchTerm) || driver.includes(searchTerm) || stop.includes(searchTerm);
            }
            return true;
        });

        if (filtered.length === 0) {
            elements.busList.innerHTML = `
                <div class="loading-skeleton">
                    <i class="fa-solid fa-bus-simple" style="font-size: 2rem; margin-bottom: 10px; color: var(--text-muted);"></i>
                    <p>No buses match the filter criteria.</p>
                </div>`;
            return;
        }

        elements.busList.innerHTML = filtered.map(bus => {
            const isMoving = bus.status === 'RUNNING' || bus.status === 'MOVING';
            const isSelected = selectedBusNumber === bus.busNumber;

            return `
                <div class="bus-card status-${isMoving ? 'running' : 'stopped'} ${isSelected ? 'selected' : ''}" onclick="window.focusBus('${bus.busNumber}')">
                    <div class="bus-card-header">
                        <span class="bus-number-badge">${bus.busNumber}</span>
                        <span class="status-pill ${isMoving ? 'running' : 'inactive'}">${isMoving ? 'MOVING' : 'OFFLINE'}</span>
                    </div>
                    <div class="bus-title">${bus.busName || 'College Bus Route'}</div>
                    <div class="bus-meta">
                        <div class="meta-row"><i class="fa-solid fa-location-dot"></i> Destination: ${bus.busStop || 'Campus'}</div>
                        <div class="meta-row"><i class="fa-solid fa-user-tie"></i> Driver: ${bus.driverName || 'Assigned Driver'}</div>
                    </div>
                    <div class="bus-card-footer">
                        ${bus.driverPhone ? `<a href="tel:${bus.driverPhone}" class="call-driver-link" onclick="event.stopPropagation()"><i class="fa-solid fa-phone"></i> Call Driver</a>` : '<span></span>'}
                        <button class="track-btn" onclick="event.stopPropagation(); window.focusBus('${bus.busNumber}')"><i class="fa-solid fa-crosshairs"></i> Track</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Render Bus Stops List
    function renderStopsList() {
        if (!elements.stopsList) return;
        const searchTerm = elements.stopSearchInput ? elements.stopSearchInput.value.toLowerCase().trim() : '';

        const filtered = busStopsList.filter(stop => !searchTerm || stop.toLowerCase().includes(searchTerm));

        if (filtered.length === 0) {
            elements.stopsList.innerHTML = `<div class="loading-skeleton">No bus stops found.</div>`;
            return;
        }

        elements.stopsList.innerHTML = filtered.map(stop => `
            <div class="stop-card" onclick="window.selectStopFromList('${stop.replace(/'/g, "\\'")}')">
                <div class="stop-card-info">
                    <div class="stop-icon"><i class="fa-solid fa-map-pin"></i></div>
                    <div>
                        <h4>${stop}</h4>
                        <p>College Bus Route Stop</p>
                    </div>
                </div>
                <button class="btn-sm btn-outline"><i class="fa-solid fa-check"></i> Select</button>
            </div>
        `).join('');
    }

    // Render Schedules Timetable Tab
    function renderSchedules() {
        if (!elements.scheduleContentList) return;

        const isMorning = scheduleType === 'morning';
        const sampleRoutes = [
            { num: 'BUS-101', route: 'Tambaram - Chromepet Line', morning: '07:30 AM', evening: '04:30 PM' },
            { num: 'BUS-102', route: 'Guindy - Saidapet Express', morning: '07:40 AM', evening: '04:35 PM' },
            { num: 'BUS-103', route: 'Koyambedu - Vadapalani Line', morning: '07:25 AM', evening: '04:40 PM' },
            { num: 'BUS-104', route: 'Porur - Iyyapanthangal Line', morning: '07:45 AM', evening: '04:45 PM' },
            { num: 'BUS-105', route: 'Velachery - Medavakkam Route', morning: '07:35 AM', evening: '04:30 PM' }
        ];

        elements.scheduleContentList.innerHTML = sampleRoutes.map(item => `
            <div class="schedule-card">
                <div class="schedule-card-header">
                    <span class="bus-number-badge">${item.num}</span>
                    <span class="sched-time-badge"><i class="fa-regular fa-clock"></i> ${isMorning ? item.morning : item.evening}</span>
                </div>
                <div class="bus-title">${item.route}</div>
                <div class="bus-meta">
                    <div class="meta-row"><i class="fa-solid fa-flag-checkered"></i> ${isMorning ? 'Pickup from stop → Campus' : 'Campus departure → Drop stops'}</div>
                </div>
            </div>
        `).join('');
    }

    // Update OpenStreetMap Markers for Buses
    function updateMapMarkers() {
        if (!map) return;

        busesData.forEach(bus => {
            const hasValidCoords = bus.latitude && bus.longitude && (bus.latitude !== 0 || bus.longitude !== 0);
            if (!hasValidCoords) return;

            const latLng = [bus.latitude, bus.longitude];
            const isMoving = bus.status === 'RUNNING' || bus.status === 'MOVING';

            if (busMarkers[bus.busNumber]) {
                busMarkers[bus.busNumber].setLatLng(latLng);
            } else {
                const busIcon = L.divIcon({
                    className: `leaflet-bus-icon ${isMoving ? 'moving' : ''}`,
                    html: `<i class="fa-solid fa-bus"></i>`,
                    iconSize: [36, 36],
                    iconAnchor: [18, 18]
                });

                const marker = L.marker(latLng, { icon: busIcon }).addTo(map);

                marker.bindPopup(`
                    <div style="font-family: Inter, sans-serif; padding: 4px;">
                        <b style="color: #E85D04; font-size: 1rem;">${bus.busNumber}</b> - ${bus.busName || 'Route'}<br>
                        <b>Status:</b> ${bus.status || 'INACTIVE'}<br>
                        <b>Driver:</b> ${bus.driverName || 'N/A'}<br>
                        ${bus.driverPhone ? `<a href="tel:${bus.driverPhone}" style="color: #10B981; font-weight: bold; text-decoration: none;">📞 ${bus.driverPhone}</a>` : ''}
                    </div>
                `);

                marker.on('click', () => {
                    selectBus(bus);
                });

                busMarkers[bus.busNumber] = marker;
            }
        });
    }

    // Select Bus & Display Floating Map Card
    function selectBus(bus) {
        selectedBusNumber = bus.busNumber;

        if (map && bus.latitude && bus.longitude && bus.latitude !== 0) {
            map.flyTo([bus.latitude, bus.longitude], 15, { duration: 1.0 });
        }

        updateFloatingCard(bus);
        renderBusList();
    }

    // Expose focusBus globally
    window.focusBus = function (busNumber) {
        const bus = busesData.find(b => b.busNumber === busNumber);
        if (bus) {
            selectBus(bus);
        } else {
            alert(`Bus ${busNumber} is currently offline or has no GPS fix.`);
        }
    };

    // Expose selectStopFromList globally
    window.selectStopFromList = function (stopName) {
        saveUserPreferredStop(stopName);
    };

    // Update Floating Bus Quick Card
    function updateFloatingCard(bus) {
        elements.floatBusBadge.textContent = bus.busNumber || 'BUS';
        elements.floatBusName.textContent = bus.busName || 'College Route';
        elements.floatLivePill.textContent = bus.status || 'INACTIVE';
        elements.floatDriverName.textContent = bus.driverName || 'Assigned Driver';
        elements.floatBusStop.textContent = bus.busStop || 'Terminal';
        elements.floatSpeed.textContent = (bus.status === 'RUNNING' || bus.status === 'MOVING') ? '28 km/h' : '0 km/h';

        if (bus.driverPhone) {
            elements.floatCallBtn.href = `tel:${bus.driverPhone}`;
            elements.floatCallBtn.classList.remove('hidden');
        } else {
            elements.floatCallBtn.classList.add('hidden');
        }

        elements.floatFollowBtn.onclick = () => {
            if (bus.latitude && bus.longitude) {
                map.flyTo([bus.latitude, bus.longitude], 16, { duration: 1 });
            }
        };

        elements.floatingBusCard.classList.remove('hidden');
    }

    // Save User Preferred Stop
    async function saveUserPreferredStop(stopName) {
        preferredStop = stopName;
        localStorage.setItem('client_preferred_stop', stopName);
        updateSavedStopUI();
        closeModal(elements.stopModal);

        if (currentUser && currentUser.id) {
            try {
                await fetch(`${getApiBaseUrl()}/api/client/bus-stop/save`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ clientId: currentUser.id, busStop: stopName })
                });
            } catch (e) {
                console.error('Failed to save stop to backend:', e);
            }
        }
    }

    // Open Modal
    function openModal(modal) {
        modal.classList.remove('hidden');
    }

    // Close Modal
    function closeModal(modal) {
        modal.classList.add('hidden');
    }

    // Populate Stop Selection Modal
    function renderStopModalOptions(filterText = '') {
        const text = filterText.toLowerCase().trim();
        const filtered = busStopsList.filter(s => !text || s.toLowerCase().includes(text));

        if (filtered.length === 0) {
            elements.stopModalOptions.innerHTML = `<div class="loading-skeleton">No stops match.</div>`;
            return;
        }

        elements.stopModalOptions.innerHTML = filtered.map(s => `
            <div class="stop-option-item" onclick="window.selectStopFromList('${s.replace(/'/g, "\\'")}')">
                <i class="fa-solid fa-location-dot text-primary"></i> ${s}
            </div>
        `).join('');
    }

    // Populate Feedback Bus Options
    function populateFeedbackBuses() {
        elements.feedbackBus.innerHTML = `<option value="">-- Any Bus / General --</option>` +
            busesData.map(b => `<option value="${b.busNumber}">${b.busNumber} - ${b.busName || ''}</option>`).join('');
    }

    // Setup Event Listeners
    function setupEventListeners() {
        // Close Drawer Event
        if (elements.closeDrawerBtn) {
            elements.closeDrawerBtn.addEventListener('click', () => {
                elements.drawerOverlay.classList.add('hidden');
                elements.navTabBtns.forEach(b => {
                    if (b.dataset.tab === 'dashboard') b.classList.add('active');
                    else b.classList.remove('active');
                });
                activeNavTab = 'dashboard';
            });
        }

        // 📱 Main DYGON Navigation Tabs (Dashboard | Buses | Stops | Schedules)
        elements.navTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                activeNavTab = targetTab;

                elements.navTabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                if (targetTab === 'dashboard') {
                    elements.drawerOverlay.classList.add('hidden');
                } else {
                    elements.drawerOverlay.classList.remove('hidden');

                    if (targetTab === 'buses') elements.drawerTitle.textContent = 'Buses Directory';
                    if (targetTab === 'stops') elements.drawerTitle.textContent = 'Bus Stops Directory';
                    if (targetTab === 'schedules') elements.drawerTitle.textContent = 'Bus Timetables & Routes';

                    elements.tabViews.forEach(view => {
                        if (view.id === `view${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}`) {
                            view.classList.remove('hidden');
                            view.classList.add('active');
                        } else {
                            view.classList.add('hidden');
                            view.classList.remove('active');
                        }
                    });

                    if (targetTab === 'buses') renderBusList();
                    if (targetTab === 'stops') renderStopsList();
                    if (targetTab === 'schedules') renderSchedules();
                }
            });
        });

        // Bus Sub-Filter Pills (All vs Active)
        elements.subPillBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                elements.subPillBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                busSubFilter = btn.dataset.busFilter;
                renderBusList();
            });
        });

        // Schedule Type Pills (Morning vs Evening)
        elements.schedPillBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                elements.schedPillBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                scheduleType = btn.dataset.schedType;
                renderSchedules();
            });
        });

        // Bus Search Input
        if (elements.busSearchInput) {
            elements.busSearchInput.addEventListener('input', () => {
                const val = elements.busSearchInput.value;
                if (val) {
                    elements.clearSearchBtn.classList.remove('hidden');
                } else {
                    elements.clearSearchBtn.classList.add('hidden');
                }
                renderBusList();
            });

            elements.clearSearchBtn.addEventListener('click', () => {
                elements.busSearchInput.value = '';
                elements.clearSearchBtn.classList.add('hidden');
                renderBusList();
            });
        }

        // Stop Search Input
        if (elements.stopSearchInput) {
            elements.stopSearchInput.addEventListener('input', () => {
                const val = elements.stopSearchInput.value;
                if (val) {
                    elements.clearStopSearchBtn.classList.remove('hidden');
                } else {
                    elements.clearStopSearchBtn.classList.add('hidden');
                }
                renderStopsList();
            });

            elements.clearStopSearchBtn.addEventListener('click', () => {
                elements.stopSearchInput.value = '';
                elements.clearStopSearchBtn.classList.add('hidden');
                renderStopsList();
            });
        }

        // Manual Refresh Button
        elements.refreshBtn.addEventListener('click', () => {
            fetchBusesData();
            fetchBusStops();
        });

        // Change Stop Modal Triggers
        if (elements.changeStopBtn) {
            elements.changeStopBtn.addEventListener('click', () => {
                renderStopModalOptions();
                openModal(elements.stopModal);
            });
        }

        elements.closeStopModal.addEventListener('click', () => closeModal(elements.stopModal));
        elements.cancelStopModal.addEventListener('click', () => closeModal(elements.stopModal));

        elements.stopModalSearch.addEventListener('input', () => {
            renderStopModalOptions(elements.stopModalSearch.value);
        });

        // Map Control Buttons
        elements.locateUserBtn.addEventListener('click', () => tryLocateUser(true));

        elements.recenterCollegeBtn.addEventListener('click', () => {
            if (map) {
                map.flyTo(CAMPUS_COORDS, DEFAULT_ZOOM, { duration: 1.2 });
            }
        });

        // Close Floating Bus Card
        elements.closeFloatingCard.addEventListener('click', () => {
            elements.floatingBusCard.classList.add('hidden');
            selectedBusNumber = null;
            renderBusList();
        });

        // Theme Toggle
        elements.themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            elements.themeToggleBtn.innerHTML = newTheme === 'light' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        });

        // Logout Button
        elements.logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to log out?')) {
                localStorage.removeItem('client');
                window.location.href = '../auth.html';
            }
        });

        // Feedback Modal Triggers
        elements.openFeedbackBtn.addEventListener('click', () => {
            populateFeedbackBuses();
            openModal(elements.feedbackModal);
        });

        elements.closeFeedbackModal.addEventListener('click', () => closeModal(elements.feedbackModal));
        elements.cancelFeedback.addEventListener('click', () => closeModal(elements.feedbackModal));

        // Submit Feedback Form
        elements.feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const subject = elements.feedbackSubject.value;
            const bus = elements.feedbackBus.value;
            const message = elements.feedbackMessage.value.trim();

            if (!message) return;

            elements.submitFeedbackBtn.disabled = true;
            elements.submitFeedbackBtn.textContent = 'Submitting...';

            try {
                const response = await fetch(`${getApiBaseUrl()}/api/feedback`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studentEmail: currentUser ? currentUser.email : 'guest@student.com',
                        studentName: currentUser ? currentUser.name : 'Student',
                        subject: `${subject} ${bus ? '(' + bus + ')' : ''}`,
                        message: message
                    })
                });

                if (response.ok) {
                    elements.feedbackAlert.className = 'alert-box success';
                    elements.feedbackAlert.textContent = 'Thank you! Your feedback has been sent successfully.';
                    elements.feedbackAlert.classList.remove('hidden');
                    elements.feedbackForm.reset();

                    setTimeout(() => {
                        elements.feedbackAlert.classList.add('hidden');
                        closeModal(elements.feedbackModal);
                    }, 2000);
                } else {
                    throw new Error('Failed to submit feedback');
                }
            } catch (err) {
                elements.feedbackAlert.className = 'alert-box error';
                elements.feedbackAlert.textContent = 'Could not send feedback. Please try again.';
                elements.feedbackAlert.classList.remove('hidden');
            } finally {
                elements.submitFeedbackBtn.disabled = false;
                elements.submitFeedbackBtn.textContent = 'Submit Feedback';
            }
        });
    }

    // Initialize on DOM Content Loaded
    document.addEventListener('DOMContentLoaded', init);

})();
