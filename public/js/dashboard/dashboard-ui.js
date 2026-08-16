/**
 * dashboard-ui.js
 * Handles general UI updates and DOM manipulations for the professional dashboard
 */

const DashboardUI = {
    /**
     * Initializes global dashboard UI listeners
     */
    init() {
        this.setupLogoutListener();
        this.setupTagInputListeners();
        this.setupSidebarActiveState();
    },

    /**
     * Sets up active state tracking for the dashboard sidebar
     */
    setupSidebarActiveState() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });
    },

    /**
     * Sets up the logout button listener
     */
    setupLogoutListener() {
        const logoutBtn = document.getElementById('logoutBtn');
        const logoutLinkSidebar = document.getElementById('logoutLinkSidebar');
        const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
        const logoutModal = document.getElementById('logoutConfirmationModal');
        
        const showConfirmModal = (e) => {
            e.preventDefault();
            if (window.DashboardModals) {
                window.DashboardModals.show('logoutConfirmationModal');
            } else if (logoutModal) {
                logoutModal.classList.remove('hidden');
                logoutModal.style.display = 'flex';
            }
        };

        const handleLogout = async () => {
            try {
                const result = await window.DashboardAPI.logout();
                if (result.success) {
                    window.location.href = '/login.html';
                } else {
                    const msg = (window.translations?.logout_failed && window.translations.logout_failed[window.currentLanguage]) || 'Logout failed. Please try again.';
                    this.showToast(msg, 'error');
                }
            } catch (error) {
                console.error('Logout error:', error);
                const msg = (window.translations?.logout_error && window.translations.logout_error[window.currentLanguage]) || 'An error occurred during logout.';
                this.showToast(msg, 'error');
            }
        };

        if (logoutBtn) logoutBtn.addEventListener('click', showConfirmModal);
        if (logoutLinkSidebar) logoutLinkSidebar.addEventListener('click', showConfirmModal);
        if (confirmLogoutBtn) confirmLogoutBtn.addEventListener('click', handleLogout);
    },

    /**
     * Updates the dashboard greeting based on time of day
     * @param {Object} user 
     */
    updateGreeting(user) {
        if (user) {
            window.currentUser = user; // Ensure global user is set
            const userName = document.getElementById('userName');
            const userMenuName = document.getElementById('userMenuName');
            const userMenuEmail = document.getElementById('userMenuEmail');
            
            const name = user.first_name || user.firstName || (window.translations?.professional_fallback_name?.[window.currentLanguage] || 'Professional');
            if (userName) userName.textContent = name;
            if (userMenuName) userMenuName.textContent = name;
            if (userMenuEmail) userMenuEmail.textContent = user.email || '';

            // Update Avatar Initial
            const avatar = document.getElementById('userAvatar');
            const menuInitials = document.getElementById('userMenuInitials');
            const mobileAvatar = document.getElementById('mobileUserAvatar');
            const firstChar = name.charAt(0).toUpperCase();
            if (avatar) avatar.textContent = firstChar;
            if (menuInitials) menuInitials.textContent = firstChar;
            if (mobileAvatar) mobileAvatar.textContent = firstChar;

            // Update Sidebar Status via Profile module if available
            if (window.DashboardProfile && typeof window.DashboardProfile.updateSidebar === 'function') {
                window.DashboardProfile.updateSidebar(user);
                window.DashboardProfile.initSettings(user);
            }
        }
        
        const welcomeGreetingText = document.getElementById('welcomeGreetingText');
        if (!welcomeGreetingText) return;

        const now = new Date();
        const hour = now.getHours();
        const lang = window.currentLanguage || localStorage.getItem('hirlyLang') || 'en';
        const t = window.translations || {};
        
        let greetingKey = 'good_morning';
        if (hour >= 12 && hour < 17) greetingKey = 'good_afternoon';
        else if (hour >= 17 || hour < 5) greetingKey = 'good_evening';

        // Update the key and re-apply translations to this element
        welcomeGreetingText.setAttribute('data-lang-key', greetingKey);
        
        const greetingText = (t[greetingKey] && t[greetingKey][lang]) || (t['welcome_back'] && t['welcome_back'][lang]) || (window.translations?.welcome_back?.[lang] || 'Welcome back,');
        
        // Add name to greeting if we have it
        const name = user?.first_name || user?.firstName || '';
        welcomeGreetingText.textContent = `${greetingText}${name ? ', ' + name : ''}`;
    },

    /**
     * Updates profile completeness bar and percentage
     * @param {number} percentage 
     */
    updateProfileCompleteness(percentage) {
        const percentText = document.getElementById('profileCompletenessPercent');
        const optimizerScoreText = document.getElementById('optimizerScoreText');
        const scoreText = `${percentage}%`;
        
        if (percentText) percentText.textContent = scoreText;
        if (optimizerScoreText) optimizerScoreText.textContent = scoreText;
        
        // The main progress bar
        const bar = document.getElementById('profileCompletenessBar');
        const optimizerBar = document.getElementById('optimizerScoreBar');
        
        if (bar) bar.style.width = scoreText;
        if (optimizerBar) optimizerBar.style.width = scoreText;

        // Update missing field indicators on cards
        if (window.currentUser) {
            this.updateMissingFieldIndicators(window.currentUser);
        }
    },

    /**
     * Calculates and updates missing fields for profile cards
     * @param {Object} user 
     */
    updateMissingFieldIndicators(user) {
        const u = { ...(user || {}), ...(user && user.profile ? user.profile : {}) };
        
        // 1. Personal Info Fields
        // Fields: First Name, Last Name, Phone, City, Country, Birthdate, Profile Picture
        const personalFields = [
            'first_name', 'last_name', 'phone', 'city', 'country', 'birthdate', 'profile_picture_url'
        ];
        let personalMissing = 0;
        personalFields.forEach(f => {
            if (!u[f] && !u[f.replace(/_([a-z])/g, (g) => g[1].toUpperCase())]) personalMissing++;
        });

        const personalBadge = document.getElementById('personalInfoMissingBadge');
        const personalCount = document.getElementById('personalInfoMissingCount');
        if (personalBadge && personalCount) {
            personalCount.textContent = personalMissing;
            personalBadge.classList.toggle('hidden', personalMissing === 0);
        }

        // 2. Professional Info Fields
        // Fields: Current Status, Profession (if not student), Bio, Website, CV, Skills, Interested Professions
        let profMissing = 0;
        
        // Status
        if (!u.current_status && !u.currentStatus) profMissing++;
        
        // Profession (if not student)
        const isStudent = (u.current_status || u.currentStatus) === 'Student';
        if (!isStudent && !u.profession) profMissing++;
        
        // Bio
        if (!u.bio || String(u.bio).trim().length < 20) profMissing++;
        
        // Website
        if (!u.website_link && !u.websiteLink) profMissing++;
        
        // CV
        if (!u.cv_path && !u.cvPath) profMissing++;
        
        // Skills
        const skills = u.skills;
        const hasSkills = Array.isArray(skills) ? skills.length > 0 : (skills && String(skills).trim().length > 0);
        if (!hasSkills) profMissing++;
        
        // Interested Professions
        let interests = u.interested_professions || u.interestedProfessions;
        if (typeof interests === 'string') {
            try { interests = JSON.parse(interests); } catch (e) { interests = []; }
        }
        if (!interests || !Array.isArray(interests) || interests.length === 0) profMissing++;

        const profBadge = document.getElementById('professionalInfoMissingBadge');
        const profCount = document.getElementById('professionalInfoMissingCount');
        if (profBadge && profCount) {
            profCount.textContent = profMissing;
            profBadge.classList.toggle('hidden', profMissing === 0);
        }

        // 3. Education Info
        let eduMissing = 0;

        let history = u.education_history || u.educationHistory;
        if (typeof history === 'string') {
            try { history = JSON.parse(history); } catch (e) { history = []; }
        }
        
        // If they are a student, check student fields
        if (isStudent) {
            if (!u.student_type) eduMissing++;
            if (u.student_type === 'University' && !u.university_year) eduMissing++;
            if (u.student_type === 'School' && !u.school_grade) eduMissing++;
            
            // For students, we also encourage adding at least one degree/history
            if (!history || !Array.isArray(history) || history.length === 0) {
                if (u.student_type === 'University') eduMissing++;
            }
        } else {
            // If not a student, they need education history
            if (!history || !Array.isArray(history) || history.length === 0) {
                eduMissing++;
            }
        }

        const eduBadge = document.getElementById('educationInfoMissingBadge');
        const eduCount = document.getElementById('educationInfoMissingCount');
        if (eduBadge && eduCount) {
            eduCount.textContent = eduMissing;
            eduBadge.classList.toggle('hidden', eduMissing === 0);
        }
    },

    /**
     * Updates the counts shown in the overview section
     * @param {Object} counts 
     */
    updateStats(counts) {
        const appsCount = document.getElementById('allApplicationsCount');
        const servicesCount = document.getElementById('servicesCount');
        const viewsCount = document.getElementById('profileViewsCount');
        
        const appsBadge = document.getElementById('applicationsBadge');

        if (appsCount) appsCount.textContent = counts.applications || 0;
        if (servicesCount) servicesCount.textContent = counts.services || 0;
        if (viewsCount) viewsCount.textContent = counts.profileViews || 0;

        if (appsBadge) {
            const count = counts.applications || 0;
            if (count > 0) {
                appsBadge.textContent = count;
                appsBadge.style.display = 'block';
            } else {
                appsBadge.style.display = 'none';
            }
        }
    },

    /**
     * Reloads services from the API and updates the UI
     */
    async loadServices() {
        if (!window.DashboardAPI || !window.DashboardServices) return;
        try {
            const response = await window.DashboardAPI.getServices();
            if (response.success) {
                window.DashboardServices.renderServices(response.data);
                this.updateStats({
                    services: response.data.length,
                    // Keep other stats if they exist
                    applications: parseInt(document.getElementById('allApplicationsCount')?.textContent || 0),
                    profileViews: parseInt(document.getElementById('profileViewsCount')?.textContent || 0),
                    employerViews: parseInt(document.getElementById('employerViewsCount')?.textContent || 0)
                });
            }
        } catch (error) {
            console.error('Error loading services:', error);
        }
    },

    /**
     * Shows/hides the loading overlay
     * @param {boolean} show 
     */
    toggleLoading(show) {
        const overlay = document.getElementById('pageLoadingOverlay');
        if (overlay) {
            if (show) overlay.classList.remove('hidden');
            else overlay.classList.add('hidden');
        }
    },

    /**
     * Opens the Profile Optimizer Drawer
     */
    openOptimizer() {
        const drawer = document.getElementById('optimizerDrawer');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (drawer) {
            drawer.classList.remove('hidden');
            setTimeout(() => {
                drawer.classList.remove('translate-x-full');
            }, 10);
        }
        
        if (overlay) {
            overlay.classList.add('is-visible');
        }
        
        this.updateOptimizerChecklist();
    },

    /**
     * Closes the Profile Optimizer Drawer
     */
    closeOptimizer() {
        const drawer = document.getElementById('optimizerDrawer');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (drawer) {
            drawer.classList.add('translate-x-full');
            setTimeout(() => {
                drawer.classList.add('hidden');
            }, 500);
        }
        
        if (overlay) {
            // Only hide overlay if mobile sidebar is also closed
            const sidebar = document.getElementById('sidebar');
            if (!sidebar || !sidebar.classList.contains('is-open')) {
                overlay.classList.remove('is-visible');
            }
        }
    },

    /**
     * Updates the checklist inside the Optimizer Drawer
     */
    updateOptimizerChecklist() {
        const container = document.getElementById('optimizerChecklist');
        if (!container || !window.currentUser) return;

        const user = window.currentUser;
        const profile = user.profile || {};
        const u = { ...user, ...profile };
        const lang = window.currentLanguage || 'en';
        
        const tasks = [];

        // --- HIGH PRIORITY ---
        // 1. CV
        if (!u.cv_path && !u.cvPath) {
            tasks.push({ key: 'upload_cv_task', priority: 'high', section: 'professional', field: 'cvEmptyState', icon: 'fa-file-pdf' });
        }
        // 2. Profile Pic
        if (!u.profile_picture_url) {
            tasks.push({ key: 'add_profile_pic_task', priority: 'high', section: 'personal', field: 'changePhotoBtn', icon: 'fa-image' });
        }
        // 3. Skills
        const skills = u.skills;
        const hasSkills = Array.isArray(skills) ? skills.length > 0 : (skills && String(skills).trim().length > 0);
        if (!hasSkills) {
            tasks.push({ key: 'add_skills_task', priority: 'high', section: 'professional', field: 'newSkillInput', icon: 'fa-bolt' });
        }
        // 4. Bio
        const bioText = String(u.bio || '').trim();
        if (bioText.length < 20) {
            tasks.push({ key: 'write_bio_task', priority: 'high', section: 'professional', field: 'editBio', icon: 'fa-pen-nib' });
        }

        // --- MEDIUM PRIORITY ---
        // 5. Education
        let history = u.education_history || u.educationHistory;
        if (typeof history === 'string') {
            try { history = JSON.parse(history); } catch (e) { history = []; }
        }
        if (!history || history.length === 0) {
            tasks.push({ key: 'add_education_task', priority: 'medium', section: 'education', field: 'addEducationBtn', icon: 'fa-graduation-cap' });
        }
        // 6. City
        if (!u.city || !u.country) {
            tasks.push({ key: 'add_city_task', priority: 'medium', section: 'personal', field: 'editCity', icon: 'fa-location-dot' });
        }
        // 7. Personal Details (Birthdate)
        if (!u.birthdate) {
            tasks.push({ key: 'complete_personal_task', priority: 'medium', section: 'personal', field: 'editBirthdate', icon: 'fa-user-check' });
        }

        // --- LOW PRIORITY ---
        // 8. Website (Only suggest if no website AND bio is not long enough to cover the presence score)
        if (!u.website_link && !u.websiteLink && bioText.length < 50) {
            tasks.push({ key: 'add_website_task', priority: 'low', section: 'professional', field: 'editWebsite', icon: 'fa-globe' });
        }
        // 9. Services (Suggest if Freelancing/Working)
        const status = u.current_status || u.currentStatus || '';
        const isFreelancer = status === 'Freelancing' || status === 'Working';
        if (isFreelancer && (!window.userServicesCount || window.userServicesCount === 0)) {
            tasks.push({ key: 'add_services_task', priority: 'low', section: 'services', field: 'addServiceBtn', icon: 'fa-concierge-bell' });
        }

        // Render tasks
        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="p-8 text-center bg-emerald-50 rounded-[32px] border border-emerald-100 shadow-sm">
                    <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm mx-auto mb-4">
                        <i class="fa-solid fa-crown text-2xl"></i>
                    </div>
                    <h3 class="text-sm font-black text-emerald-900 uppercase tracking-widest" data-lang-key="all_tasks_done">${window.translations?.['all_tasks_done']?.[lang] || 'Elite Profile Status'}</h3>
                    <p class="text-[10px] text-emerald-600 font-bold mt-2 opacity-70" data-lang-key="profile_perfect_desc">${window.translations?.['profile_perfect_desc']?.[lang] || 'Your profile is fully optimized for maximum visibility.'}</p>
                </div>
            `;
            return;
        }

        // Sort tasks by priority: high -> medium -> low
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        container.innerHTML = tasks.map(task => {
            const styles = {
                high: {
                    bg: 'bg-rose-50',
                    text: 'text-rose-500',
                    border: 'border-rose-100',
                    badge: 'bg-rose-500 text-white'
                },
                medium: {
                    bg: 'bg-amber-50',
                    text: 'text-amber-500',
                    border: 'border-amber-100',
                    badge: 'bg-amber-500 text-white'
                },
                low: {
                    bg: 'bg-emerald-50',
                    text: 'text-emerald-500',
                    border: 'border-emerald-100',
                    badge: 'bg-emerald-500 text-white'
                }
            };
            
            const s = styles[task.priority];
            
            return `
                <div class="p-4 bg-white border border-slate-100 rounded-[24px] flex items-center justify-between group hover:border-slate-300 transition-all cursor-pointer shadow-sm hover:shadow-md" onclick="window.DashboardUI.fixProfileTask('${task.section}', '${task.field}')">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-lg shadow-sm border ${s.bg} ${s.text} ${s.border} group-hover:scale-105 transition-transform">
                            <i class="fa-solid ${task.icon}"></i>
                        </div>
                        <div>
                            <h5 class="text-xs font-black text-slate-700" data-lang-key="${task.key}">${window.translations?.[task.key]?.[lang] || this.formatTaskKey(task.key)}</h5>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="text-[8px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full ${s.badge}" data-lang-key="${task.priority}">${window.translations?.[task.priority]?.[lang] || task.priority}</span>
                                <span class="text-[8px] font-bold text-slate-400 uppercase tracking-widest" data-lang-key="${task.section}_section">${window.translations?.[task.section + '_section']?.[lang] || task.section}</span>
                            </div>
                        </div>
                    </div>
                    <div class="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all">
                        <i class="fa-solid fa-chevron-right text-[10px]"></i>
                    </div>
                </div>
            `;
        }).join('');
    },

    formatTaskKey(key) {
        return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    },

    fixProfileTask(sectionId, fieldId) {
        this.closeOptimizer();
        
        // Find the sidebar nav item and click it
        const navItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
        if (navItem) {
            navItem.click();
            
            // Wait for section to be visible then focus/scroll to field
            setTimeout(() => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // Add a pulse effect to the field
                    field.classList.add('ring-4', 'ring-emerald-400/20', 'border-emerald-400');
                    setTimeout(() => {
                        field.classList.remove('ring-4', 'ring-emerald-400/20', 'border-emerald-400');
                    }, 2000);
                    
                    if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
                        field.focus();
                    }
                }
            }, 300);
        }
    },

    /**
     * Generic function to show a toast message (if global showToast exists)
     * @param {string} message 
     * @param {string} type 
     */
    showToast(message, type = 'info') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            if (type === 'error') alert(message);
        }
    },

    /**
     * Renders skill tags in the professional info modal
     * @param {string|Array} skills 
     */
    renderSkillTags(skills) {
        const list = document.getElementById('skillsList');
        if (!list) return;
        
        list.innerHTML = '';
        const skillArray = Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []);
        
        skillArray.forEach(skill => {
            if (skill) this.addTagToUI(list, skill, 'skill');
        });
    },

    /**
     * Renders interest tags in the professional info modal
     * @param {string|Array} interests 
     */
    renderInterestTags(interests) {
        const list = document.getElementById('interestedProfessionsList');
        if (!list) return;
        
        list.innerHTML = '';
        const interestArray = Array.isArray(interests) ? interests : (interests ? interests.split(',').map(i => i.trim()) : []);
        
        interestArray.forEach(interest => {
            if (interest) this.addTagToUI(list, interest, 'interest');
        });
    },

    /**
     * Helper to add a tag to the UI
     * @param {HTMLElement} container 
     * @param {string} text 
     * @param {string} type 'skill' or 'interest'
     */
    addTagToUI(container, text, type) {
        const tag = document.createElement('div');
        tag.setAttribute('data-tag-value', text);
        tag.className = 'flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 font-bold rounded-xl text-xs border border-slate-100 group transition-all hover:bg-slate-100';
        
        if (type === 'skill') {
            tag.className = 'flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-xl text-xs border border-emerald-100 group transition-all hover:bg-emerald-100';
        }
        
        tag.innerHTML = `
            <span>${text}</span>
            <button type="button" class="text-slate-300 group-hover:text-rose-500 transition-colors" onclick="this.parentElement.remove()">
                <i class="fas fa-times-circle"></i>
            </button>
            <input type="hidden" name="${type === 'skill' ? 'skills[]' : 'interested_professions[]'}" value="${text}">
        `;
        container.appendChild(tag);
    },

    /**
     * Sets up tag input listeners for skills and interests
     */
    setupTagInputListeners() {
        const skillsInput = document.getElementById('skillsInput');
        const addSkillBtn = document.getElementById('addSkillBtn');
        const interestsInput = document.getElementById('interestedProfessionsInput');
        
        const handleAddSkill = () => {
            const val = skillsInput.value.trim();
            if (val) {
                this.addTagToUI(document.getElementById('skillsList'), val, 'skill');
                skillsInput.value = '';
                skillsInput.focus();
            }
        };

        if (skillsInput) {
            skillsInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                }
            });
        }

        if (addSkillBtn) {
            addSkillBtn.addEventListener('click', (e) => {
                e.preventDefault();
                handleAddSkill();
            });
        }
        
        if (interestsInput) {
            interestsInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = interestsInput.value.trim();
                    if (val) {
                        this.addTagToUI(document.getElementById('interestedProfessionsList'), val, 'interest');
                        interestsInput.value = '';
                    }
                }
            });
        }
    },

    /**
     * Gets current tags from a list as an array of strings
     * @param {string} listId 
     * @returns {Array<string>}
     */
    getTags(listId) {
        const list = document.getElementById(listId);
        if (!list) return [];
        return Array.from(list.querySelectorAll('[data-tag-value]')).map(el => el.getAttribute('data-tag-value'));
    }
};

window.DashboardUI = DashboardUI;

// Listen for language changes to update dynamic elements like greetings
window.addEventListener('translationsApplied', () => {
    if (window.currentUser) {
        window.DashboardUI.updateGreeting(window.currentUser);
    } else {
        window.DashboardUI.updateGreeting();
    }
});
