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

    private static final List<String> DEFAULT_STOPS = Arrays.asList(
        "Tambaram",
        "Guindy",
        "Koyambedu",
        "Porur",
        "Poonamallee",
        "Velachery",
        "Chromepet",
        "Vadapalani",
        "Chengalpattu",
        "Avadi",
        "Sriperumbudur",
        "Ashok Nagar",
        "T. Nagar",
        "Adyar"
    );

    @GetMapping("/all")
    public ResponseEntity<?> getAllBusStops() {
        try {
            Set<String> stopSet = new LinkedHashSet<>();

            // 1. Add stops configured in DB buses
            List<BusEntity> dbBuses = busRepository.findAll();
            for (BusEntity bus : dbBuses) {
                if (bus.getBusStop() != null && !bus.getBusStop().trim().isEmpty()) {
                    stopSet.add(bus.getBusStop().trim());
                }
            }

            // 2. Add default college bus stops
            stopSet.addAll(DEFAULT_STOPS);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("busStops", new ArrayList<>(stopSet));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("busStops", DEFAULT_STOPS);
            return ResponseEntity.ok(response);
        }
    }
}
