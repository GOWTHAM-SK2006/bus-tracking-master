package com.college.bus.bus_tracking.controller;

import com.college.bus.bus_tracking.entity.Client;
import com.college.bus.bus_tracking.repository.ClientRepository;
import com.college.bus.bus_tracking.service.ClientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*")
public class StudentController {

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private ClientService clientService;

    private Map<String, Object> mapClientToDto(Client client) {
        Map<String, Object> studentData = new HashMap<>();
        studentData.put("id", client.getId());
        studentData.put("name", client.getName());
        studentData.put("username", client.getUsername());
        studentData.put("email", client.getEmail());
        studentData.put("phoneNumber", client.getPhoneNumber());
        studentData.put("phoneVerified", Boolean.TRUE.equals(client.getPhoneVerified()));
        studentData.put("savedBusStop", client.getSavedBusStop());
        studentData.put("assignedBus", client.getAssignedBus());
        studentData.put("assignedRoute", client.getAssignedRoute());
        studentData.put("accountStatus", client.getAccountStatus() != null ? client.getAccountStatus() : (Boolean.TRUE.equals(client.getPhoneVerified()) ? "VERIFIED" : "UNVERIFIED"));
        return studentData;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllStudents() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Client> clients = clientRepository.findAll();
            List<Map<String, Object>> studentList = new ArrayList<>();
            for (Client client : clients) {
                studentList.add(mapClientToDto(client));
            }
            response.put("success", true);
            response.put("students", studentList);
            response.put("total", studentList.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getStudentById(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Client client = clientService.getClientById(id);
            response.put("success", true);
            response.put("student", mapClientToDto(client));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(404).body(response);
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createStudent(@RequestBody Map<String, Object> payload) {
        Map<String, Object> response = new HashMap<>();
        try {
            Client created = clientService.createStudent(payload);
            response.put("success", true);
            response.put("message", "Student created successfully");
            response.put("student", mapClientToDto(created));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateStudent(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Map<String, Object> response = new HashMap<>();
        try {
            Client updated = clientService.updateStudent(id, payload);
            response.put("success", true);
            response.put("message", "Student updated successfully");
            response.put("student", mapClientToDto(updated));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteStudent(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            clientService.deleteClient(id);
            response.put("success", true);
            response.put("message", "Student deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
