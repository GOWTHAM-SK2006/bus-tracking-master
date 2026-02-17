package com.college.bus.bus_tracking.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.college.bus.bus_tracking.entity.BusEntity;
import com.college.bus.bus_tracking.model.BusData;
import com.college.bus.bus_tracking.repository.BusRepository;
import com.college.bus.bus_tracking.store.BusSessionStore;

import jakarta.annotation.PostConstruct;

/**
 * Service responsible for restoring active buses from database to memory after server restart.
 * This ensures that buses with status "RUNNING" are automatically restored without driver intervention.
 */
@Service
public class BusRestorationService {

    @Autowired
    private BusRepository busRepository;

    /**
     * Restores all active buses from database to memory on application startup.
     * This method is automatically called after dependency injection is complete.
     */
    @PostConstruct
    public void restoreActiveBuses() {
        try {
            System.out.println("[BusRestorationService] Starting bus restoration process...");
            
            // Clear any existing entries to avoid duplicates
            BusSessionStore.BUS_MAP.clear();
            
            // Query database for all buses with status = "RUNNING"
            List<BusEntity> runningBuses = busRepository.findByStatus("RUNNING");
            
            System.out.println("[BusRestorationService] Found " + runningBuses.size() + " running buses in database");
            
            int restoredCount = 0;
            
            // Restore each running bus to BUS_MAP
            for (BusEntity entity : runningBuses) {
                try {
                    // Skip if bus number is null or empty
                    if (entity.getBusNumber() == null || entity.getBusNumber().trim().isEmpty()) {
                        System.out.println("[BusRestorationService] Skipping bus with null/empty bus number: ID=" + entity.getId());
                        continue;
                    }
                    
                    // Create BusData object from entity
                    BusData busData = new BusData(
                        entity.getId(),
                        entity.getBusNumber(),
                        entity.getDriverId(),
                        entity.getBusName(),
                        entity.getBusStop(),
                        entity.getLatitude(),
                        entity.getLongitude(),
                        entity.getStatus(),
                        entity.getDriverName(),
                        entity.getDriverPhone()
                    );
                    
                    // Add to memory store (BUS_MAP)
                    BusSessionStore.BUS_MAP.put(entity.getBusNumber(), busData);
                    restoredCount++;
                    
                    System.out.println("[BusRestorationService] Restored bus: " + entity.getBusNumber() + 
                                     " (Driver: " + entity.getDriverName() + ")");
                    
                } catch (Exception e) {
                    System.err.println("[BusRestorationService] Error restoring bus ID=" + entity.getId() + 
                                     ", busNumber=" + entity.getBusNumber() + ": " + e.getMessage());
                    // Continue with next bus even if this one fails
                }
            }
            
            System.out.println("[BusRestorationService] Bus restoration completed successfully!");
            System.out.println("[BusRestorationService] Total buses restored: " + restoredCount);
            System.out.println("[BusRestorationService] Current BUS_MAP size: " + BusSessionStore.BUS_MAP.size());
            
        } catch (Exception e) {
            System.err.println("[BusRestorationService] Critical error during bus restoration: " + e.getMessage());
            e.printStackTrace();
        }
    }
}