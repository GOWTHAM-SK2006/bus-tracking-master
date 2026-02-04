package com.college.bus.bus_tracking.controller;

import com.college.bus.bus_tracking.service.BusStopService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bus-stops")
@CrossOrigin(origins = "*")
public class BusStopController {

    @Autowired
    private BusStopService busStopService;

    @GetMapping("/search")
    public ResponseEntity<?> searchBusStops(@RequestParam String query) {
        try {
            List<String> busStops = busStopService.searchBusStops(query);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("busStops", busStops);
            response.put("count", busStops.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to search bus stops: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllBusStops() {
        try {
            List<String> busStops = busStopService.getAllBusStops();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("busStops", busStops);
            response.put("count", busStops.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to get bus stops: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
