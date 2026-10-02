// =========================================
// Feedback Page Module
// =========================================
const FeedbackPage = {
  render() {
    return `
      <section class="floating-panel panel-glass animate-fade-in-up visible" id="feedbackView">
        <div class="panel-container">
          <!-- Header Banner -->
          <div class="routes-page-banner">
            <div class="banner-left">
              <h2><span class="gradient-text">Student Feedback & Reports</span></h2>
              <p class="banner-subtitle">Real-time issue tracking, student sentiment & resolution analytics</p>
            </div>
            <div class="banner-right">
              <span class="live-pulse-badge"><span class="pulse-dot"></span> Feedback Desk Active</span>
            </div>
          </div>

          <!-- Stats KPI Row -->
          <div class="routes-stats-row">
            <div class="stat-card-new">
              <div class="stat-icon-wrapper bg-gradient-orange">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              </div>
              <div class="stat-info-new">
                <span class="stat-label-new">Total Reports</span>
                <h3 class="stat-value-new" id="totalFeedback">0</h3>
                <span class="stat-trend-new positive">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg> Submissions Logged
                </span>
              </div>
            </div>

            <div class="stat-card-new">
              <div class="stat-icon-wrapper bg-gradient-blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 16 14"></polyline></svg>
              </div>
              <div class="stat-info-new">
                <span class="stat-label-new">Pending Review</span>
                <h3 class="stat-value-new" id="statPendingFeedback">0</h3>
                <span class="stat-trend-new positive">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg> Needs Action
                </span>
              </div>
            </div>

            <div class="stat-card-new">
              <div class="stat-icon-wrapper bg-gradient-purple">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <div class="stat-info-new">
                <span class="stat-label-new">Resolution Rate</span>
                <h3 class="stat-value-new" id="statResolutionRate">100%</h3>
                <span class="stat-trend-new positive">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg> Efficiency Score
                </span>
              </div>
            </div>
          </div>

          <!-- Search & Filter Action Bar -->
          <div class="routes-action-bar">
            <div class="search-wrapper-new glow-focus">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" id="feedbackSearchInput" placeholder="Search feedback by student, bus, route or issue..." oninput="FeedbackManager.applyFilter()" />
            </div>
            <div class="filter-select-wrapper">
              <select id="feedbackFilter" onchange="FeedbackManager.applyFilter()" class="custom-select-styled">
                <option value="all">All Feedback</option>
                <option value="pending">⏳ Pending Review</option>
                <option value="resolved">✅ Resolved</option>
              </select>
            </div>
          </div>

          <!-- Table Container -->
          <div class="buses-table-container">
            <table class="buses-table">
              <thead>
                <tr>
                  <th>Bus No</th>
                  <th>Route Name</th>
                  <th>Student Info</th>
                  <th>Issue Type</th>
                  <th>Status</th>
                  <th>Submitted Time</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody id="feedbackTableBody">
                <!-- Feedback rows populated by JS -->
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  },

  init() {
    if (typeof FeedbackManager !== 'undefined') {
      FeedbackManager.loadFeedback();
    }
  }
};

window.FeedbackPage = FeedbackPage;
