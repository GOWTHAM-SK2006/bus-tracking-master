package com.college.bus.bus_tracking.service;

import com.college.bus.bus_tracking.entity.Client;
import com.college.bus.bus_tracking.repository.ClientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ClientService {

    @Autowired
    private ClientRepository clientRepository;

    private static final String[] ALLOWED_DOMAINS = { "@sairam.edu.in", "@sairamtap.edu.in" };

    public Client registerClient(Client client) {
        // Validate email domain
        if (!isValidEmailDomain(client.getEmail())) {
            throw new RuntimeException("Invalid email domain. Only @sairam.edu.in and @sairamtap.edu.in are allowed.");
        }

        // Check if username already exists
        Optional<Client> existingUsername = clientRepository.findByUsername(client.getUsername());
        if (existingUsername.isPresent()) {
            throw new RuntimeException("Username already taken");
        }

        // Check if email already exists
        Optional<Client> existingEmail = clientRepository.findByEmail(client.getEmail());
        if (existingEmail.isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        return clientRepository.save(client);
    }

    public Client loginClient(String email, String password) {
        Optional<Client> client = clientRepository.findByEmail(email);
        if (client.isEmpty()) {
            throw new RuntimeException("Invalid email or password");
        }

        if (!client.get().getPassword().equals(password)) {
            throw new RuntimeException("Invalid email or password");
        }

        return client.get();
    }

    private boolean isValidEmailDomain(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }

        String lowerEmail = email.toLowerCase();
        for (String domain : ALLOWED_DOMAINS) {
            if (lowerEmail.endsWith(domain)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Update client profile with phone number and profile picture
     */
    public Client updateProfile(Long clientId, String phoneNumber, String profilePicture, Boolean phoneVerified) {
        Optional<Client> clientOptional = clientRepository.findById(clientId);
        if (clientOptional.isEmpty()) {
            throw new RuntimeException("Client not found");
        }

        Client client = clientOptional.get();

        if (phoneNumber != null) {
            client.setPhoneNumber(phoneNumber);
        }

        if (profilePicture != null) {
            client.setProfilePicture(profilePicture);
        }

        if (phoneVerified != null) {
            client.setPhoneVerified(phoneVerified);
        }

        return clientRepository.save(client);
    }

    /**
     * Save bus stop to client profile
     */
    public Client saveBusStop(Long clientId, String busStop) {
        Optional<Client> clientOptional = clientRepository.findById(clientId);
        if (clientOptional.isEmpty()) {
            throw new RuntimeException("Client not found");
        }

        Client client = clientOptional.get();
        client.setSavedBusStop(busStop);

        return clientRepository.save(client);
    }

    /**
     * Get client by ID
     */
    public Client getClientById(Long clientId) {
        return clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found"));
    }
}
