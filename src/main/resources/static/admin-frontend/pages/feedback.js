// =========================================
// Feedback Page Module
// =========================================
const FeedbackPage = {
  render() {
    return `
      <section class="floating-panel panel-glass animate-fade-in-up visible" id="feedbackView">
        <div class="panel-container">
          <div class="list-header" style="align-items: center">
            <div style="display: flex; flex-direction: column; gap: 4px">
              <h2>Student Feedback</h2>
              <span class="list-count"><span id="totalFeedback">0</span> reports</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: center">
              <select id="feedbackFilter" onchange="FeedbackManager.applyFilter()" style="
                    padding: 6px 10px;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    font-size: 0.8rem;
                    background: #fff;
                  ">
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
          <div class="buses-table-container">
            <table class="buses-table">
              <thead>
                <tr>
                  <th>Bus</th>
                  <th>Route</th>
                  <th>Student</th>
                  <th>Issue</th>
                  <th>Status</th>
                  <th>Time</th>
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
