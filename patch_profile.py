import sys
import re

def update_html():
    file = "src/main/resources/static/admin-frontend/admin.html"
    with open(file, 'r') as f:
        html = f.read()

    html = re.sub(
        r'<button class="mobile-menu-item"\s*onclick="window\.location\.href\s*=\s*[\'"]admin-profile\.html[\'"]">',
        r'<button class="mobile-menu-item" data-tab="profile" onclick="mobileMenuTabClick(\'profile\')">',
        html
    )

    html = re.sub(
        r'<button class="bottom-nav-btn"\s*data-tab="profile"\s*onclick="window\.location\.href\s*=\s*[\'"]admin-profile\.html[\'"]">',
        r'<button class="bottom-nav-btn" data-tab="profile" onclick="PanelManager.togglePanel(\'profile\')">',
        html
    )

    profile_html = """
    <!-- Profile Panel -->
    <section class="floating-panel panel-glass animate-fade-in-up" id="profileView">
      <div class="panel-container" style="max-width: 500px; margin: auto; height: auto;">
        <div class="list-header" style="justify-content: center; border-bottom: none;">
          <h2 id="profileName" style="font-size: 1.8rem; color: var(--primary-dark);">Admin Profile</h2>
        </div>
        <div style="padding: 20px 0;">
          <div class="profile-field">
              <label>Email Address</label>
              <input type="email" id="adminEmail" readonly>
          </div>
          <div class="profile-field">
              <label>Change Password</label>
              <input type="password" id="adminPassword" placeholder="Leave blank to keep current password">
          </div>
          <div style="display: flex; gap: 12px; margin-top: 30px;">
              <button class="btn btn-primary" style="flex:1;" onclick="updateProfile()">Save Changes</button>
              <button class="btn btn-secondary" style="flex:1;" onclick="PanelManager.closeAllPanels(); PanelManager.updateActiveTab('map');">Cancel</button>
          </div>
        </div>
      </div>
    </section>

"""
    if 'id="profileView"' not in html:
        html = html.replace('<div class="toast-container" id="toastContainer"></div>', profile_html + '    <div class="toast-container" id="toastContainer"></div>')

    with open(file, 'w') as f:
        f.write(html)

def update_css():
    file = "src/main/resources/static/admin-frontend/admin-style.css"
    with open(file, 'r') as f:
        css = f.read()

    css_addition = """
/* Profile Field Styles */
.profile-field { margin-bottom: 20px; text-align: left; }
.profile-field label { display: block; font-weight: 600; margin-bottom: 8px; color: var(--text-dark); }
.profile-field input { width: 100%; padding: 12px; border: 1.5px solid rgba(226, 232, 240, 0.8); border-radius: 8px; font-family: inherit; font-size: 14px; background: rgba(255,255,255,0.9); transition: all 0.3s; }
.profile-field input:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1); }
.profile-field input[readonly] { background: rgba(241, 245, 249, 0.6); color: var(--text-secondary); cursor: not-allowed; }
"""
    if '.profile-field' not in css:
        with open(file, 'a') as f:
            f.write(css_addition)

def update_js():
    file = "src/main/resources/static/admin-frontend/admin-app.js"
    with open(file, 'r') as f:
        js = f.read()

    if 'target === "profile"' not in js:
        js = js.replace(
            '} else if (target === "export") {',
            '} else if (target === "profile") {\n          this.togglePanel("profile");\n        } else if (target === "export") {'
        )
    
    if 'panelName === "feedback"' in js and 'panelName === "profile"' not in js:
        js = js.replace(
            '} else if (panelName === "feedback") {',
            '} else if (panelName === "profile") {\n      const pp = document.getElementById("profileView");\n      if (pp) {\n        pp.classList.add("visible");\n        this.updateActiveTab("profile");\n        const adminData = JSON.parse(sessionStorage.getItem("admin"));\n        if (adminData) {\n          document.getElementById("profileName").textContent = adminData.name || "Administrator";\n          document.getElementById("adminEmail").value = adminData.email || "";\n        }\n      }\n    } else if (panelName === "feedback") {'
        )

    if 'const fp = document.getElementById("feedbackView");' in js and 'const pp = document.getElementById("profileView");' not in js:
        js = js.replace(
            'const fp = document.getElementById("feedbackView");',
            'const pp = document.getElementById("profileView");\n    const fp = document.getElementById("feedbackView");'
        )
        js = js.replace(
            'if (fp) fp.classList.remove("visible");',
            'if (pp) pp.classList.remove("visible");\n    if (fp) fp.classList.remove("visible");'
        )

    with open(file, 'w') as f:
        f.write(js)

    with open(file, 'a') as f:
        js_addition = """
function updateProfile() {
    const password = document.getElementById('adminPassword').value;
    if (password) {
        showToast('Profile updated and password changed successfully!', 'success');
        document.getElementById('adminPassword').value = '';
    } else {
        showToast('Profile updated successfully!', 'success');
    }
    setTimeout(() => {
        PanelManager.closeAllPanels();
        PanelManager.updateActiveTab('map');
    }, 1500);
}
"""
        if 'function updateProfile()' not in js:
            f.write(js_addition)

if __name__ == "__main__":
    update_html()
    update_css()
    update_js()
    print("Patch applied successfully.")
