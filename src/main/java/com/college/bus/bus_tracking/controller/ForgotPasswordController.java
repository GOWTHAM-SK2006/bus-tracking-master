package com.college.bus.bus_tracking.controller;

import com.college.bus.bus_tracking.entity.Client;
import com.college.bus.bus_tracking.entity.Driver;
import com.college.bus.bus_tracking.repository.ClientRepository;
import com.college.bus.bus_tracking.repository.DriverRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class ForgotPasswordController {

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    private final SecureRandom secureRandom = new SecureRandom();

    @GetMapping("/test")
    public ResponseEntity<?> test() {
        System.out.println("[ForgotPassword] Test endpoint hit!");
        return ResponseEntity.ok("Backend is reachable!");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        System.out.println("[ForgotPassword] --- NEW REQUEST ---");
        System.out.println("[ForgotPassword] Received request: " + request);

        // Handle both 'identifier' (from auth.html) and 'email' (from
        // forgot-password.html)
        String identifier = request.get("identifier");
        if (identifier == null) {
            identifier = request.get("email");
        }

        System.out.println("[ForgotPassword] Processing identifier: " + identifier);

        // Debug: Log DB status
        System.out.println("[ForgotPassword] DB Status - Total Clients: " + clientRepository.count());
        System.out.println("[ForgotPassword] DB Status - Total Drivers: " + driverRepository.count());

        Map<String, Object> response = new HashMap<>();

        // Security best practice: Always return same message
        response.put("success", true);
        response.put("message", "If an account exists with this email/username, a reset link has been sent.");

        String token = generateToken();
        long expiry = System.currentTimeMillis() + 3600000; // 1 hour

        // Check Client table (Student) - Search by Email or Username
        Optional<Client> clientOpt = clientRepository.findByEmail(identifier);
        if (clientOpt.isEmpty()) {
            clientOpt = clientRepository.findByUsername(identifier);
        }

        if (clientOpt.isPresent()) {
            System.out.println("[ForgotPassword] Found Client: " + identifier);
            Client client = clientOpt.get();
            client.setResetToken(token);
            client.setResetTokenExpiry(expiry);
            clientRepository.save(client);
            response.put("resetLink", "reset-password.html?token=" + token);
            response.put("userEmail", client.getEmail());
            return ResponseEntity.ok(response);
        }

        // Check Driver table - Search by Email or Username
        Optional<Driver> driverOpt = driverRepository.findByEmail(identifier);
        if (driverOpt.isEmpty()) {
            driverOpt = driverRepository.findByUsername(identifier);
        }

        if (driverOpt.isPresent()) {
            System.out.println("[ForgotPassword] Found Driver: " + identifier);
            Driver driver = driverOpt.get();
            driver.setResetToken(token);
            driver.setResetTokenExpiry(expiry);
            driverRepository.save(driver);
            response.put("resetLink", "reset-password.html?token=" + token);
            response.put("userEmail", driver.getEmail());
            return ResponseEntity.ok(response);
        }

        System.out.println("[ForgotPassword] No user found for: " + identifier);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");
        Map<String, Object> response = new HashMap<>();

        if (token == null || newPassword == null) {
            response.put("success", false);
            response.put("message", "Token and new password are required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        // Check Client table
        Optional<Client> clientOpt = clientRepository.findByResetToken(token);
        if (clientOpt.isPresent()) {
            Client client = clientOpt.get();
            if (isTokenExpired(client.getResetTokenExpiry())) {
                response.put("success", false);
                response.put("message", "Token has expired");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            client.setPassword(passwordEncoder.encode(newPassword));
            client.setResetToken(null);
            client.setResetTokenExpiry(null);
            clientRepository.save(client);

            response.put("success", true);
            response.put("message", "Password reset successful");
            return ResponseEntity.ok(response);
        }

        // Check Driver table
        Optional<Driver> driverOpt = driverRepository.findByResetToken(token);
        if (driverOpt.isPresent()) {
            Driver driver = driverOpt.get();
            if (isTokenExpired(driver.getResetTokenExpiry())) {
                response.put("success", false);
                response.put("message", "Token has expired");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            driver.setPassword(passwordEncoder.encode(newPassword));
            driver.setResetToken(null);
            driver.setResetTokenExpiry(null);
            driverRepository.save(driver);

            response.put("success", true);
            response.put("message", "Password reset successful");
            return ResponseEntity.ok(response);
        }

        response.put("success", false);
        response.put("message", "Invalid token");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private boolean isTokenExpired(Long expiry) {
        return expiry == null || System.currentTimeMillis() > expiry;
    }
}
