// public/components.js - Handles loading of reusable components

// Load the header component when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Load the header component if placeholder exists
    if (document.getElementById('headerPlaceholder')) {
        loadComponent('header', 'headerPlaceholder');
    }
    // Load the footer component if placeholder exists
    if (document.getElementById('footerPlaceholder')) {
        loadComponent('footer', 'footerPlaceholder');
    }

    // Page transition: fade-in on enter
    document.body.classList.add('page-enter');

    // Load real-time tracker
    const tracker = document.createElement('script');
    tracker.src = '/js/realtime-tracker.js';
    document.head.appendChild(tracker);

    // Create a reusable transition overlay once
    let transitionOverlay = document.getElementById('pageTransitionOverlay');
    if (!transitionOverlay) {
        transitionOverlay = document.createElement('div');
        transitionOverlay.id = 'pageTransitionOverlay';
        transitionOverlay.className = 'page-transition-overlay';
        transitionOverlay.setAttribute('aria-hidden', 'true');
        document.body.appendChild(transitionOverlay);
    }

    function shouldInterceptLink(anchor) {
        if (!anchor) return false;
        const href = anchor.getAttribute('href');
        if (!href || href.startsWith('#')) return false; // ignore in-page anchors
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return false; // external
        const target = anchor.getAttribute('target');
        if (target && target.toLowerCase() === '_blank') return false;
        if (anchor.hasAttribute('download')) return false;
        return true;
    }

    function startTransitionAndNavigate(href) {
        if (transitionOverlay) transitionOverlay.classList.add('show');
        // Allow the overlay to render before navigation
        setTimeout(() => { window.location.href = href; }, 180);
    }

    // Intercept link clicks for unified transitions
    document.addEventListener('click', (e) => {
        const anchor = e.target.closest('a');
        if (!anchor) return;
        // Respect modifier keys (open in new tab/window)
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (!shouldInterceptLink(anchor)) return;
        e.preventDefault();
        startTransitionAndNavigate(anchor.href);
    });

    // Also show transition on programmatic navigations/unload
    window.addEventListener('beforeunload', () => {
        if (transitionOverlay) transitionOverlay.classList.add('show');
    });

    function hideGlobalOverlays() {
        try {
            document.querySelectorAll('.loading-overlay').forEach(el => {
                el.classList.remove('show');
                el.style.display = 'none';
            });
            const transitionEl = document.getElementById('pageTransitionOverlay');
            if (transitionEl) transitionEl.classList.remove('show');
        } catch (_) {}
    }

    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            hideGlobalOverlays();
        }
    });

    window.addEventListener('popstate', () => {
        hideGlobalOverlays();
    });
});

/**
 * Sets the active class on the navigation link for the current page.
 * This function is designed to work for both desktop and mobile navigation links.
 */
function setActiveNavLink() {
    const navLinks = document.querySelectorAll('#navLinks a, #mobileMainLinks a'); // Select both desktop and mobile links
    const currentPath = window.location.pathname;

    navLinks.forEach(link => {
        // Remove any existing active class to ensure only one link is active at a time.
        link.classList.remove('active');

        // Get the href attribute of the link.
        const href = link.getAttribute('href');

        // Check if this link's href matches the current page's path.
        // This handles various URL formats (e.g., /index.html, /jobs, /jobs.html, /).
        if (href === currentPath ||
            (currentPath.endsWith('.html') && href === currentPath) ||
            (!currentPath.endsWith('.html') && href === currentPath + '.html') ||
            (currentPath === '/' && href === '/index.html')) {
            link.classList.add('active'); // Add the 'active' class if it matches.
        }
    });
}

/**
 * Displays a generic modal by adding the 'show' class and preventing body scrolling.
 * This function is made global for accessibility from any script.
 * @param {HTMLElement} modalElement - The modal DOM element to show.
 */
