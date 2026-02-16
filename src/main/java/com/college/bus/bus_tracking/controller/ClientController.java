package com.college.bus.bus_tracking.controller;

import com.college.bus.bus_tracking.entity.Client;
import com.college.bus.bus_tracking.service.ClientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/client")
@CrossOrigin(origins = "*")
public class ClientController {

    @Autowired
    private ClientService clientService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Client client) {
        Map<String, Object> response = new HashMap<>();

        try {
            Client savedClient = clientService.registerClient(client);
            response.put("success", true);
            response.put("message", "Client registered successfully");
            response.put("client", savedClient);
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
            String identifier = credentials.get("username");
            if (identifier == null) {
                identifier = credentials.get("email");
            }
            String password = credentials.get("password");

            Client client = clientService.loginClient(identifier, password);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Login successful");
            response.put("client", client);
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
            String email = request.get("email");
            String newPassword = request.get("newPassword");

            if (email == null || newPassword == null) {
                throw new RuntimeException("Email and new password are required");
            }

            clientService.updatePassword(email, newPassword);

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

    @GetMapping("/{id}")
    public ResponseEntity<?> getClient(@PathVariable Long id) {
        try {
            Client client = clientService.getClientById(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("client", client);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, Object> profileData) {
        try {
            Long clientId = Long.valueOf(profileData.get("clientId").toString());
            String phoneNumber = (String) profileData.get("phoneNumber");
            String profilePicture = (String) profileData.get("profilePicture");
            Boolean phoneVerified = profileData.get("phoneVerified") != null
                    ? (Boolean) profileData.get("phoneVerified")
                    : null;

            Client updatedClient = clientService.updateProfile(clientId, phoneNumber, profilePicture, phoneVerified);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Profile updated successfully");
            response.put("client", updatedClient);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PostMapping("/bus-stop/save")
    public ResponseEntity<?> saveBusStop(@RequestBody Map<String, Object> request) {
        try {
            Long clientId = Long.valueOf(request.get("clientId").toString());
            String busStop = (String) request.get("busStop");

            Client updatedClient = clientService.saveBusStop(clientId, busStop);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Bus stop saved successfully");
            response.put("client", updatedClient);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteClient(@PathVariable Long id) {
        try {
            clientService.deleteClient(id);
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
