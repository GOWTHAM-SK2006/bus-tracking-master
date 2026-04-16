package com.college.bus.bus_tracking.store;

import java.util.concurrent.ConcurrentHashMap;
import java.util.Optional;

/**
 * In-memory session store for tracking active user sessions
 * Sessions are automatically cleared when user closes app/browser
 */
public class SessionStore {

    private static final ConcurrentHashMap<String, SessionData> ACTIVE_SESSIONS = new ConcurrentHashMap<>();

    public static class SessionData {
        public Long userId;
        public String userType; // "DRIVER" or "CLIENT"
        public Long loginTime;
        public String sessionToken;
        public String deviceId;

        public SessionData(Long userId, String userType, String sessionToken, String deviceId) {
            this.userId = userId;
            this.userType = userType;
            this.sessionToken = sessionToken;
            this.deviceId = deviceId;
            this.loginTime = System.currentTimeMillis();
        }
    }

    /**
     * Check if user already has an active session
     */
    public static boolean hasActiveSession(Long userId, String userType) {
        String key = generateKey(userId, userType);
        return ACTIVE_SESSIONS.containsKey(key);
    }

    /**
     * Create a new session for user
     */
    public static String createSession(Long userId, String userType, String deviceId) {
        String sessionToken = generateSessionToken();
        String key = generateKey(userId, userType);

        ACTIVE_SESSIONS.put(key, new SessionData(userId, userType, sessionToken, deviceId));
        return sessionToken;
    }

    /**
     * Get active session for user
     */
    public static SessionData getSession(Long userId, String userType) {
        String key = generateKey(userId, userType);
        return ACTIVE_SESSIONS.get(key);
    }

    /**
     * Remove session when user logs out
     */
    public static void removeSession(Long userId, String userType) {
        String key = generateKey(userId, userType);
        ACTIVE_SESSIONS.remove(key);
    }

    /**
     * Validate session token
     */
    public static boolean validateSession(String sessionToken) {
        return ACTIVE_SESSIONS.values().stream()
                .anyMatch(session -> session.sessionToken.equals(sessionToken));
    }

    /**
     * Get all active sessions
     */
    public static ConcurrentHashMap<String, SessionData> getAllSessions() {
        return new ConcurrentHashMap<>(ACTIVE_SESSIONS);
    }

    /**
     * Clear all sessions
     */
    public static void clearAllSessions() {
        ACTIVE_SESSIONS.clear();
    }

    /**
     * Generate unique session key
     */
    private static String generateKey(Long userId, String userType) {
        return userType + "_" + userId;
    }

    /**
     * Generate session token
     */
    private static String generateSessionToken() {
        return java.util.UUID.randomUUID().toString();
    }
}
