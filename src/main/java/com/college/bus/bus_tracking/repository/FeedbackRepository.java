package com.college.bus.bus_tracking.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.college.bus.bus_tracking.entity.Feedback;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findAllByOrderByCreatedAtDesc();
    List<Feedback> findByBusNumberOrderByCreatedAtDesc(String busNumber);
    List<Feedback> findByStatusOrderByCreatedAtDesc(String status);
}
