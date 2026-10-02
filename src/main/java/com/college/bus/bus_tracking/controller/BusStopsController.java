package com.college.bus.bus_tracking.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.college.bus.bus_tracking.entity.BusEntity;
import com.college.bus.bus_tracking.repository.BusRepository;

import java.util.*;

@RestController
@RequestMapping("/api/bus-stops")
@CrossOrigin(origins = "*")
public class BusStopsController {

    @Autowired
    private BusRepository busRepository;

    @GetMapping("/all")
    public ResponseEntity<?> getAllBusStops() {
        try {
            Set<String> stopSet = new LinkedHashSet<>();

            // Extract distinct stops configured across DB buses
            List<BusEntity> dbBuses = busRepository.findAll();
            for (BusEntity bus : dbBuses) {
                if (bus.getBusStop() != null && !bus.getBusStop().trim().isEmpty()) {
                    stopSet.add(bus.getBusStop().trim());
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("busStops", new ArrayList<>(stopSet));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("busStops", Collections.emptyList());
            return ResponseEntity.ok(response);
        }
    }
}
