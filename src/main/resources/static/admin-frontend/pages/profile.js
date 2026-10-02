// =========================================
// Profile Page Module
// =========================================
const ProfilePage = {
  render() {
    return `
      <section class="floating-panel panel-glass animate-fade-in-up visible" id="profileView">
        <div class="panel-container">
          <!-- Header Banner -->
          <div class="routes-page-banner">
            <div class="banner-left">
              <h2><span class="gradient-text">Administrator Profile</span></h2>
              <p class="banner-subtitle">Executive account management, security clearance parameters & access governance</p>
            </div>
            <div class="banner-right">
              <span class="live-pulse-badge"><span class="pulse-dot"></span> Root Authority</span>
            </div>
          </div>

          <!-- Stats KPI Overview Row -->
          <div class="routes-stats-row">
            <div class="stat-card-new">
              <div class="stat-icon-wrapper bg-gradient-orange">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              </div>
              <div class="stat-info-new">
                <span class="stat-label-new">Role Authority</span>
                <h3 class="stat-value-new">Super Admin</h3>
                <span class="stat-trend-new positive">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg> Level 5 Clearance
                </span>
              </div>
            </div>

            <div class="stat-card-new">
              <div class="stat-icon-wrapper bg-gradient-blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <div class="stat-info-new">
                <span class="stat-label-new">Security Level</span>
                <h3 class="stat-value-new">TLS 256-Bit</h3>
                <span class="stat-trend-new positive">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg> Encrypted Session
                </span>
              </div>
            </div>

            <div class="stat-card-new">
              <div class="stat-icon-wrapper bg-gradient-purple">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <div class="stat-info-new">
                <span class="stat-label-new">Account Status</span>
                <h3 class="stat-value-new">Active</h3>
                <span class="stat-trend-new positive">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg> Zero Restrictions
                </span>
              </div>
            </div>
          </div>

          <!-- Profile Details & Security Form Grid -->
          <div class="export-grid-new" style="grid-template-columns: 1fr 1.4fr;">
            <!-- Card 1: Administrator Identity Badge -->
            <div class="export-card-new" style="align-items: center; text-align: center;">
              <div style="position: relative; margin-top: 10px;">
                <div style="width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, #ff6b35, #ea580c); display: flex; align-items: center; justify-content: center; color: white; font-size: 2.2rem; font-weight: 800; box-shadow: 0 12px 28px rgba(249, 115, 22, 0.35); border: 4px solid #ffffff; position: relative;">
                  <span id="profileAvatarInitials">AD</span>
                </div>
                <div style="position: absolute; bottom: 2px; right: 2px; width: 22px; height: 22px; background: #10b981; border: 3px solid #ffffff; border-radius: 50%;" title="Online & Authenticated"></div>
              </div>

              <div style="margin-top: 6px;">
                <h2 style="font-size: 1.4rem; font-weight: 800; color: #0f172a; margin-bottom: 4px;" id="profileName">
                  Admin
                </h2>
                <span style="display: inline-block; padding: 4px 14px; background: #fff7ed; color: #ea580c; border: 1px solid #ffedd5; border-radius: 99px; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.04em;">
                  SUPER ADMINISTRATOR
                </span>
              </div>

              <div style="width: 100%; height: 1px; background: #e2e8f0; margin: 12px 0;"></div>

              <div style="width: 100%; display: flex; flex-direction: column; gap: 12px; text-align: left;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #f8fafc; border-radius: 10px; border: 1px solid #f1f5f9;">
                  <span style="font-size: 0.8rem; font-weight: 600; color: #64748b;">System ID</span>
                  <span style="font-size: 0.82rem; font-weight: 700; color: #0f172a; font-family: monospace;">ADM-2026-001</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #f8fafc; border-radius: 10px; border: 1px solid #f1f5f9;">
                  <span style="font-size: 0.8rem; font-weight: 600; color: #64748b;">Access Scope</span>
                  <span style="font-size: 0.82rem; font-weight: 700; color: #0f172a;">Full Control</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #f8fafc; border-radius: 10px; border: 1px solid #f1f5f9;">
                  <span style="font-size: 0.8rem; font-weight: 600; color: #64748b;">Session Encryption</span>
                  <span style="font-size: 0.82rem; font-weight: 700; color: #10b981; display: flex; align-items: center; gap: 4px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> Enabled
                  </span>
                </div>
              </div>
            </div>

            <!-- Card 2: Password & Credentials Management -->
            <div class="export-card-new">
              <div class="export-header-new">
                <div class="export-icon-box-new">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
                <div>
                  <h3 style="margin: 0; font-size: 1.2rem; font-weight: 800; color: #0f172a;">Account Credentials</h3>
                  <p style="margin: 0; font-size: 0.85rem; color: #64748b; font-weight: 500;">Update your administrator login details and password</p>
                </div>
              </div>

              <div class="export-form-new" style="margin-top: 10px;">
                <!-- Email Field -->
                <div class="export-field-new">
                  <label for="adminEmail">Email Address (Read Only)</label>
                  <div style="position: relative;">
                    <input type="email" id="adminEmail" readonly style="padding-right: 40px; background: #f1f5f9; color: #334155; cursor: not-allowed; font-weight: 600;" />
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" style="position: absolute; right: 14px; top: 50%; transform: translateY(-50%);">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                </div>

                <!-- Password Field -->
                <div class="export-field-new">
                  <label for="adminPassword">Change Password</label>
                  <input type="password" id="adminPassword" placeholder="Leave blank to retain current password" style="font-size: 0.95rem;" />
                </div>

                <!-- Security Checklist -->
                <div style="background: #f8fafc; border-radius: 12px; padding: 14px 16px; border: 1px solid #e2e8f0; margin-top: 4px;">
                  <h4 style="font-size: 0.8rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
                    Password Guidelines
                  </h4>
                  <ul style="margin: 0; padding-left: 18px; font-size: 0.82rem; color: #64748b; display: flex; flex-direction: column; gap: 4px;">
                    <li>Minimum 6 characters long</li>
                    <li>Contains a mix of letters and numbers for enhanced security</li>
                    <li>Changes take effect immediately across all active sessions</li>
                  </ul>
                </div>

                <!-- Action Buttons -->
                <div style="display: flex; gap: 12px; margin-top: 12px;">
                  <button type="button" class="btn-export-new" onclick="updateAdminProfile()" style="flex: 1.2;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                    Save Changes
                  </button>
                  <button type="button" class="preset-pill-btn" onclick="window.location.href='dashboard.html'" style="flex: 0.8; padding: 14px; font-size: 0.9rem; justify-content: center; text-align: center;">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  init() {
    if (typeof loadAdminProfile === 'function') {
      loadAdminProfile();
    }
  }
};

window.ProfilePage = ProfilePage;