window.showModal = function(modalElement) {
    if (!modalElement) {
        console.error('Modal element not found. Cannot show modal.');
        return;
    }
    
    // Stop any existing timeout if we were in the middle of hiding it
    if (modalElement._hideTimeout) {
        clearTimeout(modalElement._hideTimeout);
        modalElement._hideTimeout = null;
    }

    // Ensure it's not hidden
    modalElement.classList.remove('hidden');
    modalElement.style.display = 'flex';
    
    // Force a reflow to ensure display: flex is applied before adding 'show' class
    void modalElement.offsetWidth;
    
    modalElement.classList.add('show');
    document.body.classList.add('modal-open');

    // NEW: Close on backdrop click (only once)
    if (!modalElement._backdropListenerAttached) {
        modalElement.addEventListener('click', (e) => {
            // Prevent immediate closing if the click happened at the exact same time as opening
            if (Date.now() - (modalElement._showTime || 0) < 100) return;
            
            if (e.target === modalElement) {
                window.hideModal(modalElement);
            }
        });
        modalElement._backdropListenerAttached = true;
    }
    modalElement._showTime = Date.now();
};

/**
 * Hides a generic modal by removing the 'show' class and re-enabling body scrolling.
 * This function is made global for accessibility from any script.
 * @param {HTMLElement} modalElement - The modal DOM element to hide.
 */
window.hideModal = function(modalElement) {
    if (!modalElement) {
        console.error('Modal element not found. Cannot hide modal.');
        return;
    }
    modalElement.classList.remove('show');
    
    // Check if there are other open modals before removing modal-open from body
    const otherOpenModals = Array.from(document.querySelectorAll('.modal-overlay.show, .mobile-menu-overlay.show'))
        .filter(m => m !== modalElement);
    
    if (otherOpenModals.length === 0) {
        document.body.classList.remove('modal-open');
    }
    
    // Wait for animation to finish before hiding completely
    modalElement._hideTimeout = setTimeout(() => {
        modalElement.style.display = 'none';
        modalElement.classList.add('hidden');
        modalElement._hideTimeout = null;
    }, 300);
};

/**
 * Displays a toast notification at the bottom right of the screen.
 * This function is made global for accessibility from any script.
 * @param {string} message - The message text or translation key to display.
 * @param {string} [type='info'] - The type of toast (e.g., 'info', 'success', 'error', 'warning').
 */
