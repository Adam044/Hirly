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

    // Contact Section & Modal Elements
    const contactEmployerBtn = document.getElementById('contactEmployerBtn');
    const contactModal = document.getElementById('contactModal');
    const closeContactModalBtn = document.getElementById('closeContactModalBtn');
    const modalCallBtn = document.getElementById('modalCallBtn');
    const modalPhoneNumber = document.getElementById('modalPhoneNumber');
    const modalEmailBtn = document.getElementById('modalEmailBtn');
    const modalEmailAddress = document.getElementById('modalEmailAddress');

    // Reviews Section Elements
    const reviewsSection = document.getElementById('reviewsSection');
    const reviewsCountSpan = document.getElementById('reviewsCount');
    const leaveReviewBtn = document.getElementById('leaveReviewBtn');
    const reviewsContainer = document.getElementById('reviewsContainer');
    const noReviewsMessage = document.getElementById('noReviewsMessage');

    // Review modal elements
    const reviewModal = document.getElementById('reviewModal');
    const closeReviewModalBtn = document.getElementById('closeReviewModalBtn');
    const reviewModalTitle = document.getElementById('reviewModalTitle');
    const reviewForm = document.getElementById('reviewForm');
    const reviewJobSelect = document.getElementById('reviewJobSelect');
    const starRating = document.getElementById('starRating');
    const ratingInput = document.getElementById('ratingInput');
    const reviewCommentInput = document.getElementById('reviewComment');
    const reviewMessageStatus = document.getElementById('reviewMessageStatus');
    const submitReviewBtn = document.querySelector('#reviewForm button[type="submit"]');

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
                window.location.href = `/job_details.html?id=${job.id}`;
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
        if (employerRatingContainer) employerRatingContainer.classList.remove('hidden');

        if (companyDescription) companyDescription.innerHTML = aboutDescription.replace(/\n/g, '<br>');

        // Update modal info
        if (modalPhoneNumber) modalPhoneNumber.textContent = contactPhone;
        if (modalEmailAddress) modalEmailAddress.textContent = contactEmail;
        if (modalCallBtn) modalCallBtn.href = `tel:${contactPhone !== naText ? contactPhone : '#'}`;
        if (modalEmailBtn) modalEmailBtn.href = `mailto:${contactEmail !== naText ? contactEmail : '#'}`;
    }

    // --- Viewer UI setup ---

    async function setupUIForViewer(profileUserId) {
        try {
            if (typeof window.currentUser === 'undefined') {
                await new Promise(resolve => setTimeout(resolve, 500)); // Simple wait
            }
            currentLoggedInUser = window.currentUser;

            // Show Reviews Section
            if (reviewsSection) reviewsSection.classList.remove('hidden');

            // Contact Button Logic
            if (contactEmployerBtn) contactEmployerBtn.style.display = 'inline-flex';
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

            reviewsCountSpan.textContent = reviews.length;
            if (employerReviewsCount) employerReviewsCount.textContent = `(${reviews.length} Reviews)`;

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
        card.className = 'bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-4';

        const reviewerInitials = (review.reviewer_first_name?.[0] || '') + (review.reviewer_last_name?.[0] || '');
        const reviewDate = formatDate(review.created_at);
        
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            starsHtml += `<i class="${i <= review.rating ? 'fas text-amber-400' : 'far text-slate-200'} fa-star"></i>`;
        }

        card.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-hirly-50 rounded-full flex items-center justify-center text-hirly-600 font-bold text-lg border border-hirly-100">
                    ${reviewerInitials.toUpperCase()}
                </div>
                <div>
                    <a href="/profile.html?id=${review.reviewer_id}" class="font-bold text-slate-900 hover:text-hirly-600 transition-colors">
                        ${review.reviewer_first_name} ${review.reviewer_last_name}
                    </a>
                    <div class="text-xs text-slate-400 font-medium">${reviewDate}</div>
                </div>
            </div>
            <div class="flex gap-1 text-sm">${starsHtml}</div>
            <p class="text-slate-600 leading-relaxed">${review.comment || 'No comment provided.'}</p>
        `;

        return card;
    }

    // --- Event listeners ---

    // Contact modal
    if (contactEmployerBtn) {
        contactEmployerBtn.addEventListener('click', () => {
            if (contactModal) {
                contactModal.style.display = 'flex';
                setTimeout(() => contactModal.classList.add('show'), 10);
                document.body.classList.add('modal-open');
            }
        });
    }

    function closeContactModal() {
        if (contactModal) {
            contactModal.classList.remove('show');
            setTimeout(() => {
                contactModal.style.display = 'none';
                document.body.classList.remove('modal-open');
            }, 300);
        }
    }

    if (closeContactModalBtn) closeContactModalBtn.addEventListener('click', closeContactModal);
    if (contactModal) {
        contactModal.addEventListener('click', (e) => {
            if (e.target === contactModal) closeContactModal();
        });
    }

    // Review modal
    if (leaveReviewBtn) {
        leaveReviewBtn.addEventListener('click', () => {
            if (!currentLoggedInUser) {
                showToast((window.translations && window.translations['please_login_to_review'] && window.translations['please_login_to_review'][window.currentLanguage]) || 'Please log in to leave a review.', 'error');
                return;
            }

            if (currentLoggedInUser.id === parseInt(profileEmployerId)) {
                showToast((window.translations && window.translations['cannot_review_self'] && window.translations['cannot_review_self'][window.currentLanguage]) || 'You cannot review yourself.', 'error');
                return;
            }

            if (reviewModal) {
                reviewModal.style.display = 'flex';
                setTimeout(() => reviewModal.classList.add('show'), 10);
                document.body.classList.add('modal-open');
                
                // Initialize Star Rating Interaction
                if (starRating) {
                    const stars = starRating.querySelectorAll('i');
                    stars.forEach(star => {
                        star.addEventListener('click', function() {
                            const rating = this.getAttribute('data-rating');
                            ratingInput.value = rating;
                            updateStarRatingDisplay(rating);
                        });
                    });
                }
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

    if (closeReviewModalBtn) closeReviewModalBtn.addEventListener('click', closeReviewModal);

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
