/**
 * OpenStreetMap & OSRM Services Integration
 * Replaces TomTom with Free Open Source alternatives:
 * - Geocoding/Search: Nominatim (OpenStreetMap)
 * - Routing: OSRM (Open Source Routing Machine)
 */

// =========================================
// Configuration
// =========================================
const ServiceConfig = {
    // Nominatim (Geocoding) - Requires User-Agent header (handled by browser usually, but good to know)
    NOMINATIM_BASE_URL: 'https://nominatim.openstreetmap.org',

    // OSRM (Routing) - Demo server (use with care in prod, or host your own)
    OSRM_BASE_URL: 'https://router.project-osrm.org',

    // Cache settings
    CACHE_DURATION: {
        ADDRESS: 3600000, // 1 hour
        ROUTE: 1800000,   // 30 minutes
    }
};

// =========================================
// Cache Manager
// =========================================
const CacheManager = {
    cache: new Map(),

    set(key, value, duration) {
        this.cache.set(key, {
            value,
            expires: Date.now() + duration
        });
    },

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expires) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    },

    clear() {
        this.cache.clear();
    }
};

// =========================================
// Reverse Geocoding Service (Nominatim)
// =========================================
const ReverseGeocodingService = {
    async reverseGeocode(lat, lng) {
        const cacheKey = `reverse_${lat.toFixed(4)}_${lng.toFixed(4)}`;
        const cached = CacheManager.get(cacheKey);
        if (cached) return cached;

        try {
            // Nominatim Reverse API
            const url = `${ServiceConfig.NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
            const response = await fetch(url);

            if (!response.ok) throw new Error('Reverse geocoding failed');

            const data = await response.json();
            CacheManager.set(cacheKey, data, ServiceConfig.CACHE_DURATION.ADDRESS);

            return data;
        } catch (error) {
            console.error('[ReverseGeocode] Error:', error);
            return null;
        }
    },

    async getAddress(lat, lng) {
        const result = await this.reverseGeocode(lat, lng);
        if (!result || !result.display_name) {
            return 'Unknown Location';
        }
        // Nominatim returns a full display_name
        return result.display_name;
    },

    async getStreetName(lat, lng) {
        const result = await this.reverseGeocode(lat, lng);
        if (!result || !result.address) {
            return 'Unknown Street';
        }
        return result.address.road || result.address.pedestrian || result.display_name.split(',')[0];
    }
};

// =========================================
// Geocoding Service (Nominatim)
// =========================================
const GeocodingService = {
    async geocode(address) {
        try {
            const url = `${ServiceConfig.NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
            const response = await fetch(url);

            if (!response.ok) throw new Error('Geocoding failed');

            const data = await response.json();
            return data && data.length > 0 ? data[0] : null;
        } catch (error) {
            console.error('[Geocode] Error:', error);
            return null;
        }
    },

    async getCoordinates(address) {
        const result = await this.geocode(address);
        if (!result) return null;

        return {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
        };
    }
};

// =========================================
// Search Service (Nominatim)
// =========================================
const SearchService = {
    async search(query, options = {}) {
        try {
            const params = new URLSearchParams({
                format: 'json',
                q: query,
                limit: options.limit || 10,
                addressdetails: 1
            });

            if (options.lat && options.lng) {
                // Nominatim 'viewbox' can bias search, but simple 'near' isn't directly supported same way as TomTom
                // We'll stick to global search or viewbox if needed, but for now simple query
            }

            const url = `${ServiceConfig.NOMINATIM_BASE_URL}/search?${params}`;
            const response = await fetch(url);

            if (!response.ok) throw new Error('Search failed');

            const data = await response.json();

            // Normalize to match expected TomTom interface partially for Frontend compatibility
            return data.map(item => ({
                id: item.place_id,
                address: {
                    freeformAddress: item.display_name
                },
                position: {
                    lat: parseFloat(item.lat),
                    lon: parseFloat(item.lon)
                }
            }));

        } catch (error) {
            console.error('[Search] Error:', error);
            return [];
        }
    },

    async searchNearby(query, lat, lng, radius = 5000) {
        // Nominatim doesn't strictly support radius search easily without viewbox, 
        // effectively same as generic search for this basic implementation.
        return this.search(query);
    }
};

// =========================================
// Routing Service (OSRM)
// =========================================
const RoutingService = {
    async calculateRoute(start, end, options = {}) {
        // OSRM expects: {lon},{lat};{lon},{lat}
        const cacheKey = `route_${start.join(',')}_${end.join(',')}`;
        const cached = CacheManager.get(cacheKey);
        if (cached) return cached;

        try {
            // start/end are [lng, lat] arrays
            const coords = `${start[0]},${start[1]};${end[0]},${end[1]}`;
            const url = `${ServiceConfig.OSRM_BASE_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('Routing failed');

            const data = await response.json();

            // Adapt OSRM to TomTom format for compatibility
            const adaptedData = {
                routes: data.routes.map(r => ({
                    summary: {
                        lengthInMeters: r.distance,
                        travelTimeInSeconds: r.duration,
                        trafficDelayInSeconds: 0 // OSRM basic doesn't have real-time traffic
                    },
                    legs: [{
                        points: r.geometry.coordinates.map(c => ({ longitude: c[0], latitude: c[1] }))
                    }]
                }))
            };

            CacheManager.set(cacheKey, adaptedData, ServiceConfig.CACHE_DURATION.ROUTE);
            return adaptedData;

        } catch (error) {
            console.error('[Routing] Error:', error);
            return null;
        }
    },

    getRouteCoordinates(routeData) {
        if (!routeData || !routeData.routes || routeData.routes.length === 0) {
            return [];
        }
        const points = routeData.routes[0].legs[0].points;
        return points.map(p => [p.longitude, p.latitude]);
    },

    getRouteSummary(routeData) {
        if (!routeData || !routeData.routes || routeData.routes.length === 0) {
            return null;
        }
        const summary = routeData.routes[0].summary;
        return {
            distanceMeters: summary.lengthInMeters,
            distanceKm: (summary.lengthInMeters / 1000).toFixed(1),
            durationSeconds: summary.travelTimeInSeconds,
            durationMinutes: Math.ceil(summary.travelTimeInSeconds / 60),
            trafficDelaySeconds: 0
        };
    }
};

// =========================================
// Stubbed Services (Not supported by Free Tier easily)
// =========================================
const SnapToRoadsService = {
    async snapToRoads(points) { return points; },
    async snapPoint(lat, lng) { return { lat, lng }; }
};

const TrafficService = {
    addTrafficLayer(map) { console.log('[Traffic] Not available in Open Source tier'); },
    removeTrafficLayer() { },
    toggleTrafficLayer(map) { return false; },
    async getTrafficIncidents(bounds) { return []; }
};

const MatrixRoutingService = {
    async calculateMatrix(origins, destinations) { return null; },
    async findNearest(origin, destinations) { return null; }
};

// =========================================
// CARTO Service (Client Integration)
// =========================================
const CartoService = {
    client: null,

    /**
     * Initialize CARTO Client
     * @param {string} username - CARTO Username
     * @param {string} apiKey - CARTO API Key
     */
    init(username, apiKey) {
        if (!window.carto) {
            console.error('[CartoService] CARTO.js library not loaded');
            return;
        }

        this.client = new carto.Client({
            apiKey: apiKey,
            username: username
        });

        console.log(`[CartoService] Initialized for user: ${username}`);
    },

    /**
     * Create a generic CARTO layer from a SQL query
     * @param {string} sql - SQL Query (e.g., SELECT * FROM my_table)
     * @param {string} css - CartoCSS styling
     * @returns {Object} Leaflet Layer (Carto)
     */
    createLayer(sql, css) {
        if (!this.client) {
            console.warn('[CartoService] Client not initialized. Call init() first.');
            return null;
        }

        const source = new carto.source.SQL(sql);
        const style = new carto.style.CartoCSS(css);
        const layer = new carto.layer.Layer(source, style);

        // Add to client to begin fetching
        this.client.addLayer(layer);

        // Return the Leaflet view of the layer
        return layer.getLeafletLayer();
    },

    /**
     * Create a layer from Local GeoJSON (Using Maps API - requires account)
     * NOTE: CARTO.js v4 focuses on backend data. 
     * To treat local GeoJSON with CartoCSS is cleaner via backend import, 
     * but 'carto.source.GeoJSON' exists for this purpose if supported by the backend/client version.
     */
    createGeoJSONLayer(geoJsonData, css) {
        if (!this.client) return null;

        // This assumes the CARTO backend supports the data bundle size
        const source = new carto.source.GeoJSON(geoJsonData);
        const style = new carto.style.CartoCSS(css);
        const layer = new carto.layer.Layer(source, style);

        this.client.addLayer(layer);
        return layer.getLeafletLayer();
    }
};

// =========================================
// Export Services (Aliased as TomTomServices / AppServices)
// =========================================
window.TomTomServices = {
    Config: ServiceConfig,
    Cache: CacheManager,
    ReverseGeocoding: ReverseGeocodingService,
    Geocoding: GeocodingService,
    Search: SearchService,
    Routing: RoutingService,
    SnapToRoads: SnapToRoadsService,
    Traffic: TrafficService,
    MatrixRouting: MatrixRoutingService,
    Carto: CartoService
};

console.log('[OpenServices] Initialized (Aliased as TomTomServices)');
