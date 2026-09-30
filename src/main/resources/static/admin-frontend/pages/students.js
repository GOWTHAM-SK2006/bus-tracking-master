// =========================================
// Students Page Module
// =========================================
const StudentsPage = {
  render() {
    return `
      <section class="floating-panel panel-glass animate-fade-in-up visible" id="studentsView">
        <div class="panel-container">
          <div class="list-header" style="align-items: center">
            <div style="display: flex; flex-direction: column; gap: 4px">
              <h2>Students</h2>
              <span class="list-count" id="studentsTotalCount">0 students registered</span>
            </div>
          </div>

          <!-- Search Bar -->
          <div style="padding: 16px 20px 0 20px;">
            <div style="position: relative;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); pointer-events: none;">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" id="studentSearchInput" placeholder="Search by name, ID, bus number, or route..." style="width: 100%; padding: 12px 16px 12px 42px; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; font-size: 0.9rem; font-family: inherit; background: rgba(255,255,255,0.6); outline: none; transition: border-color 0.2s; box-sizing: border-box;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='rgba(0,0,0,0.08)'" />
            </div>
          </div>

          <div class="table-scroll-container" style="padding: 16px 20px 20px 20px;">
            <table class="buses-table" id="studentsTable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Student ID</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Bus Stop</th>
                  <th>Status</th>
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
