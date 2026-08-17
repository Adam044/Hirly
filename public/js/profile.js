/* profile.js */

// Global state for accessibility
let currentFreelancerEmail = '';
let currentFreelancerPhone = '';
let currentLoggedInUser = null;
let profileIsOwn = false;
let freelancerId;
let freelancerSlug;

// UI Elements
let pageLoadingOverlay, profileAvatar, profileName, profileLocation, profileBio, fullBioContent, skillsContainer, cvCtaContainer, reviewsCountSpan, leaveReviewBtn, reviewsContainer, averageRatingValue, reviewsCountParenthesis, profileEducation, educationContent, profileProfession, profileDegreeContainer, profileDegree, profileInstitutionContainer, profileInstitution, contactModal, closeContactModalBtn, modalPhoneNumber, modalEmailAddress, modalCallBtn, modalEmailBtn, offerModal, closeOfferModalBtn, offerForm, offerJobSelect, offerMessageInput, offerMessageStatus, cancelOfferBtn, submitOfferBtn, reviewModal, closeReviewModalBtn, reviewForm, reviewJobSelect, starRating, ratingInput, reviewCommentInput, reviewMessageStatus, cancelReviewBtn, submitReviewBtn, confirmationModal, restrictionModal, restrictionTitle, restrictionMessage, restrictionIcon, restrictionActionBtn, closeRestrictionModalBtn, employerLoginModal, closeEmployerLoginModalBtn, confirmationModalMessage, confirmActionBtn, cancelActionBtn, servicesGrid, serviceDetailsModal, closeServiceDetailsModalBtn, serviceDetailsModalContent, callModal, closeCallModalBtn, emailModal, closeEmailModalBtn, shareProfileModal, closeShareModalBtn, profileLinkInput, copyLinkBtn, copySuccessMsg, qrCodeContainer, shareWhatsAppBtn, shareFacebookBtn, shareMessengerBtn;

// Action Buttons
let sidebarContactBtn, sidebarOfferBtn, sidebarShareBtn, sidebarCopyLinkBtn;
let ctaContactBtn, ctaOfferBtn, ctaShareBtn;
let mainContactBtnMobile, sendOfferBtnMobile, shareProfileBtnMobile;

// Global helper functions
function translate(key, defaultText) {
    const t = window.translations || {};
    const lang = window.currentLanguage || 'ar';
    return (t[key] && t[key][lang]) || defaultText;
}

const isEmployerOrAdmin = () => {
    const user = currentLoggedInUser || window.currentUser;
    const type = (user && user.user_type) || '';
    return ['employer', 'admin'].includes(type.toLowerCase().trim());
};

function showModal(modal) {
    if (!modal) return;
    modal.classList.add('show');
    document.body.classList.add('modal-open');
}

function hideModal(modal) {
    if (!modal) return;
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
}

const openContactModal = () => {
    const contactModal = document.getElementById('contactModal');
    const modalPhoneNumber = document.getElementById('modalPhoneNumber');
    const modalEmailAddress = document.getElementById('modalEmailAddress');
    const modalCallBtn = document.getElementById('modalCallBtn');
    const modalEmailBtn = document.getElementById('modalEmailBtn');
    
    if (modalPhoneNumber) modalPhoneNumber.textContent = currentFreelancerPhone || 'N/A';
    if (modalEmailAddress) modalEmailAddress.textContent = currentFreelancerEmail || 'N/A';
    if (modalCallBtn) modalCallBtn.href = currentFreelancerPhone ? `tel:${currentFreelancerPhone}` : '#';
    if (modalEmailBtn) modalEmailBtn.href = currentFreelancerEmail ? `mailto:${currentFreelancerEmail}` : '#';
    showModal(contactModal);
};

