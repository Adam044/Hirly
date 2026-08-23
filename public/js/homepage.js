/* public/js/homepage.js */
// This script contains logic specific to the homepage (index.html)

// Get specific homepage elements
const featuredTalentsGrid = document.getElementById('featuredTalentsGrid');
const noFeaturedTalentsMessage = document.getElementById('noFeaturedTalentsMessage');
const discoverTalentsSection = document.getElementById('discoverTalentsSection');

const featuredCompaniesGrid = document.getElementById('featuredCompaniesGrid');
const homepageCategoriesGrid = document.getElementById('homepageCategories');

// Helper function to create a loading spinner
function createLoadingSpinner() {
    return `<div class="loading-spinner" style="display: flex; justify-content: center; align-items: center; padding: 20px; width: 100%;"><i class="fas fa-spinner fa-spin fa-2x" style="color: var(--primary);"></i></div>`;
}

// Helper to create placeholder URL
function getPlaceholderUrl(text, width = 60, height = 60) {
    return `https://placehold.co/${width}x${height}/e2e8f0/64748b?text=${encodeURIComponent(text)}`;
}

// Talent categories data (populated globally)
let talentCategories = [];

// Main Load Function
window.loadHomepageContent = async function () {
    // Initialize talent categories if needed
    if (talentCategories.length === 0 && typeof window.globalCategoriesAndProfessions !== 'undefined') {
        talentCategories = window.globalCategoriesAndProfessions;
    }

    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        await window.checkAuthStatus();
        fetchFeaturedTalents();
        fetchFeaturedCompanies();
        renderHomepageCategories();
        fetchFreshJobs();
        fetchDiscoverTalent();
    }
};

/**
 * Setup horizontal scroll with progress tracking and button states
 */
