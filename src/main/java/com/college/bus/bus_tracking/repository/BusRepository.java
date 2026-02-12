package com.college.bus.bus_tracking.repository;

import com.college.bus.bus_tracking.entity.BusEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BusRepository extends JpaRepository<BusEntity, Long> {
    Optional<BusEntity> findByDriverId(Long driverId);

    Optional<BusEntity> findByBusNumber(String busNumber);
}
