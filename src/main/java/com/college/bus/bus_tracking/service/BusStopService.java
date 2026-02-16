package com.college.bus.bus_tracking.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class BusStopService {

    /**
     * Search for bus stops from driver data
     * 
     * @param query Search query
     * @return List of matching bus stop names
     */
    public List<String> searchBusStops(String query) {
        // Depot field removed, returning empty list for now
        return new ArrayList<>();
    }

    /**
     * Get all unique bus stops from drivers
     * 
     * @return List of all bus stop names
     */
    public List<String> getAllBusStops() {
        // Depot field removed, returning empty list for now
        return new ArrayList<>();
    }
}
