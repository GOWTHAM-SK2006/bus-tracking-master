/**
 * BusTrack - Unified Authentication
 * Handles role selection, tab switching, form submission
 */

// State
let currentRole = "client";
let currentTab = "signin";

// DOM Elements
const roleCards = document.querySelectorAll(".role-card");
const authTabs = document.querySelectorAll(".auth-tab");
const signinForm = document.getElementById("signinForm");
const signupForm = document.getElementById("signupForm");
const signinFooter = document.getElementById("signinFooter");
const signupFooter = document.getElementById("signupFooter");
const driverFields = document.getElementById("driverFields");
const errorAlert = document.getElementById("errorAlert");
const successAlert = document.getElementById("successAlert");
const authTabsContainer = document.querySelector(".auth-tabs");
const signupTab = document.querySelector('.auth-tab[data-tab="signup"]');
const collegeEmailBanner = document.getElementById("collegeEmailBanner");
const signupEmailLabel = document.getElementById("signupEmailLabel");
const signupEmailInput = document.getElementById("signupEmail");
const signinEmailGroup = document.getElementById("signinEmailGroup");
const signinUsernameGroup = document.getElementById("signinUsernameGroup");
const signinUsernameInput = document.getElementById("signinUsername");
const signupEmailGroup = document.getElementById("signupEmailGroup");
const signupUsernameGroup = document.getElementById("signupUsernameGroup");
const signupUsernameInput = document.getElementById("signupUsername");
const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
const resetPasswordForm = document.getElementById("resetPasswordForm");
const resetPasswordBtn = document.getElementById("resetPasswordBtn");
const cancelResetBtn = document.getElementById("cancelResetBtn");

// =========================================
// Role Selection
// =========================================

roleCards.forEach((card) => {
  card.addEventListener("click", () => {
    const role = card.dataset.role;
    selectRole(role);
  });
});

function selectRole(role) {
  currentRole = role;

  // Update UI
  roleCards.forEach((card) => {
    card.classList.toggle("active", card.dataset.role === role);
  });

  // Show/hide driver-specific fields in signup
  if (driverFields) {
    if (role === "driver") {
      driverFields.classList.remove("hidden");
      // Make driver fields required
      driverFields.querySelectorAll("input").forEach((input) => {
        input.required = true;
      });
    } else {
      driverFields.classList.add("hidden");
      // Remove required from driver fields
      driverFields.querySelectorAll("input").forEach((input) => {
        input.required = false;
      });
    }
  }

  // Show/hide college banner and update email label for students
  if (role === "client") {
    if (currentTab === "signup") collegeEmailBanner.classList.remove("hidden");
    signupEmailLabel.textContent = "College Email";
    signupEmailInput.placeholder = "student@sairamtap.edu.in";
  } else {
    collegeEmailBanner.classList.add("hidden");
    signupEmailLabel.textContent = "Email address";
    signupEmailInput.placeholder = "you@example.com";
  }

  // Toggle Email vs Username fields
  if (role === "driver") {
    // Show Username, Hide Email for SIGNIN
    signinEmailGroup.classList.add("hidden");
    signinUsernameGroup.classList.remove("hidden");

    // Show BOTH Email AND Username for SIGNUP
    signupEmailGroup.classList.remove("hidden");
    signupUsernameGroup.classList.remove("hidden");

    // Update requirements
    document.getElementById("signinEmail").required = false;
    signinUsernameInput.required = true;
    signupEmailInput.required = true; // Email required for drivers in signup
    signupUsernameInput.required = true;
  } else {
    // Show Email, Hide Username
    signinEmailGroup.classList.remove("hidden");
    signinUsernameGroup.classList.add("hidden");
    signupEmailGroup.classList.remove("hidden");
    signupUsernameGroup.classList.add("hidden");

    // Update requirements
    document.getElementById("signinEmail").required = true;
    signinUsernameInput.required = false;
    signupEmailInput.required = true;
    signupUsernameInput.required = false;
  }

  // Hide sign up tab for admin (admin can only sign in)
  if (role === "admin") {
    signupTab.style.display = "none";
    signinFooter.classList.add("hidden"); // Hide "Don't have an account?" text
    signupFooter.classList.add("hidden"); // Hide "Already have an account?" text
    // Force switch to signin if currently on signup
    if (currentTab === "signup") {
      switchTab("signin");
    }
  } else {
    signupTab.style.display = "";
    if (currentTab === "signin") {
      signinFooter.classList.remove("hidden");
    }
  }

  // Hide alerts on role change
  hideAlerts();

  // Toggle Forgot Password button visibility
  if (forgotPasswordBtn) {
    forgotPasswordBtn.style.display = role === "admin" ? "none" : "block";
  }

  // Update Signup State (Driver restriction)
  if (typeof updateSignupState === "function") {
    updateSignupState();
  }
}