window.showToast = function(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    // Resolve message from translations if it's a key
    const lang = window.currentLanguage || 'en';
    const translatedMessage = (window.translations && window.translations[message]) 
        ? (window.translations[message][lang] || window.translations[message]['en'] || message)
        : message;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} show`;
    toast.textContent = translatedMessage;
    toastContainer.appendChild(toast);

    // Automatically remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

/**
 * Displays a generic confirmation modal, reusing the logout confirmation modal's structure.
 * This function is made global for accessibility from any script.
 * @param {string} title - The title text for the confirmation modal.
 * @param {string} message - The main message text for the confirmation.
 * @param {Function} confirmCallback - The callback function to execute if the user confirms.
 * @param {Function} [cancelCallback=null] - The callback function to execute if the user cancels.
 * @param {string} [confirmText='Yes'] - The text for the confirm button.
 * @param {string} [confirmButtonClass='btn-primary'] - The CSS class for the confirm button's styling.
 */
window.showConfirmModal = function(title, message, confirmCallback, cancelCallback = null, confirmText = 'Yes', confirmButtonClass = 'btn-primary') {
    const confirmModal = document.getElementById('logoutConfirmModal'); // Reusing this modal for generic confirmation
    if (!confirmModal) {
        console.error('Confirmation modal element not found.');
        return;
    }

    const modalTitle = confirmModal.querySelector('h2');
    const modalMessage = confirmModal.querySelector('p');
    // Re-query buttons to ensure we get live DOM elements, then clone to remove old listeners
    let confirmButton = document.getElementById('confirmLogoutBtn');
    let cancelButton = document.getElementById('cancelLogoutBtn');
    let closeButton = document.getElementById('closeLogoutModalBtn');

    if (modalTitle) modalTitle.textContent = title;
    if (modalMessage) modalMessage.textContent = message;

    // Clone and replace buttons to remove all previous event listeners, preventing duplicates.
    if (confirmButton) {
        const newConfirmButton = confirmButton.cloneNode(true);
        confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
        confirmButton = newConfirmButton; // Update reference
        confirmButton.textContent = confirmText;
        confirmButton.className = `btn ${confirmButtonClass}`; // Apply custom class
        confirmButton.addEventListener('click', () => {
            confirmCallback();
            window.hideModal(confirmModal);
        });
    }
    if (cancelButton) {
        const newCancelButton = cancelButton.cloneNode(true);
        cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
        cancelButton = newCancelButton; // Update reference
        cancelButton.addEventListener('click', () => {
            if (cancelCallback) cancelCallback();
            window.hideModal(confirmModal);
        });
    }
    if (closeButton) {
        const newCloseButton = closeButton.cloneNode(true);
        closeButton.parentNode.replaceChild(newCloseButton, closeButton);
        closeButton = newCloseButton; // Update reference
        closeButton.addEventListener('click', () => {
            if (cancelCallback) cancelCallback(); // Treat closing as a cancel
            window.hideModal(confirmModal);
        });
    }

    window.showModal(confirmModal); // Show the confirmation modal.
};

/**
 * Hides the generic confirmation modal.
 * This function is made global for accessibility from any script.
 */
window.hideConfirmModal = function() {
    const confirmModal = document.getElementById('logoutConfirmModal');
    if (confirmModal) window.hideModal(confirmModal);
};

/**
 * Handles the actual logout process by sending an API request.
 * This function is made global and can be called from any page.
 */
window.handleLogout = async function() {
    try {
        const response = await fetch('/api/logout', { method: 'POST' });
        const data = await response.json();
        if (data.success) {
            window.location.href = data.redirect || '/login.html'; // Redirect on success.
        } else {
            console.error('Logout failed:', data.error);
            window.showToast(data.error || 'Logout failed.', 'error'); // Show error toast.
        }
    } catch (error) {
        console.error('Logout error:', error);
        window.showToast('An error occurred during logout.', 'error'); // Show generic error toast.
    } finally {
        window.hideConfirmModal(); // Ensure the confirmation modal is hidden.
    }
};


/**
 * Loads a component from the components directory and inserts it into the page.
 * @param {string} componentName - The name of the component to load (without .html extension).
 * @param {string} placeholderId - The ID of the element where the component HTML should be inserted.
 */
async function loadComponent(componentName, placeholderId) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) {
        console.warn(`Placeholder for ${componentName} (${placeholderId}) not found.`);
        return;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        // Fetch the component HTML
        const response = await fetch(`/components/${componentName}.html`, {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const httpErrorStatusText = (window.translations && window.translations['http_error_status'] && window.translations['http_error_status'][window.currentLanguage]) || 'HTTP error! status:';
            throw new Error(`${httpErrorStatusText} ${response.status}`); // Using translated error
        }

        const componentHtml = await response.text();
        
        if (placeholder) { // Double check placeholder exists before manipulating
            placeholder.innerHTML = componentHtml;

            // NEW: Relocate modals to body to avoid stacking context issues with sticky/filtered headers
            function relocateModalsToBody() {
                const modals = placeholder.querySelectorAll('.modal-overlay');
                modals.forEach(modal => {
                    document.body.appendChild(modal);
                });
            }

            // After inserting the header, initialize its scripts (language switcher, auth display, navigation, and mobile menu)
            if (componentName === 'header') {
                relocateModalsToBody();
                initializeHeaderScripts();
                // Call applyTranslations again after header is loaded to ensure all its data-lang-key elements are translated
                window.applyTranslations(window.currentLanguage);
                // Call the language modal listeners initializer after the header is fully loaded
                setTimeout(() => {
                    window.initializeLanguageModalListeners();
                }, 100); // Small delay to ensure DOM is ready

                // Dispatch custom event after header is fully loaded and scripts initialized
                document.dispatchEvent(new Event('headerLoaded'));
            } else if (componentName === 'footer') {
                // Also apply translations after footer is loaded
                window.applyTranslations(window.currentLanguage);
                document.dispatchEvent(new Event('footerLoaded'));
            }
        } else {
            console.error(`Placeholder element for ${componentName} not found after fetch.`);
        }
    } catch (error) {
        console.error('Error loading component:', componentName, error);
        // Attempt to show a minimal header if initialization fails
        if (componentName === 'header') {
            const header = document.querySelector('header');
            if (header) {
                header.innerHTML = `
                    <div style="padding: 1rem; text-align: center;">
                        <a href="/" style="text-decoration: none; color: inherit;">Hirly</a>
                    </div>
                `;
            }
        }
    }
}

/**
 * Initializes all scripts and event listeners for the header component.
 * This function is called after the header's HTML is loaded.
 */
async function initializeHeaderScripts() {
    // Desktop language switcher update
    const langLabel = document.getElementById('langLabel');
    const langFlagIcon = document.getElementById('langFlagIcon');
    
    const updateDesktopToggle = () => {
        if (!langLabel || !langFlagIcon) return;
        const currentLang = window.currentLanguage;
        langLabel.textContent = currentLang === 'ar' ? 'AR' : 'EN';
        langFlagIcon.src = currentLang === 'ar' 
            ? 'https://ecxvfjceuynwtpjvmxpw.supabase.co/storage/v1/object/public/assets/palestine-flag.svg' 
            : 'https://ecxvfjceuynwtpjvmxpw.supabase.co/storage/v1/object/public/assets/united-kingdom-flag.svg';
    };

    const langDropdownToggle = document.getElementById('langDropdownToggle');
    if (langDropdownToggle) {
        langDropdownToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.showLanguageSelectionModal();
        });
        updateDesktopToggle();
        window.addEventListener('translationsApplied', updateDesktopToggle);
    }

    // Handle auth display for both desktop and mobile
    if (typeof window.handleAuthDisplayAndRedirect === 'function') {
        await window.handleAuthDisplayAndRedirect();

        // Get the current user data after auth status check
        const { isAuthenticated, currentUser } = window;

        if (isAuthenticated && currentUser) {
            // Mobile avatar is handled inside initializeMobileMenu when hamburger is clicked.
            // Desktop avatar elements have been removed for a simpler header.
        }
    }

    // Set active nav link after header is loaded
    setActiveNavLink();

    // Attach event listener for user avatar click to redirect to dashboard (desktop)
    const userAvatarHeader = document.getElementById('userAvatarHeader');
    if (userAvatarHeader) {
        userAvatarHeader.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.currentUserType === 'freelancer') {
                window.location.href = '/dashboard.html';
            } else if (window.currentUserType === 'employer') {
                window.location.href = '/hire_dashboard.html';
            }
        });
    }

    // Mobile Menu Toggle Logic
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const mobileMenuClose = document.getElementById('mobileMenuClose');

    if (hamburgerMenu && mobileMenuOverlay && mobileMenuClose) {
        hamburgerMenu.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            mobileMenuOverlay.classList.add('show');
            document.body.classList.add('modal-open');
            await initializeMobileMenu();

            // NEW: Explicitly attach listener to the mobile language switcher button here
            // after initializeMobileMenu has created it.
            const mobileLangSwitchButton = document.getElementById('mobileLangSwitchButton') || document.getElementById('mobileLangSwitchButton-unauth');
            if (mobileLangSwitchButton) {
                mobileLangSwitchButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.showLanguageSelectionModal();
                });
            }
        });

        mobileMenuClose.addEventListener('click', () => {
            mobileMenuOverlay.classList.remove('show');
            document.body.classList.remove('modal-open');
        });

        // Close mobile menu when a navigation link is clicked
        const mobileNavLinks = document.querySelectorAll('#mobileMenuDynamicContent a'); // Select links within dynamic content
        if (mobileNavLinks) {
            mobileNavLinks.forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenuOverlay.classList.remove('show');
                    document.body.classList.remove('modal-open');
                });
            });
        }
    }

    // FIX: Removed the static listener for mobileLogoutLink from here.
    // It will be added dynamically in initializeMobileMenu where the element is created.

    // Attach close button listener to the global logout modal
    const closeLogoutModalBtn = document.getElementById('closeLogoutModalBtn');
    if (closeLogoutModalBtn) {
        closeLogoutModalBtn.addEventListener('click', hideConfirmModal);
    }
}

/**
 * Updates the user avatar based on their profile.
 * This function is now in components.js to be globally accessible.
 * @param {HTMLElement} avatarContainer The parent div to apply the border class.
 * @param {HTMLElement} avatarImg The <img> element for the profile picture.
 * @param {HTMLElement} avatarText The <span> for the initials.
 * @param {Object} user The user data object (should contain first_name, last_name, profile_picture_url, user_type, profile.company_logo_path, profile.company_name).
 */
function updateUserAvatar(avatarContainer, avatarImg, avatarText, user) {
    if (!avatarContainer || !avatarImg || !avatarText || !user) {
        console.error('Avatar elements or user data not found for update.');
        return;
    }

    // Determine avatar content based on user type and available data
    let imageUrl = null;
    let initialsText = '';

    if (user.user_type === 'employer') {
        if (user.profile?.company_logo_path) {
            imageUrl = user.profile.company_logo_path;
        } else {
            // For employers, try company name first, then individual name
            const companyNameInitial = (user.profile?.company_name && user.profile.company_name.charAt(0)) || '';
            const firstNameInitial = (user.first_name && user.first_name.charAt(0)) || '';
            const lastNameInitial = (user.last_name && user.last_name.charAt(0)) || '';
            initialsText = (companyNameInitial || firstNameInitial + lastNameInitial || 'U').toUpperCase();
        }
    } else { // freelancer or other types
        if (user.profile_picture_url) {
            imageUrl = user.profile_picture_url;
        } else {
            const firstNameInitial = (user.first_name && user.first_name.charAt(0)) || '';
            const lastNameInitial = (user.last_name && user.last_name.charAt(0)) || '';
            initialsText = (firstNameInitial + lastNameInitial).toUpperCase() || 'U';
        }
    }

    if (imageUrl) {
        avatarImg.src = imageUrl;
        avatarImg.style.display = 'block';
        avatarText.style.display = 'none';
        avatarImg.onerror = function() {
            // Fallback to initials if image fails to load
            this.style.display = 'none';
            avatarText.style.display = 'flex';
            // Re-generate initials for fallback
            const firstNameInitial = (user.first_name && user.first_name.charAt(0)) || '';
            const lastNameInitial = (user.last_name && user.last_name.charAt(0)) || '';
            const companyNameInitial = (user.profile?.company_name && user.profile.company_name.charAt(0)) || '';
            initialsText = (user.user_type === 'employer' ? (companyNameInitial || firstNameInitial + lastNameInitial) : (firstNameInitial + lastNameInitial)).toUpperCase() || 'U';
            avatarText.textContent = initialsText;
        };
    } else {
        avatarText.textContent = initialsText;
        avatarText.style.display = 'flex'; // Use flex to center initials
        avatarImg.style.display = 'none';
    }
}


/**
 * Initializes the content of the mobile menu based on the current auth state.
 * This function now dynamically creates all menu groups and their links.
 */
async function initializeMobileMenu() {
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const mobileUserMenu = document.getElementById('mobileUserMenu'); // Contains avatar, name
    const mobileAuthButtons = document.getElementById('mobileAuthButtons'); // Login/Signup buttons
    const mobileMenuDynamicContent = document.getElementById('mobileMenuDynamicContent'); // Placeholder for dynamic content

    // Clear previous dynamic content within the placeholder to prevent duplicates on re-open
    if (mobileMenuDynamicContent) {
        mobileMenuDynamicContent.innerHTML = '';
    }

    // Create the group div elements and their UL children directly
    const accountToolsGroup = document.createElement('div');
    accountToolsGroup.classList.add('mobile-menu-group');
    accountToolsGroup.innerHTML = `<h4 class="group-title" data-lang-key="account_tools_title">${(window.translations && window.translations['account_tools_title'] && window.translations['account_tools_title'][window.currentLanguage]) || 'Account Tools'}</h4><ul id="mobileAccountToolsLinks"></ul>`;

    const mainLinksGroup = document.createElement('div');
    mainLinksGroup.classList.add('mobile-menu-group');
    mainLinksGroup.innerHTML = `<h4 class="group-title" data-lang-key="main_links_title">${(window.translations && window.translations['main_links_title'] && window.translations['main_links_title'][window.currentLanguage]) || 'Main Links'}</h4><ul id="mobileMainLinks"></ul>`;

    const sessionGroup = document.createElement('div');
    sessionGroup.classList.add('mobile-menu-group');
    sessionGroup.innerHTML = `<h4 class="group-title" data-lang-key="session_title">${(window.translations && window.translations['session_title'] && window.translations['session_title'][window.currentLanguage]) || 'Session'}</h4><ul id="mobileSessionLinks"></ul>`;

    // Append these group divs to the dynamic content placeholder
    if (mobileMenuDynamicContent) {
        mobileMenuDynamicContent.appendChild(accountToolsGroup);
        mobileMenuDynamicContent.appendChild(mainLinksGroup);
        mobileMenuDynamicContent.appendChild(sessionGroup);
    }

    // Get the ULs after they've been created and appended
    const accountToolsUl = document.getElementById('mobileAccountToolsLinks');
    const mainLinksUl = document.getElementById('mobileMainLinks');
    const sessionUl = document.getElementById('mobileSessionLinks');


    // Populate Main Links (always present)
    const defaultNavItems = [
        { href: '/index.html', icon: 'fas fa-home', langKey: 'homepage_title' },
        { href: '/jobs.html', icon: 'fas fa-briefcase', langKey: 'jobs' },
        { href: '/talent.html', icon: 'fas fa-user-tie', langKey: 'professionals' },
        { href: '/about.html', icon: 'fas fa-info-circle', langKey: 'about_us' },
        { href: '/contact.html', icon: 'fas fa-envelope', langKey: 'contact_us' }
    ];

    defaultNavItems.forEach(item => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = item.href;
        const translatedText = (window.translations && window.translations[item.langKey] && window.translations[item.langKey][window.currentLanguage]) || item.langKey;
        a.innerHTML = `<i class="${item.icon}"></i> <span data-lang-key="${item.langKey}">${translatedText}</span>`;
        a.classList.add('mobile-nav-link');
        li.appendChild(a);
        if (mainLinksUl) mainLinksUl.appendChild(li);

        // Add event listener to close mobile menu when a link is clicked
        a.addEventListener('click', () => {
            if (mobileMenuOverlay) {
                mobileMenuOverlay.classList.remove('show');
                document.body.classList.remove('modal-open');
            }
        });
    });


    // Populate Account Tools and Session links based on auth state
    if (window.isAuthenticated && window.currentUser) {
        // Dashboard Link
        const dashboardLi = document.createElement('li');
        const dashboardLink = document.createElement('a');
        dashboardLink.href = window.currentUser.user_type === 'freelancer' ? '/dashboard.html' : '/hire_dashboard.html';
        dashboardLink.innerHTML = `<i class="fas fa-tachometer-alt"></i> <span data-lang-key="dashboard_link">${(window.translations && window.translations['dashboard_link'] && window.translations['dashboard_link'][window.currentLanguage]) || 'Dashboard'}</span>`;
        dashboardLink.classList.add('mobile-nav-link');
        dashboardLi.appendChild(dashboardLink);
        if (accountToolsUl) accountToolsUl.appendChild(dashboardLi);
        dashboardLink.addEventListener('click', () => {
            if (mobileMenuOverlay) {
                mobileMenuOverlay.classList.remove('show');
                document.body.classList.remove('modal-open');
            }
        });


        // Language Switcher (mobile - authenticated) - Now a simple button
        const langLi = document.createElement('li');
        const langButton = document.createElement('button');
        langButton.id = 'mobileLangSwitchButton'; // Unique ID for authenticated mobile switcher
        langButton.classList.add('sidebar-lang-switcher', 'mobile-nav-link');
        const currentLang = window.currentLanguage;
        const otherLangText = currentLang === 'ar' ? 'English' : 'العربية';
        langButton.innerHTML = `
            <i class="fas fa-globe"></i>
            <span class="lang-label">${otherLangText}</span>
        `;
        langLi.appendChild(langButton);
        if (accountToolsUl) accountToolsUl.appendChild(langLi);
        
        // Listener is attached in initializeHeaderScripts after menu is built


        // Logout Link
        const logoutLi = document.createElement('li');
        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.id = 'mobileLogoutLink';
        const translatedLogoutText = (window.translations && window.translations['logout'] && window.translations['logout'][window.currentLanguage]) || 'Logout';
        logoutLink.innerHTML = `<i class="fas fa-sign-out-alt"></i> <span data-lang-key="logout">${translatedLogoutText}</span>`;
        logoutLink.classList.add('mobile-nav-link');
        // FIX: The event listener is now attached here, after the element is created.
        logoutLink.addEventListener('click', (e) => {
             e.preventDefault();
             if (typeof window.showConfirmModal === 'function') {
                 // FIX: Add a null check for each translation key before accessing its language property.
                 const confirmTitle = (window.translations && window.translations['confirm_action_modal'] && window.translations['confirm_action_modal'][window.currentLanguage]) || 'Confirm Action';
                 const confirmMessage = (window.translations && window.translations['are_you_sure_proceed_modal'] && window.translations['are_you_sure_proceed_modal'][window.currentLanguage]) || 'Are you sure you want to proceed?';
                 const confirmText = (window.translations && window.translations['yes_confirm_modal'] && window.translations['yes_confirm_modal'][window.currentLanguage]) || 'Yes, Confirm';
                 
                 window.showConfirmModal(
                     confirmTitle,
                     confirmMessage,
                     window.handleLogout,
                     null,
                     confirmText,
                     'btn-danger'
                 );
             } else {
                 console.warn('showConfirmModal not found. Directing to logout page.');
                 if (confirm((window.translations && window.translations['are_u_sure_proceed_modal'] && window.translations['are_u_sure_proceed_modal'][window.currentLanguage]) || 'Are you sure you want to log out?')) {
                     window.location.href = '/logout.html';
                 }
             }
        });
        if (sessionUl) sessionUl.appendChild(logoutLi);
        logoutLi.appendChild(logoutLink);


        // Hide Auth buttons if authenticated
        if (mobileAuthButtons) mobileAuthButtons.style.display = 'none';
        if (mobileUserMenu) mobileUserMenu.style.display = 'flex'; // Show user info
        if (accountToolsGroup) accountToolsGroup.style.display = 'block';
        if (mainLinksGroup) mainLinksGroup.style.display = 'block'; // Always show main links
        if (sessionGroup) sessionGroup.style.display = 'block';

        // Update mobile user avatar and info
        const mobileUserName = document.getElementById('mobileUserName');
        const mobileUserTier = document.getElementById('mobileUserTier');
        const mobileUserAvatarContainer = document.getElementById('mobileUserAvatarContainer');
        const mobileUserAvatarImg = document.getElementById('mobileUserAvatarImg');
        const mobileUserAvatarText = document.getElementById('mobileUserAvatarText');

        if (mobileUserName) {
            mobileUserName.textContent = `${window.currentUser.first_name || ''} ${window.currentUser.last_name || ''}`;
        }
        if (mobileUserAvatarContainer && mobileUserAvatarImg && mobileUserAvatarText) {
            updateUserAvatar(mobileUserAvatarContainer, mobileUserAvatarImg, mobileUserAvatarText, window.currentUser);
        }


    } else {
        // Not authenticated
        if (mobileAuthButtons) mobileAuthButtons.style.display = 'flex'; // Show auth buttons
        if (mobileUserMenu) mobileUserMenu.style.display = 'none'; // Hide user info
        if (accountToolsGroup) accountToolsGroup.style.display = 'none';
        if (sessionGroup) sessionGroup.style.display = 'none';
        if (mainLinksGroup) mainLinksGroup.style.display = 'block'; // Always show main links

        // Add Language Switcher to main links group if not authenticated
        const langLiUnauth = document.createElement('li');
        const langButtonUnauth = document.createElement('button');
        langButtonUnauth.id = 'mobileLangSwitchButton-unauth'; // Unique ID for unauthenticated mobile switcher
        langButtonUnauth.classList.add('sidebar-lang-switcher', 'mobile-nav-link');
        const currentLang = window.currentLanguage;
        const otherLangText = currentLang === 'ar' ? 'English' : 'العربية';
        langButtonUnauth.innerHTML = `
            <i class="fas fa-globe"></i>
            <span class="lang-label">${otherLangText}</span>
        `;
        langLiUnauth.appendChild(langButtonUnauth);
        if (mainLinksUl) mainLinksUl.appendChild(langLiUnauth);
        
        // Listener is attached in initializeHeaderScripts after menu is built
    }
    // Set active nav link for mobile menu after it's initialized
    setActiveNavLink();
}
