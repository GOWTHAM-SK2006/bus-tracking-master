package com.college.bus.bus_tracking.service;

import com.college.bus.bus_tracking.entity.Driver;
import com.college.bus.bus_tracking.entity.UserSession;
import com.college.bus.bus_tracking.repository.BusRepository;
import com.college.bus.bus_tracking.repository.DriverRepository;
import com.college.bus.bus_tracking.repository.UserSessionRepository;
import com.college.bus.bus_tracking.store.BusSessionStore;
import com.college.bus.bus_tracking.handler.UserHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class DriverService {

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private BusRepository busRepository;

    @Autowired
    private UserSessionRepository userSessionRepository;

    @Autowired
    private org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private UserHandler userHandler;

    @Autowired
    private SystemSettingsService systemSettingsService;

    public Driver registerDriver(Driver driver) {
        // Check if account creation is enabled
        if (!systemSettingsService.isAccountCreationEnabled()) {
            throw new RuntimeException("Unable to create account. Contact admin for further details.");
        }

        // Check if username already exists
        Optional<Driver> existing = driverRepository.findByUsername(driver.getUsername());
        if (existing.isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        // Check if email already exists
        if (driver.getEmail() != null) {
            Optional<Driver> existingEmail = driverRepository.findByEmail(driver.getEmail());
            if (existingEmail.isPresent()) {
                throw new RuntimeException("Email already registered");
            }
        }

        // Hash password before saving
        driver.setPassword(passwordEncoder.encode(driver.getPassword()));

        return driverRepository.save(driver);
    }

    public Driver loginDriver(String username, String password) {
        Optional<Driver> driver = driverRepository.findByUsername(username);
        if (driver.isEmpty()) {
            throw new RuntimeException("Invalid username or password");
        }

        if (driver.get().getPassword().equals(password)) {
            // Valid login - check for existing session
            checkAndCreateSession(driver.get().getId(), "DRIVER");
            return driver.get();
        }

        // Check if it's a BCrypt hash
        if (passwordEncoder.matches(password, driver.get().getPassword())) {
            // Valid login - check for existing session
            checkAndCreateSession(driver.get().getId(), "DRIVER");
            return driver.get();
        }

        throw new RuntimeException("Invalid username or password");
    }

    private void checkAndCreateSession(Long userId, String userType) {
        // Check if user already has an active session
        Optional<UserSession> existingSession = userSessionRepository.findByUserIdAndUserType(userId, userType);
        if (existingSession.isPresent()) {
            throw new RuntimeException("User is already logged in from another device");
        }

        // Create new session
        UserSession newSession = UserSession.builder()
                .userId(userId)
                .userType(userType)
                .loginTime(System.currentTimeMillis())
                .lastActivityTime(System.currentTimeMillis())
                .build();

        userSessionRepository.save(newSession);
    }

    public void logoutDriver(Long driverId) {
        userSessionRepository.deleteByUserIdAndUserType(driverId, "DRIVER");
    }

    public Driver updateBusDetails(Long driverId, String busNumber, String busName) {
        Optional<Driver> driverOpt = driverRepository.findById(driverId);
        if (driverOpt.isEmpty()) {
            throw new RuntimeException("Driver not found");
        }

        Driver driver = driverOpt.get();
        driver.setBusNumber(busNumber);
        driver.setBusName(busName);

        return driverRepository.save(driver);
    }

    public Driver updateDriverProfile(Long id, String name, String phone, String busNumber, String busName) {
        Optional<Driver> driverOpt = driverRepository.findById(id);
        if (driverOpt.isEmpty()) {
            throw new RuntimeException("Driver not found");
        }

        Driver driver = driverOpt.get();
        String oldBusNumber = driver.getBusNumber();
        driver.setName(name);
        driver.setPhone(phone);
        driver.setBusNumber(busNumber);
        driver.setBusName(busName);
        Driver savedDriver = driverRepository.save(driver);

        // Update all BusEntity records assigned to this driver
        java.util.List<com.college.bus.bus_tracking.entity.BusEntity> driverBuses = busRepository.findAllByDriverId(id);
        for (com.college.bus.bus_tracking.entity.BusEntity busEntity : driverBuses) {
            busEntity.setDriverName(name);
            busEntity.setDriverPhone(phone);
            // Update the bus name if this is the currently selected bus
            if (busEntity.getBusNumber() != null && busEntity.getBusNumber().equals(busNumber)) {
                busEntity.setBusName(busName);
            }
            busRepository.save(busEntity);

            // Also update in-memory BUS_MAP
            com.college.bus.bus_tracking.model.BusData liveData = BusSessionStore.BUS_MAP.get(busEntity.getBusNumber());
            if (liveData != null) {
                liveData.setDriverName(name);
                liveData.setDriverPhone(phone);
                if (busEntity.getBusNumber().equals(busNumber)) {
                    liveData.setBusName(busName);
                }
            }
        }

        // Broadcast updated bus list to admins and students
        try {
            java.util.List<com.college.bus.bus_tracking.model.BusData> allBuses = new java.util.ArrayList<>(BusSessionStore.BUS_MAP.values());
            java.util.Map<String, Object> update = new java.util.HashMap<>();
            update.put("type", "BUS_UPDATE");
            update.put("buses", allBuses);
            update.put("source", "DriverProfileUpdate");
            update.put("timestamp", System.currentTimeMillis());
            com.college.bus.bus_tracking.websocket.AdminWebSocketHandler.broadcastToAdmins(update);
            userHandler.broadcastUpdate();
        } catch (Exception e) {
            System.err.println("[DriverService] Failed to broadcast profile update: " + e.getMessage());
        }

        return savedDriver;
    }

    public void updatePassword(String username, String newPassword) {
        Optional<Driver> driverOpt = driverRepository.findByUsername(username);
        if (driverOpt.isEmpty()) {
            throw new RuntimeException("Driver not found");
        }

        Driver driver = driverOpt.get();
        driver.setPassword(passwordEncoder.encode(newPassword));
        driverRepository.save(driver);
    }

    public Driver getDriverById(Long driverId) {
        return driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));
    }

    public void deleteDriver(Long id) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        String busNumber = driver.getBusNumber();

        // 1. Delete driver record
        driverRepository.deleteById(id);

        // 2. Clean up associated bus data if it exists
        // 2. Clean up associated bus data if it exists
        if (busNumber != null && !busNumber.trim().isEmpty()) {
            // Remove from database
            busRepository.findByBusNumber(busNumber).ifPresent(bus -> {
                busRepository.delete(bus);
                System.out.println("[DriverService] Deleted bus entity for busNumber: " + busNumber);
            });

            // Remove from in-memory session store
            if (BusSessionStore.BUS_MAP.containsKey(busNumber)) {
                BusSessionStore.BUS_MAP.remove(busNumber);
                System.out.println("[DriverService] Removed bus from memory: " + busNumber);
            }

            // 3. Broadcast update to passengers to remove the bus from map
            userHandler.broadcastUpdate();
        }
    }
}
