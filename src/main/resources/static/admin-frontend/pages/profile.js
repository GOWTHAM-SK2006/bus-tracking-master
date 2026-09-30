// =========================================
// Profile Page Module
// =========================================
const ProfilePage = {
  render() {
    return `
      <section class="floating-panel panel-glass animate-fade-in-up visible" id="profileView">
        <div class="panel-container">
          <div class="list-header">
            <h2>Administrator Profile</h2>
          </div>

          <div style="max-width: 600px; margin: 0 auto; width: 100%">
            <div style="text-align: center; margin-bottom: 40px">
              <h1 style="font-size: 28px; font-weight: 700; margin: 0" id="profileName">
                Admin
              </h1>
            </div>

            <div style="margin-bottom: 25px">
              <label style="
                    display: block;
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: #333;
                  ">Email Address</label>
              <input type="email" id="adminEmail" readonly style="
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #e0e0e0;
                    border-radius: 6px;
                    font-family: &quot;Poppins&quot;, sans-serif;
                    font-size: 14px;
                    box-sizing: border-box;
                  " />
            </div>

            <div style="margin-bottom: 25px">
              <label style="
                    display: block;
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: #333;
                  ">Change Password</label>
              <input type="password" id="adminPassword" placeholder="Leave blank to keep current password" style="
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #e0e0e0;
                    border-radius: 6px;
                    font-family: &quot;Poppins&quot;, sans-serif;
                    font-size: 14px;
                    box-sizing: border-box;
                  " />
            </div>

            <div style="display: flex; gap: 10px; margin-top: 30px">
              <button onclick="updateAdminProfile()" style="
                    flex: 1;
                    padding: 12px;
                    background: #ff6b35;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                  ">
                Save Changes
              </button>
              <button onclick="window.location.href='dashboard.html'" style="
                    flex: 1;
                    padding: 12px;
                    background: #e0e0e0;
                    color: #333;
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                  ">
                Cancel
              </button>
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
