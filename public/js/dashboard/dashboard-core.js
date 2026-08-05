/**
 * dashboard-core.js
 * Main entry point for the professional dashboard.
 * Initializes all modules and handles global state.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Modal System
    if (window.DashboardModals) {
        window.DashboardModals.init();
    }

    // Initialize module event listeners immediately (so they work even if API fails)
    if (window.DashboardUI) window.DashboardUI.init();
    if (window.DashboardProfile) window.DashboardProfile.init();
    if (window.DashboardServices) window.DashboardServices.init();
    if (window.DashboardApplications) window.DashboardApplications.init();

    // Initial Data Fetch
    try {
        window.DashboardUI.toggleLoading(true);

        const [profileResponse, servicesResponse, applicationsResponse] = await Promise.all([
            window.DashboardAPI.getProfile(),
            window.DashboardAPI.getServices(),
            window.DashboardAPI.getApplications()
        ]);

        const user = profileResponse.data;
        const services = servicesResponse.data;
        const applications = applicationsResponse.data;

        // Security Check: Ensure only professionals can access this dashboard
        if (user.user_type !== 'professional') {
            if (user.user_type === 'employer') {
                window.location.href = '/hire_dashboard.html';
            } else if (user.user_type === 'admin') {
                window.location.href = '/admin_dashboard.html';
            } else {
                window.location.href = '/login.html';
            }
            return;
        }

        // Global User State
        window.currentUser = user;

        // Initialize UI
        window.DashboardUI.updateGreeting(user);
        window.DashboardUI.updateStats({
            applications: applications.length,
            services: services.length,
            profileViews: user.profile_views || 0,
            employerViews: user.employer_views_count || 0
        });
        window.DashboardUI.updateProfileCompleteness(user.profile_completeness || 0);
        
        // Populate dropdowns with categories, professions, and cities
        if (window.DashboardProfile && window.DashboardProfile.populateAllDropdowns) {
            window.DashboardProfile.populateAllDropdowns();
        }
        
        // Update Sidebar & Profile
        window.DashboardProfile.updateSidebar(user);
        window.DashboardProfile.renderViewSections(user);

        // Render Dynamic Content
        window.DashboardServices.renderServices(services);
        window.userServicesCount = services.length;

        window.DashboardApplications.allApplications = applications;
        window.DashboardApplications.updateCounts();
        window.DashboardApplications.render();

        // Initialize Navigation & Mobile Menu
        setupNavigation();
        setupMobileMenu();
        setupLanguageSettings();
        setupOptimizer();

        // Apply translations after UI is fully rendered
        if (typeof window.applyTranslations === 'function') {
            window.applyTranslations(window.currentLanguage || localStorage.getItem('hirlyLang') || 'ar');
        }

    } catch (error) {
        console.error('Dashboard Initialization Failed:', error);
        const msg = window.translations?.dashboard_load_failed?.[window.currentLanguage] || 'Failed to load dashboard data. Please refresh.';
        window.DashboardUI.showToast(msg, 'error');
    } finally {
        window.DashboardUI.toggleLoading(false);
    }
});

/**
 * Setup Navigation
 */
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    const sections = document.querySelectorAll('.section-content[id$="Section"]');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            navigateToSection(section);
        });
    });

    function navigateToSection(section) {
        // Check for unsaved changes in profile section
        if (window.DashboardProfile && window.DashboardProfile.hasUnsavedChanges) {
            const lang = window.currentLanguage || 'en';
            const msg = window.translations?.unsaved_changes_warning?.[lang] || 'You have unsaved changes. Are you sure you want to leave?';
            if (!confirm(msg)) {
                return;
            }
            // Reset if user chooses to leave
            window.DashboardProfile.hasUnsavedChanges = false;
        }

        // Update active nav item
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === section) {
                item.classList.add('active');
            }
        });

        // Show/hide sections
        sections.forEach(sec => {
            sec.classList.add('hidden');
        });

        const targetSection = document.getElementById(`${section}Section`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }

        // Update page title
        updatePageTitle(section);

        // Close mobile sidebar
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (sidebar && overlay) {
            sidebar.classList.remove('is-open');
            overlay.classList.remove('is-visible');
        }
    }

    function updatePageTitle(section) {
        const titles = {
            overview: window.translations?.overview?.[window.currentLanguage] || 'Overview',
            applications: window.translations?.applications?.[window.currentLanguage] || 'Applications',
            services: window.translations?.my_services?.[window.currentLanguage] || 'My Services',
            'profile-card': window.translations?.profile_card?.[window.currentLanguage] || 'Profile Card',
            personal: window.translations?.personal_info?.[window.currentLanguage] || 'Personal Info',
            professional: window.translations?.professional_info?.[window.currentLanguage] || 'Professional',
            education: window.translations?.education?.[window.currentLanguage] || 'Education',
            settings: window.translations?.settings?.[window.currentLanguage] || 'Settings'
        };

        document.title = `${titles[section] || 'Dashboard'} | Hirly`;
    }
}

