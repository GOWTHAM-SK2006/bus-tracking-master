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
import com.college.bus.bus_tracking.websocket.AdminWebSocketHandler;

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
            Boolean driverSignIn = settings.getDriverSignInEnabled();
            Boolean studentSignIn = settings.getStudentSignInEnabled();
            response.put("driverSignInEnabled", driverSignIn != null ? driverSignIn : true);
            response.put("studentSignInEnabled", studentSignIn != null ? studentSignIn : true);
            response.put("lastModified", settings.getLastModified());
            return ResponseEntity.ok()
                    .header("Cache-Control", "no-store, no-cache, must-revalidate")
                    .header("Pragma", "no-cache")
                    .body(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("error", e.toString());
            response.put("trace", java.util.Arrays.toString(e.getStackTrace()));
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

            // Trigger WebSocket broadcast
            Map<String, Object> update = new HashMap<>();
            update.put("type", "REGISTRATION_UPDATE");
            update.put("accountCreationEnabled", settings.getAccountCreationEnabled());
            update.put("timestamp", System.currentTimeMillis());
            AdminWebSocketHandler.broadcastSystemUpdate(update);

            response.put("success", true);
            response.put("accountCreationEnabled", settings.getAccountCreationEnabled());
            response.put("message",
                    "Account creation " + (settings.getAccountCreationEnabled() ? "enabled" : "disabled"));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error toggling account creation:");
            e.printStackTrace();
            response.put("success", false);
            response.put("error", e.toString());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Toggle driver sign-in on/off
     */
    @PostMapping("/toggle-driver-signin")
    public ResponseEntity<Map<String, Object>> toggleDriverSignIn() {
        Map<String, Object> response = new HashMap<>();
        try {
            SystemSettings settings = systemSettingsService.toggleDriverSignIn();

            boolean enabled = settings.getDriverSignInEnabled() != null ? settings.getDriverSignInEnabled() : true;

            Map<String, Object> update = new HashMap<>();
            update.put("type", "DRIVER_SIGNIN_UPDATE");
            update.put("driverSignInEnabled", enabled);
            update.put("timestamp", System.currentTimeMillis());
            AdminWebSocketHandler.broadcastSystemUpdate(update);

            response.put("success", true);
            response.put("driverSignInEnabled", enabled);
            response.put("message",
                    "Driver sign-in " + (enabled ? "enabled" : "disabled"));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error toggling driver sign-in:");
            e.printStackTrace();
            response.put("success", false);
            response.put("error", e.toString());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Toggle student sign-in on/off
     */
    @PostMapping("/toggle-student-signin")
    public ResponseEntity<Map<String, Object>> toggleStudentSignIn() {
        Map<String, Object> response = new HashMap<>();
        try {
            SystemSettings settings = systemSettingsService.toggleStudentSignIn();

            boolean enabled = settings.getStudentSignInEnabled() != null ? settings.getStudentSignInEnabled() : true;

            Map<String, Object> update = new HashMap<>();
            update.put("type", "STUDENT_SIGNIN_UPDATE");
            update.put("studentSignInEnabled", enabled);
            update.put("timestamp", System.currentTimeMillis());
            AdminWebSocketHandler.broadcastSystemUpdate(update);

            response.put("success", true);
            response.put("studentSignInEnabled", enabled);
            response.put("message",
                    "Student sign-in " + (enabled ? "enabled" : "disabled"));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error toggling student sign-in:");
            e.printStackTrace();
            response.put("success", false);
            response.put("error", e.toString());
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
