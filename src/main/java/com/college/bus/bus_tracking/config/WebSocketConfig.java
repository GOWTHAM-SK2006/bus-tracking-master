package com.college.bus.bus_tracking.config;

import com.college.bus.bus_tracking.handler.DriverHandler;
import com.college.bus.bus_tracking.handler.UserHandler;
import com.college.bus.websocket.AdminWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.beans.factory.annotation.Autowired;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final DriverHandler driverHandler;
    private final UserHandler userHandler;

    @Autowired(required = false)
    private AdminWebSocketHandler adminWebSocketHandler;

    public WebSocketConfig(DriverHandler driverHandler, UserHandler userHandler) {
        this.driverHandler = driverHandler;
        this.userHandler = userHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(driverHandler, "/ws/driver").setAllowedOrigins("*");
        registry.addHandler(userHandler, "/ws/user").setAllowedOrigins("*");
        
        if (adminWebSocketHandler != null) {
            registry.addHandler(adminWebSocketHandler, "/ws/admin").setAllowedOrigins("*");
        }
    }
}
