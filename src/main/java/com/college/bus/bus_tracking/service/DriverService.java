package com.college.bus.bus_tracking.service;

import com.college.bus.bus_tracking.entity.Driver;
import com.college.bus.bus_tracking.repository.DriverRepository;
import com.college.bus.bus_tracking.service.SystemSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class DriverService {

    @Autowired
    private DriverRepository driverRepository;

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
        return driverRepository.save(driver);
    }

    public Driver loginDriver(String username, String password) {
        Optional<Driver> driver = driverRepository.findByUsername(username);
        if (driver.isEmpty()) {
            throw new RuntimeException("Invalid username or password");
        }

        if (!driver.get().getPassword().equals(password)) {
            throw new RuntimeException("Invalid username or password");
        }

        return driver.get();
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

        return driverRepository.save(driver);
    }

    public void updatePassword(String username, String newPassword) {
        Optional<Driver> driverOpt = driverRepository.findByUsername(username);
        if (driverOpt.isEmpty()) {
            throw new RuntimeException("Driver not found");
        }

        Driver driver = driverOpt.get();
        driver.setPassword(newPassword);
        driverRepository.save(driver);
    }

    public Driver getDriverById(Long driverId) {
        return driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));
    }

    public void deleteDriver(Long id) {
        if (!driverRepository.existsById(id)) {
            throw new RuntimeException("Driver not found");
        }
        driverRepository.deleteById(id);
    }
}
