package com.college.bus.bus_tracking.websocket;

import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.college.bus.bus_tracking.store.BusSessionStore;
import com.college.bus.bus_tracking.model.BusData;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class AdminWebSocketHandler extends TextWebSocketHandler {

    private static final List<WebSocketSession> adminSessions = new CopyOnWriteArrayList<>();
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        adminSessions.add(session);
        System.out.println("[Admin WS] Connected: " + session.getId());

        // Send welcome message
        Map<String, Object> welcome = new HashMap<>();
        welcome.put("type", "CONNECTION_SUCCESS");
        welcome.put("message", "Connected to Admin WebSocket");
        welcome.put("timestamp", System.currentTimeMillis());
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(welcome)));

        // Send all currently registered buses immediately (including 0,0 so admin sees status)
        List<BusData> currentBuses = new ArrayList<>(BusSessionStore.BUS_MAP.values());
        if (!currentBuses.isEmpty()) {
            Map<String, Object> busUpdate = new HashMap<>();
            busUpdate.put("type", "BUS_UPDATE");
            busUpdate.put("buses", currentBuses);
            busUpdate.put("source", "InitialLoad");
            busUpdate.put("timestamp", System.currentTimeMillis());
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(busUpdate)));
            System.out.println("[Admin WS] Sent " + currentBuses.size() + " initial buses to admin: " + session.getId());
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        System.out.println("[Admin WS] Received: " + payload);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> data = objectMapper.readValue(payload, Map.class);
            String type = (String) data.get("type");

            if ("APPROVE_REQUEST".equals(type)) {
                Integer requestId = ((Number) data.get("requestId")).intValue();
                Map<String, Object> response = new HashMap<>();
                response.put("type", "REQUEST_APPROVED");
                response.put("requestId", requestId);
                response.put("timestamp", System.currentTimeMillis());
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(response)));
            }
        } catch (Exception e) {
            System.err.println("[Admin WS] Error: " + e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, org.springframework.web.socket.CloseStatus status)
            throws Exception {
        adminSessions.remove(session);
        System.out.println("[Admin WS] Disconnected: " + session.getId());
    }

    public static void broadcastToAdmins(Map<String, Object> data) throws Exception {
        String message = objectMapper.writeValueAsString(data);
        for (WebSocketSession session : adminSessions) {
            if (session.isOpen()) {
                try {
                    synchronized (session) {
                        session.sendMessage(new TextMessage(message));
                    }
                } catch (Exception e) {
                    System.err.println("[Admin WS] Error sending message: " + e.getMessage());
                }
            }
        }
    }

    /**
     * Broadcast to all connected admin WS sessions (which includes observers)
     */
    public static void broadcastSystemUpdate(Map<String, Object> data) {
        try {
            String message = objectMapper.writeValueAsString(data);
            for (WebSocketSession session : adminSessions) {
                if (session.isOpen()) {
                    synchronized (session) {
                        session.sendMessage(new TextMessage(message));
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("[Admin WS] Broadcast error: " + e.getMessage());
        }
    }

    public static int getAdminSessionCount() {
        return adminSessions.size();
    }
}
