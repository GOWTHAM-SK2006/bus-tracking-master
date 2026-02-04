package com.college.bus.bus_tracking.controller;

import com.college.bus.bus_tracking.entity.SystemSettings;
import com.college.bus.bus_tracking.repository.BusRepository;
import com.college.bus.bus_tracking.service.SystemSettingsService;
import com.college.bus.bus_tracking.store.BusSessionStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private BusRepository busRepository;

    @Autowired
    private SystemSettingsService systemSettingsService;

    /**
     * Get system settings
     */
    @GetMapping("/settings")
    public ResponseEntity<Map<String, Object>> getSettings() {
        Map<String, Object> response = new HashMap<>();
        try {
            SystemSettings settings = systemSettingsService.getSettings();
            response.put("success", true);
            response.put("accountCreationEnabled", settings.getAccountCreationEnabled());
            response.put("lastModified", settings.getLastModified());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Toggle account creation on/off
     */
    @PostMapping("/toggle-account-creation")
    public ResponseEntity<Map<String, Object>> toggleAccountCreation() {
        Map<String, Object> response = new HashMap<>();
        try {
            SystemSettings settings = systemSettingsService.toggleAccountCreation();
            response.put("success", true);
            response.put("accountCreationEnabled", settings.getAccountCreationEnabled());
            response.put("message",
                    "Account creation " + (settings.getAccountCreationEnabled() ? "enabled" : "disabled"));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error toggling account creation:");
            e.printStackTrace();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Clear all bus sessions from both in-memory store and database.
     * This endpoint should be called when you want to reset all bus data.
     * DELETE method for API clients
     */
    @DeleteMapping("/clear-sessions")
    public ResponseEntity<Map<String, Object>> clearAllSessions() {
        return performClear();
    }

    /**
     * GET version for easy browser access
     * Just visit: http://localhost:8080/api/admin/clear
     */
    @GetMapping("/clear")
    public ResponseEntity<Map<String, Object>> clearAllSessionsGet() {
        return performClear();
    }

    private ResponseEntity<Map<String, Object>> performClear() {
        Map<String, Object> response = new HashMap<>();

        try {
            // 1. Clear in-memory bus sessions
            int memoryCount = BusSessionStore.BUS_MAP.size();
            BusSessionStore.BUS_MAP.clear();

            // 2. Clear database
            long dbCount = busRepository.count();
            busRepository.deleteAll();

            response.put("success", true);
            response.put("message", "All bus sessions cleared successfully");
            response.put("clearedFromMemory", memoryCount);
            response.put("clearedFromDatabase", dbCount);

            System.out.println(
                    "[Admin] Cleared " + memoryCount + " sessions from memory and " + dbCount + " from database");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Get current session count (for debugging)
     */
    @GetMapping("/session-count")
    public ResponseEntity<Map<String, Object>> getSessionCount() {
        Map<String, Object> response = new HashMap<>();
        response.put("memoryCount", BusSessionStore.BUS_MAP.size());
        response.put("databaseCount", busRepository.count());
        response.put("activeBuses", BusSessionStore.BUS_MAP.keySet());
        return ResponseEntity.ok(response);
    }
}
