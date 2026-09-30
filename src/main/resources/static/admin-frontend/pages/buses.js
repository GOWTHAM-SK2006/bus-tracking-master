// =========================================
// Buses Page Module
// =========================================
const BusesPage = {
  render() {
    return `
      <section class="floating-panel panel-glass animate-fade-in-up visible" id="busesView">
        <div class="panel-container">
          <div class="list-header">
            <div class="header-main">
              <h2>Registered Buses</h2>
              <p class="header-sub">Manage and monitor your fleet real-time</p>
            </div>
            <div class="header-stats">
              <span class="stat-badge"><span id="totalBuses">0</span> Buses Registered</span>
            </div>
          </div>

          <div class="table-controls">
            <div class="search-input-wrapper">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
               <input type="text" placeholder="Search by bus no, driver or route..." id="busFilterInput" />
            </div>
          </div>
          <div class="buses-table-container">
            <table class="buses-table">
              <thead>
                <tr>
                  <th>Bus No</th>
                  <th>Driver</th>
                  <th>Route</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="busesTableBody">
                <!-- Buses will be populated here -->
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  },

  init() {
    // Re-initialize BusManager filter
    const filterInput = document.getElementById('busFilterInput');
    if (filterInput) {
      filterInput.addEventListener('input', (e) => {
        if (typeof BusManager !== 'undefined') {
          BusManager.filterBuses(e.target.value);
        }
      });
    }
    
    // Update total count
    const totalEl = document.getElementById('totalBuses');
    if (totalEl && typeof adminState !== 'undefined') {
      totalEl.textContent = adminState.buses.size;
    }
    
    // Render bus table
    if (typeof BusManager !== 'undefined') {
      BusManager.renderBusesTable();
    }
  }
};

window.BusesPage = BusesPage;
