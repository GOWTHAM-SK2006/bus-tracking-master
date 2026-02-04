package com.college.bus.bus_tracking.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import com.college.bus.bus_tracking.repository.BusRepository;
import com.college.bus.websocket.AdminWebSocketHandler;
import java.util.*;

@RestController
@RequestMapping("/api/bus")
@CrossOrigin(origins = "*")
public class BusController {

    @Autowired
    private BusRepository busRepository;

    /**
     * Get all buses
     */
    @GetMapping("/all")
    public ResponseEntity<List<?>> getAllBuses() {
        try {
            // For now, return sample data
            List<Map<String, Object>> buses = new ArrayList<>();

            // Sample bus 1
            Map<String, Object> bus1 = new HashMap<>();
            bus1.put("busId", 1);
            bus1.put("busNumber", "BUS001");
            bus1.put("busName", "Express Route A");
            bus1.put("latitude", 13.0827);
            bus1.put("longitude", 80.2707);
            bus1.put("status", "RUNNING");
            bus1.put("driverId", 1);
            bus1.put("driverName", "Raj Kumar");
            bus1.put("driverPhone", "+91-9876543210");
            buses.add(bus1);

            // Sample bus 2
            Map<String, Object> bus2 = new HashMap<>();
            bus2.put("busId", 2);
            bus2.put("busNumber", "BUS002");
            bus2.put("busName", "Local Route B");
            bus2.put("latitude", 13.0901);
            bus2.put("longitude", 80.2821);
            bus2.put("status", "RUNNING");
            bus2.put("driverId", 2);
            bus2.put("driverName", "Vikram Singh");
            bus2.put("driverPhone", "+91-8765432109");
            buses.add(bus2);

            // Sample bus 3
            Map<String, Object> bus3 = new HashMap<>();
            bus3.put("busId", 3);
            bus3.put("busNumber", "BUS003");
            bus3.put("busName", "Campus Shuttle");
            bus3.put("latitude", 13.0650);
            bus3.put("longitude", 80.2500);
            bus3.put("status", "IDLE");
            bus3.put("driverId", 3);
            bus3.put("driverName", "Ramesh Patel");
            bus3.put("driverPhone", "+91-7654321098");
            buses.add(bus3);

            // Broadcast to all connected clients
            broadcastBusUpdates(buses);

            return ResponseEntity.ok(buses);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Get a specific bus by ID
     */
    @GetMapping("/{busId}")
    public ResponseEntity<?> getBusById(@PathVariable Integer busId) {
        try {
            // Sample bus
            Map<String, Object> bus = new HashMap<>();
            bus.put("busId", busId);
            bus.put("busNumber", "BUS" + String.format("%03d", busId));
            bus.put("busName", "Route " + busId);
            bus.put("latitude", 13.0827 + (busId * 0.01));
            bus.put("longitude", 80.2707 + (busId * 0.01));
            bus.put("status", "RUNNING");
            bus.put("driverId", busId);
            bus.put("driverName", "Driver " + busId);
            bus.put("driverPhone", "+91-9000000000");

            return ResponseEntity.ok(bus);
        } catch (Exception e) {
            return ResponseEntity.status(404).build();
        }
    }

    /**
     * Update bus location (Called by Driver App)
     */
    @PostMapping("/{busId}/location")
    public ResponseEntity<?> updateBusLocation(
            @PathVariable Integer busId,
            @RequestBody Map<String, Object> locationData) {
        try {
            Double latitude = ((Number) locationData.get("latitude")).doubleValue();
            Double longitude = ((Number) locationData.get("longitude")).doubleValue();

            System.out.println(
                    "[BusController] Location update for Bus " + busId + ": (" + latitude + ", " + longitude + ")");

            Map<String, Object> busData = new HashMap<>();
            busData.put("busId", busId);
            busData.put("latitude", latitude);
            busData.put("longitude", longitude);
            busData.put("timestamp", System.currentTimeMillis());

            Map<String, Object> adminUpdate = new HashMap<>();
            adminUpdate.put("type", "BUS_LOCATION_UPDATE");
            adminUpdate.put("bus", busData);
            AdminWebSocketHandler.broadcastToAdmins(adminUpdate);

            return ResponseEntity.ok(Map.of("status", "success", "message", "Location updated"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    /**
     * Update bus status
     */
    @PostMapping("/{busId}/status")
    public ResponseEntity<?> updateBusStatus(
            @PathVariable Integer busId,
            @RequestBody Map<String, String> statusData) {
        try {
            String status = statusData.get("status"); // RUNNING, IDLE, STOPPED

            System.out.println("[BusController] Status update for Bus " + busId + ": " + status);

            // Broadcast to users and admins
            Map<String, Object> busData = new HashMap<>();
            busData.put("busId", busId);
            busData.put("status", status);
            busData.put("timestamp", System.currentTimeMillis());

            Map<String, Object> userUpdate = new HashMap<>();
            userUpdate.put("type", "BUS_STATUS_UPDATE");
            userUpdate.put("bus", busData);
            // UserWebSocketHandler.broadcastToUsers(userUpdate); // TODO: Implement
            // UserWebSocketHandler

            Map<String, Object> adminUpdate = new HashMap<>();
            adminUpdate.put("type", "BUS_STATUS_UPDATE");
            adminUpdate.put("bus", busData);
            AdminWebSocketHandler.broadcastToAdmins(adminUpdate);

            return ResponseEntity.ok(Map.of("status", "success", "message", "Status updated"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    /**
     * Trigger sample bus updates for testing
     */
    @PostMapping("/trigger-sample-data")
    public ResponseEntity<?> triggerSampleData() {
        try {
            List<Map<String, Object>> buses = new ArrayList<>();

            // Sample buses
            for (int i = 1; i <= 3; i++) {
                Map<String, Object> bus = new HashMap<>();
                bus.put("busId", i);
                bus.put("busNumber", "BUS" + String.format("%03d", i));
                bus.put("busName", "Route " + i);
                bus.put("latitude", 13.0827 + (i * 0.01));
                bus.put("longitude", 80.2707 + (i * 0.01));
                bus.put("status", i == 3 ? "IDLE" : "RUNNING");
                bus.put("driverId", i);
                bus.put("driverName", "Driver " + i);
                bus.put("driverPhone", "+91-9000000" + i);
                buses.add(bus);
            }

            broadcastBusUpdates(buses);
            return ResponseEntity.ok(Map.of("status", "success", "buses sent", buses.size()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    private void broadcastBusUpdates(List<Map<String, Object>> buses) throws Exception {
        Map<String, Object> update = new HashMap<>();
        update.put("type", "BUS_UPDATE");
        update.put("buses", buses);
        update.put("timestamp", System.currentTimeMillis());

        AdminWebSocketHandler.broadcastToAdmins(update);
    }
}
