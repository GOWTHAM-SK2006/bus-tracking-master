package com.college.bus.websocket;

import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        System.out.println("[Admin WS] Received: " + payload);

        try {
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
    public void afterConnectionClosed(WebSocketSession session, org.springframework.web.socket.CloseStatus status) throws Exception {
        adminSessions.remove(session);
        System.out.println("[Admin WS] Disconnected: " + session.getId());
    }

    public static void broadcastToAdmins(Map<String, Object> data) throws Exception {
        String message = new ObjectMapper().writeValueAsString(data);
        for (WebSocketSession session : adminSessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(message));
                } catch (Exception e) {
                    System.err.println("[Admin WS] Error sending message: " + e.getMessage());
                }
            }
        }
    }

    public static int getAdminSessionCount() {
        return adminSessions.size();
    }
}
