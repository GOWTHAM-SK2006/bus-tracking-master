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

    @Autowired
    private org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder passwordEncoder;

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

    public Client loginClient(String identifier, String password) {
        Optional<Client> client = clientRepository.findByEmail(identifier);

        if (client.isEmpty()) {
            client = clientRepository.findByUsername(identifier);
        }

        if (client.isEmpty()) {
            throw new RuntimeException("Invalid username/email or password");
        }

        if (client.get().getPassword().equals(password)) {
            return client.get();
        }

        // Check if it's a BCrypt hash
        if (passwordEncoder.matches(password, client.get().getPassword())) {
            return client.get();
        }

        throw new RuntimeException("Invalid email/username or password");
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
    public Client updateProfile(Long clientId, String phoneNumber, String profilePicture, Boolean phoneVerified, String name) {
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

        if (name != null && !name.trim().isEmpty()) {
            client.setName(name.trim());
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
     * Update client password
     */
    public void updatePassword(String identifier, String newPassword) {
        Optional<Client> clientOpt = clientRepository.findByEmail(identifier);
        if (clientOpt.isEmpty()) {
            clientOpt = clientRepository.findByUsername(identifier);
        }

        if (clientOpt.isEmpty()) {
            throw new RuntimeException("Client not found");
        }

        Client client = clientOpt.get();
        client.setPassword(newPassword);
        clientRepository.save(client);
    }

    /**
     * Get client by ID
     */
    public Client getClientById(Long clientId) {
        return clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found"));
    }

    public void deleteClient(Long id) {
        if (!clientRepository.existsById(id)) {
            throw new RuntimeException("Client not found");
        }
        clientRepository.deleteById(id);
    }
}
