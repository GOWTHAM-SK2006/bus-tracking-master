// =========================================
// Students Page Module
// =========================================
const StudentsPage = {
  render() {
    return `
      <section class="floating-panel panel-glass animate-fade-in-up visible" id="studentsView">
        <div class="panel-container">
          <!-- Header Banner -->
          <div class="routes-page-banner">
            <div class="banner-left">
              <h2><span class="gradient-text">Student Directory & Profiles</span></h2>
              <p class="banner-subtitle">Registered student database, bus allocation & contact verification</p>
            </div>
            <div class="banner-right" style="display: flex; align-items: center; gap: 12px;">
              <span class="live-pulse-badge"><span class="pulse-dot"></span> Directory Active</span>
              <button class="btn btn-primary hover-lift" onclick="StudentsManager.openAddModal()" style="padding: 10px 20px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #fff; border: none; border-radius: 12px; font-weight: 700; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.35); transition: all 0.2s;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>+ Add Student</span>
              </button>
            </div>
          </div>

          <!-- Stats KPI Row -->
          <div class="routes-stats-row">
            <div class="stat-card-new">
              <div class="stat-icon-wrapper bg-gradient-orange">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <div class="stat-info-new">
                <span class="stat-label-new">Registered Students</span>
                <h3 class="stat-value-new" id="studentsTotalCount">0</h3>
                <span class="stat-trend-new positive">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg> Active System Accounts
                </span>
              </div>
            </div>

            <div class="stat-card-new">
              <div class="stat-icon-wrapper bg-gradient-blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <div class="stat-info-new">
                <span class="stat-label-new">Verified Accounts</span>
                <h3 class="stat-value-new" id="statVerifiedStudents">0</h3>
                <span class="stat-trend-new positive">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg> Contact Authenticated
                </span>
              </div>
            </div>

            <div class="stat-card-new">
              <div class="stat-icon-wrapper bg-gradient-purple">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
              <div class="stat-info-new">
                <span class="stat-label-new">Stop Mappings</span>
                <h3 class="stat-value-new" id="statAssignedBusStops">0</h3>
                <span class="stat-trend-new positive">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg> Assigned Transit Stops
                </span>
              </div>
            </div>
          </div>

          <!-- Action & Search Bar -->
          <div class="routes-action-bar">
            <div class="search-wrapper-new glow-focus">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" id="studentSearchInput" placeholder="Search student by name, student ID, email, bus stop or phone..." />
            </div>
          </div>

          <!-- Data Table Container -->
          <div class="buses-table-container">
            <table class="buses-table" id="studentsTable">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Student ID</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th>Assigned Bus Stop</th>
                  <th>Status</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody id="studentsTableBody">
                <!-- Student rows populated by JS -->
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  },

  init() {
    if (typeof StudentsManager !== 'undefined') {
      StudentsManager.loadStudents();
    }
  }
};

window.StudentsPage = StudentsPage;
