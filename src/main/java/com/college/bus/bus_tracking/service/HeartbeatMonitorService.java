package com.college.bus.bus_tracking.service;

import com.college.bus.bus_tracking.model.BusData;
import com.college.bus.bus_tracking.repository.BusRepository;
import com.college.bus.bus_tracking.store.BusSessionStore;
import com.college.bus.bus_tracking.handler.UserHandler;
import com.college.bus.bus_tracking.websocket.AdminWebSocketHandler;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Periodically checks for buses whose lastHeartbeatTime is stale (>30 seconds).
 * If a bus is still marked RUNNING but hasn't sent a heartbeat, this service
 * marks it as STOPPED. This is the authoritative background checker that
 * catches genuinely-offline buses.
 */
@Service
public class HeartbeatMonitorService {

    private static final long STALE_THRESHOLD_MS = 30_000; // 30 seconds

    private final BusRepository busRepository;
    private final UserHandler userHandler;

    public HeartbeatMonitorService(BusRepository busRepository, UserHandler userHandler) {
        this.busRepository = busRepository;
        this.userHandler = userHandler;
    }

    @Scheduled(fixedRate = 15000) // Run every 15 seconds
    public void checkStaleHeartbeats() {
        long now = System.currentTimeMillis();
        boolean changed = false;

        for (Map.Entry<String, BusData> entry : BusSessionStore.BUS_MAP.entrySet()) {
            String busNumber = entry.getKey();
            BusData bus = entry.getValue();

            // Only check buses that are currently RUNNING
            if ("RUNNING".equals(bus.getStatus())) {
                long elapsed = now - bus.getLastHeartbeatTime();
                if (elapsed > STALE_THRESHOLD_MS) {
                    bus.setStatus("STOPPED");
                    System.out.println("[HeartbeatMonitor] Bus " + busNumber
                            + " heartbeat stale (" + (elapsed / 1000) + "s) — marked STOPPED");

                    // Update DB
                    busRepository.findByBusNumber(busNumber).ifPresent(entity -> {
                        entity.setStatus("STOPPED");
                        busRepository.save(entity);
                    });

                    changed = true;
                }
            }
        }

        if (changed) {
            // Broadcast the status changes to all connected clients
            userHandler.broadcastUpdate();

            try {
                List<BusData> currentBuses = new ArrayList<>(BusSessionStore.BUS_MAP.values());
                Map<String, Object> update = new HashMap<>();
                update.put("type", "BUS_UPDATE");
                update.put("buses", currentBuses);
                update.put("source", "HeartbeatMonitor");
                update.put("timestamp", System.currentTimeMillis());
                AdminWebSocketHandler.broadcastToAdmins(update);
            } catch (Exception e) {
                System.err.println("[HeartbeatMonitor] Failed to broadcast to admins: " + e.getMessage());
            }
        }
    }
}
