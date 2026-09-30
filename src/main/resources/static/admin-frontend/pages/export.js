// =========================================
// Export Page Module
// =========================================
const ExportPage = {
  render() {
    return `
      <section class="floating-panel panel-glass animate-fade-in-up visible" id="exportView">
        <div class="panel-container">
          <div class="list-header">
            <div class="header-main">
              <h2>Reports & Exports</h2>
              <p class="header-sub">Generate detailed fleet and operations logs</p>
            </div>
            <div class="header-stats">
              <span class="stat-badge">PDF Format</span>
            </div>
          </div>

          <div class="export-grid-new">
            <!-- Active Buses Card -->
            <div class="export-card-new">
              <div class="export-header-new">
                 <div class="export-icon-box-new">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="3" width="22" height="13" rx="2" ry="2"></rect><path d="M4 21h16"></path><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"></path></svg>
                 </div>
                 <h3>Export Active Buses</h3>
              </div>
              <p>Download a comprehensive snapshot of all buses currently live in the tracking system.</p>
              <button class="btn-export-new" onclick="exportActiveBusesPDF()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download PDF Report
              </button>
            </div>

            <!-- Date Range Card -->
            <div class="export-card-new">
              <div class="export-header-new">
                 <div class="export-icon-box-new">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                 </div>
                 <h3>Export by Date Range</h3>
              </div>
              <p>Generate a historical tracking log for buses within a specific calendar period.</p>
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

                <div style="display: flex; gap: 10px;">
                  <button class="btn-export-new" onclick="exportDateRangePDF()" style="flex: 1;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Download History PDF
                  </button>
                  <button class="btn-export-modal-trigger" onclick="openPdfReportModal()" title="Open PDF Report Dialog" style="padding: 14px; background: var(--bg-gray); border: 1px solid var(--border-light); border-radius: 12px; cursor: pointer; margin-top: 8px; transition: all 0.2s;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6"></path><path d="M10 14L21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
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
    // Export page is ready
  }
};

window.ExportPage = ExportPage;
