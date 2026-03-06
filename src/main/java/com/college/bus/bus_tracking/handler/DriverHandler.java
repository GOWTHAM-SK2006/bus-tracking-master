package com.college.bus.bus_tracking.handler;

import com.college.bus.bus_tracking.entity.BusEntity;
import com.college.bus.bus_tracking.model.BusData;
import com.college.bus.bus_tracking.repository.BusRepository;
import com.college.bus.bus_tracking.store.BusSessionStore;
import com.college.bus.bus_tracking.websocket.AdminWebSocketHandler;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class DriverHandler extends TextWebSocketHandler {

    private final BusRepository repository;
    private final UserHandler userHandler;
    private final ObjectMapper mapper = new ObjectMapper();
    private static final long GRACE_PERIOD_MS = 30_000; // 30 seconds before marking inactive
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    // Store all active driver sessions
    public static final List<WebSocketSession> DRIVER_SESSIONS = new CopyOnWriteArrayList<>();

    public DriverHandler(BusRepository repository, UserHandler userHandler) {
        this.repository = repository;
        this.userHandler = userHandler;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        DRIVER_SESSIONS.add(session);
        System.out.println("[DriverHandler] New driver connected. Total drivers: " + DRIVER_SESSIONS.size());
    }

    public static void broadcastToDrivers(Object message) {
        ObjectMapper mapper = new ObjectMapper();
        try {
            String payload = mapper.writeValueAsString(message);
            TextMessage textMessage = new TextMessage(payload);
            for (WebSocketSession session : DRIVER_SESSIONS) {
                if (session.isOpen()) {
                    synchronized (session) {
                        try {
                            session.sendMessage(textMessage);
                        } catch (Exception e) {
                            System.err.println("[DriverHandler] Error sending to driver session: " + e.getMessage());
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("[DriverHandler] Error serializing message for drivers: " + e.getMessage());
        }
    }

    /**
     * Broadcast current bus list to all connected admin panels.
     */
    private void broadcastToAdmins() {
        try {
            List<BusData> currentBuses = new ArrayList<>(BusSessionStore.BUS_MAP.values());
            Map<String, Object> update = new HashMap<>();
            update.put("type", "BUS_UPDATE");
            update.put("buses", currentBuses);
            update.put("source", "DriverHandler");
            update.put("timestamp", System.currentTimeMillis());
            AdminWebSocketHandler.broadcastToAdmins(update);
        } catch (Exception e) {
            System.err.println("[DriverHandler] Failed to broadcast to admins: " + e.getMessage());
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        System.out.println("[DriverHandler] Received: " + payload);

        try {
            JsonNode node = mapper.readTree(payload);

            // Handle PING heartbeat — respond with PONG and update lastHeartbeatTime
            if (node.has("type") && "PING".equals(node.get("type").asText())) {
                String pingBusNumber = node.has("busNumber") ? node.get("busNumber").asText() : null;
                if (pingBusNumber != null) {
                    BusData bus = BusSessionStore.BUS_MAP.get(pingBusNumber);
                    if (bus != null) {
                        bus.setLastHeartbeatTime(System.currentTimeMillis());
                    }
                }
                // Respond with PONG
                Map<String, Object> pong = new HashMap<>();
                pong.put("type", "PONG");
                pong.put("timestamp", System.currentTimeMillis());
                synchronized (session) {
                    if (session.isOpen()) {
                        session.sendMessage(new TextMessage(mapper.writeValueAsString(pong)));
                    }
                }
                return;
            }

            // Check for driverId, if not present try to extract from session or handle
            // error
            Long driverId = null;
            if (node.has("driverId")) {
                driverId = node.get("driverId").asLong();
            }

            String busNumber = null;
            if (node.has("busNumber")) {
                busNumber = node.get("busNumber").asText();
            }

            if (node.has("action") && "START".equals(node.get("action").asText())) {
                if (driverId == null) {
                    System.err.println("[DriverHandler] Error: driverId missing in START payload");
                    return;
                }

                System.out.println("[DriverHandler] Processing START action for driver: " + driverId);

                // Find existing bus for this driver or create new
                BusEntity entity = repository.findByDriverId(driverId).orElse(new BusEntity());

                // If bus number changed, we might want to clean up old session store entry
                String oldBusNumber = entity.getBusNumber();
                if (oldBusNumber != null && !oldBusNumber.equals(busNumber)) {
                    BusSessionStore.BUS_MAP.remove(oldBusNumber);
                }

                entity.setDriverId(driverId);
                if (busNumber != null)
                    entity.setBusNumber(busNumber);
                if (node.has("busStop"))
                    entity.setBusStop(node.get("busStop").asText());
                entity.setStatus("RUNNING");

                // Extract driver info if provided
                if (node.has("driverName"))
                    entity.setDriverName(node.get("driverName").asText());
                if (node.has("driverPhone"))
                    entity.setDriverPhone(node.get("driverPhone").asText());
                // Extract bus name if provided
                if (node.has("busName"))
                    entity.setBusName(node.get("busName").asText());

                entity = repository.save(entity);

                BusData busData = new BusData(
                        entity.getId(),
                        entity.getBusNumber(),
                        entity.getDriverId(),
                        entity.getBusName(),
                        entity.getBusStop(),
                        entity.getLatitude(),
                        entity.getLongitude(),
                        "RUNNING",
                        entity.getDriverName(),
                        entity.getDriverPhone());

                if (entity.getBusNumber() != null) {
                    BusSessionStore.BUS_MAP.put(entity.getBusNumber(), busData);
                    busData.setLastHeartbeatTime(System.currentTimeMillis());
                    System.out.println("[DriverHandler] Bus added to memory: " + entity.getBusNumber() + " (ID: "
                            + entity.getId() + ")");
                }

                userHandler.broadcastUpdate();
                return;
            }

            // For other actions, we need busNumber to identify the bus in session store
            if (busNumber == null) {
                System.err.println("[DriverHandler] Error: busNumber missing in payload");
                return;
            }

            if (node.has("action") && "STOP".equals(node.get("action").asText())) {
                System.out.println("[DriverHandler] Processing STOP action for bus: " + busNumber);
                BusData bus = BusSessionStore.BUS_MAP.get(busNumber);
                if (bus != null) {
                    bus.setStatus("STOPPED");
                }
                repository.findByBusNumber(busNumber).ifPresent(entity -> {
                    entity.setStatus("STOPPED");
                    repository.save(entity);
                });
                userHandler.broadcastUpdate();
                return;
            }

            if (node.has("action") && "GPS_ERROR".equals(node.get("action").asText())) {
                System.out.println("[DriverHandler] Processing GPS_ERROR action for bus: " + busNumber);
                BusData bus = BusSessionStore.BUS_MAP.get(busNumber);
                if (bus != null) {
                    bus.setStatus("STOPPED");
                }
                repository.findByBusNumber(busNumber).ifPresent(entity -> {
                    entity.setStatus("STOPPED");
                    repository.save(entity);
                });
                userHandler.broadcastUpdate();
                broadcastToAdmins();
                return;
            }

            // Store busNumber in session for disconnection handling
            if (busNumber != null) {
                session.getAttributes().put("BUS_NUMBER", busNumber);
            }

            if (node.has("action") && "GPS_ACTIVE".equals(node.get("action").asText())) {
                System.out.println("[DriverHandler] Processing GPS_ACTIVE action for bus: " + busNumber);
                BusData bus = BusSessionStore.BUS_MAP.get(busNumber);
                if (bus != null) {
                    bus.setStatus("RUNNING");
                }
                repository.findByBusNumber(busNumber).ifPresent(entity -> {
                    entity.setStatus("RUNNING");
                    repository.save(entity);
                });
                userHandler.broadcastUpdate();
                broadcastToAdmins();
                return;
            }

            // Regular update
            BusData bus = BusSessionStore.BUS_MAP.get(busNumber);
            if (bus != null) {
                double lat = node.get("latitude").asDouble();
                double lng = node.get("longitude").asDouble();
                System.out.println("[DriverHandler] Update for " + busNumber + ": " + lat + ", " + lng);
                bus.setLatitude(lat);
                bus.setLongitude(lng);
                // Receiving GPS coordinates means the driver is actively tracking
                bus.setStatus("RUNNING");
                bus.setLastHeartbeatTime(System.currentTimeMillis());

                // Update in memory first for speed
                // Async update DB
                repository.findByBusNumber(busNumber).ifPresent(e -> {
                    e.setLatitude(bus.getLatitude());
                    e.setLongitude(bus.getLongitude());
                    e.setStatus("RUNNING");
                    repository.save(e);
                });
                userHandler.broadcastUpdate();
                broadcastToAdmins();
            } else {
                System.err.println("[DriverHandler] Warning: Update received for unknown bus in memory: " + busNumber);
            }
        } catch (Exception e) {
            System.err.println("[DriverHandler] ERROR processing message: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, org.springframework.web.socket.CloseStatus status)
            throws Exception {
        DRIVER_SESSIONS.remove(session);
        String busNumber = (String) session.getAttributes().get("BUS_NUMBER");
        if (busNumber != null) {
            System.out.println("[DriverHandler] Connection closed for bus: " + busNumber
                    + " — waiting " + (GRACE_PERIOD_MS / 1000) + "s grace period before marking STOPPED");

            // Schedule a delayed check instead of immediately marking STOPPED.
            // If the driver reconnects within the grace period and sends a heartbeat,
            // the lastHeartbeatTime will be fresh and we skip marking STOPPED.
            final long disconnectTime = System.currentTimeMillis();
            scheduler.schedule(() -> {
                try {
                    BusData bus = BusSessionStore.BUS_MAP.get(busNumber);
                    if (bus != null && bus.getLastHeartbeatTime() <= disconnectTime) {
                        // No heartbeat received since disconnect → mark STOPPED
                        bus.setStatus("STOPPED");
                        System.out.println("[DriverHandler] Grace period expired — marked STOPPED: " + busNumber);

                        repository.findByBusNumber(busNumber).ifPresent(entity -> {
                            entity.setStatus("STOPPED");
                            repository.save(entity);
                        });

                        userHandler.broadcastUpdate();
                        broadcastToAdmins();
                    } else {
                        System.out.println("[DriverHandler] Grace period: driver reconnected for bus " + busNumber
                                + " — keeping RUNNING");
                    }
                } catch (Exception e) {
                    System.err.println("[DriverHandler] Grace period check error: " + e.getMessage());
                }
            }, GRACE_PERIOD_MS, TimeUnit.MILLISECONDS);
        }
    }
}