/**
 * Setup Mobile Menu
 */
function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (mobileMenuBtn && sidebar && overlay) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('is-open');
            overlay.classList.toggle('is-visible');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('is-open');
            overlay.classList.remove('is-visible');
        });
    }
}

/**
 * Setup Language Settings Section
 * Initializes the language selector in settings and syncs with current language
 */
function setupLanguageSettings() {
    const langSwitchAR = document.getElementById('langSwitchAR');
    const langSwitchEN = document.getElementById('langSwitchEN');

    if (!langSwitchAR || !langSwitchEN) return;

    // Get current language
    const currentLang = window.currentLanguage || localStorage.getItem('hirlyLang') || 'ar';

    // Update UI to show current language
    updateSettingsLanguageUI(currentLang);

    // Event Listeners for switches
    langSwitchAR.addEventListener('click', () => selectLanguage('ar'));
    langSwitchEN.addEventListener('click', () => selectLanguage('en'));

    // Listen for language changes to update settings UI
    document.addEventListener('languageChanged', (e) => {
        if (e.detail && e.detail.language) {
            updateSettingsLanguageUI(e.detail.language);
        }
    });

    // Also poll for changes from other tabs
    window.addEventListener('storage', (e) => {
        if (e.key === 'hirlyLang') {
            updateSettingsLanguageUI(e.newValue || 'ar');
        }
    });
}

/**
 * Select Language
 */
function selectLanguage(lang) {
    if (window.currentLanguage === lang) return;
    
    // Save language preference
    localStorage.setItem('hirlyLang', lang);
    window.currentLanguage = lang;

    // Update settings UI
    updateSettingsLanguageUI(lang);

    // Show refresh suggestion
    const refreshMsg = document.getElementById('langRefreshSuggestion');
    if (refreshMsg) {
        refreshMsg.classList.remove('hidden');
    }

    // Apply translations immediately
    if (typeof window.applyTranslations === 'function') {
        window.applyTranslations(lang);
    }

    // Dispatch event for other components
    document.dispatchEvent(new CustomEvent('languageChanged', {
        detail: { language: lang }
    }));
}

/**
 * Update the Settings Language UI
 */
function updateSettingsLanguageUI(lang) {
    const langSwitchAR = document.getElementById('langSwitchAR');
    const langSwitchEN = document.getElementById('langSwitchEN');

    if (!langSwitchAR || !langSwitchEN) return;

    const activeClasses = ['bg-slate-900', 'text-white', 'shadow-md'];
    const inactiveClasses = ['bg-transparent', 'text-slate-500', 'hover:bg-slate-50'];

    if (lang === 'en') {
        // EN Active
        langSwitchEN.classList.add(...activeClasses);
        langSwitchEN.classList.remove(...inactiveClasses);
        // AR Inactive
        langSwitchAR.classList.remove(...activeClasses);
        langSwitchAR.classList.add(...inactiveClasses);
    } else {
        // AR Active
        langSwitchAR.classList.add(...activeClasses);
        langSwitchAR.classList.remove(...inactiveClasses);
        // EN Inactive
        langSwitchEN.classList.remove(...activeClasses);
        langSwitchEN.classList.add(...inactiveClasses);
    }
}

/**
 * Setup Profile Optimizer Drawer
 */
function setupOptimizer() {
    const improveBtn = document.getElementById('improveProfileBtn');
    const closeBtn = document.getElementById('closeOptimizerBtn');
    const overlay = document.getElementById('sidebarOverlay');

    if (improveBtn) {
        improveBtn.addEventListener('click', () => {
            window.DashboardUI.openOptimizer();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            window.DashboardUI.closeOptimizer();
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            window.DashboardUI.closeOptimizer();
        });
    }
}
