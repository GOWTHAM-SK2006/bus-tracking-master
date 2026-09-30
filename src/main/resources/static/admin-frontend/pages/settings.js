// =========================================
// System Settings Page Module
// =========================================
const SettingsPage = {
  render() {
    return `
      <section class="floating-panel panel-glass animate-fade-in-up visible" id="systemSettingsView">
        <div class="panel-container">
          <div class="list-header" style="align-items: center">
            <div style="display: flex; flex-direction: column; gap: 4px">
              <h2>System Global Settings</h2>
              <span class="list-count">Control Core Platform Access</span>
            </div>
          </div>
          
          <div class="settings-management-content" style="padding: 40px 20px; display: flex; flex-direction: column; align-items: center; gap: 30px;">
            <div class="settings-card panel-glass" style="width: 100%; max-width: 500px; padding: 30px; border-radius: 20px; background: rgba(255, 255, 255, 0.7);">
              <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 24px; color: var(--text-dark); display: flex; align-items: center; gap: 10px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> Access Control Toggles
              </h3>
              
              <div class="settings-toggles-list" style="display: flex; flex-direction: column; gap: 20px;">
                <!-- Driver Sign In Toggle -->
                <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: rgba(255,255,255,0.5); border-radius: 14px; border: 1px solid rgba(0,0,0,0.03);">
                  <div class="setting-info" style="display: flex; flex-direction: column; gap: 2px;">
                    <span style="font-weight: 600; font-size: 0.95rem;">Driver Sign In</span>
                    <p style="font-size: 0.75rem; color: var(--text-secondary); margin: 0;">Allow drivers to log into their mobile app.</p>
                  </div>
                  <button id="driverSignInToggleBtn" class="toggle-btn" type="button" onclick="toggleDriverSignIn(event)" style="flex-shrink: 0;">
                    <span class="toggle-slider" id="driverSignInSlider"></span>
                  </button>
                </div>

                <!-- Student Sign In Toggle -->
                <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: rgba(255,255,255,0.5); border-radius: 14px; border: 1px solid rgba(0,0,0,0.03);">
                  <div class="setting-info" style="display: flex; flex-direction: column; gap: 2px;">
                    <span style="font-weight: 600; font-size: 0.95rem;">Student Sign In</span>
                    <p style="font-size: 0.75rem; color: var(--text-secondary); margin: 0;">Enable student authentication for tracking.</p>
                  </div>
                  <button id="studentSignInToggleBtn" class="toggle-btn" type="button" onclick="toggleStudentSignIn(event)" style="flex-shrink: 0;">
                    <span class="toggle-slider" id="studentSignInSlider"></span>
                  </button>
                </div>

                <!-- Account Creation Toggle -->
                <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: rgba(255,255,255,0.5); border-radius: 14px; border: 1px solid rgba(0,0,0,0.03);">
                  <div class="setting-info" style="display: flex; flex-direction: column; gap: 2px;">
                    <span style="font-weight: 600; font-size: 0.95rem;">Driver Signup</span>
                    <p style="font-size: 0.75rem; color: var(--text-secondary); margin: 0;">Allow new drivers to register via the app.</p>
                  </div>
                  <button id="accountToggleBtn" class="toggle-btn" type="button" onclick="toggleAccountCreation(event)" style="flex-shrink: 0;">
                    <span class="toggle-slider"></span>
                  </button>
                </div>
              </div>
            </div>
            
            <div class="settings-info-box panel-glass" style="max-width: 500px; padding: 20px; border-radius: 16px; font-size: 0.85rem; color: var(--text-secondary); background: rgba(245, 158, 11, 0.04); border: 1px solid rgba(245, 158, 11, 0.1); line-height: 1.6;">
              <p style="margin: 0;"><strong>Global Impact:</strong> Changes made here affect all users immediately. Disabling sign-in will prevent new sessions but will not forcefully log out existing active users.</p>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  init() {
    // Re-load toggle states
    if (typeof loadAccountCreationState === 'function') {
      loadAccountCreationState();
    }
  }
};

window.SettingsPage = SettingsPage;