function setupHorizontalScroll(containerId, prevId, nextId, progressBarId) {
    const container = document.getElementById(containerId);
    const prevBtn = document.getElementById(prevId);
    const nextBtn = document.getElementById(nextId);
    const progressBar = document.getElementById(progressBarId);
    
    if (!container || !prevBtn || !nextBtn) return;

    const isRTL = document.documentElement.dir === 'rtl';
    const scrollAmount = 374; // Standardized card width + gap

    const updateUI = () => {
        const scrollLeft = Math.abs(container.scrollLeft);
        const maxScroll = container.scrollWidth - container.clientWidth;
        
        // Update Buttons
        if (isRTL) {
            // In RTL, scrollLeft is 0 at the right (start) and negative as we go left
            const atStart = scrollLeft < 10;
            const atEnd = scrollLeft >= maxScroll - 10;
            prevBtn.disabled = atStart;
            nextBtn.disabled = atEnd;
        } else {
            const atStart = scrollLeft < 10;
            const atEnd = scrollLeft >= maxScroll - 10;
            prevBtn.disabled = atStart;
            nextBtn.disabled = atEnd;
        }

        // Update Progress Bar
        if (progressBar) {
            const progress = (scrollLeft / maxScroll) * 100;
            progressBar.style.width = `${Math.min(100, progress)}%`;
        }
    };

    prevBtn.addEventListener('click', () => {
        container.scrollBy({ left: isRTL ? scrollAmount : -scrollAmount, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
        container.scrollBy({ left: isRTL ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    });

    container.addEventListener('scroll', updateUI);
    window.addEventListener('resize', updateUI);
    
    // Initial check
    setTimeout(updateUI, 500);
}

/**
 * Fetches and displays fresh job opportunities
 */
async function fetchFreshJobs() {
    const container = document.getElementById('freshJobsContainer');
    const emptyState = document.getElementById('freshJobsEmpty');
    
    if (!container) return;

    // Setup scroll logic once
    if (!container.dataset.scrollInitialized) {
        setupHorizontalScroll('freshJobsContainer', 'jobsPrev', 'jobsNext', 'jobsProgressBar');
        container.dataset.scrollInitialized = 'true';
    }
    
    try {
        const response = await fetch('/api/jobs/recent?limit=10');
        const data = await response.json();
        
        if (data.success && data.jobs && data.jobs.length > 0) {
            container.innerHTML = '';
            data.jobs.forEach(job => {
                container.appendChild(createJobCard(job));
            });
            if (emptyState) emptyState.style.display = 'none';
        } else {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching fresh jobs:', error);
        container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
    }
}

/**
 * Unified normalization for translation keys
 */
function getTranslationKey(type, value) {
    if (!value || value.toLowerCase() === 'other') return `${type}_other`;
    
    const normalized = value.toLowerCase()
        .replace(/'/g, '') // Remove apostrophes
        .replace(/[^a-z0-9]/g, '_') // Replace non-alphanumeric with underscore
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
        
    return `${type}_${normalized}`;
}

/**
 * Formats location as Country | City (skips "Other")
 */
function formatLocationDisplay(jobOrTalent, lang) {
    const t = window.translations;
    const cityTranslations = window.palestinianCitiesTranslations;
    
    const cityExists = jobOrTalent.city && jobOrTalent.city.trim() !== '' && jobOrTalent.city.toLowerCase() !== 'n/a' && jobOrTalent.city.toLowerCase() !== 'unknown';
    const countryExists = jobOrTalent.country && jobOrTalent.country.trim() !== '' && jobOrTalent.country.toLowerCase() !== 'n/a' && jobOrTalent.country.toLowerCase() !== 'unknown';

    let translatedCountry = '';
    if (countryExists) {
        const countryKey = getTranslationKey('country', jobOrTalent.country);
        translatedCountry = cityTranslations?.[countryKey]?.[lang] || jobOrTalent.country;
    }

    let translatedCity = '';
    if (cityExists && jobOrTalent.city.toLowerCase() !== 'other') {
        const cityKey = getTranslationKey('city', jobOrTalent.city);
        translatedCity = cityTranslations?.[cityKey]?.[lang] || jobOrTalent.city;
    }

    if (translatedCountry && translatedCity && 
        translatedCity.toLowerCase() !== translatedCountry.toLowerCase()) {
        return `${translatedCountry} | ${translatedCity}`;
    } else if (translatedCountry) {
        return translatedCountry;
    } else if (translatedCity) {
        return translatedCity;
    } else if (jobOrTalent.job_site_type) {
        const siteTypeKey = jobOrTalent.job_site_type.toLowerCase().replace('-', '_');
        return t?.[siteTypeKey]?.[lang] || jobOrTalent.job_site_type;
    } else {
        return t?.['not_available']?.[lang] || 'N/A';
    }
}

/**
 * Creates a job card element with luxe modern design
 */
function createJobCard(job) {
    const lang = window.currentLanguage || 'ar';
    const card = document.createElement('a');
    
    // SEO: Use slugified URL
    const slug = window.generateJobSlug(job.title, job.company_name);
    card.href = `/jobs/${job.id}/${slug}`;
    
    card.target = '_blank';
    card.className = 'home-job-card';
    
    // Avatar/Logo
    let avatarHtml = '';
    if (job.company_logo) {
        const thumbUrl = typeof ImageOptimizer !== 'undefined'
            ? ImageOptimizer.getOptimizedUrl(job.company_logo, 'thumb')
            : job.company_logo;
        avatarHtml = `<div class="home-job-card-avatar-container"><img src="${thumbUrl}" loading="lazy" width="48" height="48" onerror="this.onerror=null; this.src='${job.company_logo}'; this.onerror=function(){this.parentElement.innerHTML='<div class=&quot;home-job-card-avatar-placeholder&quot;><i class=&quot;fa-solid fa-building&quot;></i></div>'};" alt="${job.company_name}"></div>`;
    } else {
        avatarHtml = `<div class="home-job-card-avatar-container"><div class="home-job-card-avatar-placeholder"><i class="fa-solid fa-building"></i></div></div>`;
    }
    
    // Location Formatting
    const locationDisplay = formatLocationDisplay(job, lang);
    
    // Category Logic
    const t = window.translations;
    let displayCategory = t?.['not_available']?.[lang] || 'N/A';
    let categoryIcon = '';
    
    if (window.globalCategoriesAndProfessions) {
        const categoryData = window.globalCategoriesAndProfessions.find(c => c.name.en === job.category);
        if (categoryData) {
            displayCategory = categoryData.name[lang] || categoryData.name.en;
            categoryIcon = categoryData.icon ? `<i class="${categoryData.icon}"></i>` : '';
        } else {
            displayCategory = job.category || t?.['not_available']?.[lang] || 'N/A';
        }
    }

    const typeTrans = job.job_type ? (lang === 'ar' ? (job.job_type === 'Full-time' ? 'دوام كامل' : 'عمل حر') : job.job_type) : '';
    const timeAgo = formatTimeAgo(job.created_at, lang);
    
    card.innerHTML = `
        <div class="home-job-card-header">
            ${avatarHtml}
            <h3 class="home-job-card-title">${job.title || ''}</h3>
            <p class="home-job-card-company">${job.company_name || ''}</p>
        </div>
        <div class="home-job-card-tags">
            ${locationDisplay ? `<span class="home-job-tag location"><i class="fas fa-map-marker-alt"></i> ${locationDisplay}</span>` : ''}
            ${typeTrans ? `<span class="home-job-tag type"><i class="fas fa-briefcase"></i> ${typeTrans}</span>` : ''}
            <span class="home-job-tag category">${categoryIcon} ${displayCategory}</span>
        </div>
        <div class="home-job-card-footer">
            <div class="home-job-card-time"><i class="far fa-clock"></i> ${timeAgo}</div>
        </div>
    `;
    
    return card;
}

/**
 * Formats time ago
 */
function formatTimeAgo(dateString, lang) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (lang === 'ar') {
        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays < 7) return `منذ ${diffDays} يوم`;
        return date.toLocaleDateString('ar-SA');
    } else {
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US');
    }
}

/**
 * Fetches and displays discover talent (featured professionals)
 */
async function fetchDiscoverTalent() {
    const container = document.getElementById('talentContainer');
    const emptyState = document.getElementById('talentEmpty');
    
    if (!container) return;
    
    // Setup scroll logic once
    if (!container.dataset.scrollInitialized) {
        setupHorizontalScroll('talentContainer', 'talentPrev', 'talentNext', 'talentProgressBar');
        container.dataset.scrollInitialized = 'true';
    }
    
    try {
        container.innerHTML = `
            <div class="home-skeleton-talent-card"></div>
            <div class="home-skeleton-talent-card"></div>
            <div class="home-skeleton-talent-card"></div>
        `;
        
        const response = await fetch('/api/talents/featured?limit=12');
        const data = await response.json();
        
        if (data.success && data.talents && data.talents.length > 0) {
            container.innerHTML = '';
            data.talents.forEach(talent => {
                container.appendChild(createDiscoverTalentCard(talent));
            });
            if (emptyState) emptyState.style.display = 'none';
        } else {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching discover talent:', error);
        container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
    }
}

/**
 * Creates a talent card element with luxe minimal design
 */
function createDiscoverTalentCard(talent) {
    const lang = window.currentLanguage || 'ar';
    const card = document.createElement('a');
    card.href = talent.slug ? `/${talent.slug}` : `/profile.html?id=${talent.id}`;
    card.target = '_blank';
    card.className = 'talent-card';
    
    // Avatar
    const firstName = talent.first_name || '';
    const initials = `${firstName.charAt(0)}${(talent.last_name || '').charAt(0)}`.toUpperCase();
    let avatarContent;
    if (talent.profile_picture_url) {
        const thumbUrl = typeof ImageOptimizer !== 'undefined'
            ? ImageOptimizer.getOptimizedUrl(talent.profile_picture_url, 'thumb')
            : talent.profile_picture_url;
        avatarContent = `<img src="${thumbUrl}" class="talent-avatar-img" loading="lazy" width="80" height="80" onerror="this.onerror=null; this.src='${talent.profile_picture_url}'; this.onerror=function(){this.parentElement.innerHTML='<div class=&quot;talent-avatar-initials&quot;>${initials}</div>'};" alt="${firstName}">`;
    } else {
        avatarContent = `<div class="talent-avatar-initials">${initials}</div>`;
    }
    
    // Location Formatting
    const locationDisplay = formatLocationDisplay(talent, lang);

    // Primary Profession (Translation logic same as talent.js)
    const mainProfession = talent.profession;
    let translatedMainProfession = mainProfession || '';
    let primaryProfessionHtml = '';
    
    if (mainProfession) {
        if (window.globalCategoriesAndProfessions) {
            for (const cat of window.globalCategoriesAndProfessions) {
                const prof = cat.professions.find(p => p.en === mainProfession);
                if (prof) {
                    translatedMainProfession = (prof.ar && lang === 'ar') ? prof.ar : prof.en;
                    break;
                }
            }
        }
        primaryProfessionHtml = `<p class="talent-profession-display">${translatedMainProfession}</p>`;
    }

    // Interested Professions as Tags (Footer) - MAX 3
    let interestedProfessionsArray = [];
    if (Array.isArray(talent.interested_professions)) {
        interestedProfessionsArray = talent.interested_professions;
    } else if (typeof talent.interested_professions === 'string') {
        try {
            interestedProfessionsArray = JSON.parse(talent.interested_professions);
            if (!Array.isArray(interestedProfessionsArray)) {
                interestedProfessionsArray = [interestedProfessionsArray];
            }
        } catch (e) {
            interestedProfessionsArray = talent.interested_professions.split(',').map(s => s.trim());
        }
    }

    // Filter out the main profession to avoid duplication
    const tagsToDisplay = interestedProfessionsArray.filter(p => p !== mainProfession).slice(0, 3);
    const remainingCount = Math.max(0, interestedProfessionsArray.filter(p => p !== mainProfession).length - tagsToDisplay.length);
    const moreTranslation = lang === 'ar' ? 'المزيد' : 'more';
    
    let skillsHtml = '';
    if (tagsToDisplay.length > 0) {
        const skillTags = tagsToDisplay.map(skill => {
            let translatedSkill = skill;
            if (window.globalCategoriesAndProfessions) {
                for (const cat of window.globalCategoriesAndProfessions) {
                    const prof = cat.professions.find(p => p.en === skill);
                    if (prof) {
                        translatedSkill = (prof.ar && lang === 'ar') ? prof.ar : prof.en;
                        break;
                    }
                }
            }
            return `<span class="skill-tag">${translatedSkill}</span>`;
        });
        skillsHtml = skillTags.join('');
    }

    const moreSkillsHtml = remainingCount > 0
        ? `<span class="skill-tag skill-more">+${remainingCount} ${moreTranslation}</span>`
        : '';

    const skillsContainerHtml = skillsHtml || moreSkillsHtml 
        ? `<div class="talent-skills-minimal">${skillsHtml}${moreSkillsHtml}</div>` 
        : '';

    // Rating
    const rating = parseFloat(talent.rating) || 0;
    const ratingHtml = rating > 0 ? `
        <div class="talent-rating-badge"><i class="fas fa-star"></i> <span>${rating.toFixed(1)}</span></div>
    ` : '';

    const viewProfileTranslation = lang === 'ar' ? 'عرض الملف الشخصي' : 'View Profile';

    card.innerHTML = `
        <div class="talent-card-inner">
            <div class="talent-card-top">
                ${locationDisplay ? `
                <div class="talent-city-badge">
                    <i class="fas fa-map-marker-alt"></i> ${locationDisplay}
                </div>` : ''}
                <div class="talent-avatar-wrapper">
                    ${avatarContent}
                </div>
            </div>
            
            <div class="talent-card-content">
                <h3 class="talent-name">${firstName} ${talent.last_name || ''}</h3>
                ${primaryProfessionHtml}
                ${ratingHtml}
            </div>

            <div class="talent-card-footer">
                ${skillsContainerHtml}
                <a href="${talent.slug ? `/${talent.slug}` : `/profile.html?id=${talent.id}`}" class="view-profile-cta">
                    <span>${viewProfileTranslation}</span>
                    <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        </div>
    `;

    return card;
}

/**
 * Renders the homepage categories dynamically to ensure they link to talent.html
 */
function renderHomepageCategories() {
    if (!homepageCategoriesGrid) return;
    
    // We use the real categories from the global list if available, or fallback to a default list
    let categoriesToRender = [];
    
    if (talentCategories.length > 0) {
        categoriesToRender = talentCategories.slice(0, 6); // Take first 6
    } else {
        // Fallback categories
        categoriesToRender = [
            { id: 'programming', name: { ar: 'برمجة وتطوير', en: 'Programming & Tech' }, icon: 'fas fa-code' },
            { id: 'design', name: { ar: 'تصميم وجرافيك', en: 'Graphics & Design' }, icon: 'fas fa-paint-brush' },
            { id: 'marketing', name: { ar: 'تسويق إلكتروني', en: 'Digital Marketing' }, icon: 'fas fa-bullhorn' },
            { id: 'writing', name: { ar: 'كتابة وترجمة', en: 'Writing & Translation' }, icon: 'fas fa-language' },
            { id: 'video', name: { ar: 'فيديو وأنيميشن', en: 'Video & Animation' }, icon: 'fas fa-video' },
            { id: 'business', name: { ar: 'أعمال واستشارات', en: 'Business' }, icon: 'fas fa-chart-line' }
        ];
    }

    homepageCategoriesGrid.innerHTML = '';
    const lang = window.currentLanguage || 'ar';

    categoriesToRender.forEach(cat => {
        const catName = cat.name[lang] || cat.name['en'] || cat.name; // Handle both object and string
        // If it's a real category object from global list, it might not have an icon property directly, 
        // so we map some common ones or use a default
        let iconClass = cat.icon || 'fas fa-briefcase'; 
        
        // Simple mapping if using real data which might not have icons
        if (!cat.icon) {
            const lowerName = (cat.name['en'] || '').toLowerCase();
            if (lowerName.includes('program') || lowerName.includes('tech')) iconClass = 'fas fa-code';
            else if (lowerName.includes('design') || lowerName.includes('art')) iconClass = 'fas fa-paint-brush';
            else if (lowerName.includes('market')) iconClass = 'fas fa-bullhorn';
            else if (lowerName.includes('writ') || lowerName.includes('translat')) iconClass = 'fas fa-language';
            else if (lowerName.includes('video') || lowerName.includes('animat')) iconClass = 'fas fa-video';
            else if (lowerName.includes('busin')) iconClass = 'fas fa-chart-line';
        }

        // Link to talent.html with category filter
        // The talent page expects a JSON array string for 'category'
        const filterParam = JSON.stringify([cat.name.en || cat.name]); // Use English name for filter if possible

        const card = document.createElement('a');
        card.href = `/talent.html?category=${encodeURIComponent(filterParam)}`;
        card.className = 'category-card';
        card.innerHTML = `
            <div class="icon-box"><i class="${iconClass}"></i></div>
            <h3>${catName}</h3>
        `;
        homepageCategoriesGrid.appendChild(card);
    });
}

/**
 * Creates an HTML card element for a given talent (freelancer).
 */
function createTalentCard(talent) {
    const lang = window.currentLanguage || 'en';
    const t = window.translations;

    const card = document.createElement('a');
    card.href = talent.slug ? `/${talent.slug}` : `/profile.html?id=${talent.id}`;
    card.target = '_blank';
    card.className = 'talent-card';

    const firstName = talent.first_name || '';
    const lastName = talent.last_name || '';
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

    // Parse professions
    let interestedProfessionsArray = [];
    if (Array.isArray(talent.interested_professions)) {
        interestedProfessionsArray = talent.interested_professions;
    } else if (typeof talent.interested_professions === 'string') {
        try {
            interestedProfessionsArray = JSON.parse(talent.interested_professions);
            if (!Array.isArray(interestedProfessionsArray)) {
                interestedProfessionsArray = [interestedProfessionsArray];
            }
        } catch (e) {
            interestedProfessionsArray = talent.interested_professions.split(',').map(s => s.trim());
        }
    }

    // Main profession for header (first one)
    let mainProfession = (t && t['freelancer'] && t['freelancer'][lang]) || 'Professional';
    
    // All professions translated for the body
    let translatedProfessions = [];

    if (interestedProfessionsArray.length > 0) {
        // Ensure talentCategories is loaded
        if (talentCategories.length === 0 && typeof window.globalCategoriesAndProfessions !== 'undefined') {
            talentCategories = window.globalCategoriesAndProfessions;
        }

        interestedProfessionsArray.forEach((profEnName, index) => {
            let translatedName = profEnName;
            
            // Try to find in global categories
            if (talentCategories.length > 0) {
                for (let cat of talentCategories) {
                    const foundProf = cat.professions.find(p => p.en === profEnName);
                    if (foundProf) {
                        translatedName = foundProf[lang] || foundProf.en;
                        break;
                    }
                }
            } else if (t && t[profEnName]) {
                translatedName = t[profEnName][lang] || profEnName;
            }

            translatedProfessions.push(translatedName);
            
            if (index === 0) {
                mainProfession = translatedName; // Set first one as main
            }
        });
    }

    let avatarHtml = '';
    if (talent.profile_picture_url) {
        avatarHtml = `<img src="${talent.profile_picture_url}" onerror="this.onerror=null; this.src='${getPlaceholderUrl(initials, 60, 60)}';" alt="${firstName} ${lastName}">`;
    } else {
        avatarHtml = `<div class="avatar-placeholder">${initials}</div>`;
    }

    // Professions Tags HTML
    let professionsHtml = '';
    if (translatedProfessions.length > 0) {
        const displayProfs = translatedProfessions.slice(0, 2); // Show up to 2
        professionsHtml = `<div class="talent-professions">` + 
            displayProfs.map(p => `<span class="talent-prof-tag">${p}</span>`).join('') +
            (translatedProfessions.length > 2 ? `<span class="talent-prof-tag">+${translatedProfessions.length - 2}</span>` : '') +
            `</div>`;
    }

    // City Translation
    let cityDisplay = talent.city || 'غير محدد';
    if (window.citiesTranslations && window.citiesTranslations[talent.city]) {
        cityDisplay = window.citiesTranslations[talent.city][lang] || talent.city;
    } else if (t && t[talent.city]) {
        cityDisplay = t[talent.city][lang] || talent.city;
    }

    // Button translation
    const viewProfileText = (t && t['view_profile'] && t['view_profile'][lang]) || (lang === 'ar' ? 'عرض الملف' : 'View Profile');

    card.innerHTML = `
        <div class="talent-card-header">
            <div class="card-avatar">
                ${avatarHtml}
            </div>
            <div class="card-info">
                <h3 class="name">${firstName} ${lastName}</h3>
                <p class="profession">${mainProfession}</p>
            </div>
        </div>
        <div class="talent-card-body">
            <div class="talent-meta-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>${cityDisplay}</span>
            </div>
            ${professionsHtml}
        </div>
        <div class="talent-card-footer" style="justify-content: center; width: 100%;">
            <span class="btn btn-outline" style="width: 100%; padding: 0.5rem; font-size: 0.9rem;">${viewProfileText}</span>
        </div>
    `;
    return card;
}

/**
 * Creates a Marquee Logo item for a company
 */
function createCompanyLogoItem(company) {
    const item = document.createElement('a');
    const slug = company.slug;
    item.href = slug ? `/${slug}` : `/employer_profile.html?id=${company.user_id}`;
    item.target = '_blank';
    item.className = 'marquee-logo-item';
    
    let logoContent = '';
    if (company.company_logo_path) {
        logoContent = `<div class="marquee-logo-box"><img src="${company.company_logo_path}" alt="${company.company_name}" loading="lazy"></div>`;
    } else {
        logoContent = `<div class="marquee-logo-placeholder"><i class="fa-solid fa-building"></i></div>`;
    }

    item.innerHTML = `
        ${logoContent}
        <span class="marquee-company-name">${company.company_name}</span>
    `;
    
    return item;
}

/**
 * Fetches and displays featured talents.
 */
async function fetchFeaturedTalents() {
    if (!featuredTalentsGrid) return;
    
    featuredTalentsGrid.innerHTML = createLoadingSpinner();
    
    try {
        const response = await fetch('/api/talents/featured');
        const data = await response.json();

        featuredTalentsGrid.innerHTML = ''; // Clear spinner

        if (data && data.talents && data.talents.length > 0) {
            data.talents.forEach(talent => {
                featuredTalentsGrid.appendChild(createTalentCard(talent));
            });
            if(noFeaturedTalentsMessage) noFeaturedTalentsMessage.style.display = 'none';
        } else {
            if(noFeaturedTalentsMessage) noFeaturedTalentsMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching talents:', error);
        featuredTalentsGrid.innerHTML = '';
        if(noFeaturedTalentsMessage) noFeaturedTalentsMessage.style.display = 'block';
    }
}

/**
 * Fetches and displays featured companies for marquee.
 */
async function fetchFeaturedCompanies() {
    if (!featuredCompaniesGrid) return;
    
    // If already populated, don't re-render
    if (featuredCompaniesGrid.children.length > 0) return;

    try {
        const response = await fetch('/api/companies/featured');
        const data = await response.json();

        let validCompanies = [];
        if (data && data.companies && data.companies.length > 0) {
            validCompanies = data.companies.filter(c => c.company_name && c.company_name.trim() !== '' && c.company_name.toLowerCase() !== 'hirly');
        }

        const trustedSection = document.querySelector('.trusted-section');
        
        // If no valid companies from API, hide the entire section
        if (validCompanies.length === 0) {
            if (trustedSection) trustedSection.style.display = 'none';
            return;
        }
            
        if (trustedSection) trustedSection.style.display = 'block';
        renderMarquee(validCompanies);
    } catch (error) {
        console.error('Error fetching companies:', error);
        // Hide section on error if empty
        const trustedSection = document.querySelector('.trusted-section');
        if (trustedSection) trustedSection.style.display = 'none';
    }
}

/**
 * Helper to render the marquee items with seamless looping
 */
function renderMarquee(companies) {
    featuredCompaniesGrid.innerHTML = '';
    
    // Ensure loop is seamless by making the array large enough to fill wide screens
    let itemsToRender = [...companies];
    while(itemsToRender.length < 12) {
        itemsToRender = itemsToRender.concat(companies);
    }

    // Double the items for a seamless 50% scroll loop
    const fullSet = [...itemsToRender, ...itemsToRender];
    
    const fragment = document.createDocumentFragment();
    fullSet.forEach(company => {
        fragment.appendChild(createCompanyLogoItem(company));
    });
    featuredCompaniesGrid.appendChild(fragment);
}

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    const initializeHomepageContentOnce = () => {
        if ((window.location.pathname === '/' || window.location.pathname === '/index.html') && !window._homepageContentLoaded) {
            window.loadHomepageContent();
            window._homepageContentLoaded = true;
        }
    };

    window.addEventListener('translationsApplied', initializeHomepageContentOnce);

    if (window.currentLanguage) {
        initializeHomepageContentOnce();
    }
});
