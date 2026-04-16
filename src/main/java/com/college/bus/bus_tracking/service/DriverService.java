package com.college.bus.bus_tracking.service;

import com.college.bus.bus_tracking.entity.Driver;
import com.college.bus.bus_tracking.entity.BusEntity;
import com.college.bus.bus_tracking.model.BusData;
import com.college.bus.bus_tracking.repository.BusRepository;
import com.college.bus.bus_tracking.repository.DriverRepository;
import com.college.bus.bus_tracking.store.BusSessionStore;
import com.college.bus.bus_tracking.store.SessionStore;
import com.college.bus.bus_tracking.handler.UserHandler;
import com.college.bus.bus_tracking.websocket.AdminWebSocketHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class DriverService {

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private BusRepository busRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

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
            return driver.get();
        }

        // Check if it's a BCrypt hash
        if (passwordEncoder.matches(password, driver.get().getPassword())) {
            // Valid login - check for existing session
            return driver.get();
        }

        throw new RuntimeException("Invalid username or password");
    }

    public void checkAndCreateSession(Long userId, String userType, String deviceId, boolean force) {
        // Check if user already has an active session in memory
        SessionStore.SessionData existingSession = SessionStore.getSession(userId, userType);

        if (existingSession != null) {
            // If force is requested, remove the old session
            if (force) {
                SessionStore.removeSession(userId, userType);
            } else {
                // If deviceId differs, prevent login
                if (deviceId == null || !deviceId.equals(existingSession.deviceId)) {
                    throw new RuntimeException("User is already logged in on another device");
                }
                // Same device, allow (it effectively refreshes or reuses the session)
                return;
            }
        }

        // Create new in-memory session (either as a new session or replacing the forced one)
        SessionStore.createSession(userId, userType, deviceId);
    }

    public void logoutDriver(Long driverId) {
        SessionStore.removeSession(driverId, "DRIVER");
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
        driver.setName(name);
        driver.setPhone(phone);
        driver.setBusNumber(busNumber);
        driver.setBusName(busName);
        Driver savedDriver = driverRepository.save(driver);

        // Update all BusEntity records assigned to this driver
        List<BusEntity> driverBuses = busRepository.findAllByDriverId(id);
        for (BusEntity busEntity : driverBuses) {
            busEntity.setDriverName(name);
            busEntity.setDriverPhone(phone);
            // Update the bus name if this is the currently selected bus
            if (busEntity.getBusNumber() != null && busEntity.getBusNumber().equals(busNumber)) {
                busEntity.setBusName(busName);
            }
            busRepository.save(busEntity);

            // Also update in-memory BUS_MAP
            BusData liveData = BusSessionStore.BUS_MAP.get(busEntity.getBusNumber());
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
            List<BusData> allBuses = new ArrayList<>(BusSessionStore.BUS_MAP.values());
            Map<String, Object> update = new HashMap<>();
            update.put("type", "BUS_UPDATE");
            update.put("buses", allBuses);
            update.put("source", "DriverProfileUpdate");
            update.put("timestamp", System.currentTimeMillis());
            AdminWebSocketHandler.broadcastToAdmins(update);
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