// =========================================
// View Switching (Sign In / Sign Up / Forgot Password)
// =========================================

/**
 * Switch the visible authentication view
 * @param {string} viewName - 'signin', 'signup', or 'reset'
 */
function switchView(viewName) {
  // Map view names to form elements
  const forms = {
    signin: signinForm,
    signup: signupForm,
    reset: resetPasswordForm,
  };

  const footers = {
    signin: signinFooter,
    signup: signupFooter,
    reset: null, // No footer for reset view
  };

  // Determine target form and footer
  const targetForm = forms[viewName];
  const targetFooter = footers[viewName];

  if (!targetForm) {
    console.error("Unknown view:", viewName);
    return;
  }

  // Update current tab state if applicable
  if (viewName === "signin" || viewName === "signup") {
    currentTab = viewName;
    // Update tab UI
    authTabs.forEach((t) => {
      t.classList.toggle("active", t.dataset.tab === viewName);
    });
  }

  // Hide all forms
  Object.values(forms).forEach((form) => {
    if (form && !form.classList.contains("hidden")) {
      form.classList.add("hidden");
    }
  });

  // Hide all footers
  Object.values(footers).forEach((footer) => {
    if (footer && !footer.classList.contains("hidden")) {
      footer.classList.add("hidden");
    }
  });

  // Show target form
  targetForm.classList.remove("hidden");
  targetForm.classList.add("fade-in"); // Add animation class if exists, or just show

  // Remove fade-out from target (clean up)
  targetForm.classList.remove("fade-out");

  // Show target footer (if exists and not admin)
  if (targetFooter && currentRole !== "admin") {
    targetFooter.classList.remove("hidden");
  }

  // Handle special cases
  if (viewName === "signup" && currentRole === "client") {
    collegeEmailBanner.classList.remove("hidden");
  } else {
    collegeEmailBanner.classList.add("hidden");
  }

  // Hide alerts on view switch
  hideAlerts();
}

// Tab Switching Event Listeners
authTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const tabName = tab.dataset.tab;
    switchView(tabName);
  });
});

// Backward compatibility / Helper for existing calls
function switchTab(tab) {
  switchView(tab);
}

// =========================================
// Password Toggle
// =========================================

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";

  // Update icon
  btn.innerHTML = isPassword
    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
               <line x1="1" y1="1" x2="23" y2="23"/>
           </svg>`
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
               <circle cx="12" cy="12" r="3"/>
           </svg>`;
}

// =========================================
// Alerts
// =========================================

function showError(message) {
  errorAlert.textContent = message;
  errorAlert.classList.add("show");
  successAlert.classList.remove("show");
}

function showSuccess(message) {
  successAlert.textContent = message;
  successAlert.classList.add("show");
  errorAlert.classList.remove("show");
}

function hideAlerts() {
  errorAlert.classList.remove("show");
  successAlert.classList.remove("show");
}

// =========================================
// Form Submission - Sign In
// =========================================

signinForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const signinEmail = document.getElementById("signinEmail").value.trim();
  const signinUsername = document.getElementById("signinUsername").value.trim();
  const password = document.getElementById("signinPassword").value;
  const btn = document.getElementById("signinBtn");

  // Determine identifier based on role
  let identifier = "";
  if (currentRole === "driver") {
    identifier = signinUsername;
  } else {
    identifier = signinEmail;
  }

  // Validate
  if (!identifier || !password) {
    showError("Please fill in all fields");
    return;
  }

  // Show loading
  btn.classList.add("btn-loading");
  btn.disabled = true;

  try {
    let endpoint = "";
    let body = {};

    switch (currentRole) {
      case "client":
        endpoint = "/api/client/login";
        body = { email: identifier, password };
        break;
      case "driver":
        endpoint = "/api/driver/login";
        body = { username: identifier, password };
        break;
      case "admin":
        endpoint = "/api/admin/login";
        body = { email: identifier, password };
        break;
    }

    // Admin login (Client-side validation)
    let data;

    if (currentRole === "admin") {
      if (identifier === "admin@college.com" && password === "admin123") {
        // Simulate success for admin
        data = { success: true };
      } else {
        throw new Error("Invalid admin credentials");
      }
    } else {
      // Client & Driver Login (Backend API)
      const response = await fetch(getApiBaseUrl() + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }
    }

    // Store session and redirect
    switch (currentRole) {
      case "client":
        sessionStorage.setItem("client", JSON.stringify(data.client));
        window.location.href = "client-frontend/index.html";
        break;
      case "driver":
        sessionStorage.setItem("driver", JSON.stringify(data.driver));
        window.location.href = "driver-frontend/index.html";
        break;
      case "admin":
        // Admin login is handled client-side for now as per previous logic
        sessionStorage.setItem(
          "admin",
          JSON.stringify({
            id: 1,
            name: "Administrator",
            email: identifier,
            role: "ADMIN",
          }),
        );
        window.location.href = "admin-frontend/admin.html";
        break;
    }
  } catch (error) {
    showError(error.message || "Login failed. Please try again.");
  } finally {
    btn.classList.remove("btn-loading");
    btn.disabled = false;
  }
});

// =========================================
// Form Submission - Sign Up
// =========================================

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const username = document.getElementById("signupUsername").value.trim();
  const password = document.getElementById("signupPassword").value;
  const btn = document.getElementById("signupBtn");

  // Validate basic fields (Name & Password)
  if (!name || !password) {
    showError("Please fill in name and password");
    return;
  }

  // Validate role-specific identity
  if (currentRole === "driver" && !username) {
    showError("Please enter a username");
    return;
  }
  if (currentRole !== "driver" && !email) {
    showError("Please enter an email address");
    return;
  }

  if (password.length < 6) {
    showError("Password must be at least 6 characters");
    return;
  }

  // Domain validation for students
  if (currentRole === "client") {
    if (!email.toLowerCase().endsWith("@sairamtap.edu.in")) {
      showError("Please use your @sairamtap.edu.in college email address");
      return;
    }
  }

  // Show loading
  btn.classList.add("btn-loading");
  btn.disabled = true;

  try {
    let endpoint = "";
    let body = {};

    switch (currentRole) {
      case "client":
        endpoint = "/api/client/signup";
        body = {
          name,
          email,
          password,
          username: email, // Backend requires username, use email
        };
        break;
      case "driver":
        // ... driver fields ...
        const busNo = document.getElementById("busNo").value.trim();
        const phoneNo = document.getElementById("phoneNo").value.trim();
        const busName = document.getElementById("busName").value.trim();

        if (!busNo || !phoneNo || !busName) {
          showError("Please fill in all driver fields");
          btn.classList.remove("btn-loading");
          btn.disabled = false;
          return;
        }

        endpoint = "/api/driver/signup";
        body = {
          name,
          email: email, // Include email for password reset
          username: username,
          password,
          busNumber: busNo,
          phone: phoneNo,
          busName,
        };

        // Save to localStorage for pre-filling driver dashboard
        const driverConfig = {
          name: name,
          phone: phoneNo,
          busNumber: busNo,
          busName: busName,
        };
        localStorage.setItem("driverConfig", JSON.stringify(driverConfig));
        break;
      case "admin":
        endpoint = "/api/admin/signup";
        body = { name, email, password };
        break;
    }

    const response = await fetch(getApiBaseUrl() + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Signup failed");
    }

    showSuccess("Account created! Please sign in.");

    // Switch to signin tab after short delay
    setTimeout(() => {
      switchTab("signin");
    }, 1500);
  } catch (error) {
    showError(error.message || "Signup failed. Please try again.");
  } finally {
    btn.classList.remove("btn-loading");
    btn.disabled = false;
  }
});

