// talent.js - Redesigned for Modern UI/UX and Enhanced Filtering
document.addEventListener('DOMContentLoaded', function () {
    // --- DOM Elements ---
    const talentGrid = document.getElementById('talentGrid');
    
    const searchQueryHero = document.getElementById('searchQueryHero');
    const searchTalentButtonHero = document.getElementById('searchTalentButtonHero');

    const accessDeniedModal = document.getElementById('accessDeniedModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const accessDeniedTitle = document.getElementById('accessDeniedTitle');
    const accessDeniedMessage = document.getElementById('accessDeniedMessage');
    const modalActions = document.getElementById('modalActions');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const pageLoadingOverlay = document.getElementById('pageLoadingOverlay');
    const noResults = document.getElementById('noResults');

    const mainContentWrapper = document.getElementById('mainContentWrapper');
    const browseTalentSection = document.querySelector('.talent-list-content'); // Target for auto-scroll

    // Quick filter elements
    const quickServicesGrid = document.getElementById('quickServicesGrid');
    const quickCategoriesGridMobile = document.getElementById('quickCategoriesGridMobile');

    // Desktop/Main filter controls (Custom Dropdowns)
    const categoryDropdown = document.getElementById('categoryDropdown');
    const categoryDropdownToggle = document.getElementById('categoryDropdownToggle');
    const categoryCheckboxes = document.getElementById('categoryCheckboxes'); // This is the menu div

    const professionsDropdown = document.getElementById('professionsDropdown');
    const professionsDropdownToggle = document.getElementById('professionsDropdownToggle');
    const professionsCheckboxesContainer = document.getElementById('professionsCheckboxes'); // This is the menu div

    const cityDropdown = document.getElementById('cityDropdown');
    const cityDropdownToggle = document.getElementById('cityDropdownToggle');
    const cityCheckboxes = document.getElementById('cityCheckboxes'); // This is the menu div

    const clearFiltersSidebarBtn = document.getElementById('clearFiltersSidebar');

    // Load More button elements
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const loadMoreBtn = document.getElementById('loadMoreBtn');


    // NEW: Declare customDropdowns here globally within the DOMContentLoaded scope
    const customDropdowns = document.querySelectorAll('.custom-dropdown');


    let currentUserType = null;
    let employerVerificationStatus = 'Not Submitted';
    let isAuthenticated = false;

    // Use these as the single source of truth for filtering state
    let selectedAdvancedFilterCategories = [];
    let selectedAdvancedFilterProfessions = [];
    let selectedCities = [];

    let currentSkill = '';
    let currentSearchQuery = '';

    // FIX: New global variables to store ALL talent data and counts, to be populated once.
    let allTalentDataUnfiltered = [];
    let allTalentCountsByCategory = {};
    let allTalentCountsByProfession = {};

    // Pagination variables
    let currentOffset = 0;
    const ITEMS_PER_PAGE = 20;
    let totalTalentCount = 0;
    let loadedTalentData = [];
    let hasMoreTalent = true;
    let isLoadingMore = false; // Prevent multiple simultaneous load more requests

    // Use window.globalCategoriesAndProfessions from categories-professions-translations.js
    let talentCategories = [];
    let allProfessionsFlattened = [];
    // NEW: Use window.popularProfessions from the unified translations file
    let popularProfessions = [];

    // Ensure globalCategoriesAndProfessions is loaded
    if (window.globalCategoriesAndProfessions) {
        talentCategories = window.globalCategoriesAndProfessions.map(cat => ({
            name: cat.name, // Keep the full name object for translation purposes
            icon: cat.icon,
            professions: cat.professions.map(p => p.en) // Use English for internal logic and matching
        }));
        allProfessionsFlattened = [...new Set(talentCategories.flatMap(cat => cat.professions))].sort();
    } else {
        console.error("window.globalCategoriesAndProfessions is not defined. Ensure categories-professions-translations.js is loaded correctly.");
    }
    // NEW: Populate popularProfessions from the translations file
    if (window.popularProfessions) {
        popularProfessions = window.popularProfessions;
    } else {
        console.error("window.popularProfessions is not defined. Ensure categories-professions-translations.js is loaded correctly.");
    }

    // Initialize translations and currentLanguage from window scope
    let translations = window.translations || {};
    let currentLanguage = window.currentLanguage || 'en';


    // Use window.palestinianCitiesTranslations directly from cities-translations.js
    const palestinianCitiesData = window.palestinianCitiesTranslations || {};
    const palestinianCitiesEnglishNames = Object.values(palestinianCitiesData).map(c => c.en).sort();

    if (!window.palestinianCitiesTranslations) {
        console.error("window.palestinianCitiesTranslations is not defined. Ensure cities-translations.js is loaded correctly.");
    }

    // Optimized debounce utility function with immediate execution option
    function debounce(func, delay, immediate = false) {
        let timeout;
        return function (...args) {
            const context = this;
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                timeout = null;
                if (!immediate) func.apply(context, args);
            }, delay);
            if (callNow) func.apply(context, args);
        };
    }

    // Debounced loadTalent for input fields - reduced delay for better responsiveness
    const debouncedLoadTalent = debounce(loadTalent, 200);

    // Helper function to reset all filter state variables
    function resetAllFiltersState() {
        currentSearchQuery = '';
        if (searchQueryHero) searchQueryHero.value = '';

        selectedAdvancedFilterCategories = [];
        selectedAdvancedFilterProfessions = [];
        selectedCities = [];

        currentSkill = '';
    }

    // Helper function to update all filter UIs based on current state
    function updateAllFilterUIs() {
        // Update quick filter active states by checking against selectedAdvancedFilterCategories/Professions
        document.querySelectorAll('.quick-filter-card').forEach(card => {
            const category = card.dataset.category;
            const profession = card.dataset.profession;

            let isActive = false;
            if (profession) { // It's a quick service profession card
                isActive = selectedAdvancedFilterProfessions.includes(profession);
            } else { // It's a category card
                isActive = selectedAdvancedFilterCategories.includes(category);
            }

            if (isActive) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });

        // Re-populate dropdowns to reflect current state (checked checkboxes, updated text)
        // Only populate if the dropdown is currently active to avoid unnecessary re-renders
        // and to prevent dropdowns from closing unexpectedly.
        if (categoryDropdown) {
            updateCategoryDropdownTriggerText(selectedAdvancedFilterCategories, categoryDropdownToggle, selectedCategoriesDisplay);
            if (categoryDropdown.classList.contains('active')) {
                populateCategoryDropdown(categoryCheckboxes, selectedAdvancedFilterCategories, categoryDropdownToggle, selectedCategoriesDisplay);
            }
        }

        if (professionsDropdown) {
            updateProfessionsDropdownTriggerText(selectedAdvancedFilterProfessions, professionsDropdownToggle, selectedProfessionsDisplay);
            if (professionsDropdown.classList.contains('active')) {
                populateProfessionsDropdown(professionsCheckboxesContainer, selectedAdvancedFilterProfessions, professionsDropdownToggle, selectedProfessionsDisplay);
            }
        }

        if (cityDropdown) {
            updateCityDropdownTriggerText(selectedCities, cityDropdownToggle, selectedCitiesDisplay);
            if (cityDropdown.classList.contains('active')) {
                populateCitiesDropdown(cityCheckboxes, selectedCities, cityDropdownToggle, selectedCitiesDisplay);
            }
        }
    }

    // Helper function to clone and replace an element safely
    function cloneAndReplace(oldElement) {
        if (!oldElement || !oldElement.parentNode) {
            return null;
        }
        const newElement = oldElement.cloneNode(false);
        oldElement.parentNode.replaceChild(newElement, oldElement);
        return newElement;
    }

    function populateQuickFilters() {
        currentLanguage = window.currentLanguage || 'en';
        translations = window.translations || {};
        const t = translations;

        // Clone and replace to remove all event listeners and old elements for safety
        const newQuickServicesGrid = cloneAndReplace(quickServicesGrid);
        const newQuickCategoriesGridMobile = cloneAndReplace(quickCategoriesGridMobile);

        if (newQuickCategoriesGridMobile) { // Only populate categories for mobile quick filters
            newQuickCategoriesGridMobile.innerHTML = '';
            // FIX: Use the global, unfiltered counts to populate the cards
            const sortedTalentCategories = [...talentCategories].sort((a, b) => {
                const countA = allTalentCountsByCategory[a.name.en] || 0;
                const countB = allTalentCountsByCategory[b.name.en] || 0;
                return countB - countA;
            });

            sortedTalentCategories.forEach(category => {
                const categoryData = window.globalCategoriesAndProfessions.find(c => c.name.en === category.name.en);
                const iconHtml = categoryData && categoryData.icon ? `<i class="${categoryData.icon}"></i> ` : '';

                const translatedCategoryName = categoryData ? (categoryData.name[currentLanguage] || categoryData.name.en) : category.name.en;
                // FIX: Use the global, unfiltered counts to populate the cards
                const talentCount = allTalentCountsByCategory[category.name.en] || 0;

                const button = document.createElement('button');
                button.className = 'quick-filter-card';
                button.dataset.category = category.name.en;
                button.innerHTML = `
                    ${iconHtml}
                    <span>${translatedCategoryName}</span>
                    <span class="category-count">${talentCount}</span>
                `;
                newQuickCategoriesGridMobile.appendChild(button); // Append directly, event listener is on parent
            });
            newQuickCategoriesGridMobile.removeEventListener('click', handleQuickFilterClick); // Ensure no duplicates
            newQuickCategoriesGridMobile.addEventListener('click', handleQuickFilterClick);
        }

        if (newQuickServicesGrid) { // Populate quick services for both desktop and mobile
            newQuickServicesGrid.innerHTML = '';
            // FIX: Use the global, unfiltered counts to populate the cards
            const sortedPopularProfessions = popularProfessions.sort((a, b) => {
                const countA = allTalentCountsByProfession[a] || 0;
                const countB = allTalentCountsByProfession[b] || 0;
                return countB - countA;
            });

            sortedPopularProfessions.forEach(profEn => {
                const professionCount = allTalentCountsByProfession[profEn] || 0;

                // Find the full profession object to get translation key and icon
                let professionObject;
                let categoryNameEn;
                let professionIcon = '';
                for (const cat of window.globalCategoriesAndProfessions) {
                    professionObject = cat.professions.find(p => p.en === profEn);
                    if (professionObject) {
                        categoryNameEn = cat.name.en;
                        // NEW: Check if the profession has its own icon
                        if (professionObject.icon) {
                            professionIcon = `<i class="${professionObject.icon}"></i> `;
                        } else {
                            // Fallback to category icon if profession has no specific icon
                            professionIcon = cat.icon ? `<i class="${cat.icon}"></i> ` : '';
                        }
                        break;
                    }
                }

                if (!professionObject) return; // Skip if profession isn't in main list

                const translatedProfName = professionObject.ar && currentLanguage === 'ar' ? professionObject.ar : professionObject.en;

                const button = document.createElement('button');
                button.className = 'quick-filter-card';
                button.dataset.category = categoryNameEn;
                button.dataset.profession = profEn;
                button.innerHTML = `
                    ${professionIcon}
                    <span>${translatedProfName}</span>
                    <span class="category-count">${professionCount}</span>
                `;
                newQuickServicesGrid.appendChild(button); // Append directly, event listener is on parent
            });
            newQuickServicesGrid.removeEventListener('click', handleQuickFilterClick); // Ensure no duplicates
            newQuickServicesGrid.addEventListener('click', handleQuickFilterClick);
        }
        updateAllFilterUIs(); // Set active states after populating
    }

    // Centralized handler for quick filter clicks
    function handleQuickFilterClick(event) {
        const clickedCard = event.target.closest('.quick-filter-card');
        if (clickedCard) {
            const isQuickFix = !!clickedCard.dataset.profession;
            const categoryName = clickedCard.dataset.category;
            const professionName = clickedCard.dataset.profession;

            const isMobileView = window.innerWidth <= 992;

            // Determine if the clicked card's corresponding advanced filter is already active
            let isAlreadyActiveInAdvanced = false;
            if (isQuickFix) {
                isAlreadyActiveInAdvanced = selectedAdvancedFilterProfessions.includes(professionName);
            } else {
                isAlreadyActiveInAdvanced = selectedAdvancedFilterCategories.includes(categoryName);
            }

            // Unified Selection Logic (Single-select for Quick Section)
            if (isQuickFix) {
                if (isAlreadyActiveInAdvanced) {
                    // DESELECTING: Clear everything related to this quick selection
                    selectedAdvancedFilterProfessions = [];
                    selectedAdvancedFilterCategories = [];
                } else {
                    // SELECTING: Clear others first (Single Select Rule for Quick Section)
                    selectedAdvancedFilterProfessions = [professionName];
                    selectedAdvancedFilterCategories = [categoryName];
                }
            } else { // Category quick filter
                if (isAlreadyActiveInAdvanced) {
                    selectedAdvancedFilterCategories = [];
                    selectedAdvancedFilterProfessions = [];
                } else {
                    selectedAdvancedFilterCategories = [categoryName];
                    selectedAdvancedFilterProfessions = [];
                }
            }


            updateAllFilterUIs();
            loadTalent();
        }
    }


    function populateProfessionsDropdown(container, selectedProfessionArray, dropdownToggle, selectedDisplay) {
        if (!container) return;
        container.innerHTML = '';
        currentLanguage = window.currentLanguage || 'en';
        translations = window.translations || {};
        const t = translations;

        const fragment = document.createDocumentFragment();

        let professionsToDisplay = [];
        const currentSelectedCategories = selectedAdvancedFilterCategories;

        if (currentSelectedCategories.length > 0) {
            currentSelectedCategories.forEach(catNameEn => {
                const category = talentCategories.find(c => c.name.en === catNameEn);
                if (category) {
                    professionsToDisplay = professionsToDisplay.concat(category.professions);
                }
            });
            // FIX: Sort professions by count, descending
            professionsToDisplay = [...new Set(professionsToDisplay)].sort((a, b) => {
                const countA = allTalentCountsByProfession[a] || 0;
                const countB = allTalentCountsByProfession[b] || 0;
                return countB - countA;
            });
        } else {
            // FIX: Sort all professions by count, descending
            professionsToDisplay = allProfessionsFlattened.sort((a, b) => {
                const countA = allTalentCountsByProfession[a] || 0;
                const countB = allTalentCountsByProfession[b] || 0;
                return countB - countA;
            });
        }

        if (professionsToDisplay.length === 0) {
            const noResultsDiv = document.createElement('div');
            noResultsDiv.className = 'no-results-message';
            noResultsDiv.textContent = t['no_matching_professions']?.[currentLanguage] || 'No matching professions found.';
            fragment.appendChild(noResultsDiv);
        } else {
            professionsToDisplay.forEach(professionEn => {
                const checkboxId = `${container.id}-profession-${professionEn.replace(/\s/g, '-')}`;
                const isChecked = selectedProfessionArray.includes(professionEn);

                let translatedProfessionName = professionEn;
                let foundProf = false;
                for (const cat of window.globalCategoriesAndProfessions) {
                    const prof = cat.professions.find(p => p.en === professionEn);
                    if (prof) {
                        translatedProfessionName = (prof.ar && currentLanguage === 'ar') ? prof.ar : prof.en;
                        foundProf = true;
                        break;
                    }
                }

                // FIX: Add a count to the profession item
                const professionCount = allTalentCountsByProfession[professionEn] || 0;

                const div = document.createElement('div');
                div.className = 'checkbox-item';
                div.innerHTML = `
                    <input type="checkbox" id="${checkboxId}" value="${professionEn}" ${isChecked ? 'checked' : ''}>
                    <label for="${checkboxId}">
                      ${translatedProfessionName}
                      <span class="count-bubble">${professionCount}</span>
                    </label>
                `;
                fragment.appendChild(div);
            });
        }
        container.appendChild(fragment);

        // Attach event listeners for checkboxes within this specific container
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.removeEventListener('change', handleProfessionCheckboxChange); // Prevent duplicates
            checkbox.addEventListener('change', handleProfessionCheckboxChange);
        });

        updateProfessionsDropdownTriggerText(selectedProfessionArray, dropdownToggle, selectedDisplay);
    }

    function handleProfessionCheckboxChange(event) {
        const professionEnName = event.target.value;

        if (event.target.checked) {
            if (!selectedAdvancedFilterProfessions.includes(professionEnName)) {
                selectedAdvancedFilterProfessions.push(professionEnName);
            }
        } else {
            selectedAdvancedFilterProfessions = selectedAdvancedFilterProfessions.filter(p => p !== professionEnName);
        }

        updateAllFilterUIs(); // Update all UIs, including quick filters and other dropdowns
        loadTalent(); // Apply filters immediately
    }

    function updateProfessionsDropdownTriggerText(selectedProfessionArray, dropdownToggle, selectedDisplay) {
        if (!selectedDisplay) return;
        currentLanguage = window.currentLanguage || 'en';
        translations = window.translations || {};
        const t = translations;

        if (selectedProfessionArray.length === 0) {
            selectedDisplay.textContent = t['all_professions']?.[currentLanguage] || 'All Professions';
            if (dropdownToggle) dropdownToggle.classList.remove('has-selection');
        } else {
            if (dropdownToggle) dropdownToggle.classList.add('has-selection');
            if (selectedProfessionArray.length === 1) {
                let translatedName = selectedProfessionArray[0];
                for (const cat of window.globalCategoriesAndProfessions) {
                    const prof = cat.professions.find(p => p.en === selectedProfessionArray[0]);
                    if (prof) {
                        translatedName = (prof.ar && currentLanguage === 'ar') ? prof.ar : prof.en;
                        break;
                    }
                }
                selectedDisplay.textContent = translatedName;
            } else {
                selectedDisplay.textContent = `${selectedProfessionArray.length} ${t['professions_selected']?.[currentLanguage] || 'Professions Selected'}`;
            }
        }
    }


    function populateCitiesDropdown(container, selectedCityArray, dropdownToggle, selectedDisplay) {
        if (!container) return;
        container.innerHTML = '';
        currentLanguage = window.currentLanguage || 'en';
        translations = window.translations || {};
        const t = translations;

        const fragment = document.createDocumentFragment();

        // Add "All Cities" option
        const allCitiesDiv = document.createElement('div');
        allCitiesDiv.className = 'checkbox-item';
        const isAllCitiesChecked = selectedCityArray.length === 0;
        allCitiesDiv.innerHTML = `
            <input type="checkbox" id="${container.id}-all-cities" value="all" ${isAllCitiesChecked ? 'checked' : ''}>
            <label for="${container.id}-all-cities">${t['all_cities']?.[currentLanguage] || 'All Cities'}</label>
        `;
        fragment.appendChild(allCitiesDiv);

        // Populate cities from translations object
        palestinianCitiesEnglishNames.forEach(cityEn => {
            const cityKey = Object.keys(palestinianCitiesData).find(key => palestinianCitiesData[key].en === cityEn);
            const translatedCityName = cityKey ? (palestinianCitiesData[cityKey][currentLanguage] || cityEn) : cityEn;
            const isChecked = selectedCityArray.includes(cityEn);
            const checkboxId = `${container.id}-city-${cityEn.replace(/\s/g, '-')}`;

            const div = document.createElement('div');
            div.className = 'checkbox-item';
            div.innerHTML = `
                <input type="checkbox" id="${checkboxId}" value="${cityEn}" ${isChecked ? 'checked' : ''}>
                <label for="${checkboxId}">${translatedCityName}</label>
            `;
            fragment.appendChild(div);
        });

        // Add "Remote Only" option
        const remoteOnlyDiv = document.createElement('div');
        remoteOnlyDiv.className = 'checkbox-item';
        const isRemoteOnlyChecked = selectedCityArray.includes('remote');
        remoteOnlyDiv.innerHTML = `
            <input type="checkbox" id="${container.id}-remote-only" value="remote" ${isRemoteOnlyChecked ? 'checked' : ''}>
            <label for="${container.id}-remote-only">${t['remote_only']?.[currentLanguage] || 'Remote Only'}</label>
        `;
        fragment.appendChild(remoteOnlyDiv);

        container.appendChild(fragment);

        // Attach event listeners for city checkboxes
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.removeEventListener('change', handleCityCheckboxChange); // Prevent duplicates
            checkbox.addEventListener('change', handleCityCheckboxChange);
        });

        updateCityDropdownTriggerText(selectedCityArray, dropdownToggle, selectedDisplay);
    }

    function handleCityCheckboxChange(event) {
        const cityValue = event.target.value;
        const container = event.target.closest('.checkbox-list'); // Changed from .dropdown-menu-checkboxes

        if (cityValue === 'all') {
            if (event.target.checked) {
                selectedCities = [];
                container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    if (cb.value !== 'all') cb.checked = false;
                    cb.closest('.checkbox-item').classList.toggle('active', cb.checked); // Sync active class
                });
            } else {
                if (selectedCities.length === 0) { // If "All" is unchecked and nothing else is selected, re-check "All"
                    const allCitiesCheckbox = container.querySelector('input[value="all"]');
                    if (allCitiesCheckbox) allCitiesCheckbox.checked = true;
                    allCitiesCheckbox.closest('.checkbox-item').classList.add('active');
                }
            }
        } else if (cityValue === 'remote') {
            if (event.target.checked) {
                selectedCities = ['remote'];
                container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    if (cb.value !== 'remote') cb.checked = false;
                    cb.closest('.checkbox-item').classList.toggle('active', cb.checked); // Sync active class
                });
            } else {
                if (selectedCities.length === 0) { // If "Remote" is unchecked and nothing else is selected, re-check "All"
                    const allCitiesCheckbox = container.querySelector('input[value="all"]');
                    if (allCitiesCheckbox) allCitiesCheckbox.checked = true;
                    allCitiesCheckbox.closest('.checkbox-item').classList.add('active');
                }
            }
        } else { // Individual city checkbox
            if (event.target.checked) {
                if (!selectedCities.includes(cityValue)) {
                    selectedCities.push(cityValue);
                }
            } else {
                selectedCities = selectedCities.filter(c => c !== cityValue);
            }
            // If any individual city is checked, uncheck "All Cities" and "Remote Only"
            const allCitiesCheckbox = container.querySelector('input[value="all"]');
            if (allCitiesCheckbox) {
                allCitiesCheckbox.checked = false;
                allCitiesCheckbox.closest('.checkbox-item').classList.remove('active');
            }
            const remoteOnlyCheckbox = container.querySelector('input[value="remote"]');
            if (remoteOnlyCheckbox) {
                remoteOnlyCheckbox.checked = false;
                remoteOnlyCheckbox.closest('.checkbox-item').classList.remove('active');
            }

            // If all individual cities are unchecked, and remote is not selected, check "All Cities"
            if (selectedCities.length === 0 && !selectedCities.includes('remote')) {
                if (allCitiesCheckbox) {
                    allCitiesCheckbox.checked = true;
                    allCitiesCheckbox.closest('.checkbox-item').classList.add('active');
                }
            }
        }
        event.target.closest('.checkbox-item').classList.toggle('active', event.target.checked); // Sync active class for clicked item

        updateAllFilterUIs(); // Update all UIs, including quick filters and other dropdowns
        loadTalent(); // Apply filters immediately
    }

    function updateCityDropdownTriggerText(selectedCityArray, dropdownToggle, selectedDisplay) {
        if (!selectedDisplay) return;
        currentLanguage = window.currentLanguage || 'en';
        translations = window.translations || {};
        const t = translations;

        if (selectedCityArray.length === 0) { // Means 'All Cities' is selected
            selectedDisplay.textContent = t['all_cities']?.[currentLanguage] || 'All Cities';
            if (dropdownToggle) dropdownToggle.classList.remove('has-selection');
        } else if (selectedCityArray.includes('remote')) {
            selectedDisplay.textContent = t['remote_only']?.[currentLanguage] || 'Remote Only';
            if (dropdownToggle) dropdownToggle.classList.add('has-selection');
        } else {
            if (dropdownToggle) dropdownToggle.classList.add('has-selection');
            if (selectedCityArray.length === 1) {
                const cityEn = selectedCityArray[0];
                const cityKey = Object.keys(palestinianCitiesData).find(key => palestinianCitiesData[key].en === cityEn);
                selectedDisplay.textContent = cityKey ? (palestinianCitiesData[cityKey][currentLanguage] || cityEn) : cityEn;
            } else {
                selectedDisplay.textContent = `${selectedCityArray.length} ${t['cities_selected']?.[currentLanguage] || 'Cities Selected'}`;
            }
        }
    }


    function populateCategoryDropdown(container, selectedCategoryArray, dropdownToggle, selectedDisplay) {
        if (!container) return;
        container.innerHTML = '';
        currentLanguage = window.currentLanguage || 'en';
        translations = window.translations || {};
        const t = translations;

        // FIX: Sort categories by count, descending
        const sortedTalentCategories = [...talentCategories].sort((a, b) => {
            const countA = allTalentCountsByCategory[a.name.en] || 0;
            const countB = allTalentCountsByCategory[b.name.en] || 0;
            return countB - countA;
        });

        const fragment = document.createDocumentFragment();

        sortedTalentCategories.forEach(category => {
            const checkboxId = `${container.id}-category-${category.name.en.replace(/\s/g, '-')}`;
            const isChecked = selectedCategoryArray.includes(category.name.en);
            const translatedCategoryName = category.name[currentLanguage] || category.name.en;
            const iconHtml = category.icon ? `<i class="${category.icon} category-icon"></i>` : '';

            // FIX: Add a count to the category item
            const categoryCount = allTalentCountsByCategory[category.name.en] || 0;

            const div = document.createElement('div');
            div.className = 'checkbox-item';
            div.innerHTML = `
                <input type="checkbox" id="${checkboxId}" value="${category.name.en}" ${isChecked ? 'checked' : ''}>
                <label for="${checkboxId}">
                    ${iconHtml} ${translatedCategoryName}
                    <span class="count-bubble">${categoryCount}</span>
                </label>
            `;
            fragment.appendChild(div);
        });

        container.appendChild(fragment);

        // Attach event listeners for checkboxes within this specific container
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.removeEventListener('change', handleCategoryCheckboxChange); // Prevent duplicates
            checkbox.addEventListener('change', handleCategoryCheckboxChange);
        });

        updateCategoryDropdownTriggerText(selectedCategoryArray, dropdownToggle, selectedDisplay);
    }

    function handleCategoryCheckboxChange(event) {
        const categoryEnName = event.target.value;

        if (event.target.checked) {
            if (!selectedAdvancedFilterCategories.includes(categoryEnName)) {
                selectedAdvancedFilterCategories.push(categoryEnName);
            }
        } else {
            selectedAdvancedFilterCategories = selectedAdvancedFilterCategories.filter(c => c !== categoryEnName);
        }

        updateAllFilterUIs(); // Update all UIs, including quick filters and other dropdowns
        loadTalent(); // Apply filters immediately
    }

    function updateCategoryDropdownTriggerText(selectedCategoryArray, dropdownToggle, selectedDisplay) {
        if (!selectedDisplay) return;
        currentLanguage = window.currentLanguage || 'en';
        translations = window.translations || {};
        const t = translations;

        if (selectedCategoryArray.length === 0) {
            selectedDisplay.textContent = t['all_categories']?.[currentLanguage] || 'All Categories';
            if (dropdownToggle) dropdownToggle.classList.remove('has-selection');
        } else {
            if (dropdownToggle) dropdownToggle.classList.add('has-selection');
            if (selectedCategoryArray.length === 1) {
                const categoryData = talentCategories.find(c => c.name.en === selectedCategoryArray[0]);
                selectedDisplay.textContent = categoryData ? (categoryData.name[currentLanguage] || categoryData.name.en) : selectedCategoryArray[0];
            } else {
                selectedDisplay.textContent = `${selectedCategoryArray.length} ${t['categories_selected']?.[currentLanguage] || 'Categories Selected'}`;
            }
        }
    }

    /**
     * Updates the text of a single-select custom dropdown trigger.
     * @param {HTMLElement} triggerElement The button element representing the custom dropdown trigger.
     * @param {string} selectedValue The value of the currently selected option.
     * @param {Array<Object>} options The array of all possible options for this dropdown.
     * @param {string} defaultValueKey The translation key for the default option (e.g., 'newest_first').
     */
    function updateSingleSelectTriggerText(triggerElement, selectedValue, options, defaultValueKey) {
        const lang = window.currentLanguage || 'en';
        const t = window.translations;
        const arrowIcon = '<i class="fas fa-chevron-down dropdown-arrow"></i>';

        let selectedOptionText = t[defaultValueKey] ? t[defaultValueKey][lang] : defaultValueKey; // Default to "Newest First" etc.

        if (selectedValue && selectedValue !== '') {
            const selectedOption = options.find(opt => opt.value === selectedValue);
            if (selectedOption) {
                selectedOptionText = t[selectedOption.key] ? t[selectedOption.key][lang] : selectedOption.value;
            }
        }
        if (triggerElement) { // Added defensive check
            triggerElement.innerHTML = `${selectedOptionText} ${arrowIcon}`;
        }
    }

    /**
     * Populates a custom dropdown menu with simple options (not checkboxes).
     * Used for Sort By.
     * @param {HTMLElement} menuElement The div element representing the custom dropdown menu.
     * @param {HTMLElement} triggerElement The button element representing the custom dropdown trigger.
     * @param {Array<Object>} options An array of objects, where each object has a 'value' and a 'key' (for translation).
     * @param {string} defaultValueKey The translation key for the default option's text.
     * @param {string} selectedValue The currently selected value.
     */
    function populateCustomDropdownSingleSelect(menuElement, triggerElement, options, defaultValueKey, selectedValue) {
        if (!menuElement || !triggerElement || !window.currentLanguage) return;

        menuElement.innerHTML = '';
        const lang = window.currentLanguage || 'en';
        const t = window.translations;

        options.forEach(option => {
            const optionText = t[option.key] ? t[option.key][lang] : option.value;
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.dataset.value = option.value;
            item.textContent = optionText;

            if (option.value === selectedValue) {
                item.classList.add('active');
            }

            item.addEventListener('click', () => {
                Array.from(menuElement.children).forEach(child => child.classList.remove('active'));
                item.classList.add('active');
                updateSingleSelectTriggerText(triggerElement, option.value, options, defaultValueKey);
                menuElement.closest('.custom-dropdown').classList.remove('active');
                loadTalent(); // Trigger talent load
            });
            menuElement.appendChild(item);
        });

        // Set initial trigger text based on selectedValue
        updateSingleSelectTriggerText(triggerElement, selectedValue, options, defaultValueKey);
    }

    // NEW: Moved handleDropdownToggleClick and handleDocumentClickToCloseDropdowns outside setupDropdownToggles
    function handleDropdownToggleClick(event, { toggle, container, checkboxes, selectedArray, selectedDisplay, populateFn }) {
        event.stopPropagation();

        // Close other open dropdowns
        document.querySelectorAll('.custom-dropdown.active').forEach(otherDropdown => {
            if (otherDropdown !== container) {
                otherDropdown.classList.remove('active');
                const otherToggle = otherDropdown.querySelector('.custom-dropdown-trigger');
                if (otherToggle) otherToggle.setAttribute('aria-expanded', false);
            }
        });

        container.classList.toggle('active');
        toggle.setAttribute('aria-expanded', container.classList.contains('active'));

        // For category, profession, city dropdowns, re-populate if opening
        if (container.classList.contains('active')) {
            if (populateFn) {
                populateFn(checkboxes, selectedArray, toggle, selectedDisplay);
            }
        }
    }

    function handleDocumentClickToCloseDropdowns(event) {
        document.querySelectorAll('.custom-dropdown.active').forEach(dropdown => {
            const trigger = dropdown.querySelector('.custom-dropdown-trigger');
            if (!dropdown.contains(event.target) && event.target !== trigger) {
                dropdown.classList.remove('active');
                if (trigger) trigger.setAttribute('aria-expanded', false);
            }
        });
    }


    function setupDropdownToggles() {
        const dropdowns = [
            { toggle: professionsDropdownToggle, container: professionsDropdown, checkboxes: professionsCheckboxesContainer, selectedArray: selectedAdvancedFilterProfessions, selectedDisplay: selectedProfessionsDisplay, populateFn: populateProfessionsDropdown },
            { toggle: categoryDropdownToggle, container: categoryDropdown, checkboxes: categoryCheckboxes, selectedArray: selectedAdvancedFilterCategories, selectedDisplay: selectedCategoriesDisplay, populateFn: populateCategoryDropdown },
            { toggle: cityDropdownToggle, container: cityDropdown, checkboxes: cityCheckboxes, selectedArray: selectedCities, selectedDisplay: selectedCitiesDisplay, populateFn: populateCitiesDropdown }
        ];

        customDropdowns.forEach(dropdown => { // This customDropdowns is now globally defined at the top
            const trigger = dropdown.querySelector('.custom-dropdown-trigger');
            const menu = dropdown.querySelector('.custom-dropdown-menu');

            if (trigger && menu) {
                trigger.removeEventListener('click', handleDropdownToggleClick); // Prevent duplicate listeners
                trigger.addEventListener('click', (event) => handleDropdownToggleClick(event, { // Pass config object
                    toggle: trigger,
                    container: dropdown,
                    checkboxes: menu.classList.contains('checkbox-list') ? menu : null, // Pass checkboxes if it's a checkbox list
                    selectedArray: dropdown.id.includes('category') ? selectedAdvancedFilterCategories :
                        (dropdown.id.includes('professions') ? selectedAdvancedFilterProfessions : selectedCities),
                    selectedDisplay: dropdown.querySelector('span[id^="selected"]'),
                    populateFn: dropdown.id.includes('category') ? populateCategoryDropdown :
                        (dropdown.id.includes('professions') ? populateProfessionsDropdown : populateCitiesDropdown)
                }));
            }
        });

        // Close dropdowns when clicking outside
        document.removeEventListener('click', handleDocumentClickToCloseDropdowns); // Prevent duplicate listeners
        document.addEventListener('click', handleDocumentClickToCloseDropdowns);
    }

    function updatePageTranslations() {
        currentLanguage = window.currentLanguage || 'en';
        translations = window.translations || {};

        document.querySelectorAll('[data-lang-key]').forEach(element => {
            const key = element.getAttribute('data-lang-key');
            if (translations[key] && translations[key][currentLanguage]) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translations[key][currentLanguage];
                } else {
                    if (element.children.length > 0 || element.innerHTML.includes('<') || element.innerHTML.includes('>')) {
                        element.innerHTML = translations[key][currentLanguage];
                    } else {
                        element.textContent = translations[key][currentLanguage];
                    }
                }
            }
        });

        populateQuickFilters(); // Re-populate quick filters to update counts and then update active states

        // Repopulate dropdowns for categories, professions, and cities to ensure translated options
    // Only populate if dropdown is active or if it's a trigger text that needs updating
    if (categoryDropdown) populateCategoryDropdown(categoryCheckboxes, selectedAdvancedFilterCategories, categoryDropdownToggle, selectedCategoriesDisplay);

    if (professionsDropdown) populateProfessionsDropdown(professionsCheckboxesContainer, selectedAdvancedFilterProfessions, professionsDropdownToggle, selectedProfessionsDisplay);

    if (cityDropdown) populateCitiesDropdown(cityCheckboxes, selectedCities, cityDropdownToggle, selectedCitiesDisplay);
}

    function showAccessDeniedModal(type) {
        currentLanguage = window.currentLanguage || 'en';
        translations = window.translations || {};

        if (!accessDeniedModal || !accessDeniedTitle || !accessDeniedMessage || !modalActions) {
            return;
        }
        modalActions.innerHTML = '';
        const t = translations;

        if (type === 'not_logged_in') {
            accessDeniedTitle.textContent = t['employer_access_required']?.[currentLanguage] || 'Employer Access Required';
            accessDeniedMessage.textContent = t['employer_access_message_unauthenticated']?.[currentLanguage] || 'This section is for employers to find talent. Please log in or sign up to continue.';

            const loginBtn = document.createElement('a');
            loginBtn.href = '/login.html';
            loginBtn.className = 'btn btn-primary';
            loginBtn.textContent = t['login']?.[currentLanguage] || 'Log In';

            const signupBtn = document.createElement('a');
            signupBtn.href = '/signup.html?type=employer';
            signupBtn.className = 'btn btn-outline-primary';
            signupBtn.textContent = t['signup_as_employer']?.[currentLanguage] || 'Sign Up as Employer';

            modalActions.appendChild(loginBtn);
            modalActions.appendChild(signupBtn);

        } else if (type === 'freelancer_access') {
            accessDeniedTitle.textContent = t['employer_access_required']?.[currentLanguage] || 'Employer Access Required';
            accessDeniedMessage.textContent = t['employer_access_message_freelancer']?.[currentLanguage] || 'You are currently logged in as a freelancer. This section is for employers.';

            const dashboardBtn = document.createElement('a');
            dashboardBtn.href = '/dashboard.html';
            dashboardBtn.className = 'btn btn-primary';
            dashboardBtn.textContent = t['go_to_my_dashboard']?.[currentLanguage] || 'Go to My Dashboard';

            const loginAsEmployerBtn = document.createElement('a');
            loginAsEmployerBtn.href = '/login.html?user_type=employer';
            loginAsEmployerBtn.className = 'btn btn-outline-secondary';
            loginAsEmployerBtn.textContent = t['login_as_employer']?.[currentLanguage] || 'Login as Employer';

            modalActions.appendChild(dashboardBtn);
            modalActions.appendChild(loginAsEmployerBtn);

        } else if (type === 'freelancer_privacy') {
            accessDeniedTitle.textContent = t['freelancer_privacy_title']?.[currentLanguage] || 'Freelancer Privacy';
            accessDeniedMessage.textContent = t['freelancer_privacy_message']?.[currentLanguage] || 'To protect privacy, freelancers cannot view other freelancer profiles.';

            const dashboardBtn = document.createElement('a');
            dashboardBtn.href = '/dashboard.html';
            dashboardBtn.className = 'btn btn-primary';
            dashboardBtn.textContent = t['go_to_my_dashboard']?.[currentLanguage] || 'Go to My Dashboard';

            modalActions.appendChild(dashboardBtn);

        } else if (type === 'profile_view_limit') {
            // Profile view limit reached modal is no longer needed as everything is unlimited
            return;
        }

        document.body.classList.add('no-scroll');
        accessDeniedModal.style.display = 'flex';
        accessDeniedModal.classList.add('show');
    }

    function hideAccessDeniedModal() {
        if (accessDeniedModal) accessDeniedModal.classList.remove('show');
        document.body.classList.remove('no-scroll');
        setTimeout(() => {
            if (accessDeniedModal) accessDeniedModal.style.display = 'none';
        }, 300);
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideAccessDeniedModal);
    }
    if (accessDeniedModal) {
        accessDeniedModal.addEventListener('click', (e) => {
            if (e.target === accessDeniedModal) {
                hideAccessDeniedModal();
            }
        });
    }

    function getTranslatedCityName(cityInput) {
        if (!cityInput) return '';
        const lang = window.currentLanguage || 'ar';
        const data = window.palestinianCitiesTranslations || {};
        
        // 1. Check if it's already a valid key (e.g., 'city_ad_dhahiriya')
        if (data[cityInput]) {
            return data[cityInput][lang] || data[cityInput].en;
        }

        // 2. Try to find by normalized English name
        // Normalize: replace underscores with spaces/hyphens and lowercase
        const normalize = (s) => String(s).toLowerCase().replace(/[_\s\-]/g, '');
        const normalizedInput = normalize(cityInput);

        const foundKey = Object.keys(data).find(key => {
            const cityData = data[key];
            return normalize(cityData.en) === normalizedInput || normalize(key.replace('city_', '')) === normalizedInput;
        });

        if (foundKey) {
            return data[foundKey][lang] || data[foundKey].en;
        }

        // 3. Fallback: Clean up the raw input for display (remove city_ prefix and underscores)
        let displayValue = cityInput.replace('city_', '').replace(/_/g, ' ');
        return displayValue.charAt(0).toUpperCase() + displayValue.slice(1);
    }

    function createTalentCard(talent) {
        const card = document.createElement('div');
        card.className = 'talent-card';

        const firstName = talent.first_name || '';
        const initials = `${firstName.charAt(0)}`.toUpperCase();

        // Cache translation lookups
        const moreTranslation = translations['more']?.[currentLanguage] || 'more';
        const viewProfileTranslation = translations['view_profile']?.[currentLanguage] || 'View Profile';

        // Primary Profession Display
        let primaryProfessionHtml = '';
        const mainProfession = talent.profession || '';
        let translatedMainProfession = mainProfession;

        if (mainProfession) {
            if (window.globalCategoriesAndProfessions) {
                for (const cat of window.globalCategoriesAndProfessions) {
                    const prof = cat.professions.find(p => p.en === mainProfession);
                    if (prof) {
                        translatedMainProfession = (prof.ar && currentLanguage === 'ar') ? prof.ar : prof.en;
                        break;
                    }
                }
            }
            primaryProfessionHtml = `<p class="talent-profession-display">${translatedMainProfession}</p>`;
        }

        // Interested Professions as Tags
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

        // Filter out the main profession from the tags list to avoid duplication
        const tagsToDisplay = interestedProfessionsArray.filter(p => p !== mainProfession).slice(0, 3);
        const remainingProfessionsCount = Math.max(0, interestedProfessionsArray.filter(p => p !== mainProfession).length - tagsToDisplay.length);

        let skillsHtml = '';
        if (tagsToDisplay.length > 0) {
            const skillTags = [];
            for (let i = 0; i < tagsToDisplay.length; i++) {
                const skill = tagsToDisplay[i];
                let translatedSkill = skill;
                
                if (window.globalCategoriesAndProfessions) {
                    for (const cat of window.globalCategoriesAndProfessions) {
                        const prof = cat.professions.find(p => p.en === skill);
                        if (prof) {
                            translatedSkill = (prof.ar && currentLanguage === 'ar') ? prof.ar : prof.en;
                            break;
                        }
                    }
                }
                skillTags.push(`<span class="skill-tag">${translatedSkill}</span>`);
            }
            skillsHtml = skillTags.join('');
        }

        const moreSkillsHtml = remainingProfessionsCount > 0
            ? `<span class="skill-tag skill-more">+${remainingProfessionsCount} ${moreTranslation}</span>`
            : '';

        const ratingHtml = talent.rating > 0
            ? `<div class="talent-rating-badge"><i class="fas fa-star"></i> <span>${talent.rating.toFixed(1)}</span></div>`
            : '';

        let avatarContent;
        if (talent.profile_picture_url) {
            avatarContent = `<img src="${talent.profile_picture_url}" class="talent-avatar-img" onerror="this.onerror=null; this.src='https://placehold.co/80x80/f1f5f9/64748b?text=${initials}';" alt="${firstName}">`;
        } else {
            avatarContent = `<div class="talent-avatar-initials">${initials}</div>`;
        }

        // Optimize location translation
        const translatedLocation = getTranslatedCityName(talent.location);

        const skillsContainerHtml = skillsHtml || moreSkillsHtml 
            ? `<div class="talent-skills-minimal">${skillsHtml}${moreSkillsHtml}</div>` 
            : '';

        card.innerHTML = `
            <div class="talent-card-inner">
                <div class="talent-card-top">
                    ${translatedLocation ? `
                    <div class="talent-city-badge">
                        <i class="fas fa-map-marker-alt"></i> ${translatedLocation}
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
                    <a href="${talent.slug ? `/${talent.slug}` : `/profile.html?id=${talent.id}`}" class="view-profile-cta" data-freelancer-id="${talent.id}">
                        <span data-lang-key="view_profile">${viewProfileTranslation}</span>
                        <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        `;

        // Don't add individual event listeners - use event delegation instead
        return card;
    }

    function resetFilters() {
        resetAllFiltersState();
        updateAllFilterUIs();
        const newUrl = window.location.pathname;
        window.history.pushState({}, '', newUrl);
        loadTalent();
    }

    async function loadTalent(isLoadMore = false) {
        currentLanguage = window.currentLanguage || 'en';
        translations = window.translations || {};

        if (loadingOverlay) loadingOverlay.classList.add('show');

        // Reset pagination state if this is a new search/filter (not load more)
        if (!isLoadMore) {
            currentOffset = 0;
            loadedTalentData = [];
            hasMoreTalent = true;
            isLoadingMore = false; // Reset loading state for new searches
            if (talentGrid) {
                talentGrid.innerHTML = '';
            }
        }

        if (noResults) noResults.style.display = 'none';

        const params = new URLSearchParams();

        if (currentSearchQuery) params.set('search', currentSearchQuery);

        // Send both professions and categories to the API
        if (selectedAdvancedFilterProfessions.length > 0) {
            params.set('professions', JSON.stringify(selectedAdvancedFilterProfessions));
        } else {
            params.delete('professions');
        }

        if (selectedAdvancedFilterCategories.length > 0) {
            params.set('category', JSON.stringify(selectedAdvancedFilterCategories));
        } else {
            params.delete('category');
        }

        if (selectedCities.length > 0) {
            params.set('location', JSON.stringify(selectedCities));
        } else {
            params.delete('location');
        }

        if (currentSkill) params.set('skills', currentSkill);
        params.set('sort', 'rating');

        // Add pagination parameters
        params.set('limit', ITEMS_PER_PAGE.toString());
        params.set('offset', currentOffset.toString());

        // Only update URL on initial load, not on load more
        if (!isLoadMore) {
            const urlParams = new URLSearchParams();
            if (currentSearchQuery) urlParams.set('search', currentSearchQuery);
            if (selectedAdvancedFilterProfessions.length > 0) {
                urlParams.set('professions', JSON.stringify(selectedAdvancedFilterProfessions));
            }
            if (selectedAdvancedFilterCategories.length > 0) {
                urlParams.set('category', JSON.stringify(selectedAdvancedFilterCategories));
            }
            if (selectedCities.length > 0) {
                urlParams.set('location', JSON.stringify(selectedCities));
            }
            if (currentSkill) urlParams.set('skills', currentSkill);
            urlParams.set('sort', 'rating');

            const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
            window.history.pushState({}, '', newUrl);
        }

        try {
            const response = await fetch(`/api/talent?${params.toString()}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            const data = await response.json();

            if (data && data.talent && Array.isArray(data.talent)) {

                // Update total count from server response
                if (data.totalCount !== null && data.totalCount !== undefined) {
                    totalTalentCount = data.totalCount;
                }

                // Optimize sorting algorithm - cache profile picture availability, and rating parsing
                data.talent.sort((a, b) => {
                    // Sort by profile picture availability (profiles with pictures first)
                    const aHasProfilePic = a.profile_picture_url &&
                        a.profile_picture_url !== null &&
                        a.profile_picture_url.trim() !== '';
                    const bHasProfilePic = b.profile_picture_url &&
                        b.profile_picture_url !== null &&
                        b.profile_picture_url.trim() !== '';

                    if (bHasProfilePic && !aHasProfilePic) return 1;
                    if (aHasProfilePic && !bHasProfilePic) return -1;

                    // Cache parsed ratings to avoid repeated parsing
                    const ratingA = a.rating || 0;
                    const ratingB = b.rating || 0;
                    return ratingB - ratingA;
                });

                // Filter out duplicates based on talent ID
                const existingIds = new Set(loadedTalentData.map(t => t.id));
                const newTalentData = data.talent.filter(talent => !existingIds.has(talent.id));

                // Add new talent to loaded data
                loadedTalentData = loadedTalentData.concat(newTalentData);

                // Check if there are more items to load
                hasMoreTalent = data.talent.length === ITEMS_PER_PAGE;

                if (newTalentData.length > 0) {
                    // Append new talent cards to the grid
                    newTalentData.forEach((talent, index) => {
                        const talentCard = createTalentCard(talent);
                        talentCard.style.animationDelay = `${index * 0.05}s`;
                        if (talentGrid) talentGrid.appendChild(talentCard);
                    });

                    // Update offset for next load (use original data length for server pagination)
                    currentOffset += data.talent.length;

                    // Show/hide load more button
                    updateLoadMoreButton();

                    if (noResults) noResults.style.display = 'none';
                } else if (!isLoadMore && loadedTalentData.length === 0) {
                    // Only show no results if this is initial load and no data at all
                    if (noResults) {
                        noResults.style.display = 'block';
                        const t = translations;
                        noResults.innerHTML = `
                            <div class="no-results-content">
                                <i class="fas fa-user-slash"></i>
                                <h3>${t['no_results_found']?.[currentLanguage] || 'No Results Found'}</h3>
                                <p>${t['no_talent_matching_criteria']?.[currentLanguage] || 'We couldn\'t find any professionals matching your criteria.'}</p>
                                <button id="clearFiltersFromNoResults" class="btn btn-outline" data-lang-key="clear_filters">${t['clear_filters']?.[currentLanguage] || 'Clear Filters'}</button>
                            </div>
                        `;
                        const newClearFiltersBtn = document.getElementById('clearFiltersFromNoResults');
                        if (newClearFiltersBtn) {
                            newClearFiltersBtn.addEventListener('click', resetFilters);
                        }
                    }
                }
            } else {
                throw new Error('Invalid data format received from server');
            }
        } catch (error) {
            console.error('Error loading talent:', error);
            if (talentGrid) {
                const t = translations;
                talentGrid.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3 data-lang-key="error_loading_talent">${t['error_loading_talent']?.[currentLanguage] || 'Error loading talent'}</h3>
                        <p>${t['try_again_later']?.[currentLanguage] || 'Please try again later.'}</p>
                    </div>
                `;
            }
        } finally {
            if (loadingOverlay) loadingOverlay.classList.remove('show');
            updatePageTranslations();
        }
    }

    // Function to update Load More button visibility
    function updateLoadMoreButton() {
        if (loadMoreContainer) {
            if (hasMoreTalent && loadedTalentData.length > 0) {
                loadMoreContainer.style.display = 'block';
            } else {
                loadMoreContainer.style.display = 'none';
            }
        }
    }

    // Function to load more talent
    async function loadMoreTalent() {
        if (!hasMoreTalent || isLoadingMore) return;

        isLoadingMore = true;
        try {
            await loadTalent(true); // true indicates this is a "load more" request
        } finally {
            isLoadingMore = false;
        }
    }

    // FIX: New function to calculate counts from the full, unfiltered dataset.
    function calculateInitialCounts(talentData) {
        allTalentCountsByCategory = {};
        allTalentCountsByProfession = {};

        talentData.forEach(talent => {
            let talentProfessions = new Set();

            // Add primary profession if it exists
            if (talent.profession) {
                talentProfessions.add(talent.profession);
            }

            // Add interested professions
            let interested = [];
            if (Array.isArray(talent.interested_professions)) {
                interested = talent.interested_professions;
            } else if (typeof talent.interested_professions === 'string') {
                try {
                    interested = JSON.parse(talent.interested_professions);
                    if (!Array.isArray(interested)) interested = [interested];
                } catch (e) {
                    interested = talent.interested_professions.split(',').map(s => s.trim());
                }
            }
            interested.forEach(p => talentProfessions.add(p));

            const categoriesForThisTalent = new Set();
            talentProfessions.forEach(profEn => {
                // Ensure case-insensitive match just in case varying casing exists in backend DB
                const profEnLower = typeof profEn === 'string' ? profEn.toLowerCase() : String(profEn).toLowerCase();
                const category = talentCategories.find(cat =>
                    cat.professions.some(p => p.toLowerCase() === profEnLower)
                );

                if (category) {
                    categoriesForThisTalent.add(category.name.en);
                    // Standardize to the exact casing from category to display nicely
                    const standardProf = category.professions.find(p => p.toLowerCase() === profEnLower) || profEn;
                    allTalentCountsByProfession[standardProf] = (allTalentCountsByProfession[standardProf] || 0) + 1;
                } else {
                    allTalentCountsByProfession[profEn] = (allTalentCountsByProfession[profEn] || 0) + 1;
                }
            });

            categoriesForThisTalent.forEach(catNameEn => {
                allTalentCountsByCategory[catNameEn] = (allTalentCountsByCategory[catNameEn] || 0) + 1;
            });
        });
    }

    async function initializePage() {
        try {
            if (pageLoadingOverlay) pageLoadingOverlay.classList.add('show');
            currentLanguage = window.currentLanguage || 'en';
            translations = window.translations || {};

            const authStatus = await checkAuthStatus();
            isAuthenticated = authStatus.isAuthenticated;
            currentUserType = authStatus.userType;
            employerVerificationStatus = authStatus.user?.profile?.verification_status || 'Not Submitted';

            if (mainContentWrapper) mainContentWrapper.style.display = 'block';

            // FIX: Fetch all talent data once at the beginning to get accurate counts
            const initialFetchResponse = await fetch('/api/talent');
            const initialData = await initialFetchResponse.json();
            if (initialData && initialData.talent) {
                allTalentDataUnfiltered = initialData.talent;
                calculateInitialCounts(allTalentDataUnfiltered);
            }

            // Populate all custom dropdowns initially
            // Categories (multi-select)
            if (categoryCheckboxes && categoryDropdownToggle && selectedCategoriesDisplay) {
                populateCategoryDropdown(categoryCheckboxes, selectedAdvancedFilterCategories, categoryDropdownToggle, selectedCategoriesDisplay);
            }

            // Professions (multi-select)
            if (professionsCheckboxesContainer && professionsDropdownToggle && selectedProfessionsDisplay) {
                populateProfessionsDropdown(professionsCheckboxesContainer, selectedAdvancedFilterProfessions, professionsDropdownToggle, selectedProfessionsDisplay);
            }

            // Cities (multi-select)
            if (cityCheckboxes && cityDropdownToggle && selectedCitiesDisplay) {
                populateCitiesDropdown(cityCheckboxes, selectedCities, cityDropdownToggle, selectedCitiesDisplay);
            }

            const urlParams = new URLSearchParams(window.location.search);
            currentSearchQuery = urlParams.get('search') || '';
            if (searchQueryHero) searchQueryHero.value = currentSearchQuery;

            const professionsFromUrl = urlParams.get('professions');
            if (professionsFromUrl) {
                try {
                    const parsedProfessions = JSON.parse(professionsFromUrl);
                    if (Array.isArray(parsedProfessions)) {
                        selectedAdvancedFilterProfessions = parsedProfessions;
                    }
                } catch (e) {
                    console.error("Error parsing professions from URL:", e);
                    selectedAdvancedFilterProfessions = [];
                }
            }

            const categoryFromUrl = urlParams.get('category');
            if (categoryFromUrl) {
                try {
                    const parsedCategories = JSON.parse(categoryFromUrl); // Expect array from API
                    if (Array.isArray(parsedCategories)) {
                        // Ensure the decodedCategory exists in our talentCategories before adding
                        selectedAdvancedFilterCategories = parsedCategories.filter(cat => talentCategories.some(c => c.name.en === cat));
                    } else { // Handle single string category from older URLs
                        const decodedCategory = decodeURIComponent(categoryFromUrl);
                        if (talentCategories.some(c => c.name.en === decodedCategory)) {
                            selectedAdvancedFilterCategories = [decodedCategory];
                        }
                    }
                } catch (e) {
                    console.error("Error parsing categories from URL:", e);
                    selectedAdvancedFilterCategories = [];
                }
            }


            const locationFromUrl = urlParams.get('location');
            if (locationFromUrl) {
                try {
                    const parsedLocations = JSON.parse(locationFromUrl);
                    if (Array.isArray(parsedLocations)) {
                        selectedCities = parsedLocations;
                    }
                } catch (e) {
                    console.error("Error parsing locations from URL:", e);
                    selectedCities = [];
                }
            }

            updateAllFilterUIs(); // Apply URL params to UI after initial population

            currentSkill = urlParams.get('skills') || '';

            await loadTalent();

            setupDropdownToggles();

        } catch (error) {
            console.error("Initialization error:", error);
            if (mainContentWrapper) mainContentWrapper.style.display = 'block';
            loadTalent();
        } finally {
            if (pageLoadingOverlay) pageLoadingOverlay.classList.remove('show');
        }
    }

    // Initial Load: Wait for translations to be applied before initializing the page
    window.addEventListener('translationsApplied', initializePage, { once: true });


    // Main search bar and button
    if (searchTalentButtonHero) searchTalentButtonHero.addEventListener('click', loadTalent);
    if (searchQueryHero) searchQueryHero.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentSearchQuery = searchQueryHero.value.trim();
            loadTalent();
        }
    });
    if (searchQueryHero) searchQueryHero.addEventListener('input', () => {
        currentSearchQuery = searchQueryHero.value.trim();
        debouncedLoadTalent();
    });

    // Clear Filters button
    if (clearFiltersSidebarBtn) clearFiltersSidebarBtn.addEventListener('click', resetFilters);

    // Load More button event listener
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreTalent);
    }

});
