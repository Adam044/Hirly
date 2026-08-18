document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorMessage = document.getElementById('errorMessage');
    const employerProfileContent = document.getElementById('employerProfileContent');

    // Header Section Elements
    const employerAvatar = document.getElementById('employerAvatar');
    const employerName = document.getElementById('employerName');
    const employerCategory = document.getElementById('employerCategory');
    const employerLocationContainer = document.getElementById('employerLocationContainer');
    const employerLocation = document.getElementById('employerLocation');
    const employerRatingContainer = document.getElementById('employerRatingContainer');
    const employerAverageRating = document.getElementById('employerAverageRating');
    const employerReviewsCount = document.getElementById('employerReviewsCount');

    // About Section Elements
    const aboutCompanyName = document.getElementById('aboutCompanyName');
    const companyDescription = document.getElementById('companyDescription');

    // Posted Jobs Section Elements
    const jobsCompanyName = document.getElementById('jobsCompanyName');
    const employerJobsGrid = document.getElementById('employerJobsGrid');
    const noEmployerJobs = document.getElementById('noEmployerJobs');

    // Contact Section Elements
    const contactEmailLink = document.getElementById('contactEmailLink');
    const contactPhoneLink = document.getElementById('contactPhoneLink');
    const contactAddressText = document.getElementById('contactAddressText');

    // Reviews Section Elements
    const reviewsSection = document.getElementById('reviewsSection');
    const reviewsCountSpan = document.getElementById('reviewsCount');
    const leaveReviewBtn = document.getElementById('leaveReviewBtn');
    const reviewsContainer = document.getElementById('reviewsContainer');
    const noReviewsMessage = document.getElementById('noReviewsMessage');

    // Review modal elements
    const reviewModal = document.getElementById('reviewModal');
    const cancelReviewBtn = document.getElementById('cancelReviewBtn');
    const closeReviewModalBtn = document.getElementById('closeReviewModalBtn');
    const reviewModalTitle = document.getElementById('reviewModalTitle');
    const reviewForm = document.getElementById('reviewForm');
    const starRating = document.getElementById('starRating');
    const ratingInput = document.getElementById('ratingInput');
    const reviewCommentInput = document.getElementById('reviewComment');
    const reviewMessageStatus = document.getElementById('reviewMessageStatus');
    const submitReviewBtn = document.querySelector('#reviewForm button[type="submit"]');

    // Restriction Modal Elements
    const restrictionModal = document.getElementById('restrictionModal');
    const restrictionMessage = document.getElementById('restrictionMessage');
    const restrictionActionBtn = document.getElementById('restrictionActionBtn');
    const closeRestrictionModalBtn = document.getElementById('closeRestrictionModalBtn');

    // Global Data
    const globalTalentCategories = window.globalCategoriesAndProfessions || [];
    const palestinianCitiesTranslations = window.palestinianCitiesTranslations || {};
    
    let currentLoggedInUser = null;
    let eligibleJobsForReview = [];
    let profileEmployerId = null;
    let employerSlug = null;

    // --- Helper Functions ---

    function getCurrencySymbol(currencyCode) {
        switch (currencyCode) {
            case 'USD': return '$';
            case 'ILS': return '₪';
            case 'JOD': return 'JD';
            case 'EUR': return '€';
            default: return '';
        }
    }

    function createJobCard(job) {
        const lang = window.currentLanguage || 'en';
        const t = window.translations;
        const cityTranslations = window.palestinianCitiesTranslations;
        const globalCategories = window.globalCategoriesAndProfessions || [];

        const card = document.createElement('div');
        // Matches the 'luxe-card' style but for a clickable item
        card.className = 'bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden';
        card.setAttribute('role', 'link');
        card.setAttribute('tabindex', '0');
        card.dataset.jobId = job.id;
        
        // Handle click
        card.addEventListener('click', (e) => {
            // Prevent if clicking a button inside (if any)
            if (!e.target.closest('button, a')) {
                const companyName = employerName ? employerName.textContent : (job.company_name || 'hirly');
                const slug = window.generateJobSlug ? window.generateJobSlug(job.title, companyName) : 'details';
                window.open(`/jobs/${job.id}/${slug}`, '_blank');
            }
        });

        // Data preparation
        const currencySymbol = getCurrencySymbol(job.currency);
        
        // Location
        let locationDisplay = (t && t['not_available'] && t['not_available'][lang]) || 'N/A';
        if (job.city && job.city.trim() !== '') {
            const cityKey = job.city.startsWith('city_') ? job.city : `city_${job.city.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            if (cityTranslations && cityTranslations[cityKey]) {
                locationDisplay = cityTranslations[cityKey][lang] || cityTranslations[cityKey].en;
            } else {
                locationDisplay = job.city.replace('city_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
        } else if (job.job_site_type) {
             const siteTypeKey = job.job_site_type.toLowerCase().replace('-', '_');
             locationDisplay = (t && t[siteTypeKey] && t[siteTypeKey][lang]) || job.job_site_type;
        }

        // Category
        let displayCategory = (t && t['not_available'] && t['not_available'][lang]) || 'N/A';
        let categoryIconClass = 'fas fa-briefcase';
        const categoryData = globalCategories.find(c => c.name.en === job.category);
        if (categoryData) {
            displayCategory = categoryData.name[lang] || categoryData.name.en;
            if (categoryData.icon) categoryIconClass = categoryData.icon;
        } else {
            displayCategory = job.category || displayCategory;
        }

        // Job Type
        let displayJobType = (t && t['not_available'] && t['not_available'][lang]) || 'N/A';
        const jobTypeKey = (job.job_type || '').toLowerCase().replace(/[\s&()]/g, '_').replace(/[^a-z0-9_]/g, '');
        if (t && t[jobTypeKey] && t[jobTypeKey][lang]) {
            displayJobType = t[jobTypeKey][lang];
        } else {
            displayJobType = job.job_type || displayJobType;
        }

        // Status
        const isClosed = job.status === 'closed';
        const statusText = isClosed ? ((t && t['closed'] && t['closed'][lang]) || 'Closed') : '';
        const statusHtml = isClosed ? `<span class="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ml-2">${statusText}</span>` : '';

        // Time Ago
        const timeAgoText = window.timeAgo ? window.timeAgo(job.created_at) : formatDate(job.created_at);
        
        // Budget
        const budgetText = job.budget ? `${currencySymbol}${job.budget.toLocaleString()}` : ((t && t['negotiable'] && t['negotiable'][lang]) || 'Negotiable');

        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                    <h3 class="text-lg font-bold text-slate-900 leading-tight group-hover:text-hirly-600 transition-colors mb-1">
                        ${job.title}
                        ${statusHtml}
                    </h3>
                    <div class="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <span><i class="fas fa-clock mr-1"></i> ${timeAgoText}</span>
                    </div>
                </div>
                <div class="w-10 h-10 rounded-xl bg-hirly-50 text-hirly-500 flex items-center justify-center text-lg shadow-sm border border-hirly-100">
                    <i class="${categoryIconClass}"></i>
                </div>
            </div>
            
            <div class="flex items-center gap-3 text-sm text-slate-600 font-medium mb-4">
                <span class="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                    <i class="fas fa-money-bill-wave text-emerald-500"></i> ${budgetText}
                </span>
                <span class="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                    <i class="fas fa-map-marker-alt text-red-400"></i> ${locationDisplay}
                </span>
            </div>
            
            <div class="flex items-center gap-2 mt-auto">
                <span class="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                    ${displayJobType}
                </span>
                <span class="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                    ${displayCategory}
                </span>
            </div>
        `;

        return card;
    }

    function createLoadingSpinner(textKey = 'loading') {
        const text = (window.translations && window.translations[textKey] && window.translations[textKey][window.currentLanguage]) || 'Loading...';
        return `
            <div class="flex flex-col items-center gap-4 py-8">
                <i class="fas fa-spinner fa-spin text-3xl text-hirly-500"></i>
                <span class="text-slate-400 text-sm font-bold uppercase tracking-widest">${text}</span>
            </div>
        `;
    }

    function formatDate(dateString) {
        if (!dateString) return (window.translations && window.translations['n_a'] && window.translations['n_a'][window.currentLanguage]) || 'N/A';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
    
    function getPlaceholderUrl(text, width = 60, height = 60) {
        return `https://placehold.co/${width}x${height}/999999/ffffff?text=${encodeURIComponent(text)}`;
    }

    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} show`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // --- Initialization ---

    // Extract ID or slug from URL
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];

    if (lastSegment) {
        if (!isNaN(lastSegment) && parseInt(lastSegment) > 0) {
            profileEmployerId = lastSegment;
        } else if (!lastSegment.includes('.') && lastSegment !== 'employer_profile' && lastSegment !== 'employer_profile.html') {
            employerSlug = lastSegment.replace('@', '');
        }
    }

    if (!profileEmployerId && !employerSlug) {
        const urlParams = new URLSearchParams(window.location.search);
        profileEmployerId = urlParams.get('id');
        employerSlug = urlParams.get('slug');
    }

    // --- Main Fetch Function ---

    async function fetchEmployerProfile() {
        if (loadingSpinner) loadingSpinner.style.display = 'flex';
        if (employerProfileContent) employerProfileContent.classList.add('hidden');
        if (errorMessage) errorMessage.classList.add('hidden');
    
        if (!profileEmployerId && !employerSlug) {
            if (errorMessage) {
                errorMessage.textContent = (window.translations && window.translations['employer_id_missing'] && window.translations['employer_id_missing'][window.currentLanguage]) || 'Employer ID or slug is missing from the URL.';
                errorMessage.classList.remove('hidden');
            }
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            return;
        }
    
        let employer = null;
    
        try {
            let apiUrl = profileEmployerId ? `/api/employers/${profileEmployerId}` : `/api/employers/by-slug/${employerSlug}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            employer = data.employer;
    
            if (employer) {
                if (!profileEmployerId) profileEmployerId = employer.id;
                
                // Show reviews section early
                if (reviewsSection) reviewsSection.classList.remove('hidden');

                renderProfile(employer);
                await setupUIForViewer(employer.id);
                await fetchReviewsForEmployer(employer.id);
                await fetchEmployerJobs(employer.id);
            } else {
                throw new Error('Employer profile not found.');
            }
        } catch (error) {
            console.error('Error fetching employer profile:', error);
            if (errorMessage) {
                errorMessage.textContent = error.message;
                errorMessage.classList.remove('hidden');
            }
        } finally {
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            if (employerProfileContent && employer) {
                employerProfileContent.classList.remove('hidden');
            }
        }
    }

    // --- Render function ---

    function renderProfile(employer) {
        const naText = (window.translations && window.translations['n_a'] && window.translations['n_a'][window.currentLanguage]) || 'N/A';
        const noDescriptionText = (window.translations && window.translations['no_description_provided'] && window.translations['no_description_provided'][window.currentLanguage]) || 'No description provided.';
        
        let displayName = '';
        let aboutDescription = '';
        let contactEmail = employer.email || naText;
        let contactPhone = employer.phone || naText;
        let contactAddress = '';
        let avatarHtml = '';
        let employerCategoryName = '';
        let employerCategoryIcon = '';
        let averageRating = (employer.rating && employer.rating > 0) ? employer.rating.toFixed(1) : '-';

        // Determine type (company vs individual)
        if (employer.employer_type === 'company') {
            displayName = employer.company_name || naText;
            aboutDescription = employer.company_description || noDescriptionText;
            contactAddress = employer.address || naText;
            
            if (employer.company_logo_path) {
                avatarHtml = `<img src="${employer.company_logo_path}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='${getPlaceholderUrl((displayName.charAt(0) || 'C').toUpperCase(), 200, 200)}';" alt="${displayName}">`;
            } else {
                avatarHtml = `<i class="fas fa-building text-slate-300"></i>`;
            }
            
            employerCategoryName = employer.company_category || naText;
            const categoryData = globalTalentCategories.find(cat => cat.name.en === employerCategoryName);
            employerCategoryName = categoryData ? (categoryData.name[window.currentLanguage] || categoryData.name.en) : employerCategoryName;
            employerCategoryIcon = categoryData ? categoryData.icon : 'fas fa-industry';
            
        } else {
            displayName = `${employer.first_name || ''} ${employer.last_name || ''}`.trim() || naText;
            aboutDescription = (window.translations && window.translations['no_description_available'] && window.translations['no_description_available'][window.currentLanguage]) || 'No description provided.';
            contactAddress = employer.city || naText;
            
            if (employer.profile_picture_url) {
                avatarHtml = `<img src="${employer.profile_picture_url}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='${getPlaceholderUrl((displayName.charAt(0) || 'I').toUpperCase(), 200, 200)}';" alt="${displayName}">`;
            } else {
                const initials = `${(employer.first_name?.charAt(0) || '').toUpperCase()}${(employer.last_name?.charAt(0) || '').toUpperCase()}`;
                avatarHtml = `<span class="text-slate-300">${initials || 'U'}</span>`;
            }
            
            employerCategoryName = (window.translations && window.translations['individual'] && window.translations['individual'][window.currentLanguage]) || 'Individual';
            employerCategoryIcon = 'fas fa-user';
        }

        // Update DOM
        if (employerName) employerName.textContent = displayName;
        if (employerAvatar) employerAvatar.innerHTML = avatarHtml;
        
        if (employerCategory) {
            employerCategory.innerHTML = `<i class="${employerCategoryIcon}"></i> ${employerCategoryName}`;
            employerCategory.classList.remove('hidden');
        }

        if (employerLocation) {
            employerLocation.textContent = contactAddress;
            if (employerLocationContainer) employerLocationContainer.classList.remove('hidden');
        }

        if (employerAverageRating) employerAverageRating.textContent = averageRating;
        if (employerRatingContainer && employer.rating > 0) {
            employerRatingContainer.classList.remove('hidden');
        }

        if (companyDescription) companyDescription.innerHTML = aboutDescription.replace(/\n/g, '<br>');

        // Update Contact Information
        if (contactEmailLink) {
            contactEmailLink.textContent = contactEmail;
            contactEmailLink.href = contactEmail !== naText ? `mailto:${contactEmail}` : '#';
        }
        if (contactPhoneLink) {
            contactPhoneLink.textContent = contactPhone;
            contactPhoneLink.href = contactPhone !== naText ? `tel:${contactPhone}` : '#';
        }
        if (contactAddressText) {
            contactAddressText.textContent = contactAddress;
        }
    }

    // --- Viewer UI setup ---

    async function setupUIForViewer(profileUserId) {
        try {
            if (typeof window.currentUser === 'undefined') {
                await new Promise(resolve => setTimeout(resolve, 500)); // Simple wait
            }
            currentLoggedInUser = window.currentUser;
        } catch (error) {
            console.error('Error setting up UI:', error);
        }
    }

    // --- Fetch jobs ---

    async function fetchEmployerJobs(employerId) {
        const noJobsPostedText = (window.translations && window.translations['no_jobs_posted'] && window.translations['no_jobs_posted'][window.currentLanguage]) || 'No Jobs Posted Yet';
        const checkBackLaterText = (window.translations && window.translations['check_back_later'] && window.translations['check_back_later'][window.currentLanguage]) || 'This employer has not posted any jobs yet.';

        if (!employerJobsGrid) return;

        try {
            const response = await fetch(`/api/jobs/employer/${employerId}`);
            if (!response.ok) throw new Error('Failed to fetch jobs.');
            const data = await response.json();

            if (data.jobs.length === 0) {
                if (noEmployerJobs) {
                    noEmployerJobs.classList.remove('hidden');
                    noEmployerJobs.style.display = 'flex'; // Ensure flex
                }
                employerJobsGrid.innerHTML = '';
                return;
            }

            if (noEmployerJobs) noEmployerJobs.classList.add('hidden');
            employerJobsGrid.innerHTML = '';
            
            data.jobs.forEach(job => {
                const jobCardElement = createJobCard(job);
                employerJobsGrid.appendChild(jobCardElement);
            });
        } catch (error) {
            console.error('Error fetching jobs:', error);
            employerJobsGrid.innerHTML = `<p class="text-red-500 text-center col-span-full">Failed to load jobs.</p>`;
        }
    }

    // --- Fetch reviews ---

    async function fetchReviewsForEmployer(employerId) {
        if (!reviewsContainer || !reviewsCountSpan) return;

        reviewsContainer.innerHTML = createLoadingSpinner('loading_reviews');

        try {
            const response = await fetch(`/api/employer-reviews/${employerId}`);
            if (!response.ok) throw new Error('Failed to fetch reviews.');
            const data = await response.json();

            const reviews = data.reviews || [];

            const lang = window.currentLanguage || 'en';
            const reviewsText = lang === 'ar' ? 'تقييمات' : 'Reviews';

            reviewsCountSpan.textContent = reviews.length;
            if (employerReviewsCount) {
                employerReviewsCount.textContent = `(${reviews.length} ${reviewsText})`;
                if (reviews.length > 0 && employerRatingContainer) {
                    employerRatingContainer.classList.remove('hidden');
                }
            }

            reviewsContainer.innerHTML = '';

            if (reviews.length === 0) {
                if (noReviewsMessage) {
                    noReviewsMessage.classList.remove('hidden');
                    noReviewsMessage.style.display = 'flex';
                }
            } else {
                if (noReviewsMessage) noReviewsMessage.classList.add('hidden');
                
                let totalRating = 0;
                reviews.forEach(review => {
                    totalRating += review.rating;
                    reviewsContainer.appendChild(createReviewCard(review, employerId));
                });
                
                // Update average rating
                const avg = (totalRating / reviews.length).toFixed(1);
                if (employerAverageRating) employerAverageRating.textContent = avg;
            }

        } catch (error) {
            console.error('Error fetching reviews:', error);
            reviewsContainer.innerHTML = `<p class="text-red-500 text-center col-span-full">Failed to load reviews.</p>`;
        }
    }

    function createReviewCard(review, employerId) {
        const card = document.createElement('div');
        card.className = 'bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-6 relative overflow-hidden group';

        const reviewerInitials = ((review.reviewer_first_name?.[0] || '') + (review.reviewer_last_name?.[0] || '')).toUpperCase();
        const reviewDate = formatDate(review.created_at);
        
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            starsHtml += `<i class="${i <= review.rating ? 'fas text-amber-400' : 'far text-slate-200'} fa-star text-xs"></i>`;
        }

        const avatarContent = review.profile_picture_url 
            ? `<img src="${review.profile_picture_url}" class="w-full h-full object-cover">`
            : `<span class="text-hirly-600 font-bold">${reviewerInitials || 'U'}</span>`;

        card.innerHTML = `
            <div class="absolute top-0 right-0 w-32 h-32 bg-hirly-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-hirly-500/10 transition-colors"></div>
            
            <div class="flex items-start justify-between relative z-10">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 bg-hirly-50 rounded-2xl flex items-center justify-center text-xl border border-hirly-100 overflow-hidden shadow-sm">
                        ${avatarContent}
                    </div>
                    <div>
                        <a href="${review.reviewer_slug ? `/${review.reviewer_slug}` : `/profile.html?id=${review.reviewer_id}`}" class="font-black text-slate-900 hover:text-hirly-600 transition-colors block leading-tight">
                            ${review.reviewer_first_name} ${review.reviewer_last_name}
                        </a>
                        <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">${reviewDate}</div>
                    </div>
                </div>
                <div class="flex gap-0.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                    ${starsHtml}
                </div>
            </div>
            
            <div class="relative z-10">
                <p class="text-slate-600 leading-relaxed font-medium italic">"${review.comment || 'No comment provided.'}"</p>
            </div>

            <div class="pt-2 flex items-center gap-2 relative z-10">
                <div class="h-px flex-1 bg-slate-100"></div>
                <i class="fas fa-quote-right text-slate-200 text-sm"></i>
            </div>
        `;

        return card;
    }

    // --- Event listeners ---

    // Initial Star Rating Interaction Setup
    if (starRating) {
        const stars = starRating.querySelectorAll('i');
        stars.forEach(star => {
            star.addEventListener('click', function() {
                const rating = this.getAttribute('data-rating');
                if (ratingInput) ratingInput.value = rating;
                updateStarRatingDisplay(rating);
            });
        });
    }

    // Contact modal
    // ... removed ...
    
    // Review modal
    if (leaveReviewBtn) {
        leaveReviewBtn.addEventListener('click', () => {
            // 1. Not logged in
            if (!window.isAuthenticated || !window.currentUser) {
                showRestrictionModal('login_required_review', 'login');
                return;
            }

            const currentUserId = window.currentUser.id;
            const currentUserType = window.currentUserType || window.currentUser.userType || window.currentUser.user_type;

            // 2. Same employer reviewing self
            if (parseInt(currentUserId) === parseInt(profileEmployerId)) {
                showRestrictionModal('self_review_restriction');
                return;
            }

            // 3. Different employer trying to review
            if (currentUserType === 'employer') {
                showRestrictionModal('employer_restriction_review');
                return;
            }

            // 4. All good (Professional user)
            if (reviewModal) {
                reviewModal.style.display = 'flex';
                setTimeout(() => reviewModal.classList.add('show'), 10);
                document.body.classList.add('modal-open');
            }
        });
    }

    function updateStarRatingDisplay(rating) {
        if (!starRating) return;
        const stars = starRating.querySelectorAll('i');
        stars.forEach(star => {
            const starRatingVal = parseInt(star.getAttribute('data-rating'));
            if (starRatingVal <= rating) {
                star.classList.remove('far', 'text-slate-200');
                star.classList.add('fas', 'text-amber-400');
            } else {
                star.classList.remove('fas', 'text-amber-400');
                star.classList.add('far', 'text-slate-200');
            }
        });
    }

    function closeReviewModal() {
        if (reviewModal) {
            reviewModal.classList.remove('show');
            setTimeout(() => {
                reviewModal.style.display = 'none';
                document.body.classList.remove('modal-open');
            }, 300);
        }
    }

    function showRestrictionModal(messageKey, actionType = 'close') {
        const lang = window.currentLanguage || 'en';
        const message = (window.translations && window.translations[messageKey] && window.translations[messageKey][lang]) || messageKey;
        
        if (restrictionMessage) restrictionMessage.textContent = message;
        
        if (restrictionActionBtn) {
            if (actionType === 'login') {
                restrictionActionBtn.textContent = (window.translations && window.translations['login_now'] && window.translations['login_now'][lang]) || 'Login Now';
                restrictionActionBtn.onclick = () => window.location.href = '/login.html';
            } else {
                restrictionActionBtn.textContent = (window.translations && window.translations['got_it'] && window.translations['got_it'][lang]) || 'Got it';
                restrictionActionBtn.onclick = closeRestrictionModal;
            }
        }

        if (restrictionModal) {
            restrictionModal.style.display = 'flex';
            setTimeout(() => restrictionModal.classList.add('show'), 10);
            document.body.classList.add('modal-open');
        }
    }

    function closeRestrictionModal() {
        if (restrictionModal) {
            restrictionModal.classList.remove('show');
            setTimeout(() => {
                restrictionModal.style.display = 'none';
                document.body.classList.remove('modal-open');
            }, 300);
        }
    }

    if (closeRestrictionModalBtn) closeRestrictionModalBtn.addEventListener('click', closeRestrictionModal);
    if (restrictionModal) {
        restrictionModal.addEventListener('click', (e) => {
            if (e.target === restrictionModal) closeRestrictionModal();
        });
    }

    if (closeReviewModalBtn) closeReviewModalBtn.addEventListener('click', closeReviewModal);
    if (cancelReviewBtn) cancelReviewBtn.addEventListener('click', closeReviewModal);

    // Review Submission
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = reviewForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.textContent : 'Submit';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            }

            const rating = document.getElementById('ratingInput').value;
            const comment = document.getElementById('reviewComment') ? document.getElementById('reviewComment').value : '';

            if (rating == 0) {
                showToast((window.translations && window.translations['select_rating'] && window.translations['select_rating'][window.currentLanguage]) || 'Please select a rating.', 'error');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
                return;
            }

            try {
                const response = await fetch('/api/employer-reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        employerId: profileEmployerId,
                        rating: parseInt(rating),
                        comment: comment
                    })
                });

                const data = await response.json();

                if (data.success) {
                    showToast((window.translations && window.translations['review_submitted_successfully'] && window.translations['review_submitted_successfully'][window.currentLanguage]) || 'Review submitted successfully!', 'success');
                    closeReviewModal();
                    // Reset form
                    reviewForm.reset();
                    if(document.getElementById('ratingInput')) document.getElementById('ratingInput').value = '0';
                    updateStarRatingDisplay(0);
                    // Refresh reviews
                    fetchReviewsForEmployer(profileEmployerId);
                } else {
                    showToast(data.error || 'Failed to submit review.', 'error');
                }
            } catch (error) {
                console.error('Error submitting review:', error);
                showToast('An error occurred. Please try again.', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            }
        });
    }

    // Initial Load
    fetchEmployerProfile();
});