// =========================================
// Initialize
// =========================================

// Check for URL parameters (e.g., ?role=driver&tab=signup)
function initFromUrl() {
  const params = new URLSearchParams(window.location.search);

  const role = params.get("role");
  if (role && ["client", "driver", "admin"].includes(role)) {
    selectRole(role);
  }

  const tab = params.get("tab");
  if (tab && ["signin", "signup"].includes(tab)) {
    switchTab(tab);
  }
}

// Initialize EmailJS
(function () {
  emailjs.init("CyQQT9cI3LkDf5s8A"); // Use provided public key
})();

// Check for URL parameters (e.g., ?role=driver&tab=signup)
function initFromUrl() {
  const params = new URLSearchParams(window.location.search);

  const role = params.get("role");
  if (role && ["client", "driver", "admin"].includes(role)) {
    selectRole(role);
  }

  const tab = params.get("tab");
  if (tab && ["signin", "signup"].includes(tab)) {
    switchTab(tab);
  }
}

// Initialize on load
document.addEventListener("DOMContentLoaded", initFromUrl);

// =========================================
// Reset Password Logic
// =========================================

if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener('click', () => {
        switchView('reset');
    });
}

if (cancelResetBtn) {
    cancelResetBtn.addEventListener('click', () => {
        switchView('signin');
    });
}

if (resetPasswordForm) {
  resetPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const identifier = document.getElementById("resetIdentifier").value.trim();
    const btn = document.getElementById("resetPasswordBtn");

    if (!identifier) {
      showError("Please enter your email or username");
      return;
    }

    btn.classList.add("btn-loading");
    btn.disabled = true;
    hideAlerts();

    try {
      const baseUrl = getApiBaseUrl();
      console.log(
        `[ForgotPW] Calling: ${baseUrl}/api/auth/forgot-password with identifier: ${identifier}`,
      );

      const response = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier }),
      });

      const data = await response.json();
      console.log("[ForgotPW] Backend response:", data);

      if (response.ok && data.resetLink) {
        // Use the production URL for the reset link so it works everywhere
        const prodBase =
          "https://bus-tracking-master-production.up.railway.app";
        const fullLink = `${prodBase}/${data.resetLink}`;
        console.log("[ForgotPW] Reset link generated:", fullLink);

        await emailjs.send("service_0lkjpbj", "template_l7nz8ut", {
          user_email: identifier, // This might be username or email, but template uses user_email
          reset_link: fullLink,
        });

        showSuccess(
          "A reset link has been sent to the email associated with this account!",
        );
        resetPasswordForm.reset();

        // Switch back to signin after delay
        setTimeout(() => {
          cancelResetBtn.click();
        }, 4000);
      } else {
        // Backend always returns success message for security, but we know if it worked based on resetLink presence
        showSuccess(
          "If an account exists, a reset link will be sent. (Note: In-memory DB resets on restart!)",
        );
        resetPasswordForm.reset();
      }
    } catch (error) {
      console.error("[ForgotPW] Error:", error);
      showError(
        `Failed to send reset link: ${error.message}. Check network connection.`,
      );
    } finally {
      btn.classList.remove("btn-loading");
      btn.disabled = false;
    }
  });
}

// =========================================
// System Settings Check
// =========================================

let driverSignupDisabled = false;

async function checkAccountCreation() {
  try {
    const response = await fetch(getApiBaseUrl() + "/api/admin/settings");
    const data = await response.json();

    // Store state
    if (data.accountCreationEnabled === false) {
      driverSignupDisabled = true;
    } else {
      driverSignupDisabled = false;
    }
    updateSignupState();
  } catch (error) {
    console.error("Failed to check settings:", error);
  }
}

function updateSignupState() {
  // Only disable if Driver Role AND Disabled
  if (currentRole === "driver" && driverSignupDisabled) {
    disableSignupUI();
  } else {
    enableSignupUI();
  }
}

