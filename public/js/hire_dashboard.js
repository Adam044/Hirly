document.addEventListener('DOMContentLoaded', function() {
    // Introduction Modal Logic
    const introductionModal = document.getElementById('introductionModal');
    const introSteps = document.querySelectorAll('.intro-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const dots = document.querySelectorAll('.dot');
    const introPrevBtn = document.getElementById('introPrevBtn');
    const introNextBtn = document.getElementById('introNextBtn');
    const introFinishBtn = document.getElementById('introFinishBtn');
    const skipIntroBtn = document.getElementById('skipIntroBtn');

    let currentStep = 1;
    const totalSteps = introSteps.length;
    // DOM Elements - User Profile
    const userNameSpan = document.getElementById('userNameSidebar');
    const employerProfileSection = document.getElementById('employerProfileSection');
    const personalDetailsLinkSidebar = document.getElementById('personalDetailsLinkSidebar');
    const employerProfileForm = document.getElementById('employerProfileForm');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const cityInput = document.getElementById('city');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    // DOM Elements - Company Profile
    const companyDetailsSection = document.getElementById('companyDetailsSection');
    const companyProfileForm = document.getElementById('companyProfileForm');
    const companyNameInput = document.getElementById('companyName');
    const companyDescriptionInput = document.getElementById('companyDescription');
    const addressInput = document.getElementById('address');
    const companyEmailInput = document.getElementById('companyEmail');
    const companyPhoneInput = document.getElementById('companyPhone');
    const companyCategoryDropdown = document.getElementById('companyCategoryDropdown');
    const companyCategoryToggleButton = document.getElementById('companyCategoryToggleButton');
    const companySelectedCategoryDisplay = document.getElementById('companySelectedCategoryDisplay');
    const companyCategoryCheckboxes = document.getElementById('companyCategoryCheckboxes');
    const otherCompanyCategoryInputGroup = document.querySelector('#companyCategoryList .other-category-input-group');
    const otherCompanyCategoryInput = document.getElementById('otherCompanyCategoryInput');
    const companyCategoryHiddenInput = document.getElementById('companyCategoryHidden');

    const editCompanyBtn = document.getElementById('editCompanyBtn');
    const saveCompanyBtn = document.getElementById('saveCompanyBtn');
    const cancelCompanyEditBtn = document.getElementById('cancelCompanyEditBtn');

    // Company Logo Elements
    const userAvatarHeaderImg = document.getElementById('userAvatarHeaderImg');
    const userAvatarHeaderText = document.getElementById('userAvatarHeaderText');
    const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');
    const sidebarUserAvatarImg = document.getElementById('sidebarUserAvatarImg');
    const sidebarUserAvatarText = document.getElementById('sidebarUserAvatarText');
    const companyLogoPreview = document.getElementById('companyLogoPreview');
    const companyLogoPlaceholder = document.getElementById('companyLogoPlaceholder');
    const companyLogoFile = document.getElementById('companyLogoFile');
    const companyLogoFileNameDisplay = document.getElementById('companyLogoFileNameDisplay');
    const uploadCompanyLogoBtn = document.getElementById('uploadCompanyLogoBtn');
    const removeCompanyLogoBtn = document.getElementById('removeCompanyLogoBtn');
    const logoMessage = document.getElementById('logoMessage');

    // Dashboard Stats
    const totalPostedJobsSpan = document.getElementById('totalPostedJobs');
    const activeJobsSpan = document.getElementById('activeJobs');
    const totalApplicationsSpan = document.getElementById('totalApplications');
    const hiredFreelancersSpan = document.getElementById('hiredFreelancers');

    // Posted Jobs Section
    const postedJobsListDiv = document.getElementById('postedJobsList');
    const noJobsMessageDiv = document.getElementById('noJobsMessage');

    // Post Job Button
    const postJobBtn = document.getElementById('postJobBtn');
    const postJobBtn2 = document.getElementById('postJobBtn2');
    const browseProfessionsBtn = document.getElementById('browseProfessionsBtn');
    const viewPublicProfileBtn = document.getElementById('viewPublicProfileBtn');

    // Reopen Job Modal Elements
    const reopenJobModal = document.getElementById('reopenJobModal');
    const closeReopenJobModalBtn = document.getElementById('closeReopenJobModalBtn');
    const cancelReopenJobBtn = document.getElementById('cancelReopenJobBtn');
    const confirmReopenJobBtn = document.getElementById('confirmReopenJobBtn');
    const deadlineInputSection = document.getElementById('deadlineInputSection');
    const newJobDeadlineInput = document.getElementById('newJobDeadline');
    const deadlineErrorDisplay = document.getElementById('deadlineError');

    // Sidebar Links for active state management
    const dashboardLink = document.getElementById('dashboardLink');
    const profileLink = document.getElementById('profileLink');
    const companyLink = document.getElementById('companyLink');
    const companyDetailsLinkSidebar = document.getElementById('companyDetailsLinkSidebar');
    const postedJobsLink = document.getElementById('postedJobsLink');
    const logoutLinkSidebar = document.getElementById('logoutLinkSidebar');

    let currentEmployerType = 'individual';
    let currentActiveJobsCount = 0;
    let currentEmployerId = null;
    let selectedCompanyCategory = null;
    let isOtherCategorySelected = false;

    const sidebarAvatar = document.getElementById('sidebarUserAvatar');

    // Job posting is now unlimited for everyone.


    let companyCategories = [];
    if (window.globalCategoriesAndProfessions) {
        companyCategories = window.globalCategoriesAndProfessions;
    } else {
        console.warn("window.globalCategoriesAndProfessions is not defined. Ensure categories-professions-translations.js is loaded correctly.");
    }

    let palestinianCities = [];
    if (window.palestinianCitiesTranslations) {
        palestinianCities = Object.keys(window.palestinianCitiesTranslations).map(key => ({
            key: key,
            ar: window.palestinianCitiesTranslations[key].ar,
            en: window.palestinianCitiesTranslations[key].en
        })).sort((a, b) => {
            const nameA = a[window.currentLanguage] || a.en;
            const nameB = b[window.currentLanguage] || b.en;
            return nameA.localeCompare(nameB);
        });
    } else {
        console.warn("window.palestinianCitiesTranslations is not defined. Ensure cities-translations.js is loaded correctly.");
        palestinianCities = [
            "Abasan al-Kabira", "Abu Dis", "Bani Na'im", "Bani Suheila", "Beit Hanoun",
            "Beit Jala", "Beit Lahia", "Beit Sahour", "Beit Ummar", "Beitunia", "Bethlehem",
            "al-Bireh", "Deir al-Balah", "ad-Dhahiriya", "Dura", "Gaza City", "Halhul",
            "Hebron", "Idhna", "Jabalia", "Jenin", "Jericho", "Jerusalem",
            "Khan Yunis", "Nablus", "Qabatiya", "Qalqilya", "Rafah", "Ramallah",
            "Sa'ir", "as-Samu", "Surif", "Tubas", "Tulkarm", "Ya'bad",
            "al-Yamun", "Yatta", "az-Zawayda"
        ].sort().map(city => ({ en: city, ar: city }));
    }

    const pageLoadingOverlay = document.getElementById('pageLoadingOverlay');
    let initialLoadCompleted = false;

    async function performInitialLoad() {
        if (pageLoadingOverlay && !initialLoadCompleted) pageLoadingOverlay.classList.add('show');
        await loadUserData();
        await loadEmployerJobs();
        setPersonalProfileFormReadonly(true);
        setCompanyProfileFormReadonly(true);
        setInitialActiveSidebarLink();
        if (pageLoadingOverlay) pageLoadingOverlay.classList.remove('show');
        initialLoadCompleted = true;
    }

    // --- Helper Functions ---
    function formatDate(dateString) {
        if (!dateString) return (window.translations && window.translations['n_a'] && window.translations['n_a'][window.currentLanguage]) || 'N/A';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(window.currentLanguage, options);
    }

    function populateCityDropdown(currentCity = null) {
        if (!cityInput || !window.currentLanguage) return;

        cityInput.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = (window.translations && window.translations['select_your_city'] && window.translations['select_your_city'][window.currentLanguage]) || 'Select your city';
        defaultOption.selected = true;
        cityInput.appendChild(defaultOption);

        palestinianCities.forEach(city => {
            const optionElement = document.createElement('option');
            optionElement.value = city.en;
            optionElement.textContent = city[window.currentLanguage] || city.en;
            if (city.en === currentCity) {
                optionElement.selected = true;
            }
            cityInput.appendChild(optionElement);
        });
    }

    function populateCompanyCategories(currentCategory = null) {
        if (!companyCategoryCheckboxes || !window.currentLanguage) return;

        companyCategoryCheckboxes.innerHTML = '';
        const fragment = document.createDocumentFragment();

        const enterCustomCategoryPlaceholder = (window.translations && window.translations['enter_custom_category_placeholder'] && window.translations['enter_custom_category_placeholder'][window.currentLanguage]) || 'Enter custom category';

        const sortedCategories = [...companyCategories].sort((a, b) => {
            const nameA = a.name[window.currentLanguage] || a.name.en;
            const nameB = b.name[window.currentLanguage] || b.name.en;
            return nameA.localeCompare(nameB);
        });

        sortedCategories.forEach(category => {
            const categoryNameTranslated = category.name[window.currentLanguage] || category.name.en;
            const label = document.createElement('label');
            label.className = 'profession-item';
            label.innerHTML = `
                <input type="radio" name="companyIndustryCategory" value="${category.name.en}" ${currentCategory === category.name.en ? 'checked' : ''}>
                <i class="${category.icon} profession-icon"></i> <span>${categoryNameTranslated}</span>
            `;
            label.querySelector('input').addEventListener('change', handleCompanyCategoryRadioChange);
            fragment.appendChild(label);
        });

        const otherLabel = document.createElement('label');
        otherLabel.className = 'profession-item';
        const isCurrentCategoryOther = currentCategory && !companyCategories.some(cat => cat.name.en === currentCategory);
        otherLabel.innerHTML = `
            <input type="radio" name="companyIndustryCategory" value="Other" ${isCurrentCategoryOther ? 'checked' : ''}>
            <i class="fas fa-ellipsis-h profession-icon"></i> <span>${(window.translations && window.translations['other'] && window.translations['other'][window.currentLanguage]) || 'Other'}</span>
        `;
        otherLabel.querySelector('input').addEventListener('change', handleCompanyCategoryRadioChange);
        fragment.appendChild(otherLabel);

        companyCategoryCheckboxes.appendChild(fragment);

        if (isCurrentCategoryOther) {
            selectedCompanyCategory = currentCategory;
            isOtherCategorySelected = true;
            if (otherCompanyCategoryInput) otherCompanyCategoryInput.value = currentCategory;
            if (otherCompanyCategoryInputGroup) otherCompanyCategoryInputGroup.style.display = 'block';
            if (companyCategoryHiddenInput) companyCategoryHiddenInput.value = currentCategory;
        } else {
            selectedCompanyCategory = currentCategory;
            isOtherCategorySelected = false;
            if (otherCompanyCategoryInputGroup) otherCompanyCategoryInputGroup.style.display = 'none';
            if (companyCategoryHiddenInput) companyCategoryHiddenInput.value = currentCategory || '';
        }

        if (otherCompanyCategoryInput) {
            otherCompanyCategoryInput.placeholder = enterCustomCategoryPlaceholder;
        }

        updateCompanySelectedCategoryDisplay();
    }

    function handleCompanyCategoryRadioChange(event) {
        const selectedValue = event.target.value;
        if (selectedValue === "Other") {
            isOtherCategorySelected = true;
            selectedCompanyCategory = otherCompanyCategoryInput ? otherCompanyCategoryInput.value : '';
            if (otherCompanyCategoryInputGroup) {
                otherCompanyCategoryInputGroup.style.display = 'block';
                if (otherCompanyCategoryInput) {
                    if (!otherCompanyCategoryInput.readOnly) {
                        otherCompanyCategoryInput.setAttribute('required', 'true');
                    }
                    otherCompanyCategoryInput.focus();
                }
            }
        } else {
            isOtherCategorySelected = false;
            selectedCompanyCategory = selectedValue;
            if (otherCompanyCategoryInputGroup) {
                otherCompanyCategoryInputGroup.style.display = 'none';
                if (otherCompanyCategoryInput) otherCompanyCategoryInput.removeAttribute('required');
            }
        }
        companyCategoryHiddenInput.value = selectedCompanyCategory;
        updateCompanySelectedCategoryDisplay();
        companyCategoryDropdown.classList.remove('active');
        companyCategoryToggleButton.setAttribute('aria-expanded', 'false');
    }

    if (otherCompanyCategoryInput) {
        otherCompanyCategoryInput.addEventListener('input', (event) => {
            if (isOtherCategorySelected) {
                selectedCompanyCategory = event.target.value;
                companyCategoryHiddenInput.value = selectedCompanyCategory;
                updateCompanySelectedCategoryDisplay();
            }
        });
    }

    function updateCompanySelectedCategoryDisplay() {
        if (!companySelectedCategoryDisplay || !window.translations || !window.currentLanguage) return;

        const selectIndustryCategoryDisplay = (window.translations && window.translations['select_industry_category_display'] && window.translations['select_industry_category_display'][window.currentLanguage]) || 'Select Industry/Category';
        const otherText = (window.translations && window.translations['other'] && window.translations['other'][window.currentLanguage]) || 'Other';

        let displayText = selectIndustryCategoryDisplay;
        let displayIcon = 'fas fa-chevron-down';

        if (selectedCompanyCategory) {
            const category = companyCategories.find(cat => cat.name.en === selectedCompanyCategory);
            if (category) {
                displayText = category.name[window.currentLanguage] || category.name.en;
                displayIcon = category.icon;
            } else if (isOtherCategorySelected) {
                displayText = selectedCompanyCategory;
                displayIcon = 'fas fa-ellipsis-h';
            } else {
                displayText = selectedCompanyCategory;
                displayIcon = 'fas fa-info-circle';
            }
        }
        companySelectedCategoryDisplay.innerHTML = `<i class="${displayIcon} profession-icon"></i> <span>${displayText}</span>`;
    }

    // --- Sidebar Active State Management (Scroll-based) ---
    const sidebarNavLinksUl = document.getElementById('sidebarNavLinks');
    const sections = document.querySelectorAll('.dashboard-section');
    const sidebarScrollLinks = sidebarNavLinksUl ? sidebarNavLinksUl.querySelectorAll('a.scroll-link') : [];

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50% 0px',
        threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const targetId = entry.target.id;
                sidebarScrollLinks.forEach(link => link.classList.remove('active'));
                const activeLink = document.querySelector(`.sidebar-nav a.scroll-link[href="#${targetId}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        sectionObserver.observe(section);
    });

    function setInitialActiveSidebarLink() {
        const currentHash = window.location.hash;
        if (currentHash) {
            const targetElement = document.getElementById(currentHash.substring(1));
            if (targetElement) {
                setTimeout(() => {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }, 100);
                sidebarScrollLinks.forEach(link => link.classList.remove('active'));
                const activeLink = document.querySelector(`.sidebar-nav a.scroll-link[href$="${currentHash}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        } else {
            if (dashboardLink) {
                sidebarScrollLinks.forEach(link => link.classList.remove('active'));
                dashboardLink.classList.add('active');
            }
        }
    }

    if (sidebarNavLinksUl) {
        sidebarNavLinksUl.querySelectorAll('a.scroll-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                    sidebarScrollLinks.forEach(l => l.classList.remove('active'));
                    this.classList.add('active');
                    history.pushState(null, '', this.getAttribute('href'));
                }
            });
        });
    }

    // --- Logout Button Logic ---
    const logoutConfirmModal = document.getElementById('logoutConfirmModal');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');

    if (logoutLinkSidebar) {
        logoutLinkSidebar.addEventListener('click', (e) => {
            e.preventDefault();
            if (logoutConfirmModal && typeof window.showModal === 'function') {
                window.showModal(logoutConfirmModal);
            } else if (typeof window.showConfirmModal === 'function') {
                window.showConfirmModal(
                    (window.translations && window.translations['confirm_logout_title'] && window.translations['confirm_logout_title'][window.currentLanguage]) || 'Confirm Logout',
                    (window.translations && window.translations['confirm_logout_message'] && window.translations['confirm_logout_message'][window.currentLanguage]) || 'Are you sure you want to log out?',
                    window.handleLogout,
                    null,
                    (window.translations && window.translations['yes_logout'] && window.translations['yes_logout'][window.currentLanguage]) || 'Yes, Logout',
                    'btn-danger'
                );
            } else {
                 if (confirm('Are you sure you want to log out?')) {
                    if (typeof window.handleLogout === 'function') {
                        window.handleLogout();
                    } else {
                        window.location.href = '/login.html';
                    }
                }
            }
        });
    }

    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', () => {
             if (typeof window.handleLogout === 'function') {
                window.handleLogout();
            } else {
                 console.error('handleLogout function not found');
                 window.location.href = '/login.html';
            }
        });
    }

    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', () => {
             if (logoutConfirmModal && typeof window.hideModal === 'function') {
                window.hideModal(logoutConfirmModal);
            } else if (typeof window.hideConfirmModal === 'function') {
                window.hideConfirmModal();
            }
        });
    }

    // --- Reopen Job Modal Logic ---
    function showReopenJobModal(jobId, jobData) {
        if (reopenJobModal) {
            // Store job data for later use
            reopenJobModal.dataset.jobId = jobId;
            
            // Check if deadline has passed
            const currentDate = new Date();
            const deadlineDate = new Date(jobData.deadline);
            const hasDeadlinePassed = currentDate > deadlineDate;
            
            // Show/hide deadline input based on whether deadline has passed
            if (hasDeadlinePassed) {
                deadlineInputSection.style.display = 'block';
                // Set minimum date to tomorrow
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                newJobDeadlineInput.min = tomorrow.toISOString().split('T')[0];
                
                // Update modal message to indicate new deadline is required
                const modalMessage = document.getElementById('reopenJobModalMessage');
                const deadlinePassedMessage = (window.translations && window.translations['reopen_job_deadline_passed_message'] && window.translations['reopen_job_deadline_passed_message'][window.currentLanguage]) || 'The deadline for this job has passed. Please select a new deadline to reopen it.';
                modalMessage.textContent = deadlinePassedMessage;
            } else {
                deadlineInputSection.style.display = 'none';
                // Reset modal message to default
                const modalMessage = document.getElementById('reopenJobModalMessage');
                const defaultMessage = (window.translations && window.translations['reopen_job_message'] && window.translations['reopen_job_message'][window.currentLanguage]) || 'Are you sure you want to reopen this job? It will become visible for new applications.';
                modalMessage.textContent = defaultMessage;
            }
            
            // Clear any previous errors
            deadlineErrorDisplay.style.display = 'none';
            deadlineErrorDisplay.textContent = '';
            newJobDeadlineInput.value = '';
            
            window.showModal(reopenJobModal);
        }
    }

    function hideReopenJobModal() {
        if (reopenJobModal) {
            window.hideModal(reopenJobModal);
        }
    }

    function validateDeadline() {
        const selectedDate = new Date(newJobDeadlineInput.value);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        if (selectedDate < tomorrow) {
            const errorMessage = (window.translations && window.translations['deadline_must_be_future'] && window.translations['deadline_must_be_future'][window.currentLanguage]) || 'Deadline must be at least tomorrow.';
            deadlineErrorDisplay.textContent = errorMessage;
            deadlineErrorDisplay.style.display = 'block';
            return false;
        }
        
        deadlineErrorDisplay.style.display = 'none';
        deadlineErrorDisplay.textContent = '';
        return true;
    }

    // Event listeners for reopen job modal
    if (closeReopenJobModalBtn) {
        closeReopenJobModalBtn.addEventListener('click', hideReopenJobModal);
    }
    if (cancelReopenJobBtn) {
        cancelReopenJobBtn.addEventListener('click', hideReopenJobModal);
    }
    if (confirmReopenJobBtn) {
        confirmReopenJobBtn.addEventListener('click', async function() {
            const jobId = reopenJobModal.dataset.jobId;
            if (!jobId) return;
            
            // Check if deadline input is visible (meaning deadline has passed)
            const needsNewDeadline = deadlineInputSection.style.display !== 'none';
            let newDeadline = null;
            
            if (needsNewDeadline) {
                if (!validateDeadline()) {
                    return; // Don't proceed if validation fails
                }
                newDeadline = newJobDeadlineInput.value;
            }
            
            // Hide modal first
            hideReopenJobModal();
            
            // Perform the job status toggle
            await performJobStatusToggle(jobId, newDeadline);
        });
    }
    if (reopenJobModal) {
        reopenJobModal.addEventListener('click', (event) => {
            if (event.target === reopenJobModal) {
                hideReopenJobModal();
            }
        });
    }

    // --- Introduction Modal Logic ---
    function showIntroductionModal() {
        const introductionModal = document.getElementById('introductionModal');
        if (introductionModal) {
            window.showModal(introductionModal);
            initIntroEventListeners(); // Re-initialize to ensure listeners are bound
        }
    }

    function checkAndShowIntro() {
        const introductionModal = document.getElementById('introductionModal');
        if (!introductionModal) return;

        // Versioned key to reset for v4 slides (Welcome + 4 features)
        const introVersion = 'v4'; 
        const hasSeenIntro = localStorage.getItem(`hasSeenHireDashboardIntro_${introVersion}`);

        if (!hasSeenIntro) {
            const slides = document.querySelectorAll('.intro-slide');
            if (slides.length > 0) {
                goToStep(1);
                showIntroductionModal();
            }
        } else {
            if (introductionModal) {
                window.hideModal(introductionModal);
            }
        }
    }

    function goToStep(stepNumber) {
        const totalSlides = 5;
        currentStep = Math.max(1, Math.min(stepNumber, totalSlides));

        // Update Slides
        document.querySelectorAll('.intro-slide').forEach(slide => {
            slide.classList.remove('active');
        });
        const targetSlide = document.getElementById(`introStep${currentStep}`);
        if (targetSlide) targetSlide.classList.add('active');

        // Update Dots
        document.querySelectorAll('.v3-dot').forEach(dot => {
            dot.classList.toggle('active', parseInt(dot.dataset.step) === currentStep);
        });

        // Update Buttons
        const prevBtn = document.getElementById('introPrevBtn');
        const nextBtn = document.getElementById('introNextBtn');
        const finishBtn = document.getElementById('introFinishBtn');

        if (prevBtn) {
            prevBtn.style.visibility = currentStep > 1 ? 'visible' : 'hidden';
        }

        if (currentStep === totalSlides) {
            if (nextBtn) nextBtn.style.display = 'none';
            if (finishBtn) finishBtn.style.display = 'flex';
        } else {
            if (nextBtn) nextBtn.style.display = 'flex';
            if (finishBtn) finishBtn.style.display = 'none';
        }
    }

    function initIntroEventListeners() {
        const skipIntroBtn = document.getElementById('skipIntroBtn');
        const introNextBtn = document.getElementById('introNextBtn');
        const introPrevBtn = document.getElementById('introPrevBtn');
        const introFinishBtn = document.getElementById('introFinishBtn');
        const dots = document.querySelectorAll('.v3-dot');

        if (skipIntroBtn && !skipIntroBtn.dataset.bound) {
            skipIntroBtn.addEventListener('click', () => {
                localStorage.setItem('hasSeenHireDashboardIntro_v4', 'true');
                window.hideModal(document.getElementById('introductionModal'));
            });
            skipIntroBtn.dataset.bound = "true";
        }

        if (introNextBtn && !introNextBtn.dataset.bound) {
            introNextBtn.addEventListener('click', () => goToStep(currentStep + 1));
            introNextBtn.dataset.bound = "true";
        }

        if (introPrevBtn && !introPrevBtn.dataset.bound) {
            introPrevBtn.addEventListener('click', () => goToStep(currentStep - 1));
            introPrevBtn.dataset.bound = "true";
        }

        if (introFinishBtn && !introFinishBtn.dataset.bound) {
            introFinishBtn.addEventListener('click', () => {
                localStorage.setItem('hasSeenHireDashboardIntro_v4', 'true');
                window.hideModal(document.getElementById('introductionModal'));
            });
            introFinishBtn.dataset.bound = "true";
        }

        dots.forEach(dot => {
            if (!dot.dataset.bound) {
                dot.addEventListener('click', () => goToStep(parseInt(dot.dataset.step)));
                dot.dataset.bound = "true";
            }
        });
    }

    // Call init initially
    initIntroEventListeners();
    
    if (postJobBtn2) {
        postJobBtn2.addEventListener('click', async (e) => {
            e.preventDefault();
            window.location.href = '/post_job.html';
        });
    }

    if (postJobBtn) {
        postJobBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            window.location.href = '/post_job.html';
        });
    }
    
    if (companyCategoryToggleButton) {
        companyCategoryToggleButton.addEventListener('click', function(event) {
            event.stopPropagation();
            companyCategoryDropdown.classList.toggle('active');
            this.setAttribute('aria-expanded', companyCategoryDropdown.classList.contains('active'));
            if (companyCategoryDropdown.classList.contains('active')) {
                populateCompanyCategories(selectedCompanyCategory);
            }
        });
    }

    document.addEventListener('click', function(event) {
        if (companyCategoryDropdown && !companyCategoryDropdown.contains(event.target) && event.target !== companyCategoryToggleButton) {
            companyCategoryDropdown.classList.remove('active');
            companyCategoryToggleButton.setAttribute('aria-expanded', 'false');
        }
    });

    // --- User Data Loading ---
    async function loadUserData() {
        // Wait for auth.js to set currentUser if it hasn't been set yet
        let retryCount = 0;
        const maxRetries = 20; // Increased retries
        
        while (!window.currentUser && retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 200)); // Wait 200ms
            retryCount++;
        }
        
        if (!window.currentUser) {
            if (typeof window.checkAuthStatus === 'function') {
                const authStatus = await window.checkAuthStatus();
                if (authStatus.isAuthenticated) {
                    window.currentUser = authStatus.user;
                }
            }
        }

        if (!window.currentUser) {
            console.error('No current user found after waiting and checking status. Attempting direct fetch...');
            // Check if another script is already redirecting to prevent multiple redirects
            if (window._isRedirecting) {
                return;
            }

            // Fallback: try to get user data directly
            try {
                const response = await fetch('/api/user', {
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    },
                    credentials: 'include'
                });
                if (!response.ok) {
                    if (response.status === 401) {
                        window._isRedirecting = true;
                        window.location.href = '/login.html';
                        return;
                    }
                    throw new Error('Failed to load user data');
                }
                const apiResponse = await response.json();
                window.currentUser = apiResponse.user;
            } catch (error) {
                console.error('Failed to fetch user data as fallback:', error);
                return;
            }
        }
        
        const userData = window.currentUser;

        const failedToFetchUserDataText = (window.translations && window.translations['failed_to_load_user_data'] && window.translations['failed_to_load_user_data'][window.currentLanguage]) || 'Failed to load user data. Please try refreshing.';
        const accessDeniedText = (window.translations && window.translations['access_denied_employer_dashboard'] && window.translations['access_denied_employer_dashboard'][window.currentLanguage]) || 'Access Denied';
        const dashboardForEmployersOnlyText = (window.translations && window.translations['dashboard_for_employers_only'] && window.translations['dashboard_for_employers_only'][window.currentLanguage]) || 'This dashboard is for Employers. You are logged in as a';
        const goToFreelancerDashboardText = (window.translations && window.translations['go_to_freelancer_dashboard'] && window.translations['go_to_freelancer_dashboard'][window.currentLanguage]) || 'Go to your Freelancer Dashboard';
        const pleaseSelectLogoFileText = (window.translations && window.translations['please_select_logo_file'] && window.translations['please_select_logo_file'][window.currentLanguage]) || 'Please select a logo file to upload.';
        const uploadingLogoText = (window.translations && window.translations['uploading_logo'] && window.translations['uploading_logo'][window.currentLanguage]) || 'Uploading logo...';
        const failedToUploadLogoText = (window.translations && window.translations['failed_to_upload_logo'] && window.translations['failed_to_upload_logo'][window.currentLanguage]) || 'Failed to upload logo.';
        const errorUploadingLogoText = (window.translations && window.translations['error_uploading_logo'] && window.translations['error_uploading_logo'][window.currentLanguage]) || 'An error occurred during logo upload.';
        const logoUploadedText = (window.translations && window.translations['file_uploaded'] && window.translations['file_uploaded'][window.currentLanguage]) || 'File uploaded'; // Re-using file_uploaded for consistency
        const noFileChosenText = (window.translations && window.translations['no_file_chosen'] && window.translations['no_file_chosen'][window.currentLanguage]) || 'No file chosen';
        const logoRemovedSuccessfullyText = (window.translations && window.translations['logo_removed_successfully'] && window.translations['logo_removed_successfully'][window.currentLanguage]) || 'Logo removed successfully!';
        const failedToRemoveLogoText = (window.translations && window.translations['failed_to_remove_logo'] && window.translations['failed_to_remove_logo'][window.currentLanguage]) || 'Failed to remove logo.';
        const errorRemovingLogoText = (window.translations && window.translations['error_removing_logo'] && window.translations['error_removing_logo'][window.currentLanguage]) || 'An error occurred during logo removal.';
        const unknownUserType = (window.translations && window.translations['unknown_user_type'] && window.translations['unknown_user_type'][window.currentLanguage]) || 'unknown user type';

        // Store user data globally for easier access in other functions
        window.currentUserData = userData;

        if (userData?.user_type !== 'employer') {
            console.warn('Attempted to load employer dashboard with user type:', userData?.user_type);
            if (typeof window.showToast === 'function') {
                window.showToast(`${dashboardForEmployersOnlyText} ${userData?.user_type || unknownUserType}. ${goToFreelancerDashboardText}.`, 'error');
            }
            const mainDashboardContent = document.getElementById('mainDashboardContent');
            if (mainDashboardContent) {
                mainDashboardContent.innerHTML = `<div class="empty-state">
                    <i class="fas fa-exclamation-triangle fa-3x"></i>
                    <h3>${accessDeniedText}</h3>
                    <p>${dashboardForEmployersOnlyText} ${userData?.user_type || unknownUserType}.</p>
                    <p>${goToFreelancerDashboardText}.</p>
                </div>`;
            }
            return;
        }

            currentEmployerId = userData.id;
            currentEmployerType = userData.profile?.employer_type || 'individual';
            currentActiveJobsCount = userData.profile?.active_jobs_count || 0;
            selectedCompanyCategory = userData.profile?.company_category || null;


            const companyLogoPath = userData.profile?.company_logo_path;
            const userInitials = `${(userData.first_name || '').charAt(0)}${(userData.last_name || '').charAt(0)}`.toUpperCase();

            // --- FIX: Centralized avatar update logic for desktop and mobile sidebars ---
            if (typeof window.updateUserAvatar === 'function') {
                const sidebarAvatarContainer = document.querySelector('.user-avatar-wrapper.sidebar-avatar');
                const headerAvatarContainer = document.querySelector('.user-avatar-wrapper.header-avatar');
                if (sidebarAvatarContainer) {
                    window.updateUserAvatar(sidebarAvatarContainer, sidebarUserAvatarImg, sidebarUserAvatarText, userData);
                }
                if (headerAvatarContainer) {
                    window.updateUserAvatar(headerAvatarContainer, userAvatarHeaderImg, userAvatarHeaderText, userData);
                }
            } else {
                console.error("updateUserAvatar function not found in global scope. Cannot update avatars.");
            }
            // --- END FIX ---


            // Update company logo preview in form
            if (companyLogoPreview) {
                if (companyLogoPath) {
                    companyLogoPreview.src = companyLogoPath;
                    companyLogoPreview.style.display = 'block';
                } else {
                    companyLogoPreview.style.display = 'none';
                }
            }
            if (companyLogoPlaceholder) {
                if (companyLogoPath) {
                    companyLogoPlaceholder.style.display = 'none';
                } else {
                    companyLogoPlaceholder.style.display = 'flex';
                }
            }
            if (companyLogoFileNameDisplay) {
                companyLogoFileNameDisplay.textContent = companyLogoPath ? logoUploadedText : noFileChosenText;
            }

            // Dynamically set user's display name
            let userDisplayName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
            if (currentEmployerType === 'company' && userData.profile?.company_name) {
                userDisplayName = userData.profile.company_name;
            } else if (!userDisplayName) {
                 userDisplayName = (window.translations && window.translations['employer_name_placeholder'] && window.translations['employer_name_placeholder'][window.currentLanguage]) || 'Employer Name';
            }
            userNameSpan.textContent = userDisplayName;

            // Populate Personal Profile Form
            firstNameInput.value = userData.first_name || '';
            lastNameInput.value = userData.last_name || '';
            emailInput.value = userData.email || '';
            phoneInput.value = userData.phone || '';
            populateCityDropdown(userData.city);
            setPersonalProfileFormReadonly(true);

            // Populate Company Profile Form (if applicable)
            companyNameInput.value = userData.profile?.company_name || '';
            companyDescriptionInput.value = userData.profile?.company_description || '';
            addressInput.value = userData.profile?.address || '';
            companyEmailInput.value = userData.profile?.company_email || '';
            companyPhoneInput.value = userData.profile?.company_phone || '';
            populateCompanyCategories(selectedCompanyCategory);
            updateCompanySelectedCategoryDisplay();
            setCompanyProfileFormReadonly(true);

            if (currentEmployerType === 'company') {
                if (companyDetailsSection) companyDetailsSection.style.display = 'block';
                if (companyDetailsLinkSidebar) companyDetailsLinkSidebar.style.display = 'list-item';
                if (employerProfileSection) employerProfileSection.style.display = 'none';
                if (personalDetailsLinkSidebar) personalDetailsLinkSidebar.style.display = 'none';
            } else {
                if (companyDetailsSection) companyDetailsSection.style.display = 'none';
                if (companyDetailsLinkSidebar) companyDetailsLinkSidebar.style.display = 'none';
                if (employerProfileSection) employerProfileSection.style.display = 'block';
                if (personalDetailsLinkSidebar) personalDetailsLinkSidebar.style.display = 'list-item';
            }

            totalPostedJobsSpan.textContent = await fetchTotalPostedJobs();
            activeJobsSpan.textContent = currentActiveJobsCount;
            totalApplicationsSpan.textContent = await fetchTotalApplications();
            hiredFreelancersSpan.textContent = userData.profile?.hired_professionals_count || 0;

            updatePostJobButtonStatus();

            if (viewPublicProfileBtn && currentEmployerId) {
                viewPublicProfileBtn.href = `/employer_profile.html?id=${currentEmployerId}`;
            } else {
                console.warn('View Public Profile button or employer ID not found, cannot set href.');
            }

            checkAndShowIntro();
    }

    function updatePostJobButtonStatus() {
        if (postJobBtn) {
            postJobBtn.disabled = false;
            postJobBtn.classList.remove('btn-disabled');
            postJobBtn.classList.remove('btn-secondary');
            postJobBtn.classList.add('btn-primary');
        }
    }


    // --- Dashboard Stats Fetching ---
    async function fetchTotalPostedJobs() {
        try {
            const response = await fetch('/api/jobs/my');
            if (!response.ok) throw new Error('Failed to fetch posted jobs');
            const data = await response.json();
            return data.jobs.length;
        }
        catch (error) {
            console.error('Error fetching total posted jobs:', error);
            return 'N/A';
        }
    }

    async function fetchActiveJobs() {
        try {
            const response = await fetch('/api/jobs/my');
            if (!response.ok) throw new Error('Failed to fetch posted jobs');
            const data = await response.json();
            return data.jobs.filter(job => job.status === 'open').length;
        } catch (error) {
            console.error('Error fetching active jobs for limit check:', error);
            return 0;
        }
    }

    async function fetchTotalApplications() {
        try {
            const response = await fetch('/api/jobs/my');
            if (!response.ok) throw new Error('Failed to fetch posted jobs');
            const data = await response.json();
            let total = 0;
            data.jobs.forEach(job => {
                total += parseInt(job.application_count || 0, 10);
            });
            return total;
        } catch (error) {
            console.error('Error fetching total applications:', error);
            return 'N/A';
        }
    }

    // --- Profile Form Editing Functions ---
    function setPersonalProfileFormReadonly(isReadonly) {
        const noFileChosenText = (window.translations && window.translations['no_file_chosen'] && window.translations['no_file_chosen'][window.currentLanguage]) || 'No file chosen';

        firstNameInput.readOnly = isReadonly;
        lastNameInput.readOnly = isReadonly;
        emailInput.readOnly = true; // Email should always be readonly
        phoneInput.readOnly = isReadonly;
        cityInput.disabled = isReadonly;

        editProfileBtn.style.display = isReadonly ? 'inline-block' : 'none';
        saveProfileBtn.style.display = isReadonly ? 'none' : 'inline-block';
        cancelEditBtn.style.display = isReadonly ? 'none' : 'inline-block';
    }

    function setCompanyProfileFormReadonly(isReadonly) {
        const noFileChosenText = (window.translations && window.translations['no_file_chosen'] && window.translations['no_file_chosen'][window.currentLanguage]) || 'No file chosen';
        const logoUploadedText = (window.translations && window.translations['file_uploaded'] && window.translations['file_uploaded'][window.currentLanguage]) || 'File uploaded';

        companyNameInput.readOnly = isReadonly;
        companyDescriptionInput.readOnly = isReadonly;
        addressInput.readOnly = isReadonly;
        companyEmailInput.readOnly = true; // Email should always be readonly
        companyPhoneInput.readOnly = isReadonly;
        if (companyCategoryToggleButton) companyCategoryToggleButton.disabled = isReadonly;
        if (otherCompanyCategoryInput) otherCompanyCategoryInput.readOnly = isReadonly;

        editCompanyBtn.style.display = isReadonly ? 'inline-block' : 'none';
        saveCompanyBtn.style.display = isReadonly ? 'none' : 'inline-block';
        cancelCompanyEditBtn.style.display = isReadonly ? 'none' : 'inline-block';

        const companyLogoUploadLabel = document.querySelector('label[for="companyLogoFile"]');
        const hasCompanyLogo = !!(window.currentUserData && window.currentUserData.profile?.company_logo_path);

        if (companyLogoFile) companyLogoFile.disabled = isReadonly;
        if (companyLogoUploadLabel) companyLogoUploadLabel.classList.toggle('disabled', isReadonly);

        if (isReadonly) {
            if (uploadCompanyLogoBtn) uploadCompanyLogoBtn.style.display = 'none';
            if (removeCompanyLogoBtn) removeCompanyLogoBtn.style.display = 'none';
            if (companyLogoFileNameDisplay) companyLogoFileNameDisplay.style.display = 'none';
            if (companyLogoUploadLabel) companyLogoUploadLabel.style.display = 'none';
            if (otherCompanyCategoryInputGroup) otherCompanyCategoryInputGroup.style.display = 'none';
        } else {
            if (uploadCompanyLogoBtn) uploadCompanyLogoBtn.style.display = 'inline-block';
            if (hasCompanyLogo || companyLogoFile.files.length > 0) {
                if (removeCompanyLogoBtn) removeCompanyLogoBtn.style.display = 'inline-block';
            } else {
                if (removeCompanyLogoBtn) removeCompanyLogoBtn.style.display = 'none';
            }
            if (companyLogoFileNameDisplay) companyLogoFileNameDisplay.style.display = 'inline-block';
            if (companyLogoUploadLabel) companyLogoUploadLabel.style.display = 'inline-flex';
            if (isOtherCategorySelected) {
                if (otherCompanyCategoryInputGroup) otherCompanyCategoryInputGroup.style.display = 'block';
            }
        }
        if (companyLogoFileNameDisplay) {
            if (companyLogoFile.files.length > 0) {
                companyLogoFileNameDisplay.textContent = companyLogoFile.files[0].name;
            } else {
                companyLogoFileNameDisplay.textContent = hasCompanyLogo ? logoUploadedText : noFileChosenText;
            }
        }
    }


    // Personal Profile Form Actions
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => setPersonalProfileFormReadonly(false));
    }
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            loadUserData(); // Reloads original data
            setPersonalProfileFormReadonly(true);
        });
    }
    if (employerProfileForm) {
        employerProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (saveProfileBtn) {
                saveProfileBtn.disabled = true;
                let spinner = saveProfileBtn.querySelector('.loading-spinner');
                if (!spinner) {
                    spinner = document.createElement('span');
                    spinner.className = 'loading-spinner';
                    saveProfileBtn.appendChild(spinner);
                }
                spinner.style.display = 'inline-block';
            }

            const formData = new FormData();
            formData.append('firstName', firstNameInput.value);
            formData.append('lastName', lastNameInput.value);
            formData.append('phone', phoneInput.value);
            formData.append('city', cityInput.value);
            formData.append('employerType', currentEmployerType);
            formData.append('companyName', companyNameInput.value); // These might be empty for individual
            formData.append('companyDescription', companyDescriptionInput.value);
            formData.append('address', addressInput.value);
            formData.append('companyEmail', companyEmailInput.value);
            formData.append('companyPhone', companyPhoneInput.value);
            formData.append('companyCategory', selectedCompanyCategory);

            try {
                const response = await fetch('/api/employer/profile', {
                    method: 'POST',
                    body: formData // Use FormData directly for file uploads
                });
                const result = await response.json();
                if (result.success) {
                    if (typeof window.showToast === 'function') {
                        window.showToast(result.message, 'success');
                    }
                    loadUserData(); // Reload user data to reflect changes
                    setPersonalProfileFormReadonly(true);
                } else {
                    if (typeof window.showToast === 'function') {
                        window.showToast(result.error || 'Failed to update personal profile.', 'error');
                    }
                }
            } catch (error) {
                console.error('Error updating personal profile:', error);
                if (typeof window.showToast === 'function') {
                    window.showToast('An error occurred while saving personal profile.', 'error');
                }
            }
            if (saveProfileBtn) {
                let spinner = saveProfileBtn.querySelector('.loading-spinner');
                if (spinner) spinner.style.display = 'none';
                saveProfileBtn.disabled = false;
            }
        });
    }

    // Company Profile Form Actions
    if (editCompanyBtn) {
        editCompanyBtn.addEventListener('click', () => setCompanyProfileFormReadonly(false));
    }
    if (cancelCompanyEditBtn) {
        cancelCompanyEditBtn.addEventListener('click', () => {
            loadUserData();
            setCompanyProfileFormReadonly(true);
        });
    }
    if (companyProfileForm) {
        companyProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (saveCompanyBtn) {
                saveCompanyBtn.disabled = true;
                let spinner = saveCompanyBtn.querySelector('.loading-spinner');
                if (!spinner) {
                    spinner = document.createElement('span');
                    spinner.className = 'loading-spinner';
                    saveCompanyBtn.appendChild(spinner);
                }
                spinner.style.display = 'inline-block';
            }
            if (isOtherCategorySelected && otherCompanyCategoryInput) {
                selectedCompanyCategory = otherCompanyCategoryInput.value;
            }
            companyCategoryHiddenInput.value = selectedCompanyCategory;

            const formData = new FormData(companyProfileForm);
            const data = Object.fromEntries(formData.entries());

            const payload = {
                companyName: data.companyName,
                companyDescription: data.companyDescription,
                address: data.address,
                companyEmail: data.companyEmail,
                companyPhone: data.companyPhone,
                companyCategory: selectedCompanyCategory,
                employerType: currentEmployerType,
                firstName: firstNameInput.value,
                lastName: lastNameInput.value,
                phone: phoneInput.value,
                city: cityInput.value
            };

            try {
                const response = await fetch('/api/employer/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                if (result.success) {
                    if (typeof window.showToast === 'function') {
                        window.showToast(result.message, 'success');
                    }
                    setCompanyProfileFormReadonly(true);
                    loadUserData();
                } else {
                    if (typeof window.showToast === 'function') {
                        window.showToast(result.error || 'Failed to update company profile.', 'error');
                    }
                }
            } catch (error) {
                console.error('Error updating company profile:', error);
                if (typeof window.showToast === 'function') {
                    window.showToast('An error occurred while saving company profile.', 'error');
                }
            }
            if (saveCompanyBtn) {
                let spinner = saveCompanyBtn.querySelector('.loading-spinner');
                if (spinner) spinner.style.display = 'none';
                saveCompanyBtn.disabled = false;
            }
        });
    }

    // --- Company Logo Upload/Remove ---
    if (companyLogoFile) {
        companyLogoFile.addEventListener('change', (e) => {
            const noFileChosenText = (window.translations && window.translations['no_file_chosen'] && window.translations['no_file_chosen'][window.currentLanguage]) || 'No file chosen';
            companyLogoFileNameDisplay.textContent = e.target.files[0] ? e.target.files[0].name : noFileChosenText;
            if (e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (companyLogoPreview) {
                        companyLogoPreview.src = event.target.result;
                        companyLogoPreview.style.display = 'block';
                    }
                    if (companyLogoPlaceholder) companyLogoPlaceholder.style.display = 'none';
                };
                reader.readAsDataURL(e.target.files[0]);
            } else {
                if (companyLogoPreview) companyLogoPreview.style.display = 'none';
                if (companyLogoPlaceholder) companyLogoPlaceholder.style.display = 'flex';
            }
            setCompanyProfileFormReadonly(false); // Enable save/cancel
        });
    }

    if (uploadCompanyLogoBtn) {
        uploadCompanyLogoBtn.addEventListener('click', async () => {
            const pleaseSelectLogoFileText = (window.translations && window.translations['please_select_logo_file'] && window.translations['please_select_logo_file'][window.currentLanguage]) || 'Please select a logo file to upload.';
            const uploadingLogoText = (window.translations && window.translations['uploading_logo'] && window.translations['uploading_logo'][window.currentLanguage]) || 'Uploading logo...';
            const failedToUploadLogoText = (window.translations && window.translations['failed_to_upload_logo'] && window.translations['failed_to_upload_logo'][window.currentLanguage]) || 'Failed to upload logo.';
            const errorUploadingLogoText = (window.translations && window.translations['error_uploading_logo'] && window.translations['error_uploading_logo'][window.currentLanguage]) || 'An error occurred during logo upload.';

            if (!companyLogoFile.files.length) {
                if (typeof window.showToast === 'function') {
                    window.showToast(pleaseSelectLogoFileText, 'warning');
                }
                return;
            }

            const formData = new FormData();
            formData.append('file', companyLogoFile.files[0]);

            if (typeof window.createLoadingSpinner === 'function') {
                logoMessage.innerHTML = window.createLoadingSpinner(uploadingLogoText);
            }
            logoMessage.style.display = 'block';

            try {
                const response = await fetch('/api/employer/upload-logo', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();

                if (result.success) {
                    if (typeof window.showToast === 'function') {
                        window.showToast(result.message, 'success');
                    }
                    logoMessage.textContent = result.message;
                    logoMessage.className = 'mt-2 form-message success';
                    loadUserData();
                } else {
                    if (typeof window.showToast === 'function') {
                        window.showToast(result.error || failedToUploadLogoText, 'error');
                    }
                    logoMessage.textContent = result.error || errorUploadingLogoText;
                    logoMessage.className = 'mt-2 form-message error';
                }
            } catch (error) {
                console.error('Error uploading company logo:', error);
                if (typeof window.showToast === 'function') {
                    window.showToast(errorUploadingLogoText, 'error');
                }
                logoMessage.textContent = errorUploadingLogoText;
                logoMessage.className = 'mt-2 form-message error';
            }
        });
    }

    if (removeCompanyLogoBtn) {
        removeCompanyLogoBtn.addEventListener('click', () => {
            const confirmRemoveLogoText = (window.translations && window.translations['confirm_remove_logo'] && window.translations['confirm_remove_logo'][window.currentLanguage]) || 'Confirm Removal';
            const confirmRemoveLogoMessageText = (window.translations && window.translations['confirm_remove_logo_message'] && window.translations['confirm_remove_logo_message'][window.currentLanguage]) || 'Are you sure you want to remove your company logo?';
            const yesRemoveText = (window.translations && window.translations['yes_remove'] && window.translations['yes_remove'][window.currentLanguage]) || 'Yes, Remove';
            const logoRemovedSuccessfullyText = (window.translations && window.translations['logo_removed_successfully'] && window.translations['logo_removed_successfully'][window.currentLanguage]) || 'Logo removed successfully!';
            const failedToRemoveLogoText = (window.translations && window.translations['failed_to_remove_logo'] && window.translations['failed_to_remove_logo'][window.currentLanguage]) || 'Failed to remove logo.';
            const errorRemovingLogoText = (window.translations && window.translations['error_removing_logo'] && window.translations['error_removing_logo'][window.currentLanguage]) || 'An error occurred during logo removal.';

            if (typeof window.showConfirmModal === 'function') {
                window.showConfirmModal(
                    confirmRemoveLogoText,
                    confirmRemoveLogoMessageText,
                    async () => {
                        try {
                            const response = await fetch('/api/employer/remove-logo', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({})
                            });
                            const result = await response.json();
                            if (result.success) {
                                if (typeof window.showToast === 'function') {
                                    window.showToast(result.message || logoRemovedSuccessfullyText, 'success');
                                }
                                loadUserData();
                            } else {
                                if (typeof window.showToast === 'function') {
                                    window.showToast(result.error || failedToRemoveLogoText, 'error');
                                }
                            }
                        } catch (error) {
                            console.error('Error removing company logo:', error);
                            if (typeof window.showToast === 'function') {
                                window.showToast(errorRemovingLogoText, 'error');
                            }
                        }
                    },
                    null,
                    yesRemoveText,
                    'btn-danger'
                );
            }
        });
    }

    // --- Posted Jobs Management ---
    async function loadEmployerJobs() {
        const loadingJobsDashboardText = (window.translations && window.translations['loading_jobs_dashboard'] && window.translations['loading_jobs_dashboard'][window.currentLanguage]) || 'Loading jobs...';
        const noJobsPostedYetText = (window.translations && window.translations['no_jobs_posted_yet'] && window.translations['no_jobs_posted_yet'][window.currentLanguage]) || 'No Jobs Posted Yet';
        const postJobNowText = (window.translations && window.translations['post_job_now'] && window.translations['post_job_now'][window.currentLanguage]) || 'Post a Job Now';
        const failedToFetchYourJobsText = (window.translations && window.translations['failed_to_fetch_your_jobs'] && window.translations['failed_to_fetch_your_jobs'][window.currentLanguage]) || 'Failed to fetch your jobs.';
        const couldNotLoadJobsText = (window.translations && window.translations['could_not_load_jobs'] && window.translations['could_not_load_jobs'][window.currentLanguage]) || 'Could not load jobs:';

        if (typeof window.createLoadingSpinner === 'function') {
            postedJobsListDiv.innerHTML = window.createLoadingSpinner(loadingJobsDashboardText);
        }
        noJobsMessageDiv.style.display = 'none';

        try {
            const response = await fetch('/api/jobs/my');
            if (!response.ok) throw new Error(failedToFetchYourJobsText);
            const data = await response.json();

            if (data.jobs.length === 0) {
                postedJobsListDiv.innerHTML = '';
                noJobsMessageDiv.style.display = 'flex';
                noJobsMessageDiv.querySelector('h3').textContent = noJobsPostedYetText;
                noJobsMessageDiv.querySelector('button').textContent = postJobNowText;
                return;
            }

            postedJobsListDiv.innerHTML = '';
            data.jobs.forEach(job => {
                postedJobsListDiv.appendChild(createJobCard(job));
            });

        } catch (error) {
            console.error('Error loading employer jobs:', error);
            postedJobsListDiv.innerHTML = `<p class="empty-state">${couldNotLoadJobsText} ${error.message}</p>`;
            if (typeof window.showToast === 'function') {
                window.showToast(failedToFetchYourJobsText, 'error');
            }
        }
    }

    function createJobCard(job) {
        const budgetText = (window.translations && window.translations['budget'] && window.translations['budget'][window.currentLanguage]) || 'Budget';
        const deadlineText = (window.translations && window.translations['deadline'] && window.translations['deadline'][window.currentLanguage]) || 'Deadline';
        const remoteText = (window.translations && window.translations['remote'] && window.translations['remote'][window.currentLanguage]) || 'Remote';
        const applicationsText = (window.translations && window.translations['applications'] && window.translations['applications'][window.currentLanguage]) || 'Applications';
        const hiredText = (window.translations && window.translations['hired'] && window.translations['hired'][window.currentLanguage]) || 'Hired';
        const viewJobText = (window.translations && window.translations['view_job'] && window.translations['view_job'][window.currentLanguage]) || 'View Job';
        const applicantsTextBtn = (window.translations && window.translations['applicants'] && window.translations['applicants'][window.currentLanguage]) || 'Applicants';
        const deleteText = (window.translations && window.translations['delete'] && window.translations['delete'][window.currentLanguage]) || 'Delete';
        const openStatusText = (window.translations && window.translations['open'] && window.translations['open'][window.currentLanguage]) || 'Open';
        const closeStatusText = (window.translations && window.translations['close'] && window.translations['close'][window.currentLanguage]) || 'Close';
        const assignedStatusText = (window.translations && window.translations['assigned'] && window.translations['assigned'][window.currentLanguage]) || 'Assigned';
        const reopenActionText = (window.translations && window.translations['reopen'] && window.translations['reopen'][window.currentLanguage]) || 'Reopen';
        const urgentText = (window.translations && window.translations['urgent'] && window.translations['urgent'][window.currentLanguage]) || 'Urgent';
        const naText = (window.translations && window.translations['n_a'] && window.translations['n_a'][window.currentLanguage]) || 'N/A';
        const linkClicksText = (window.translations && window.translations['link_clicks'] && window.translations['link_clicks'][window.currentLanguage]) || 'Link Clicks';
        const viewsText = (window.translations && window.translations['job_views'] && window.translations['job_views'][window.currentLanguage]) || 'Views';
        const shareText = (window.translations && window.translations['share'] && window.translations['share'][window.currentLanguage]) || 'Share';

        const card = document.createElement('div');
        card.className = 'posted-job-card';

        let statusClass = job.status.toLowerCase();
        let statusText = '';
        let toggleButtonText = '';
        let toggleButtonIcon = '';

        if (job.status === 'open') {
            statusClass = 'open';
            statusText = window.currentLanguage === 'ar' ? 'نشطة' : openStatusText;
            toggleButtonText = window.currentLanguage === 'ar' ? 'إغلاق' : 'Close';
            toggleButtonIcon = 'fas fa-times-circle';
        } else if (job.status === 'closed') {
            statusClass = 'closed';
            statusText = window.currentLanguage === 'ar' ? 'مغلقة' : 'Closed';
            toggleButtonText = window.currentLanguage === 'ar' ? 'فتح' : 'Open';
            toggleButtonIcon = 'fas fa-check-circle';
        } else if (job.status === 'assigned') {
            statusClass = 'assigned';
            statusText = assignedStatusText;
            toggleButtonText = window.currentLanguage === 'ar' ? 'فتح' : 'Reopen';
            toggleButtonIcon = 'fas fa-redo';
        }

        const toggleButtonClass = 'btn-toggle-neutral';

        const externalClicksStatHtml = (job.external_apply_url && job.external_apply_url.trim() !== '') ? `
            <div class="posted-job-stats">
                <p class="external-clicks-stat"><i class="fas fa-link"></i> ${linkClicksText}: ${typeof job.external_apply_clicks === 'number' ? job.external_apply_clicks : 0}</p>
            </div>
        ` : '';

        const viewsStatHtml = `
            <div class="posted-job-stats">
                <p class="views-stat"><i class="fas fa-eye"></i> ${viewsText}: ${typeof job.views_count === 'number' ? job.views_count : 0}</p>
            </div>
        `;

        card.innerHTML = `
            <div class="posted-job-header relative">
                <div class="flex flex-wrap gap-2 justify-center mb-2">
                    <span class="posted-job-status status-${statusClass} !m-0">${statusText}</span>
                    ${job.is_urgent ? `<span class="posted-job-status status-urgent !m-0">${urgentText}</span>` : ''}
                </div>
                <h3>${job.title}</h3>
            </div>
            ${externalClicksStatHtml}
            ${viewsStatHtml}
            <div class="flex flex-col gap-3 mt-4">
                <a href="/applicants.html?jobId=${job.id}" class="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-slate-800 hover:shadow-md transition-all active:scale-[0.98]">
                    <i class="fas fa-users"></i>
                    <span>${applicantsTextBtn}</span>
                </a>
                <div class="grid grid-cols-3 gap-2">
                    <a href="/job_details.html?id=${job.id}" class="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:border-primary/30 transition-colors text-slate-600 hover:text-primary group" title="${viewJobText}">
                        <i class="fas fa-eye text-lg mb-1"></i>
                        <span class="text-[10px] font-medium uppercase tracking-wider">${viewJobText}</span>
                    </a>
                    <button class="share-job-btn flex flex-col items-center justify-center p-2 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:border-primary/30 transition-colors text-slate-600 hover:text-primary group" data-job-id="${job.id}" title="${shareText}">
                        <i class="fas fa-share-alt text-lg mb-1"></i>
                        <span class="text-[10px] font-medium uppercase tracking-wider">${shareText}</span>
                    </button>
                    <button class="toggle-status-btn flex flex-col items-center justify-center p-2 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:border-primary/30 transition-colors text-slate-600 hover:text-primary group" data-job-id="${job.id}" data-current-status="${job.status}" title="${toggleButtonText}">
                        <i class="${toggleButtonIcon} text-lg mb-1"></i>
                        <span class="text-[10px] font-medium uppercase tracking-wider">${toggleButtonText}</span>
                    </button>
                </div>
            </div>
        `;

        card.querySelector('.toggle-status-btn').addEventListener('click', (e) => {
            const jobId = e.currentTarget.dataset.jobId;
            const currentStatus = e.currentTarget.dataset.currentStatus;
            toggleJobStatus(jobId, currentStatus);
        });

        card.querySelector('.share-job-btn').addEventListener('click', (e) => {
            const jobId = e.currentTarget.dataset.jobId;
            showShareModal(jobId);
        });

        return card;
    }

    /**
     * Shows the share job modal with QR code and link
     * @param {string} jobId The ID of the job to share
     */
    function showShareModal(jobId) {
        const modal = document.getElementById('shareJobModal');
        const linkInput = document.getElementById('shareJobLink');
        const qrContainer = document.getElementById('shareQrCode');
        const downloadBtn = document.getElementById('downloadShareQrBtn');
        const copyBtn = document.getElementById('copyShareLinkBtn');
        const closeBtns = [
            document.getElementById('closeShareModal'),
            document.getElementById('closeShareModalBtn')
        ];

        if (!modal) return;

        // Generate share link
        const shareLink = `${window.location.origin}/job_details.html?id=${jobId}`;
        if (linkInput) linkInput.value = shareLink;

        // Generate QR Code
        if (qrContainer && (typeof qrcode !== 'undefined' || window.qrcode)) {
            try {
                qrContainer.innerHTML = '';
                const qr = (typeof qrcode !== 'undefined') ? qrcode(0, 'M') : window.qrcode(0, 'M');
                qr.addData(shareLink);
                qr.make();
                qrContainer.innerHTML = qr.createImgTag(5);

                // Setup download button
                if (downloadBtn) {
                    downloadBtn.onclick = () => {
                        const img = qrContainer.querySelector('img');
                        if (img && img.src) {
                            const link = document.createElement('a');
                            link.href = img.src;
                            link.download = `job-qr-${jobId}.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }
                    };
                }
            } catch (err) {
                console.error('QR Code generation failed:', err);
            }
        }

        // Copy Link Logic
        if (copyBtn) {
            copyBtn.onclick = async () => {
                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(shareLink);
                    } else {
                        linkInput.select();
                        document.execCommand('copy');
                    }
                    
                    const originalIcon = copyBtn.innerHTML;
                    copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        copyBtn.innerHTML = originalIcon;
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy:', err);
                }
            };
        }

        // Modal visibility
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.classList.add('opacity-100');
            const content = modal.querySelector('div');
            if (content) {
                content.classList.remove('scale-95');
                content.classList.add('scale-100');
            }
        }, 10);

        document.body.classList.add('overflow-hidden');

        const closeModal = () => {
            modal.classList.add('opacity-0');
            modal.classList.remove('opacity-100');
            const content = modal.querySelector('div');
            if (content) {
                content.classList.add('scale-95');
                content.classList.remove('scale-100');
            }
            setTimeout(() => {
                modal.classList.add('hidden');
                document.body.classList.remove('overflow-hidden');
            }, 300);
        };

        closeBtns.forEach(btn => {
            if (btn) btn.onclick = closeModal;
        });

        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };
    }

    async function fetchJobData(jobId) {
        try {
            const response = await fetch(`/api/jobs/${jobId}`);
            if (!response.ok) throw new Error('Failed to fetch job data');
            const data = await response.json();
            return data; // API returns job data directly, not wrapped in a 'job' property
        } catch (error) {
            console.error('Error fetching job data:', error);
            return null;
        }
    }

    async function toggleJobStatus(jobId, currentStatus) {
        const invalidJobStatusText = (window.translations && window.translations['invalid_job_status'] && window.translations['invalid_job_status'][window.currentLanguage]) || 'Invalid job status for this action.';
        const confirmCloseJobTitleText = (window.translations && window.translations['confirm_close_job_title'] && window.translations['confirm_close_job_title'][window.currentLanguage]) || 'Close Job';
        const confirmCloseJobMessageText = (window.translations && window.translations['confirm_close_job_message'] && window.translations['confirm_close_job_message'][window.currentLanguage]) || 'Are you sure you want to close this job? It will no longer accept new applications.';
        const yesCloseText = (window.translations && window.translations['yes_close'] && window.translations['yes_close'][window.currentLanguage]) || 'Yes, Close';

        if (currentStatus === 'open') {
            // Use generic confirm modal for closing jobs
            if (typeof window.showConfirmModal === 'function') {
                window.showConfirmModal(
                    confirmCloseJobTitleText,
                    confirmCloseJobMessageText,
                    async () => {
                        await performJobStatusToggle(jobId);
                    },
                    null,
                    yesCloseText,
                    'btn-danger'
                );
            }
        } else if (currentStatus === 'closed' || currentStatus === 'assigned') {
            // Fetch job data to check deadline
            const jobData = await fetchJobData(jobId);
            if (jobData) {
                showReopenJobModal(jobId, jobData);
            } else {
                if (typeof window.showToast === 'function') {
                    window.showToast('Failed to load job data', 'error');
                }
            }
        } else {
            if (typeof window.showToast === 'function') {
                window.showToast(invalidJobStatusText, 'error');
            }
            return;
        }
    }

    async function performJobStatusToggle(jobId, newDeadline = null) {
        const failedToToggleJobStatusText = (window.translations && window.translations['failed_to_toggle_job_status'] && window.translations['failed_to_toggle_job_status'][window.currentLanguage]) || 'Failed to toggle job status.';
        const errorTogglingJobStatusText = (window.translations && window.translations['error_toggling_job_status'] && window.translations['error_toggling_job_status'][window.currentLanguage]) || 'An error occurred while toggling job status.';

        try {
            const requestBody = {};
            if (newDeadline) {
                requestBody.newDeadline = newDeadline;
            }

            const response = await fetch(`/api/jobs/${jobId}/toggle-status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || failedToToggleJobStatusText);
            }
            if (typeof window.showToast === 'function') {
                window.showToast(data.message, 'success');
            }
            loadEmployerJobs();
            loadUserData();
        } catch (error) {
            console.error('Error toggling job status:', error);
            if (typeof window.showToast === 'function') {
                window.showToast(error.message || errorTogglingJobStatusText, 'error');
            }
        }
    }

    async function deleteJob(jobId) {
        const confirmDeleteJobTitleText = (window.translations && window.translations['confirm_delete_job_title'] && window.translations['confirm_delete_job_title'][window.currentLanguage]) || 'Confirm Delete';
        const confirmDeleteJobMessageText = (window.translations && window.translations['confirm_delete_job_message'] && window.translations['confirm_delete_job_message'][window.currentLanguage]) || 'Are you sure you want to delete this job? This action cannot be undone.';
        const yesDeleteText = (window.translations && window.translations['yes_delete'] && window.translations['yes_delete'][window.currentLanguage]) || 'Yes, Delete';
        const failedToDeleteJobText = (window.translations && window.translations['failed_to_delete_job'] && window.translations['failed_to_delete_job'][window.currentLanguage]) || 'Failed to delete job.';
        const errorDeletingJobText = (window.translations && window.translations['error_deleting_job'] && window.translations['error_deleting_job'][window.currentLanguage]) || 'An error occurred while deleting the job.';


        if (typeof window.showConfirmModal === 'function') {
            window.showConfirmModal(
                confirmDeleteJobTitleText,
                confirmDeleteJobMessageText,
                async () => {
                    try {
                        const response = await fetch(`/api/jobs/${jobId}`, {
                            method: 'DELETE'
                        });
                        const data = await response.json();
                        if (!response.ok) {
                            throw new Error(data.error || failedToDeleteJobText);
                        }
                        if (typeof window.showToast === 'function') {
                            window.showToast(data.message, 'success');
                        }
                        loadEmployerJobs();
                        loadUserData();
                    } catch (error) {
                        console.error('Error deleting job:', error);
                        if (typeof window.showToast === 'function') {
                            window.showToast(error.message || errorDeletingJobText, 'error');
                        }
                    }
                },
                null,
                yesDeleteText,
                'btn-danger'
            );
        }
    }
    
    if (window.currentLanguage) {
        performInitialLoad();
    }
});
