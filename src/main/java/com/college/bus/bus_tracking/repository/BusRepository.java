package com.college.bus.bus_tracking.repository;

import com.college.bus.bus_tracking.entity.BusEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BusRepository extends JpaRepository<BusEntity, String> {
}
