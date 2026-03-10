package com.college.bus.bus_tracking.controller;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.college.bus.bus_tracking.entity.GuestAccessCode;
import com.college.bus.bus_tracking.service.GuestAccessCodeService;

@RestController
@RequestMapping("/api/guest")
@CrossOrigin(origins = "*")
public class GuestAccessController {

    @Autowired
    private GuestAccessCodeService guestAccessCodeService;

    /**
     * Validate a guest access code.
     * Called when a guest user enters the access code on the login page.
     */
    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateGuestCode(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            String code = request.get("code");

            if (code == null || code.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Access code is required");
                return ResponseEntity.badRequest().body(response);
            }

            boolean valid = guestAccessCodeService.validateCode(code.trim());

            if (valid) {
                response.put("success", true);
                response.put("message", "Access granted");
                response.put("role", "guest");
            } else {
                response.put("success", false);
                response.put("message", "Invalid or expired access code");
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Server error: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Get current guest access code info (admin only).
     */
    @GetMapping("/code")
    public ResponseEntity<Map<String, Object>> getGuestCode() {
        Map<String, Object> response = new HashMap<>();
        try {
            GuestAccessCode current = guestAccessCodeService.getCurrentCode();

            response.put("success", true);
            response.put("code", current.getCode());
            response.put("createdAt", current.getCreatedAt().toString());
            response.put("expiresAt", current.getExpiresAt().toString());

            // Calculate remaining time
            Duration remaining = Duration.between(LocalDateTime.now(), current.getExpiresAt());
            long hours = remaining.toHours();
            long minutes = remaining.toMinutesPart();
            response.put("remainingHours", hours);
            response.put("remainingMinutes", minutes);
            response.put("expiresIn", hours + "h " + minutes + "m");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Server error: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Regenerate the guest access code (admin action).
     */
    @PostMapping("/regenerate")
    public ResponseEntity<Map<String, Object>> regenerateCode() {
        Map<String, Object> response = new HashMap<>();
        try {
            GuestAccessCode newCode = guestAccessCodeService.regenerateCode();

            response.put("success", true);
            response.put("code", newCode.getCode());
            response.put("createdAt", newCode.getCreatedAt().toString());
            response.put("expiresAt", newCode.getExpiresAt().toString());
            response.put("message", "Guest access code regenerated successfully");

            Duration remaining = Duration.between(LocalDateTime.now(), newCode.getExpiresAt());
            long hours = remaining.toHours();
            long minutes = remaining.toMinutesPart();
            response.put("expiresIn", hours + "h " + minutes + "m");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Server error: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
