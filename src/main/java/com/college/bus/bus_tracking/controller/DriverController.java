package com.college.bus.bus_tracking.controller;

import com.college.bus.bus_tracking.entity.Driver;
import com.college.bus.bus_tracking.service.DriverService;
import com.college.bus.bus_tracking.service.SystemSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/driver")
@CrossOrigin(origins = "*")
public class DriverController {

    @Autowired
    private DriverService driverService;

    @Autowired
    private SystemSettingsService systemSettingsService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Driver driver) {
        Map<String, Object> response = new HashMap<>();

        // Check if account creation is enabled
        if (!systemSettingsService.isAccountCreationEnabled()) {
            response.put("success", false);
            response.put("message", "Unable to create account. Contact admin for further details.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        try {
            Driver savedDriver = driverService.registerDriver(driver);
            response.put("success", true);
            response.put("message", "Driver registered successfully");
            response.put("driver", savedDriver);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        try {
            String username = credentials.get("username");
            String password = credentials.get("password");

            Driver driver = driverService.loginDriver(username, password);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Login successful");
            response.put("driver", driver);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            String newPassword = request.get("newPassword");

            if (username == null || newPassword == null) {
                throw new RuntimeException("Username and new password are required");
            }

            driverService.updatePassword(username, newPassword);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Password updated successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PutMapping("/{id}/bus-details")
    public ResponseEntity<?> updateBusDetails(@PathVariable Long id, @RequestBody Map<String, String> busDetails) {
        try {
            String busNumber = busDetails.get("busNumber");
            String busName = busDetails.get("busName");

            Driver updatedDriver = driverService.updateBusDetails(id, busNumber, busName);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Bus details updated successfully");
            response.put("driver", updatedDriver);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<?> updateProfile(@PathVariable Long id, @RequestBody Map<String, String> profileData) {
        try {
            String name = profileData.get("name");
            String phone = profileData.get("phone");
            String busNumber = profileData.get("busNumber");
            String busName = profileData.get("busName");

            Driver updatedDriver = driverService.updateDriverProfile(id, name, phone, busNumber, busName);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Profile updated successfully");
            response.put("driver", updatedDriver);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDriver(@PathVariable Long id) {
        try {
            Driver driver = driverService.getDriverById(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("driver", driver);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDriver(@PathVariable Long id) {
        try {
            driverService.deleteDriver(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Account deleted successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
}
