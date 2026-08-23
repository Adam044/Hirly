// Jobs page logic for the new UI
document.addEventListener('DOMContentLoaded', function() {
    // --- DOM Elements ---
    const applyFiltersBtn = document.getElementById('applyFilters');
    const jobList = document.getElementById('jobList');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const searchInput = document.getElementById('search');
    const countrySelect = document.getElementById('country');
    const locationSelect = document.getElementById('location');
    const locationFilterGroup = document.getElementById('locationFilterGroup');
    const jobSiteTypeFilter = document.getElementById('jobSiteTypeFilter');
    const jobTypeDropdown = document.getElementById('jobTypeDropdown');
    const jobTypeDropdownTrigger = document.getElementById('jobTypeDropdownTrigger');
    const jobTypeDropdownMenu = document.getElementById('jobTypeDropdownMenu');
    const budgetSelect = document.getElementById('budget');
    const clearFiltersBtn = document.getElementById('clearFilters');

    // Category dropdown elements
    const categoryDropdown = document.getElementById('categoryDropdown');
    const categoryDropdownTrigger = document.getElementById('categoryDropdownTrigger');
    const categoryDropdownMenu = document.getElementById('categoryDropdownMenu');

    // Professions dropdown elements
    const professionDropdown = document.getElementById('professionDropdown');
    const professionDropdownTrigger = document.getElementById('professionDropdownTrigger');
    const professionDropdownMenu = document.getElementById('professionDropdownMenu');


    // Quick filter elements
    let quickFiltersGridDesktop = document.getElementById('quickFiltersGridDesktop');
    let quickFiltersGridMobile = document.getElementById('quickFiltersGridMobile');
    const advancedCategoryCheckboxes = document.getElementById('advancedCategoryCheckboxes'); // This is for the mobile modal's category checkboxes

    // Mobile filter modal elements
    const mobileFiltersModal = document.getElementById('mobileFiltersModal');
    const mobileFilterToggle = document.getElementById('mobileFilterToggle');
    const mobileModalCloseBtn = document.getElementById('mobileModalCloseBtn');
    const mobileApplyFiltersBtn = document.getElementById('mobileApplyFiltersBtn');
    const mobileResetFiltersBtn = document.getElementById('mobileResetFiltersBtn');

    // Mobile filter controls
    const jobSiteTypeFilterMobile = document.getElementById('jobSiteTypeFilterMobile');
    const jobTypeDropdownMobile = document.getElementById('jobTypeDropdownMobile');
    const jobTypeDropdownTriggerMobile = document.getElementById('jobTypeDropdownTriggerMobile');
    const jobTypeDropdownMenuMobile = document.getElementById('jobTypeDropdownMenuMobile');
    const countrySelectMobile = document.getElementById('countryMobile');
    const locationSelectMobile = document.getElementById('locationMobile');
    const locationFilterGroupMobile = document.getElementById('locationFilterGroupMobile');
    const budgetSelectMobile = document.getElementById('budgetMobile');

    // Mobile category dropdown elements
    const categoryDropdownMobile = document.getElementById('categoryDropdownMobile');
    const categoryDropdownTriggerMobile = document.getElementById('categoryDropdownTriggerMobile');
    const categoryDropdownMenuMobile = document.getElementById('categoryDropdownMenuMobile');

    // Mobile professions dropdown elements
    const professionDropdownMobile = document.getElementById('professionDropdownMobile');
    const professionDropdownTriggerMobile = document.getElementById('professionDropdownTriggerMobile');
    const professionDropdownMenuMobile = document.getElementById('professionDropdownMenuMobile');
    const jobsPerPage = 10;
    let currentPage = 1; // Start at page 1
    let allJobsData = []; // This will now hold the filtered data from the server
    let currentlyDisplayedJobs = []; // This will be a copy of allJobsData for pagination
    let categoryCounts = {};
    let lastGlobalCategoryCounts = {}; // NEW: Store counts when no category filter is applied
    let selectedCategories = []; // For quick filters and advanced categories
    let selectedProfessions = []; // NEW: For selected professions
    let selectedJobTypes = []; // NEW: For selected job types


    // Palestinian cities data from the global translation object
    let palestinianCities = [];
    if (window.palestinianCitiesTranslations) {
        palestinianCities = Object.keys(window.palestinianCitiesTranslations).map(key => {
            const cityData = window.palestinianCitiesTranslations[key];
            return {
                key: key, // Store the key (e.g., 'city_nablus')
                en: cityData.en,
                ar: cityData.ar
            };
        }).sort((a, b) => {
            // Sort by the translated name in the current language
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
        ].map(city => ({en: city, ar: city})).sort((a, b) => a.en.localeCompare(b.en));
    }


    // Use window.globalCategoriesAndProfessions from categories-professions-translations.js
    let talentCategories = [];
    let ALL_JOB_CATEGORIES = [];
    let ALL_JOB_PROFESSIONS = [];
    if (window.globalCategoriesAndProfessions) {
        talentCategories = window.globalCategoriesAndProfessions.map(cat => ({
            name: cat.name,
            icon: cat.icon,
            professions: cat.professions.map(p => ({ en: p.en, ar: p.ar })) // Store full profession objects
        }));
        ALL_JOB_CATEGORIES = talentCategories.map(cat => cat.name.en).sort();
        ALL_JOB_PROFESSIONS = talentCategories.flatMap(cat => cat.professions.map(p => p.en)).sort();
    } else {
        console.error("window.globalCategoriesAndProfessions is not defined. Ensure categories-professions-translations.js is loaded correctly.");
    }


    const ALL_JOB_TYPES = [
        "Full-time",
        "Part-time",
        "Contract",
        "Freelance"
    ];

    // --- Helper Functions ---

    // Unified normalization for translation keys
    function getTranslationKey(type, value) {
        if (!value || value.toLowerCase() === 'other') return `${type}_other`;
        
        const normalized = value.toLowerCase()
            .replace(/'/g, '') // Remove apostrophes (e.g., Na'im -> naim)
            .replace(/[^a-z0-9]/g, '_') // Replace non-alphanumeric with underscore
            .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
            
        return `${type}_${normalized}`;
    }

    // Helper to update active state of dropdown triggers
    function updateDropdownActiveState(triggerId, menuId) {
        const trigger = document.getElementById(triggerId);
        const menu = document.getElementById(menuId);
        if (!trigger || !menu) return;

        const checkboxes = menu.querySelectorAll('input[type="checkbox"]');
        const hasSelection = Array.from(checkboxes).some(cb => cb.checked);
        
        if (hasSelection) {
            trigger.classList.add('has-selection');
        } else {
            trigger.classList.remove('has-selection');
        }
    }

    // Attach listeners to dropdown menus to update active state
    ['categoryDropdownMenu', 'professionDropdownMenu', 'jobTypeDropdownMenu', 
     'categoryDropdownMenuMobile', 'professionDropdownMenuMobile', 'jobTypeDropdownMenuMobile'].forEach(menuId => {
        const menu = document.getElementById(menuId);
        if (menu) {
            menu.addEventListener('change', () => {
                const triggerId = menuId.replace('Menu', 'Trigger');
                updateDropdownActiveState(triggerId, menuId);
                
                // If it's a mobile menu, also update the desktop counterpart and vice versa
                const counterpartMenuId = menuId.includes('Mobile') ? menuId.replace('Mobile', '') : menuId + 'Mobile';
                const counterpartTriggerId = counterpartMenuId.replace('Menu', 'Trigger');
                updateDropdownActiveState(counterpartTriggerId, counterpartMenuId);
            });
        }
    });
    // Populate country dropdown dynamically from cities-translations.js
    function populateCountryDropdown(selectElement, jobs, selectedValue = null) {
        if (!selectElement) return;

        const lang = window.currentLanguage || 'en';
        const t = window.translations;
        const cityTranslations = window.palestinianCitiesTranslations || {};

        // Get unique countries from translation file
        const countries = Object.keys(cityTranslations)
            .filter(key => key.startsWith('country_'))
            .sort((a, b) => {
                if (a === 'country_palestine') return -1;
                if (b === 'country_palestine') return 1;
                if (a === 'country_other') return 1;
                if (b === 'country_other') return -1;
                const nameA = cityTranslations[a][lang] || cityTranslations[a].en;
                const nameB = cityTranslations[b][lang] || cityTranslations[b].en;
                return nameA.localeCompare(nameB);
            });

        const fragment = document.createDocumentFragment();
        
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = t?.['all_countries']?.[lang] || 'All Countries';
        fragment.appendChild(defaultOption);

        countries.forEach(countryKey => {
            const countryEn = cityTranslations[countryKey].en;
            const translatedName = cityTranslations[countryKey][lang] || countryEn;
            
            // Calculate count from current jobs
            const countryCount = jobs.filter(j => j.country === countryEn).length;
            
            if (countryCount > 0 || countryEn === 'Other') {
                const option = document.createElement('option');
                option.value = countryEn; // Use English name for DB compatibility
                option.textContent = `${translatedName} (${countryCount})`;
                
                if (countryEn === selectedValue) {
                    option.selected = true;
                }
                fragment.appendChild(option);
            }
        });

        selectElement.innerHTML = '';
        selectElement.appendChild(fragment);
    }

    // Update city dropdown based on selected country from cities-translations.js
    function updateCityDropdown(selectElement, jobs, selectedCountry = '', selectedValue = null) {
        if (!selectElement) return;

        const lang = window.currentLanguage || 'en';
        const t = window.translations;
        const cityTranslations = window.palestinianCitiesTranslations || {};

        const fragment = document.createDocumentFragment();

        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = t?.['all_cities']?.[lang] || 'All Cities';
        fragment.appendChild(defaultOption);

        // Find the country key corresponding to the English name
        const countryKey = selectedCountry ? Object.keys(cityTranslations).find(key => 
            key.startsWith('country_') && cityTranslations[key].en === selectedCountry
        ) : null;

        // Get all predefined cities for this country (excluding 'city_other')
        let predefinedCities = Object.keys(cityTranslations).filter(key => 
            key.startsWith('city_') && key !== 'city_other'
        );

        if (countryKey) {
            predefinedCities = predefinedCities.filter(key => cityTranslations[key].country === countryKey);
        }

        const predefinedCityEnNames = predefinedCities.map(key => cityTranslations[key].en);

        // Calculate counts and filter cities with jobs
        const jobsForCountry = selectedCountry ? jobs.filter(j => j.country === selectedCountry) : jobs;
        
        let cityOptions = [];

        // 1. Regular cities
        predefinedCities.forEach(cityKey => {
            const cityEn = cityTranslations[cityKey].en;
            const count = jobsForCountry.filter(j => j.city === cityEn).length;
            if (count > 0) {
                cityOptions.push({
                    key: cityKey,
                    en: cityEn,
                    translatedName: cityTranslations[cityKey][lang] || cityEn,
                    count: count,
                    isOther: false
                });
            }
        });

        // 2. Sort regular cities by count descending
        cityOptions.sort((a, b) => b.count - a.count);

        // 3. "Other" city logic
        // Count jobs that have this country but a city NOT in our predefined list for this country
        const otherCount = jobsForCountry.filter(j => !predefinedCityEnNames.includes(j.city)).length;
        
        if (otherCount > 0) {
            const otherKey = 'city_other';
            cityOptions.push({
                key: otherKey,
                en: 'Other',
                translatedName: cityTranslations[otherKey]?.[lang] || 'Other',
                count: otherCount,
                isOther: true
            });
        }

        // Populate the dropdown
        cityOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.en;
            option.textContent = `${opt.translatedName} (${opt.count})`;
            
            if (opt.en === selectedValue) {
                option.selected = true;
            }
            fragment.appendChild(option);
        });

        selectElement.innerHTML = '';
        selectElement.appendChild(fragment);
    }

    // Populate city dropdown (original one, will be used as fallback)
    function populateCityDropdown(selectElement, options, selectedValue = null) {
        if (!selectElement || !window.currentLanguage) return;

        selectElement.innerHTML = '';
        let defaultOptionTextKey = "all_cities";
        let defaultOptionValue = "";

        const defaultOption = document.createElement('option');
        defaultOption.value = defaultOptionValue;
        defaultOption.textContent = window.translations?.[defaultOptionTextKey]?.[window.currentLanguage] || defaultOptionTextKey;
        defaultOption.selected = true;
        selectElement.appendChild(defaultOption);

        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.en;
            optionElement.textContent = option[window.currentLanguage] || option.en;
            if (option.en === selectedValue) {
                optionElement.selected = true;
            }
            selectElement.appendChild(optionElement);
        });
    }

    // Use global timeAgo function from language.js
    const timeAgo = window.timeAgo;

    function getCurrencySymbol(currencyCode) {
        switch (currencyCode) {
            case 'USD': return '$';
            case 'ILS': return '₪';
            case 'JOD': return 'JD';
            case 'EUR': return '€';
            default: return '';
        }
    }

    // getEmployerAvatarHtml handles avatar/logo display logic
    function getEmployerAvatarHtml(job) {
        const t = window.translations || {};
        const lang = window.currentLanguage || 'en';
        let employerDisplayName = job.display_employer_name || t?.['not_available']?.[lang] || 'N/A';
        const employerLogo = job.display_employer_logo;
        const employerType = job.display_employer_type || 'individual';
        
        // Hide name if it indicates hidden identity
        const hiddenIdentities = [
            'هوية صاحب العمل مخفية',
            'Employer identity hidden',
            'Confidential',
            'Hidden Identity'
        ];
        
        if (hiddenIdentities.includes(employerDisplayName)) {
            employerDisplayName = '';
        }

        let avatarHtml = '';
        if (employerLogo) {
            const safeName = employerDisplayName.replace(/"/g, '&quot;');
            const thumbUrl = typeof ImageOptimizer !== 'undefined' 
                ? ImageOptimizer.getOptimizedUrl(employerLogo, 'thumb')
                : employerLogo;
            
            avatarHtml = `<img src="${thumbUrl}" loading="lazy" width="60" height="60" onerror="this.onerror=null; this.src='${employerLogo}'; this.onerror=function(){this.outerHTML='<i class=&quot;fas fa-briefcase fallback-job-icon&quot;></i>'};" alt="${safeName} Logo">`;
        } else {
            avatarHtml = `<i class="fas fa-briefcase fallback-job-icon"></i>`;
        }

        let avatarContainerClass = `job-card-avatar-container ${employerType} ${job.is_external ? 'external' : ''}`;
        return { avatarHtml, avatarContainerClass, employerDisplayName };
    }


    // Populate quick filter category buttons
    function populateQuickFilters() {
        const lang = window.currentLanguage || 'en';
        const t = window.translations;

        if (quickFiltersGridDesktop) {
            const oldQuickFiltersGridDesktop = quickFiltersGridDesktop;
            quickFiltersGridDesktop = oldQuickFiltersGridDesktop.cloneNode(false);
            oldQuickFiltersGridDesktop.parentNode.replaceChild(quickFiltersGridDesktop, oldQuickFiltersGridDesktop);
        }
        if (quickFiltersGridMobile) {
            const oldQuickFiltersGridMobile = quickFiltersGridMobile;
            quickFiltersGridMobile = oldQuickFiltersGridMobile.cloneNode(false);
            oldQuickFiltersGridMobile.parentNode.replaceChild(quickFiltersGridMobile, oldQuickFiltersGridMobile);
        }


        let categoriesWithCounts = ALL_JOB_CATEGORIES.map(categoryNameEn => {
            const categoryData = talentCategories.find(c => c.name.en === categoryNameEn);
            // Get the count from the global categoryCounts object
            const jobCount = categoryCounts[categoryNameEn] || 0; 
            return {
                nameEn: categoryNameEn,
                data: categoryData,
                count: jobCount
            };
        });

        categoriesWithCounts.sort((a, b) => b.count - a.count);

        if (quickFiltersGridDesktop) {
            categoriesWithCounts.forEach(({ nameEn, data, count }) => {
                const iconHtml = data && data.icon ? `<i class="${data.icon}"></i> ` : '';
                const translatedCategoryName = data ? (data.name[lang] || data.name.en) : nameEn;

                const button = document.createElement('button');
                button.className = 'quick-filter-card';
                button.dataset.category = nameEn;
                button.innerHTML = `
                    ${iconHtml}
                    <span>${translatedCategoryName}</span>
                    <span class="category-count">${count}</span>
                `;

                if (selectedCategories.includes(nameEn)) {
                    button.classList.add('active');
                }

                quickFiltersGridDesktop.appendChild(button);
            });
        }

        if (quickFiltersGridMobile) {
            categoriesWithCounts.forEach(({ nameEn, data, count }) => { // Use the already sorted categoriesWithCounts
                const iconHtml = data && data.icon ? `<i class="${data.icon}"></i> ` : '';
                const translatedCategoryName = data ? (data.name[lang] || data.name.en) : nameEn;

                const button = document.createElement('button');
                button.className = 'quick-filter-card';
                button.dataset.category = nameEn;
                button.innerHTML = `
                    ${iconHtml}
                    <span>${translatedCategoryName}</span>
                    <span class="category-count">${count}</span>
                `;

                if (selectedCategories.includes(nameEn)) {
                    button.classList.add('active');
                }

                quickFiltersGridMobile.appendChild(button);
            });
        }

        const handleQuickFilterClick = (event) => {
            const clickedCard = event.target.closest('.quick-filter-card');
            if (clickedCard) {
                const categoryName = clickedCard.dataset.category;
                const isAlreadyActive = selectedCategories.includes(categoryName);

                // Simple toggle behavior for all devices
                if (isAlreadyActive) {
                    selectedCategories = selectedCategories.filter(cat => cat !== categoryName);
                } else {
                    selectedCategories.push(categoryName);
                }

                updateQuickFilterUI();
                updateCategoryDropdownCheckboxes();
                updateCategoryDropdownTriggerText();
                populateProfessionCheckboxes(professionDropdownMenu);
                if (window.innerWidth <= 992) populateProfessionCheckboxes(professionDropdownMenuMobile, true);
                
                applyFiltersAndSearch();
            }
        };

        if (quickFiltersGridDesktop) {
            quickFiltersGridDesktop.addEventListener('click', handleQuickFilterClick);
        }
        if (quickFiltersGridMobile) {
            quickFiltersGridMobile.addEventListener('click', handleQuickFilterClick);
        }
    }

    // NEW: Sync checkboxes with selectedCategories
    function updateCategoryDropdownCheckboxes() {
        const menus = [categoryDropdownMenu, categoryDropdownMenuMobile];
        menus.forEach(menu => {
            if (menu) {
                const checkboxes = menu.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach(cb => {
                    if (cb.value !== '') {
                        cb.checked = selectedCategories.includes(cb.value);
                    } else {
                        // All categories checkbox
                        cb.checked = selectedCategories.length === 0;
                    }
                });
            }
        });
    }

    function updateQuickFilterUI() {
        // Update desktop quick filters
        const desktopButtons = quickFiltersGridDesktop ? quickFiltersGridDesktop.querySelectorAll('.quick-filter-card') : [];
        desktopButtons.forEach(btn => {
            if (selectedCategories.includes(btn.dataset.category)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update mobile quick filters
        const mobileButtons = quickFiltersGridMobile ? quickFiltersGridMobile.querySelectorAll('.quick-filter-card') : [];
        mobileButtons.forEach(btn => {
            if (selectedCategories.includes(btn.dataset.category)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Sync advanced category checkboxes with selectedCategories
        if (advancedCategoryCheckboxes) {
            advancedCategoryCheckboxes.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = selectedCategories.includes(checkbox.value);
            });
        }
    }

    // Populate category checkboxes (desktop and mobile)
    function populateCategoryCheckboxes(container, isMobile = false) {
        if (!container) return;
        const lang = window.currentLanguage || 'en';
        const t = window.translations;

        const categoriesWithCounts = talentCategories.map(category => ({
            ...category,
            count: categoryCounts[category.name.en] || 0
        })).sort((a, b) => b.count - a.count); // Sort by count, highest first

        const fragment = document.createDocumentFragment();

        const allCategoriesCheckboxId = `cat-all-${container.id}`;
        const allCategoriesCheckboxContainer = document.createElement('div');
        allCategoriesCheckboxContainer.className = 'checkbox-item';
        allCategoriesCheckboxContainer.innerHTML = `
            <input type="checkbox" id="${allCategoriesCheckboxId}" value="" ${selectedCategories.length === 0 ? 'checked' : ''}>
            <label for="${allCategoriesCheckboxId}"><i class="fas fa-layer-group category-icon"></i> ${t['all_categories'][lang] || 'Category'}</label>
        `;
        fragment.appendChild(allCategoriesCheckboxContainer);
        allCategoriesCheckboxContainer.querySelector('input').addEventListener('change', (event) => {
            if (event.target.checked) {
                selectedCategories = [];
                container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    if (cb.id !== allCategoriesCheckboxId) cb.checked = false;
                });
            }
            updateCategoryDropdownTriggerText(isMobile);
            updateQuickFilterUI(); // NEW: Update quick filters
            populateProfessionCheckboxes(professionDropdownMenu);
            if (isMobile) populateProfessionCheckboxes(professionDropdownMenuMobile, true);
            
            if (!isMobile) {
                applyFiltersAndSearch();
            }
        });


        categoriesWithCounts.forEach(category => {
            const categoryNameEn = category.name.en;
            const jobCount = category.count;
            const checkboxId = `cat-${categoryNameEn.replace(/[^a-zA-Z0-9]/g, '-')}-${container.id}`;
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'checkbox-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = checkboxId;
            checkbox.name = 'category';
            checkbox.value = categoryNameEn;
            checkbox.checked = selectedCategories.includes(categoryNameEn);

            const label = document.createElement('label');
            label.htmlFor = checkboxId;
            label.innerHTML = `<i class="${category.icon} category-icon"></i> <span>${category.name[lang] || category.name.en} <span class="category-count-sidebar">(${jobCount})</span></span>`;

            checkboxContainer.appendChild(checkbox);
            checkboxContainer.appendChild(label);
            fragment.appendChild(checkboxContainer);

            checkbox.addEventListener('change', (event) => {
                const allCheckbox = container.querySelector(`#${allCategoriesCheckboxId}`);
                if (event.target.checked) {
                    if (!selectedCategories.includes(categoryNameEn)) {
                        selectedCategories.push(categoryNameEn);
                    }
                    if (allCheckbox) allCheckbox.checked = false;
                } else {
                    selectedCategories = selectedCategories.filter(cat => cat !== categoryNameEn);
                    if (selectedCategories.length === 0 && allCheckbox) {
                        allCheckbox.checked = true;
                    }
                }
                updateCategoryDropdownTriggerText(isMobile);
                updateQuickFilterUI(); // NEW: Update quick filters
                populateProfessionCheckboxes(professionDropdownMenu);
                if (isMobile) populateProfessionCheckboxes(professionDropdownMenuMobile, true);
                
                if (!isMobile) {
                    applyFiltersAndSearch();
                }
            });
        });

        container.innerHTML = '';
        container.appendChild(fragment);
        updateCategoryDropdownTriggerText(isMobile);
    }

    // NEW: Function to update Category Dropdown Trigger Text
    function updateCategoryDropdownTriggerText(isMobile = false) {
        const trigger = isMobile ? categoryDropdownTriggerMobile : categoryDropdownTrigger;
        const menu = isMobile ? categoryDropdownMenuMobile : categoryDropdownMenu;
        if (!trigger || !menu) return;

        const labelSpan = trigger.querySelector('.trigger-label');
        if (!labelSpan) return;

        const selectedCheckboxes = Array.from(menu.querySelectorAll('input[type="checkbox"]:checked')).filter(cb => cb.value !== '');
        const selectedCategoryNames = selectedCheckboxes.map(checkbox => {
            const categoryData = talentCategories.find(c => c.name.en === checkbox.value);
            return categoryData ? (categoryData.name[window.currentLanguage] || categoryData.name.en) : checkbox.value;
        });
        const t = window.translations;
        const lang = window.currentLanguage || 'en';

        if (selectedCategoryNames.length === 0 || selectedCategoryNames.length === ALL_JOB_CATEGORIES.length) {
            labelSpan.textContent = t['all_categories'][lang] || 'Category';
        } else {
            labelSpan.textContent = selectedCategoryNames.join(', ');
        }
    }

    // Populate profession checkboxes
    function populateProfessionCheckboxes(container, isMobile = false) {
        if (!container) return;
        
        const lang = window.currentLanguage || 'en';
        const t = window.translations;

        let professionsToDisplay = [];
        if (selectedCategories.length > 0) {
            selectedCategories.forEach(catNameEn => {
                const category = talentCategories.find(c => c.name.en === catNameEn);
                if (category) {
                    professionsToDisplay = professionsToDisplay.concat(category.professions.map(p => p.en));
                }
            });
            professionsToDisplay = [...new Set(professionsToDisplay)].sort();
        } else {
            professionsToDisplay = [...ALL_JOB_PROFESSIONS];
        }

        const fragment = document.createDocumentFragment();

        const allProfessionsCheckboxId = `prof-all-${container.id}`;
        const allProfessionsCheckboxContainer = document.createElement('div');
        allProfessionsCheckboxContainer.className = 'checkbox-item';
        allProfessionsCheckboxContainer.innerHTML = `
            <input type="checkbox" id="${allProfessionsCheckboxId}" value="" ${selectedProfessions.length === 0 ? 'checked' : ''}>
            <label for="${allProfessionsCheckboxId}"><i class="fas fa-user-tie category-icon"></i> ${t['all_professions'][lang] || 'Profession'}</label>
        `;
        fragment.appendChild(allProfessionsCheckboxContainer);
        allProfessionsCheckboxContainer.querySelector('input').addEventListener('change', (event) => {
            if (event.target.checked) {
                selectedProfessions = [];
                container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    if (cb.id !== allProfessionsCheckboxId) cb.checked = false;
                });
            }
            updateProfessionDropdownTriggerText(isMobile);
            if (!isMobile) {
                applyFiltersAndSearch();
            }
        });

        professionsToDisplay.forEach(professionEnName => {
            const professionData = talentCategories.flatMap(cat => cat.professions).find(p => p.en === professionEnName);
            const checkboxId = `prof-${professionEnName.replace(/[^a-zA-Z0-9]/g, '-')}-${container.id}`;
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'checkbox-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = checkboxId;
            checkbox.name = 'profession';
            checkbox.value = professionEnName;
            checkbox.checked = selectedProfessions.includes(professionEnName);

            const label = document.createElement('label');
            label.htmlFor = checkboxId;
            const translatedProfessionName = professionData ? (professionData[lang] || professionData.en) : professionEnName;
            label.innerHTML = `<i class="${professionData ? professionData.icon : 'fas fa-user-tie'} category-icon"></i> <span>${translatedProfessionName}</span>`;

            checkboxContainer.appendChild(checkbox);
            checkboxContainer.appendChild(label);
            fragment.appendChild(checkboxContainer);

            checkbox.addEventListener('change', (event) => {
                const allCheckbox = container.querySelector(`#${allProfessionsCheckboxId}`);
                if (event.target.checked) {
                    if (!selectedProfessions.includes(professionEnName)) {
                        selectedProfessions.push(professionEnName);
                    }
                    if (allCheckbox) allCheckbox.checked = false;
                } else {
                    selectedProfessions = selectedProfessions.filter(prof => prof !== professionEnName);
                    if (selectedProfessions.length === 0 && allCheckbox) {
                        allCheckbox.checked = true;
                    }
                }
                updateProfessionDropdownTriggerText(isMobile);
                if (!isMobile) {
                    applyFiltersAndSearch();
                }
            });
        });

        container.innerHTML = '';
        container.appendChild(fragment);
        updateProfessionDropdownTriggerText(isMobile);
    }

    // Update profession dropdown trigger text
    function updateProfessionDropdownTriggerText(isMobile = false) {
        const trigger = isMobile ? professionDropdownTriggerMobile : professionDropdownTrigger;
        const menu = isMobile ? professionDropdownMenuMobile : professionDropdownMenu;
        if (!trigger || !menu) return;

        const labelSpan = trigger.querySelector('.trigger-label');
        if (!labelSpan) return;

        const selectedCheckboxes = Array.from(menu.querySelectorAll('input[type="checkbox"]:checked')).filter(cb => cb.value !== '');
        const selectedProfessionNames = selectedCheckboxes.map(checkbox => {
            const professionData = talentCategories.flatMap(cat => cat.professions).find(p => p.en === checkbox.value);
            return professionData ? (professionData[window.currentLanguage] || professionData.en) : checkbox.value;
        });
        const t = window.translations;
        const lang = window.currentLanguage || 'en';

        if (selectedProfessionNames.length === 0 || selectedProfessionNames.length === ALL_JOB_PROFESSIONS.length) {
            labelSpan.textContent = t['all_professions'][lang] || 'Profession';
        } else {
            labelSpan.textContent = selectedProfessionNames.join(', ');
        }
    }


    function populateJobTypeCheckboxes(container) {
        if (!container) {
            return;
        }
        container.innerHTML = '';
        const lang = window.currentLanguage || 'en';
        const t = window.translations;
        ALL_JOB_TYPES.forEach(jobType => {
            const checkboxId = `job-type-${jobType.replace(/[^a-zA-Z0-9]/g, '-')}-${container.id}`;
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'checkbox-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = checkboxId;
            checkbox.name = 'jobType';
            checkbox.value = jobType;
            checkbox.checked = selectedJobTypes.includes(jobType);

            const label = document.createElement('label');
            label.htmlFor = checkboxId;
            const jobTypeKey = jobType.toLowerCase().replace(/[\s&()]/g, '_').replace(/[^a-z0-9_]/g, '');
            label.innerHTML = `<span data-lang-key="${jobTypeKey}">${t[jobTypeKey] ? t[jobTypeKey][lang] : jobType}</span>`;

            checkboxContainer.appendChild(checkbox);
            checkboxContainer.appendChild(label);
            container.appendChild(checkboxContainer);

            checkbox.addEventListener('change', (event) => {
                if (event.target.checked) {
                    if (!selectedJobTypes.includes(jobType)) {
                        selectedJobTypes.push(jobType);
                    }
                } else {
                    selectedJobTypes = selectedJobTypes.filter(type => type !== jobType);
                }
                
                // Sync mobile and desktop checkboxes
                const otherMenuId = container.id.includes('Mobile') ? container.id.replace('Mobile', '') : container.id + 'Mobile';
                const otherMenu = document.getElementById(otherMenuId);
                if (otherMenu) {
                    const otherCheckbox = Array.from(otherMenu.querySelectorAll('input[type="checkbox"]')).find(cb => cb.value === jobType);
                    if (otherCheckbox) otherCheckbox.checked = event.target.checked;
                }

                updateJobTypeDropdownTriggerText();
                if (!container.id.includes('Mobile')) {
                    applyFiltersAndSearch();
                }
            });
        });
        updateJobTypeDropdownTriggerText();
    }

    function updateJobTypeDropdownTriggerText() {
        const dropdowns = [jobTypeDropdownMenu, jobTypeDropdownMenuMobile];
        dropdowns.forEach(menu => {
            if (!menu) return;
            const trigger = menu.id.includes('Mobile') ? jobTypeDropdownTriggerMobile : jobTypeDropdownTrigger;
            if (!trigger) return;

            const labelSpan = trigger.querySelector('.trigger-label');
            if (!labelSpan) return;

            const selectedCheckboxes = Array.from(menu.querySelectorAll('input[type="checkbox"]:checked'));
            const selectedJobTypes = selectedCheckboxes.map(checkbox => checkbox.value);
            const t = window.translations;
            const lang = window.currentLanguage || 'en';

            if (selectedJobTypes.length === 0) {
                labelSpan.textContent = t['job_type_label'][lang] || 'Job Type';
            } else if (selectedJobTypes.length === ALL_JOB_TYPES.length) {
                labelSpan.textContent = t['job_type_label'][lang] || 'Job Type';
            } else {
                const translatedSelectedTypes = selectedJobTypes.map(type => {
                    const typeKey = type.toLowerCase().replace(/[\s&()]/g, '_').replace(/[^a-z0-9_]/g, '');
                    return t[typeKey] ? t[typeKey][lang] : type;
                });
                labelSpan.textContent = translatedSelectedTypes.join(', ');
            }
        });
    }

    function setupDropdownToggles() {
        if (jobTypeDropdownTrigger && jobTypeDropdown) {
            jobTypeDropdownTrigger.addEventListener('click', (event) => {
                event.stopPropagation();
                jobTypeDropdown.classList.toggle('active');
            });
        }

        if (jobTypeDropdownTriggerMobile && jobTypeDropdownMobile) {
            jobTypeDropdownTriggerMobile.addEventListener('click', (event) => {
                event.stopPropagation();
                jobTypeDropdownMobile.classList.toggle('active');
            });
        }

        if (categoryDropdownTrigger && categoryDropdown) {
            categoryDropdownTrigger.addEventListener('click', (event) => {
                event.stopPropagation();
                categoryDropdown.classList.toggle('active');
            });
        }

        if (categoryDropdownTriggerMobile && categoryDropdownMobile) {
            categoryDropdownTriggerMobile.addEventListener('click', (event) => {
                event.stopPropagation();
                categoryDropdownMobile.classList.toggle('active');
            });
        }

        if (professionDropdownTrigger && professionDropdown) {
            professionDropdownTrigger.addEventListener('click', (event) => {
                event.stopPropagation();
                professionDropdown.classList.toggle('active');
            });
        }

        if (professionDropdownTriggerMobile && professionDropdownMobile) {
            professionDropdownTriggerMobile.addEventListener('click', (event) => {
                event.stopPropagation();
                professionDropdownMobile.classList.toggle('active');
            });
        }

        document.addEventListener('click', (event) => {
            [jobTypeDropdown, jobTypeDropdownMobile, categoryDropdown, categoryDropdownMobile, professionDropdown, professionDropdownMobile].forEach(dropdown => {
                if (dropdown && !dropdown.contains(event.target)) {
                    dropdown.classList.remove('active');
                }
            });
        });
    }

    function addFilterEventListeners() {
        // Desktop Horizontal Filters
        const desktopFilters = [
            jobSiteTypeFilter,
            countrySelect,
            locationSelect,
            budgetSelect
        ];

        desktopFilters.forEach(filter => {
            if (filter) {
                filter.addEventListener('change', () => {
                    if (filter === jobSiteTypeFilter) {
                        if (jobSiteTypeFilter.value === 'Remote') {
                            if (countrySelect) {
                                countrySelect.value = '';
                                countrySelect.disabled = true;
                            }
                            if (locationSelect) {
                                locationSelect.value = '';
                                locationSelect.disabled = true;
                            }
                        } else {
                            if (countrySelect) countrySelect.disabled = false;
                            if (locationSelect) locationSelect.disabled = false;
                        }
                    }

                    if (filter === countrySelect) {
                        // When country changes, update city dropdown and reset city selection
                        updateCityDropdown(locationSelect, allJobsData, countrySelect.value);
                    }
                    applyFiltersAndSearch();
                });
            }
        });

        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', resetFilters);
        }

        // Mobile Filters (most are applied via mobileApplyFiltersBtn, but country-city sync is needed)
        if (countrySelectMobile) {
            countrySelectMobile.addEventListener('change', () => {
                updateCityDropdown(locationSelectMobile, allJobsData, countrySelectMobile.value);
            });
        }

        if (budgetSelectMobile) {
            budgetSelectMobile.addEventListener('change', () => {
                // Mobile budget change doesn't trigger immediate search, but we can if desired.
                // Usually mobile filters wait for "Apply" button.
            });
        }
    }


    function resetFilters() {
        searchInput.value = '';
        selectedCategories = []; // Clear selected categories
        selectedProfessions = []; // NEW: Clear selected professions
        updateQuickFilterUI(); // Update UI for quick filters and advanced categories

        const allFilters = [
            { select: jobSiteTypeFilter, mobileSelect: jobSiteTypeFilterMobile, defaultValue: '' },
            { select: countrySelect, mobileSelect: countrySelectMobile, defaultValue: 'Palestine' },
            { select: locationSelect, mobileSelect: locationSelectMobile, defaultValue: '' },
            { select: budgetSelect, mobileSelect: budgetSelectMobile, defaultValue: '' },
        ];

        allFilters.forEach(filter => {
            if(filter.select) filter.select.value = filter.defaultValue;
            if(filter.mobileSelect) filter.mobileSelect.value = filter.defaultValue;
        });

        if (locationSelect) updateCityDropdown(locationSelect, allJobsData, 'Palestine');
        if (locationSelectMobile) updateCityDropdown(locationSelectMobile, allJobsData, 'Palestine');

        const dropdownMenus = [jobTypeDropdownMenu, jobTypeDropdownMenuMobile, categoryDropdownMenu, categoryDropdownMenuMobile, professionDropdownMenu, professionDropdownMenuMobile];
        dropdownMenus.forEach(menu => {
            if(menu) {
                menu.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
            }
        });

        updateJobTypeDropdownTriggerText();
        updateCategoryDropdownTriggerText(); // NEW: Update category trigger text
        updateProfessionDropdownTriggerText(); // NEW: Update profession trigger text

        applyFiltersAndSearch(); // Trigger a new search with reset filters

        if (mobileFiltersModal) {
            mobileFiltersModal.classList.remove('show');
            document.body.classList.remove('no-scroll'); // Remove no-scroll class
        }
    }

    function applyFiltersAndSearch() {
        const searchTerm = searchInput ? searchInput.value.trim() : ''; 

        const isMobileView = window.innerWidth <= 992;
        const currentJobSiteTypeFilterElement = isMobileView ? jobSiteTypeFilterMobile : jobSiteTypeFilter;
        const currentJobTypeCheckboxesElement = isMobileView ? jobTypeDropdownMenuMobile : jobTypeDropdownMenu;
        const currentCountryFilterElement = isMobileView ? countrySelectMobile : countrySelect;
        const currentLocationFilterElement = isMobileView ? locationSelectMobile : locationSelect;
        const currentBudgetFilterElement = isMobileView ? budgetSelectMobile : budgetSelect;
        const currentProfessionCheckboxesElement = isMobileView ? professionDropdownMenuMobile : professionDropdownMenu; // NEW


        const currentJobSiteTypeFilter = currentJobSiteTypeFilterElement ? currentJobSiteTypeFilterElement.value : '';
        const currentCountryFilter = currentCountryFilterElement ? currentCountryFilterElement.value : '';
        const currentLocationFilter = currentLocationFilterElement ? currentLocationFilterElement.value : '';
        const currentBudgetFilter = currentBudgetFilterElement ? currentBudgetFilterElement.value : '';

        const selectedJobTypesForFilter = [...selectedJobTypes];
        
        const selectedProfessionsForFilter = [...selectedProfessions]; 
        const categoriesToFilter = [...selectedCategories];


        // Construct URLSearchParams for the API call
        const params = new URLSearchParams();

        if (searchTerm) {
            params.append('search', searchTerm);
        }
        if (categoriesToFilter.length > 0) {
            params.append('category', JSON.stringify(categoriesToFilter));
        }
        if (selectedProfessionsForFilter.length > 0) {
            params.append('professionRequired', JSON.stringify(selectedProfessionsForFilter));
        }
        if (currentBudgetFilter) {
            params.append('budget', currentBudgetFilter);
        }
        if (currentJobSiteTypeFilter) {
            params.append('jobSiteType', currentJobSiteTypeFilter);
        }
        if (selectedJobTypesForFilter.length > 0) {
            params.append('jobType', JSON.stringify(selectedJobTypesForFilter));
        }
        if (currentCountryFilter) {
            params.append('country', currentCountryFilter);
        }
        // Removed location from API params to handle it client-side for dynamic counts and "Other" logic
        // if (currentLocationFilter) {
        //     params.append('location', currentLocationFilter);
        // }

        // country is handled server-side to limit data, location is handled client-side for dynamic counts
        const apiUrl = `/api/jobs?${params.toString()}`;
        fetchAllJobs(apiUrl);
    }

    async function fetchAllJobs(url = '/api/jobs') { // Added 'url' parameter with default
        const maxRetries = 3;
        let retryCount = 0;
        const lang = window.currentLanguage || 'en';
        const t = window.translations;

        // Early return if translations are not loaded
        if (!t) return;

        // Cancel any pending request
        if (abortController) {
            abortController.abort();
        }
        abortController = new AbortController();
        const signal = abortController.signal;

        isFetching = true;
        
        const errorLoadingJobsText = t?.['error_loading_jobs']?.[lang] || 'Error loading jobs';
        const tryAgainLaterText = t?.['try_again_later']?.[lang] || 'Please try again later';

        // Only show skeletons if we have no jobs at all (initial load)
        const isInitialLoad = allJobsData.length === 0;
        if (isInitialLoad) {
            jobList.innerHTML = '';
            for (let i = 0; i < 6; i++) {
                const skeleton = document.createElement('div');
                skeleton.className = 'skeleton-job-card';
                skeleton.innerHTML = `
                    <div class="skeleton-circle"></div>
                    <div class="skeleton-title"></div>
                    <div class="skeleton-text"></div>
                    <div class="skeleton-tags">
                        <div class="skeleton-tag"></div>
                        <div class="skeleton-tag"></div>
                        <div class="skeleton-tag"></div>
                    </div>
                    <div class="skeleton-footer"></div>
                `;
                jobList.appendChild(skeleton);
            }
        } else {
            // Just add a slight opacity to indicate loading if not initial load
            jobList.style.opacity = '0.7';
        }
        loadMoreBtn.style.display = 'none';

        while (retryCount < maxRetries) {
            try {
                const response = await fetch(url, { signal });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                // Restore opacity
                jobList.style.opacity = '1';
                isFetching = false;

                if (data.success && Array.isArray(data.jobs)) {
                    allJobsData = data.jobs;
                    
                    // Update category counts and quick filters based on latest search results
                    // Only update the "global" counts if we are not filtering by category
                    const isFilteringByCategory = selectedCategories.length > 0;
                    
                    const newCategoryCounts = {};
                    allJobsData.forEach(job => {
                        if (job.category && talentCategories.find(c => c.name.en === job.category)) {
                            newCategoryCounts[job.category] = (newCategoryCounts[job.category] || 0) + 1;
                        }
                    });

                    if (!isFilteringByCategory) {
                        // If not filtering by category, these are our new "global" counts for this location/search
                        categoryCounts = newCategoryCounts;
                        lastGlobalCategoryCounts = { ...newCategoryCounts };
                    } else {
                        // If we ARE filtering by category, we want to keep the counts for other categories visible
                        // but maybe update the count for the currently selected categories from the results
                        categoryCounts = { ...lastGlobalCategoryCounts };
                        
                        // Update the counts for the currently selected categories to be accurate
                        selectedCategories.forEach(cat => {
                            if (newCategoryCounts[cat] !== undefined) {
                                categoryCounts[cat] = newCategoryCounts[cat];
                            }
                        });
                    }

                    populateQuickFilters();

                    // Get current country/city filters from UI
                    const isMobileView = window.innerWidth <= 992;
                    const countrySelectEl = isMobileView ? countrySelectMobile : countrySelect;
                    const locationSelectEl = isMobileView ? locationSelectMobile : locationSelect;
                    
                    const countryFilter = countrySelectEl ? countrySelectEl.value : '';
                    const cityFilter = locationSelectEl ? locationSelectEl.value : '';

                    // Re-populate dropdowns to update counts dynamically
                    if (countrySelect) populateCountryDropdown(countrySelect, allJobsData, countryFilter);
                    if (countrySelectMobile) populateCountryDropdown(countrySelectMobile, allJobsData, countryFilter);
                    
                    if (locationSelect) updateCityDropdown(locationSelect, allJobsData, countryFilter, cityFilter);
                    if (locationSelectMobile) updateCityDropdown(locationSelectMobile, allJobsData, countryFilter, cityFilter);

                    // Now filter the jobs for display based on country/city selection
                    const cityTranslations = window.palestinianCitiesTranslations || {};
                    currentlyDisplayedJobs = allJobsData.filter(job => {
                        if (countryFilter && job.country !== countryFilter) return false;
                        
                        if (cityFilter) {
                            if (cityFilter === 'Other') {
                                // Find all predefined cities for the selected country
                                const countryKey = Object.keys(cityTranslations).find(key => 
                                    key.startsWith('country_') && cityTranslations[key].en === countryFilter
                                );
                                
                                const predefinedCityEnNames = Object.keys(cityTranslations)
                                    .filter(key => key.startsWith('city_') && key !== 'city_other' && (!countryKey || cityTranslations[key].country === countryKey))
                                    .map(key => cityTranslations[key].en);
                                
                                // "Other" matches jobs where the city is NOT in the predefined list for this country
                                return !predefinedCityEnNames.includes(job.city);
                            } else {
                                // Regular city match
                                return job.city === cityFilter;
                            }
                        }
                        return true;
                    });

                    currentPage = 1;
                    renderJobs(currentlyDisplayedJobs.slice(0, jobsPerPage));
                    return;
                } else {
                    throw new Error('Invalid job data structure received from API');
                }
            } catch (error) {
                retryCount++;
                console.error(`Attempt ${retryCount} failed:`, error);
                if (retryCount === maxRetries) {
                    jobList.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>${errorLoadingJobsText}</h3>
                            <p>${tryAgainLaterText}</p>
                        </div>
                    `;
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            }
        }
    }

    function processJobData() {
        allJobsData = allJobsData.map(job => {
            return {
                ...job,
                title: job.title || 'Untitled Job'
            };
        });
    }

    // --- Initial Load Logic ---
    let isInitialLoadDone = false;
    let isFetching = false;
    let abortController = null;

    async function initJobsPage() {
        if (isInitialLoadDone) return;
        isInitialLoadDone = true;

        try {
            // Initial fetch with no filters (or filters from URL params)
            const urlParams = new URLSearchParams(window.location.search);
            const initialApiUrl = `/api/jobs?${urlParams.toString()}`;

            await fetchAllJobs(initialApiUrl); // Pass the initial URL with params

            processJobData(); // Process the fetched data

            const initialCountry = urlParams.get('country') || 'Palestine';
            const initialLocation = urlParams.get('location');

            // Populate country and city dropdowns dynamically
            if (countrySelect) populateCountryDropdown(countrySelect, allJobsData, initialCountry);
            if (countrySelectMobile) populateCountryDropdown(countrySelectMobile, allJobsData, initialCountry);
            
            // Initial city population
            if (locationSelect) updateCityDropdown(locationSelect, allJobsData, initialCountry, initialLocation);
            if (locationSelectMobile) updateCityDropdown(locationSelectMobile, allJobsData, initialCountry, initialLocation);

            // Handle initial category and profession from URL params
            const initialCategory = urlParams.get('category');
            if (initialCategory) {
                try {
                    selectedCategories = JSON.parse(initialCategory);
                } catch (e) {
                    selectedCategories = [initialCategory];
                }
            }
            const initialProfession = urlParams.get('professionRequired');
            if (initialProfession) {
                try {
                    selectedProfessions = JSON.parse(initialProfession);
                } catch (e) {
                    selectedProfessions = [initialProfession];
                }
            }

            categoryCounts = {};
            allJobsData.forEach(job => {
                if (job.category && talentCategories.find(c => c.name.en === job.category)) {
                    categoryCounts[job.category] = (categoryCounts[job.category] || 0) + 1;
                }
            });
            
            // On initial load, the category counts we have are our "global" counts
            lastGlobalCategoryCounts = { ...categoryCounts };

            populateQuickFilters();
            
            if (jobTypeDropdownMenu) {
                populateJobTypeCheckboxes(jobTypeDropdownMenu);
            } else {
                console.error('Desktop job type dropdown menu not found!');
            }
            
            if (jobTypeDropdownMenuMobile) {
                populateJobTypeCheckboxes(jobTypeDropdownMenuMobile);
            } else {
                console.error('Mobile job type dropdown menu not found!');
            }

            // NEW: Populate Category Checkboxes
            if (categoryDropdownMenu) {
                populateCategoryCheckboxes(categoryDropdownMenu);
            } else {
                console.error('Desktop category dropdown menu not found!');
            }
            if (categoryDropdownMenuMobile) {
                populateCategoryCheckboxes(categoryDropdownMenuMobile, true);
            } else {
                console.error('Mobile category dropdown menu not found!');
            }

            // NEW: Populate Profession Checkboxes
            if (professionDropdownMenu) {
                populateProfessionCheckboxes(professionDropdownMenu);
            } else {
                console.error('Desktop profession dropdown menu not found!');
            }
            if (professionDropdownMenuMobile) {
                populateProfessionCheckboxes(professionDropdownMenuMobile, true);
            } else {
                console.error('Mobile profession dropdown menu not found!');
            }
            
            setupDropdownToggles();
            addFilterEventListeners();

            // Apply translations to static filter options
            const translateFilterOptions = () => {
                const filterElements = [
                    jobSiteTypeFilter, jobSiteTypeFilterMobile,
                    budgetSelect, budgetSelectMobile
                ];
                filterElements.forEach(selectElement => {
                    if (selectElement) {
                        Array.from(selectElement.options).forEach(option => {
                            const key = option.dataset.langKey;
                            if (key && window.translations[key]) {
                                option.textContent = window.translations[key][window.currentLanguage] || option.textContent;
                            }
                        });
                    }
                });
            };
            translateFilterOptions();

            // Apply URL parameters to UI elements
            const categoryFromUrl = urlParams.get('category');
            if (categoryFromUrl) {
                try {
                    selectedCategories = JSON.parse(decodeURIComponent(categoryFromUrl));
                } catch (e) {
                    selectedCategories = [decodeURIComponent(categoryFromUrl)]; // Fallback for single string
                }
                updateQuickFilterUI();
                updateCategoryDropdownTriggerText(); // NEW: Update trigger text after applying URL params
            }

            const professionFromUrl = urlParams.get('professionRequired'); // NEW: Handle profession from URL
            if (professionFromUrl) {
                try {
                    selectedProfessions = JSON.parse(decodeURIComponent(professionFromUrl));
                } catch (e) {
                    selectedProfessions = [decodeURIComponent(professionFromUrl)];
                }
                updateProfessionDropdownTriggerText(); // NEW: Update trigger text after applying URL params
            }


            const jobSiteTypeFromUrl = urlParams.get('jobSiteType');
            if (jobSiteTypeFromUrl) {
                const decodedType = decodeURIComponent(jobSiteTypeFromUrl);
                if (jobSiteTypeFilter) jobSiteTypeFilter.value = decodedType;
                if (jobSiteTypeFilterMobile) jobSiteTypeFilterMobile.value = decodedType;
                // Trigger change to update location filter visibility if needed
                if (jobSiteTypeFilter) jobSiteTypeFilter.dispatchEvent(new Event('change'));
                if (jobSiteTypeFilterMobile) jobSiteTypeFilterMobile.dispatchEvent(new Event('change'));
            }

            const jobTypeUrlParam = urlParams.get('jobType');
            if (jobTypeUrlParam) {
                let decodedJobTypes = [];
                try {
                    decodedJobTypes = JSON.parse(decodeURIComponent(jobTypeUrlParam));
                } catch (e) {
                    decodedJobTypes = [decodeURIComponent(jobTypeUrlParam)]; // Fallback for single string
                }

                const allJobTypeCheckboxes = [...(jobTypeDropdownMenu ? jobTypeDropdownMenu.querySelectorAll('input') : []), ...(jobTypeDropdownMenuMobile ? jobTypeDropdownMenuMobile.querySelectorAll('input') : [])];
                allJobTypeCheckboxes.forEach(checkbox => {
                    if (decodedJobTypes.includes(checkbox.value)) {
                        checkbox.checked = true;
                    }
                });
                updateJobTypeDropdownTriggerText();
            }

            const locationFromUrl = urlParams.get('location');
            if(locationFromUrl) {
                let decodedLocation = '';
                try {
                    const parsedLocations = JSON.parse(decodeURIComponent(locationFromUrl));
                    if (Array.isArray(parsedLocations) && parsedLocations.length > 0) {
                        decodedLocation = parsedLocations[0]; // Assuming single select for now
                    }
                } catch (e) {
                    decodedLocation = decodeURIComponent(locationFromUrl); // Fallback for single string
                }
                if (locationSelect) locationSelect.value = decodedLocation;
                if (locationSelectMobile) locationSelectMobile.value = decodedLocation;
            }

            const budgetFromUrl = urlParams.get('budget');
            if(budgetFromUrl) {
                const decodedBudget = decodeURIComponent(budgetFromUrl);
                if(budgetSelect) budgetSelect.value = decodedBudget;
                if(budgetSelectMobile) budgetSelectMobile.value = decodedBudget;
            }

            // No need to call applyFiltersAndSearch here, fetchAllJobs already did the initial render
        } catch (error) {
            console.error('Error initializing jobs page:', error);
            // Error message already handled by fetchAllJobs
        }
    }

    // Initial Load: Wait for translations to be applied before initializing the page
    // Check if translations are already applied to handle race conditions
    if (window.translations && Object.keys(window.translations).length > 20) {
        initJobsPage();
    } else {
        window.addEventListener('translationsApplied', initJobsPage, { once: true });
    }

    // Fallback: If translationsApplied doesn't fire for some reason, init anyway after a delay
    setTimeout(() => {
        if (!isInitialLoadDone) {
            console.log("Fallback initialization triggered");
            initJobsPage();
        }
    }, 2000);


    // Add click event listener to make job cards clickable
    // This listener is now correctly placed outside the nested DOMContentLoaded
    if (jobList) {
        jobList.addEventListener('click', (event) => {
            const jobCard = event.target.closest('.job-card');
            const interactiveElement = event.target.closest('a, button');
            if (jobCard && !interactiveElement) {
                const jobId = jobCard.dataset.jobId;
                const jobTitle = jobCard.dataset.jobTitle;
                const companyName = jobCard.dataset.companyName;
                
                // SEO: Use slugified URL
                const slug = window.generateJobSlug(jobTitle, companyName);
                window.open(`/jobs/${jobId}/${slug}`, '_blank');
            }
        });
    }
    
    // Update job card HTML template to remove view details button
    function renderJobs(jobs, append = false) {
        const lang = window.currentLanguage || 'en';
        const t = window.translations;
        const cityTranslations = window.palestinianCitiesTranslations;

        // Early return if translations are not loaded
        if (!t) {
            console.error('Translations not loaded yet');
            return;
        }

        if (!jobs || !jobs.length) {
            jobList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-briefcase-slash fa-3x"></i>
                    <p data-lang-key="no_jobs_found">${t?.['no_jobs_found']?.[lang] || 'No jobs found'}</p>
                </div>
            `;
            loadMoreBtn.style.display = 'none';
            return;
        }
    
        const jobsHtml = jobs.map(job => {
            const currencySymbol = getCurrencySymbol(job.currency);
            let locationDisplay = '';
            
            const cityExists = job.city && job.city.trim() !== '' && job.city.toLowerCase() !== 'n/a' && job.city.toLowerCase() !== 'unknown';
            const countryExists = job.country && job.country.trim() !== '' && job.country.toLowerCase() !== 'n/a' && job.country.toLowerCase() !== 'unknown';

            let translatedCountry = '';
            if (countryExists) {
                const countryKey = getTranslationKey('country', job.country);
                translatedCountry = cityTranslations?.[countryKey]?.[lang] || job.country;
            }

            let translatedCity = '';
            if (cityExists) {
                const cityKey = getTranslationKey('city', job.city);
                translatedCity = cityTranslations?.[cityKey]?.[lang] || job.city;
            }

            if (translatedCountry && translatedCity && 
                translatedCity.toLowerCase() !== translatedCountry.toLowerCase() && 
                translatedCity.toLowerCase() !== 'other' && 
                job.city.toLowerCase() !== 'other') {
                locationDisplay = `${translatedCountry} | ${translatedCity}`;
            } else if (translatedCountry) {
                locationDisplay = translatedCountry;
            } else if (translatedCity && translatedCity.toLowerCase() !== 'other' && job.city.toLowerCase() !== 'other') {
                locationDisplay = translatedCity;
            } else if (job.job_site_type) {
                const siteTypeKey = job.job_site_type.toLowerCase().replace('-', '_');
                locationDisplay = t?.[siteTypeKey]?.[lang] || job.job_site_type;
            } else {
                locationDisplay = t?.['not_available']?.[lang] || 'N/A';
            }

            // Get employer display info
            const { avatarHtml, avatarContainerClass, employerDisplayName } = getEmployerAvatarHtml(job);
            const employerSlug = job.employer_slug;
            const profileUrl = employerSlug ? `/${employerSlug}` : `/employer_profile.html?id=${job.employer_user_id}`;
            const employerNameHtml = employerDisplayName ? `
                <a href="${profileUrl}" target="_blank" class="employer-name-display hover:text-primary transition-colors">
                    ${employerDisplayName}
                </a>` : '';

            // Get category display name and icon
            let displayCategory = t?.['not_available']?.[lang] || 'N/A';
            let categoryIcon = '';
            const categoryData = talentCategories.find(c => c.name.en === job.category);
            if (categoryData) {
                displayCategory = categoryData.name[lang] || categoryData.name.en;
                categoryIcon = categoryData.icon ? `<i class="${categoryData.icon}"></i>` : '';
            } else {
                displayCategory = job.category || t?.['not_available']?.[lang] || 'N/A';
            }

            // Get job type display name
            let displayJobType = t?.['not_available']?.[lang] || 'N/A';
            const jobTypeKey = (job.job_type || '').toLowerCase().replace(/[\s&()]/g, '_').replace(/[^a-z0-9_]/g, '');
            if (t?.[jobTypeKey]?.[lang]) {
                displayJobType = t[jobTypeKey][lang];
            } else {
                displayJobType = job.job_type || t?.['not_available']?.[lang] || 'N/A';
            }

            // Status badge removed as per request
            const cardClass = 'job-card';
            
            return `
                <div class="${cardClass}" 
                     data-job-id="${job.id}" 
                     data-job-title="${job.title.replace(/"/g, '&quot;')}"
                     data-company-name="${employerDisplayName.replace(/"/g, '&quot;')}"
                     data-is-external="${job.is_external}" 
                     data-external-url="${job.external_apply_url || ''}" 
                     tabindex="0" role="link">
                    <div class="job-card-header-new">
                        <div class="job-card-avatar-wrapper">
                            <div class="${avatarContainerClass}">
                                ${avatarHtml}
                            </div>
                        </div>
                        <div class="job-card-main-info">
                            <h3 class="job-title-main">${job.title}</h3>
                            ${employerNameHtml}
                        </div>
                    </div>
                    
                    <div class="job-card-tags-container">
                        <div class="job-tags-row">
                            <span class="job-tag-item location-tag">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${locationDisplay}</span>
                            </span>
                            <span class="job-tag-item category-tag">
                                ${categoryIcon}
                                <span>${displayCategory}</span>
                            </span>
                        </div>
                        <div class="job-tags-row">
                            <span class="job-tag-item budget-tag">
                                <i class="fas fa-money-bill-wave"></i>
                                <span>${currencySymbol}${job.budget ? job.budget.toLocaleString() : (t?.['negotiable']?.[lang] || 'Negotiable')}</span>
                            </span>
                            <span class="job-tag-item type-tag">
                                <i class="fas fa-clock"></i>
                                <span>${displayJobType}</span>
                            </span>
                        </div>
                    </div>

                    <div class="job-card-footer-meta">
                        <span class="posted-time"><i class="far fa-clock"></i> ${timeAgo(job.created_at)}</span>
                    </div>
                </div>
            `;
        }).join('');
    
        if (append) {
            jobList.innerHTML += jobsHtml;
        } else {
            jobList.innerHTML = jobsHtml;
        }
        
        // Correct Load More visibility logic
        const hasMore = (currentPage * jobsPerPage) < currentlyDisplayedJobs.length;
        loadMoreBtn.style.display = hasMore ? 'block' : 'none';
    }

    // Apply Filters button
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFiltersAndSearch);
    }

    // Clear Filters button
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', resetFilters);
    }
    let searchTimeout;
    if(searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                applyFiltersAndSearch();
            }, 300);
        });

        // Trigger search on Enter key
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                clearTimeout(searchTimeout);
                applyFiltersAndSearch();
            }
        });
    }

    // Mobile event listeners
    if (mobileFilterToggle) {
        mobileFilterToggle.addEventListener('click', () => {
            if (mobileFiltersModal) mobileFiltersModal.classList.add('show');
            document.body.classList.add('no-scroll'); // Add no-scroll class
            
            // Sync values from desktop to mobile on toggle
            if(jobSiteTypeFilter && jobSiteTypeFilterMobile) jobSiteTypeFilterMobile.value = jobSiteTypeFilter.value;
            if(countrySelect && countrySelectMobile) {
                populateCountryDropdown(countrySelectMobile, allJobsData, countrySelect.value);
            }
            if(locationSelect && locationSelectMobile) {
                updateCityDropdown(locationSelectMobile, allJobsData, countrySelect ? countrySelect.value : '', locationSelect.value);
            }
            if(budgetSelect && budgetSelectMobile) budgetSelectMobile.value = budgetSelect.value;

            // Sync job type checkboxes
            if(jobTypeDropdownMenu && jobTypeDropdownMenuMobile) {
                jobTypeDropdownMenu.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    const mobileCb = jobTypeDropdownMenuMobile.querySelector(`input[value="${cb.value}"]`);
                    if(mobileCb) mobileCb.checked = cb.checked;
                });
            }
            updateJobTypeDropdownTriggerText();

            // FIX: Sync Category Checkboxes (using global selectedCategories)
            if (categoryDropdownMenuMobile) {
                categoryDropdownMenuMobile.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    cb.checked = selectedCategories.includes(cb.value);
                });
                updateCategoryDropdownTriggerText(true); // true for mobile
            }

            // FIX: Sync Profession Checkboxes (using global selectedProfessions)
            if (professionDropdownMenuMobile) {
                professionDropdownMenuMobile.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    cb.checked = selectedProfessions.includes(cb.value);
                });
                updateProfessionDropdownTriggerText(true); // true for mobile
            }
        });
    }
    if (mobileModalCloseBtn) {
        mobileModalCloseBtn.addEventListener('click', () => {
            if (mobileFiltersModal) mobileFiltersModal.classList.remove('show');
            document.body.classList.remove('no-scroll'); // Remove no-scroll class
        });
    }
    if (mobileApplyFiltersBtn) {
        mobileApplyFiltersBtn.addEventListener('click', () => {
            // Sync values from mobile to desktop on apply
            if(jobSiteTypeFilter && jobSiteTypeFilterMobile) jobSiteTypeFilter.value = jobSiteTypeFilterMobile.value;
            if(countrySelect && countrySelectMobile) {
                countrySelect.value = countrySelectMobile.value;
                updateCityDropdown(locationSelect, allJobsData, countrySelect.value, locationSelectMobile.value);
            }
            if(locationSelect && locationSelectMobile) locationSelect.value = locationSelectMobile.value;
            if(budgetSelect && budgetSelectMobile) budgetSelect.value = budgetSelectMobile.value;

            // Sync job type checkboxes
            if(jobTypeDropdownMenu && jobTypeDropdownMenuMobile) {
                jobTypeDropdownMenuMobile.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    const desktopCb = jobTypeDropdownMenu.querySelector(`input[value="${cb.value}"]`);
                    if(desktopCb) desktopCb.checked = cb.checked; // Corrected: Sync desktop checkbox to mobile checkbox state
                });
            }
            updateJobTypeDropdownTriggerText();
            applyFiltersAndSearch();
            if (mobileFiltersModal) mobileFiltersModal.classList.remove('show');
            document.body.classList.remove('no-scroll'); // Remove no-scroll class
        });
    }
    if (mobileResetFiltersBtn) {
        mobileResetFiltersBtn.addEventListener('click', () => {
            resetFilters();
            if (mobileFiltersModal) mobileFiltersModal.classList.remove('show');
            document.body.classList.remove('no-scroll'); // Remove no-scroll class
        });
    }

    if (jobSiteTypeFilterMobile) {
        jobSiteTypeFilterMobile.addEventListener('change', () => {
            if (jobSiteTypeFilterMobile.value === 'Remote') {
                if (countrySelectMobile) {
                    countrySelectMobile.value = '';
                    countrySelectMobile.disabled = true;
                }
                if (locationSelectMobile) {
                    locationSelectMobile.value = '';
                    locationSelectMobile.disabled = true;
                }
                if (locationFilterGroupMobile) locationFilterGroupMobile.style.display = 'none';
            } else {
                if (countrySelectMobile) countrySelectMobile.disabled = false;
                if (locationSelectMobile) {
                    locationSelectMobile.disabled = false;
                }
                if (locationFilterGroupMobile) locationFilterGroupMobile.style.display = 'block';
            }
        });
    }

    if (countrySelectMobile) {
        countrySelectMobile.addEventListener('change', () => {
            updateCityDropdown(locationSelectMobile, allJobsData, countrySelectMobile.value);
        });
    }

    // Load More Button Click Event
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            const startIndex = currentPage * jobsPerPage;
            const endIndex = startIndex + jobsPerPage;
            const nextJobs = currentlyDisplayedJobs.slice(startIndex, endIndex);
            
            if (nextJobs.length > 0) {
                currentPage++;
                renderJobs(nextJobs, true);
            }
        });
    }

    // NEW: Listen for language changes and refresh translatable parts of the UI
    window.addEventListener('translationsApplied', (event) => {
        const lang = event.detail.lang;
        
        // Refresh dropdowns with new translations
        const isMobileView = window.innerWidth <= 992;
        const currentCountryValue = isMobileView ? (countrySelectMobile ? countrySelectMobile.value : '') : (countrySelect ? countrySelect.value : '');
        const currentCityValue = isMobileView ? (locationSelectMobile ? locationSelectMobile.value : '') : (locationSelect ? locationSelect.value : '');

        if (countrySelect) populateCountryDropdown(countrySelect, allJobsData, currentCountryValue);
        if (countrySelectMobile) populateCountryDropdown(countrySelectMobile, allJobsData, currentCountryValue);
        
        if (locationSelect) updateCityDropdown(locationSelect, allJobsData, currentCountryValue, currentCityValue);
        if (locationSelectMobile) updateCityDropdown(locationSelectMobile, allJobsData, currentCountryValue, currentCityValue);

        // Refresh category and profession dropdowns
        if (categoryDropdownMenu) populateCategoryCheckboxes(categoryDropdownMenu);
        if (categoryDropdownMenuMobile) populateCategoryCheckboxes(categoryDropdownMenuMobile, true);
        if (professionDropdownMenu) populateProfessionCheckboxes(professionDropdownMenu);
        if (professionDropdownMenuMobile) populateProfessionCheckboxes(professionDropdownMenuMobile, true);

        // Refresh job types
        if (jobTypeDropdownMenu) populateJobTypeCheckboxes(jobTypeDropdownMenu);
        if (jobTypeDropdownMenuMobile) populateJobTypeCheckboxes(jobTypeDropdownMenuMobile);

        // Refresh trigger texts
        updateCategoryDropdownTriggerText();
        updateCategoryDropdownTriggerText(true);
        updateProfessionDropdownTriggerText();
        updateProfessionDropdownTriggerText(true);
        updateJobTypeDropdownTriggerText();

        // Re-populate quick filters (they show category names)
        populateQuickFilters();

        // Re-render the job list to update location strings and timestamps
        const startIndex = 0;
        const endIndex = currentPage * jobsPerPage;
        renderJobs(currentlyDisplayedJobs.slice(startIndex, endIndex));
    });
});
