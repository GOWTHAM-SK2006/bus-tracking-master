package com.college.bus.bus_tracking.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.college.bus.bus_tracking.entity.BusEntity;

public interface BusRepository extends JpaRepository<BusEntity, Long> {
    Optional<BusEntity> findByDriverId(Long driverId);

    Optional<BusEntity> findByBusNumber(String busNumber);
    
    List<BusEntity> findByStatus(String status);
}
