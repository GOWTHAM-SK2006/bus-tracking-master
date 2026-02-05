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
        java.util.List<SystemSettings> all = settingsRepository.findAll();

        if (all.isEmpty()) {
            SystemSettings defaultSettings = new SystemSettings();
            return settingsRepository.save(defaultSettings);
        }

        // Cleanup duplicates if any
        if (all.size() > 1) {
            System.out.println("Warning: Multiple SystemSettings found. Cleaning up...");
            // Keep the first one, delete others
            SystemSettings primary = all.get(0);
            for (int i = 1; i < all.size(); i++) {
                settingsRepository.delete(all.get(i));
            }
            return primary;
        }

        return all.get(0);
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
