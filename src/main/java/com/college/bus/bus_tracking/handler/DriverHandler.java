package com.college.bus.bus_tracking.handler;

import com.college.bus.bus_tracking.entity.BusEntity;
import com.college.bus.bus_tracking.model.BusData;
import com.college.bus.bus_tracking.repository.BusRepository;
import com.college.bus.bus_tracking.store.BusSessionStore;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class DriverHandler extends TextWebSocketHandler {

    private final BusRepository repository;
    private final UserHandler userHandler;
    private final ObjectMapper mapper = new ObjectMapper();

    public DriverHandler(BusRepository repository, UserHandler userHandler) {
        this.repository = repository;
        this.userHandler = userHandler;
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        System.out.println("[DriverHandler] Received: " + payload);

        try {
            JsonNode node = mapper.readTree(payload);
            if (!node.has("busNumber")) {
                System.err.println("[DriverHandler] Error: busNumber missing in payload");
                return;
            }
            String busNumber = node.get("busNumber").asText();

            if (node.has("action") && "START".equals(node.get("action").asText())) {
                System.out.println("[DriverHandler] Processing START action for bus: " + busNumber);
                BusEntity entity = repository.findById(busNumber).orElse(new BusEntity());
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

                repository.save(entity);

                BusData busData = new BusData(
                        busNumber,
                        entity.getBusName(),
                        entity.getBusStop(),
                        entity.getLatitude(),
                        entity.getLongitude(),
                        "RUNNING",
                        entity.getDriverName(),
                        entity.getDriverPhone());

                BusSessionStore.BUS_MAP.put(busNumber, busData);
                System.out.println("[DriverHandler] Bus added to memory: " + busNumber);
                userHandler.broadcastUpdate();
                return;
            }

            if (node.has("action") && "STOP".equals(node.get("action").asText())) {
                System.out.println("[DriverHandler] Processing STOP action for bus: " + busNumber);
                BusData bus = BusSessionStore.BUS_MAP.get(busNumber);
                if (bus != null) {
                    bus.setStatus("STOPPED");
                }
                repository.findById(busNumber).ifPresent(entity -> {
                    entity.setStatus("STOPPED");
                    repository.save(entity);
                });
                userHandler.broadcastUpdate();
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

                repository.findById(busNumber).ifPresent(e -> {
                    e.setLatitude(bus.getLatitude());
                    e.setLongitude(bus.getLongitude());
                    repository.save(e);
                });
                userHandler.broadcastUpdate();
            } else {
                System.err.println("[DriverHandler] Warning: Update received for unknown bus in memory: " + busNumber);
            }
        } catch (Exception e) {
            System.err.println("[DriverHandler] ERROR processing message: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
