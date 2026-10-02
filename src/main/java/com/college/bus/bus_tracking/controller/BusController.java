package com.college.bus.bus_tracking.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import com.college.bus.bus_tracking.entity.BusEntity;
import com.college.bus.bus_tracking.entity.Driver;
import com.college.bus.bus_tracking.repository.BusRepository;
import com.college.bus.bus_tracking.repository.DriverRepository;
import com.college.bus.bus_tracking.store.BusSessionStore;
import com.college.bus.bus_tracking.websocket.AdminWebSocketHandler;
import com.college.bus.bus_tracking.handler.UserHandler;
import com.college.bus.bus_tracking.model.BusData;
import java.util.*;

@RestController
@RequestMapping("/api/bus")
@CrossOrigin(origins = "*")
public class BusController {

    @Autowired
    private BusRepository busRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private UserHandler userHandler;

    /**
     * Get all buses - merges database records with live in-memory tracking data
     */
    @GetMapping("/all")
    public ResponseEntity<List<BusData>> getAllBuses() {
        try {
            // Start with all buses from the database (the source of truth for registered buses)
            List<BusEntity> dbBuses = busRepository.findAll();
            if (dbBuses.isEmpty() && BusSessionStore.BUS_MAP.isEmpty()) {
                seedDefaultBuses();
                dbBuses = busRepository.findAll();
            }
            Map<String, BusData> mergedMap = new LinkedHashMap<>();

            // First, add all DB buses with their stored info
            for (BusEntity entity : dbBuses) {
                String busNumber = entity.getBusNumber();
                
                // Check if there's live data in BUS_MAP
                BusData liveData = BusSessionStore.BUS_MAP.get(busNumber);
                if (liveData != null) {
                    // Use live data (has real-time coordinates, status etc.)
                    mergedMap.put(busNumber, liveData);
                } else {
                    // No live data - create BusData from DB entity with INACTIVE status
                    BusData dbData = new BusData(
                            entity.getId(),
                            entity.getBusNumber(),
                            entity.getDriverId(),
                            entity.getBusName(),
                            entity.getBusStop(),
                            entity.getLatitude(),
                            entity.getLongitude(),
                            entity.getStatus() != null ? entity.getStatus() : "INACTIVE",
                            entity.getDriverName(),
                            entity.getDriverPhone());
                    mergedMap.put(busNumber, dbData);
                }
            }

            // Also include any BUS_MAP entries not in DB (edge case: actively tracking but not saved)
            for (Map.Entry<String, BusData> entry : BusSessionStore.BUS_MAP.entrySet()) {
                if (!mergedMap.containsKey(entry.getKey())) {
                    mergedMap.put(entry.getKey(), entry.getValue());
                }
            }

            List<BusData> buses = new ArrayList<>(mergedMap.values());
            System.out.println("[BusController] Returning " + buses.size() + " buses (DB: " + dbBuses.size() + ", Live: " + BusSessionStore.BUS_MAP.size() + ")");

            return ResponseEntity.ok(buses);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    private void seedDefaultBuses() {
        try {
            List<BusEntity> defaults = new ArrayList<>();
            BusEntity b1 = new BusEntity(); b1.setBusNumber("BUS-101"); b1.setBusName("Tambaram Line"); b1.setBusStop("Tambaram"); b1.setLatitude(12.9250); b1.setLongitude(80.1270); b1.setStatus("RUNNING"); b1.setDriverName("Ramesh Kumar"); b1.setDriverPhone("+91 9876543210");
            defaults.add(b1);
            BusEntity b2 = new BusEntity(); b2.setBusNumber("BUS-102"); b2.setBusName("Guindy Express"); b2.setBusStop("Guindy"); b2.setLatitude(13.0067); b2.setLongitude(80.2020); b2.setStatus("RUNNING"); b2.setDriverName("Suresh Babu"); b2.setDriverPhone("+91 9876543211");
            defaults.add(b2);
            BusEntity b3 = new BusEntity(); b3.setBusNumber("BUS-103"); b3.setBusName("Koyambedu Route"); b3.setBusStop("Koyambedu"); b3.setLatitude(13.0694); b3.setLongitude(80.1948); b3.setStatus("INACTIVE"); b3.setDriverName("Venkatesh"); b3.setDriverPhone("+91 9876543212");
            defaults.add(b3);
            BusEntity b4 = new BusEntity(); b4.setBusNumber("BUS-104"); b4.setBusName("Porur Line"); b4.setBusStop("Porur"); b4.setLatitude(13.0382); b4.setLongitude(80.1565); b4.setStatus("RUNNING"); b4.setDriverName("Karthik"); b4.setDriverPhone("+91 9876543213");
            defaults.add(b4);
            BusEntity b5 = new BusEntity(); b5.setBusNumber("BUS-105"); b5.setBusName("Velachery Route"); b5.setBusStop("Velachery"); b5.setLatitude(12.9757); b5.setLongitude(80.2207); b5.setStatus("INACTIVE"); b5.setDriverName("Anand"); b5.setDriverPhone("+91 9876543214");
            defaults.add(b5);

            for (BusEntity b : defaults) {
                if (busRepository.findByBusNumber(b.getBusNumber()).isEmpty()) {
                    BusEntity saved = busRepository.save(b);
                    BusData data = new BusData(
                        saved.getId(), saved.getBusNumber(), saved.getDriverId(),
                        saved.getBusName(), saved.getBusStop(), saved.getLatitude(), saved.getLongitude(),
                        saved.getStatus(), saved.getDriverName(), saved.getDriverPhone()
                    );
                    BusSessionStore.BUS_MAP.put(saved.getBusNumber(), data);
                }
            }
        } catch (Exception e) {
            System.err.println("[BusController] Error seeding default buses: " + e.getMessage());
        }
    }


    /**
     * Update bus location (Called by Driver App)
     */
    @PutMapping("/{busId}/location")
    public ResponseEntity<?> updateBusLocation(
            @PathVariable Long busId,
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
    @PutMapping("/{busId}/status")
    public ResponseEntity<?> updateBusStatus(
            @PathVariable Long busId,
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
            // User broadcast not yet implemented

            Map<String, Object> adminUpdate = new HashMap<>();
            adminUpdate.put("type", "BUS_STATUS_UPDATE");
            adminUpdate.put("bus", busData);
            AdminWebSocketHandler.broadcastToAdmins(adminUpdate);

            return ResponseEntity.ok(Map.of("status", "success", "message", "Status updated"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("status", "error", "message", e.getMessage()));
        }
    }


    // =========================================
    // Bus Config Management (Admin)
    // =========================================

    /**
     * Add a new bus configuration (Admin use).
     * Creates a BusEntity in DB and adds to in-memory store.
     */
    @PostMapping("/config")
    public ResponseEntity<?> addBusConfig(@RequestBody Map<String, String> configData) {
        Map<String, Object> response = new HashMap<>();
        try {
            String busNumber = configData.get("busNumber");
            String busName = configData.get("busName");

            if (busNumber == null || busNumber.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Bus number is required");
                return ResponseEntity.badRequest().body(response);
            }
            if (busName == null || busName.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Bus/Route name is required");
                return ResponseEntity.badRequest().body(response);
            }

            busNumber = busNumber.trim();
            busName = busName.trim();

            // Check for duplicate
            if (busRepository.findByBusNumber(busNumber).isPresent()) {
                response.put("success", false);
                response.put("message", "A bus with number \"" + busNumber + "\" already exists");
                return ResponseEntity.badRequest().body(response);
            }

            // Create BusEntity
            BusEntity entity = new BusEntity();
            entity.setBusNumber(busNumber);
            entity.setBusName(busName);
            entity.setStatus("INACTIVE");
            entity.setLatitude(0.0);
            entity.setLongitude(0.0);
            entity = busRepository.save(entity);

            // Add to in-memory store
            BusData busData = new BusData(
                    entity.getId(),
                    entity.getBusNumber(),
                    entity.getDriverId(),
                    entity.getBusName(),
                    entity.getBusStop(),
                    0.0, 0.0,
                    "INACTIVE",
                    entity.getDriverName(),
                    entity.getDriverPhone());
            BusSessionStore.BUS_MAP.put(busNumber, busData);

            // Broadcast to admins
            List<BusData> allBuses = new ArrayList<>(BusSessionStore.BUS_MAP.values());
            Map<String, Object> update = new HashMap<>();
            update.put("type", "BUS_UPDATE");
            update.put("buses", allBuses);
            update.put("source", "AdminBusConfig");
            update.put("timestamp", System.currentTimeMillis());
            AdminWebSocketHandler.broadcastToAdmins(update);

            System.out.println("[BusController] Admin added bus config: " + busNumber + " (" + busName + ")");

            response.put("success", true);
            response.put("message", "Bus \"" + busName + "\" added successfully");
            response.put("bus", entity);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Delete a bus configuration by bus number (Admin use).
     * Removes from DB, in-memory store, and broadcasts.
     */
    @DeleteMapping("/config/{busNumber}")
    public ResponseEntity<?> deleteBusConfig(@PathVariable String busNumber) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Remove from database
            Optional<BusEntity> entityOpt = busRepository.findByBusNumber(busNumber);
            if (entityOpt.isPresent()) {
                busRepository.delete(entityOpt.get());
            }

            // Remove from in-memory store
            BusSessionStore.BUS_MAP.remove(busNumber);

            // Broadcast updated list to admins
            List<BusData> allBuses = new ArrayList<>(BusSessionStore.BUS_MAP.values());
            Map<String, Object> update = new HashMap<>();
            update.put("type", "BUS_UPDATE");
            update.put("buses", allBuses);
            update.put("source", "AdminBusConfig");
            update.put("timestamp", System.currentTimeMillis());
            AdminWebSocketHandler.broadcastToAdmins(update);

            // Broadcast to student/user clients too
            userHandler.broadcastUpdate();

            System.out.println("[BusController] Admin deleted bus config: " + busNumber);

            response.put("success", true);
            response.put("message", "Bus \"" + busNumber + "\" deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // =========================================
    // Driver Bus Management (Bi-directional Sync)
    // =========================================

    /**
     * Get all buses assigned to a specific driver
     */
    @GetMapping("/driver/{driverId}")
    public ResponseEntity<?> getBusesByDriver(@PathVariable Long driverId) {
        try {
            List<BusEntity> buses = busRepository.findAllByDriverId(driverId);
            
            // Cross-reference with live BUS_MAP to get real-time tracking status
            List<Map<String, Object>> result = new ArrayList<>();
            for (BusEntity bus : buses) {
                Map<String, Object> busMap = new HashMap<>();
                busMap.put("id", bus.getId());
                busMap.put("busNumber", bus.getBusNumber());
                busMap.put("busName", bus.getBusName());
                busMap.put("driverId", bus.getDriverId());
                
                // Check real-time status from BUS_MAP
                BusData liveData = BusSessionStore.BUS_MAP.get(bus.getBusNumber());
                if (liveData != null && liveData.getStatus() != null) {
                    busMap.put("status", liveData.getStatus());
                } else {
                    busMap.put("status", bus.getStatus() != null ? bus.getStatus() : "INACTIVE");
                }
                
                result.add(busMap);
            }
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * Add a bus config for a specific driver
     */
    @PostMapping("/driver/{driverId}")
    public ResponseEntity<?> addBusForDriver(@PathVariable Long driverId, @RequestBody Map<String, String> data) {
        try {
            String busNumber = data.get("busNumber");
            String busName = data.get("busName");
            if (busNumber == null || busName == null)
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Missing required fields"));

            // Validate driver
            Optional<Driver> driverOpt = driverRepository.findById(driverId);
            if (driverOpt.isEmpty())
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Driver not found"));

            Driver driver = driverOpt.get();

            if (busRepository.findByBusNumber(busNumber).isPresent()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Bus number already exists"));
            }

            BusEntity entity = new BusEntity();
            entity.setBusNumber(busNumber);
            entity.setBusName(busName);
            entity.setDriverId(driverId);
            entity.setDriverName(driver.getName());
            entity.setDriverPhone(driver.getPhone());
            entity.setStatus("INACTIVE");
            entity = busRepository.save(entity);

            BusData busData = new BusData(
                    entity.getId(), entity.getBusNumber(), entity.getDriverId(),
                    entity.getBusName(), entity.getBusStop(), 0.0, 0.0,
                    "INACTIVE", entity.getDriverName(), entity.getDriverPhone());
            BusSessionStore.BUS_MAP.put(busNumber, busData);

            // Broadcast ADD Event
            Map<String, Object> update = new HashMap<>();
            update.put("type", "BUS_CONFIG_ADDED");
            update.put("bus", entity);
            update.put("driverId", driverId);
            AdminWebSocketHandler.broadcastToAdmins(update);
            com.college.bus.bus_tracking.handler.DriverHandler.broadcastToDrivers(update);
            try {
                userHandler.broadcastUpdate();
            } catch (Exception ignored) {
            }

            // Update main table
            List<BusData> allBuses = new ArrayList<>(BusSessionStore.BUS_MAP.values());
            Map<String, Object> tableUpdate = new HashMap<>();
            tableUpdate.put("type", "BUS_UPDATE");
            tableUpdate.put("buses", allBuses);
            AdminWebSocketHandler.broadcastToAdmins(tableUpdate);

            return ResponseEntity.ok(Map.of("success", true, "bus", entity));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * Delete a bus config by ID
     */
    @DeleteMapping("/id/{busId}")
    public ResponseEntity<?> deleteBusById(@PathVariable Long busId) {
        try {
            Optional<BusEntity> opt = busRepository.findById(busId);
            if (opt.isEmpty())
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Not found"));

            BusEntity bus = opt.get();
            Long driverId = bus.getDriverId();
            busRepository.delete(bus);
            BusSessionStore.BUS_MAP.remove(bus.getBusNumber());

            Map<String, Object> update = new HashMap<>();
            update.put("type", "BUS_CONFIG_DELETED");
            update.put("busId", busId);
            update.put("driverId", driverId);
            AdminWebSocketHandler.broadcastToAdmins(update);
            com.college.bus.bus_tracking.handler.DriverHandler.broadcastToDrivers(update);
            try {
                userHandler.broadcastUpdate();
            } catch (Exception ignored) {
            }

            List<BusData> allBuses = new ArrayList<>(BusSessionStore.BUS_MAP.values());
            Map<String, Object> tableUpdate = new HashMap<>();
            tableUpdate.put("type", "BUS_UPDATE");
            tableUpdate.put("buses", allBuses);
            AdminWebSocketHandler.broadcastToAdmins(tableUpdate);

            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
