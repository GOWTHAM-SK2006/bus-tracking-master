package com.college.bus.bus_tracking.service;

import com.college.bus.bus_tracking.entity.SystemSettings;
import com.college.bus.bus_tracking.repository.SystemSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SystemSettingsService {

    @Autowired
    private SystemSettingsRepository settingsRepository;

    /**
     * Get system settings. Creates default settings if none exist.
     */
    /**
     * Get system settings. Creates default settings if none exist.
     * Uses findAll() to retrieve any existing settings to avoid ID conflicts.
     */
    public SystemSettings getSettings() {
        return settingsRepository.findAll().stream().findFirst()
                .orElseGet(() -> {
                    SystemSettings defaultSettings = new SystemSettings();
                    // Do not manually set ID, let @GeneratedValue handle it
                    return settingsRepository.save(defaultSettings);
                });
    }

    /**
     * Toggle account creation on/off
     */
    public SystemSettings toggleAccountCreation() {
        SystemSettings settings = getSettings();
        settings.setAccountCreationEnabled(!settings.getAccountCreationEnabled());
        return settingsRepository.save(settings);
    }

    /**
     * Check if account creation is enabled
     */
    public boolean isAccountCreationEnabled() {
        return getSettings().getAccountCreationEnabled();
    }
}
