package com.college.bus.bus_tracking.service;

import com.college.bus.bus_tracking.entity.Client;
import com.college.bus.bus_tracking.repository.ClientRepository;
import com.college.bus.bus_tracking.store.SessionStore;
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

        // Hash password before saving
        client.setPassword(passwordEncoder.encode(client.getPassword()));

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
            // Valid login - check for existing session
            return client.get();
        }

        // Check if it's a BCrypt hash
        if (passwordEncoder.matches(password, client.get().getPassword())) {
            // Valid login - check for existing session
            return client.get();
        }

        throw new RuntimeException("Invalid email/username or password");
    }

    public void checkAndCreateSession(Long userId, String userType, String deviceId, boolean force) {
        // Check if user already has an active session in memory
        SessionStore.SessionData existingSession = SessionStore.getSession(userId, userType);

        if (existingSession != null) {
            // If force is requested, remove the old session
            if (force) {
                SessionStore.removeSession(userId, userType);
            } else {
                // If deviceId differs, prevent login
                if (deviceId == null || !deviceId.equals(existingSession.deviceId)) {
                    throw new RuntimeException("User is already logged in on another device");
                }
                // Same device, allow (it effectively refreshes or reuses the session)
                return;
            }
        }

        // Create new in-memory session (either as a new session or replacing the forced one)
        SessionStore.createSession(userId, userType, deviceId);
    }

    public void logoutClient(Long clientId) {
        SessionStore.removeSession(clientId, "CLIENT");
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
    public Client updateProfile(Long clientId, String phoneNumber, String profilePicture, Boolean phoneVerified,
            String name) {
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
        client.setPassword(passwordEncoder.encode(newPassword));
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

    /**
     * Create a new student from Admin panel
     */
    public Client createStudent(java.util.Map<String, Object> payload) {
        String name = (String) payload.get("name");
        String username = (String) payload.get("username");
        if (username == null || username.trim().isEmpty()) {
            username = (String) payload.get("studentId");
        }
        String email = (String) payload.get("email");
        String phoneNumber = (String) payload.get("phoneNumber");
        if (phoneNumber == null) phoneNumber = (String) payload.get("phone");
        String savedBusStop = (String) payload.get("savedBusStop");
        if (savedBusStop == null) savedBusStop = (String) payload.get("busStop");
        String assignedBus = (String) payload.get("assignedBus");
        String assignedRoute = (String) payload.get("assignedRoute");
        if (assignedRoute == null) assignedRoute = (String) payload.get("route");
        String accountStatus = (String) payload.get("accountStatus");
        if (accountStatus == null) accountStatus = (String) payload.get("status");

        if (name == null || name.trim().isEmpty()) {
            throw new RuntimeException("Student Name is required");
        }
        if (username == null || username.trim().isEmpty()) {
            throw new RuntimeException("Student ID is required");
        }
        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("Email Address is required");
        }

        username = username.trim();
        email = email.trim();

        java.util.Optional<Client> existingUsername = clientRepository.findByUsername(username);
        if (existingUsername.isPresent()) {
            throw new RuntimeException("Student ID '" + username + "' is already registered");
        }

        java.util.Optional<Client> existingEmail = clientRepository.findByEmail(email);
        if (existingEmail.isPresent()) {
            throw new RuntimeException("Email Address '" + email + "' is already registered");
        }

        Client client = new Client();
        client.setName(name.trim());
        client.setUsername(username);
        client.setEmail(email);
        client.setPhoneNumber(phoneNumber != null ? phoneNumber.trim() : null);
        client.setSavedBusStop(savedBusStop != null ? savedBusStop.trim() : null);
        client.setAssignedBus(assignedBus != null ? assignedBus.trim() : null);
        client.setAssignedRoute(assignedRoute != null ? assignedRoute.trim() : null);

        if (accountStatus != null && !accountStatus.trim().isEmpty()) {
            client.setAccountStatus(accountStatus.trim());
            client.setPhoneVerified("VERIFIED".equalsIgnoreCase(accountStatus) || "ACTIVE".equalsIgnoreCase(accountStatus));
        } else {
            client.setAccountStatus("UNVERIFIED");
            client.setPhoneVerified(false);
        }

        String rawPassword = (String) payload.get("password");
        if (rawPassword == null || rawPassword.trim().isEmpty()) {
            rawPassword = "Student@123";
        }
        client.setPassword(passwordEncoder.encode(rawPassword));

        return clientRepository.save(client);
    }

    /**
     * Update existing student from Admin panel
     */
    public Client updateStudent(Long id, java.util.Map<String, Object> payload) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found with ID: " + id));

        String name = (String) payload.get("name");
        String username = (String) payload.get("username");
        if (username == null) username = (String) payload.get("studentId");
        String email = (String) payload.get("email");
        String phoneNumber = (String) payload.get("phoneNumber");
        if (phoneNumber == null) phoneNumber = (String) payload.get("phone");
        String savedBusStop = (String) payload.get("savedBusStop");
        if (savedBusStop == null) savedBusStop = (String) payload.get("busStop");
        String assignedBus = (String) payload.get("assignedBus");
        String assignedRoute = (String) payload.get("assignedRoute");
        if (assignedRoute == null) assignedRoute = (String) payload.get("route");
        String accountStatus = (String) payload.get("accountStatus");
        if (accountStatus == null) accountStatus = (String) payload.get("status");

        if (name != null && !name.trim().isEmpty()) {
            client.setName(name.trim());
        }

        if (username != null && !username.trim().isEmpty()) {
            username = username.trim();
            if (!username.equalsIgnoreCase(client.getUsername())) {
                java.util.Optional<Client> existing = clientRepository.findByUsername(username);
                if (existing.isPresent() && !existing.get().getId().equals(id)) {
                    throw new RuntimeException("Student ID '" + username + "' is already in use by another student");
                }
                client.setUsername(username);
            }
        }

        if (email != null && !email.trim().isEmpty()) {
            email = email.trim();
            if (!email.equalsIgnoreCase(client.getEmail())) {
                java.util.Optional<Client> existing = clientRepository.findByEmail(email);
                if (existing.isPresent() && !existing.get().getId().equals(id)) {
                    throw new RuntimeException("Email address '" + email + "' is already in use by another student");
                }
                client.setEmail(email);
            }
        }

        if (phoneNumber != null) {
            client.setPhoneNumber(phoneNumber.trim());
        }

        if (savedBusStop != null) {
            client.setSavedBusStop(savedBusStop.trim());
        }

        if (assignedBus != null) {
            client.setAssignedBus(assignedBus.trim());
        }

        if (assignedRoute != null) {
            client.setAssignedRoute(assignedRoute.trim());
        }

        if (accountStatus != null && !accountStatus.trim().isEmpty()) {
            client.setAccountStatus(accountStatus.trim());
            client.setPhoneVerified("VERIFIED".equalsIgnoreCase(accountStatus) || "ACTIVE".equalsIgnoreCase(accountStatus));
        } else if (payload.containsKey("phoneVerified")) {
            Boolean verified = Boolean.valueOf(payload.get("phoneVerified").toString());
            client.setPhoneVerified(verified);
            client.setAccountStatus(verified ? "VERIFIED" : "UNVERIFIED");
        }

        String rawPassword = (String) payload.get("password");
        if (rawPassword != null && !rawPassword.trim().isEmpty()) {
            client.setPassword(passwordEncoder.encode(rawPassword.trim()));
        }

        return clientRepository.save(client);
    }
}
