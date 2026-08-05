// public/auth.js

// --- Global Fetch Wrapper for 401 Handling ---
const originalFetch = window.fetch;
window.fetch = async (url, options) => {
    try {
        const response = await originalFetch(url, options);
        if (response.status === 401 && !window._isRedirecting) {
            // Check if it's an API request
            const isApiRequest = typeof url === 'string' && url.includes('/api/');
            const isAuthCheck = typeof url === 'string' && (url.includes('/api/user') || url.includes('/api/auth/status'));

            if (isApiRequest) {
                // Suppress console warnings for auth status checks as 401 is expected when not logged in
                if (!isAuthCheck) {
                    console.warn(`[API] 401 Unauthorized: ${url}`);
                }
            } else {
                // For page requests, redirect to login
                const currentPath = window.location.pathname;
                const authPages = ['/login', '/signup', '/forgot_password', '/reset_password'];
                const isAuthPage = authPages.some(page => currentPath.includes(page));

                if (!isAuthPage) {
                    console.warn(`[AUTH] 401 Unauthorized for page ${url}. Redirecting to login.`);
                    window._isRedirecting = true;
                    window.location.href = '/login.html';
                }
            }
        }
        return response;
    } catch (error) {
        console.error('[FETCH] Global fetch error:', error);
        throw error;
    }
};

// These functions are defined in the global scope so they are available immediately
// when other scripts (like components.js) try to access them.

/**
 * Checks the user's authentication status by calling the /api/user endpoint.
 * This function is designed to be globally accessible.
 * @returns {Promise<{isAuthenticated: boolean, user: object|null, userType: string|null, isEmailVerified: boolean}>} An object indicating authentication status, user data, user type, and email verification status.
 */
async function checkAuthStatus() {
    try {
        const currentPath = window.location.pathname;
        // Ensure cookies are sent with the request and prevent caching
        const response = await fetch('/api/user', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            credentials: 'include', // Ensure session cookie is sent
            cache: 'no-store'
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                return { isAuthenticated: false, user: null, userType: null, isEmailVerified: false };
            }
            console.error('[AUTH] Authentication check failed, response not OK:', response.status, response.statusText);
            return { isAuthenticated: false, user: null, userType: null, isEmailVerified: false };
        }
        const data = await response.json();
        return {
            isAuthenticated: data.isAuthenticated,
            user: data.user,
            userType: data.user ? data.user.user_type : null,
            isEmailVerified: data.user ? data.user.is_email_verified : false
        };
    } catch (error) {
        console.error('[AUTH] Error checking auth status:', error);
        return { isAuthenticated: false, user: null, userType: null, isEmailVerified: false };
    }
}

/**
 * Helper to normalize paths for comparison (removes trailing slashes and .html extension)
 */
function normalizePath(path) {
    if (!path) return '';
    let normalized = path.toLowerCase().split('?')[0].split('#')[0];
    if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
    if (normalized.endsWith('.html')) normalized = normalized.slice(0, -5);
    return normalized || '/';
}

let isCheckingAuth = false;

/**
 * Handles the display of authentication buttons or user menu based on authentication status.
 * Also manages redirects for protected pages and updates mobile menu.
 * This function is designed to be globally accessible.
 */
