package com.college.bus.bus_tracking.repository;

import com.college.bus.bus_tracking.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClientRepository extends JpaRepository<Client, Long> {
    Optional<Client> findByEmail(String email);

    Optional<Client> findByUsername(String username);

    Optional<Client> findByResetToken(String resetToken);
}
