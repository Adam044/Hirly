/**
 * Admin Dashboard Main Entry Point
 * Bootstraps the application and initializes all modules.
 */
import { DashboardRenderer } from './core/Renderer.js';
import { getLoggedInUser, getCategories, getCities } from './core/api.js';
import { state } from './core/state.js';
import { showToast } from './components/UI.js';

// Import Section Modules
import { initOverview } from './sections/Overview.js';
import { initLeads } from './sections/Leads.js';
import { initAggregator } from './sections/Aggregator.js';
import { initAggregatedJobs } from './sections/AggregatedJobs.js';
import { initJobs } from './sections/Jobs.js';
import { initCompanies } from './sections/Companies.js';
import { initProfessionals } from './sections/Professionals.js';
import { initAlerts } from './sections/Alerts.js';
import { initNotifications } from './sections/Notifications.js';
import { initBalancer } from './sections/Balancer.js';
import { initReviews } from './sections/Reviews.js';
import { initCampaigns } from './sections/Campaigns.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Hirly Admin Dashboard Initializing...');

    // 1. Initialize Global Data
    try {
        const [user, categories, cities] = await Promise.all([
            getLoggedInUser(),
            getCategories(),
            getCities()
        ]);

        state.loggedInUserEmail = user.email;
        state.allCategories = categories.categories || [];
        state.allCities = cities.cities || [];

        // Update UI with admin info
        const adminNameDisplay = document.getElementById('adminNameDisplay');
        if (adminNameDisplay) adminNameDisplay.textContent = user.first_name ? `${user.first_name} ${user.last_name}` : user.email;

    } catch (error) {
        console.error('Failed to initialize admin data:', error);
        showToast('Initialization error. Some features may be limited.', 'warning');
    }

    // 2. Initialize Core Components
    const renderer = new DashboardRenderer();

    // 3. Initialize Section Modules
    initOverview();
    initLeads();
    initAggregator();
    initAggregatedJobs();
    initJobs();
    initCompanies();
    initProfessionals();
    initAlerts();
    initNotifications();
    initBalancer();
    initReviews();
    initCampaigns();

    // 4. Global Event Listeners
    setupGlobalListeners();

    // Hide global loader
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
    }

    console.log('✅ Dashboard Ready.');
});

function setupGlobalListeners() {
    // Sidebar Toggle for Mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logoutLinkSidebar');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/logout';
        });
    }

    // Global Search (if needed across all sections)
    const globalSearch = document.querySelector('header input[type="text"]');
    if (globalSearch) {
        globalSearch.addEventListener('input', (e) => {
            const query = e.target.value;
            // You could implement a global search dispatcher here
        });
    }
}
