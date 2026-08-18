// public/script.js
// This script contains global UI logic used across multiple pages.
// Authentication and language initialization logic has been moved to auth.js and language.js respectively.

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const navLinks = document.getElementById('navLinks');
    // Removed authButtons, userMenu, userAvatarImg, userAvatarText as they are now managed by auth.js
    // Removed handleAuthDisplayAndRedirect call as it's now managed by auth.js and components.js

    // Main header logo link (always redirects to homepage)
    const headerLogoLink = document.getElementById('headerLogoLink');
    if (headerLogoLink) {
        headerLogoLink.href = '/'; // Ensure it always points to the homepage
    }

    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', function() {
            if (navLinks) navLinks.classList.toggle('show');

            // Toggle visibility of auth buttons or user menu for mobile
            // This logic is now handled by handleAuthDisplayAndRedirect in auth.js
            const userMenu = document.getElementById('userMenu');
            const authButtons = document.getElementById('authButtons');
            if (userMenu && getComputedStyle(userMenu).display !== 'none') {
                userMenu.classList.toggle('show-mobile');
            } else if (authButtons) {
                authButtons.classList.toggle('show');
            }

            const isExpanded = this.getAttribute('aria-expanded') === 'true' || false;
            this.setAttribute('aria-expanded', !isExpanded);
        });
    }

    // --- SEO Helpers ---
    window.slugify = (text) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/[^\w\u0600-\u06FF-]+/g, '-') // Replace non-alphanumeric/non-Arabic with hyphens
            .replace(/--+/g, '-')                  // Collapse hyphens
            .replace(/^-+/, '')                    // Trim start
            .replace(/-+$/, '');                   // Trim end
    };

    window.generateJobSlug = (jobTitle, companyName) => {
        const title = window.slugify(jobTitle || 'job');
        const company = window.slugify(companyName || 'hirly');
        return `${title}-at-${company}`;
    };

    // FAQ Accordion (if present on the page)
    const faqQuestions = document.querySelectorAll('.faq-question');
    if (faqQuestions.length > 0) {
        faqQuestions.forEach(question => {
            question.addEventListener('click', function() {
                const answer = this.nextElementSibling;
                const isActive = this.classList.contains('active');

                // Close all other open answers
                faqQuestions.forEach(q => {
                    if (q !== this && q.classList.contains('active')) {
                        q.classList.remove('active');
                        q.nextElementSibling.style.maxHeight = null;
                        q.querySelector('i').classList.add('fa-chevron-down');
                        q.querySelector('i').classList.remove('fa-chevron-up');
                        q.setAttribute('aria-expanded', 'false');
                    }
                });

                // Toggle current answer
                this.classList.toggle('active');
                if (isActive) {
                    answer.style.maxHeight = null;
                    this.querySelector('i').classList.add('fa-chevron-down');
                    this.querySelector('i').classList.remove('fa-chevron-up');
                    this.setAttribute('aria-expanded', 'false');
                } else {
                    answer.style.maxHeight = answer.scrollHeight + "px";
                    this.querySelector('i').classList.remove('fa-chevron-down');
                    this.querySelector('i').classList.add('fa-chevron-up');
                    this.setAttribute('aria-expanded', 'true');
                }
            });
        });
    }

    // About page tabs
    const aboutTabs = document.querySelectorAll('.about-tab');
    if (aboutTabs.length > 0) {
        // Set initial active tab on load
        if (aboutTabs[0]) {
            aboutTabs[0].classList.add('active');
            const initialTarget = aboutTabs[0].dataset.target;
            if (document.getElementById(initialTarget)) {
                document.getElementById(initialTarget).classList.add('active');
            }
        }
        aboutTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const target = this.dataset.target;
                aboutTabs.forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });
                document.querySelectorAll('.about-tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                this.classList.add('active');
                this.setAttribute('aria-selected', 'true');
                document.getElementById(target).classList.add('active');
            });
        });
    }

    // The handleAuthDisplayAndRedirect function is now called from auth.js directly
    // and also by components.js after the header is loaded.
    // No need to call it here.
});


