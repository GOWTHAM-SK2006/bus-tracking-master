package com.college.bus.bus_tracking.handler;

import com.college.bus.bus_tracking.model.BusData;
import com.college.bus.bus_tracking.store.BusSessionStore;
import com.college.bus.bus_tracking.websocket.AdminWebSocketHandler;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class UserHandler extends TextWebSocketHandler {

    private final ObjectMapper mapper = new ObjectMapper();
    private static final List<WebSocketSession> SESSIONS = new ArrayList<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        SESSIONS.add(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        SESSIONS.remove(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        JsonNode node = mapper.readTree(message.getPayload());
        String type = node.path("type").asText("");
        String value = node.path("value").asText("");

        List<BusData> result = new ArrayList<>();

        if ("ALL".equals(type)) {
            // Filter out buses with invalid (0,0) coordinates
            for (BusData bus : BusSessionStore.BUS_MAP.values()) {
                if (bus.getLatitude() != 0.0 || bus.getLongitude() != 0.0) {
                    result.add(bus);
                }
            }
        } else {
            for (BusData bus : BusSessionStore.BUS_MAP.values()) {
                // Skip buses with invalid coordinates
                if (bus.getLatitude() == 0.0 && bus.getLongitude() == 0.0)
                    continue;

                if ("BUS_NUMBER".equals(type) && bus.getBusNumber().equals(value)) {
                    result.add(bus);
                }
                if ("BUS_STOP".equals(type) && bus.getBusStop().equals(value)) {
                    result.add(bus);
                }
            }
        }

        session.sendMessage(new TextMessage(mapper.writeValueAsString(result)));
    }

    public void broadcastUpdate() {
        try {
            // Filter out buses with invalid (0,0) coordinates before broadcasting
            List<BusData> validBuses = new ArrayList<>();
            for (BusData bus : BusSessionStore.BUS_MAP.values()) {
                if (bus.getLatitude() != 0.0 || bus.getLongitude() != 0.0) {
                    validBuses.add(bus);
                } else {
                    System.out
                            .println("[UserHandler] Skipping bus " + bus.getBusNumber() + " due to (0,0) coordinates");
                }
            }

            if (validBuses.isEmpty()) {
                // System.out.println("[UserHandler] No valid buses to broadcast");
                return;
            }

            String payload = mapper.writeValueAsString(validBuses);
            TextMessage message = new TextMessage(payload);
            int clientCount = 0;
            for (WebSocketSession session : SESSIONS) {
                if (session.isOpen()) {
                    session.sendMessage(message);
                    clientCount++;
                }
            }
            if (clientCount > 0) {
                System.out.println(
                        "[UserHandler] Broadcasted " + validBuses.size() + " buses to " + clientCount + " clients");
            }

            // Also broadcast a structured update to all connected admins
            if (!validBuses.isEmpty()) {
                Map<String, Object> adminUpdate = new HashMap<>();
                adminUpdate.put("type", "BUS_UPDATE");
                adminUpdate.put("buses", validBuses);
                adminUpdate.put("source", "DriverWebSocket");
                adminUpdate.put("timestamp", System.currentTimeMillis());

                AdminWebSocketHandler.broadcastToAdmins(adminUpdate);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
