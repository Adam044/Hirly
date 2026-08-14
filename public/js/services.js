document.addEventListener('DOMContentLoaded', async () => {
    const servicesGrid = document.getElementById('services-grid-container');
    const noServicesFound = document.getElementById('no-services-found');
    const searchInput = document.getElementById('service-search-input'); // New search input element
    const accessDeniedModal = document.getElementById('accessDeniedModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalActions = document.getElementById('modalActions');
    const modalIcon = document.getElementById('modalIcon');

    let allServices = []; // Store the full list of services
    let currentUserType = null;
    let employerVerificationStatus = null;
    let isAuthenticated = false;

    // Fetch user status once on page load
    const authStatus = await window.checkAuthStatus();
    isAuthenticated = authStatus.isAuthenticated;
    currentUserType = authStatus.userType;
    // Assuming user object includes 'profile' (which might be null if no profile exists)
    employerVerificationStatus = authStatus.user?.profile?.verification_status;

    function getCurrencySymbol(currencyCode) {
        switch (currencyCode) {
            case 'USD': return '$';
            case 'ILS': return '₪';
            case 'JOD': return 'JD';
            case 'EUR': return '€';
            default: return '';
        }
    }

    // Corrected translation function to handle cities and general keys
    function getTranslatedText(key, fallback) {
        const t = window.translations;
        const currentLang = window.currentLanguage;
        
        // Handle city translation lookup
        if (key === 'city' && typeof window.palestinianCitiesTranslations !== 'undefined' && fallback !== 'N/A') {
            const cityData = Object.values(window.palestinianCitiesTranslations).find(c => c.en === fallback);
            return cityData ? (cityData[currentLang] || fallback) : fallback;
        }

        // Handle general key translation
        return (t && t[key] && t[key][currentLang]) || fallback;
    }
    
    // Helper function for placeholder images (Matching logic used elsewhere)
    function getPlaceholderUrl(text, width = 40, height = 40) {
        return `https://placehold.co/${width}x${height}/059669/ffffff?text=${encodeURIComponent(text)}`;
    }


    function createLoadingSpinner(message) {
        return `
            <div class="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <i class="fas fa-spinner fa-spin text-4xl text-emerald-600"></i>
                <p class="mt-4 text-slate-500">${message}</p>
            </div>
        `;
    }

    function showAccessDeniedModal(type) {
        // ... (modal logic remains the same) ...
        if (!accessDeniedModal || !modalTitle || !modalMessage || !modalActions) {
            return;
        }
        modalActions.innerHTML = '';
        modalIcon.className = '';
        const t = window.translations;
        const currentLang = window.currentLanguage;

        // Use the new styled button classes for modal actions
        modalActions.classList.add('flex', 'flex-col', 'gap-2', 'md:flex-row', 'md:gap-4', 'justify-center');
        
        switch (type) {
            case 'not_logged_in':
                modalIcon.classList.add('fas', 'fa-lock', 'text-gray-400');
                modalTitle.textContent = getTranslatedText('employer_access_required', 'Employer Access Required');
                modalMessage.textContent = getTranslatedText('employer_access_message_unauthenticated', 'This section is for employers to find talent. Please log in or sign up to continue.');

                const loginBtn = document.createElement('a');
                loginBtn.href = '/login.html';
                // Using the styled button class
                loginBtn.className = 'view-profile-btn'; 
                loginBtn.textContent = getTranslatedText('login', 'Log In');

                const signupBtn = document.createElement('a');
                signupBtn.href = '/signup.html?user_type=employer';
                // Applying a secondary style
                signupBtn.className = 'view-profile-btn bg-slate-500 hover:bg-slate-600'; 
                signupBtn.textContent = getTranslatedText('signup_as_employer', 'Sign Up as Employer');

                modalActions.appendChild(loginBtn);
                modalActions.appendChild(signupBtn);
                break;
            case 'freelancer_access':
                modalIcon.classList.add('fas', 'fa-user-slash', 'text-red-500');
                modalTitle.textContent = getTranslatedText('employer_access_required', 'Employer Access Required');
                modalMessage.textContent = getTranslatedText('employer_access_message_freelancer', 'You are currently logged in as a professional. This section is for employers only.');

                const dashboardBtn = document.createElement('a');
                dashboardBtn.href = '/dashboard.html';
                dashboardBtn.className = 'view-profile-btn';
                dashboardBtn.textContent = getTranslatedText('go_to_my_dashboard', 'Go to My Dashboard');

                const loginAsEmployerBtn = document.createElement('a');
                loginAsEmployerBtn.href = '/login.html?user_type=employer';
                loginAsEmployerBtn.className = 'view-profile-btn bg-slate-500 hover:bg-slate-600';
                loginAsEmployerBtn.textContent = getTranslatedText('login_as_employer', 'Login as Employer');

                modalActions.appendChild(dashboardBtn);
                modalActions.appendChild(loginAsEmployerBtn);
                break;
            case 'unverified_employer':
                modalIcon.classList.add('fas', 'fa-user-check', 'text-yellow-500');
                modalTitle.textContent = getTranslatedText('verification_required_modal_title', 'Verification Required');
                modalMessage.textContent = getTranslatedText('talent_verification_required_message', 'To view profiles, your employer account\'s ID verification status must be Verified.');

                const goToProfileBtn = document.createElement('a');
                goToProfileBtn.href = '/hire_dashboard.html#employerProfileSection';
                goToProfileBtn.className = 'view-profile-btn';
                goToProfileBtn.textContent = getTranslatedText('go_to_profile', 'Go to Profile');

                const closeModalButton = document.createElement('button');
                closeModalButton.type = 'button';
                closeModalButton.className = 'view-profile-btn bg-slate-500 hover:bg-slate-600';
                closeModalButton.textContent = getTranslatedText('close_modal', 'Close');
                closeModalButton.addEventListener('click', hideAccessDeniedModal);

                modalActions.appendChild(goToProfileBtn);
                modalActions.appendChild(closeModalButton);
                break;
        }

        document.body.classList.add('no-scroll');
        accessDeniedModal.style.display = 'flex';
        accessDeniedModal.classList.add('show');
    }

    function hideAccessDeniedModal() {
        if (accessDeniedModal) {
            accessDeniedModal.classList.remove('show');
            document.body.classList.remove('no-scroll');
        }
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
    
    /**
     * Sorts services primarily by whether they have an image, then by creation date.
     * Services with an image appear first.
     * @param {Array<Object>} services 
     */
    function preRenderSort(services) {
        services.sort((a, b) => {
            const hasImageA = !!a.service_image_path;
            const hasImageB = !!b.service_image_path;

            if (hasImageA && !hasImageB) return -1; // A (with image) comes before B
            if (!hasImageA && hasImageB) return 1;  // B (with image) comes before A

            // Fallback: Sort by ID (proxy for creation date)
            return b.id - a.id;
        });
        return services;
    }


    // Function to render the services based on a provided list
    function renderServices(services) {
        if (!servicesGrid || !noServicesFound) return;
        
        // Sort services before rendering
        const sortedServices = preRenderSort(services);

        servicesGrid.innerHTML = '';
        if (sortedServices && sortedServices.length > 0) {
            noServicesFound.classList.add('hidden');
            sortedServices.forEach(service => {
                const freelancer = {
                    id: service.freelancer_id,
                    first_name: service.first_name,
                    last_name: service.last_name,
                    profile_picture_url: service.profile_picture_url,
                    city: service.city || service.freelancer_city || service.location || 'N/A' 
                };
                
                const freelancerName = `${freelancer.first_name || ''} ${freelancer.last_name || ''}`;
                const freelancerInitials = `${freelancer.first_name?.charAt(0) || ''}`.toUpperCase();
                const freelancerAvatarUrl = freelancer.profile_picture_url;
                const noImageAltText = getTranslatedText('no_image_available_alt', 'No Image Available');

                // --- Avatar Logic (Matching Talent Page) ---
                let avatarContent;
                if (freelancerAvatarUrl) {
                    avatarContent = `<img src="${freelancerAvatarUrl}" onerror="this.onerror=null; this.src='https://placehold.co/60x60/999999/ffffff?text=${freelancerInitials}';" alt="${freelancerName}">`;
                } else {
                    avatarContent = freelancerInitials;
                }

                let avatarContainerClass = 'freelancer-avatar';

                // --- FIXED: Image/Fallback Logic (Icon Only) ---
                let imageHtml;
                if (service.service_image_path) {
                    imageHtml = `
                        <img src="${service.service_image_path}"
                             alt="${service.service_title || noImageAltText}"
                             class="service-image"
                             onerror="this.onerror=null;this.src='https://placehold.co/400x200/CBD5E1/1A202C?text=${service.service_title || 'Service Image'}';">
                    `;
                } else {
                    imageHtml = `
                        <div class="service-icon-placeholder">
                            <i class="fas fa-toolbox"></i>
                        </div>
                    `;
                }
                
                const translatedCity = getTranslatedText('city', freelancer.city);

                const card = document.createElement('div');
                card.className = 'service-card';
                
                // Card HTML structure with clean styling
                card.innerHTML = `
                    ${imageHtml}
                    
                    <div class="service-card-content">
                        <h3 class="service-title">${service.service_title}</h3>
                        <p class="service-description">${service.service_description}</p>
                        
                        <div class="service-meta">
                            <div class="service-price">${getCurrencySymbol(service.currency)} ${service.price.toLocaleString()}</div>
                            <button type="button" class="view-profile-btn" data-freelancer-id="${freelancer.id}">
                                <i class="fas fa-eye"></i> <span data-lang-key="view_profile_btn">${getTranslatedText('view_profile_btn', 'View Profile')}</span>
                            </button>
                        </div>
                    </div>

                    <!-- Freelancer Info Footer (Centered) -->
                    <a href="#" class="freelancer-info-container" data-freelancer-id="${freelancer.id}">
                        <div class="${avatarContainerClass}">
                            ${avatarContent}
                        </div>
                        <div class="freelancer-info">
                            <div class="freelancer-name">${freelancerName || 'Professional'}</div>
                            <!-- FIXED: City display -->
                            <div class="freelancer-city">
                                <i class="fas fa-map-marker-alt"></i> <span>${translatedCity || getTranslatedText('not_available', 'N/A')}</span>
                            </div>
                        </div>
                    </a>
                `;

                const viewProfileBtn = card.querySelector('.view-profile-btn');
                const freelancerInfoLink = card.querySelector('.freelancer-info-container');
                
                // Attach the access check and redirect logic to both the button and the link
                const clickHandler = async (e) => {
                    e.preventDefault();
                    const freelancerId = e.currentTarget.dataset.freelancerId;

                    // Allow anyone to view freelancer profiles
                    window.location.href = `/profile.html?id=${freelancerId}`;
                };

                if (viewProfileBtn) viewProfileBtn.addEventListener('click', clickHandler);
                if (freelancerInfoLink) freelancerInfoLink.addEventListener('click', clickHandler);
                
                servicesGrid.appendChild(card);
            });
        } else {
            servicesGrid.innerHTML = '';
            noServicesFound.classList.remove('hidden');
        }
    }

    // Function to fetch all services
    async function fetchAllServices() {
        if (!servicesGrid || !noServicesFound) return;

        const loadingMessage = getTranslatedText('loading_services_spinner', 'Loading services...');
        servicesGrid.innerHTML = createLoadingSpinner(loadingMessage);
        noServicesFound.classList.add('hidden');

        try {
            const response = await fetch('/api/services');
            if (!response.ok) {
                throw new Error('Failed to fetch services.');
            }
            const data = await response.json();
            
            // Note: If the backend does not return `city` with the service,
            // this is the place where you'd have to merge the user data if needed.
            // For now, we assume `city` is included in the service object
            // for the sorting/display to work as requested.
            allServices = data.services.map(s => ({
                ...s,
                city: s.city || 'N/A' 
            })) || []; 
            
            renderServices(allServices);
        } catch (error) {
            console.error('Error fetching services:', error);
            servicesGrid.innerHTML = `
                <div class="empty-state w-full col-span-full text-center p-8">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-500"></i>
                    <p class="mt-4 text-red-600">${error.message}</p>
                </div>
            `;
        }
    }
    
    // Search and category filtering function
    function filterServices() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const allCategoriesCheckbox = document.getElementById('category-all');
        const categoryCheckboxes = document.querySelectorAll('input[name="categoryFilter"]:not(#category-all)');
        const selectedCategories = Array.from(categoryCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        
        const showAllCategories = allCategoriesCheckbox && allCategoriesCheckbox.checked;
        
        let filtered = allServices;
        
        // Apply category filter
        if (!showAllCategories && selectedCategories.length > 0) {
            filtered = filtered.filter(service => {
                return selectedCategories.includes(service.category);
            });
        }
        
        // Apply search filter
        if (query) {
            filtered = filtered.filter(service => {
                const title = service.service_title.toLowerCase();
                const description = service.service_description.toLowerCase();
                const freelancerName = `${service.first_name || ''} ${service.last_name || ''}`.toLowerCase();
                
                // Match against title, description, or freelancer name
                return title.includes(query) || 
                       description.includes(query) ||
                       freelancerName.includes(query);
            });
        }

        renderServices(filtered);
    }

    // Function to populate category dropdown
    function populateServiceCategoriesDropdown() {
        const categoryDropdownMenu = document.getElementById('categoryDropdownMenu');
        const categoryDropdownToggle = document.getElementById('categoryDropdownToggle');
        const selectedCategoryDisplay = document.getElementById('selectedCategoryDisplay');
        
        if (!categoryDropdownMenu || !window.globalCategoriesAndProfessions) return;

        const currentLang = window.currentLanguage || 'en';
        const t = window.translations;

        categoryDropdownMenu.innerHTML = '';
        
        // Add "All Categories" option
        const allCategoriesContainer = document.createElement('div');
        allCategoriesContainer.className = 'checkbox-item';
        
        const allCategoriesCheckbox = document.createElement('input');
        allCategoriesCheckbox.type = 'checkbox';
        allCategoriesCheckbox.name = 'categoryFilter';
        allCategoriesCheckbox.value = '';
        allCategoriesCheckbox.id = 'category-all';
        allCategoriesCheckbox.checked = true;
        
        const allCategoriesLabel = document.createElement('label');
        allCategoriesLabel.htmlFor = 'category-all';
        allCategoriesLabel.innerHTML = `<span>${(t && t['all_categories'] && t['all_categories'][currentLang]) || 'All Categories'}</span>`;
        
        allCategoriesContainer.appendChild(allCategoriesCheckbox);
        allCategoriesContainer.appendChild(allCategoriesLabel);
        categoryDropdownMenu.appendChild(allCategoriesContainer);
        
        // Add category options with icons
        const sortedCategories = window.globalCategoriesAndProfessions.sort((a, b) => {
            const nameA = a.name[currentLang] || a.name.en;
            const nameB = b.name[currentLang] || b.name.en;
            return nameA.localeCompare(nameB);
        });
        
        sortedCategories.forEach(category => {
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'checkbox-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'categoryFilter';
            checkbox.value = category.name.en;
            checkbox.id = `category-${category.name.en.replace(/\s+/g, '-').toLowerCase()}`;
            
            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            const iconHtml = category.icon ? `<i class="${category.icon} category-icon"></i>` : '';
            label.innerHTML = `${iconHtml} <span>${category.name[currentLang] || category.name.en}</span>`;
            
            checkboxContainer.appendChild(checkbox);
            checkboxContainer.appendChild(label);
            categoryDropdownMenu.appendChild(checkboxContainer);
        });
        
        // Add event listeners for category selection
        categoryDropdownMenu.addEventListener('change', function(e) {
            if (e.target.type === 'checkbox') {
                const allCategoriesCheckbox = document.getElementById('category-all');
                const categoryCheckboxes = categoryDropdownMenu.querySelectorAll('input[type="checkbox"]:not(#category-all)');
                
                if (e.target.id === 'category-all') {
                    // If "All Categories" is checked, uncheck all others
                    if (e.target.checked) {
                        categoryCheckboxes.forEach(cb => cb.checked = false);
                    }
                } else {
                    // If any specific category is checked, uncheck "All Categories"
                    if (e.target.checked) {
                        allCategoriesCheckbox.checked = false;
                    }
                    
                    // If no specific categories are selected, check "All Categories"
                    const checkedCategories = Array.from(categoryCheckboxes).filter(cb => cb.checked);
                    if (checkedCategories.length === 0) {
                        allCategoriesCheckbox.checked = true;
                    }
                }
                
                // Update display text
                updateCategoryDisplayText();
                
                // Filter services
                filterServices();
            }
        });
        
        // Function to update display text
        function updateCategoryDisplayText() {
            const allCategoriesCheckbox = document.getElementById('category-all');
            const categoryCheckboxes = categoryDropdownMenu.querySelectorAll('input[type="checkbox"]:not(#category-all)');
            const checkedCategories = Array.from(categoryCheckboxes).filter(cb => cb.checked);
            
            if (allCategoriesCheckbox.checked || checkedCategories.length === 0) {
                selectedCategoryDisplay.textContent = (t && t['all_categories'] && t['all_categories'][currentLang]) || 'All Categories';
            } else if (checkedCategories.length === 1) {
                const selectedCategory = window.globalCategoriesAndProfessions.find(cat => cat.name.en === checkedCategories[0].value);
                if (selectedCategory) {
                    const iconHtml = selectedCategory.icon ? `<i class="${selectedCategory.icon} category-icon"></i> ` : '';
                    selectedCategoryDisplay.innerHTML = `${iconHtml}${selectedCategory.name[currentLang] || selectedCategory.name.en}`;
                }
            } else {
                selectedCategoryDisplay.textContent = `${checkedCategories.length} ${(t && t['categories_selected'] && t['categories_selected'][currentLang]) || 'Categories Selected'}`;
            }
        }
        
        // Add dropdown toggle functionality
        if (categoryDropdownToggle) {
            categoryDropdownToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const dropdown = document.getElementById('categoryDropdown');
                const isOpen = dropdown.classList.contains('active');
                
                // Close all other dropdowns
                document.querySelectorAll('.custom-dropdown.active').forEach(dd => {
                    dd.classList.remove('active');
                });
                
                if (!isOpen) {
                    dropdown.classList.add('active');
                    categoryDropdownToggle.setAttribute('aria-expanded', 'true');
                } else {
                    dropdown.classList.remove('active');
                    categoryDropdownToggle.setAttribute('aria-expanded', 'false');
                }
            });
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('#categoryDropdown')) {
                document.getElementById('categoryDropdown').classList.remove('active');
                if (categoryDropdownToggle) {
                    categoryDropdownToggle.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }

    // Attach event listeners
    if (searchInput) {
        searchInput.addEventListener('input', filterServices);
    }

    // Initialize category dropdown and fetch services
    if (window.translations && window.globalCategoriesAndProfessions) {
        populateServiceCategoriesDropdown();
        fetchAllServices();
    } else {
        const initializeServices = () => {
            if (window.globalCategoriesAndProfessions) {
                populateServiceCategoriesDropdown();
            }
            fetchAllServices();
        };
        
        if (window.translations) {
            // Wait for categories to load
            if (window.globalCategoriesAndProfessions) {
                initializeServices();
            } else {
                // Check periodically for categories to load
                const checkCategories = setInterval(() => {
                    if (window.globalCategoriesAndProfessions) {
                        clearInterval(checkCategories);
                        initializeServices();
                    }
                }, 100);
            }
        } else {
            window.addEventListener('translationsLoaded', initializeServices, {
                once: true
            });
        }
    }
});
