package com.college.bus.bus_tracking.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.college.bus.bus_tracking.entity.Feedback;
import com.college.bus.bus_tracking.repository.FeedbackRepository;

@RestController
@RequestMapping("/api/feedback")
@CrossOrigin(origins = "*")
public class FeedbackController {

    @Autowired
    private FeedbackRepository feedbackRepository;

    /**
     * Submit new feedback (Student side)
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> submitFeedback(@RequestBody Feedback feedback) {
        Map<String, Object> response = new HashMap<>();
        try {
            feedback.setStatus("pending");
            Feedback saved = feedbackRepository.save(feedback);
            response.put("success", true);
            response.put("message", "Feedback submitted successfully");
            response.put("feedbackId", saved.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to submit feedback: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Get all feedback (Admin side)
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllFeedback() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Feedback> feedbackList = feedbackRepository.findAllByOrderByCreatedAtDesc();
            response.put("success", true);
            response.put("feedback", feedbackList);
            response.put("total", feedbackList.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to fetch feedback: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Get single feedback by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getFeedback(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Optional<Feedback> feedback = feedbackRepository.findById(id);
            if (feedback.isPresent()) {
                response.put("success", true);
                response.put("feedback", feedback.get());
            } else {
                response.put("success", false);
                response.put("message", "Feedback not found");
                return ResponseEntity.status(404).body(response);
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Mark feedback as resolved (Admin side)
     */
    @PutMapping("/{id}/resolve")
    public ResponseEntity<Map<String, Object>> resolveFeedback(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Optional<Feedback> opt = feedbackRepository.findById(id);
            if (opt.isPresent()) {
                Feedback feedback = opt.get();
                feedback.setStatus("resolved");
                feedbackRepository.save(feedback);
                response.put("success", true);
                response.put("message", "Feedback marked as resolved");
            } else {
                response.put("success", false);
                response.put("message", "Feedback not found");
                return ResponseEntity.status(404).body(response);
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Delete feedback (Admin side)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteFeedback(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            if (feedbackRepository.existsById(id)) {
                feedbackRepository.deleteById(id);
                response.put("success", true);
                response.put("message", "Feedback deleted successfully");
            } else {
                response.put("success", false);
                response.put("message", "Feedback not found");
                return ResponseEntity.status(404).body(response);
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