function disableSignupUI() {
  // Disable Submit Button
  const btn = signupForm.querySelector('button[type="submit"]');
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Unable to create account. Please contact admin";
    btn.style.backgroundColor = "#fee2e2"; // Light red background
    btn.style.color = "#dc2626"; // Strong red text
    btn.style.border = "1px solid #fecaca";
    btn.classList.add("btn-error-state");
    btn.classList.remove("btn-secondary");
    btn.classList.remove("btn-primary");
  }

  // Disable all inputs in signup form
  signupForm.querySelectorAll("input").forEach((input) => {
    input.disabled = true;
  });

  // Show warning banner
  if (!document.getElementById("signupDisabledAlert")) {
    const alert = document.createElement("div");
    alert.id = "signupDisabledAlert";
    alert.className = "alert alert-error";
    alert.style.marginBottom = "20px";
    alert.style.color = "#ef4444"; // Force red
    alert.style.fontWeight = "600";
    alert.textContent = "Unable to create account. Please contact admin";
    signupForm.insertBefore(alert, signupForm.firstChild);
  }
}

function enableSignupUI() {
  // Enable Submit Button
  const btn = signupForm.querySelector('button[type="submit"]');
  if (btn) {
    btn.disabled = false;
    // Restore text based on role? Or generic "Create Account"
    btn.textContent = "Create Account";
    btn.style.backgroundColor = "";
    btn.style.color = "";
    btn.style.border = "";
    btn.classList.remove("btn-secondary");
    btn.classList.remove("btn-error-state");

    // Restore proper class
    if (currentRole === "driver") {
      btn.classList.add("btn-success"); // Assuming driver button style
    } else {
      btn.classList.add("btn-primary");
    }
  }

  // Enable inputs
  signupForm.querySelectorAll("input").forEach((input) => {
    input.disabled = false;
  });

  // Remove warning banner
  const alert = document.getElementById("signupDisabledAlert");
  if (alert) {
    alert.remove();
  }
}

// Run check on load
document.addEventListener("DOMContentLoaded", () => {
  checkAccountCreation();
  initWebSocket();
});

function initWebSocket() {
  const wsUrl = getWebSocketUrl("/ws/admin");
  console.log("[WS] Connecting for system updates:", wsUrl);

  try {
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "REGISTRATION_UPDATE") {
          console.log(
            "[WS] Registration update received:",
            data.accountCreationEnabled,
          );
          driverSignupDisabled = !data.accountCreationEnabled;
          updateSignupState();
        }
      } catch (e) {
        console.error("[WS] Error parsing message:", e);
      }
    };

    socket.onclose = () => {
      console.log("[WS] Connection closed, retrying in 5s...");
      setTimeout(initWebSocket, 5000);
    };

    socket.onerror = (err) => {
      console.error("[WS] Connection error:", err);
    };
  } catch (e) {
    console.error("[WS] Failed to connect:", e);
  }
}

function getWebSocketUrl(endpoint) {
  const host = window.location.hostname;
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const port = window.location.port;

  // Capacitor Support: Default to production URL
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    return `wss://bus-tracking-master-production.up.railway.app${endpoint}`;
  }

  if (host.includes(".devtunnels.ms")) {
    const tunnelMatch = host.match(/^([^-]+)-\d+\.(.+)$/);
    if (tunnelMatch)
      return `${protocol}//${tunnelMatch[1]}-8080.${tunnelMatch[2]}${endpoint}`;
  }

  // In production (port 80/443), window.location.port is often empty
  if (port && port !== "80" && port !== "443") {
    return `${protocol}//${host}:${port}${endpoint}`;
  }

  // For production or default ports
  return `${protocol}//${host}${endpoint}`;
}

function getApiBaseUrl() {
  const host = window.location.hostname;
  const protocol = window.location.protocol;

  // Default to Railway production URL as per user instruction
  const productionUrl = "https://bus-tracking-master-production.up.railway.app";

  // If we are already on the production domain, return empty string (relative calls)
  if (host.includes("railway.app")) {
    return "";
  }

  // Capacitor / Local Testing
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    // If testing on Emulator and want local, user would need to change this,
    // but user specifically said they use the production URL.
    return productionUrl;
  }

  // Default to production for all other cases unless on localhost and user wants local
  if (host === "localhost" || host === "127.0.0.1") {
    // You can change this to '' if you want to test against local backend
    return productionUrl;
  }

  return productionUrl;
}
