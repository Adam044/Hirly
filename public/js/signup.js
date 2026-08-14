/**
 * signup.js - Core logic for the multi-step signup flow.
 * 
 * NOTE ON EXTERNAL ERRORS:
 * You may see errors like "ethereum.js" not found or FontAwesome kit preload warnings.
 * These are typically injected by browser extensions (e.g., MetaMask) or are
 * external CDN behaviors and do not affect the core functionality of Hirly.
 */

document.addEventListener('DOMContentLoaded', function() {
    // --- DOM Elements ---
    const signupForm = document.getElementById('signupForm');
    const signupMessage = document.getElementById('signupMessage');
    const progressIndicator = document.getElementById('progressIndicator');
    const stepIndicators = document.querySelectorAll('.step-indicator');
    const signupTitle = document.getElementById('signupTitle');
    const signupSubtitle = document.getElementById('signupSubtitle');

    const steps = {
        1: document.getElementById('step1'),
        2: {
            freelancer: document.getElementById('step2Freelancer'),
            employer: document.getElementById('step2Employer')
        },
        3: {
            personal: document.getElementById('step3Personal'),
            company: document.getElementById('step3Company')
        }
    };

    const categoriesDropdown = document.getElementById('categoriesDropdown');
    const categoriesToggleButton = document.getElementById('categoriesToggleButton');
    const categoriesCheckboxesContainer = document.getElementById('categoriesCheckboxes');
    const selectedCategoriesDisplay = document.getElementById('selectedCategoriesDisplay');

    const professionsDropdownContainer = document.getElementById('professionsDropdownContainer');
    const professionsToggleButton = document.getElementById('professionsToggleButton');
    const professionsList = document.getElementById('professionsList');
    const professionsCheckboxesContainer = document.getElementById('professionsCheckboxes');
    const selectedProfessionsDisplay = document.getElementById('selectedProfessionsDisplay');
    const selectedProfessionsTags = document.getElementById('selectedProfessionsTags');
    const categoriesScrollContainer = document.getElementById('categoriesScrollContainer');

    // Step 1 elements
    const initialUserTypeFreelancer = document.getElementById('initialUserTypeFreelancer');
    const initialUserTypeEmployer = document.getElementById('initialUserTypeEmployer');
    const userTypeCards = document.querySelectorAll('.user-type-card');


    // Step 2 Freelancer elements (REPLACEMENT)
    const statusSelection = document.getElementById('statusSelection');
    const interestsSection = document.getElementById('interestsSection');
    const interestCategoriesScrollContainer = document.getElementById('interestCategoriesScrollContainer');
    const interestProfessionsDropdownContainer = document.getElementById('interestProfessionsDropdownContainer');
    const interestProfessionsToggleButton = document.getElementById('interestProfessionsToggleButton');
    const interestProfessionsList = document.getElementById('interestProfessionsList');
    const interestProfessionsCheckboxes = document.getElementById('interestProfessionsCheckboxes');
    const selectedInterestsDisplay = document.getElementById('selectedInterestsDisplay');
    const selectedInterestsTags = document.getElementById('selectedInterestsTags');

    const professionDiscovery = document.getElementById('professionDiscovery');
    const studentFieldsContainer = document.getElementById('studentFieldsContainer');
    const universityYearContainer = document.getElementById('universityYearContainer');
    const schoolGradeContainer = document.getElementById('schoolGradeContainer');
    const universityYearSelect = document.getElementById('universityYear');
    const schoolGradeSelect = document.getElementById('schoolGrade');
    const mainCategorySelect = document.getElementById('mainCategorySelect');
    const mainProfessionSelect = document.getElementById('mainProfessionSelect');

    // Step 2 Employer elements
    const employerTypeIndividual = document.getElementById('employerTypeIndividual');
    const employerTypeCompany = document.getElementById('employerTypeCompany');

    // Step 3 Personal Info elements (for Freelancer and Individual Employer)
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const confirmEmailInput = document.getElementById('confirmEmail');
    const countryCodeSelect = document.getElementById('countryCode');
    const phoneInput = document.getElementById('phone');
    const countrySelect = document.getElementById('country');
    const citySelect = document.getElementById('city');
    const genderSelect = document.getElementById('gender');
    const birthdateInput = document.getElementById('birthdate');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const termsCheckbox = document.getElementById('terms');

    // Password requirements elements
    const reqLength = document.getElementById('req-length');
    const reqLowercase = document.getElementById('req-lowercase');
    const reqUppercase = document.getElementById('req-uppercase');
    const reqNumber = document.getElementById('req-number');

    // Step 3 Company details elements (for Company Employer)
    const companyNameInput = document.getElementById('companyName');
    const companyEmailInput = document.getElementById('companyEmail');
    const confirmCompanyEmailInput = document.getElementById('confirmCompanyEmail');
    const companyCountryCodeSelect = document.getElementById('companyCountryCode');
    const companyPhoneInput = document.getElementById('companyPhone');
    const addressInput = document.getElementById('address');
    const companyDescriptionInput = document.getElementById('companyDescription');
    // NEW: Company Category Dropdown elements
    const companyCategoriesDropdown = document.getElementById('companyCategoriesDropdown');
    const companyCategoriesToggleButton = document.getElementById('companyCategoriesToggleButton');
    const companyCategoriesList = document.getElementById('companyCategoriesList');
    const companySelectedCategoriesDisplay = document.getElementById('companySelectedCategoriesDisplay');
    const companyCategoriesCheckboxes = document.getElementById('companyCategoriesCheckboxes');
    const companyCategoryHiddenInput = document.getElementById('companyCategoryHidden'); // Hidden input for submission

    const companyPasswordInput = document.getElementById('companyPassword');
    const confirmCompanyPasswordInput = document.getElementById('confirmCompanyPassword');
    const companyTermsCheckbox = document.getElementById('companyTerms');


    // Navigation buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    // Spinners for buttons
    const nextSpinner = document.getElementById('nextSpinner');
    const submitSpinner = document.getElementById('submitSpinner'); // Corrected ID


    // --- State Variables ---
    let currentStep = 1;
    let userType = null;
    let employerType = null;
    let currentStatus = null;
    let selectedMainCategory = null;
    let selectedMainProfession = null;
    let selectedInterestedProfessions = [];
    let selectedInterestCategory = null; // Store currently selected category for interests
    let selectedCompanyCategory = null; // For company industry (stores English name)

    // Store original required attributes
    const originalRequiredElements = new Map();
    signupForm.querySelectorAll('input, select, textarea').forEach(control => {
        originalRequiredElements.set(control, control.hasAttribute('required'));
    });

    // --- Data for Dropdowns (Now loaded from globalCategoriesAndProfessions) ---
    // Ensure globalCategoriesAndProfessions is available before using it
    let talentCategories = [];
    if (window.globalCategoriesAndProfessions) {
        talentCategories = window.globalCategoriesAndProfessions;
    } else {
        console.warn("window.globalCategoriesAndProfessions is not defined. Ensure categories-professions-translations.js is loaded correctly.");
    }

    // Flatten all professions for search/display when no categories are selected
    // Ensure window.currentLanguage is available
    let allProfessionsFlattened = [];
    // This will be populated when populateProfessionsDropdown is called if no categories are selected
    // and window.currentLanguage is available.


    // Palestinian cities data (now using the global translation object)
    let palestinianCities = [];
    let menaCountries = [];

    function updateLocationData() {
        if (window.palestinianCitiesTranslations) {
            const translations = window.palestinianCitiesTranslations;
            
            // Extract countries
            const countryKeys = Object.keys(translations).filter(key => key.startsWith('country_'));
            
            // Separate 'Other' to keep it at the end
            const otherCountryKey = 'country_other';
            const mainCountryKeys = countryKeys.filter(key => key !== otherCountryKey);
            
            menaCountries = mainCountryKeys.map(key => ({
                key: key,
                ar: translations[key].ar,
                en: translations[key].en
            })).sort((a, b) => {
                // Palestine always on top
                if (a.key === 'country_palestine') return -1;
                if (b.key === 'country_palestine') return 1;
                
                const nameA = a[window.currentLanguage] || a.en;
                const nameB = b[window.currentLanguage] || b.en;
                return nameA.localeCompare(nameB);
            });

            // Add 'Other' at the end if it exists in translations
            if (translations[otherCountryKey]) {
                menaCountries.push({
                    key: otherCountryKey,
                    ar: translations[otherCountryKey].ar,
                    en: translations[otherCountryKey].en
                });
            }

            // Extract all cities (we'll filter them later based on selection)
            palestinianCities = Object.keys(translations)
                .filter(key => key.startsWith('city_'))
                .map(key => {
                    const countryKey = translations[key].country;
                    const countryEnName = translations[countryKey] ? translations[countryKey].en : countryKey;
                    return {
                        key: key,
                        ar: translations[key].ar,
                        en: translations[key].en,
                        country: countryEnName // Store English name for matching with select value
                    };
                });
        }
    }

    updateLocationData();


    const countryCodes = [
        { name: "Palestine", code: "+970" },
        { name: "Afghanistan", code: "+93" },
        { name: "Albania", code: "+355" },
        { name: "Algeria", code: "+213" },
        { name: "Andorra", code: "+376" },
        { name: "Angola", code: "+244" },
        { name: "Argentina", code: "+54" },
        { name: "Armenia", code: "+374" },
        { name: "Australia", code: "+61" },
        { name: "Austria", code: "+43" },
        { name: "Azerbaijan", code: "+994" },
        { name: "Bahrain", code: "+973" },
        { name: "Bangladesh", code: "+880" },
        { name: "Belarus", code: "+375" },
        { name: "Belgium", code: "+32" },
        { name: "Bolivia", code: "+591" },
        { name: "Bosnia and Herzegovina", code: "+387" },
        { name: "Brazil", code: "+55" },
        { name: "Bulgaria", code: "+359" },
        { name: "Cambodia", code: "+855" },
        { name: "Cameroon", code: "+237" },
        { name: "Canada", code: "+1" },
        { name: "Chile", code: "+56" },
        { name: "China", code: "+86" },
        { name: "Colombia", code: "+57" },
        { name: "Costa Rica", code: "+506" },
        { name: "Croatia", code: "+385" },
        { name: "Cuba", code: "+53" },
        { name: "Cyprus", code: "+357" },
        { name: "Czech Republic", code: "+420" },
        { name: "Denmark", code: "+45" },
        { name: "Dominican Republic", code: "+1" },
        { name: "Ecuador", code: "+593" },
        { name: "Egypt", code: "+20" },
        { name: "El Salvador", code: "+503" },
        { name: "Estonia", code: "+372" },
        { name: "Ethiopia", code: "+251" },
        { name: "Finland", code: "+358" },
        { name: "France", code: "+33" },
        { name: "Georgia", code: "+995" },
        { name: "Germany", code: "+49" },
        { name: "Ghana", code: "+233" },
        { name: "Greece", code: "+30" },
        { name: "Guatemala", code: "+502" },
        { name: "Honduras", code: "+504" },
        { name: "Hong Kong", code: "+852" },
        { name: "Hungary", code: "+36" },
        { name: "Iceland", code: "+354" },
        { name: "India", code: "+91" },
        { name: "Indonesia", code: "+62" },
        { name: "Iran", code: "+98" },
        { name: "Iraq", code: "+964" },
        { name: "Ireland", code: "+353" },
        { name: "Israel", code: "+972" },
        { name: "Italy", code: "+39" },
        { name: "Jamaica", code: "+1" },
        { name: "Japan", code: "+81" },
        { name: "Jordan", code: "+962" },
        { name: "Kazakhstan", code: "+7" },
        { name: "Kenya", code: "+254" },
        { name: "Kuwait", code: "+965" },
        { name: "Laos", code: "+856" },
        { name: "Latvia", code: "+371" },
        { name: "Lebanon", code: "+961" },
        { name: "Libya", code: "+218" },
        { name: "Liechtenstein", code: "+423" },
        { name: "Lithuania", code: "+370" },
        { name: "Luxembourg", code: "+352" },
        { name: "Macau", code: "+853" },
        { name: "Macedonia", code: "+389" },
        { name: "Malaysia", code: "+60" },
        { name: "Malta", code: "+356" },
        { name: "Mexico", code: "+52" },
        { name: "Moldova", code: "+373" },
        { name: "Monaco", code: "+377" },
        { name: "Mongolia", code: "+976" },
        { name: "Montenegro", code: "+382" },
        { name: "Morocco", code: "+212" },
        { name: "Myanmar", code: "+95" },
        { name: "Nepal", code: "+977" },
        { name: "Netherlands", code: "+31" },
        { name: "New Zealand", code: "+64" },
        { name: "Nicaragua", code: "+505" },
        { name: "Nigeria", code: "+234" },
        { name: "North Korea", code: "+850" },
        { name: "Norway", code: "+47" },
        { name: "Oman", code: "+968" },
        { name: "Pakistan", code: "+92" },
        { name: "Panama", code: "+507" },
        { name: "Paraguay", code: "+595" },
        { name: "Peru", code: "+51" },
        { name: "Philippines", code: "+63" },
        { name: "Poland", code: "+48" },
        { name: "Portugal", code: "+351" },
        { name: "Puerto Rico", code: "+1" },
        { name: "Qatar", code: "+974" },
        { name: "Romania", code: "+40" },
        { name: "Russia", code: "+7" },
        { name: "San Marino", code: "+378" },
        { name: "Saudi Arabia", code: "+966" },
        { name: "Serbia", code: "+381" },
        { name: "Singapore", code: "+65" },
        { name: "Slovakia", code: "+421" },
        { name: "Slovenia", code: "+386" },
        { name: "South Africa", code: "+27" },
        { name: "South Korea", code: "+82" },
        { name: "Spain", code: "+34" },
        { name: "Sri Lanka", code: "+94" },
        { name: "Sudan", code: "+249" },
        { name: "Sweden", code: "+46" },
        { name: "Switzerland", code: "+41" },
        { name: "Syria", code: "+963" },
        { name: "Taiwan", code: "+886" },
        { name: "Tajikistan", code: "+992" },
        { name: "Tanzania", code: "+255" },
        { name: "Thailand", code: "+66" },
        { name: "Tunisia", code: "+216" },
        { name: "Turkey", code: "+90" },
        { name: "Turkmenistan", code: "+993" },
        { name: "Ukraine", code: "+380" },
        { name: "United Arab Emirates", code: "+971" },
        { name: "United Kingdom", code: "+44" },
        { name: "United States", code: "+1" },
        { name: "Uruguay", code: "+598" },
        { name: "Uzbekistan", code: "+998" },
        { name: "Venezuela", code: "+58" },
        { name: "Vietnam", code: "+84" },
        { name: "Yemen", code: "+967" },
        { name: "Zambia", code: "+260" },
        { name: "Zimbabwe", code: "+263" }
    ].sort((a, b) => a.name.localeCompare(b.name));


    // --- Helper Functions ---
    function showSpinner(spinnerElement) {
        if (spinnerElement) {
            spinnerElement.classList.remove('hidden');
        }
    }

    function hideSpinner(spinnerElement) {
        if (spinnerElement) {
            spinnerElement.classList.add('hidden');
        }
    }

    function disableNavigationButtons(disabled) {
        if(nextBtn) nextBtn.disabled = disabled;
        if(prevBtn) prevBtn.disabled = disabled;
        if(submitBtn) submitBtn.disabled = disabled;
    }

    // Use global showToast from components.js

    function updateProgressIndicator() {
        const progressBar = document.getElementById('progressBar');
        const indicators = document.querySelectorAll('.step-indicator');

        // Update Progress Bar
        if (progressBar) {
            const progressWidth = ((currentStep - 1) / 2) * 100;
            progressBar.style.width = `${progressWidth}%`;
        }

        // Update Indicators
        indicators.forEach((indicator, index) => {
            const stepNum = index + 1;
            indicator.classList.remove('active', 'completed');
            
            if (stepNum === currentStep) {
                indicator.classList.add('active');
            } else if (stepNum < currentStep) {
                indicator.classList.add('completed');
            }
        });
    }

    function updateSkillsInputVisibility() {
        if (userType === 'freelancer') {
            if (skillsInputGroup) skillsInputGroup.style.display = 'block';
        } else {
            if (skillsInputGroup) skillsInputGroup.style.display = 'none';
        }
    }

    function manageRequiredAttributes(activeStepElement) {
        // First, remove 'required' from all form controls within the entire form
        signupForm.querySelectorAll('input, select, textarea').forEach(control => {
            control.removeAttribute('required');
        });

        // Then, apply 'required' only to controls within the active step
        if (activeStepElement) {
            activeStepElement.querySelectorAll('input, select, textarea').forEach(control => {
                // Restore original required state if it was originally required
                if (originalRequiredElements.has(control) && originalRequiredElements.get(control)) {
                    control.setAttribute('required', 'true');
                }
                // Special handling for fields that become mandatory for company type
                if (userType === 'employer' && employerType === 'company') {
                    if (control.id === 'address' || control.id === 'companyDescription' || control.id === 'companyCategoryHidden') {
                        control.setAttribute('required', 'true');
                    }
                }
            });
        }
    }


    function showStep(stepNum) {
        // Hide all steps first
        document.querySelectorAll('.signup-step').forEach(stepElement => {
            stepElement.classList.add('hidden');
            stepElement.classList.remove('animate-fade-in');
        });

        let targetStepElement = null;
        let titleKey = 'create_account_heading'; // Default to signup title
        let subtitleKey = 'join_community_subtitle'; // Default to signup subtitle

        if (stepNum === 1) {
            targetStepElement = steps[1];
        } else if (stepNum === 2) {
            if (userType === 'freelancer') {
                targetStepElement = steps[2].freelancer;
                titleKey = 'step_2_freelancer_heading';
                subtitleKey = 'step_2_freelancer_description';
                
                // Initialize the professional journey
                initProfessionalJourney();
            } else if (userType === 'employer') {
                targetStepElement = steps[2].employer;
                titleKey = 'step_2_employer_heading';
                subtitleKey = 'step_2_employer_description';
            } else {
                console.error('showStep: userType is not set for step 2. Resetting to step 1.');
                targetStepElement = steps[1];
                currentStep = 1;
            }
        } else if (stepNum === 3) {
            if (userType === 'freelancer' || (userType === 'employer' && employerType === 'individual')) {
                targetStepElement = steps[3].personal;
                titleKey = 'step_3_personal_heading';
                subtitleKey = 'step_3_personal_description';
            } else if (userType === 'employer' && employerType === 'company') {
                targetStepElement = steps[3].company;
                titleKey = 'step_3_company_heading';
                subtitleKey = 'step_3_company_description';
                populateCompanyCategoriesDropdown(); // Populate the new dropdown
            } else {
                console.error('showStep: userType or employerType is not set for step 3. Resetting to step 1.');
                targetStepElement = steps[1];
                currentStep = 1;
            }
        }

            if (targetStepElement) {
                targetStepElement.classList.remove('hidden');
                targetStepElement.classList.add('animate-fade-in');
            
            // Smooth scroll to top of the card
            const authCard = document.querySelector('.signup-card-compact');
            if (authCard) {
                authCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            console.error('No targetStepElement found for stepNum:', stepNum, 'userType:', userType, 'employerType:', employerType);
        }

        // Reset spinners when moving between steps
        hideSpinner(nextSpinner);
        hideSpinner(submitSpinner);
        disableNavigationButtons(false);

        // Manage required attributes AFTER the target step is displayed
        manageRequiredAttributes(targetStepElement);

    if (signupTitle) {
        signupTitle.dataset.langKey = titleKey;
        signupTitle.textContent = (window.translations && window.translations[titleKey] && window.translations[titleKey][window.currentLanguage]) || titleKey;
    }
    if (signupSubtitle) {
        signupSubtitle.dataset.langKey = subtitleKey;
        signupSubtitle.textContent = (window.translations && window.translations[subtitleKey] && window.translations[subtitleKey][window.currentLanguage]) || subtitleKey;
    }

        // Navigation buttons visibility
        if (prevBtn) {
            if (currentStep === 1) {
                prevBtn.classList.add('hidden');
            } else {
                prevBtn.classList.remove('hidden');
            }
        }
        
        if (nextBtn) {
            if (currentStep === 3) {
                nextBtn.classList.add('hidden');
            } else {
                nextBtn.classList.remove('hidden');
            }
        }
        
        if (submitBtn) {
            if (currentStep === 3) {
                submitBtn.classList.remove('hidden');
            } else {
                submitBtn.classList.add('hidden');
            }
        }

        // Reset spinners
        hideSpinner(nextSpinner);
        hideSpinner(submitSpinner);

        // Re-enable buttons after step is shown
        disableNavigationButtons(false);

        updateProgressIndicator();
        clearMessage();
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function clearMessage() {
        if (signupMessage) {
            signupMessage.textContent = '';
            signupMessage.className = 'mt-3 text-center hidden';
        }
    }

    function displayMessage(messageKey, type = 'danger') {
        const message = (window.translations && window.translations[messageKey] && window.translations[messageKey][window.currentLanguage]) || messageKey;
        if (signupMessage) {
            signupMessage.textContent = message;
            
            // Map common types to Tailwind colors
            let colorClass = 'text-slate-600';
            if (type === 'danger') colorClass = 'text-red-500 font-bold bg-red-50 py-3 px-6 rounded-2xl border border-red-100 shadow-sm';
            if (type === 'success') colorClass = 'text-hirly-600 font-bold bg-hirly-50 py-3 px-6 rounded-2xl border border-hirly-100 shadow-sm';
            if (type === 'info') colorClass = 'text-hirly-500 font-medium';
            if (type === 'warning') colorClass = 'text-amber-600 font-bold bg-amber-50 py-3 px-6 rounded-2xl border border-amber-100 shadow-sm';
            
            signupMessage.className = `mt-6 text-sm text-center animate-fade-in ${colorClass}`;
            signupMessage.classList.remove('hidden');
        }
    }

    // --- Professional Journey Logic (Step 2 Freelancer) ---
    function initProfessionalJourney() {
        // Reset state if needed
        currentStatus = null;
        selectedMainCategory = null;
        selectedMainProfession = null;
        selectedInterestedProfessions = [];
        selectedInterestCategory = null;
        
        // Reset UI
        if (interestsSection) interestsSection.classList.add('hidden');
        if (interestProfessionsDropdownContainer) {
            interestProfessionsDropdownContainer.classList.add('hidden', 'opacity-0', 'translate-y-2');
        }
        if (professionDiscovery) professionDiscovery.classList.add('hidden');
        if (professionsDropdownContainer) {
            professionsDropdownContainer.classList.add('hidden', 'opacity-0', 'translate-y-4');
        }
        
        const professionSection = document.getElementById('professionSection');
        if (professionSection) professionSection.classList.add('hidden');
        
        // Uncheck status radios
        document.querySelectorAll('input[name="currentStatus"]').forEach(radio => {
            radio.checked = false;
            const card = radio.closest('.status-card-new');
            if (card) {
                card.classList.remove('selected');
            }
        });

        // Add event listeners for status selection
        document.querySelectorAll('.status-card-new').forEach(card => {
            // Remove existing listener to avoid duplicates
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            
            newCard.addEventListener('click', function() {
                const radio = this.querySelector('input[name="currentStatus"]');
                if (radio) {
                    radio.checked = true;
                    currentStatus = radio.value;
                    
                    // Visual feedback
                    document.querySelectorAll('.status-card-new').forEach(c => {
                        c.classList.remove('selected');
                    });
                    
                    this.classList.add('selected');

                    // Show Interested Professions based on status
                    if (currentStatus === 'Student' || currentStatus === 'Other') {
                        if (interestsSection) {
                            interestsSection.classList.remove('hidden');
                            
                            // Update label for students
                            const label = interestsSection.querySelector('label[data-lang-key]');
                            if (label) {
                                const key = currentStatus === 'Student' ? 'student_interests_label' : 'interested_in_others_label';
                                label.setAttribute('data-lang-key', key);
                                const lang = window.currentLanguage || 'en';
                                label.textContent = window.translations?.[key]?.[lang] || label.textContent;
                            }
                            
                            populateInterestCategories();
                        }
                    } else {
                        // For Working/Freelancing, hide until a specific profession is chosen
                        if (interestsSection) {
                            interestsSection.classList.add('hidden');
                            // Reset label to default
                            const label = interestsSection.querySelector('label[data-lang-key]');
                            if (label) {
                                label.setAttribute('data-lang-key', 'interested_in_others_label');
                                const lang = window.currentLanguage || 'en';
                                label.textContent = window.translations?.['interested_in_others_label']?.[lang] || label.textContent;
                            }
                        }
                    }

                    // Show/Hide student fields or profession discovery
                    const studentFields = document.getElementById('studentFieldsContainer');
                    if (currentStatus === 'Student') {
                        if (professionDiscovery) professionDiscovery.classList.add('hidden');
                        if (studentFields) studentFields.classList.remove('hidden');
                        
                        // Default to university view if nothing selected
                        const selectedStudentType = document.querySelector('input[name="student_type"]:checked')?.value || 'University';
                        if (selectedStudentType === 'University') {
                            if (universityYearContainer) universityYearContainer.classList.remove('hidden');
                            if (schoolGradeContainer) schoolGradeContainer.classList.add('hidden');
                        } else {
                            if (universityYearContainer) universityYearContainer.classList.add('hidden');
                            if (schoolGradeContainer) schoolGradeContainer.classList.remove('hidden');
                        }
                    } else if (currentStatus === 'Working' || currentStatus === 'Freelancing') {
                        if (studentFields) studentFields.classList.add('hidden');
                        if (professionDiscovery) {
                            professionDiscovery.classList.remove('hidden');
                            populateFieldOfWorkCategories();
                        }
                        
                        if (!selectedMainCategory && professionsDropdownContainer) {
                            professionsDropdownContainer.classList.add('hidden', 'opacity-0', 'translate-y-4');
                        }
                    } else {
                        if (professionDiscovery) professionDiscovery.classList.add('hidden');
                        if (studentFields) studentFields.classList.add('hidden');
                        
                        selectedMainCategory = null;
                        selectedMainProfession = null;
                        
                        if (professionsDropdownContainer) {
                            professionsDropdownContainer.classList.add('hidden', 'opacity-0', 'translate-y-4');
                        }
                    }
                }
            });
        });

        // Toggle Interest Professions Dropdown
        if (interestProfessionsToggleButton) {
            interestProfessionsToggleButton.addEventListener('click', (e) => {
                e.stopPropagation();
                if (interestProfessionsList) interestProfessionsList.classList.toggle('hidden');
                const icon = interestProfessionsToggleButton.querySelector('i');
                if (icon) icon.classList.toggle('rotate-180');
            });
        }

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (interestProfessionsList && !interestProfessionsList.contains(e.target) && !interestProfessionsToggleButton.contains(e.target)) {
                interestProfessionsList.classList.add('hidden');
                const icon = interestProfessionsToggleButton?.querySelector('i');
                if (icon) icon.classList.remove('rotate-180');
            }
        });

        // Student Type Toggle (University vs School)
        document.querySelectorAll('input[name="student_type"]').forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'University') {
                    if (universityYearContainer) universityYearContainer.classList.remove('hidden');
                    if (schoolGradeContainer) schoolGradeContainer.classList.add('hidden');
                } else {
                    if (universityYearContainer) universityYearContainer.classList.add('hidden');
                    if (schoolGradeContainer) schoolGradeContainer.classList.remove('hidden');
                }
            });
        });
    }

    function populateInterestCategories() {
        if (!interestCategoriesScrollContainer || !talentCategories) return;
        interestCategoriesScrollContainer.innerHTML = '';

        const fragment = document.createDocumentFragment();

        talentCategories.forEach(category => {
            const categoryNameTranslated = category.name[window.currentLanguage] || category.name.en;
            const isSelected = selectedInterestCategory === category.name.en;
            
            const card = document.createElement('div');
            card.className = `flex-shrink-0 flex flex-col items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 group min-w-[100px] ${
                isSelected 
                ? 'bg-hirly-50 border-hirly-500 shadow-sm' 
                : 'bg-white border-slate-100 hover:border-hirly-200 hover:bg-slate-50'
            }`;
            
            card.innerHTML = `
                <div class="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isSelected ? 'bg-hirly-500 text-white shadow-md' : 'bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-hirly-500'
                }">
                    <i class="${category.icon} text-lg"></i>
                </div>
                <span class="text-xs font-bold whitespace-nowrap transition-colors ${
                    isSelected ? 'text-hirly-700' : 'text-slate-600 group-hover:text-hirly-600'
                }">${categoryNameTranslated}</span>
            `;

            card.addEventListener('click', () => handleInterestCategorySelection(category.name.en));
            fragment.appendChild(card);
        });

        interestCategoriesScrollContainer.appendChild(fragment);
    }

    function handleInterestCategorySelection(categoryEnName) {
        selectedInterestCategory = categoryEnName;
        
        // Update UI
        populateInterestCategories();
        
        // Show professions dropdown for this category
        if (interestProfessionsDropdownContainer) {
            interestProfessionsDropdownContainer.classList.remove('hidden');
            setTimeout(() => {
                interestProfessionsDropdownContainer.classList.remove('opacity-0', 'translate-y-2');
            }, 10);
            populateInterestProfessionsDropdown(categoryEnName);
        }

        // Update display text for the professions dropdown to reset it
        if (selectedInterestsDisplay) {
            updateInterestedProfessionsUI();
        }
    }

    function populateInterestProfessionsDropdown(categoryEn) {
        if (!interestProfessionsCheckboxes || !talentCategories) return;
        interestProfessionsCheckboxes.innerHTML = '';

        const category = talentCategories.find(c => c.name.en === categoryEn);
        if (!category || !category.professions) return;

        const fragment = document.createDocumentFragment();

        category.professions.forEach(profession => {
            // Don't show the already chosen primary profession
            if (selectedMainProfession && profession.en === selectedMainProfession) return;

            const profNameTranslated = profession[window.currentLanguage] || profession.en;
            const isSelected = selectedInterestedProfessions.includes(profession.en);

            const label = document.createElement('label');
            label.className = 'flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-all group';
            label.innerHTML = `
                <div class="flex-grow">
                    <p class="text-xs font-bold ${isSelected ? 'text-hirly-600' : 'text-slate-700'} group-hover:text-hirly-600 transition-colors">${profNameTranslated}</p>
                </div>
                <div class="w-5 h-5 rounded-md border-2 ${isSelected ? 'border-hirly-500 bg-hirly-500' : 'border-slate-200'} flex items-center justify-center transition-all">
                    <i class="fas fa-check text-[8px] text-white ${isSelected ? 'opacity-100' : 'opacity-0'}"></i>
                </div>
            `;

            label.addEventListener('click', (e) => {
                e.preventDefault();
                toggleInterestedProfession(profession.en);
            });

            fragment.appendChild(label);
        });

        interestProfessionsCheckboxes.appendChild(fragment);
    }

    function toggleInterestedProfession(profEnName) {
        const index = selectedInterestedProfessions.indexOf(profEnName);
        if (index > -1) {
            selectedInterestedProfessions.splice(index, 1);
        } else {
            if (selectedInterestedProfessions.length < 5) {
                selectedInterestedProfessions.push(profEnName);
            } else {
                displayMessage('max_5_professions_error', 'warning');
            }
        }
        updateInterestedProfessionsUI();
        
        // Find which category this profession belongs to to refresh the list
        let categoryEn = null;
        talentCategories.some(cat => {
            if (cat.professions.some(p => p.en === profEnName)) {
                categoryEn = cat.name.en;
                return true;
            }
            return false;
        });
        
        if (categoryEn) {
            populateInterestProfessionsDropdown(categoryEn);
        }
    }

    function updateInterestedProfessionsUI() {
        if (!selectedInterestsTags || !selectedInterestsDisplay) return;
        
        selectedInterestsTags.innerHTML = '';
        
        if (selectedInterestedProfessions.length > 0) {
            selectedInterestsDisplay.textContent = `${selectedInterestedProfessions.length} ${window.translations?.professions_selected?.[window.currentLanguage] || 'selected'}`;
            
            selectedInterestedProfessions.forEach(profEn => {
                // Find translation
                let profTranslated = profEn;
                talentCategories.some(cat => {
                    const found = cat.professions.find(p => p.en === profEn);
                    if (found) {
                        profTranslated = found[window.currentLanguage] || found.en;
                        return true;
                    }
                    return false;
                });

                const tag = document.createElement('div');
                tag.className = 'flex items-center gap-2 px-3 py-1.5 bg-hirly-50 text-hirly-600 rounded-full text-[10px] font-bold border border-hirly-100 animate-fade-in';
                tag.innerHTML = `
                    <span>${profTranslated}</span>
                    <button type="button" class="hover:text-hirly-800 transition-colors">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                tag.querySelector('button').addEventListener('click', () => {
                    toggleInterestedProfession(profEn);
                });
                selectedInterestsTags.appendChild(tag);
            });
        } else {
            selectedInterestsDisplay.textContent = window.translations?.interested_professions_placeholder?.[window.currentLanguage] || 'Select professions...';
        }
    }

    function validateStep(stepNum) {
        clearMessage();
        let isValid = true;
        let activeStepElement;

        if (stepNum === 1) {
            activeStepElement = steps[1];
            const selectedUserType = document.querySelector('input[name="initialUserType"]:checked');
            if (!selectedUserType) {
                displayMessage('select_user_type_error', 'danger'); // Using translation key
                isValid = false;
            } else {
                userType = selectedUserType.value; // Correctly setting the userType state variable here
            }
        } else if (stepNum === 2) {
            if (userType === 'freelancer') {
                activeStepElement = steps[2].freelancer;
                
                if (!currentStatus) {
                    displayMessage('select_status_error', 'danger');
                    isValid = false;
                }

                // Require at least 1 Interested Profession for EVERYONE
                if (isValid && selectedInterestedProfessions.length === 0) {
                    displayMessage('select_at_least_one_interest', 'danger');
                    isValid = false;
                }
                
                // Require 1 Current Profession ONLY for Working/Freelancing
                if (isValid && (currentStatus === 'Working' || currentStatus === 'Freelancing')) {
                    if (!selectedMainCategory || !selectedMainProfession) {
                        displayMessage('select_category_and_profession_error', 'danger');
                        isValid = false;
                    }
                }

                if (isValid && currentStatus === 'Student') {
                    const studentType = document.querySelector('input[name="student_type"]:checked').value;
                    if (studentType === 'University') {
                        if (!universityYearSelect.value.trim()) {
                            displayMessage('fill_all_student_fields', 'danger');
                            isValid = false;
                        }
                    } else if (studentType === 'School') {
                        if (!schoolGradeSelect.value.trim()) {
                            displayMessage('fill_all_student_fields', 'danger');
                            isValid = false;
                        }
                    }
                }
            } else if (userType === 'employer') {
                activeStepElement = steps[2].employer;
                const selectedEmployerType = document.querySelector('input[name="employerType"]:checked');
                if (!selectedEmployerType) {
                    displayMessage('select_employer_type_error', 'danger'); // Using translation key
                    isValid = false;
                }
            }
        } else if (stepNum === 3) {
            if (userType === 'freelancer' || (userType === 'employer' && employerType === 'individual')) {
                activeStepElement = steps[3].personal;
                const personalInputs = activeStepElement.querySelectorAll('input[required], select[required], textarea[required]');
                for (let input of personalInputs) {
                    if (!input.value.trim()) {
                        displayMessage('fill_all_personal_fields', 'danger'); // Using translation key
                        isValid = false;
                        break;
                    }
                }
                if (isValid && !validatePassword(passwordInput.value)) {
                    displayMessage('password_simple_requirements', 'danger'); // Using translation key
                    isValid = false;
                }
                if (isValid && emailInput.value !== confirmEmailInput.value) {
                    displayMessage('emails_do_not_match', 'danger');
                    isValid = false;
                }
                if (isValid && passwordInput.value !== confirmPasswordInput.value) {
                    displayMessage('passwords_do_not_match', 'danger');
                    isValid = false;
                }
                // Validate birthdate if provided (should be a valid date and not in the future)
                if (isValid && birthdateInput.value.trim()) {
                    const birthDate = new Date(birthdateInput.value);
                    const today = new Date();
                    if (birthDate > today) {
                        displayMessage('birthdate_future_error', 'danger'); // Using translation key
                        isValid = false;
                    }
                }
                if (isValid && !termsCheckbox.checked) {
                    displayMessage('agree_to_terms_error', 'danger'); // Using translation key
                    isValid = false;
                }
            } else if (userType === 'employer' && employerType === 'company') {
                activeStepElement = steps[3].company;
                const companyInputs = activeStepElement.querySelectorAll('input[required], select[required], textarea[required]');
                for (let input of companyInputs) {
                    // All company fields are now required
                    if (!input.value.trim()) {
                        displayMessage('fill_all_company_fields', 'danger'); // Using translation key
                        isValid = false;
                        break;
                    }
                }
                // Validate company category selection (hidden input)
                if (isValid && !companyCategoryHiddenInput.value) { // Check the value of the hidden input
                    displayMessage('select_company_industry', 'danger'); // Using translation key
                    isValid = false;
                }
                if (isValid && !validatePassword(companyPasswordInput.value)) {
                    displayMessage('password_simple_requirements', 'danger'); // Using translation key
                    isValid = false;
                }
                if (isValid && companyEmailInput.value !== confirmCompanyEmailInput.value) {
                    displayMessage('emails_do_not_match', 'danger');
                    isValid = false;
                }
                if (isValid && companyPasswordInput.value !== confirmCompanyPasswordInput.value) {
                    displayMessage('passwords_do_not_match', 'danger'); // Using translation key
                    isValid = false;
                }
                if (isValid && !companyTermsCheckbox.checked) {
                    displayMessage('agree_to_terms_error', 'danger'); // Using translation key
                    isValid = false;
                }
            }
        }
        return isValid;
    }

    function populateDropdown(selectElement, options, selectedValue = null) {
        if (!selectElement) return;
        selectElement.innerHTML = '';
        let defaultOptionTextKey = "";
        let defaultOptionValue = "";

        const id = selectElement.id;
        const currentLang = window.currentLanguage || localStorage.getItem('hirlyLang') || 'ar';

        if (id === 'city') {
            defaultOptionTextKey = "select_your_city_placeholder";
        } else if (id === 'country') {
            defaultOptionTextKey = "select_country_placeholder";
        } else if (id === 'countryCode' || id === 'companyCountryCode') {
            defaultOptionTextKey = "select_country_code_placeholder";
        }

        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = (window.translations && window.translations[defaultOptionTextKey] && window.translations[defaultOptionTextKey][currentLang]) || defaultOptionTextKey;
        defaultOption.disabled = true;
        defaultOption.selected = true;
        selectElement.appendChild(defaultOption);

        if (!options || !Array.isArray(options)) return;

        options.forEach(option => {
            const optionElement = document.createElement('option');
            
            if (id === 'city' || id === 'country') {
                // Handle country/city objects: { key, ar, en, ... }
                // Use English name as the value to be saved in DB, fallback to key if en is missing
                const val = option.en || option.key || (typeof option === 'string' ? option : '');
                const text = option[currentLang] || option.en || (typeof option === 'string' ? option : 'Unknown');
                
                optionElement.value = val;
                optionElement.textContent = text;
                
                if (val === selectedValue || option.key === selectedValue) optionElement.selected = true;
            } else if (id === 'countryCode' || id === 'companyCountryCode') {
                // Handle country code objects: { name, code }
                const val = option.code || (typeof option === 'string' ? option : '');
                const name = option.name || (typeof option === 'string' ? option : 'Unknown');
                
                optionElement.value = val;
                optionElement.textContent = `${name} (${val})`;
                
                if (val === selectedValue) optionElement.selected = true;
            } else {
                // Fallback for simple strings or other structures
                const val = typeof option === 'object' ? (option.value || option.key || JSON.stringify(option)) : option;
                const text = typeof option === 'object' ? (option.label || option.name || option.en || JSON.stringify(option)) : option;
                
                optionElement.value = val;
                optionElement.textContent = text;
                
                if (val === selectedValue) optionElement.selected = true;
            }
            
            selectElement.appendChild(optionElement);
        });
    }


    // --- Category & Profession Logic ---
    function populateFieldOfWorkCategories() {
        if (!categoriesScrollContainer) return;
        categoriesScrollContainer.innerHTML = '';

        if (!talentCategories || talentCategories.length === 0) {
            console.warn("talentCategories not available.");
            return;
        }

        const fragment = document.createDocumentFragment();

        talentCategories.forEach(category => {
            const categoryNameTranslated = category.name[window.currentLanguage] || category.name.en;
            const isSelected = selectedMainCategory === category.name.en;
            
            const card = document.createElement('div');
            card.className = `flex-shrink-0 flex flex-col items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 group min-w-[100px] ${
                isSelected 
                ? 'bg-hirly-50 border-hirly-500 shadow-sm' 
                : 'bg-white border-slate-100 hover:border-hirly-200 hover:bg-slate-50'
            }`;
            
            card.innerHTML = `
                <div class="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isSelected ? 'bg-hirly-500 text-white shadow-md' : 'bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-hirly-500'
                }">
                    <i class="${category.icon} text-lg"></i>
                </div>
                <span class="text-xs font-bold whitespace-nowrap transition-colors ${
                    isSelected ? 'text-hirly-700' : 'text-slate-600 group-hover:text-hirly-600'
                }">${categoryNameTranslated}</span>
            `;

            card.addEventListener('click', () => handleCategorySelection(category.name.en));
            fragment.appendChild(card);
        });

        categoriesScrollContainer.appendChild(fragment);
    }

    function handleCategorySelection(categoryEnName) {
        selectedMainCategory = categoryEnName;
        selectedMainProfession = null; // Reset profession when category changes
        
        // Hide interests section if profession is reset
        if (interestsSection && (currentStatus === 'Working' || currentStatus === 'Freelancing')) {
            interestsSection.classList.add('hidden');
        }

        // Update horizontal scroll UI
        populateFieldOfWorkCategories();
        
        // Show professions dropdown container and populate it
        if (professionsDropdownContainer) {
            professionsDropdownContainer.classList.remove('hidden');
            // Remove opacity and translate classes to make it visible with transition
            setTimeout(() => {
                professionsDropdownContainer.classList.remove('opacity-0', 'translate-y-4');
            }, 10);
            populateProfessionsDropdown();
        }

        // Reset display for profession
        updateSelectedProfessionsDisplay();
    }

    function populateProfessionsDropdown() {
        if (!professionsCheckboxesContainer || !selectedMainCategory) return;
        professionsCheckboxesContainer.innerHTML = '';

        const category = talentCategories.find(c => c.name.en === selectedMainCategory);
        if (!category || !category.professions) return;

        const fragment = document.createDocumentFragment();

        category.professions.forEach(profession => {
            const profNameTranslated = profession[window.currentLanguage] || profession.en;
            const label = document.createElement('label');
            label.className = 'flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-all group';
            
            const isSelected = selectedMainProfession === profession.en;

            label.innerHTML = `
                <div class="flex-grow">
                    <p class="text-sm font-bold ${isSelected ? 'text-hirly-600' : 'text-slate-700'} group-hover:text-hirly-600 transition-colors">${profNameTranslated}</p>
                </div>
                <input type="radio" name="talentProfession" value="${profession.en}" class="hidden" ${isSelected ? 'checked' : ''}>
                <div class="w-5 h-5 rounded-full border-2 ${isSelected ? 'border-hirly-500 bg-hirly-500' : 'border-slate-200'} flex items-center justify-center transition-all">
                    <i class="fas fa-check text-[8px] text-white ${isSelected ? 'opacity-100' : 'opacity-0'}"></i>
                </div>
            `;

            label.addEventListener('click', function(e) {
                e.preventDefault();
                handleProfessionSelection(profession.en);
            });

            fragment.appendChild(label);
        });

        professionsCheckboxesContainer.appendChild(fragment);
        updateSelectedProfessionsDisplay();
    }

    function handleProfessionSelection(profEnName) {
        selectedMainProfession = profEnName;
        updateSelectedProfessionsDisplay();
        
        // Remove from interests if already selected as primary
        const interestIndex = selectedInterestedProfessions.indexOf(profEnName);
        if (interestIndex > -1) {
            selectedInterestedProfessions.splice(interestIndex, 1);
            updateInterestedProfessionsUI();
        }

        // Show interests section now that profession is selected
        if (interestsSection) {
            interestsSection.classList.remove('hidden');
            
            // Ensure correct label
            const label = interestsSection.querySelector('label[data-lang-key]');
            if (label) {
                label.setAttribute('data-lang-key', 'interested_in_others_label');
                const lang = window.currentLanguage || 'en';
                label.textContent = window.translations?.['interested_in_others_label']?.[lang] || label.textContent;
            }
            
            populateInterestCategories();
        }

        // Close dropdown
        if (professionsList) {
            professionsList.classList.add('hidden');
            professionsToggleButton.setAttribute('aria-expanded', 'false');
            if (professionsToggleButton.querySelector('i')) {
                professionsToggleButton.querySelector('i').classList.remove('rotate-180');
            }
        }
    }

    function updateSelectedProfessionsDisplay() {
        if (!selectedProfessionsDisplay) return;
        
        if (selectedMainProfession) {
            const category = talentCategories.find(c => c.name.en === selectedMainCategory);
            if (category) {
                const profession = category.professions.find(p => p.en === selectedMainProfession);
                if (profession) {
                    const name = profession[window.currentLanguage] || profession.en;
                    selectedProfessionsDisplay.innerHTML = `<span class="text-slate-800 font-bold">${name}</span>`;
                }
            }
        } else {
            const key = 'select_profession_placeholder';
            selectedProfessionsDisplay.textContent = (window.translations && window.translations[key] && window.translations[key][window.currentLanguage]) || 'Select Profession';
        }
    }

    // NEW: Function to populate company industry categories dropdown
    function populateCompanyCategoriesDropdown() {
        if (!companyCategoriesCheckboxes) return;
        companyCategoriesCheckboxes.innerHTML = '';

        // Ensure talentCategories is populated
        if (!window.globalCategoriesAndProfessions) {
            console.warn("globalCategoriesAndProfessions not available for company categories dropdown.");
            return;
        }
        const currentTalentCategories = window.globalCategoriesAndProfessions;

        // Sort by translated name
        const allCompanyCategoriesSorted = [...currentTalentCategories].sort((a, b) => {
            const nameA = a.name[window.currentLanguage] || a.name.en;
            const nameB = b.name[window.currentLanguage] || b.name.en;
            return nameA.localeCompare(nameB);
        });
        
        const fragment = document.createDocumentFragment();

        allCompanyCategoriesSorted.forEach(category => {
            const categoryNameTranslated = category.name[window.currentLanguage] || category.name.en;
            const label = document.createElement('label');
            label.className = 'flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-all group';
            // Use the English name as the value for consistency in data handling
            label.innerHTML = `
                <div class="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-hirly-50 group-hover:text-hirly-500 transition-colors">
                    <i class="${category.icon || 'fas fa-tag'} text-xs"></i>
                </div>
                <div class="flex-grow">
                    <p class="text-sm font-bold ${selectedCompanyCategory === category.name.en ? 'text-hirly-600' : 'text-slate-700'} group-hover:text-hirly-600 transition-colors">${categoryNameTranslated}</p>
                </div>
                <input type="radio" name="companyIndustryCategory" value="${category.name.en}" class="hidden" ${selectedCompanyCategory === category.name.en ? 'checked' : ''}>
                <div class="w-5 h-5 rounded-full border-2 ${selectedCompanyCategory === category.name.en ? 'border-hirly-500 bg-hirly-500' : 'border-slate-200'} flex items-center justify-center transition-all">
                    <i class="fas fa-check text-[8px] text-white ${selectedCompanyCategory === category.name.en ? 'opacity-100' : 'opacity-0'}"></i>
                </div>
            `;
            label.addEventListener('click', function(e) {
                e.preventDefault();
                handleCompanyCategorySelection(category.name.en);
            });
            fragment.appendChild(label);
        });

        companyCategoriesCheckboxes.appendChild(fragment);
        updateCompanySelectedCategoryDisplay(); // Update display after populating
    }

    // NEW: Handler for company category selection
    function handleCompanyCategorySelection(categoryEnName) {
        selectedCompanyCategory = categoryEnName; // This value is the English name
        if (companyCategoryHiddenInput) companyCategoryHiddenInput.value = selectedCompanyCategory; // Update hidden input
        updateCompanySelectedCategoryDisplay();
        
        // Close dropdown after selection
        if (companyCategoriesList) {
            companyCategoriesList.classList.add('hidden');
            if (companyCategoriesToggleButton) {
                companyCategoriesToggleButton.setAttribute('aria-expanded', 'false');
                const icon = companyCategoriesToggleButton.querySelector('i');
                if (icon) icon.classList.remove('rotate-180');
            }
        }
    }

    // NEW: Function to update company category display text
    function updateCompanySelectedCategoryDisplay() {
        if (!companySelectedCategoriesDisplay || !window.translations || !window.currentLanguage) return;
        
        const key = 'select_industry_category_display';
        const selectIndustryCategoryDisplay = (window.translations && window.translations[key] && window.translations[key][window.currentLanguage]) || 'Select Industry/Category';
        
        if (selectedCompanyCategory) {
            // Find the category object using the stored English name
            const category = talentCategories.find(c => c.name.en === selectedCompanyCategory);
            if (category) {
                const categoryNameTranslated = category.name[window.currentLanguage] || category.name.en;
                companySelectedCategoriesDisplay.innerHTML = `
                    <div class="flex items-center gap-3 overflow-hidden">
                        <i class="${category.icon || 'fas fa-tag'} text-hirly-500 text-xs md:text-sm"></i>
                        <span class="truncate font-bold text-slate-800">${categoryNameTranslated}</span>
                    </div>
                `;
            } else {
                companySelectedCategoriesDisplay.textContent = selectIndustryCategoryDisplay;
            }
        } else {
            companySelectedCategoriesDisplay.textContent = selectIndustryCategoryDisplay;
        }
    }





    // --- Event Listeners ---
    // Update Step 1 User Type Selection
    document.querySelectorAll('.user-type-card-new').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('.user-type-card-new').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');

            const radio = this.querySelector('input[name="initialUserType"]');
            if(radio) {
                radio.checked = true;
                userType = radio.value;
            }
        });
    });

    // Update Employer Type Selection in Step 2
    document.querySelectorAll('[data-employer-type]').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('[data-employer-type]').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            
            const radio = this.querySelector('input[name="employerType"]');
            if (radio) {
                radio.checked = true;
                employerType = radio.value;
            }
        });
    });

    // Toggle logic for Professions dropdown (Freelancer)
    if (professionsToggleButton) {
        professionsToggleButton.addEventListener('click', function(event) {
            event.stopPropagation();
            if (professionsList) {
                const isHidden = professionsList.classList.toggle('hidden');
                this.setAttribute('aria-expanded', !isHidden);
                const icon = this.querySelector('i');
                if (icon) {
                    if (isHidden) icon.classList.remove('rotate-180');
                    else icon.classList.add('rotate-180');
                }
                if (!isHidden) {
                    populateProfessionsDropdown();
                }
            }
        });
    }

    // Toggle logic for Company Categories dropdown (Employer)
    if (companyCategoriesToggleButton) {
        companyCategoriesToggleButton.addEventListener('click', function(event) {
            event.stopPropagation();
            if (companyCategoriesList) {
                const isHidden = companyCategoriesList.classList.toggle('hidden');
                this.setAttribute('aria-expanded', !isHidden);
                
                const icon = this.querySelector('i');
                if (icon) {
                    if (isHidden) icon.classList.remove('rotate-180');
                    else icon.classList.add('rotate-180');
                }
                
                if (!isHidden) {
                    populateCompanyCategoriesDropdown();
                }
            }
        });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        // Close Field of Work Professions dropdown
        if (professionsList && !professionsList.contains(event.target) && event.target !== professionsToggleButton) {
            professionsList.classList.add('hidden');
            if (professionsToggleButton) {
                professionsToggleButton.setAttribute('aria-expanded', 'false');
                const icon = professionsToggleButton.querySelector('i');
                if (icon) icon.classList.remove('rotate-180');
            }
        }
        // Close Company Categories dropdown
        if (companyCategoriesList && !companyCategoriesList.contains(event.target) && event.target !== companyCategoriesToggleButton) {
            companyCategoriesList.classList.add('hidden');
            if (companyCategoriesToggleButton) {
                companyCategoriesToggleButton.setAttribute('aria-expanded', 'false');
                const icon = companyCategoriesToggleButton.querySelector('i');
                if (icon) icon.classList.remove('rotate-180');
            }
        }
    });

    nextBtn.addEventListener('click', function() {
        if (validateStep(currentStep)) {
            showSpinner(nextSpinner); // Show spinner only if validation passes
            disableNavigationButtons(true); // Disable buttons
            currentStep++;
            showStep(currentStep);
        }
    });

    // Updated password validation function to match server requirements
    function validatePassword(password) {
        const hasMinLength = password.length >= 8;
        const hasLowercase = /[a-z]/.test(password);
        const hasUppercase = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        return hasMinLength && hasLowercase && hasUppercase && hasNumber;
    }

    prevBtn.addEventListener('click', function() {
        currentStep--;
        showStep(currentStep);
        window.scrollTo(0, 0);
    });

    signupForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        clearMessage();

        // Validate password before proceeding
        const passwordField = document.getElementById('password');
        if (passwordField && passwordField.value) {
            const isPasswordValid = validatePassword(passwordField.value);
            if (!isPasswordValid) {
                displayMessage('password_simple_requirements', 'danger');
                return;
            }
        }

        if (validateStep(currentStep)) {
            const data = {};
            
            // Collect common fields
            data.initialUserType = userType;
            // Map frontend 'freelancer' to backend 'professional' - current_status distinguishes them
            data.userType = userType === 'freelancer' ? 'professional' : userType;

            if (userType === 'freelancer') {
                // Freelancers are stored as professionals with currentStatus = 'Freelancing'
                data.firstName = firstNameInput.value;
                data.lastName = lastNameInput.value;
                data.email = emailInput.value;
                data.gender = genderSelect.value;
                data.birthdate = birthdateInput.value;
                data.country = countrySelect.value;
                data.city = citySelect.value;
                data.password = passwordInput.value;
                data.currentStatus = currentStatus;
                data.interests = JSON.stringify(selectedInterestedProfessions);

                if (currentStatus === 'Student') {
                    const studentType = document.querySelector('input[name="student_type"]:checked').value;
                    data.studentType = studentType;
                    if (studentType === 'University') {
                        data.universityYear = universityYearSelect.value;
                    } else {
                        data.schoolGrade = schoolGradeSelect.value;
                    }
                } else {
                    data.mainProfession = selectedMainProfession;
                    data.mainCategory = selectedMainCategory;
                }
            } else if (userType === 'employer') {
                data.employerType = employerType;
                if (employerType === 'individual') {
                    data.firstName = firstNameInput.value;
                    data.lastName = lastNameInput.value;
                    data.email = emailInput.value;
                    data.country = countrySelect.value;
                    data.city = citySelect.value;
                    data.password = passwordInput.value;
                } else if (employerType === 'company') {
                    data.companyName = companyNameInput.value;
                    data.companyEmail = companyEmailInput.value;
                    data.companyPhone = (document.getElementById('companyCountryCode')?.value || '') + companyPhoneInput.value.replace(/\s/g, '');
                    data.address = addressInput.value;
                    data.companyDescription = companyDescriptionInput.value;
                    data.companyCategory = selectedCompanyCategory;
                    data.password = companyPasswordInput.value;
                }
            }

            // Combine phone number inputs
            const countryCodeInput = document.getElementById(userType === 'employer' && employerType === 'company' ? 'companyCountryCode' : 'countryCode');
            const phoneInputRaw = document.getElementById(userType === 'employer' && employerType === 'company' ? 'companyPhone' : 'phone');
            data.phone = (countryCodeInput?.value || '') + (phoneInputRaw?.value || '').replace(/\s/g, '');

            // --- Phase 5: Claim Job Injection ---
            const urlParams = new URLSearchParams(window.location.search);
            const claimJobId = urlParams.get('claimJobId');
            if (claimJobId) {
                data.claimJobId = claimJobId;
            }

            // Use the correct email field for personal/individual
            if (userType === 'freelancer' || (userType === 'employer' && employerType === 'individual')) {
                 data.email = emailInput.value;
            }

            displayMessage('signing_up_message', 'info'); // Using translation key
            showSpinner(submitSpinner);
            disableNavigationButtons(true);

            try {
                const response = await fetch('/api/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    showToast(result.message || 'account_created_success', 'success'); // Using translation key
                    signupForm.reset();
                    // Reset dropdowns and selections
                    populateDropdown(countrySelect, menaCountries);
                    populateDropdown(citySelect, []);
                    populateDropdown(countryCodeSelect, countryCodes, '+970');
                    populateDropdown(companyCountryCodeSelect, countryCodes, '+970');
                    
                    currentStatus = null;
                    selectedMainCategory = null;
                    selectedMainProfession = null;
                    selectedCompanyCategory = null;
                    updateCompanySelectedCategoryDisplay(); // Update company category display
                    populateCompanyCategoriesDropdown(); // Re-populate company categories

                    setTimeout(() => {
                        window.location.href = result.redirect;
                    }, 1500);
                } else {
                    displayMessage(result.error || 'signup_failed', 'danger'); // Using translation key
                }
            } catch (error) {
                console.error('Error during signup:', error);
                displayMessage('unexpected_error_occurred', 'danger'); // Using translation key
            } finally {
                hideSpinner(submitSpinner);
                disableNavigationButtons(false);
            }
        }
    });

    // --- Helper Functions ---
    function isValidURL(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
    // --- Initializations ---
    // Listen for translationsApplied event to re-populate dropdowns with correct language
    window.addEventListener('translationsApplied', () => {
        // Re-initialize location arrays with current language translations
        updateLocationData();
        
        const currentCountry = countrySelect.value || 'Palestine';
        populateDropdown(countrySelect, menaCountries, currentCountry);
        
        // If a country is already selected, filter and re-populate cities
        if (countrySelect && countrySelect.value) {
            const filteredCities = palestinianCities.filter(c => c.country === countrySelect.value)
                .sort((a, b) => {
                    const nameA = a[window.currentLanguage] || a.en;
                    const nameB = b[window.currentLanguage] || b.en;
                    return nameA.localeCompare(nameB);
                });
            populateDropdown(citySelect, filteredCities, citySelect.value);
        } else {
            populateDropdown(citySelect, []); // Keep it empty if no country selected
        }

        populateDropdown(countryCodeSelect, countryCodes, '+970');
        populateDropdown(companyCountryCodeSelect, countryCodes, '+970');
        populateCompanyCategoriesDropdown(); // Re-populate company categories
        updateCompanySelectedCategoryDisplay(); // Update company category display
        showStep(currentStep); // Re-render current step to apply translations
    });

    document.querySelectorAll('#signupForm input, #signupForm select, #signupForm textarea').forEach(control => {
        originalRequiredElements.set(control, control.hasAttribute('required'));
    });

    // Initial population on DOMContentLoaded
    updateLocationData();
    populateDropdown(countrySelect, menaCountries, 'Palestine');
    
    // Trigger city population for default country (Palestine)
    if (countrySelect && countrySelect.value === 'Palestine') {
        const filteredCities = palestinianCities.filter(c => c.country === 'Palestine')
            .sort((a, b) => {
                const nameA = a[window.currentLanguage] || a.en;
                const nameB = b[window.currentLanguage] || b.en;
                return nameA.localeCompare(nameB);
            });
        populateDropdown(citySelect, filteredCities);
    } else {
        populateDropdown(citySelect, []); // Start with empty cities until country is chosen
    }

    // Handle Country Change to filter Cities
    if (countrySelect) {
        countrySelect.addEventListener('change', function() {
            const selectedCountryKey = this.value;
            if (selectedCountryKey) {
                // Filter cities
                const filteredCities = palestinianCities.filter(c => c.country === selectedCountryKey)
                    .sort((a, b) => {
                        const nameA = a[window.currentLanguage] || a.en;
                        const nameB = b[window.currentLanguage] || b.en;
                        return nameA.localeCompare(nameB);
                    });
                populateDropdown(citySelect, filteredCities);

                // Auto-update country code (phone prefix) for UX
                const countryObj = menaCountries.find(c => c.key === selectedCountryKey);
                if (countryObj && countryCodeSelect) {
                    const countryNameEn = countryObj.en;
                    // Special cases for mapping
                    let searchName = countryNameEn;
                    if (searchName === 'United Arab Emirates') searchName = 'United Arab Emirates';
                    
                    const match = countryCodes.find(cc => cc.name === searchName);
                    if (match) {
                        countryCodeSelect.value = match.code;
                    }
                }
            } else {
                populateDropdown(citySelect, []);
            }
        });
    }

    populateDropdown(countryCodeSelect, countryCodes, '+970');
    populateDropdown(companyCountryCodeSelect, countryCodes, '+970');
    populateCompanyCategoriesDropdown(); // Initial population for company categories

    // Password validation event listeners
    if (passwordInput) {
        passwordInput.addEventListener('input', () => validatePasswordUI(passwordInput, {
            length: reqLength,
            lowercase: reqLowercase,
            uppercase: reqUppercase,
            number: reqNumber
        }));
    }
    if (companyPasswordInput) {
        companyPasswordInput.addEventListener('input', () => validatePasswordUI(companyPasswordInput, {
            length: document.getElementById('req-length-company'),
            lowercase: document.getElementById('req-lowercase-company'),
            uppercase: document.getElementById('req-uppercase-company'),
            number: document.getElementById('req-number-company')
        }));
    }

    showStep(currentStep);

    // --- Handle URL Parameters (Phase 5: Claim & Convert) ---
    const urlParams = new URLSearchParams(window.location.search);
    const prefillEmail = urlParams.get('email');
    const prefillType = urlParams.get('type');
    const claimJobId = urlParams.get('claimJobId');

    if (prefillType === 'employer') {
        userType = 'employer';
        // Auto-select Employer card in Step 1
        const employerCard = document.getElementById('initialUserTypeEmployer');
        if (employerCard) {
            employerCard.click();
            
            // If it's a claim flow, we usually assume Company Employer for external jobs
            // but we let the user decide. If we want to force company:
            const companyTypeCard = document.getElementById('employerTypeCompany');
            if (companyTypeCard) {
                setTimeout(() => {
                    companyTypeCard.click();
                    if (prefillEmail) {
                        companyEmailInput.value = prefillEmail;
                        confirmCompanyEmailInput.value = prefillEmail;
                    }
                }, 100);
            }
        }
    }

    // Attach claimJobId to the form data during submission
    const originalSignupSubmit = signupForm.onsubmit;
    signupForm.addEventListener('submit', function(e) {
        if (claimJobId) {
            // We'll inject it into the data object before fetch in the actual submit handler
            // But since the submit handler is an inline listener in many Hirly pages, 
            // I'll need to modify the actual fetch call below.
        }
    });

    // --- Password Validation Function for Real-time UI Updates ---
    function validatePasswordUI(input, elements) {
        const password = input.value;
        
        // Check length requirement (at least 8 characters)
        const hasLength = password.length >= 8;
        if (elements.length) updateRequirement(elements.length, hasLength);
        
        // Check lowercase requirement
        const hasLowercase = /[a-z]/.test(password);
        if (elements.lowercase) updateRequirement(elements.lowercase, hasLowercase);
        
        // Check uppercase requirement
        const hasUppercase = /[A-Z]/.test(password);
        if (elements.uppercase) updateRequirement(elements.uppercase, hasUppercase);
        
        // Check number requirement
        const hasNumber = /\d/.test(password);
        if (elements.number) updateRequirement(elements.number, hasNumber);
    }

    function updateRequirement(element, isValid) {
        if (isValid) {
            element.classList.add('valid');
            element.classList.add('border-hirly-200', 'bg-hirly-50/50');
            element.classList.remove('border-slate-100', 'bg-white');
        } else {
            element.classList.remove('valid');
            element.classList.remove('border-hirly-200', 'bg-hirly-50/50');
            element.classList.add('border-slate-100', 'bg-white');
        }
    }
});