// Add this function to your script.js file (or a new global utility file)
function createJobCard(job, currentLanguage, translations, palestinianCitiesTranslations, globalCategoriesAndProfessions) {
    const lang = currentLanguage || 'en';
    const t = translations;

    // Helper to get currency symbol (can also be global if needed elsewhere)
    function getCurrencySymbol(currencyCode) {
        switch (currencyCode) {
            case 'USD': return '$';
            case 'ILS': return '₪';
            case 'JOD': return 'JD';
            case 'EUR': return '€';
            default: return '';
        }
    }
    const currencySymbol = getCurrencySymbol(job.currency);

    // Helper for placeholder images (can also be global)
    function getPlaceholderUrl(text, width = 60, height = 60) {
        return `https://placehold.co/${width}x${height}/999999/ffffff?text=${encodeURIComponent(text)}`;
    }

    const slug = window.generateJobSlug ? window.generateJobSlug(job.title, employerDisplayName) : 'details';
    card.href = `/jobs/${job.id}/${slug}`;
    card.className = 'job-card';

    // Unified Employer Display Logic
    const employerDisplayName = job.display_employer_name || 'N/A';
    const employerLogo = job.display_employer_logo;
    const avatarClass = `job-employer-logo-container ${job.display_employer_type || 'individual'}`;

    let employerAvatarHtml = '';
    if (employerLogo) {
        const safeName = employerDisplayName.replace(/"/g, '&quot;');
        employerAvatarHtml = `<img src="${employerLogo}" onerror="this.onerror=null; this.outerHTML='<i class=&quot;fas fa-briefcase fallback-job-icon&quot;></i>';" alt="${safeName} Logo">`;
    } else {
        employerAvatarHtml = `<i class="fas fa-briefcase fallback-job-icon"></i>`;
    }

    let translatedCity = t?.['not_available']?.[lang] || 'N/A';
    if (job.city && palestinianCitiesTranslations) {
        const cityKey = `city_${job.city.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
        translatedCity = (palestinianCitiesTranslations[cityKey] && palestinianCitiesTranslations[cityKey][lang])
                            ? palestinianCitiesTranslations[cityKey][lang]
                            : job.city;
    }

    let locationDisplay = '';
    if (job.job_site_type === 'Remote') {
        locationDisplay = t?.['remote']?.[lang] || 'Remote';
    } else if (job.job_site_type === 'Hybrid' && job.city) {
        locationDisplay = `Hybrid (${translatedCity})`;
    } else {
        locationDisplay = translatedCity;
    }

    let displayCategory = t?.['uncategorized']?.[lang] || 'Uncategorized';
    if (job.category) {
        // Try to find in global Talent Categories structure
        let foundCat = null;
        for (const cat of globalTalentCategories || []) {
            if (cat.name.en === job.category) {
                foundCat = cat;
                break;
            }
        }
        
        if (foundCat) {
            displayCategory = foundCat.name[lang] || foundCat.name.en;
        } else {
            // Fallback to legacy structure if needed
            const categoryData = (globalCategoriesAndProfessions || []).find(c => c.name.en === job.category);
            if (categoryData) {
                displayCategory = categoryData.name[lang] || categoryData.name.en;
            } else {
                displayCategory = job.category;
            }
        }
    }

    let displayJobType = t?.['not_available']?.[lang] || 'N/A';
    const jobTypeKey = (job.job_type || '').toLowerCase().replace(/[\s&()]/g, '_').replace(/[^a-z0-9_]/g, '');
    if (t?.[jobTypeKey]) {
        displayJobType = t[jobTypeKey][lang];
    } else {
        displayJobType = job.job_type || (t?.['not_available']?.[lang] || 'N/A');
    }

    card.innerHTML = `
        <div class="job-card-header">
            <div class="${avatarClass}">
                ${employerAvatarHtml}
            </div>
            <div class="job-card-info">
                <h3 class="job-title-main">${job.title}</h3>
                <p class="job-employer-name">${employerDisplayName}</p>
            </div>
        </div>
        <p class="job-meta">
            <span><i class="fas fa-map-marker-alt"></i> ${locationDisplay}</span>
            <span><i class="fas fa-clock"></i> ${window.timeAgo(job.created_at)}</span>
        </p>
        <div class="job-tags">
            <span class="tag">${displayCategory}</span>
            <span class="tag job-type-tag">${displayJobType}</span>
        </div>
        <div class="view-details-btn-container">
            <span class="btn btn-secondary view-details-btn">
                <span data-lang-key="view_details">${t?.['view_details']?.[lang] || 'View Details'}</span> <i class="fas fa-arrow-right"></i>
            </span>
        </div>
    `;
    return card;
}

// Make the function globally accessible
window.createJobCard = createJobCard;
