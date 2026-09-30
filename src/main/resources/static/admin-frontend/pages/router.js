// =========================================
// Admin Router - Hash-based routing system
// =========================================
const AdminRouter = {
  // Route definitions: hash -> { page module name, sidebar tab name, page title }
  routes: {
    '/dashboard':  { page: 'DashboardPage',  tab: 'dashboard',        title: 'Dashboard' },
    '/live-map':   { page: 'LiveMapPage',     tab: 'map',              title: 'Live Map' },
    '/buses':      { page: 'BusesPage',       tab: 'buses',            title: 'Buses' },
    '/routes':     { page: 'RoutesPage',      tab: 'routes',           title: 'Routes' },
    '/feedback':   { page: 'FeedbackPage',    tab: 'feedback',         title: 'Feedback' },
    '/export':     { page: 'ExportPage',      tab: 'export',           title: 'Export' },
    '/students':   { page: 'StudentsPage',    tab: 'students',         title: 'Students' },
    '/settings':   { page: 'SettingsPage',    tab: 'system-settings',  title: 'System Settings' },
    '/profile':    { page: 'ProfilePage',     tab: 'profile',          title: 'Profile' },
  },

  currentRoute: null,
  contentContainer: null,

  init() {
    this.contentContainer = document.getElementById('routeContent');
    if (!this.contentContainer) {
      console.error('[Router] #routeContent container not found!');
      return;
    }

    // Listen for hash changes (back/forward/link clicks)
    window.addEventListener('hashchange', () => this.handleRoute());

    // Convert sidebar buttons from panel toggles to hash navigation
    this.bindSidebarNavigation();

    // Handle initial route
    this.handleRoute();

    console.log('[Router] Initialized');
  },

  bindSidebarNavigation() {
    // Map data-tab values to hash routes
    const tabToRoute = {
      'dashboard':       '#/dashboard',
      'map':             '#/live-map',
      'buses':           '#/buses',
      'routes':          '#/routes',
      'feedback':        '#/feedback',
      'export':          '#/export',
      'students':        '#/students',
      'system-settings': '#/settings',
      'profile':         '#/profile',
    };

    // Override sidebar button clicks to use hash navigation
    document.querySelectorAll('.bottom-nav-btn').forEach(btn => {
      const tab = btn.dataset.tab;
      const route = tabToRoute[tab];
      if (route) {
        // Remove existing click listeners by cloning
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.hash = route;
        });
      }
    });

    // Also override mobile menu items
    document.querySelectorAll('.mobile-menu-item').forEach(item => {
      const tab = item.dataset.tab;
      const route = tabToRoute[tab];
      if (route) {
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        newItem.addEventListener('click', (e) => {
          e.preventDefault();
          // Close mobile menu
          const menu = document.getElementById('mobileMenu');
          const header = document.querySelector('.admin-header');
          if (menu) menu.classList.remove('open');
          if (header) header.classList.remove('menu-open');
          
          window.location.hash = route;
        });
      }
    });
  },

  handleRoute() {
    const hash = window.location.hash.replace('#', '') || '/dashboard';
    const routeConfig = this.routes[hash];

    if (!routeConfig) {
      // Default to dashboard if route not found
      window.location.hash = '#/dashboard';
      return;
    }

    // Don't re-render if same route
    if (this.currentRoute === hash) return;

    console.log(`[Router] Navigating to: ${hash}`);
    this.currentRoute = hash;

    // Update page title
    document.title = `DYGON Admin - ${routeConfig.title}`;

    // Update header title
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) {
      pageTitle.textContent = routeConfig.title === 'Dashboard' ? 'Management Dashboard' : routeConfig.title;
    }

    // Update sidebar active state
    this.updateActiveTab(routeConfig.tab);

    // Update mobile menu active state
    this.updateMobileMenuActive(routeConfig.tab);

    // Show/hide map background based on route
    const mapBg = document.querySelector('.map-background');
    const busCounter = document.querySelector('.bus-counter-widget');
    
    if (hash === '/live-map') {
      if (mapBg) mapBg.style.display = 'block';
      if (busCounter) busCounter.style.display = 'flex';
    } else {
      if (mapBg) mapBg.style.display = 'none';
      if (busCounter) busCounter.style.display = 'none';
    }

    // Render page content
    const pageModule = window[routeConfig.page];
    if (pageModule && typeof pageModule.render === 'function') {
      this.contentContainer.innerHTML = pageModule.render();
      
      // Initialize page after render
      if (typeof pageModule.init === 'function') {
        pageModule.init();
      }
    } else {
      console.error(`[Router] Page module "${routeConfig.page}" not found`);
      this.contentContainer.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-secondary);">Page not found</div>';
    }

    // Update adminState.activePanel for backward compatibility
    if (typeof adminState !== 'undefined') {
      const panelMap = {
        '/dashboard': 'dashboard',
        '/live-map': null,
        '/buses': 'buses',
        '/routes': 'routes',
        '/feedback': 'feedback',
        '/export': 'export',
        '/students': 'students',
        '/settings': 'system-settings',
        '/profile': 'profile',
      };
      adminState.activePanel = panelMap[hash] || null;
    }

    // Resize map when switching to/from map view
    if (typeof MapManager !== 'undefined' && MapManager.map) {
      setTimeout(() => MapManager.map.resize(), 150);
    }
  },

  updateActiveTab(tabName) {
    document.querySelectorAll('.bottom-nav-btn').forEach(btn => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  },

  updateMobileMenuActive(tabName) {
    document.querySelectorAll('.mobile-menu-item').forEach(item => {
      if (item.dataset.tab === tabName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  },

  // Navigate programmatically
  navigate(route) {
    window.location.hash = '#' + route;
  }
};

window.AdminRouter = AdminRouter;
