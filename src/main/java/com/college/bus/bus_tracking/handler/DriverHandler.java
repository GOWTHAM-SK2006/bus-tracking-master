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

        JsonNode node = mapper.readTree(message.getPayload());
        String busNumber = node.get("busNumber").asText();

        if (node.has("action") && "START".equals(node.get("action").asText())) {
            BusEntity entity = repository.findById(busNumber).orElse(new BusEntity());
            entity.setBusNumber(busNumber);
            entity.setBusStop(node.get("busStop").asText());
            entity.setStatus("RUNNING");

            // Extract driver info if provided
            if (node.has("driverName"))
                entity.setDriverName(node.get("driverName").asText());
            if (node.has("driverPhone"))
                entity.setDriverPhone(node.get("driverPhone").asText());
            // Extract bus name if provided (New)
            if (node.has("busName"))
                entity.setBusName(node.get("busName").asText());

            repository.save(entity);

            BusData busData = new BusData(
                    busNumber,
                    entity.getBusName(), // New field
                    entity.getBusStop(),
                    entity.getLatitude(),
                    entity.getLongitude(),
                    "RUNNING",
                    entity.getDriverName(),
                    entity.getDriverPhone());

            BusSessionStore.BUS_MAP.put(busNumber, busData);
            userHandler.broadcastUpdate();
            return;
        }

        if (node.has("action") && "STOP".equals(node.get("action").asText())) {
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

        BusData bus = BusSessionStore.BUS_MAP.get(busNumber);
        if (bus != null) {
            bus.setLatitude(node.get("latitude").asDouble());
            bus.setLongitude(node.get("longitude").asDouble());

            repository.findById(busNumber).ifPresent(e -> {
                e.setLatitude(bus.getLatitude());
                e.setLongitude(bus.getLongitude());
                repository.save(e);
            });
            userHandler.broadcastUpdate();
        }
    }
}
