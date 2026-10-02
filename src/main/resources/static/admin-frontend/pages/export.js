// =========================================
// Export Page Module
// =========================================
const ExportPage = {
  render() {
    return `
      <section class="floating-panel panel-glass animate-fade-in-up visible" id="exportView">
        <div class="panel-container">
          <!-- Header Banner -->
          <div class="routes-page-banner">
            <div class="banner-left">
              <h2><span class="gradient-text">System Reports & PDF Exports</span></h2>
              <p class="banner-subtitle">Generate operational logs, fleet status snapshots & custom historical data</p>
            </div>
            <div class="banner-right">
              <span class="live-pulse-badge"><span class="pulse-dot"></span> Report Generator Active</span>
            </div>
          </div>

          <!-- Stats KPI Row -->
          <div class="routes-stats-row">
            <div class="stat-card-new">
              <div class="stat-icon-wrapper bg-gradient-orange">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
              </div>
              <div class="stat-info-new">
                <span class="stat-label-new">Export Formats</span>
                <h3 class="stat-value-new">PDF Report</h3>
                <span class="stat-trend-new positive">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg> High Resolution
                </span>
              </div>
            </div>

            <div class="stat-card-new">
              <div class="stat-icon-wrapper bg-gradient-blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
              <div class="stat-info-new">
                <span class="stat-label-new">Date Filtering</span>
                <h3 class="stat-value-new">Custom Range</h3>
                <span class="stat-trend-new positive">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg> 5 Quick Presets
                </span>
              </div>
            </div>

            <div class="stat-card-new">
              <div class="stat-icon-wrapper bg-gradient-purple">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="1" y="3" width="22" height="13" rx="2" ry="2"></rect><path d="M4 21h16"></path><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"></path></svg>
              </div>
              <div class="stat-info-new">
                <span class="stat-label-new">Fleet Target</span>
                <h3 class="stat-value-new">Live Network</h3>
                <span class="stat-trend-new positive">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg> Full System Access
                </span>
              </div>
            </div>
          </div>

          <!-- Export Grid Cards -->
          <div class="export-grid-new">
            <!-- Active Buses Snapshot Card -->
            <div class="export-card-new">
              <div>
                <div class="export-header-new">
                  <div class="export-icon-box-new">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="3" width="22" height="13" rx="2" ry="2"></rect><path d="M4 21h16"></path><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"></path></svg>
                  </div>
                  <div>
                    <h3>Active Buses Report</h3>
                    <span class="live-pulse-badge" style="padding: 3px 10px; font-size: 0.72rem;"><span class="pulse-dot"></span> Instant Snapshot</span>
                  </div>
                </div>
                <p>Download a comprehensive snapshot report of all active trip buses currently registered and running in the tracking system.</p>
                <div class="export-feature-list">
                  <div class="export-feature-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span>Driver names & phone numbers</span>
                  </div>
                  <div class="export-feature-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span>Assigned route paths & GPS Status</span>
                  </div>
                  <div class="export-feature-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span>Real-time location timestamps</span>
                  </div>
                </div>
              </div>
              <button class="btn-export-new" onclick="exportActiveBusesPDF()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download Live PDF Report
              </button>
            </div>

            <!-- Date Range Historical Card -->
            <div class="export-card-new">
              <div>
                <div class="export-header-new">
                  <div class="export-icon-box-new" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); color: #0284c7; border-color: #bae6fd;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  </div>
                  <div>
                    <h3>Export by Date Range</h3>
                    <span class="route-badge-new" style="padding: 3px 10px; font-size: 0.72rem; background: #f0f9ff; color: #0284c7; border-color: #bae6fd;">Historical Logs</span>
                  </div>
                </div>
                <p>Generate a customized operational history log for fleet buses within a specific date timeframe.</p>
                <div class="export-form-new">
                  <div class="export-input-group">
                    <div class="export-field-new">
                      <label>Start Date</label>
                      <input type="date" id="exportStartDate" onchange="clearPresetActiveState()" />
                    </div>
                    <div class="export-field-new">
                      <label>End Date</label>
                      <input type="date" id="exportEndDate" onchange="clearPresetActiveState()" />
                    </div>
                  </div>

                  <!-- Quick Presets -->
                  <div class="quick-presets-container">
                    <label class="quick-presets-title">QUICK PRESETS</label>
                    <div class="quick-presets-pills">
                      <button type="button" class="preset-pill-btn" onclick="applyDatePreset('all', this)">ALL TIME</button>
                      <button type="button" class="preset-pill-btn" onclick="applyDatePreset('7days', this)">LAST 7 DAYS</button>
                      <button type="button" class="preset-pill-btn" onclick="applyDatePreset('30days', this)">LAST 30 DAYS</button>
                      <button type="button" class="preset-pill-btn" onclick="applyDatePreset('90days', this)">LAST 90 DAYS</button>
                      <button type="button" class="preset-pill-btn" onclick="applyDatePreset('thisyear', this)">THIS YEAR</button>
                    </div>
                  </div>
                </div>
              </div>
              <div style="display: flex; gap: 10px; margin-top: 16px;">
                <button class="btn-export-new" onclick="exportDateRangePDF()" style="flex: 1; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); box-shadow: 0 6px 20px rgba(2, 132, 199, 0.35);">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Download History PDF
                </button>
                <button class="btn-export-modal-trigger" onclick="openPdfReportModal()" title="Open PDF Report Dialog" style="padding: 14px; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 14px; cursor: pointer; transition: all 0.2s; color: var(--text-dark);">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6"></path><path d="M10 14L21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  init() {
    // Export page initialized
  }
};

window.ExportPage = ExportPage;