async function handleAuthDisplayAndRedirect() {
    if (window._isRedirecting || isCheckingAuth) {
        return;
    }
    isCheckingAuth = true;

    try {
        let authStatus = await checkAuthStatus();
        
        // If not authenticated, wait a short moment and try again
        // to account for potential session cookie propagation delays
        if (!authStatus.isAuthenticated) {
            await new Promise(resolve => setTimeout(resolve, 500));
            authStatus = await checkAuthStatus();
        }

        if (!authStatus.isAuthenticated) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            authStatus = await checkAuthStatus();
        }

        const isAuthenticated = authStatus.isAuthenticated;
        const user = authStatus.user;
        const userType = authStatus.userType;
        const isEmailVerified = authStatus.isEmailVerified;

        window.currentUser = user;
        window.isAuthenticated = isAuthenticated;
        window.currentUserType = userType;
        window.isCurrentUserEmailVerified = isEmailVerified;

        const authButtons = document.getElementById('authButtons');
        const userMenu = document.getElementById('userMenu');
        const userAvatarImgDesktop = document.getElementById('userAvatarImgDesktop');
        const userAvatarTextDesktop = document.getElementById('userAvatarTextDesktop');
        const userAvatarContainerDesktop = document.getElementById('userAvatarContainerDesktop');
        const userNameDisplay = document.getElementById('userNameDisplay');

        // Sidebar elements
        const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');
        const sidebarUserAvatarImg = document.getElementById('sidebarUserAvatarImg');
        const sidebarUserAvatarText = document.getElementById('sidebarUserAvatarText');
        const userNameSidebar = document.getElementById('userNameSidebar');
        const userTypeSidebar = document.getElementById('userTypeSidebar');

        const currentPathNormalized = normalizePath(window.location.pathname);

        if (isAuthenticated) {
            if (authButtons) authButtons.style.display = 'none';
            if (userMenu) userMenu.style.display = 'flex';

            if (userAvatarContainerDesktop && userAvatarImgDesktop && userAvatarTextDesktop) {
                updateUserAvatar(userAvatarContainerDesktop, userAvatarImgDesktop, userAvatarTextDesktop, user);
            }
            if (userNameDisplay) userNameDisplay.textContent = user.first_name || 'User';

            if (sidebarUserAvatar && sidebarUserAvatarImg && sidebarUserAvatarText) {
                updateUserAvatar(sidebarUserAvatar, sidebarUserAvatarImg, sidebarUserAvatarText, user);
            }
            if (userNameSidebar) userNameSidebar.textContent = user.first_name;
            if (userTypeSidebar) userTypeSidebar.textContent = userType.charAt(0).toUpperCase() + userType.slice(1);

            const authPages = ['/login', '/signup', '/verify-email', '/email_verification_pending'].map(normalizePath);

            if (authPages.includes(currentPathNormalized)) {
                const redirectPath = userType === 'freelancer' ? '/dashboard.html' : (userType === 'employer' ? '/hire_dashboard.html' : '/admin_dashboard.html');
                window._isRedirecting = true;
                window.location.href = redirectPath;
                return;
            }
        } else {
            if (authButtons) authButtons.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';

            const protectedPages = [
                '/job_dashboard', '/hire_dashboard', '/post_job',
                '/applicants', '/admin_dashboard', '/ai', '/interviews_analysis'
            ].map(normalizePath);

            const allowedUnauthenticatedPages = [
                '/login', '/signup', '/verify-email', '/email_verification_pending', 
                '/forgot_password', '/reset_password', '/talent'
            ].map(normalizePath);

            if (protectedPages.includes(currentPathNormalized) && !allowedUnauthenticatedPages.includes(currentPathNormalized)) {
                window._isRedirecting = true;
                window.location.href = '/login.html';
                return;
            }
        }

    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    const signupMessageElement = document.getElementById('signupMessage');
    const loginMessageElement = document.getElementById('loginMessage');
    const verificationMessageElement = document.getElementById('verificationMessage');

    if (message) {
        if (message === 'email_verified_success' && loginMessageElement) {
            loginMessageElement.textContent = (window.translations && window.translations['email_verified_success_login'] && window.translations['email_verified_success_login'][window.currentLanguage]) || 'Your email has been successfully verified! You can now log in.';
            loginMessageElement.style.color = 'var(--success)';
            loginMessageElement.style.display = 'block';
            history.replaceState(null, '', window.location.pathname);
        } else if (urlParams.get('activated') === 'true' && loginMessageElement) {
            loginMessageElement.textContent = 'Account activated successfully! You can now log in.';
            loginMessageElement.style.color = 'var(--success)';
            loginMessageElement.style.display = 'block';
            history.replaceState(null, '', window.location.pathname);
        } else if (message === 'email_verification_required' && (loginMessageElement || verificationMessageElement)) {
            const targetElement = loginMessageElement || verificationMessageElement;
            if (targetElement) {
                targetElement.textContent = (window.translations && window.translations['email_verification_required_login'] && window.translations['email_verification_required_login'][window.currentLanguage]) || 'Please verify your email address to access this page. Check your inbox for a verification link.';
                targetElement.style.color = 'var(--danger)';
                targetElement.style.display = 'block';
                history.replaceState(null, '', window.location.pathname);
            }
        }
    }
    } catch (error) {
        console.error('Error in handleAuthDisplayAndRedirect:', error);
    } finally {
        isCheckingAuth = false;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const navLinks = document.getElementById('navLinks');

    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', function() {
            if (navLinks) navLinks.classList.toggle('show');

            const userMenu = document.getElementById('userMenu');
            const authButtons = document.getElementById('authButtons');
            if (userMenu && getComputedStyle(userMenu).display !== 'none') {
                userMenu.classList.toggle('show-mobile');
            } else if (authButtons && getComputedStyle(authButtons).display !== 'none') {
                authButtons.classList.toggle('show-mobile');
            }
        });
    }

    // Standardized logout functionality is now handled by components.js and individual dashboard scripts.
    // logoutButton and mobileLogoutButton listeners removed from here to prevent redundancy.

    // NEW: Login form submission handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission and page refresh

            const email = loginForm.email.value;
            const password = loginForm.password.value;
            const loginMessage = document.getElementById('loginMessage');
            const loginBtn = loginForm.querySelector('button[type="submit"]');

            loginMessage.textContent = ''; // Clear previous messages
            loginMessage.style.display = 'none';
            if (loginBtn) {
                loginBtn.disabled = true;
                loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            }

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // Successful login
                    loginMessage.textContent = (window.translations && window.translations['login_successful_redirect'] && window.translations['login_successful_redirect'][window.currentLanguage]) || 'Login successful! Redirecting...';
                    loginMessage.style.color = 'var(--success)';
                    loginMessage.style.display = 'block';
                    window.location.href = data.redirect;
                } else if (response.status === 403 && data.redirect) {
                    // Email not verified, redirect to verification pending page
                    loginMessage.textContent = data.error; // Assuming data.error is already translated from backend
                    loginMessage.style.color = 'var(--danger)';
                    loginMessage.style.display = 'block';
                    setTimeout(() => {
                         window.location.href = data.redirect;
                    }, 2000);
                } else if (data.needsActivation) {
                    // SEAMLESS ACTIVATION FLOW: Step 1 -> Step 2
                    try {
                        loginMessage.textContent = 'Preparing account activation...';
                        loginMessage.style.color = 'var(--info)';
                        loginMessage.style.display = 'block';

                        const reqRes = await fetch('/api/request-activation', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email })
                        });
                        const reqData = await reqRes.json();
                        
                        if (reqData.success) {
                            // UI Transition to Step 2
                            document.getElementById('loginForm').style.display = 'none';
                            document.getElementById('authFooter').style.display = 'none';
                            document.getElementById('otpForm').style.display = 'block';
                            document.getElementById('authHeader').querySelector('h1').textContent = 'Verify Account';
                            document.getElementById('authHeader').querySelector('p').textContent = 'One more step to secure your profile.';
                            
                            loginMessage.style.display = 'none';
                        } else {
                            if (loginBtn) {
                                loginBtn.disabled = false;
                                loginBtn.innerHTML = 'Login';
                            }
                            throw new Error(reqData.error);
                        }
                    } catch (err) {
                        if (loginBtn) {
                            loginBtn.disabled = false;
                            loginBtn.innerHTML = 'Login';
                        }
                        loginMessage.textContent = 'Activation failed to start. Please try again.';
                        loginMessage.style.color = 'var(--danger)';
                    }
                } else {
                    if (loginBtn) {
                        loginBtn.disabled = false;
                        loginBtn.innerHTML = 'Login';
                    }
                    // Other errors (e.g., invalid credentials)
                    loginMessage.textContent = data.error || (window.translations && window.translations['login_failed_generic'] && window.translations['login_failed_generic'][window.currentLanguage]) || 'Login failed. Please try again.';
                    loginMessage.style.color = 'var(--danger)';
                    loginMessage.style.display = 'block';
                }
            } catch (error) {
                if (loginBtn) {
                    loginBtn.disabled = false;
                    loginBtn.innerHTML = 'Login';
                }
                console.error('Error during login:', error);
                loginMessage.textContent = (window.translations && window.translations['unexpected_error_occurred'] && window.translations['unexpected_error_occurred'][window.currentLanguage]) || 'An unexpected error occurred. Please try again later.';
                loginMessage.style.color = 'var(--danger)';
                loginMessage.style.display = 'block';
            }
        });
    }

    // Step 2: Handle OTP Verification
    const otpForm = document.getElementById('otpForm');
    if (otpForm) {
        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginForm').email.value;
            const otp = document.getElementById('otpCode').value;
            const loginMessage = document.getElementById('loginMessage');

            try {
                const res = await fetch('/api/verify-activation-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, otp })
                });
                const data = await res.json();

                if (data.success) {
                    // UI Transition to Step 3
                    window._activationToken = data.token;
                    otpForm.style.display = 'none';
                    document.getElementById('activationSetPasswordForm').style.display = 'block';
                    document.getElementById('authHeader').querySelector('h1').textContent = 'Secure Account';
                    document.getElementById('authHeader').querySelector('p').textContent = 'Set your new password to finish.';
                    loginMessage.style.display = 'none';
                } else {
                    loginMessage.textContent = data.error || 'Invalid code.';
                    loginMessage.style.color = 'var(--danger)';
                    loginMessage.style.display = 'block';
                }
            } catch (err) {
                loginMessage.textContent = 'Verification failed.';
                loginMessage.style.color = 'var(--danger)';
                loginMessage.style.display = 'block';
            }
        });
    }

    // Step 3: Handle Final Password Set
    const setPassForm = document.getElementById('activationSetPasswordForm');
    if (setPassForm) {
        setPassForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('newPass').value;
            const confirmPass = document.getElementById('confirmPass').value;
            const loginMessage = document.getElementById('loginMessage');

            // Requirement Validation
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
            if (newPassword.length < 8) {
                loginMessage.textContent = 'Password must be at least 8 characters long.';
                loginMessage.style.color = 'var(--danger)';
                loginMessage.style.display = 'block';
                return;
            }
            if (!passwordRegex.test(newPassword)) {
                loginMessage.textContent = 'Password must contain at least one uppercase letter, one lowercase letter, and one number.';
                loginMessage.style.color = 'var(--danger)';
                loginMessage.style.display = 'block';
                return;
            }
            if (newPassword !== confirmPass) {
                loginMessage.textContent = 'Passwords do not match.';
                loginMessage.style.color = 'var(--danger)';
                loginMessage.style.display = 'block';
                return;
            }

            const btn = setPassForm.querySelector('button[type="submit"]');
            if (btn) btn.disabled = true;

            try {
                const res = await fetch('/api/complete-activation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: window._activationToken, newPassword })
                });
                const data = await res.json();

                if (data.success) {
                    // Success UI
                    document.getElementById('activationSetPasswordForm').style.display = 'none';
                    document.getElementById('authHeader').querySelector('h1').textContent = 'Account Ready!';
                    document.getElementById('authHeader').querySelector('p').textContent = 'Your security activation is complete.';
                    
                    loginMessage.textContent = ''; // Clear any previous error text
                    loginMessage.innerHTML = `
                        <div style="margin-bottom: 20px; color: var(--success); font-weight: bold;">Password set successfully!</div>
                        <a href="${data.redirect}" class="auth-btn-primary" style="display: flex; justify-content: center; align-items: center; width: 100%;">
                            Access My Account <i class="fas fa-arrow-right" style="margin-left: 10px;"></i>
                        </a>
                    `;
                    loginMessage.style.display = 'block';
                } else {
                    if (btn) btn.disabled = false;
                    loginMessage.textContent = data.error || 'Activation failed.';
                    loginMessage.style.color = 'var(--danger)';
                    loginMessage.style.display = 'block';
                }
            } catch (err) {
                if (btn) btn.disabled = false;
                loginMessage.textContent = 'An error occurred.';
                loginMessage.style.color = 'var(--danger)';
                loginMessage.style.display = 'block';
            }
        });
    }
});