const openShareModal = async () => {
    try {
        const profileLinkInput = document.getElementById('profileLinkInput');
        const qrCodeContainer = document.getElementById('qrCodeContainer');
        const shareProfileModal = document.getElementById('shareProfileModal');
        
        // Helper to get ID from URL if not already set
        const getFreelancerIdFromUrl = () => {
            const urlParams = new URLSearchParams(window.location.search);
            const idFromQuery = urlParams.get('id');
            if (idFromQuery && !isNaN(idFromQuery) && parseInt(idFromQuery) > 0) return idFromQuery;
            
            const pathSegments = window.location.pathname.split('/').filter(Boolean);
            const lastSegment = pathSegments[pathSegments.length - 1];
            if (lastSegment && !isNaN(lastSegment) && parseInt(lastSegment) > 0) return lastSegment;
            
            return freelancerId;
        };

        const currentFreelancerId = getFreelancerIdFromUrl();
        if (currentFreelancerId || freelancerSlug) {
            // Use current origin and slug if available for a nice URL
            const profilePath = freelancerSlug ? `/${freelancerSlug}` : `/profile.html?id=${currentFreelancerId}`;
            const profileUrl = `${window.location.origin}${profilePath}`;
            
            if (profileLinkInput) profileLinkInput.value = profileUrl;
            
            if (qrCodeContainer) {
                qrCodeContainer.innerHTML = '';
                try {
                    if (typeof qrcode !== 'undefined') {
                        const qr = qrcode(0, 'H');
                        qr.addData(profileUrl);
                        qr.make();
                        qrCodeContainer.innerHTML = qr.createImgTag(5, 0);
                    } else if (window.QRCode) {
                        new QRCode(qrCodeContainer, {
                            text: profileUrl,
                            width: 180,
                            height: 180,
                            colorDark: "#000000",
                            colorLight: "#ffffff",
                            correctLevel: QRCode.CorrectLevel.H
                        });
                    } else {
                        qrCodeContainer.innerHTML = `<div class="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-xs">${translate('qr_code_fallback', 'QR Code')}</div>`;
                    }
                } catch (error) {
                    console.error('QR Code generation failed:', error);
                    qrCodeContainer.innerHTML = `<div class="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-xs">${translate('qr_code_fallback', 'QR Code')}</div>`;
                }
            }
            
            showModal(shareProfileModal);
        } else {
            if (typeof showToast === 'function') showToast(translate('error_no_id_found', 'Error: No freelancer ID found'), 'error');
        }
    } catch (error) {
        console.error('Error opening share modal:', error);
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Safety timeout: Hide loading overlay after 8 seconds no matter what
    pageLoadingOverlay = document.getElementById('pageLoadingOverlay');
    setTimeout(() => {
        if (pageLoadingOverlay && pageLoadingOverlay.classList.contains('show')) {
            console.warn('Loading overlay removed by safety timeout');
            pageLoadingOverlay.classList.remove('show');
        }
    }, 8000);

    // Translations setup
    const t = window.translations || {};
    const lang = window.currentLanguage || 'ar';
    // Get freelancerId or slug from either path or query parameters
    // let freelancerId; // already defined globally
    // let freelancerSlug; // already defined globally
    // let profileIsOwn = false; // already defined globally
    let isPublicUser = true;

    // Attempt to extract ID or slug from URL path (e.g., /profile/123 or /@adam)
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];

    if (lastSegment) {
        if (!isNaN(lastSegment) && parseInt(lastSegment) > 0) {
            freelancerId = lastSegment;
        } else if (!lastSegment.includes('.')) {
            // It's likely a slug (clean URL)
            freelancerSlug = lastSegment.replace('@', '');
        }
    }

    // Helper function to get freelancer ID from URL
    function getFreelancerIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const idFromQuery = urlParams.get('id');
        if (idFromQuery && !isNaN(idFromQuery) && parseInt(idFromQuery) > 0) {
            return idFromQuery;
        }
        return freelancerId; // fallback to the global freelancerId
    }

    // Helper function to show employer login modal
    function showEmployerLoginModal() {
        const modal = document.getElementById('employerLoginModal');
        if (modal) {
            modal.classList.add('show');
            document.body.classList.add('modal-open');
        }
    }

    if (!freelancerId) {
        const urlParams = new URLSearchParams(window.location.search);
        const idFromQuery = urlParams.get('id');
        if (idFromQuery && !isNaN(idFromQuery) && parseInt(idFromQuery) > 0) {
            freelancerId = idFromQuery;
        }
    }

    profileAvatar = document.getElementById('profileAvatar');
    profileName = document.getElementById('profileName');
    profileLocation = document.getElementById('profileLocation');
    profileBio = document.getElementById('profileBio');
    fullBioContent = document.getElementById('fullBioContent');
    skillsContainer = document.getElementById('skillsContainer');
    cvCtaContainer = document.getElementById('cvCtaContainer');
    reviewsCountSpan = document.getElementById('reviewsCount');
    leaveReviewBtn = document.getElementById('leaveReviewBtn');
    reviewsContainer = document.getElementById('reviewsContainer');
    averageRatingValue = document.getElementById('averageRatingValue');
    reviewsCountParenthesis = document.getElementById('reviewsCountParenthesis');
    profileEducation = document.getElementById('profileEducation');
    educationContent = document.getElementById('educationContent');
    profileProfession = document.getElementById('profileProfession');
    profileDegreeContainer = document.getElementById('profileDegreeContainer');
    profileDegree = document.getElementById('profileDegree');
    profileInstitutionContainer = document.getElementById('profileInstitutionContainer');
    profileInstitution = document.getElementById('profileInstitution');
    servicesGrid = document.getElementById('servicesGrid');

    // Action Buttons Selection
    sidebarContactBtn = document.getElementById('sidebarContactBtn');
    sidebarOfferBtn = document.getElementById('sidebarOfferBtn');
    sidebarShareBtn = document.getElementById('sidebarShareBtn');
    sidebarCopyLinkBtn = document.getElementById('sidebarCopyLinkBtn');
    
    ctaContactBtn = document.getElementById('ctaContactBtn');
    ctaOfferBtn = document.getElementById('ctaOfferBtn');
    ctaShareBtn = document.getElementById('ctaShareBtn');
    
    mainContactBtnMobile = document.getElementById('mainContactBtnMobile');
    sendOfferBtnMobile = document.getElementById('sendOfferBtnMobile');
    shareProfileBtnMobile = document.getElementById('shareProfileBtnMobile');

    // Sidebar & Stats
    // Removed sidebarLocation and sidebarRating as the section was removed

    // Setup Action Buttons
    setupActionButtons();

    // Copy Link Helper
    const handleCopyLink = (btn) => {
        if (!btn) return;
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            const originalContent = btn.innerHTML;
            const successText = translate('link_copied', 'Copied!');
            btn.innerHTML = `<i class="fas fa-check"></i> <span>${successText}</span>`;
            
            setTimeout(() => {
                btn.innerHTML = originalContent;
            }, 2000);
        });
    };

    if (sidebarCopyLinkBtn) sidebarCopyLinkBtn.addEventListener('click', () => handleCopyLink(sidebarCopyLinkBtn));

    // NEW: Service Details Modal
    serviceDetailsModal = document.getElementById('serviceDetailsModal');
    closeServiceDetailsModalBtn = document.getElementById('closeServiceDetailsModalBtn');
    serviceDetailsModalContent = document.getElementById('serviceDetailsModalContent');

    // Contact Modal
    contactModal = document.getElementById('contactModal');
    closeContactModalBtn = document.getElementById('closeContactModalBtn');

    // Employer Login Modal
    employerLoginModal = document.getElementById('employerLoginModal');
    closeEmployerLoginModalBtn = document.getElementById('closeEmployerLoginModalBtn');

    // Offer Modal
    offerModal = document.getElementById('offerModal');
    closeOfferModalBtn = document.getElementById('closeOfferModalBtn');

    // Restriction Modal
    restrictionModal = document.getElementById('restrictionModal');
    restrictionTitle = document.getElementById('restrictionTitle');
    restrictionMessage = document.getElementById('restrictionMessage');
    restrictionIcon = document.getElementById('restrictionIcon');
    restrictionActionBtn = document.getElementById('restrictionActionBtn');
    closeRestrictionModalBtn = document.getElementById('closeRestrictionModalBtn');

    if (restrictionActionBtn) restrictionActionBtn.onclick = () => hideModal(restrictionModal);
    if (closeRestrictionModalBtn) closeRestrictionModalBtn.onclick = () => hideModal(restrictionModal);

    // Review Modal
    reviewModal = document.getElementById('reviewModal');
    closeReviewModalBtn = document.getElementById('closeReviewModalBtn');
    reviewForm = document.getElementById('reviewForm');
    reviewJobSelect = document.getElementById('reviewJobSelect');
    starRating = document.getElementById('starRating');
    ratingInput = document.getElementById('ratingInput');
    reviewCommentInput = document.getElementById('reviewCommentInput');
    cancelReviewBtn = document.getElementById('cancelReviewBtn');
    submitReviewBtn = document.getElementById('submitReviewBtn');

    if (closeReviewModalBtn) closeReviewModalBtn.onclick = () => hideModal(reviewModal);
    if (cancelReviewBtn) cancelReviewBtn.onclick = () => hideModal(reviewModal);

    if (reviewForm) {
        reviewForm.onsubmit = async (e) => {
            e.preventDefault();
            const rating = ratingInput.value;
            const comment = reviewCommentInput.value;
            const jobId = reviewJobSelect.value;

            if (!rating || rating === '0') {
                showToast(translate('please_select_rating', 'Please select a rating.'), 'error');
                return;
            }

            if (!comment || comment.trim().length < 10) {
                showToast(translate('comment_too_short', 'Comment must be at least 10 characters.'), 'error');
                return;
            }

            try {
                submitReviewBtn.disabled = true;
                submitReviewBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> ${translate('submitting', 'Submitting...')}`;

                const response = await fetch('/api/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jobId,
                        professionalId: freelancerId,
                        rating: parseInt(rating),
                        comment
                    })
                });

                const data = await response.json();
                if (data.success) {
                    showToast(translate('review_submitted_success', 'Review submitted successfully!'), 'success');
                    hideModal(reviewModal);
                    reviewForm.reset();
                    // Reset stars
                    if (starRating) {
                        const stars = starRating.querySelectorAll('i');
                        stars.forEach(s => {
                            s.classList.remove('fas', 'text-amber-400');
                            s.classList.add('far', 'text-slate-300');
                        });
                    }
                    await fetchReviewsForFreelancer(freelancerId);
                } else {
                    showToast(data.error || translate('failed_to_submit_review', 'Failed to submit review.'), 'error');
                }
            } catch (error) {
                console.error('Error submitting review:', error);
                showToast(translate('error_submitting_review', 'An error occurred while submitting your review.'), 'error');
            } finally {
                submitReviewBtn.disabled = false;
                submitReviewBtn.innerHTML = translate('submit_review', 'Submit Review');
            }
        };
    }

    // Confirmation Modal
    confirmationModal = document.getElementById('confirmationModal');
    confirmationModalMessage = document.getElementById('confirmationModalMessage');
    confirmActionBtn = document.getElementById('confirmActionBtn');
    cancelActionBtn = document.getElementById('cancelActionBtn');

    if (cancelActionBtn) cancelActionBtn.onclick = () => hideModal(confirmationModal);

    // Call Modal Elements
    callModal = document.getElementById('callModal');
    closeCallModalBtn = document.getElementById('closeCallModalBtn');

    // Email Modal Elements
    emailModal = document.getElementById('emailModal');
    closeEmailModalBtn = document.getElementById('closeEmailModalBtn');

    // Share Profile Modal Elements
    shareProfileBtn = document.getElementById('shareProfileBtn');
    shareProfileModal = document.getElementById('shareProfileModal');
    closeShareModalBtn = document.getElementById('closeShareModalBtn');
    profileLinkInput = document.getElementById('profileLinkInput');
    copyLinkBtn = document.getElementById('copyLinkBtn');
    copySuccessMsg = document.getElementById('copySuccessMsg');
    qrCodeContainer = document.getElementById('qrCodeContainer');
    shareWhatsAppBtn = document.getElementById('shareWhatsAppBtn');
    shareFacebookBtn = document.getElementById('shareFacebookBtn');
    shareMessengerBtn = document.getElementById('shareMessengerBtn');


    // let currentFreelancerEmail = ''; // already defined globally
    // let currentFreelancerPhone = ''; // already defined globally
    // let currentLoggedInUser = null; // already defined globally
    let myJobs = [];
    let eligibleJobsForReview = [];
    let allServices = [];

    const talentCategoriesData = window.globalCategoriesAndProfessions || [];
    const palestinianCitiesTranslations = window.palestinianCitiesTranslations || {};
    
    // Unified Contact Logic
    const openContactModal = () => {
        const contactModal = document.getElementById('contactModal');
        const modalPhoneNumber = document.getElementById('modalPhoneNumber');
        const modalEmailAddress = document.getElementById('modalEmailAddress');
        const modalCallBtn = document.getElementById('modalCallBtn');
        const modalEmailBtn = document.getElementById('modalEmailBtn');
        
        // Fix: Check if current viewer is the profile owner
        const isOwner = window.currentUser && (window.currentUser.id === freelancerId || window.currentUser.id === parseInt(freelancerId));
        
        // If it's NOT the owner and NOT an employer/admin, show login modal
        if (!isOwner && !isEmployerOrAdmin()) {
            showEmployerLoginModal();
            return;
        }

        if (modalPhoneNumber) modalPhoneNumber.textContent = currentFreelancerPhone || 'N/A';
        if (modalEmailAddress) modalEmailAddress.textContent = currentFreelancerEmail || 'N/A';
        if (modalCallBtn) modalCallBtn.href = currentFreelancerPhone ? `tel:${currentFreelancerPhone}` : '#';
        if (modalEmailBtn) modalEmailBtn.href = currentFreelancerEmail ? `mailto:${currentFreelancerEmail}` : '#';
        showModal(contactModal);
    };

    if (closeContactModalBtn) {
        closeContactModalBtn.addEventListener('click', () => hideModal(contactModal));
    }

    if (closeEmployerLoginModalBtn) {
        closeEmployerLoginModalBtn.addEventListener('click', () => hideModal(employerLoginModal));
    }

    if (closeOfferModalBtn) {
        closeOfferModalBtn.addEventListener('click', () => hideModal(offerModal));
    }

    if (closeReviewModalBtn) {
        closeReviewModalBtn.addEventListener('click', () => hideModal(reviewModal));
    }

    if (closeShareModalBtn) {
        closeShareModalBtn.addEventListener('click', () => hideModal(shareProfileModal));
    }

    function createLoadingSpinner(text = (window.translations && window.translations['loading'] && window.translations['loading'][window.currentLanguage || 'ar']) || 'Loading...') {
        return `<div class="loading-spinner text-center text-slate-400 p-8"><i class="fas fa-spinner fa-spin text-4xl"></i><span class="mt-3 text-sm block">${text}</span></div>`;
    }
    
    function getTranslatedText(key, fallback) {
        const t = window.translations;
        const currentLang = window.currentLanguage;
        return (t && t[key] && t[key][currentLang]) || fallback;
    }
    
    function getCurrencySymbol(currencyCode) {
        switch (currencyCode) {
            case 'USD': return '$';
            case 'ILS': return '₪';
            case 'JOD': return 'JD';
            case 'EUR': return '€';
            default: return '';
        }
    }
    
    function getTranslatedCityName(cityInput) {
        if (!cityInput) return '';
        const lang = window.currentLanguage || 'ar';
        const data = window.palestinianCitiesTranslations || {};
        
        // 1. Check if it's already a valid key (e.g., 'city_ad_dhahiriya')
        if (data[cityInput]) {
            return data[cityInput][lang] || data[cityInput].en;
        }

        // 2. Try to find by normalized English or Arabic name
        const normalize = (s) => String(s).toLowerCase().replace(/[_\s\-]/g, '');
        const normalizedInput = normalize(cityInput);

        const foundKey = Object.keys(data).find(key => {
            const cityData = data[key];
            return normalize(cityData.en) === normalizedInput || normalize(cityData.ar || '') === normalizedInput || normalize(key.replace('city_', '')) === normalizedInput;
        });

        if (foundKey) {
            return data[foundKey][lang] || data[foundKey].en;
        }

        // 3. Fallback: Clean up the raw input for display
        let displayValue = cityInput.replace('city_', '').replace('country_', '').replace(/_/g, ' ');
        return displayValue.charAt(0).toUpperCase() + displayValue.slice(1);
    }
    
    function getTranslatedProfessionName(professionEnName) {
        if (!professionEnName) return '';
        const lang = window.currentLanguage || 'en';
        
        // Find in categories-professions
        if (window.globalCategoriesAndProfessions) {
            for (const cat of window.globalCategoriesAndProfessions) {
                const foundProf = cat.professions.find(p => {
                    const enName = (p.name?.en || p.en || p);
                    return String(enName).toLowerCase() === String(professionEnName).toLowerCase();
                });
                if (foundProf) {
                    return foundProf.name ? (foundProf.name[lang] || foundProf.name.en) : (typeof foundProf === 'object' ? (foundProf[lang] || foundProf.en) : foundProf);
                }
            }
        }
        return professionEnName;
    }

    // Function to get English initials, converting Arabic characters if necessary
    function getEnglishInitials(firstName, lastName) {
      const arabicMap = {
        'ا': 'A', 'ب': 'B', 'ت': 'T', 'ث': 'Th', 'ج': 'J', 'ح': 'H', 'خ': 'Kh',
        'د': 'D', 'ذ': 'Dh', 'ر': 'R', 'ز': 'Z', 'س': 'S', 'ش': 'Sh', 'ص': 'S',
        'ض': 'D', 'ط': 'T', 'ظ': 'Z', 'ع': 'A', 'غ': 'Gh', 'ف': 'F', 'ق': 'Q',
        'ك': 'K', 'ل': 'L', 'م': 'M', 'ن': 'N', 'ه': 'H', 'و': 'W', 'ي': 'Y'
      };

      let initial1 = '';
      if (firstName && firstName.charAt(0)) {
        const firstChar = firstName.charAt(0).toUpperCase();
        initial1 = arabicMap[firstChar] ? arabicMap[firstChar] : firstChar;
      }

      let initial2 = '';
      if (lastName && lastName.charAt(0)) {
        const firstChar = lastName.charAt(0).toUpperCase();
        initial2 = arabicMap[firstChar] ? arabicMap[firstChar] : firstChar;
      }

      return (initial1 + initial2).toUpperCase();
    }
    
    // NEW: Helper to detect text direction (LTR/RTL)
    function getTextDirection(text) {
        if (!text) return 'ltr';
        // Arabic unicode range: 0600-06FF, 0750-077F, 08A0-08FF, FB50-FDFF, FE70-FEFF
        const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
        return arabicPattern.test(text) ? 'rtl' : 'ltr';
    }

    // FIX: New function to create a premium service card
    function createServiceCard(service) {
        const lang = window.currentLanguage || 'en';
        const t = window.translations;

        const card = document.createElement('div');
        card.className = 'luxe-card group p-6 flex flex-col h-full relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border border-white/50 bg-white/60 backdrop-blur-md cursor-pointer';
        card.dataset.serviceId = service.id;
        
        const titleDir = getTextDirection(service.service_title);
                const descDir = getTextDirection(service.service_description);
                
                card.innerHTML = `
            <!-- Decorative Gradient -->
            <div class="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div class="absolute -right-10 -top-10 w-40 h-40 bg-hirly-500/10 rounded-full blur-3xl group-hover:bg-hirly-500/20 transition-all duration-500 pointer-events-none"></div>

            <div class="relative z-10 flex flex-col h-full">
                <div class="flex justify-between items-start mb-5">
                     <div class="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-hirly-500 text-xl group-hover:scale-110 group-hover:bg-hirly-500 group-hover:text-white transition-all duration-500">
                        <i class="fas fa-briefcase"></i>
                     </div>
                     <span class="px-3 py-1 bg-slate-50 text-slate-500 border border-slate-100 text-[10px] font-black rounded-full uppercase tracking-widest group-hover:border-hirly-200 group-hover:text-hirly-600 transition-colors">
                        ${service.category_name || translate('service_fallback', 'Service')}
                     </span>
                </div>
                
                <h3 class="text-xl font-black text-slate-900 mb-3 group-hover:text-hirly-600 transition-colors line-clamp-2 leading-tight" dir="${titleDir}">${service.service_title}</h3>
                <p class="text-slate-500 font-medium text-sm leading-relaxed mb-6 line-clamp-3 flex-grow" dir="${descDir}">${service.service_description || ''}</p>
                
                <div class="flex items-center justify-between pt-5 border-t border-slate-100/60 mt-auto">
                    <div>
                        <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">${translate('investment_label', 'Investment')}</p>
                        <p class="text-lg font-black text-slate-900 tracking-tight">${service.price} <span class="text-xs font-bold text-slate-400 ml-0.5">${getCurrencySymbol(service.currency)}</span></p>
                    </div>
                    <button class="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:bg-hirly-600 transition-all duration-500 shadow-lg group-hover:shadow-hirly-500/30">
                        <i class="fas ${lang === 'ar' ? 'fa-arrow-left' : 'fa-arrow-right'} text-xs transform group-hover:translate-x-0.5 transition-transform"></i>
                    </button>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            const serviceId = card.dataset.serviceId;
            const serviceData = allServices.find(s => s.id == serviceId);
            if (serviceData) {
                showServiceDetailsModal(serviceData);
            }
        });

        return card;
    }

    // FIX: Refactored fetchFreelancerServices to use the new compact layout
    async function fetchFreelancerServices() {
        const lang = window.currentLanguage || 'en';
        const t = window.translations;

        if (!servicesGrid || !freelancerId) return;
        
        servicesGrid.innerHTML = createLoadingSpinner(translate('loading_services', 'Loading services...'));

        try {
            const response = await fetch(`/api/users/${freelancerId}/services`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || translate('failed_to_load_services', 'Failed to fetch services'));
            }
            const data = await response.json();
            allServices = data.services || [];
            
            if (allServices.length > 0) {
                if (servicesGrid.closest('section')) servicesGrid.closest('section').classList.remove('hidden');
                servicesGrid.innerHTML = '';
                allServices.forEach(service => {
                    const card = createServiceCard(service);
                    servicesGrid.appendChild(card);
                });

                servicesGrid.querySelectorAll('.view-service-modal-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const serviceId = e.currentTarget.dataset.serviceId;
                        const service = allServices.find(s => s.id == serviceId);
                        if (service) {
                            showServiceDetailsModal(service);
                        }
                    });
                });
                
            } else {
                if (servicesGrid.closest('section')) servicesGrid.closest('section').classList.add('hidden');
                servicesGrid.innerHTML = `<p class="text-center text-slate-500 p-8" data-lang-key="no_services_found_message">${translate('no_services_found_message', 'No services found.')}</p>`;
            }

        } catch (error) {
            console.error('Error fetching freelancer services:', error);
            servicesGrid.innerHTML = `<p class="text-center text-red-500 p-8">${translate('failed_to_load_services', 'Failed to load services')}</p>`;
        }
    }
    
    function showServiceDetailsModal(service) {
        const lang = window.currentLanguage || 'en';
        const t = window.translations;
        
        if (!serviceDetailsModalContent) return;

        const modalContent = `
            <div class="luxe-card w-full p-8 animate-fade-up bg-white rounded-[2rem] shadow-2xl">
                <!-- Header -->
                <div class="flex items-center justify-between mb-8">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-100">
                            <i class="fas fa-bolt text-2xl"></i>
                        </div>
                        <div>
                            <h2 class="text-2xl font-black text-slate-900 tracking-tight" data-lang-key="service_details_title">${translate('service_details_title', 'Service Details')}</h2>
                            <p class="text-slate-500 font-medium text-sm" data-lang-key="service_details_subtitle">${translate('service_details_subtitle', 'View service information')}</p>
                        </div>
                    </div>
                    <button id="closeServiceDetailsModalBtn" class="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all border border-slate-200">
                        <i class="fas fa-xmark text-xl"></i>
                    </button>
                </div>

                <!-- Content -->
                <div class="space-y-8">
                    <div class="flex justify-between items-start gap-6">
                        <div class="space-y-2">
                            <h2 class="text-3xl font-black text-slate-900 leading-tight tracking-tight">${service.service_title}</h2>
                        </div>
                        <div class="bg-hirly-50 px-6 py-3 rounded-2xl flex-shrink-0 border border-hirly-100">
                            <span class="text-hirly-600 font-black text-xl tracking-tight">
                                ${getCurrencySymbol(service.currency)}${service.price}
                            </span>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2" data-lang-key="service_modal_delivery_time">${translate('service_timeline', 'Timeline')}</span>
                            <span class="text-base font-bold text-slate-700">${service.delivery_time || translate('n_a', 'N/A')}</span>
                        </div>
                        <div class="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2" data-lang-key="service_modal_category">${translate('service_category', 'Category')}</span>
                            <span class="text-base font-bold text-slate-700">${service.category || translate('status_other', 'General')}</span>
                        </div>
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest" data-lang-key="service_modal_description_title">${translate('service_description', 'Description')}</h3>
                        <div class="text-slate-600 font-medium leading-relaxed text-base bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            ${(service.service_description || '').replace(/\n/g, '<br>')}
                        </div>
                    </div>

                    <button class="service-modal-contact-btn w-full py-4 bg-hirly-600 text-white font-black rounded-2xl shadow-lg shadow-hirly-200 hover:bg-hirly-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 group">
                        <i class="fas fa-paper-plane text-sm group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"></i>
                        <span class="tracking-tight" data-lang-key="request_service">${translate('request_service', 'Request this Service')}</span>
                    </button>
                </div>
            </div>
        `;

        serviceDetailsModalContent.innerHTML = modalContent;
        showModal(serviceDetailsModal);
        
        const closeBtn = serviceDetailsModalContent.querySelector('#closeServiceDetailsModalBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                 hideModal(serviceDetailsModal);
            });
        }
        
        // Add contact button functionality
        const contactBtn = serviceDetailsModalContent.querySelector('.service-modal-contact-btn');
        if (contactBtn) {
            contactBtn.addEventListener('click', () => {
                hideModal(serviceDetailsModal);
                // Check if employer before opening contact modal
                if (isEmployerOrAdmin()) {
                    openContactModal();
                } else {
                    showEmployerLoginModal();
                }
            });
        }
    }
    
    // FIX: Removed this listener since the button is now inside the dynamically generated modal content
    // if (closeServiceDetailsModalBtn) {
    //     closeServiceDetailsModalBtn.addEventListener('click', () => hideModal(serviceDetailsModal));
    // }

    async function fetchFreelancerProfile() {
        const lang = window.currentLanguage || 'en';
        const t = window.translations;

        try {
            if (pageLoadingOverlay) pageLoadingOverlay.classList.add('show');
            
            let apiUrl = freelancerId ? `/api/users/${freelancerId}` : `/api/users/by-slug/${freelancerSlug}`;
            
            const response = await fetch(apiUrl);
            if (!response.ok) {
                if (response.status === 403) {
                    const errorData = await response.json();
                    let message = errorData.error;
                    if (message === 'This profile is private') {
                        message = translate('profile_is_private', 'This profile is private');
                    } else if (message === 'This profile is only visible to companies') {
                        message = translate('profile_visible_companies_only', 'This profile is only visible to companies');
                    }
                    throw new Error(message);
                }
                const errorData = await response.json();
                throw new Error(errorData.error || translate('failed_to_load_profile', 'Failed to load profile'));
            }
            const data = await response.json();

            if (data.success && data.professional) {
                // Set freelancerId and slug from the fetched data if they weren't already set
                if (!freelancerId) freelancerId = data.professional.id;
                if (!freelancerSlug) freelancerSlug = data.professional.slug;
                
                renderProfile(data.professional);
                currentFreelancerEmail = data.professional.email;
                currentFreelancerPhone = data.professional.phone;
                
                // Hide contact buttons if no info is available (REMOVED: Button should stay visible for non-employers to trigger modal)
                // if (!currentFreelancerPhone && !currentFreelancerEmail) {
                //    if (sidebarContactBtn) sidebarContactBtn.style.display = 'none';
                //    if (ctaContactBtn) ctaContactBtn.style.display = 'none';
                //    if (mainContactBtnMobile) mainContactBtnMobile.style.display = 'none';
                // }

                // Wrap dependent calls in try-catch to ensure one failure doesn't block everything
                try {
                    await setupUIForViewer(data.professional.id);
                } catch (uiError) {
                    console.error('Error setting up UI for viewer:', uiError);
                }

                try {
                    await fetchReviewsForFreelancer(freelancerId);
                } catch (reviewsError) {
                    console.error('Error fetching reviews:', reviewsError);
                }

                try {
                    await fetchFreelancerServices();
                } catch (servicesError) {
                    console.error('Error fetching services:', servicesError);
                }
            } else {
                throw new Error(data.error || translate('profile_not_found', 'Freelancer profile not found.'));
            }
        } catch (error) {
            console.error('Error fetching freelancer profile:', error);
            renderErrorState(error.message);
        } finally {
            if (pageLoadingOverlay) pageLoadingOverlay.classList.remove('show');
        }
    }

    function getTranslatedDegreeName(degree) {
        if (!degree) return '';
        const lang = window.currentLanguage || 'en';
        const key = `degree_${String(degree).toLowerCase()}`;
        return (window.translations && window.translations[key] && window.translations[key][lang]) || degree;
    }

    // Helper for smart profession display with icon
    function getSmartProfessionData(freelancer) {
        const lang = window.currentLanguage || 'en';
        const status = (freelancer.current_status || '').trim().toLowerCase();
        
        let text = '';
        let icon = '';

        // Helper to guess icon from profession name
        const getProfessionIcon = (name) => {
            if (!name) return 'fa-briefcase';
            const p = name.toLowerCase();
            if (p.includes('software') || p.includes('developer') || p.includes('code') || p.includes('program') || p.includes('stack') || p.includes('tech') || p.includes('engineer')) return 'fa-laptop-code';
            if (p.includes('design') || p.includes('art') || p.includes('creative') || p.includes('ui') || p.includes('ux')) return 'fa-palette';
            if (p.includes('account') || p.includes('finance') || p.includes('money')) return 'fa-calculator';
            if (p.includes('teach') || p.includes('tutor') || p.includes('education') || p.includes('lectur')) return 'fa-chalkboard-teacher';
            if (p.includes('write') || p.includes('content') || p.includes('copy') || p.includes('blog')) return 'fa-pen-nib';
            if (p.includes('market') || p.includes('seo') || p.includes('social') || p.includes('media')) return 'fa-bullhorn';
            if (p.includes('manager') || p.includes('admin') || p.includes('business') || p.includes('exec')) return 'fa-user-tie';
            if (p.includes('data') || p.includes('analy') || p.includes('scien')) return 'fa-chart-bar';
            if (p.includes('video') || p.includes('photo') || p.includes('edit') || p.includes('film')) return 'fa-camera';
            if (p.includes('law') || p.includes('legal') || p.includes('attorney')) return 'fa-gavel';
            if (p.includes('medic') || p.includes('doctor') || p.includes('nurse') || p.includes('health')) return 'fa-user-md';
            return 'fa-briefcase';
        };
        
        if (status === 'student') {
            const studentType = (freelancer.student_type || '').toLowerCase();
            if (studentType === 'university') {
                const degree = freelancer.degree || '';
                const field = freelancer.degree_field || '';
                const studyStatus = (freelancer.study_status || '').toLowerCase();
                
                const translatedDegree = getTranslatedDegreeName(degree);
                const translatedField = getTranslatedProfessionName(field);

                if (studyStatus === 'graduated') {
                    icon = 'fa-user-graduate';
                    const graduateText = translate('status_graduate', 'Graduate');
                    if (translatedField) {
                        text = `${translatedField} ${graduateText}`;
                    } else if (translatedDegree) {
                        text = `${translatedDegree} ${graduateText}`;
                    } else {
                        text = graduateText;
                    }
                } else {
                    icon = 'fa-book-open-reader';
                    const studyingText = translate('status_studying_prefix', 'Studying ');
                    if (translatedField) {
                        text = `${studyingText}${translatedField}`;
                    } else if (translatedDegree) {
                         text = `${translatedDegree} ${translate('status_student', 'Student')}`;
                    } else {
                        text = translate('smart_status_university_student', 'University Student');
                    }
                }
            } else if (studentType === 'school') {
                icon = 'fa-school';
                const grade = freelancer.school_grade;
                if (grade) {
                    const gradeStudent = translate('smart_status_grade_student', '{grade} Grade Student');
                    text = gradeStudent.replace('{grade}', grade);
                } else {
                    text = translate('smart_status_school_student', 'School Student');
                }
            } else {
                icon = 'fa-user-graduate';
                text = translate('status_student', 'Student');
            }
        } else if (status === 'freelancing' || status === 'freelancer') {
             const profession = getTranslatedProfessionName(freelancer.profession);
             icon = getProfessionIcon(profession);
             
             const freelancePrefix = translate('smart_status_freelance_prefix', 'Freelance');
             if (profession) {
                 text = `${freelancePrefix} ${profession}`;
             } else {
                 text = translate('status_freelancing', 'Freelancing');
             }
        } else if (status === 'working') {
            const profession = getTranslatedProfessionName(freelancer.profession);
            icon = getProfessionIcon(profession);
            
            if (profession) {
                text = profession;
            } else {
                 text = translate('smart_status_working_professional', 'Working Professional');
            }
        } else {
            const profession = getTranslatedProfessionName(freelancer.profession);
            icon = getProfessionIcon(profession);
            text = profession || translate('status_other', 'Other');
        }
        
        return { text, icon };
    }

    async function setupUIForViewer(fid) {
        try {
            const response = await fetch('/api/auth/me');
            if (response.ok) {
                const data = await response.json();
                currentLoggedInUser = data.user;
                profileIsOwn = (currentLoggedInUser.id === fid || currentLoggedInUser.id === parseInt(fid));
                
                // If profile is own, show specific UI elements if needed
                if (profileIsOwn) {
                    console.log('Viewing own profile - unrestricted access enabled');
                    // We can add "Edit Profile" button here if needed
                }
            }
        } catch (error) {
            console.error('Error fetching viewer status:', error);
        }
    }

    // Function to handle CV click with restriction bypass for owner
    const handleCvClick = (e) => {
        // Fix: Check if current viewer is the profile owner
        const isOwner = window.currentUser && (window.currentUser.id === freelancerId || window.currentUser.id === parseInt(freelancerId));
        
        // If it's NOT the owner and NOT an employer/admin, block and show login modal
        if (!isOwner && !isEmployerOrAdmin()) {
            e.preventDefault();
            showEmployerLoginModal();
        }
    };

    function renderProfile(freelancer) {
        const lang = window.currentLanguage || 'en';
        const t = window.translations;

        const firstName = freelancer.first_name || '';
        const lastName = freelancer.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const initials = getEnglishInitials(firstName, lastName);
        const currentProfession = freelancer.profession;
        const averageRating = freelancer.rating !== null && freelancer.rating !== undefined ? freelancer.rating.toFixed(1) : '-';
        const reviewsCount = freelancer.reviews_count !== undefined ? freelancer.reviews_count : 0;
        
        const smartData = getSmartProfessionData(freelancer);

        if(profileName) profileName.textContent = fullName || translate('n_a', 'N/A');
        
        // Handle Profession Tag
        if(profileProfession) {
            const professionText = (smartData.text || '').trim();
            if (professionText) {
                profileProfession.innerHTML = `<i class="fas ${smartData.icon} text-lg"></i><span>${professionText}</span>`;
                profileProfession.classList.remove('hidden');
            } else {
                profileProfession.classList.add('hidden');
            }
        }

        // Handle Degree Tag (Rich Info)
        if (profileDegreeContainer && profileDegree) {
            const degree = freelancer.degree;
            const field = freelancer.degree_field;
            const status = (freelancer.current_status || '').toLowerCase();
            const studyStatus = (freelancer.study_status || '').toLowerCase();

            if (degree || field) {
                let degreeText = '';
                if (status === 'student' && studyStatus !== 'graduated') {
                    // Don't show degree tag for current students (already in status tag)
                    profileDegreeContainer.classList.add('hidden');
                } else {
                    // Translate Degree Type
                    const degreeLabel = getTranslatedDegreeName(degree);

                    // Translate Field of Study
                    let fieldLabel = field;
                    if (window.educationData && window.educationData.fieldCategories) {
                        window.educationData.fieldCategories.some(cat => {
                            const foundField = cat.fields.find(f => (f.name?.en || f.en || f) === field);
                            if (foundField) {
                                fieldLabel = foundField.name ? (foundField.name[lang] || foundField.name.en) : (typeof foundField === 'object' ? (foundField[lang] || foundField.en) : foundField);
                                return true;
                            }
                            return false;
                        });
                    }

                    degreeText = `${degreeLabel || ''} ${fieldLabel ? (degreeLabel ? ' • ' : '') + fieldLabel : ''}`.trim();
                    profileDegree.textContent = degreeText;
                    profileDegreeContainer.classList.remove('hidden');
                }
            } else {
                profileDegreeContainer.classList.add('hidden');
            }
        }

        // Handle Institution Tag (Rich Info)
        if (profileInstitutionContainer && profileInstitution) {
            const uni = freelancer.university;
            const school = freelancer.school_name;
            const inst = uni || school;
            
            if (inst) {
                let instLabel = inst;
                // Translate University if it's a known one
                if (window.educationData && window.educationData.universities) {
                    const foundUni = window.educationData.universities.find(u => (u.name?.en === uni));
                    if (foundUni) {
                        instLabel = foundUni.name[lang] || foundUni.name.en;
                    }
                }
                
                profileInstitution.textContent = instLabel;
                profileInstitutionContainer.classList.remove('hidden');
            } else {
                profileInstitutionContainer.classList.add('hidden');
            }
        }
        
        if (profileLocation) {
            const city = getTranslatedCityName(freelancer.location);
            const country = getTranslatedCityName(freelancer.country); // Re-use same logic for country translation
            
            let translatedLocation = city;
            if (city && country && city !== country) {
                translatedLocation = lang === 'ar' ? `${city}، ${country}` : `${city}, ${country}`;
            } else if (!city && country) {
                translatedLocation = country;
            }

            const locationParent = profileLocation.closest('.flex.items-center.gap-2') || profileLocation.parentElement;
            if (translatedLocation && translatedLocation !== 'N/A' && translatedLocation !== translate('n_a', 'N/A')) {
                profileLocation.textContent = translatedLocation;
                if (locationParent) locationParent.style.display = 'flex';
            } else {
                if (locationParent) locationParent.style.display = 'none';
            }
        }

        const avatarContainer = profileAvatar ? profileAvatar.closest('.avatar-wrapper') : null;
        
        if (profileAvatar) {
            if (freelancer.profile_picture_url) {
                profileAvatar.innerHTML = `<img src="${freelancer.profile_picture_url}" alt="${fullName}" class="w-full h-full object-cover" onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\'text-glass\'>${initials}</span>'; this.parentElement.classList.add('bg-slate-900');">`;
            } else {
                profileAvatar.innerHTML = `<span class="text-glass">${initials}</span>`;
                profileAvatar.classList.add('bg-slate-900');
            }
        }
        

        if (averageRatingValue) {
            averageRatingValue.textContent = averageRating !== '-' ? averageRating : '0.0';
        }
        
        // Hide rating container if no reviews or no rating
        const ratingContainer = document.getElementById('ratingContainer');
        const reviewsCountParenthesis = document.getElementById('reviewsCountParenthesis');
        if (ratingContainer) {
             if (reviewsCount > 0 && averageRating && averageRating !== '0.0' && averageRating !== '0' && averageRating !== '-') {
                 ratingContainer.classList.remove('hidden');
                 ratingContainer.classList.add('flex');
                 if (reviewsCountParenthesis) {
                     const reviewsLabel = lang === 'ar' ? 'تقييمات' : 'reviews';
                     reviewsCountParenthesis.textContent = `(${reviewsCount} ${reviewsLabel})`;
                 }
             } else {
                 ratingContainer.classList.add('hidden');
                 ratingContainer.classList.remove('flex');
             }
        }
        
        // Populate Profile Status
        const profileStatus = document.getElementById('profileStatus');
        if (profileStatus) {
            const status = (freelancer.current_status || '').trim();
            if (status) {
                // Map status to translation keys if needed, or display direct
                let statusText = status;
                if (status.toLowerCase() === 'student') statusText = translate('status_student', 'Student');
                else if (status.toLowerCase() === 'working') statusText = translate('status_working', 'Working');
                else if (status.toLowerCase() === 'freelancing') statusText = translate('status_freelancing', 'Freelancing');
                
                profileStatus.textContent = statusText;
                profileStatus.classList.remove('hidden');
                
                const statusSeparator = document.getElementById('statusSeparator');
                if (statusSeparator) statusSeparator.classList.remove('hidden', 'md:hidden'); // Ensure visible
                if (statusSeparator) statusSeparator.classList.add('md:block');
            } else {
                profileStatus.classList.add('hidden');
                const statusSeparator = document.getElementById('statusSeparator');
                if (statusSeparator) statusSeparator.classList.add('hidden');
            }
        }

        if(profileBio) {
            const aboutMeSection = document.getElementById('aboutMeSection');
            if (freelancer.bio && freelancer.bio.trim().length > 0) {
                const bioDir = getTextDirection(freelancer.bio);
                profileBio.innerHTML = freelancer.bio.replace(/\n/g, '<br>');
                profileBio.setAttribute('dir', bioDir);
                profileBio.style.textAlign = bioDir === 'rtl' ? 'right' : 'left';
                
                if (aboutMeSection) aboutMeSection.classList.remove('hidden');
                
                if (fullBioContent) {
                    fullBioContent.innerHTML = freelancer.bio.replace(/\n/g, '<br>');
                    fullBioContent.setAttribute('dir', bioDir);
                    fullBioContent.style.textAlign = bioDir === 'rtl' ? 'right' : 'left';
                }
            } else {
                if (aboutMeSection) aboutMeSection.classList.add('hidden');
            }
        }

        // Education / Student Status Section
        if (profileEducation && educationContent) {
            let history = freelancer.education_history || [];
            if (typeof history === 'string') {
                try { history = JSON.parse(history); } catch (e) { history = []; }
            }

            // Migrate legacy single-degree data if history is empty
            if (history.length === 0 && (freelancer.university || freelancer.degree_field)) {
                history.push({
                    university: freelancer.university || '',
                    degree: freelancer.degree || 'Bachelor',
                    degree_field: freelancer.degree_field || '',
                    grad_year: freelancer.grad_year || '',
                    field_category: freelancer.field_category || '',
                    study_status: freelancer.study_status || 'graduated'
                });
            }

            let eduHtml = '';

            // 2. Render Education History List
            if (Array.isArray(history) && history.length > 0) {
                eduHtml += history.map(edu => {
                    // Extract Year from date (e.g. "2026-01-01" or ISO string)
                    let yearOnly = edu.date || edu.grad_year;
                    if (yearOnly && yearOnly.includes('-')) {
                        const dateObj = new Date(yearOnly);
                        if (!isNaN(dateObj.getTime())) {
                            yearOnly = dateObj.getFullYear().toString();
                        }
                    }

                    // Support both new and old schemas
                    const universityName = edu.organization || edu.university;
                    const degreeField = edu.field || edu.degree_field;
                    const degreeLevel = edu.level || edu.degree;
                    const degreeTitle = edu.title; // New field from enhanced schema

                    // Translate Degree Type
                    const degreeLabel = getTranslatedDegreeName(degreeLevel || degreeTitle);

                    // Translate Field of Study
                    let fieldLabel = degreeField;
                    if (window.educationData && window.educationData.fieldCategories) {
                        window.educationData.fieldCategories.some(cat => {
                            const foundField = cat.fields.find(f => (f.name?.en || f.en || f) === degreeField || f.id === edu.field_id);
                            if (foundField) {
                                fieldLabel = foundField.name ? (foundField.name[lang] || foundField.name.en) : (typeof foundField === 'object' ? (foundField[lang] || foundField.en) : foundField);
                                return true;
                            }
                            return false;
                        });
                    }

                    // Translate University
                    let uniLabel = universityName;
                    if (window.educationData && window.educationData.universities) {
                        const foundUni = window.educationData.universities.find(u => (u.name?.en === universityName) || (u.id === edu.university_id) || (u.id === edu.orgId));
                        if (foundUni) {
                            uniLabel = foundUni.name ? (foundUni.name[lang] || foundUni.name.en) : (foundUni[lang] || foundUni.en);
                        }
                    }

                    const uniDir = getTextDirection(uniLabel || '');
                    
                    // Construct secondary label (Degree + Field + Title)
                    let secondaryLabel = degreeLabel || '';
                    if (fieldLabel) secondaryLabel += (secondaryLabel ? ' • ' : '') + fieldLabel;
                    if (degreeTitle && degreeTitle !== fieldLabel && degreeTitle !== degreeLevel) {
                        secondaryLabel += (secondaryLabel ? ' • ' : '') + degreeTitle;
                    }
                    const degreeDir = getTextDirection(secondaryLabel);

                    // Determine Icon based on type
                    let iconClass = 'fa-graduation-cap';
                    let accentColor = 'hirly';
                    const eduType = (edu.type || 'University').toLowerCase();
                    
                    if (eduType === 'school') {
                        iconClass = 'fa-school';
                        accentColor = 'blue';
                    } else if (eduType === 'certificate') {
                        iconClass = 'fa-award';
                        accentColor = 'emerald';
                    } else if (eduType === 'course') {
                        iconClass = 'fa-book';
                        accentColor = 'amber';
                    }

                    return `
                        <div class="flex items-start gap-4 md:gap-6 p-6 md:p-8 bg-white/60 backdrop-blur-sm rounded-[2rem] border border-white/50 group hover:border-${accentColor}-200 hover:bg-white hover:shadow-lg transition-all duration-500">
                            <div class="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-${accentColor}-500 flex-shrink-0 group-hover:bg-${accentColor}-500 group-hover:text-white transition-all duration-500 shadow-sm">
                                <i class="fas ${iconClass} text-xl md:text-2xl"></i>
                            </div>
                            <div class="space-y-2 min-w-0 flex-1">
                                <h3 class="font-black text-slate-900 text-lg md:text-xl leading-tight break-words group-hover:text-${accentColor}-700 transition-colors" dir="${uniDir}">${uniLabel || translate('university_label', 'University')}</h3>
                                <p class="text-slate-500 font-bold text-sm md:text-base break-words" dir="${degreeDir}">${secondaryLabel}</p>
                                <div class="flex flex-wrap items-center gap-2 pt-2">
                                    ${yearOnly ? `
                                        <span class="px-3 py-1 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-slate-900/10">
                                            ${yearOnly}
                                        </span>
                                    ` : ''}
                                    ${edu.type && edu.type !== 'University' ? `
                                        <span class="px-3 py-1 bg-${accentColor}-50 text-${accentColor}-600 text-[10px] font-black uppercase tracking-wider rounded-lg border border-${accentColor}-100">
                                            ${edu.type}
                                        </span>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            if (eduHtml) {
                profileEducation.classList.remove('hidden');
                educationContent.innerHTML = eduHtml;
            } else {
                profileEducation.classList.add('hidden');
            }
        }
        
        // Identity -> Proof: Only show sections if they have content
        if (skillsContainer) {
            const skillsSection = skillsContainer.closest('section');
            let skills = freelancer.skills;
            
            // Fix: Handle JSON array strings or comma-separated strings
            if (typeof skills === 'string') {
                try {
                    // Try to parse as JSON array (e.g., ["skill1", "skill2"])
                    const parsed = JSON.parse(skills);
                    if (Array.isArray(parsed)) {
                        skills = parsed;
                    } else {
                        // Fallback to comma-separated
                        skills = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
                    }
                } catch (e) {
                    // Not JSON, assume comma-separated or raw string
                    skills = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
                }
            }

            // Ensure skills is an array and filter out any empty strings/brackets
            if (Array.isArray(skills)) {
                skills = skills.map(skill => String(skill).replace(/[\[\]"]/g, '').trim()).filter(skill => skill.length > 0);
            }

            if (Array.isArray(skills) && skills.length > 0) {
                skillsContainer.innerHTML = skills.map(skill => {
                    return `<span class="px-4 py-2 bg-slate-50 text-slate-700 rounded-xl font-bold border border-slate-100 shadow-sm text-sm hover:border-hirly-200 hover:text-hirly-600 transition-colors cursor-default select-none">${skill}</span>`;
                }).join('');
                if (skillsSection) skillsSection.classList.remove('hidden');
            } else {
                if (skillsSection) skillsSection.classList.add('hidden');
            }
        }

        // Interested Professions
        const interestedProfessionsContainer = document.getElementById('interestedProfessionsContainer');
        if (interestedProfessionsContainer) {
            const interestedProfessionsSection = interestedProfessionsContainer.closest('section');
            let interestedProfs = freelancer.interested_professions;
            
            // Parse if it's a string (though it should be parsed by backend/fetch)
            if (typeof interestedProfs === 'string') {
                try {
                    interestedProfs = JSON.parse(interestedProfs);
                } catch (e) {
                    interestedProfs = [];
                }
            }

            // Ensure interestedProfs is an array and filter out any empty strings
            if (Array.isArray(interestedProfs)) {
                interestedProfs = interestedProfs.map(s => String(s).trim()).filter(s => s.length > 0);
            }

            if (Array.isArray(interestedProfs) && interestedProfs.length > 0) {
                interestedProfessionsContainer.innerHTML = interestedProfs.map(profEn => {
                    const translatedProf = getTranslatedProfessionName(profEn);
                    // Added dir="auto" and rounded-full
                    return `<span class="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full font-bold border border-emerald-100 shadow-sm text-sm hover:border-emerald-200 hover:bg-emerald-100 transition-colors cursor-default select-none" dir="auto">${translatedProf}</span>`;
                }).join('');
                if (interestedProfessionsSection) interestedProfessionsSection.classList.remove('hidden');
            } else {
                if (interestedProfessionsSection) interestedProfessionsSection.classList.add('hidden');
            }
        }
        
    if (reviewsCountSpan) reviewsCountSpan.textContent = reviewsCount;
    if (reviewsCountParenthesis) reviewsCountParenthesis.textContent = (t['reviews_count_parenthesis'] && t['reviews_count_parenthesis'][lang]) ? t['reviews_count_parenthesis'][lang].replace('{count}', reviewsCount) : `(${reviewsCount})`;

    // Always show reviews section to allow leaving reviews even if empty
    const reviewsSection = document.getElementById('reviewsSection');
    if (reviewsSection) {
        reviewsSection.classList.remove('hidden');
    }

    // CV Display
    const cvDisplay = document.getElementById('cvDisplay');
    const cvSection = document.getElementById('cvSection');
    if (cvDisplay && cvSection) {
        if (freelancer.cv_path && freelancer.cv_path !== '/api/files/censored') {
            cvSection.classList.remove('hidden');
            cvDisplay.innerHTML = `
                <button id="viewCvButton" class="luxe-btn-primary px-8 py-4 text-sm w-full md:w-auto shadow-lg shadow-hirly-100">
                    <i class="fas fa-eye"></i>
                    <span data-lang-key="view_cv_btn">${(t['view_cv_btn'] && t['view_cv_btn'][lang]) || translate('view_cv_btn', 'View CV')}</span>
                </button>
            `;
            
            const viewCvButton = document.getElementById('viewCvButton');
            if (viewCvButton) {
                viewCvButton.onclick = (e) => {
                    const resolvedUser = currentLoggedInUser || window.currentUser || null;
                    const isOwner = resolvedUser && (resolvedUser.id === freelancerId || resolvedUser.id === parseInt(freelancerId));
                    const type = (resolvedUser && resolvedUser.user_type) ? resolvedUser.user_type.toLowerCase().trim() : '';
                    const isEmployerOrAdmin = type === 'employer' || type === 'admin';

                    if (isOwner || isEmployerOrAdmin) {
                        window.open(freelancer.cv_path, '_blank');
                    } else {
                        e.preventDefault();
                        showEmployerLoginModal();
                    }
                };
            }
        } else {
            cvSection.classList.add('hidden');
        }
    }

    // Premium Badge
    const premiumBadge = document.getElementById('premiumBadge');
    if (premiumBadge) {
        if (freelancer.is_premium) {
            premiumBadge.classList.remove('hidden');
        } else {
            premiumBadge.classList.add('hidden');
        }
    }
}

function renderErrorState(message) {
    const lang = window.currentLanguage || 'en';
    const t = window.translations;
    
    // Hide loading overlay if it exists
    if (pageLoadingOverlay) {
        pageLoadingOverlay.classList.remove('show');
    }

    if (profileName) profileName.textContent = translate('profile_not_found_message', 'Profile Not Found');
    if (profileBio) profileBio.innerHTML = `<p class="text-red-500">${message}</p>`;
    
    // Hide sections
    ['skillsSection', 'servicesSection', 'cvSection', 'reviewsSection', 'profileEducation', 'aboutMeSection'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    if (averageRatingValue) averageRatingValue.textContent = '-';
    if (reviewsCountParenthesis) reviewsCountParenthesis.textContent = `(0)`;
    if (reviewsCountSpan) reviewsCountSpan.textContent = '0';
}


    async function setupUIForViewer(profileUserId) {
        const lang = window.currentLanguage || 'en';
        const t = window.translations;
        try {
            const authResponse = await fetch('/api/user', { credentials: 'same-origin' });
            if (authResponse.ok) {
                const authData = await authResponse.json();
                currentLoggedInUser = authData && authData.user ? authData.user : null;
            } else {
                currentLoggedInUser = null;
            }
        } catch (error) {
            console.error('Error fetching current user:', error);
            currentLoggedInUser = null;
        }

        // Fallback: if not resolved by API, use window.currentUser set by global auth script
        if (!currentLoggedInUser && window.currentUser) {
            currentLoggedInUser = window.currentUser;
        }

        const user = currentLoggedInUser;
        profileIsOwn = user && user.id.toString() === profileUserId.toString();
        isPublicUser = !user;

        // Set up action button visibility (always show unless profile owner)
        setupActionButtonsVisibility();
        
        // Set up action button functionality (employer login modal for non-employers)
        setupActionButtons();
    }
    

    // Modified function to always show actions section and buttons
    function setupActionButtonsVisibility() {
        const isOwner = profileIsOwn;

        // Hide final action section if it's the profile owner
        const finalActionSection = document.getElementById('finalActionSection');
        if (finalActionSection) {
            finalActionSection.style.display = isOwner ? 'none' : 'block';
        }

        // Hide sidebar action cards if owner
        const sidebarActionCards = document.querySelectorAll('.sidebar-action-card');
        sidebarActionCards.forEach(card => {
            card.style.display = isOwner ? 'none' : 'block';
        });

        // Hide mobile sticky bar if owner
        const mobileStickyActions = document.querySelector('.fixed.bottom-0.lg\\:hidden');
        if (mobileStickyActions) {
            mobileStickyActions.style.display = isOwner ? 'none' : 'flex';
        }

        // Always show leave review button unless it's the profile owner
        if (leaveReviewBtn) {
            if (isOwner) {
                leaveReviewBtn.style.display = 'none';
            } else {
                leaveReviewBtn.style.display = 'inline-flex';
            }
        }
    }

    // Set up action buttons with employer login requirement
    function setupActionButtons() {
        const handleOpenContact = () => {
            if (isEmployerOrAdmin()) {
                openContactModal();
            } else {
                showEmployerLoginModal();
            }
        };
        const handleOpenShare = () => openShareModal();
        
        const handleSendOffer = async () => {
            if (isEmployerOrAdmin()) {
                await fetchMyJobs();
                if (offerModal) {
                    showModal(offerModal);
                    if (offerJobSelect) {
                        offerJobSelect.innerHTML = myJobs.map(job => `<option value="${job.id}">${job.title}</option>`).join('');
                    }
                }
            } else {
                showEmployerLoginModal();
            }
        };

        // Sidebar Buttons
        if (sidebarContactBtn) sidebarContactBtn.onclick = handleOpenContact;
        if (sidebarOfferBtn) sidebarOfferBtn.onclick = handleSendOffer;
        if (sidebarShareBtn) sidebarShareBtn.onclick = handleOpenShare;

        // CTA Section Buttons
        if (ctaContactBtn) ctaContactBtn.onclick = handleOpenContact;
        if (ctaOfferBtn) ctaOfferBtn.onclick = handleSendOffer;
        if (ctaShareBtn) ctaShareBtn.onclick = handleOpenShare;

        // Mobile Sticky Buttons
        if (mainContactBtnMobile) mainContactBtnMobile.onclick = handleOpenContact;
        if (sendOfferBtnMobile) sendOfferBtnMobile.onclick = handleSendOffer;
        if (shareProfileBtnMobile) shareProfileBtnMobile.onclick = handleOpenShare;

        // Legacy/General Buttons (fallback)
        if (typeof mainContactBtn !== 'undefined' && mainContactBtn) mainContactBtn.onclick = handleOpenContact;
        if (typeof sendOfferBtn !== 'undefined' && sendOfferBtn) sendOfferBtn.onclick = handleSendOffer;
        if (typeof shareProfileBtn !== 'undefined' && shareProfileBtn) shareProfileBtn.onclick = handleOpenShare;

        // Leave Review Button
        if (leaveReviewBtn) {
            leaveReviewBtn.onclick = async () => {
                if (!currentLoggedInUser) {
                    showEmployerLoginModal();
                    return;
                }

                if (currentLoggedInUser.user_type === 'professional' || currentLoggedInUser.user_type === 'freelancer') {
                    // Show restriction modal: professionals cannot review professionals
                    if (restrictionModal) {
                        restrictionTitle.textContent = translate('access_restricted', 'Access Restricted');
                        restrictionMessage.textContent = translate('professional_restriction_review', 'As a professional, you cannot leave reviews for other professionals. This feature is for employers.');
                        restrictionIcon.innerHTML = '<i class="fas fa-user-lock text-3xl"></i>';
                        restrictionActionBtn.style.display = 'none';
                        showModal(restrictionModal);
                    }
                    return;
                }

                if (isEmployerOrAdmin()) {
                    const viewerId = currentLoggedInUser && currentLoggedInUser.id;
                    await fetchEligibleJobsForReview(viewerId);
                    if (!eligibleJobsForReview || eligibleJobsForReview.length === 0) {
                        if (restrictionModal) {
                            restrictionTitle.textContent = translate('review_restriction_title', 'No Eligible Jobs');
                            restrictionMessage.textContent = translate('review_restriction_message', 'You can only review professionals you have officially hired. Make sure to accept their application first to leave a review.');
                            restrictionIcon.innerHTML = '<i class="fas fa-briefcase text-3xl text-amber-500"></i>';
                            restrictionActionBtn.style.display = 'none';
                            showModal(restrictionModal);
                        }
                        return;
                    }
                    if (reviewModal) {
                        showModal(reviewModal);
                        if (reviewJobSelect) {
                            reviewJobSelect.innerHTML = eligibleJobsForReview.map(job => `<option value="${job.job_id}">${job.job_title}</option>`).join('');
                        }
                    }
                } else {
                    showEmployerLoginModal();
                }
            };
        }
    }

    // Star Rating Interaction
    if (starRating) {
        const stars = starRating.querySelectorAll('i');
        stars.forEach(star => {
            // Mouse Enter (Hover state)
            star.addEventListener('mouseenter', () => {
                const value = parseInt(star.getAttribute('data-value'));
                stars.forEach(s => {
                    const sValue = parseInt(s.getAttribute('data-value'));
                    if (sValue <= value) {
                        s.classList.remove('far', 'text-slate-300');
                        s.classList.add('fas', 'text-amber-400');
                    } else {
                        s.classList.remove('fas', 'text-amber-400');
                        s.classList.add('far', 'text-slate-300');
                    }
                });
            });

            // Mouse Leave (Reset to current ratingInput value)
            star.addEventListener('mouseleave', () => {
                const currentValue = parseInt(ratingInput.value || '0');
                stars.forEach(s => {
                    const sValue = parseInt(s.getAttribute('data-value'));
                    if (sValue <= currentValue) {
                        s.classList.remove('far', 'text-slate-300');
                        s.classList.add('fas', 'text-amber-400');
                    } else {
                        s.classList.remove('fas', 'text-amber-400');
                        s.classList.add('far', 'text-slate-300');
                    }
                });
            });

            // Click (Set value)
            star.addEventListener('click', () => {
                const value = parseInt(star.getAttribute('data-value'));
                ratingInput.value = value;
                
                // Finalize visual state
                stars.forEach(s => {
                    const sValue = parseInt(s.getAttribute('data-value'));
                    if (sValue <= value) {
                        s.classList.remove('far', 'text-slate-300');
                        s.classList.add('fas', 'text-amber-400');
                    } else {
                        s.classList.remove('fas', 'text-amber-400');
                        s.classList.add('far', 'text-slate-300');
                    }
                });
            });
        });
    }


    function showCallModal() {
        if (modalPhoneNumber) modalPhoneNumber.textContent = currentFreelancerPhone || translate('n_a', 'N/A');
        if (modalCallBtn) modalCallBtn.href = currentFreelancerPhone ? `tel:${currentFreelancerPhone}` : '#';
        showModal(contactModal);
    }

    function showEmailModal() {
        if (modalEmailAddress) modalEmailAddress.textContent = currentFreelancerEmail || translate('n_a', 'N/A');
        if (modalEmailBtn) modalEmailBtn.href = currentFreelancerEmail ? `mailto:${currentFreelancerEmail}` : '#';
        showModal(contactModal);
    }

    async function fetchMyJobs() {
        if (!currentLoggedInUser || currentLoggedInUser.user_type !== 'employer') {
            return;
        }
        try {
            const response = await fetch(`/api/jobs/my`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || translate('failed_to_fetch_my_jobs', 'Failed to fetch your jobs.'));
            }
            const data = await response.json();
            myJobs = data.jobs || [];
        } catch (error) {
            console.error('Error fetching my jobs:', error);
            showToast(translate('failed_to_load_jobs_offer', 'Failed to load your jobs for the offer form.'), 'error');
            myJobs = [];
        }
    }
    
    async function fetchEligibleJobsForReview(employerId) {
        const lang = window.currentLanguage || 'en';
        const t = window.translations;
        try {
            const response = await fetch(`/api/employer/reviewable-jobs?professionalId=${freelancerId}`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || translate('failed_to_fetch_eligible_jobs', 'Failed to fetch eligible jobs.'));
            }
            eligibleJobsForReview = Array.isArray(data.reviewableJobs) ? data.reviewableJobs : [];
            return eligibleJobsForReview;
        }
        catch (error) {
            console.error('Error fetching eligible jobs for review:', error);
            showToast(translate('failed_to_load_eligible_jobs_for_review', 'Failed to load eligible jobs for review.'), 'error');
            eligibleJobsForReview = [];
            return [];
        }
    }

    async function fetchReviewsForFreelancer(fId) {
        const lang = window.currentLanguage || 'en';
        const t = window.translations;

        if (!reviewsContainer) return;
        reviewsContainer.innerHTML = createLoadingSpinner(translate('loading_reviews_spinner', 'Loading reviews...'));

        try {
            const response = await fetch(`/api/users/${fId}/reviews`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || translate('failed_to_fetch_reviews', 'Failed to fetch reviews.'));
            }

            if(reviewsCountSpan) reviewsCountSpan.textContent = data.reviews.length;
            if(reviewsContainer) reviewsContainer.innerHTML = '';

            const reviewsCount = data.reviews.length;
            const reviewsCountText = (t['reviews_count_parenthesis'] && t['reviews_count_parenthesis'][lang]) ? t['reviews_count_parenthesis'][lang].replace('{count}', reviewsCount) : `(${reviewsCount} ${translate('reviews_section_title', 'Reviews')})`;

            if (reviewsCount === 0) {
                if(reviewsContainer) {
                    reviewsContainer.innerHTML = `
                        <div class="col-span-full luxe-card no-hover p-16 flex flex-col items-center justify-center text-center bg-white/40 border-dashed border-2 border-slate-200 shadow-none">
                            <div class="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 text-3xl mb-6 border border-slate-100">
                                <i class="far fa-star"></i>
                            </div>
                            <h3 class="text-xl font-black text-slate-900 mb-2">${translate('no_reviews_yet_title', 'No Reviews Yet')}</h3>
                            <p class="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">${translate('no_reviews_yet_empty_state', 'Be the first to leave a review for this professional!')}</p>
                        </div>
                    `;
                }
                if(averageRatingValue) averageRatingValue.textContent = '-';
                if(reviewsCountParenthesis) reviewsCountParenthesis.textContent = reviewsCountText;
            } else {
                data.reviews.forEach(review => {
                    if(reviewsContainer) reviewsContainer.appendChild(createReviewCard(review));
                });
                const totalRating = data.reviews.reduce((sum, review) => sum + review.rating, 0);
                const averageRating = (totalRating / data.reviews.length).toFixed(1);
                if(averageRatingValue) averageRatingValue.textContent = averageRating;
                if(reviewsCountParenthesis) reviewsCountParenthesis.textContent = reviewsCountText;
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            if(reviewsCountSpan) reviewsCountSpan.textContent = '0';
            if(reviewsContainer) reviewsContainer.innerHTML = `<p class="text-center text-red-500 p-8">${translate('failed_to_fetch_reviews', 'Failed to fetch reviews.')}</p>`;
            if(leaveReviewBtn) leaveReviewBtn.style.display = 'none';
            if(averageRatingValue) averageRatingValue.textContent = '-';
            if(reviewsCountParenthesis) reviewsCountParenthesis.textContent = `(0 ${translate('reviews_section_title', 'Reviews')})`;
        }
    }


    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString(window.currentLanguage === 'ar' ? 'ar-EG' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function createReviewCard(review) {
        const lang = window.currentLanguage || 'en';
        const t = window.translations;

        const card = document.createElement('div');
        card.className = 'luxe-card p-8 md:p-10 relative overflow-hidden group bg-white/60 backdrop-blur-md border border-white/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500';

        const reviewerName = review.reviewer_company_name || `${review.reviewer_first_name} ${review.reviewer_last_name}`;
        const reviewerAvatar = review.reviewer_company_logo_path || `https://placehold.co/60x60/f1f5f9/475569?text=${(review.reviewer_company_name || review.reviewer_first_name || 'E').charAt(0).toUpperCase()}`;

        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            starsHtml += `<i class="${i <= review.rating ? 'fas text-amber-400' : 'far text-slate-200'} fa-star text-[10px] md:text-xs"></i>`;
        }

        const commentDir = getTextDirection(review.comment || '');

        card.innerHTML = `
            <div class="absolute top-0 right-0 w-32 h-32 bg-hirly-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-500 group-hover:scale-150 group-hover:bg-hirly-500/20"></div>
            <div class="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -ml-12 -mb-12 transition-all duration-500 group-hover:scale-150"></div>
            
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
                <div class="flex items-center gap-4 md:gap-5 min-w-0">
                    <div class="relative shrink-0 group-hover:scale-105 transition-transform duration-500">
                        <img src="${reviewerAvatar}" alt="${reviewerName}" class="w-14 h-14 md:w-16 md:h-16 rounded-2xl object-cover border-2 border-white shadow-lg bg-white">
                        <div class="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center shadow-sm">
                            <i class="fas fa-check text-[7px] md:text-[8px] text-white"></i>
                        </div>
                    </div>
                    <div class="min-w-0">
                        <h4 class="font-black text-slate-900 text-base md:text-lg tracking-tight truncate group-hover:text-hirly-700 transition-colors">${reviewerName}</h4>
                        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <div class="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest">${formatDate(review.created_at)}</div>
                            ${review.job_title ? `
                                <div class="flex items-center gap-1.5">
                                    <span class="w-1 h-1 rounded-full bg-slate-200"></span>
                                    <span class="text-[9px] md:text-[10px] text-hirly-600 font-bold bg-hirly-50/50 px-2 py-0.5 rounded-md border border-hirly-100/50 truncate max-w-[150px]">${review.job_title}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-1 px-3 py-1.5 md:px-4 md:py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm group-hover:shadow-md transition-all self-start md:self-center shrink-0">
                    ${starsHtml}
                </div>
            </div>
            <div class="relative z-10 min-w-0">
                <i class="fas fa-quote-left absolute -top-4 -left-4 text-hirly-500/10 text-4xl md:text-5xl transform -rotate-6 group-hover:rotate-0 transition-transform duration-500"></i>
                <p class="text-slate-600 font-medium leading-relaxed text-base md:text-lg relative z-10 pl-2 line-clamp-4 md:line-clamp-none break-words" dir="${commentDir}" style="text-align: ${commentDir === 'rtl' ? 'right' : 'left'}">${review.comment}</p>
            </div>
        `;

        if (currentLoggedInUser && (currentLoggedInUser.user_type === 'admin' || (currentLoggedInUser.user_type === 'employer' && currentLoggedInUser.id === review.reviewer_id))) {
            const deleteButton = document.createElement('button');
            deleteButton.className = 'mt-8 px-6 py-3 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-300 rounded-xl text-xs font-black uppercase tracking-widest border border-rose-100 shadow-sm hover:shadow-rose-500/30 flex items-center gap-2 relative z-20';
            deleteButton.innerHTML = `<i class="fas fa-trash-alt text-[10px]"></i> <span>${translate('delete_review', 'Delete Feedback')}</span>`;
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                if (currentLoggedInUser.user_type === 'admin') {
                    confirmAndDeleteReviewAdmin(review.review_id);
                } else {
                    confirmAndDeleteReview(review.review_id);
                }
            });
            card.appendChild(deleteButton);
        }

        return card;
    }
    
    function showConfirmationModal(message, onConfirm) {
        const lang = window.currentLanguage || 'en';
        const t = window.translations;

        document.getElementById('confirmationModalTitle').textContent = (t['confirm_action'] && t['confirm_action'][lang]) || 'Confirm Action';
        document.getElementById('confirmationModalMessage').textContent = message;
        document.getElementById('confirmActionBtn').textContent = (t['yes_confirm'] && t['yes_confirm'][lang]) || 'Yes, Confirm';
        document.getElementById('cancelActionBtn').textContent = (t['cancel'] && t['cancel'][lang]) || 'Cancel';
        
        showModal(confirmationModal);

        confirmActionBtn.onclick = () => {
            hideModal(confirmationModal);
            onConfirm();
        };
        cancelActionBtn.onclick = () => hideModal(confirmationModal);
    }
    
    async function confirmAndDeleteReview(reviewId) {
        const lang = window.currentLanguage || 'en';
        const t = window.translations;
        showConfirmationModal(translate('are_you_sure_delete_review', 'Are you sure you want to delete this review? This action cannot be undone.'), async () => {
            try {
                const response = await fetch(`/api/reviews/${reviewId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || translate('failed_to_delete_review', 'Failed to delete review.'));
                showToast(data.message || translate('review_deleted_successfully', 'Review deleted successfully!'), 'success');
                fetchReviewsForFreelancer(freelancerId);
            } catch (error) {
                console.error('Error deleting review:', error);
                showToast(`${translate('error_deleting_review', 'Error deleting review:')} ${error.message}`, 'error');
            }
        });
    }

    async function confirmAndDeleteReviewAdmin(reviewId) {
        const lang = window.currentLanguage || 'en';
        const t = window.translations;
        showConfirmationModal(translate('are_you_sure_delete_review', 'Are you sure you want to delete this review? This action cannot be undone.'), async () => {
            try {
                const response = await fetch(`/api/admin/reviews/${reviewId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || translate('failed_to_delete_review', 'Failed to delete review.'));
                showToast(data.message || translate('review_deleted_successfully', 'Review deleted successfully!'), 'success');
                fetchReviewsForFreelancer(freelancerId);
            } catch (error) {
                console.error('Error deleting review:', error);
                showToast(`${translate('error_deleting_review', 'Error deleting review:')} ${error.message}`, 'error');
            }
        });
    }

    // Event listeners for the modal buttons
    // Note: call and email button handlers are unified under setupActionButtons()
    // Removed old sendOfferBtn event listener - now handled by setupActionButtons()
    
    if (cancelOfferBtn) cancelOfferBtn.addEventListener('click', () => hideModal(offerModal));
    if (offerForm) {
        offerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const lang = window.currentLanguage || 'en';
            const t = window.translations;
            const jobId = offerJobSelect.value;
            const message = offerMessageInput.value.trim();
            if (!jobId || !message) {
                showToast(translate('offer_message_required', 'Offer message and job selection are required.'), 'error');
                return;
            }
            try {
                const response = await fetch('/api/send-job-offer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ freelancerId, jobId, message })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || translate('failed_to_send_offer', 'Failed to send offer.'));
                showToast(data.message || translate('offer_sent_successfully', 'Offer sent successfully!'), 'success');
                hideModal(offerModal);
            } catch (error) {
                console.error('Error sending offer:', error);
                showToast(error.message || translate('failed_to_send_offer', 'Failed to send offer.'), 'error');
            }
        });
    }

    // Note: leave review handler unified under setupActionButtons()
    if (cancelReviewBtn) cancelReviewBtn.addEventListener('click', () => hideModal(reviewModal));
    if (reviewForm) {
        // Handle input to detect text direction automatically and character count
        if (reviewCommentInput) {
            const charCount = document.getElementById('charCount');
            reviewCommentInput.addEventListener('input', () => {
                const dir = getTextDirection(reviewCommentInput.value);
                reviewCommentInput.setAttribute('dir', dir);
                reviewCommentInput.style.textAlign = dir === 'rtl' ? 'right' : 'left';
                
                if (charCount) {
                    charCount.textContent = `${reviewCommentInput.value.length}/500`;
                    if (reviewCommentInput.value.length >= 450) {
                        charCount.classList.remove('text-slate-300');
                        charCount.classList.add('text-amber-500');
                    } else {
                        charCount.classList.add('text-slate-300');
                        charCount.classList.remove('text-amber-500');
                    }
                }
            });
        }

        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const rating = parseInt(ratingInput.value || '0');
            const comment = reviewCommentInput.value.trim();
            const jobId = reviewJobSelect.value;
            
            if (rating === 0) {
                showToast(translate('please_select_rating', 'Please select a rating.'), 'error');
                return;
            }
            if (!comment) {
                showToast(translate('please_provide_comment', 'Please provide a comment.'), 'error');
                return;
            }
            if (!jobId) {
                showToast(translate('please_select_job', 'Please select a job.'), 'error');
                return;
            }

            const submitBtn = document.getElementById('submitReviewBtn');
            const originalText = submitBtn.innerHTML;
            
            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> ${translate('submitting_review', 'Submitting...')}`;
                
                const response = await fetch('/api/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ professionalId: freelancerId, jobId, rating, comment })
                });
                
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || translate('failed_to_submit_review', 'Failed to submit review.'));
                
                showToast(data.message || translate('review_submitted_successfully', 'Review submitted successfully!'), 'success');
                hideModal(reviewModal);
                
                // Reset form
                reviewForm.reset();
                ratingInput.value = '';
                const stars = starRating.querySelectorAll('i');
                stars.forEach(s => {
                    s.classList.remove('fas', 'text-amber-400');
                    s.classList.add('far', 'text-slate-300');
                });

                fetchReviewsForFreelancer(freelancerId);
            } catch (error) {
                console.error('Error submitting review:', error);
                showToast(error.message || translate('failed_to_submit_review', 'Failed to submit review.'), 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
    
    // Initialize the page
    if (freelancerId || freelancerSlug) {
        // Apply translations initially
        try {
            if (typeof window.applyTranslations === 'function') {
                window.applyTranslations(lang);
            }
        } catch (tError) {
            console.error('Error applying initial translations:', tError);
        }
        fetchFreelancerProfile();
    } else {
        renderErrorState(translate('no_valid_id_slug', 'No valid freelancer ID or slug specified in the URL.'));
    }

    // Close modal when clicking outside
    [offerModal, reviewModal, contactModal, shareProfileModal, serviceDetailsModal, employerLoginModal, confirmationModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) hideModal(modal);
            });
        }
    });

    // Close buttons for all modals
    if (closeOfferModalBtn) closeOfferModalBtn.addEventListener('click', () => hideModal(offerModal));
    if (closeReviewModalBtn) closeReviewModalBtn.addEventListener('click', () => hideModal(reviewModal));
    if (closeContactModalBtn) closeContactModalBtn.addEventListener('click', () => hideModal(contactModal));
    if (closeEmployerLoginModalBtn) closeEmployerLoginModalBtn.addEventListener('click', () => hideModal(employerLoginModal));
    if (closeServiceDetailsModalBtn) closeServiceDetailsModalBtn.addEventListener('click', () => hideModal(serviceDetailsModal));
    if (closeShareModalBtn) closeShareModalBtn.addEventListener('click', () => hideModal(shareProfileModal));

    // Share Profile Modal Event Listeners
    // Handled in setupActionButtons()
    
    // Copy Link Functionality
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(profileLinkInput.value);
                copySuccessMsg.classList.remove('hidden');
                copyLinkBtn.innerHTML = '<i class="fas fa-check"></i> <span data-lang-key="copied_btn">Copied!</span>';
                
                setTimeout(() => {
                    copySuccessMsg.classList.add('hidden');
                    copyLinkBtn.innerHTML = '<i class="fas fa-copy"></i> <span data-lang-key="copy_btn">Copy</span>';
                }, 2000);
            } catch (error) {
                console.error('Error copying to clipboard:', error);
                // Fallback for older browsers
                profileLinkInput.select();
                document.execCommand('copy');
                copySuccessMsg.classList.remove('hidden');
                setTimeout(() => copySuccessMsg.classList.add('hidden'), 2000);
            }
        });
    }

    // Social Share Functionality
    if (shareWhatsAppBtn) {
        shareWhatsAppBtn.addEventListener('click', () => {
            const text = encodeURIComponent(`${translate('share_whatsapp_text', 'Check out this freelancer\'s profile on Hirly: ')}${profileLinkInput.value}`);
            window.open(`https://wa.me/?text=${text}`, '_blank');
        });
    }

    if (shareFacebookBtn) {
        shareFacebookBtn.addEventListener('click', () => {
            const url = encodeURIComponent(profileLinkInput.value);
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
        });
    }

    if (shareMessengerBtn) {
        shareMessengerBtn.addEventListener('click', () => {
            const url = encodeURIComponent(profileLinkInput.value);
            window.open(`fb-messenger://share/?link=${url}`, '_blank');
        });
    }

    const shareTwitterBtn = document.getElementById('shareTwitterBtn');
    if (shareTwitterBtn) {
        shareTwitterBtn.addEventListener('click', () => {
            const url = encodeURIComponent(profileLinkInput.value);
            const text = encodeURIComponent(translate('share_twitter_text', 'Check out this freelancer\'s profile on Hirly!'));
            window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
        });
    }
});
