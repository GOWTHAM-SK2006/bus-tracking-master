/**
 * BusTrack Demo Mode - Precision Road Mapping
 * Coordinates verified for major Chennai arterials (GST, OMR, NH4)
 */

const DEMO_STOPS = [
    // Major Hubs (Points on the actual road)
    { id: 'S1', name: 'Chennai Central', lat: 13.0827, lng: 80.2707 },
    { id: 'S2', name: 'Marina Beach', lat: 13.0500, lng: 80.2824 },
    { id: 'S3', name: 'Guindy (Kathipara)', lat: 13.0067, lng: 80.2015 },
    { id: 'S4', name: 'Tambaram Junction', lat: 12.9242, lng: 80.1206 },
    { id: 'S5', name: 'Chengalpattu Bus Stand', lat: 12.6931, lng: 79.9723 },
    { id: 'S6', name: 'Kancheepuram Temple', lat: 12.8387, lng: 79.7033 },
    { id: 'S7', name: 'Thiruvallur Station', lat: 13.1311, lng: 79.9079 },
    { id: 'S8', name: 'Sriperumbudur Hub', lat: 12.9774, lng: 79.9482 },
    { id: 'S9', name: 'Poonamallee Bypass', lat: 13.0487, lng: 80.0967 },
    { id: 'S10', name: 'Avadi Bus Terminus', lat: 13.1165, lng: 80.1037 },
    { id: 'S11', name: 'Koyambedu CMBT', lat: 13.0673, lng: 80.2057 },
    { id: 'S13', name: 'Sholinganallur Junction', lat: 12.8986, lng: 80.2285 },
    { id: 'S14', name: 'Kelambakkam Junction', lat: 12.7939, lng: 80.2205 },

    // Intermediate High-Precision Waypoints (Strictly on Road)
    { id: 'W_MT1', name: 'Anna Salai Point 1', lat: 13.0650, lng: 80.2600, type: 'waypoint' },
    { id: 'W_MT1b', name: 'Spencer Plaza', lat: 13.0620, lng: 80.2550, type: 'waypoint' },
    { id: 'W_MT2', name: 'Anna Salai Point 2', lat: 13.0400, lng: 80.2400, type: 'waypoint' },
    { id: 'W_MT2b', name: 'Saidapet Road', lat: 13.0250, lng: 80.2300, type: 'waypoint' },
    { id: 'W_GST1', name: 'Meenambakkam Airport', lat: 12.9816, lng: 80.1650, type: 'waypoint' },
    { id: 'W_GST1b', name: 'Chromepet GST', lat: 12.9500, lng: 80.1400, type: 'waypoint' },
    { id: 'W_GST2', name: 'Pallavaram GST Road', lat: 12.9675, lng: 80.1495, type: 'waypoint' },
    { id: 'W_GST3', name: 'Perungalathur Road', lat: 12.9056, lng: 80.1050, type: 'waypoint' },
    { id: 'W_GST3b', name: 'Vandalur Junction', lat: 12.8900, lng: 80.0800, type: 'waypoint' },
    { id: 'W_GST4', name: 'Guduvanchery Hub', lat: 12.8465, lng: 80.0594, type: 'waypoint' },
    { id: 'W_GST5', name: 'Maraimalai Nagar GST', lat: 12.7936, lng: 80.0210, type: 'waypoint' },
    { id: 'W_GST6', name: 'Singaperumal Koil', lat: 12.7600, lng: 79.9950, type: 'waypoint' },
    { id: 'W_OMR1', name: 'Madhya Kailash', lat: 13.0080, lng: 80.2450, type: 'waypoint' },
    { id: 'W_OMR1b', name: 'Kandanchavadi', lat: 12.9650, lng: 80.2455, type: 'waypoint' },
    { id: 'W_OMR2', name: 'Taramani Point', lat: 12.9750, lng: 80.2460, type: 'waypoint' },
    { id: 'W_OMR2b', name: 'Karapakkam', lat: 12.9200, lng: 80.2300, type: 'waypoint' },
    { id: 'W_OMR3', name: 'Navalur Junction', lat: 12.8550, lng: 80.2240, type: 'waypoint' },
    { id: 'W_OMR3b', name: 'Siruseri IT Park', lat: 12.8300, lng: 80.2210, type: 'waypoint' },
    { id: 'W_NH4_1', name: 'Maduravoyal Flyover', lat: 13.0680, lng: 80.1650, type: 'waypoint' },
    { id: 'W_NH4_1b', name: 'Vanagaram NH', lat: 13.0600, lng: 80.1450, type: 'waypoint' },
    { id: 'W_NH4_2', name: 'Tiruverkadu Road', lat: 13.0550, lng: 80.1250, type: 'waypoint' }
];

