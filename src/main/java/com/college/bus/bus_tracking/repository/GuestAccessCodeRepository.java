package com.college.bus.bus_tracking.repository;

import com.college.bus.bus_tracking.entity.GuestAccessCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GuestAccessCodeRepository extends JpaRepository<GuestAccessCode, Long> {

    Optional<GuestAccessCode> findTopByOrderByCreatedAtDesc();
}
