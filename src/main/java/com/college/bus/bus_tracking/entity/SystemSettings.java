package com.college.bus.bus_tracking.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "system_settings")
public class SystemSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_creation_enabled", nullable = false)
    private Boolean accountCreationEnabled = true;

    @Column(name = "last_modified")
    private LocalDateTime lastModified;

    public SystemSettings() {
        this.accountCreationEnabled = true;
        this.lastModified = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Boolean getAccountCreationEnabled() {
        return accountCreationEnabled != null ? accountCreationEnabled : true;
    }

    public void setAccountCreationEnabled(Boolean accountCreationEnabled) {
        this.accountCreationEnabled = accountCreationEnabled;
        this.lastModified = LocalDateTime.now();
    }

    public LocalDateTime getLastModified() {
        return lastModified;
    }

    public void setLastModified(LocalDateTime lastModified) {
        this.lastModified = lastModified;
    }
}
