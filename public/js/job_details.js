// job_details.js
document.addEventListener('DOMContentLoaded', async function() {
    // --- DOM Elements ---
    const loadingOverlay = document.getElementById('loadingOverlay');
    const pageLoadingOverlay = document.getElementById('pageLoadingOverlay') || loadingOverlay;
    const pageErrorMessage = document.getElementById('pageErrorMessage');
    const jobDetailsContent = document.getElementById('jobDetailsContent');

    // Job Overview Section
    const jobTitleElem = document.getElementById('jobTitle');
    const jobCountryElem = document.getElementById('jobCountry');
    const jobCityElem = document.getElementById('jobCity');
    const jobTypeElem = document.getElementById('jobType');
    const jobSiteTypeElem = document.getElementById('jobSiteType');
    const jobGenderElem = document.getElementById('jobGender');
    const jobAgeRangeElem = document.getElementById('jobAgeRange');
    const jobBudgetElem = document.getElementById('jobBudget');
    const jobPostedDateElem = document.getElementById('jobPostedDate');

    // Dividers for conditional showing
    const dividerCountry = document.getElementById('dividerCountry');
    const dividerCity = document.getElementById('dividerCity');
    const dividerType = document.getElementById('dividerType');
    const dividerSiteType = document.getElementById('dividerSiteType');
    const dividerBudget = document.getElementById('dividerBudget');
    const dividerGender = document.getElementById('dividerGender');
    const dividerAge = document.getElementById('dividerAge');

    // About Employer Section
    const aboutEmployerSection = document.querySelector('.about-employer-section');

    // Job Description Section
    const jobDescriptionElem = document.getElementById('jobDescription');

    // Job Requirements Section
    const jobRequirementsSection = document.getElementById('jobRequirementsSection');
    const jobRequirementsList = document.getElementById('jobRequirementsList');
    const noRequirementsMessage = document.getElementById('noRequirementsMessage');

    // Required Professions Section
    const requiredProfessionsContainer = document.getElementById('requiredProfessions');
    const noRequiredProfessionsMessage = document.getElementById('noRequiredProfessions');
    const infoJobSiteType = document.getElementById('infoJobSiteType');
    const infoGender = document.getElementById('infoGender');
    const infoAgeRange = document.getElementById('infoAgeRange');

    // Job Image Section
    const jobImageSection = document.getElementById('jobImageSection');
    const jobImageElem = document.getElementById('jobImage');

    // Apply Section
    const applyNowBtn = document.getElementById('applyNowBtn');
    const alreadyAppliedBtn = document.getElementById('alreadyAppliedBtn');
    const jobClosedBtn = document.getElementById('jobClosedBtn');
    const deadlinePassedBtn = document.getElementById('deadlinePassedBtn');
    const applyStatusMessage = document.getElementById('applyStatusMessage');

    // Application Modal
    const applicationModal = document.getElementById('applicationModal');
    const closeApplicationModalBtn = document.getElementById('closeApplicationModalBtn');
    const applicationForm = document.getElementById('applicationForm');
    const jobTitleModalElem = document.getElementById('jobTitleModal');
    const proposalMessageInput = document.getElementById('proposalMessage');
    const bidAmountInput = document.getElementById('bidAmount');
    const currencyDisplay = document.getElementById('currencyDisplay');
    const timelineInput = document.getElementById('timeline');
    const applicationMessageStatus = document.getElementById('applicationMessageStatus');
    const cancelApplicationBtn = document.getElementById('cancelApplicationBtn');
    const submitApplicationBtn = document.getElementById('submitApplicationBtn');
    const applicationSuccessModal = document.getElementById('applicationSuccessModal');
    const viewApplicationBtn = document.getElementById('viewApplicationBtn');

    // Login Modals
    const employerLoginModal = document.getElementById('employerLoginModal');
    const freelancerLoginModal = document.getElementById('freelancerLoginModal');
    
    // Modals for Apply Button Logic
    const employerCannotApplyModal = document.getElementById('employerCannotApplyModal');
    const idVerificationModal = document.getElementById('idVerificationModal');
    const lowCompletenessModal = document.getElementById('lowCompletenessModal');
    const externalApplyModal = document.getElementById('externalApplyModal');
    const applyViaHirlyBtn = document.getElementById('applyViaHirlyBtn');
    const cancelExternalApplyBtn = document.getElementById('cancelExternalApplyBtn');
    const externalJobModalDesc = document.getElementById('externalJobModalDesc');

    const completeAccountBtnText = document.getElementById('completeAccountBtnText');

    const lowCompletenessApplyAnywayBtn = document.getElementById('lowCompletenessApplyAnywayBtn');
    const lowCompletenessImproveBtn = document.getElementById('lowCompletenessImproveBtn');
    const lowCompletenessRingProgress = document.getElementById('lowCompletenessRingProgress');
    const lowCompletenessPercent = document.getElementById('lowCompletenessPercent');
    const lowCompletenessDynamicDesc = document.getElementById('lowCompletenessDynamicDesc');
    const lowCompletenessMissingList = document.getElementById('lowCompletenessMissingList');

    const modalCloseButtons = document.querySelectorAll('.modal-close, .modal-close-btn, .modal-cancel-btn');

    // Share Buttons
    const shareWhatsAppBtn = document.getElementById('shareWhatsAppBtn');
    const shareLinkedInBtn = document.getElementById('shareLinkedInBtn');
    const copyJobLinkBtn = document.getElementById('copyJobLinkBtn');

    let currentJobId = null;
    let currentJobData = null;
    let currentLoggedInUser = null;

    // --- Share Logic ---
    const getShareContent = () => {
        if (!currentJobData) return null;
        const companyName = currentJobData.employer_company_name || currentJobData.external_company_name || 'Hirly Network';
        const jobTitle = currentJobData.title;
        const jobUrl = window.location.href;
        const text = `Check out this job opportunity: ${jobTitle} at ${companyName}\n\nView details: ${jobUrl}`;
        return { text, url: jobUrl, title: jobTitle };
    };

    if (shareWhatsAppBtn) {
        shareWhatsAppBtn.addEventListener('click', () => {
            const content = getShareContent();
            if (!content) return;
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(content.text)}`;
            window.open(whatsappUrl, '_blank');
        });
    }

    if (shareLinkedInBtn) {
        shareLinkedInBtn.addEventListener('click', () => {
            const content = getShareContent();
            if (!content) return;
            const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(content.url)}`;
            window.open(linkedinUrl, '_blank');
        });
    }

    if (copyJobLinkBtn) {
        copyJobLinkBtn.addEventListener('click', async () => {
            const content = getShareContent();
            if (!content) return;
            try {
                await navigator.clipboard.writeText(content.url);
                const originalHtml = copyJobLinkBtn.innerHTML;
                copyJobLinkBtn.innerHTML = '<i class="fas fa-check"></i>';
                copyJobLinkBtn.classList.add('success');
                setTimeout(() => {
                    copyJobLinkBtn.innerHTML = originalHtml;
                    copyJobLinkBtn.classList.remove('success');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        });
    }

    // Access global translation objects directly from window scope
    const globalTalentCategories = window.globalCategoriesAndProfessions || [];
    const palestinianCitiesTranslations = window.palestinianCitiesTranslations || {};


    // --- Helper Functions ---
    function updateTranslations() {
        const t = window.translations || {};
        const lang = window.currentLanguage || 'en';
        
        // This part handles data-lang-key attributes on static HTML elements
        document.querySelectorAll('[data-lang-key]').forEach(element => {
            const key = element.getAttribute('data-lang-key');
            const translatedText = (t[key] && t[key][lang]) || key; // Safely access translation

            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translatedText;
            } else if (element.tagName === 'TITLE') {
                document.title = translatedText;
            } else if (element.classList.contains('btn-icon')) { // Handle buttons with icons
                const buttonTextSpan = element.querySelector('.button-text');
                if (buttonTextSpan) {
                    buttonTextSpan.textContent = translatedText;
                } else {
                    // Fallback if .button-text span is missing
                    element.textContent = translatedText;
                }
            } else if (element.tagName === 'H2' || element.tagName === 'H3' || element.tagName === 'A') {
                // For H2, H3, A tags, specifically handle their content to preserve icons
                const existingIcon = element.querySelector('i');
                if (existingIcon) {
                    element.innerHTML = `${existingIcon.outerHTML} ${translatedText}`;
                } else {
                    element.textContent = translatedText;
                }
            } else {
                element.textContent = translatedText;
            }
        });

        // Re-render dynamic content that relies on translations
        if (currentJobData) {
            renderJobDetails(currentJobData);
        }
    }

    // This listener ensures updateTranslations runs when language.js signals readiness
    window.addEventListener('translationsApplied', updateTranslations);

    function createLoadingSpinnerHtml(textKey = 'loading_text', defaultText = 'Loading...') {
        const t = window.translations[window.currentLanguage] || {}; // Safely get translations for current language
        const text = t[textKey] || defaultText;
        return `<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> <span>${text}</span></div>`;
    }

    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type} show`;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
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

    function formatDate(dateString) {
        const t = window.translations[window.currentLanguage] || {}; // Use current language
        if (!dateString) return t['not_available']?.[window.currentLanguage] || 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString(window.currentLanguage, { year: 'numeric', month: 'short', day: 'numeric' });
    }

    /**
     * SEO: Inject JSON-LD Schema for Google Jobs
     * This provides structured data for search engines to index the job listing accurately.
     */
    function injectJobSchema(job) {
        if (!job) return;

        // Remove existing schema if any
        const existingSchema = document.getElementById('job-jsonld-schema');
        if (existingSchema) existingSchema.remove();

        const siteUrl = window.location.origin;
        const jobUrl = window.location.href;
        const logoUrl = job.display_employer_logo || `${siteUrl}/favicon.ico`;

        const schema = {
            "@context": "https://schema.org/",
            "@type": "JobPosting",
            "title": job.title,
            "description": job.description || "",
            "identifier": {
                "@type": "PropertyValue",
                "name": job.display_employer_name,
                "value": job.id
            },
            "datePosted": job.created_at,
            "validThrough": job.deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            "employmentType": (job.job_type || "Full-time").toUpperCase().replace(' ', '_'),
            "hiringOrganization": {
                "@type": "Organization",
                "name": job.display_employer_name,
                "sameAs": siteUrl,
                "logo": logoUrl
            },
            "jobLocation": {
                "@type": "Place",
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": job.job_city || job.city || "Remote",
                    "addressRegion": job.job_country || job.country || "Palestine",
                    "addressCountry": "PS"
                }
            },
            "baseSalary": job.budget ? {
                "@type": "MonetaryAmount",
                "currency": job.currency || "USD",
                "value": {
                    "@type": "QuantitativeValue",
                    "value": job.budget,
                    "unitText": "MONTH"
                }
            } : undefined
        };

        const script = document.createElement('script');
        script.id = 'job-jsonld-schema';
        script.type = 'application/ld+json';
        script.innerHTML = JSON.stringify(schema);
        document.head.appendChild(script);

        // SEO: Breadcrumb Schema
        const breadcrumbSchema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": siteUrl
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Jobs",
                    "item": `${siteUrl}/jobs`
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": job.title,
                    "item": jobUrl
                }
            ]
        };
        const bcScript = document.createElement('script');
        bcScript.id = 'breadcrumb-jsonld-schema';
        bcScript.type = 'application/ld+json';
        bcScript.innerHTML = JSON.stringify(breadcrumbSchema);
        document.head.appendChild(bcScript);
    }

    function getPlaceholderUrl(text, width = 60, height = 60) {
        return `https://placehold.co/${width}x${height}/999999/ffffff?text=${encodeURIComponent(text)}`;
    }

    function showModal(modalElement) {
        if (!modalElement) {
            console.error('[showModal] Modal element not found. Cannot show modal.');
            return;
        }
        modalElement.classList.add('show');
        document.body.classList.add('modal-open');
    }

    function hideModal(modalElement) {
        if (!modalElement) {
            console.error('[hideModal] Modal element not found. Cannot hide modal.');
            return;
        }
        modalElement.classList.remove('show');
        document.body.classList.remove('modal-open');
    }

    modalCloseButtons.forEach(button => {
        button.addEventListener('click', () => {
            hideModal(employerLoginModal);
            hideModal(freelancerLoginModal);
            hideModal(applicationModal);
            hideModal(employerCannotApplyModal);
            hideModal(idVerificationModal);
            hideModal(lowCompletenessModal);
            hideModal(externalApplyModal);
            hideModal(applicationSuccessModal);
        });
    });

    function computeProfileCompletenessFromUser(user, overrideProfile = null) {
        // Fallback function that tries to match the server-side logic in routes/user.js
        const u = overrideProfile || {
            ...(user || {}),
            ...(user && user.profile ? user.profile : {})
        };
        
        let score = 0;
        
        // 1. Personal Info (20% total - 4% each)
        if (u.first_name || u.firstName) score += 4;
        if (u.last_name || u.lastName) score += 4;
        if (u.phone) score += 4;
        if (u.city) score += 4;
        if (u.birthdate) score += 4;

        // 2. Profile Picture (10%)
        if (u.profile_picture_url || u.profile_pic_url || u.avatar_url) score += 10;

        // 3. Bio (10%)
        const bio = u.bio || u.about_me || u.description;
        if (bio && String(bio).length > 10) score += 10;

        // 4. Skills (15%)
        const skills = u.skills || u.skills_text;
        if (skills && (Array.isArray(skills) ? skills.length > 0 : String(skills).length > 0)) score += 15;

        // 5. Interested Professions (10%)
        const profs = u.interested_professions || u.professions;
        if (profs && Array.isArray(profs) && profs.length > 0) score += 10;

        // 6. CV / Resume (15%)
        const cv = u.cv_path || u.cv_url || u.resume_url;
        if (cv) score += 15;

        // 7. Status & Work/Education Details (20%)
        const status = u.current_status || u.status;
        if (status) {
            score += 5; // Base for having a status
            if (status === 'Student') {
                const studentType = u.student_type;
                if (studentType === 'School') {
                    if (u.school_grade) score += 15;
                } else if (studentType === 'University') {
                    if (u.university) score += 5;
                    if (u.degree) score += 5;
                    if (u.study_status) score += 5;
                } else {
                    score += 5;
                }
            } else {
                if (u.profession) score += 15;
            }
        }

        return Math.min(100, score);
    }

    function updateLowCompletenessRing(percent) {
        if (!lowCompletenessRingProgress || !lowCompletenessPercent) return;
        const r = 54;
        const circumference = 2 * Math.PI * r;
        lowCompletenessRingProgress.setAttribute('stroke-dasharray', `${circumference} ${circumference}`);
        const offset = circumference - (percent / 100) * circumference;
        lowCompletenessRingProgress.style.strokeDashoffset = offset;
        lowCompletenessPercent.textContent = `${percent}%`;
    }

    function populateLowCompletenessDetails(user, percent, overrideProfile = null) {
        const t = window.translations;
        if (lowCompletenessMissingList) {
            lowCompletenessMissingList.innerHTML = '';
            const raw = overrideProfile || ((user && user.profile) ? user.profile : {});
            const get = (obj, keys) => keys.find(k => obj && obj[k] !== undefined) ? obj[keys.find(k => obj[k] !== undefined)] : undefined;
            const profile = {
                cv_path: get(raw, ['cv_path','cv','cv_url','resume_url','cvPath']),
                profile_picture_url: get(raw, ['profile_picture_url','profile_pic_url','picture_url','photo_url','avatar_url']),
                interested_professions: get(raw, ['interested_professions','interestedProfessions','professions_interested','professions']) || [],
                current_status: get(raw, ['current_status','status']),
                skills: get(raw, ['skills','skills_text']),
                bio: get(raw, ['bio','about_me','description']),
            };
            const missing = [];
            if (!profile.cv_path) missing.push(t['missing_cv']?.[window.currentLanguage] || 'CV');
            if (!profile.profile_picture_url) missing.push(t['missing_profile_picture']?.[window.currentLanguage] || 'Profile Picture');
            const profs = Array.isArray(profile.interested_professions) ? profile.interested_professions : (typeof profile.interested_professions === 'string' ? profile.interested_professions.split(',').map(s=>s.trim()).filter(Boolean) : []);
            if (profs.length === 0) missing.push(t['missing_professions']?.[window.currentLanguage] || 'Interested Professions');
            if (!profile.current_status) missing.push(t['missing_current_status']?.[window.currentLanguage] || 'Current Status');
            const skillsVal = Array.isArray(profile.skills) ? profile.skills.join(',') : String(profile.skills || '').trim();
            if (skillsVal.length === 0) missing.push(t['missing_skills']?.[window.currentLanguage] || 'Skills');
            const bioVal = String(profile.bio || '').trim();
            if (bioVal.length === 0) missing.push(t['missing_bio']?.[window.currentLanguage] || 'Bio');
            missing.slice(0, 4).forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                lowCompletenessMissingList.appendChild(li);
            });
        }
        if (lowCompletenessDynamicDesc) {
            const hasCv = !!(overrideProfile ? (overrideProfile.cv_path || overrideProfile.cv || overrideProfile.cv_url || overrideProfile.resume_url || overrideProfile.cvPath) : (user && user.profile && (user.profile.cv_path || user.profile.cv || user.profile.cv_url || user.profile.resume_url || user.profile.cvPath)));
            if (!hasCv) {
                lowCompletenessDynamicDesc.textContent = (t['low_profile_modal_desc_cv_missing']?.[window.currentLanguage] || 'Your profile is missing a CV. Are you sure you want to continue?');
            } else {
                lowCompletenessDynamicDesc.textContent = (t['low_profile_modal_desc_low']?.[window.currentLanguage] || 'Your profile completeness is low. Are you sure you want to continue?');
            }
        }
    }



    function openApplicationModal() {
        if (jobTitleModalElem && currentJobData) {
            jobTitleModalElem.textContent = currentJobData.title;
        }

        const freelanceFields = document.getElementById('freelanceFields');
        const isAggregated = currentJobData && currentJobData.is_external;
        
        if (isAggregated) {
            if (freelanceFields) freelanceFields.style.display = 'none';
            if (bidAmountInput) bidAmountInput.removeAttribute('required');
            if (timelineInput) timelineInput.removeAttribute('required');
        } else {
            const jobType = (currentJobData.job_type || '').toLowerCase();
            const isFreelance = !(jobType === 'full-time' || jobType === 'part-time' || jobType === 'internship' || jobType === 'temporary');
            
            if (isFreelance) {
                if (freelanceFields) freelanceFields.style.display = 'flex';
                if (bidAmountInput) bidAmountInput.setAttribute('required', 'true');
                if (timelineInput) timelineInput.setAttribute('required', 'true');
            } else {
                if (freelanceFields) freelanceFields.style.display = 'none';
                if (bidAmountInput) bidAmountInput.removeAttribute('required');
                if (timelineInput) timelineInput.removeAttribute('required');
            }
        }
        showModal(applicationModal);
    }


    // --- Main Fetch Function ---
    async function fetchJobDetails() {
        if (pageLoadingOverlay) pageLoadingOverlay.classList.add('show');
        if (jobDetailsContent) jobDetailsContent.style.display = 'none';
        if (pageErrorMessage) pageErrorMessage.style.display = 'none';

        const pathParts = window.location.pathname.split('/').filter(p => p !== '');
        
        // Elite SEO: Handle /jobs/:id/:slug format
        if (pathParts[0] === 'jobs' && pathParts[1] && !isNaN(pathParts[1])) {
            currentJobId = pathParts[1];
        } else {
            // Fallback for legacy /job_details.html?id= or /job_details/ID
            let lastPart = pathParts[pathParts.length - 1];

            if (lastPart && lastPart.endsWith('.html')) {
                lastPart = lastPart.replace('.html', '');
            }

            if (lastPart && !isNaN(lastPart) && parseInt(lastPart) > 0) {
                currentJobId = lastPart;
            } else {
                const urlParams = new URLSearchParams(window.location.search);
                currentJobId = urlParams.get('id');
            }
        }

        if (!currentJobId) {
            if (pageErrorMessage) {
                const t = window.translations[window.currentLanguage] || {};
                pageErrorMessage.innerHTML = `<i class="fas fa-exclamation-triangle"></i><h3>${t['error_loading_job'] || 'Error loading job details.'}</h3><p>${t['job_id_missing'] || 'Job ID is missing from the URL.'}</p>`;
                pageErrorMessage.style.display = 'block';
            }
            if (pageLoadingOverlay) pageLoadingOverlay.classList.remove('show');
            return;
        }

        try {
            // Fetch job and auth status in parallel
            const [jobRes, authStatus] = await Promise.all([
                fetch(`/api/jobs/${currentJobId}`),
                checkAuthStatus()
            ]);

            if (!jobRes.ok) {
                const errorData = await jobRes.json();
                throw new Error(errorData.error || (window.translations[window.currentLanguage]?.['failed_fetch_job_details'] || 'Failed to fetch job details.'));
            }
            currentJobData = await jobRes.json();

            // Record a view for this job (counts any visitor)
            try {
                fetch(`/api/jobs/${currentJobId}/view`, { method: 'POST' });
            } catch (e) {}

            // If user is logged in and is a professional, pre-fetch their profile for completeness
            if (currentLoggedInUser && (currentLoggedInUser.user_type === 'professional' || currentLoggedInUser.user_type === 'freelancer')) {
                // Background fetch to have it ready
                fetch('/api/user/profile').then(res => res.json()).then(data => {
                    window._cachedProfile = data.data;
                }).catch(() => {});
            }

            // IMPORTANT: Call renderJobDetails directly here after data is loaded and auth is checked.
            renderJobDetails(currentJobData);
            updateTranslations(); 
            
            // SEO: Inject JSON-LD Schema for Google Jobs
            injectJobSchema(currentJobData);
            
            checkApplicationStatus(currentJobData.id, currentLoggedInUser ? currentLoggedInUser.id : null);

            if (jobDetailsContent) {
                jobDetailsContent.style.display = 'grid';
            }
        } catch (error) {
            console.error('Error fetching job details:', error);
            if (pageErrorMessage) {
                const t = window.translations[window.currentLanguage] || {};
                const errorPrefix = t['error_prefix']?.[window.currentLanguage] || 'Error: ';
                const errorText = `${errorPrefix}${error.message}`;
                pageErrorMessage.innerHTML = `<i class="fas fa-exclamation-triangle"></i><h3>${t['error_loading_job'] || 'Error loading job details.'}</h3><p>${errorText}</p><p>${t['try_again_later'] || 'Please try again later.'}</p>`;
                pageErrorMessage.style.display = 'block';
            }
        } finally {
            if (pageLoadingOverlay) pageLoadingOverlay.classList.remove('show');
        }
    }

    // --- Render Job Details (Enhanced for Translation and Consistency) ---