const DEMO_BUSES_CONFIG = [
    { id: 'B1', no: 'TN-01-A', name: 'Chennai-Chengalpattu GST Exp', route: ['S1', 'W_MT1', 'W_MT1b', 'W_MT2', 'W_MT2b', 'S3', 'W_GST1', 'W_GST2', 'W_GST1b', 'S4', 'W_GST3', 'W_GST3b', 'W_GST4', 'W_GST5', 'W_GST6', 'S5'] },
    { id: 'B2', no: 'TN-01-B', name: 'Chennai-Kancheepuram Srv', route: ['S1', 'S11', 'W_NH4_1', 'W_NH4_1b', 'W_NH4_2', 'S9', 'S8', 'S6'] },
    { id: 'B3', no: 'TN-21-X', name: 'Chengalpattu-Guindy Hub', route: ['S5', 'W_GST6', 'W_GST5', 'W_GST4', 'W_GST3b', 'W_GST3', 'S4', 'W_GST1b', 'W_GST2', 'W_GST1', 'S3'] },
    { id: 'B4', no: 'TN-02-Y', name: 'Thiruvallur-Chennai NH Line', route: ['S7', 'S10', 'S11', 'S1'] },
    { id: 'B5', no: 'TN-01-C', name: 'Marina-Kelambakkam OMR', route: ['S2', 'W_OMR1', 'W_OMR1b', 'W_OMR2', 'W_OMR2b', 'S13', 'W_OMR3', 'W_OMR3b', 'S14'] },
    { id: 'B6', no: 'TN-10-M', name: 'Poonamallee-Avadi Link', route: ['S9', 'S10', 'S7', 'S8'] },
    { id: 'B7', no: 'TN-01-D', name: 'IT Corridor Special', route: ['S1', 'W_MT1', 'W_MT1b', 'S3', 'W_OMR1', 'W_OMR1b', 'S13', 'W_OMR2b', 'W_OMR3', 'W_OMR3b', 'S14', 'S5'] },
    { id: 'B8', no: 'TN-05-S', name: 'North Chennai Connector', route: ['S1', 'S11', 'S10', 'S7'] },
    { id: 'B9', no: 'TN-01-E', name: 'OMR-GST Loop', route: ['S5', 'W_GST5', 'W_GST4', 'W_GST3b', 'S4', 'W_GST1', 'S3', 'W_OMR1', 'S13', 'W_OMR2b', 'W_OMR3', 'W_OMR3b', 'S14'] },
    { id: 'B10', no: 'TN-21-P', name: 'Kancheepuram-Thiruvallur', route: ['S6', 'S8', 'S9', 'S10', 'S7'] }
];

const DemoManager = {
    buses: [],
    updateInterval: null,

    init() {
        console.log('[Demo] Initializing high-precision road simulated data...');

        // Initialize stops in app state (only actual stops, not waypoints)
        DEMO_STOPS.forEach(stop => {
            if (stop.type !== 'waypoint') {
                window.BusTrackApp.state.stops.set(stop.name, {
                    name: stop.name,
                    lat: stop.lat,
                    lng: stop.lng,
                    buses: []
                });
            }
        });

        // Initialize buses
        this.buses = DEMO_BUSES_CONFIG.map(config => {
            const routeStops = config.route.map(sid => DEMO_STOPS.find(s => s.id === sid));
            const progress = Math.random() * (routeStops.length - 1);

            return {
                busId: config.id,
                busNo: config.no,
                busName: config.name,
                route: routeStops,
                progress: progress,
                speed: 0.003 + Math.random() * 0.004,
                direction: 1,
                lastRotation: 0
            };
        });

        this.startSimulation();
    },

    startSimulation() {
        if (this.updateInterval) clearInterval(this.updateInterval);
        this.updateInterval = setInterval(() => this.updateBuses(), 100);
    },

    /**
     * Calculate bearing between two points in degrees
     */
    calculateBearing(lat1, lon1, lat2, lon2) {
        const y = Math.sin((lon2 - lon1) * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180);
        const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos((lon2 - lon1) * Math.PI / 180);
        return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    },

    updateBuses() {
        this.buses.forEach(bus => {
            bus.progress += bus.speed * bus.direction;

            if (bus.progress >= bus.route.length - 1) {
                bus.progress = bus.route.length - 1;
                bus.direction = -1;
            } else if (bus.progress <= 0) {
                bus.progress = 0;
                bus.direction = 1;
            }

            const segmentIndex = Math.floor(bus.progress);
            const segmentProgress = bus.progress - segmentIndex;

            const startStop = bus.route[segmentIndex];
            const endStop = bus.route[segmentIndex + 1] || startStop;

            const currentLat = startStop.lat + (endStop.lat - startStop.lat) * segmentProgress;
            const currentLng = startStop.lng + (endStop.lng - startStop.lng) * segmentProgress;

            // Calculate rotation (point towards next waypoint)
            let rotation = bus.lastRotation;
            if (startStop.lat !== endStop.lat || startStop.lng !== endStop.lng) {
                // If moving backwards, flip rotation 180 deg
                const baseRotation = this.calculateBearing(startStop.lat, startStop.lng, endStop.lat, endStop.lng);
                rotation = (bus.direction === 1) ? baseRotation : (baseRotation + 180) % 360;
                // Add 90 because our bus icon SVG is horizontal facing right (usually 0 deg in bearing is North)
                // Bearing 0 = North, SVG 0 = East. So adjust.
                rotation = (rotation - 90 + 360) % 360;
                bus.lastRotation = rotation;
            }

            const busData = {
                busId: bus.busId,
                busNo: bus.busNo,
                busName: bus.busName,
                latitude: currentLat,
                longitude: currentLng,
                rotation: rotation,
                status: 'ACTIVE',
                stops: bus.route.filter(s => s.type !== 'waypoint').map(s => s.name),
                lastUpdate: new Date().toISOString()
            };

            if (window.BusTrackApp && window.BusTrackApp.BusTracker) {
                window.BusTrackApp.BusTracker.updateBus(busData);
            }
        });
    }
};

window.BusTrackDemo = DemoManager;
