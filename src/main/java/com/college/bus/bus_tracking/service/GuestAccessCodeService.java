package com.college.bus.bus_tracking.service;

import com.college.bus.bus_tracking.entity.GuestAccessCode;
import com.college.bus.bus_tracking.repository.GuestAccessCodeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class GuestAccessCodeService {

    @Autowired
    private GuestAccessCodeRepository repository;

    private final Random random = new Random();

    /**
     * Get the current active guest access code.
     * If none exists or the current one is expired, generate a new one.
     */
    public GuestAccessCode getCurrentCode() {
        Optional<GuestAccessCode> latest = repository.findTopByOrderByCreatedAtDesc();

        if (latest.isPresent() && !latest.get().isExpired()) {
            return latest.get();
        }

        // Generate new code
        return generateNewCode();
    }

    /**
     * Validate a guest access code entered by a user.
     */
    public boolean validateCode(String code) {
        GuestAccessCode current = getCurrentCode();
        return current.getCode().equals(code);
    }

    /**
     * Manually regenerate the guest access code (admin action).
     */
    public GuestAccessCode regenerateCode() {
        return generateNewCode();
    }

    /**
     * Generate a new random 6-digit code with 24-hour expiration.
     */
    private GuestAccessCode generateNewCode() {
        String code = String.format("%06d", random.nextInt(1000000));
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusHours(24);

        GuestAccessCode accessCode = new GuestAccessCode(code, now, expiresAt);
        return repository.save(accessCode);
    }

    /**
     * Scheduled task to auto-regenerate code every 24 hours.
     * Runs at midnight every day.
     */
    @Scheduled(cron = "0 0 0 * * *")
    public void scheduledCodeRegeneration() {
        System.out.println("[GuestAccess] Scheduled code regeneration triggered");
        generateNewCode();
    }
}