function renderJobDetails(job) {
    if (!job) {
        console.error('No job data provided to renderJobDetails');
        return;
    }
    const lang = window.currentLanguage || 'en';
    const t = window.translations;
    const cityTranslations = window.palestinianCitiesTranslations || {};
    
    // --- 1. Job Overview Section (Meta Info) ---
    if (jobTitleElem) jobTitleElem.textContent = job.title;
    
    // **A. Location/City Logic**
    // Handle both aliased and non-aliased property names from different API routes
    const city = job.job_city || job.city;
    const country = job.job_country || job.country;

    const cityExists = city && city.trim() !== '' && city.toLowerCase() !== 'n/a' && city.toLowerCase() !== 'unknown';
    const countryExists = country && country.trim() !== '' && country.toLowerCase() !== 'n/a' && country.toLowerCase() !== 'unknown';
    
    let translatedCountry = '';
    if (countryExists) {
        const countryKey = `country_${country.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
        translatedCountry = cityTranslations?.[countryKey]?.[lang] || country;
    }

    let translatedCity = '';
    if (cityExists) {
        const cityKey = `city_${city.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
        translatedCity = cityTranslations?.[cityKey]?.[lang] || city;
    }

    // Render Country
    if (jobCountryElem) {
        if (translatedCountry) {
            jobCountryElem.innerHTML = `<i class="fas fa-globe"></i> ${translatedCountry}`;
            jobCountryElem.style.display = 'inline-flex';
            if (dividerCountry) dividerCountry.style.display = 'inline';
        } else {
            jobCountryElem.style.display = 'none';
            if (dividerCountry) dividerCountry.style.display = 'none';
        }
    }

    // Render City
    if (jobCityElem) {
        if (translatedCity && 
            translatedCity.toLowerCase() !== translatedCountry.toLowerCase() && 
            translatedCity.toLowerCase() !== 'other' && 
            city.toLowerCase() !== 'other') {
            jobCityElem.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${translatedCity}`;
            jobCityElem.style.display = 'inline-flex';
            if (dividerCity) dividerCity.style.display = 'inline';
        } else {
            jobCityElem.style.display = 'none';
            if (dividerCity) dividerCity.style.display = 'none';
        }
    }

    // **B. Job Type Translation**
    const jobTypeKey = (job.job_type || '').toLowerCase().replace(/[\s&()]/g, '_').replace(/[^a-z0-9_]/g, '');
    const translatedJobType = t?.[jobTypeKey]?.[lang] || job.job_type;
    if (jobTypeElem) {
        if (translatedJobType && translatedJobType.toLowerCase() !== 'n/a') {
            jobTypeElem.innerHTML = `<i class="fas fa-briefcase"></i> ${translatedJobType}`;
            jobTypeElem.style.display = 'inline-flex';
            if (dividerType) dividerType.style.display = 'inline';
        } else {
            jobTypeElem.style.display = 'none';
            if (dividerType) dividerType.style.display = 'none';
        }
    }

    // **C. Job Site Type (Remote/Hybrid/On-site)**
    if (jobSiteTypeElem) {
        const siteType = job.job_site_type || 'On-site';
        const translatedSiteType = t[siteType.toLowerCase().replace('-', '_')]?.[lang] || siteType;
        
        // Hide if it's "N/A" or "Unknown"
        if (translatedSiteType.toLowerCase() === 'n/a' || translatedSiteType.toLowerCase() === 'unknown') {
            jobSiteTypeElem.style.display = 'none';
            if (dividerSiteType) dividerSiteType.style.display = 'none';
        } else {
            jobSiteTypeElem.innerHTML = `<i class="fas fa-laptop-house"></i> ${translatedSiteType}`;
            jobSiteTypeElem.style.display = 'inline-flex';
            if (dividerSiteType) dividerSiteType.style.display = 'inline';
        }
    }

    // **D. Budget**
    if (jobBudgetElem) {
        const budgetValue = job.budget ? `${getCurrencySymbol(job.currency)}${job.budget.toLocaleString()}` : (t?.['negotiable']?.[lang] || 'Negotiable');
        if (budgetValue && budgetValue.toLowerCase() !== 'n/a') {
            jobBudgetElem.innerHTML = `<i class="fas fa-money-bill-wave"></i> ${budgetValue}`;
            jobBudgetElem.style.display = 'inline-flex';
            if (dividerBudget) dividerBudget.style.display = 'inline';
        } else {
            jobBudgetElem.style.display = 'none';
            if (dividerBudget) dividerBudget.style.display = 'none';
        }
    }
    
    // **E. Gender**
    if (jobGenderElem) {
        const gender = job.gender_requirement || 'any';
        if (gender === 'any' || gender.toLowerCase() === 'n/a') {
            jobGenderElem.style.display = 'none';
            if (dividerGender) dividerGender.style.display = 'none';
        } else {
            const translatedGender = t[`${gender}_option`]?.[lang] || t[`select_gender_${gender}`]?.[lang] || gender;
            jobGenderElem.innerHTML = `<i class="fas fa-venus-mars"></i> ${translatedGender}`;
            jobGenderElem.style.display = 'inline-flex';
            if (dividerGender) dividerGender.style.display = 'inline';
        }
    }

    // **F. Age Range**
    if (jobAgeRangeElem) {
        if ((job.age_min || job.age_max) && (String(job.age_min).toLowerCase() !== 'n/a' && String(job.age_max).toLowerCase() !== 'n/a')) {
            const from = job.age_min || '';
            const to = job.age_max || '';
            jobAgeRangeElem.innerHTML = `<i class="fas fa-user-clock"></i> ${from} - ${to}`;
            jobAgeRangeElem.style.display = 'inline-flex';
            if (dividerAge) dividerAge.style.display = 'inline';
        } else {
            jobAgeRangeElem.style.display = 'none';
            if (dividerAge) dividerAge.style.display = 'none';
        }
    }

    // **G. Date Display (Always show Post Date in meta)**
    if (jobPostedDateElem) {
        jobPostedDateElem.innerHTML = `<i class="fas fa-clock"></i> ${formatDate(job.created_at)}`;
    }

    // --- 2. Job Description Section ---
    if (jobDescriptionElem) {
        jobDescriptionElem.innerHTML = job.description ? job.description.replace(/\n/g, '<br>') : t['no_description_provided']?.[lang] || 'No description provided.';
        const textContent = jobDescriptionElem.textContent.trim();
        const isRTL = /[\u0600-\u06FF]/.test(textContent); // Check for Arabic characters
        jobDescriptionElem.style.direction = isRTL ? 'rtl' : 'ltr';
        jobDescriptionElem.style.textAlign = isRTL ? 'right' : 'left';
    }

    // --- 3. Required Professions Section ---
    if (requiredProfessionsContainer) {
        if (job.profession_required && job.profession_required.length > 0) {
            requiredProfessionsContainer.innerHTML = job.profession_required.map(prof => {
                let translatedProf = prof;
                // Search in the full global list for the correct translation
                for (const cat of globalTalentCategories) {
                    const found = cat.professions.find(p => p.en === prof);
                    if (found) {
                        translatedProf = (found.ar && lang === 'ar') ? found.ar : found.en;
                        break;
                    }
                }
                return `<span class="job-tag">${translatedProf}</span>`;
            }).join('');
            noRequiredProfessionsMessage.style.display = 'none';
        } else {
            requiredProfessionsContainer.innerHTML = '';
            noRequiredProfessionsMessage.style.display = 'block';
        }
    }

    // --- 4. Job Image Section ---
    if (jobImageSection && jobImageElem) {
        if (job.job_image_path) {
            jobImageElem.src = job.job_image_path;
            jobImageSection.style.display = 'block';
        } else {
            jobImageSection.style.display = 'none';
        }
    }

    // --- 5. About Employer Section ---
    if (aboutEmployerSection) {
        let employerDisplayName = job.display_employer_name || 'N/A';
        const employerLogo = job.display_employer_logo;
        const employerType = job.display_employer_type || 'individual';
        
        // Hide name if it indicates hidden identity
        const hiddenIdentities = [
            'هوية صاحب العمل مخفية',
            'Employer identity hidden',
            'Confidential',
            'Hidden Identity'
        ];
        
        const isHidden = hiddenIdentities.includes(employerDisplayName);
        if (isHidden) {
            employerDisplayName = '';
        }

        let avatarHtml = '';
        let avatarClass = `employer-logo-sm ${employerType}`;
        
        if (employerLogo) {
            const safeName = employerDisplayName.replace(/"/g, '&quot;');
            avatarHtml = `<img src="${employerLogo}" onerror="this.onerror=null; this.outerHTML='<i class=&quot;fas fa-briefcase fallback-job-icon&quot;></i>';" alt="${safeName} Logo">`;
        } else {
            avatarHtml = `<i class="fas fa-briefcase fallback-job-icon"></i>`;
        }

        const translatedAboutEmployer = t['about_the_employer']?.[lang] || 'About the Employer';
        const translatedViewProfile = t['view_employer_profile']?.[lang] || 'View Employer Profile';
        
        const employerSlug = job.employer_slug;
        const profileUrl = employerSlug ? `/${employerSlug}` : `/employer_profile.html?id=${job.employer_user_id}`;

        if (job.is_external) {
            aboutEmployerSection.innerHTML = `
                <h2 data-lang-key="about_the_employer"><i class="fas fa-info-circle"></i> ${translatedAboutEmployer}</h2>
                <div class="employer-info-card">
                    <div class="employer-card-header-main">
                        <div class="${avatarClass}" id="employerLogoContainer">
                            ${avatarHtml}
                        </div>
                        <div class="employer-details-main">
                            ${employerDisplayName ? `<h3 class="employer-name-header" id="employerName">${employerDisplayName}</h3>` : ''}
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Manual/Internal Job
            aboutEmployerSection.innerHTML = `
                <h2 data-lang-key="about_the_employer"><i class="fas fa-info-circle"></i> ${translatedAboutEmployer}</h2>
                <div class="employer-info-card">
                    <div class="employer-card-header-main">
                        <div class="${avatarClass}" id="employerLogoContainer">
                            ${avatarHtml}
                        </div>
                        <div class="employer-details-main">
                            ${employerDisplayName ? `<h3 class="employer-name-header" id="employerName">${employerDisplayName}</h3>` : ''}
                        </div>
                    </div>
                    ${!isHidden ? `
                    <a href="${profileUrl}" id="viewEmployerProfileBtn" class="btn btn-primary btn-icon" data-lang-key="view_employer_profile">
                        <i class="fas fa-user-tie"></i> <span class="button-text">${translatedViewProfile}</span>
                    </a>
                    ` : ''}
                </div>
            `;

            const employerProfileBtn = aboutEmployerSection.querySelector('#viewEmployerProfileBtn');
            if (employerProfileBtn) {
                employerProfileBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (currentLoggedInUser && (currentLoggedInUser.user_type === 'professional' || currentLoggedInUser.user_type === 'freelancer')) {
                        window.open(profileUrl, '_blank');
                    } else {
                        showModal(freelancerLoginModal);
                    }
                });
            }
        }
    }

    // --- 6. Deadline Display Section ---
    const deadlineSection = document.getElementById('deadlineSection');
    const deadlineDateElem = document.getElementById('deadlineDate');
    
    if (deadlineSection && deadlineDateElem && job.deadline) {
        const deadlineDate = new Date(job.deadline);
        const formattedDeadline = formatDate(job.deadline);
        
        deadlineDateElem.textContent = formattedDeadline;
        deadlineSection.style.display = 'block';
    } else if (deadlineSection) {
        deadlineSection.style.display = 'none';
    }

    // --- 7. Requirements Section ---
    if (jobRequirementsList && jobRequirementsSection) {
        const reqs = Array.isArray(job.requirements) ? job.requirements.filter(r => (r || '').trim().length > 0) : [];
        if (reqs.length > 0) {
            jobRequirementsList.innerHTML = '';
            reqs.forEach(r => {
                const li = document.createElement('li');
                li.className = 'requirement-item';
                
                // RTL/LTR logic for each requirement
                const isRTL = /[\u0600-\u06FF]/.test(r);
                li.style.direction = isRTL ? 'rtl' : 'ltr';
                li.style.textAlign = isRTL ? 'right' : 'left';
                
                li.innerHTML = `<i class="fas fa-check-circle requirement-icon" style="${isRTL ? 'margin-left: 10px; margin-right: 0;' : ''}"></i><span class="requirement-text">${r}</span>`;
                jobRequirementsList.appendChild(li);
            });
            if (noRequirementsMessage) noRequirementsMessage.style.display = 'none';
            jobRequirementsList.style.display = 'block';
            jobRequirementsSection.style.display = 'block';
        } else {
            jobRequirementsList.style.display = 'none';
            if (noRequirementsMessage) noRequirementsMessage.style.display = 'none';
            jobRequirementsSection.style.display = 'none';
        }
    }

    // --- 8. Dossier Sections (Responsibilities, Preferred Qualifications, Benefits) ---
    const dossier = job.job_dossier || {};
    
    // Helper to render a section
    const renderDossierSection = (id, data, icon) => {
        const container = document.getElementById(id);
        if (!container) return;
        
        const list = container.querySelector('ul') || container.querySelector('.dossier-list');
        const section = container.closest('.job-details-section') || container;
        
        const items = Array.isArray(data) ? data.filter(i => (i || '').trim().length > 0) : [];
        
        if (items.length > 0 && list) {
            list.innerHTML = items.map(item => {
                const isRTL = /[\u0600-\u06FF]/.test(item);
                const style = `direction: ${isRTL ? 'rtl' : 'ltr'}; text-align: ${isRTL ? 'right' : 'left'};`;
                const iconStyle = isRTL ? 'margin-left: 10px; margin-right: 0;' : '';
                
                return `
                    <li class="requirement-item" style="${style}">
                        <i class="${icon} requirement-icon" style="${iconStyle}"></i>
                        <span class="requirement-text">${item}</span>
                    </li>
                `;
            }).join('');
            section.style.display = 'block';
        } else if (section) {
            section.style.display = 'none';
        }
    };

    renderDossierSection('jobResponsibilities', dossier.responsibilities, 'fas fa-tasks');
    renderDossierSection('jobPreferredQualifications', dossier.preferred_qualifications, 'fas fa-star');
    renderDossierSection('jobBenefits', dossier.benefits, 'fas fa-gift');
}


    async function checkApplicationStatus(jobId, professionalId) {
        const t = window.translations[window.currentLanguage] || {};

        // If external apply is available, always show Apply Now (bypass internal application gating)
        if (currentJobData && currentJobData.external_apply_url) {
            // Check deadline even for external URL
            if (currentJobData.deadline) {
                const deadlineDate = new Date(currentJobData.deadline);
                const currentDate = new Date();
                if (currentDate > deadlineDate) {
                    applyNowBtn.style.display = 'none';
                    alreadyAppliedBtn.style.display = 'none';
                    jobClosedBtn.style.display = 'none';
                    deadlinePassedBtn.style.display = 'block';
                    return;
                }
            }
            applyNowBtn.style.display = 'block';
            alreadyAppliedBtn.style.display = 'none';
            jobClosedBtn.style.display = 'none';
            deadlinePassedBtn.style.display = 'none';
            return;
        }

        // Only professionals can have an application status to check
        if (!professionalId || currentLoggedInUser.user_type === 'employer') {
            // Check deadline for employers/admins/guest views
            if (currentJobData.deadline) {
                const deadlineDate = new Date(currentJobData.deadline);
                const currentDate = new Date();
                if (currentDate > deadlineDate) {
                    applyNowBtn.style.display = 'none';
                    alreadyAppliedBtn.style.display = 'none';
                    jobClosedBtn.style.display = 'none';
                    deadlinePassedBtn.style.display = 'block';
                    return;
                }
            }
            applyNowBtn.style.display = 'block';
            alreadyAppliedBtn.style.display = 'none';
            jobClosedBtn.style.display = 'none';
            deadlinePassedBtn.style.display = 'none';
            return;
        }

        if (currentJobData.status && currentJobData.status.toLowerCase() !== 'open') {
            applyNowBtn.style.display = 'none';
            alreadyAppliedBtn.style.display = 'none';
            jobClosedBtn.style.display = 'block';
            deadlinePassedBtn.style.display = 'none';
            return;
        }

        // Check if deadline has passed
        if (currentJobData.deadline) {
            const deadlineDate = new Date(currentJobData.deadline);
            const currentDate = new Date();
            
            if (currentDate > deadlineDate) {
                applyNowBtn.style.display = 'none';
                alreadyAppliedBtn.style.display = 'none';
                jobClosedBtn.style.display = 'none';
                deadlinePassedBtn.style.display = 'block';
                return;
            }
        }

        try {
            // Fix: Use professionalId instead of freelancerId to match backend validation
            const response = await fetch(`/api/applications/check?jobId=${jobId}&professionalId=${professionalId}`);
            const data = await response.json();

            if (data.success && data.hasApplied) {
                applyNowBtn.style.display = 'none';
                alreadyAppliedBtn.style.display = 'block';
                jobClosedBtn.style.display = 'none';
                deadlinePassedBtn.style.display = 'none';
            } else {
                applyNowBtn.style.display = 'block';
                alreadyAppliedBtn.style.display = 'none';
                jobClosedBtn.style.display = 'none';
                deadlinePassedBtn.style.display = 'none';
            }
        } catch (error) {
            console.error('Error checking application status:', error);
            // On error, show Apply Now as fallback
            applyNowBtn.style.display = 'block';
            alreadyAppliedBtn.style.display = 'none';
            jobClosedBtn.style.display = 'none';
            deadlinePassedBtn.style.display = 'none';
        }
    }

    if (applyNowBtn) {
        applyNowBtn.addEventListener('click', async () => {
            const t = window.translations;
            const originalContent = applyNowBtn.innerHTML;
            
            // Immediately show loading state for better perceived performance
            applyNowBtn.disabled = true;
            applyNowBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t['loading_text']?.[window.currentLanguage] || 'Loading...'}`;

            try {
                // Guard: if logged out, show freelancer login modal
                if (!currentLoggedInUser) {
                    showModal(freelancerLoginModal);
                    return;
                }

                if (currentLoggedInUser.user_type === 'employer') {
                    console.log('[Apply] User blocked: type is employer', currentLoggedInUser);
                    showModal(employerCannotApplyModal);
                    return;
                }

                // Get profile data (prefer cached)
                let completeness = 0;
                let detailedProfile = null;
                
                if (window._cachedProfile) {
                    detailedProfile = window._cachedProfile;
                    completeness = detailedProfile.profile_completeness || 0;
                } else {
                    const profileResp = await fetch('/api/user/profile');
                    if (profileResp.ok) {
                        const profileData = await profileResp.json();
                        detailedProfile = profileData.data;
                        window._cachedProfile = detailedProfile;
                        completeness = detailedProfile.profile_completeness || 0;
                    }
                }

                // If the job has an external apply URL, show the branded modal
                if (currentJobData && currentJobData.external_apply_url) {
                    const company = currentJobData.display_employer_name || currentJobData.external_company_name || 'Company';
                    const source = currentJobData.external_source || 'External Source';
                    
                    if (externalJobModalDesc) {
                        const descTemplate = t['external_job_modal_desc']?.[window.currentLanguage] || 'This is an external job opportunity from {company}.';
                        externalJobModalDesc.innerHTML = descTemplate
                            .replace('{company}', `<strong class="text-hirly-600">${company}</strong>`);
                    }
                    
                    showModal(externalApplyModal);
                    return;
                }

                let hasCv = !!(detailedProfile && (detailedProfile.cv_path || detailedProfile.cv || detailedProfile.cv_url || detailedProfile.resume_url || detailedProfile.cvPath));

                // Check completeness threshold
                if (completeness < 75 || !hasCv) {
                    updateLowCompletenessRing(completeness);
                    lowCompletenessMissingList.innerHTML = '';
                    if (!hasCv) {
                        const li = document.createElement('li');
                        li.textContent = (t['missing_cv']?.[window.currentLanguage] || 'CV');
                        lowCompletenessMissingList.appendChild(li);
                        if (lowCompletenessDynamicDesc) {
                            lowCompletenessDynamicDesc.textContent = (t['low_profile_modal_desc_cv_missing']?.[window.currentLanguage] || 'Your profile is missing a CV. Are you sure you want to continue?');
                        }
                    } else if (lowCompletenessDynamicDesc) {
                        lowCompletenessDynamicDesc.textContent = (t['low_profile_modal_desc_low']?.[window.currentLanguage] || 'Your profile completeness is low. Are you sure you want to continue?');
                    }
                    showModal(lowCompletenessModal);
                    return;
                }
                
                openApplicationModal();
            } catch (err) {
                console.error('[Apply] Action failed:', err);
                showToast(t['error_loading_job']?.[window.currentLanguage] || 'An error occurred.', 'error');
            } finally {
                applyNowBtn.disabled = false;
                applyNowBtn.innerHTML = originalContent;
            }
        });
    }

    if (applyViaHirlyBtn) {
        applyViaHirlyBtn.addEventListener('click', () => {
            hideModal(externalApplyModal);
            openApplicationModal();
        });
    }

    if (cancelExternalApplyBtn) {
        cancelExternalApplyBtn.addEventListener('click', () => {
            hideModal(externalApplyModal);
        });
    }

    if (closeApplicationModalBtn) closeApplicationModalBtn.addEventListener('click', () => hideModal(applicationModal));
    if (cancelApplicationBtn) cancelApplicationBtn.addEventListener('click', () => hideModal(applicationModal));

    if (applicationForm) {
        applicationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const t = window.translations;

            if (!currentJobData || !currentLoggedInUser) {
                showToast((t['job_user_data_missing']?.[window.currentLanguage] || 'Error: Job data or user data missing.'), 'error');
                return;
            }

            const proposalMessage = proposalMessageInput.value.trim();
            const bidAmount = bidAmountInput.value.trim();
            const timeline = timelineInput.value.trim();

            applicationMessageStatus.textContent = (t['submitting_application']?.[window.currentLanguage] || 'Submitting application...');
            applicationMessageStatus.className = 'form-message info show';
            submitApplicationBtn.disabled = true;

            try {
                const jobType = currentJobData.job_type?.toLowerCase();
                const payload = { proposalMessage };
                if (jobType === 'full-time' || jobType === 'part-time' || jobType === 'internship' || jobType === 'temporary') {
                    // Do not include timeline in payload for employment-type jobs
                    // bidAmount not needed; backend will normalize to 0
                } else {
                    // Freelance/Contract or other types: include bidAmount and timeline when provided
                    const parsed = parseFloat(bidAmount);
                    if (!isNaN(parsed)) payload.bidAmount = parsed;
                    if (timeline) payload.timeline = timeline;
                }

                const response = await fetch(`/api/jobs/${currentJobId}/apply`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || (t['failed_submit_application']?.[window.currentLanguage] || 'Failed to submit application.'));
                }

                // Show success modal instead of just a toast
                hideModal(applicationModal);
                if (applicationSuccessModal) {
                    showModal(applicationSuccessModal);
                } else {
                    showToast(data.message || (t['app_submitted_success']?.[window.currentLanguage] || 'Application submitted successfully!'), 'success');
                }
                checkApplicationStatus(currentJobId, currentLoggedInUser.id);
            } catch (error) {
                console.error('Error submitting application:', error);
                applicationMessageStatus.textContent = `${(t['error_prefix']?.[window.currentLanguage] || 'Error: ')}${error.message}`;
                applicationMessageStatus.className = 'form-message error show';
            } finally {
                submitApplicationBtn.disabled = false;
                setTimeout(() => applicationMessageStatus.classList.remove('show'), 3000);
            }
        });
    }

    if (lowCompletenessApplyAnywayBtn) {
        lowCompletenessApplyAnywayBtn.addEventListener('click', () => {
            hideModal(lowCompletenessModal);
            openApplicationModal();
        });
    }

    if (lowCompletenessImproveBtn) {
        lowCompletenessImproveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/dashboard.html';
        });
    }

    if (viewApplicationBtn) {
        viewApplicationBtn.addEventListener('click', () => {
            window.location.href = '/dashboard.html';
        });
    }

    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/user');
            if (response.ok) {
                const userData = await response.json();
                currentLoggedInUser = userData.user;
            } else {
                currentLoggedInUser = null;
            }
        } catch (error) {
            console.error('Failed to fetch auth status:', error);
            currentLoggedInUser = null;
        }
    }

    function initializePage() {
        updateTranslations();
        fetchJobDetails();
    }

    if (window.translations && window.currentLanguage) {
        initializePage();
    } else {
        window.addEventListener('translationsApplied', () => {
            initializePage();
        }, { once: true });
    }
});
