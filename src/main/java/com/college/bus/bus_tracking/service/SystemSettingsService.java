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
            SystemSettings primary = all.get(0);
            for (int i = 1; i < all.size(); i++) {
                settingsRepository.delete(all.get(i));
            }
            return migrateIfNeeded(primary);
        }

        return migrateIfNeeded(all.get(0));
    }

    /**
     * Backfill NULL values for new columns on existing rows
     */
    private SystemSettings migrateIfNeeded(SystemSettings settings) {
        boolean needsSave = false;
        if (settings.getDriverSignInEnabled() == null) {
            settings.setDriverSignInEnabled(true);
            needsSave = true;
        }
        if (settings.getStudentSignInEnabled() == null) {
            settings.setStudentSignInEnabled(true);
            needsSave = true;
        }
        if (needsSave) {
            System.out.println("[SystemSettings] Migrating: backfilling NULL sign-in columns with defaults");
            return settingsRepository.save(settings);
        }
        return settings;
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

    /**
     * Toggle driver sign-in on/off
     */
    public SystemSettings toggleDriverSignIn() {
        SystemSettings settings = getSettings();
        Boolean current = settings.getDriverSignInEnabled();
        settings.setDriverSignInEnabled(!(current != null ? current : true));
        return settingsRepository.save(settings);
    }

    /**
     * Check if driver sign-in is enabled
     */
    public boolean isDriverSignInEnabled() {
        Boolean val = getSettings().getDriverSignInEnabled();
        return val != null ? val : true;
    }

    /**
     * Toggle student sign-in on/off
     */
    public SystemSettings toggleStudentSignIn() {
        SystemSettings settings = getSettings();
        Boolean current = settings.getStudentSignInEnabled();
        settings.setStudentSignInEnabled(!(current != null ? current : true));
        return settingsRepository.save(settings);
    }

    /**
     * Check if student sign-in is enabled
     */
    public boolean isStudentSignInEnabled() {
        Boolean val = getSettings().getStudentSignInEnabled();
        return val != null ? val : true;
    }
}
