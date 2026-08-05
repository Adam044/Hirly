// Hirly/public/post_job.js
document.addEventListener('DOMContentLoaded', function() {
    const postJobForm = document.getElementById('postJobForm');
    const postJobMessage = document.getElementById('postJobMessage');
    const cityInput = document.getElementById('city');
    const cityGroup = document.getElementById('cityGroup');
    const jobSiteTypeSelect = document.getElementById('jobSiteType');
    const currencySelect = document.getElementById('currency');
    
    // NEW: Budget Radio Buttons and Fields
    const budgetTypeRadios = document.getElementById('budgetTypeRadios');
    const budgetFields = document.getElementById('budgetFields');

    // NEW: Rich Text Editor elements
    const toggleRichTextEditorBtn = document.getElementById('toggleRichTextEditor');
    const richTextEditorToolbar = document.getElementById('richTextEditorToolbar');
    const jobDescriptionContent = document.getElementById('jobDescriptionContent'); // The contenteditable div
    const jobDescriptionHiddenInput = document.getElementById('jobDescription'); // The hidden textarea for submission

    // NEW: Category Dropdown Elements
    const categoryDropdown = document.getElementById('categoryDropdown');
    const categoryDropdownToggle = document.getElementById('categoryDropdownToggle');
    const categoryListContainer = document.getElementById('categoryListContainer'); // The dropdown-menu container
    const categoryList = document.getElementById('categoryList'); // The dropdown-menu-checkboxes container
    const selectedCategoryHiddenInput = document.getElementById('selectedCategoryHidden'); // Hidden input to store selected category
    let selectedCategory = ''; // To hold the currently selected category (English name)

    // NEW: Professions Dropdown Elements
    const professionsDropdown = document.getElementById('professionsDropdown');
    const professionsDropdownToggle = document.getElementById('professionsDropdownToggle');
    const professionsListContainer = document.getElementById('professionsListContainer'); // The dropdown-menu container
    const professionsList = document.getElementById('professionsList'); // The dropdown-menu-checkboxes container
    const professionsSearchInput = document.getElementById('professionsSearchInput');
    const selectedProfessionsTags = document.getElementById('selectedProfessionsTags'); // For displaying selected tags
    const requiredProfessionsHiddenInput = document.getElementById('requiredProfessionsHidden'); // Hidden input to store JSON string
    let selectedProfessions = []; // Array to hold selected professions (English names)


    // NEW: Job Image Upload elements
    const jobImageInput = document.getElementById('jobImageInput');
    const jobImageFileName = document.getElementById('jobImageFileName');
    const jobImagePreviewContainer = document.getElementById('jobImagePreviewContainer');
    const jobImagePreview = document.getElementById('jobImagePreview');
    const removeJobImageBtn = document.getElementById('removeJobImageBtn');

    // NEW: External Apply URL + Requirements builder elements
    const externalApplyUrlInput = document.getElementById('externalApplyUrl');
    const requirementsInput = document.getElementById('requirementsInput');
    const addRequirementBtn = document.getElementById('addRequirementBtn');
    const selectedRequirementsContainer = document.getElementById('selectedRequirements');
    let selectedRequirements = []; // Array of requirement strings

    // NEW: Gender & Age inputs
    const genderRequirementSelect = document.getElementById('genderRequirement');
    const ageMinInput = document.getElementById('ageMin');
    const ageMaxInput = document.getElementById('ageMax');

    // List of Palestinian cities (without "Remote")
    const palestinianCities = [
        "Abasan al-Kabira", "Abu Dis", "Bani Na'im", "Bani Suheila", "Beit Hanoun",
        "Beit Jala", "Beit Lahia", "Beit Sahour", "Beit Ummar", "Beitunia", "Bethlehem",
        "al-Bireh", "Deir al-Balah", "ad-Dhahiriya", "Dura", "Gaza City", "Halhul",
        "Hebron", "Idhna", "Jabalia", "Jenin", "Jericho", "Jerusalem",
        "Khan Yunis", "Nablus", "Qabatiya", "Qalqilya", "Rafah", "Ramallah",
        "Sa'ir", "as-Samu", "Surif", "Tubas", "Tulkarm", "Ya'bad",
        "al-Yamun", "Yatta", "az-Zawayda"
    ].sort(); // Sort alphabetically

    // Access globalCategoriesAndProfessions from the global scope
    if (!window.globalCategoriesAndProfessions) {
        console.error("window.globalCategoriesAndProfessions is not defined. Ensure categories-professions-translations.js is loaded correctly.");
    }


    // --- Helper Functions ---

    /**
     * Sanitizes HTML content by stripping unwanted tags and attributes.
     * This prevents pasting dirty HTML from sources like Microsoft Word.
     * @param {string} html The HTML string to sanitize.
     * @returns {string} The cleaned HTML string.
     */
    function sanitizeHtml(html) {
        // Create a new DOMParser instance to parse the HTML string
        const doc = new DOMParser().parseFromString(html, 'text/html');
        
        // Add a check to prevent the TypeError if the body is null (e.g., if the input is empty).
        if (!doc.body) {
            return '';
        }

        // Define a list of allowed tags and attributes
        const allowedTags = ['p', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li'];
        const allowedAttrs = ['dir']; // Allow 'dir' to preserve RTL/LTR

        // Get all elements in the document body as a static array to avoid
        // issues with live collections during modification.
        const allElements = Array.from(doc.body.getElementsByTagName('*'));

        allElements.forEach(node => {
            const tagName = node.tagName.toLowerCase();
            if (!allowedTags.includes(tagName)) {
                // If the tag is not allowed, replace it with its children.
                // This removes the tag itself but keeps its content.
                while (node.firstChild) {
                    node.parentNode.insertBefore(node.firstChild, node);
                }
                node.parentNode.removeChild(node);
            } else {
                // If the tag is allowed, just remove any non-allowed attributes.
                Array.from(node.attributes).forEach(attr => {
                    if (!allowedAttrs.includes(attr.name)) {
                        node.removeAttribute(attr.name);
                    }
                });
            }
        });

        // Return the clean HTML from the body.
        return doc.body.innerHTML;
    }

    // Generic function to show a toast message (assuming it's defined globally or in components.js)
    // function showToast(message, type = 'info') { ... }

    // Populate the city dropdown
    function populateCityDropdown() {
        const selectCityText = (window.translations && window.translations['select_city'] && window.translations['select_city'][window.currentLanguage]) || 'Select City';
        if (cityInput) {
            cityInput.innerHTML = `<option value="">${selectCityText}</option>`; // Clear existing
            palestinianCities.forEach(cityEnName => {
                const option = document.createElement('option');
                option.value = cityEnName;
                // Generate translation key for city (e.g., 'city_gaza_city')
                // Fixed: Remove apostrophes first, then replace spaces/non-alphanumeric with single underscores
                const cityKey = `city_${cityEnName.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
                // Get translated city name, fallback to English if not found
                option.textContent = (window.translations && window.translations[cityKey] && window.translations[cityKey][window.currentLanguage]) || cityEnName;
                cityInput.appendChild(option);
            });
        }
    }

    // --- Requirements Builder Logic ---
    function renderRequirements() {
        if (!selectedRequirementsContainer) return;
        selectedRequirementsContainer.innerHTML = '';

        if (selectedRequirements.length === 0) {
            const placeholder = document.createElement('span');
            placeholder.className = 'text-sm text-slate-400 italic tag-placeholder';
            const noReqKey = 'no_requirements_selected';
            const noReqText = (window.translations && window.translations[noReqKey] && window.translations[noReqKey][window.currentLanguage]) || 'No requirements added';
            placeholder.textContent = noReqText;
            selectedRequirementsContainer.appendChild(placeholder);
            return;
        }

        const ul = document.createElement('ul');
        ul.className = 'w-full space-y-2';
        ul.setAttribute('dir', document.documentElement.getAttribute('dir') || 'ltr');

        selectedRequirements.forEach((reqText, index) => {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl group hover:border-primary/30 transition-all';
            const textEl = document.createElement('span');
            textEl.className = 'text-slate-700 font-medium flex-1';
            textEl.textContent = reqText || '';
            const actions = document.createElement('span');
            actions.className = 'flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity';
            const editIcon = document.createElement('i');
            editIcon.className = 'fas fa-pen p-2 text-slate-400 hover:text-primary cursor-pointer transition-colors';
            editIcon.dataset.index = index;
            const removeIcon = document.createElement('i');
            removeIcon.className = 'fas fa-trash p-2 text-slate-400 hover:text-danger cursor-pointer transition-colors';
            removeIcon.dataset.index = index;
            actions.appendChild(editIcon);
            actions.appendChild(removeIcon);
            li.appendChild(textEl);
            li.appendChild(actions);
            ul.appendChild(li);
        });

        selectedRequirementsContainer.appendChild(ul);

        selectedRequirementsContainer.querySelectorAll('.req-delete').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index, 10);
                removeRequirement(idx);
            });
        });
        selectedRequirementsContainer.querySelectorAll('.req-edit').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index, 10);
                editRequirement(idx);
            });
        });
    }

    function addRequirement(text) {
        const value = (text || '').trim();
        selectedRequirements.push(value);
        if (requirementsInput) requirementsInput.value = '';
        renderRequirements();
        editRequirement(selectedRequirements.length - 1);
    }

    function removeRequirement(index) {
        if (index >= 0 && index < selectedRequirements.length) {
            selectedRequirements.splice(index, 1);
            renderRequirements();
        }
    }

    function editRequirement(index) {
        const lis = selectedRequirementsContainer.querySelectorAll('ul li');
        const li = lis[index];
        if (!li) return;
        li.innerHTML = '';
        li.className = 'flex items-center gap-2 p-2 bg-white border border-primary rounded-xl shadow-sm';
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'flex-1 px-3 py-1.5 text-sm border-none focus:ring-0 text-slate-700 bg-transparent';
        input.value = selectedRequirements[index] || '';
        const confirmIcon = document.createElement('i');
        confirmIcon.className = 'fas fa-check p-2 text-success hover:bg-success/10 rounded-lg cursor-pointer transition-colors';
        const cancelIcon = document.createElement('i');
        cancelIcon.className = 'fas fa-times p-2 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors';
        const actions = document.createElement('span');
        actions.className = 'flex gap-1';
        actions.appendChild(confirmIcon);
        actions.appendChild(cancelIcon);
        li.appendChild(input);
        li.appendChild(actions);
        input.focus();
        const save = () => {
            const val = (input.value || '').trim();
            selectedRequirements[index] = val;
            renderRequirements();
        };
        const cancel = () => {
            renderRequirements();
        };
        confirmIcon.addEventListener('click', save);
        cancelIcon.addEventListener('click', cancel);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                save();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
            }
        });
        input.addEventListener('blur', save);
    }

    // Bind add requirement actions
    if (addRequirementBtn && requirementsInput) {
        addRequirementBtn.addEventListener('click', () => addRequirement(requirementsInput.value));
        requirementsInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addRequirement(requirementsInput.value);
            }
        });
    }

    // --- Category Dropdown Logic ---

    function populateCategoryDropdown() {
        const loadingCategoriesSpinner = (window.translations && window.translations['loading_categories_spinner'] && window.translations['loading_categories_spinner'][window.currentLanguage]) || 'Loading categories...';
        const noCategoriesAvailable = (window.translations && window.translations['no_categories_available'] && window.translations['no_categories_available'][window.currentLanguage]) || 'No categories available.';

        if (!categoryList) return;

        categoryList.innerHTML = ''; // Clear existing content

        // Always get the latest data from the global object
        const categories = window.globalCategoriesAndProfessions || [];

        if (categories.length === 0) {
            console.warn('No categories found in window.globalCategoriesAndProfessions');
            categoryList.innerHTML = `
                <div class="p-4 text-center text-slate-500">
                    ${noCategoriesAvailable}
                </div>
            `;
            return;
        }

        // Sort categories by their translated name
        const sortedCategories = [...categories].sort((a, b) => {
            const nameA = a.name[window.currentLanguage] || a.name.en;
            const nameB = b.name[window.currentLanguage] || b.name.en;
            return nameA.localeCompare(nameB);
        });

        sortedCategories.forEach(categoryData => {
            const categoryNameEn = categoryData.name.en; // Use English name for internal logic/value
            const translatedCategoryName = categoryData.name[window.currentLanguage] || categoryData.name.en;
            const categoryItem = document.createElement('div');
            categoryItem.className = 'flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors text-slate-700 font-medium';
            categoryItem.innerHTML = `<i class="${categoryData.icon} text-primary w-5 text-center"></i> <span>${translatedCategoryName}</span>`;
            categoryItem.dataset.categoryName = categoryNameEn; // Store English category name
            categoryList.appendChild(categoryItem);

            categoryItem.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent document click from interfering
                selectCategory(categoryNameEn); // Pass English name
                categoryListContainer.classList.add('hidden'); // Close dropdown on selection
                categoryDropdownToggle.querySelector('.dropdown-arrow')?.classList.remove('rotate-180');
                categoryDropdownToggle.setAttribute('aria-expanded', false);
            });
        });
    }

    function selectCategory(categoryEnName) { // Expect English name
        const selectCategoryText = (window.translations && window.translations['select_category'] && window.translations['select_category'][window.currentLanguage]) || 'Select a Category';
        
        const categories = window.globalCategoriesAndProfessions || [];
        selectedCategory = categoryEnName; // Store English name
        if (categoryDropdownToggle) {
            const categoryData = categories.find(cat => cat.name.en === categoryEnName); // Find by English name
            const displayedName = categoryData ? (categoryData.name[window.currentLanguage] || categoryData.name.en) : selectCategoryText;
            categoryDropdownToggle.innerHTML = `
                <span class="flex items-center gap-2">
                    ${categoryData ? `<i class="${categoryData.icon} text-primary"></i>` : ''} 
                    <span>${displayedName}</span>
                </span>
                <i class="fas fa-chevron-down text-slate-400 transition-transform duration-200 dropdown-arrow"></i>
            `;
            categoryDropdownToggle.classList.add('border-primary', 'bg-primary/5');
        }
        if (selectedCategoryHiddenInput) {
            selectedCategoryHiddenInput.value = categoryEnName;
        }

        // Now, enable and populate the professions dropdown based on the selected category
        professionsDropdownToggle.disabled = false;
        populateProfessionsDropdown(); // Populate with professions of the selected category
        selectedProfessions = []; // Clear any previously selected professions
        updateSelectedProfessionsDisplay(); // Update professions tags display
    }

    // --- Professions Dropdown Logic (Multi-select, dependent on Category) ---

    function getAllProfessions() {
        const all = [];
        const seen = new Set();
        const categories = window.globalCategoriesAndProfessions || [];
        for (const cat of categories) {
            for (const p of cat.professions) {
                const key = p.en;
                if (!seen.has(key)) {
                    seen.add(key);
                    all.push(p);
                }
            }
        }
        return all;
    }

    function populateProfessionsDropdown() {
        const selectCategoryFirstText = (window.translations && window.translations['select_category_first_professions'] && window.translations['select_category_first_professions'][window.currentLanguage]) || 'Select a category first to see professions.';
        const noProfessionsFoundCategory = (window.translations && window.translations['no_professions_found_category'] && window.translations['no_professions_found_category'][window.currentLanguage]) || 'No professions found in this category.';

        if (!professionsList) return;

        professionsList.innerHTML = ''; // Clear existing content
        let hasResults = false;
        const query = (professionsSearchInput && professionsSearchInput.value) ? professionsSearchInput.value.trim().toLowerCase() : '';
        
        const categories = window.globalCategoriesAndProfessions || [];

        if (!selectedCategory && !query) {
            professionsList.innerHTML = `
                <div class="p-4 text-center text-slate-400 text-sm">
                    <i class="fas fa-info-circle mr-2"></i> ${selectCategoryFirstText}
                </div>
            `;
            if (professionsDropdownToggle) professionsDropdownToggle.disabled = true;
            return;
        }

        // Ensure professions dropdown toggle is enabled if a category is selected
        if (professionsDropdownToggle) {
            if (selectedCategory || query) {
                professionsDropdownToggle.disabled = false;
            }
        }

        const professionsInSelectedCategory = selectedCategory ? (categories.find(cat => cat.name.en === selectedCategory)?.professions || []) : [];
        let source = selectedCategory ? professionsInSelectedCategory : getAllProfessions();
        if (query) {
            source = source.filter(p => {
                const name = (p[window.currentLanguage] || p.en || '').toString().toLowerCase();
                return name.includes(query);
            });
        }

        // Sort professions alphabetically by their translated name
        const sortedProfessions = [...source].sort((a, b) => {
            // 'a' and 'b' here are profession objects {ar: "...", en: "..."}
            const translatedA = (a[window.currentLanguage] || a.en || '').toString();
            const translatedB = (b[window.currentLanguage] || b.en || '').toString();
            return translatedA.localeCompare(translatedB);
        });


        sortedProfessions.forEach(profession => { // Iterate over profession objects
            hasResults = true;
            const professionEnName = profession.en; // Get the English name from the object
            const checkboxId = `prof-checkbox-${(professionEnName || '').replace(/\s+/g, '-').toLowerCase()}`; // Unique ID
            const checkboxContainer = document.createElement('label');
            checkboxContainer.className = 'flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors text-slate-700';
            const isChecked = selectedProfessions.includes(professionEnName);

            // Get translated profession name
            const translatedProfessionName = profession[window.currentLanguage] || profession.en;

            checkboxContainer.innerHTML = `
                <input type="checkbox" id="${checkboxId}" value="${profession.en}" ${isChecked ? 'checked' : ''} class="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary transition-all">
                <span class="text-sm font-medium">${translatedProfessionName}</span>
            `;
            professionsList.appendChild(checkboxContainer);

            checkboxContainer.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
                if (e.target.checked) {
                    addProfession(e.target.value); // Add English name
                } else {
                    removeProfession(e.target.value); // Remove English name
                }
            });
        });

        if (!hasResults) {
            const noResults = document.createElement('div');
            noResults.className = 'p-4 text-center text-slate-500 text-sm';
            noResults.textContent = noProfessionsFoundCategory;
            professionsList.appendChild(noResults);
        }
    }

    function addProfession(professionEnName) { // Expect English name
        const professionAlreadySelected = (window.translations && window.translations['profession_already_added'] && window.translations['profession_already_added'][window.currentLanguage]) || 'Profession already added!';
        if (!selectedProfessions.includes(professionEnName)) {
            selectedProfessions.push(professionEnName);
            updateSelectedProfessionsDisplay();
        } else {
            if (typeof showToast === 'function') showToast(professionAlreadySelected, 'warning');
        }
    }

    function removeProfession(professionToRemoveEnName) { // Expect English name
        selectedProfessions = selectedProfessions.filter(p => p !== professionToRemoveEnName);
        updateSelectedProfessionsDisplay();
        // Uncheck the corresponding checkbox if it exists in the current view
        const checkbox = professionsList.querySelector(`input[value="${professionToRemoveEnName}"]`);
        if (checkbox) {
            checkbox.checked = false;
        }
    }

    function updateSelectedProfessionsDisplay() {
        const noProfessionsSelectedTag = (window.translations && window.translations['no_professions_selected'] && window.translations['no_professions_selected'][window.currentLanguage]) || 'No professions selected';
        const professionsSelectedText = (window.translations && window.translations['professions_selected'] && window.translations['professions_selected'][window.currentLanguage]) || 'Professions Selected';
        const selectProfessionsText = (window.translations && window.translations['select_professions'] && window.translations['select_professions'][window.currentLanguage]) || 'Select Professions';

        selectedProfessionsTags.innerHTML = ''; // Clear current tags
        if (selectedProfessions.length === 0) {
            const placeholder = document.createElement('span');
            placeholder.className = 'text-sm text-slate-400 italic tag-placeholder';
            placeholder.textContent = noProfessionsSelectedTag;
            selectedProfessionsTags.appendChild(placeholder);
            if (professionsDropdownToggle) {
                 professionsDropdownToggle.innerHTML = `
                    <span>${selectProfessionsText}</span>
                    <i class="fas fa-chevron-down text-slate-400 transition-transform duration-200 dropdown-arrow"></i>
                 `;
            }
            professionsDropdownToggle.classList.remove('border-primary', 'bg-primary/5');
        } else {
            selectedProfessions.forEach(professionEnName => { // Iterate over English names
                const tag = document.createElement('span');
                tag.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-lg border border-primary/20 transition-all hover:bg-primary/20';

                // Find the translated profession object from globalCategoriesAndProfessions
                let professionObject = null;
                const categories = window.globalCategoriesAndProfessions || [];
                for (const cat of categories) {
                    const foundProf = cat.professions.find(p => p.en === professionEnName);
                    if (foundProf) {
                        professionObject = foundProf;
                        break;
                    }
                }

                const translatedProfessionName = professionObject ? (professionObject[window.currentLanguage] || professionObject.en) : professionEnName;


                tag.innerHTML = `
                    <span>${translatedProfessionName}</span>
                    <i class="fas fa-times cursor-pointer hover:text-primary-dark transition-colors remove-tag-icon" data-profession="${professionEnName}"></i>
                `;
                selectedProfessionsTags.appendChild(tag);
            });
            // Update toggle button text
            if (professionsDropdownToggle) {
                if (selectedProfessions.length === 1) {
                    // Find the translated name for the single selected profession
                    let singleTranslatedProf = selectedProfessions[0];
                    let professionObject = null;
                    const categories = window.globalCategoriesAndProfessions || [];
                    for (const cat of categories) {
                        const foundProf = cat.professions.find(p => p.en === singleTranslatedProf);
                        if (foundProf) {
                            professionObject = foundProf;
                            break;
                        }
                    }
                    singleTranslatedProf = professionObject ? (professionObject[window.currentLanguage] || professionObject.en) : singleTranslatedProf;

                    professionsDropdownToggle.innerHTML = `
                        <span>${singleTranslatedProf}</span>
                        <i class="fas fa-chevron-down text-slate-400 transition-transform duration-200 dropdown-arrow"></i>
                    `;
                } else {
                    professionsDropdownToggle.innerHTML = `
                        <span>${selectedProfessions.length} ${professionsSelectedText}</span>
                        <i class="fas fa-chevron-down text-slate-400 transition-transform duration-200 dropdown-arrow"></i>
                    `;
                }
                professionsDropdownToggle.classList.add('border-primary', 'bg-primary/5');
            }

            // Add event listeners for remove icons
            selectedProfessionsTags.querySelectorAll('.remove-tag-icon').forEach(icon => {
                icon.addEventListener('click', (e) => {
                    const profession = e.target.dataset.profession; // This will be the English name
                    removeProfession(profession);
                });
            });
        }
        // Update hidden input for form submission
        requiredProfessionsHiddenInput.value = JSON.stringify(selectedProfessions);
    }


    // --- Rich Text Editor Logic ---
    let isRichTextEditorActive = false;

    // Function to apply translations to a specific element's button text
    function applyTranslationToElement(element, key, defaultText) {
        const buttonTextSpan = element.querySelector('.button-text');
        if (buttonTextSpan) { // Check if the span exists before setting textContent
            if (window.translations && window.translations[key] && window.translations[key][window.currentLanguage]) {
                buttonTextSpan.textContent = window.translations[key][window.currentLanguage];
            } else {
                buttonTextSpan.textContent = defaultText;
            }
        } else {
            // Fallback if .button-text span is not found, perhaps set text directly on the button if it's the only text
            if (window.translations && window.translations[key] && window.translations[key][window.currentLanguage]) {
                element.textContent = window.translations[key][window.currentLanguage];
            } else {
                element.textContent = defaultText;
            }
            // Re-add the icon if it was overwritten
            if (!element.querySelector('i')) {
                const icon = document.createElement('i');
                icon.className = 'fas fa-magic'; // Or appropriate icon for the button
                element.prepend(icon);
            }
        }
    }

    // Initial setup for the contenteditable div (always editable)
    if (jobDescriptionContent) {
        jobDescriptionContent.setAttribute('contenteditable', 'true'); // Make div editable by default
        // Ensure its content is empty on load to show CSS placeholder
        if (jobDescriptionContent.innerHTML.trim() === '') {
            jobDescriptionContent.innerHTML = '';
        }
    }

    if (toggleRichTextEditorBtn && richTextEditorToolbar && jobDescriptionContent && jobDescriptionHiddenInput) {
        toggleRichTextEditorBtn.addEventListener('click', () => {
            isRichTextEditorActive = !isRichTextEditorActive;

            if (isRichTextEditorActive) {
                // Activate rich text editor toolbar
                richTextEditorToolbar.classList.remove('hidden');
                richTextEditorToolbar.classList.add('flex');
                jobDescriptionContent.classList.add('border-primary', 'ring-4', 'ring-primary/10');
                toggleRichTextEditorBtn.classList.add('bg-primary/10', 'text-primary');
                applyTranslationToElement(toggleRichTextEditorBtn, 'toggle_richtext_plain', 'Plain Text');
            } else {
                // Deactivate rich text editor toolbar
                richTextEditorToolbar.classList.add('hidden');
                richTextEditorToolbar.classList.remove('flex');
                jobDescriptionContent.classList.remove('border-primary', 'ring-4', 'ring-primary/10');
                toggleRichTextEditorBtn.classList.remove('bg-primary/10', 'text-primary');
                applyTranslationToElement(toggleRichTextEditorBtn, 'toggle_richtext', 'Format');
            }
            // Update the hidden textarea's value regardless of editor state
            // This is crucial for ensuring the latest content (even plain) is submitted
            jobDescriptionHiddenInput.value = jobDescriptionContent.innerHTML;
        });

        // Add event listeners for toolbar buttons
        richTextEditorToolbar.querySelectorAll('button[data-command]').forEach(button => {
            button.addEventListener('click', () => {
                const command = button.dataset.command;
                // For lists, we need to ensure a new line or paragraph is created if contenteditable is empty
                if ((command === 'insertUnorderedList' || command === 'insertOrderedList') && jobDescriptionContent.innerHTML.trim() === '') {
                     document.execCommand('insertHTML', false, `<li></li>`);
                } else {
                    document.execCommand(command, false, null);
                }
                jobDescriptionContent.focus(); // Keep focus on the contenteditable div
                jobDescriptionHiddenInput.value = jobDescriptionContent.innerHTML; // Sync immediately
            });
        });

        // Sync content from contenteditable div to hidden textarea on input/change
        jobDescriptionContent.addEventListener('input', () => {
            jobDescriptionHiddenInput.value = jobDescriptionContent.innerHTML;
            const cleaned = jobDescriptionHiddenInput.value.replace(/<[^>]*>?/gm, '').trim();
            if (cleaned.length >= 10 && postJobMessage) {
                postJobMessage.textContent = '';
                postJobMessage.className = 'hidden';
            }
        });
    }


    // --- Event Listeners ---
    
    // Listen for changes in the budget radio buttons
    if (budgetTypeRadios) {
        const budgetRadioButtons = budgetTypeRadios.querySelectorAll('input[type="radio"]');
        budgetRadioButtons.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.value === 'negotiable') {
                    // Hide budget fields and remove required attribute
                    budgetFields.classList.add('hidden');
                    document.getElementById('budget').removeAttribute('required');
                    currencySelect.removeAttribute('required');
                } else {
                    // Show budget fields and add required attribute
                    budgetFields.classList.remove('hidden');
                    document.getElementById('budget').setAttribute('required', 'required');
                    currencySelect.setAttribute('required', 'required');
                }
            });
        });
    }

    // Category Dropdown Toggle
    if (categoryDropdownToggle && categoryListContainer) {
        categoryDropdownToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            const isHidden = categoryListContainer.classList.contains('hidden');
            
            // Close other dropdowns
            if (professionsListContainer) {
                professionsListContainer.classList.add('hidden');
                professionsDropdownToggle?.querySelector('.dropdown-arrow')?.classList.remove('rotate-180');
            }
            
            if (isHidden) {
                categoryListContainer.classList.remove('hidden');
                categoryDropdownToggle.querySelector('.dropdown-arrow')?.classList.add('rotate-180');
            } else {
                categoryListContainer.classList.add('hidden');
                categoryDropdownToggle.querySelector('.dropdown-arrow')?.classList.remove('rotate-180');
            }
            categoryDropdownToggle.setAttribute('aria-expanded', isHidden);
        });
    }

    // Professions Dropdown Toggle
    if (professionsDropdownToggle && professionsListContainer) {
        professionsDropdownToggle.addEventListener('click', (event) => {
            if (!professionsDropdownToggle.disabled) {
                event.stopPropagation();
                const isHidden = professionsListContainer.classList.contains('hidden');
                
                // Close other dropdowns
                if (categoryListContainer) {
                    categoryListContainer.classList.add('hidden');
                    categoryDropdownToggle?.querySelector('.dropdown-arrow')?.classList.remove('rotate-180');
                }
                
                if (isHidden) {
                    professionsListContainer.classList.remove('hidden');
                    professionsDropdownToggle.querySelector('.dropdown-arrow')?.classList.add('rotate-180');
                    if (professionsSearchInput) professionsSearchInput.focus();
                } else {
                    professionsListContainer.classList.add('hidden');
                    professionsDropdownToggle.querySelector('.dropdown-arrow')?.classList.remove('rotate-180');
                }
                professionsDropdownToggle.setAttribute('aria-expanded', isHidden);
            }
        });
    }

    if (professionsSearchInput) {
        professionsSearchInput.addEventListener('input', () => {
            populateProfessionsDropdown();
        });
    }

    // Close all custom dropdowns when clicking outside
    document.addEventListener('click', (event) => {
        if (categoryListContainer && !categoryDropdown.contains(event.target)) {
            categoryListContainer.classList.add('hidden');
            categoryDropdownToggle.querySelector('.dropdown-arrow')?.classList.remove('rotate-180');
        }
        if (professionsListContainer && !professionsDropdown.contains(event.target)) {
            professionsListContainer.classList.add('hidden');
            professionsDropdownToggle.querySelector('.dropdown-arrow')?.classList.remove('rotate-180');
        }
    });


    // Event listener for Job Site Type
    if (jobSiteTypeSelect) {
        jobSiteTypeSelect.addEventListener('change', function() {
            if (this.value === 'Remote') {
                cityInput.value = ''; // Clear city selection
                cityInput.disabled = true; // Disable city dropdown
                cityInput.removeAttribute('required'); // Remove required attribute
                cityGroup.classList.add('hidden'); // Hide the city input group
            } else {
                cityInput.disabled = false; // Enable city dropdown
                cityInput.setAttribute('required', 'required'); // Add required attribute
                cityGroup.classList.remove('hidden'); // Show the city input group
            }
            // Re-populate city dropdown to ensure translated "Select City" is correct
            populateCityDropdown();
        });
        // Initial check in case of page reload with a pre-selected value
        jobSiteTypeSelect.dispatchEvent(new Event('change'));
    }

    // Set min date for deadline to today
    const deadlineInput = document.getElementById('deadline');
    if (deadlineInput) {
        const today = new Date().toISOString().split('T')[0];
        deadlineInput.setAttribute('min', today);
    }

    // Handle Job Image Upload
    if (jobImageInput) {
        jobImageInput.addEventListener('change', function() {
            const noFileChosenText = (window.translations && window.translations['no_file_chosen'] && window.translations['no_file_chosen'][window.currentLanguage]) || 'No file chosen';
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    jobImagePreview.src = e.target.result;
                    jobImagePreviewContainer.classList.remove('hidden');
                    jobImagePreviewContainer.classList.add('flex');
                };
                reader.readAsDataURL(this.files[0]);
                jobImageFileName.textContent = this.files[0].name;
            } else {
                jobImagePreview.src = '#';
                jobImagePreviewContainer.classList.add('hidden');
                jobImagePreviewContainer.classList.remove('flex');
                jobImageFileName.textContent = noFileChosenText;
            }
        });
    }

    // Handle Remove Job Image Button
    if (removeJobImageBtn) {
        removeJobImageBtn.addEventListener('click', () => {
            const noFileChosenText = (window.translations && window.translations['no_file_chosen'] && window.translations['no_file_chosen'][window.currentLanguage]) || 'No file chosen';
            jobImageInput.value = ''; // Clear the file input
            jobImagePreview.src = '#'; // Clear the preview image
            jobImagePreviewContainer.classList.add('hidden'); // Hide the preview container
            jobImagePreviewContainer.classList.remove('flex');
            jobImageFileName.textContent = noFileChosenText; // Reset file name display
        });
    }


        if (postJobForm) {
            postJobForm.addEventListener('submit', async function(e) { // Made async to use await
                e.preventDefault();
                const submitBtn = postJobForm.querySelector('button[type="submit"]');
                let inlineSpinner;

            // Sanitize the HTML content before it's used
            const sanitizedDescription = sanitizeHtml(jobDescriptionContent.innerHTML);

            // Before submission, ensure hidden textarea has the latest content
            jobDescriptionHiddenInput.value = sanitizedDescription;

            const selectedBudgetType = document.querySelector('input[name="budgetType"]:checked').value;
            
            // Retrieve translated validation messages
            const jobTitleRequired = (window.translations && window.translations['please_enter_job_title'] && window.translations['please_enter_job_title'][window.currentLanguage]) || 'Please enter a job title.';
            const jobDescriptionRequired = (window.translations && window.translations['please_provide_description'] && window.translations['please_provide_description'][window.currentLanguage]) || 'Please provide a detailed job description.';
            const budgetRequired = (window.translations && window.translations['please_enter_valid_budget'] && window.translations['please_enter_valid_budget'][window.currentLanguage]) || 'Please enter a valid budget (a positive number).';
            const currencyRequired = (window.translations && window.translations['please_select_currency'] && window.translations['please_select_currency'][window.currentLanguage]) || 'Please select a currency.';
            const categoryRequired = (window.translations && window.translations['please_select_category'] && window.translations['please_select_category'][window.currentLanguage]) || 'Please select a category.';
            const professionsRequired = (window.translations && window.translations['please_select_at_least_one_profession'] && window.translations['please_select_at_least_one_profession'][window.currentLanguage]) || 'Please select at least one profession.';
            const jobTypeRequired = (window.translations && window.translations['please_select_job_type'] && window.translations['please_select_job_type'][window.currentLanguage]) || 'Please select a job type.';
            const siteTypeRequired = (window.translations && window.translations['please_select_site_type'] && window.translations['please_select_site_type'][window.currentLanguage]) || 'Please select a job site type.';
            const deadlineRequired = (window.translations && window.translations['please_select_deadline'] && window.translations['please_select_deadline'][window.currentLanguage]) || 'Please select an application deadline.';
            const cityRequiredOnsiteHybrid = (window.translations && window.translations['please_select_city_onsite_hybrid'] && window.translations['please_select_city_onsite_hybrid'][window.currentLanguage]) || 'Please select a city for On-site or Hybrid jobs.';
            const jobPostedSuccessfully = (window.translations && window.translations['job_posted_successfully'] && window.translations['job_posted_successfully'][window.currentLanguage]) || 'Job posted successfully!';
            const failedToPostJob = (window.translations && window.translations['failed_to_post_job'] && window.translations['failed_to_post_job'][window.currentLanguage]) || 'Failed to post job.';
            const errorPostingJob = (window.translations && window.translations['error_posting_job'] && window.translations['error_posting_job'][window.currentLanguage]) || 'An error occurred while posting the job.';
            const selectCategoryText = (window.translations && window.translations['select_category'] && window.translations['select_category'][window.currentLanguage]) || 'Select a Category';
            const selectProfessionsText = (window.translations && window.translations['select_professions'] && window.translations['select_professions'][window.currentLanguage]) || 'Select Professions';
            const noFileChosenText = (window.translations && window.translations['no_file_chosen'] && window.translations['no_file_chosen'][window.currentLanguage]) || 'No file chosen';
            const toggleRichTextText = (window.translations && window.translations['toggle_richtext'] && window.translations['toggle_richtext'][window.currentLanguage]) || 'Format';
            const invalidAgeRangeText = (window.translations && window.translations['please_enter_valid_age_range'] && window.translations['please_enter_valid_age_range'][window.currentLanguage]) || 'Please enter a valid age range.';

            const title = document.getElementById('jobTitle').value;
            const description = jobDescriptionHiddenInput.value; // Get content from hidden textarea
            const category = selectedCategory; // NEW: Get selected category from our custom dropdown (English name)
            const jobType = document.getElementById('jobType').value;
            const jobSiteType = jobSiteTypeSelect.value;
            const deadline = document.getElementById('deadline').value;
            const city = cityInput.disabled ? '' : cityInput.value;
            const requiredProfessions = selectedProfessions; // Get selected professions from the array (English names)
            const externalApplyUrl = externalApplyUrlInput ? externalApplyUrlInput.value.trim() : '';
            const requirements = selectedRequirements.map(r => (r || '').trim()).filter(r => r.length > 0);
            const genderRequirement = genderRequirementSelect ? genderRequirementSelect.value : 'any';
            const ageMinVal = ageMinInput && ageMinInput.value ? parseInt(ageMinInput.value, 10) : null;
            const ageMaxVal = ageMaxInput && ageMaxInput.value ? parseInt(ageMaxInput.value, 10) : null;

            // Basic client-side validation
            if (!title || title.trim() === '') {
                postJobMessage.textContent = jobTitleRequired;
                postJobMessage.className = 'mt-6 p-4 rounded-xl text-center bg-danger/10 text-danger block';
                return;
            }
            // Validate description content. Remove HTML tags and trim for validation.
            const cleanedDescription = description.replace(/<[^>]*>?/gm, '').trim();
            if (!cleanedDescription || cleanedDescription === '') {
                postJobMessage.textContent = jobDescriptionRequired;
                postJobMessage.className = 'mt-6 p-4 rounded-xl text-center bg-danger/10 text-danger block';
                return;
            }
            if (cleanedDescription.length < 10) {
                const minDescMsg = (window.translations && window.translations['please_provide_description_min_length'] && window.translations['please_provide_description_min_length'][window.currentLanguage]) || 'Please provide a description of at least 10 characters.';
                postJobMessage.textContent = minDescMsg;
                postJobMessage.className = 'mt-6 p-4 rounded-xl text-center bg-danger/10 text-danger block';
                return;
            }

            // NEW: Conditional budget validation
            if (selectedBudgetType === 'fixed') {
                const budget = parseFloat(document.getElementById('budget').value);
                const currency = currencySelect.value;
                if (isNaN(budget) || budget <= 0) {
                    postJobMessage.textContent = budgetRequired;
                    postJobMessage.className = 'mt-6 p-4 rounded-xl text-center bg-danger/10 text-danger block';
                    return;
                }
                if (!currency || currency.trim() === '') {
                    postJobMessage.textContent = currencyRequired;
                    postJobMessage.className = 'mt-6 p-4 rounded-xl text-center bg-danger/10 text-danger block';
                    return;
                }
            }
            
            if (!category || category.trim() === '') {
                postJobMessage.textContent = categoryRequired;
                postJobMessage.className = 'mt-6 p-4 rounded-xl text-center bg-danger/10 text-danger block';
                return;
            }
            if (requiredProfessions.length === 0) {
                postJobMessage.textContent = professionsRequired;
                postJobMessage.className = 'mt-6 p-4 rounded-xl text-center bg-danger/10 text-danger block';
                return;
            }
            if (!jobType || jobType.trim() === '') {
                postJobMessage.textContent = jobTypeRequired;
                postJobMessage.className = 'mt-6 p-4 rounded-xl text-center bg-danger/10 text-danger block';
                return;
            }
            if (!jobSiteType || jobSiteType.trim() === '') {
                postJobMessage.textContent = siteTypeRequired;
                postJobMessage.className = 'mt-6 p-4 rounded-xl text-center bg-danger/10 text-danger block';
                return;
            }
            if (!deadline || deadline.trim() === '') {
                postJobMessage.textContent = deadlineRequired;
                postJobMessage.className = 'mt-6 p-4 rounded-xl text-center bg-danger/10 text-danger block';
                return;
            }

            if ((jobSiteType === 'On-site' || jobSiteType === 'Hybrid') && (!city || city.trim() === '')) {
                postJobMessage.textContent = cityRequiredOnsiteHybrid;
                postJobMessage.className = 'mt-6 p-4 rounded-xl text-center bg-danger/10 text-danger block';
                return;
            }

            // Create FormData object to send text fields and file
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description); // This now contains HTML if editor was used
            
            // Only append budget and currency if the type is 'fixed'
            if (selectedBudgetType === 'fixed') {
                formData.append('budget', parseFloat(document.getElementById('budget').value));
                formData.append('currency', currencySelect.value);
            }

            formData.append('category', category); // Use the selected category (English name)
            formData.append('jobType', jobType);
            formData.append('jobSiteType', jobSiteType);
            formData.append('city', city);
            formData.append('deadline', deadline);
            formData.append('requiredProfessions', JSON.stringify(requiredProfessions)); // Stringify array for backend
            formData.append('genderRequirement', genderRequirement);
            if (ageMinVal !== null) formData.append('ageMin', ageMinVal);
            if (ageMaxVal !== null) formData.append('ageMax', ageMaxVal);

            // NEW: Optional external apply URL and requirements
            if (externalApplyUrl) {
                formData.append('externalApplyUrl', externalApplyUrl);
            }
            formData.append('requirements', JSON.stringify(requirements));

            if (jobImageInput.files && jobImageInput.files[0]) {
                formData.append('job_image', jobImageInput.files[0]); // Append the image file
            }

                try {
                    if (submitBtn) {
                        submitBtn.disabled = true;
                        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${submitBtn.innerHTML}`;
                    }
                    const response = await fetch('/api/jobs', {
                        method: 'POST',
                        // No 'Content-Type' header needed for FormData; browser sets it automatically
                        body: formData
                    });

                const data = await response.json();

                if (response.ok) {
                    // Trigger success modal and confetti
                    showJobSuccessModal(data.jobId);
                    
                    postJobMessage.textContent = ''; 
                    postJobMessage.classList.add('hidden');
                    postJobForm.reset(); // Clear the form

                    // Reset all custom dropdown states
                    if (jobSiteTypeSelect) {
                        jobSiteTypeSelect.value = '';
                        jobSiteTypeSelect.dispatchEvent(new Event('change')); // Trigger change to reset city field
                    }
                    if (currencySelect) {
                        currencySelect.value = '';
                    }

                    // Reset category dropdown
                    selectedCategory = '';
                    if (categoryDropdownToggle) {
                        categoryDropdownToggle.innerHTML = `
                            <span>${selectCategoryText}</span>
                            <i class="fas fa-chevron-down text-slate-400 transition-transform duration-200 dropdown-arrow"></i>
                        `;
                        categoryDropdownToggle.classList.remove('border-primary', 'bg-primary/5');
                    }
                    if (selectedCategoryHiddenInput) selectedCategoryHiddenInput.value = '';
                    populateCategoryDropdown(); // Re-populate category dropdown

                    // Reset professions dropdown
                    selectedProfessions = [];
                    if (professionsDropdownToggle) {
                        professionsDropdownToggle.innerHTML = `
                            <span>${selectProfessionsText}</span>
                            <i class="fas fa-chevron-down text-slate-400 transition-transform duration-200 dropdown-arrow"></i>
                        `;
                        professionsDropdownToggle.classList.remove('border-primary', 'bg-primary/5');
                        professionsDropdownToggle.disabled = true; // Disable professions until category is selected
                    }
                    if (requiredProfessionsHiddenInput) requiredProfessionsHiddenInput.value = '[]';
                    updateSelectedProfessionsDisplay(); // Clear selected tags display
                    populateProfessionsDropdown(); // Clear professions list (will show "Select a category first...")
                    
                    // Reset budget fields
                    budgetFields.classList.remove('hidden');
                    document.getElementById('budget').setAttribute('required', 'required');
                    currencySelect.setAttribute('required', 'required');
                    document.querySelector('input[name="budgetType"][value="fixed"]').checked = true;


                    // Reset rich text editor to its initial state (plain text mode, empty content)
                    jobDescriptionContent.innerHTML = ''; // Clear contenteditable div
                    jobDescriptionHiddenInput.value = ''; // Clear hidden textarea
                    isRichTextEditorActive = false; // Reset editor state
                    richTextEditorToolbar.classList.add('hidden'); // Hide toolbar
                    richTextEditorToolbar.classList.remove('flex');
                    jobDescriptionContent.classList.remove('border-primary', 'ring-4', 'ring-primary/10'); // Remove active styling
                    toggleRichTextEditorBtn.classList.remove('bg-primary/10', 'text-primary'); // De-style toggle button
                    applyTranslationToElement(toggleRichTextEditorBtn, 'toggle_richtext', 'Format'); // Reset button text

                    // Reset image input
                    jobImageInput.value = ''; // Clear image input
                    jobImagePreview.src = '#';
                    jobImagePreviewContainer.classList.add('hidden');
                    jobImageFileName.textContent = noFileChosenText;

                    // Reset external apply URL and requirements
                    if (externalApplyUrlInput) externalApplyUrlInput.value = '';
                    selectedRequirements = [];
                    renderRequirements();
                    if (requirementsInput) requirementsInput.value = '';

                } else {
                    let message = data && data.error ? data.error : '';
                    if (!message && data && Array.isArray(data.errors)) {
                        const descErr = data.errors.find(e => e.path === 'description');
                        if (descErr) {
                            message = (window.translations && window.translations['please_provide_description_min_length'] && window.translations['please_provide_description_min_length'][window.currentLanguage]) || 'Please provide a description of at least 10 characters.';
                        }
                    }
                    postJobMessage.textContent = message || failedToPostJob;
                    postJobMessage.className = 'mt-6 p-4 rounded-xl text-center bg-danger/10 text-danger block';
                }
                } catch (error) {
                    console.error('Error posting job:', error);
                    postJobMessage.textContent = errorPostingJob;
                    postJobMessage.className = 'mt-6 p-4 rounded-xl text-center bg-danger/10 text-danger block';
                }
                if (submitBtn) {
                    const icon = submitBtn.querySelector('.fa-spinner');
                    if (icon) icon.remove();
                    submitBtn.disabled = false;
                }
            });
        }

    // Initial population calls
    // Ensure translations are loaded before populating UI elements that rely on them
    window.addEventListener('translationsApplied', () => {
        populateCityDropdown();
        populateCategoryDropdown(); // Populate categories on load
        populateProfessionsDropdown(); // Initial message for professions dropdown
        updateSelectedProfessionsDisplay(); // Initial display for professions tags
        renderRequirements(); // Initial display for requirements

        // Apply translations to static dropdown options
        const translateStaticDropdowns = () => {
            const dropdowns = [currencySelect, document.getElementById('jobType'), jobSiteTypeSelect];
            dropdowns.forEach(selectElement => {
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
        translateStaticDropdowns();

        // Translate the rich text toggle button text initially
        applyTranslationToElement(toggleRichTextEditorBtn, 'toggle_richtext', 'Format');

    }, { once: true });

    // If translations are already applied (e.g., cached page), load immediately
    if (window.currentLanguage && window.translations) {
        populateCityDropdown();
        populateCategoryDropdown();
        populateProfessionsDropdown();
        updateSelectedProfessionsDisplay();
        renderRequirements();

        const translateStaticDropdowns = () => {
            const dropdowns = [currencySelect, document.getElementById('jobType'), jobSiteTypeSelect];
            dropdowns.forEach(selectElement => {
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
        translateStaticDropdowns();
        // Translate the rich text toggle button text initially
        applyTranslationToElement(toggleRichTextEditorBtn, 'toggle_richtext', 'Format');
    }

    /**
     * Shows the job success modal with QR code and share link
     * @param {string} jobId The ID of the newly created job
     */
    function showJobSuccessModal(jobId) {
        const modal = document.getElementById('successModal');
        if (!modal) return;

        // Show Modal using Tailwind classes
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.classList.add('opacity-100');
            const content = modal.querySelector('div');
            if (content) {
                content.classList.remove('scale-95');
                content.classList.add('scale-100');
            }
        }, 10);
         
         document.body.classList.add('overflow-hidden');

        // Trigger confetti for a "nice message" experience
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                zIndex: 2000000 // Higher than modal
            });
        }

        const linkInput = document.getElementById('jobShareLink');
        const qrContainer = document.getElementById('successQrCode');
        const downloadQrBtn = document.getElementById('downloadQrBtn');
        const copyBtn = document.getElementById('copyJobLinkBtn');
        const postAnotherBtn = document.getElementById('postAnotherBtn');
        const goToDashboardBtn = document.getElementById('goToDashboardBtn');

        // Generate share link
        const shareLink = `${window.location.origin}/job_details.html?id=${jobId}`;
        if (linkInput) linkInput.value = shareLink;

        // Generate QR Code
        if (qrContainer && (typeof qrcode !== 'undefined' || window.qrcode)) {
            try {
                qrContainer.innerHTML = '';
                // Use the global qrcode function
                const qr = (typeof qrcode !== 'undefined') ? qrcode(0, 'M') : window.qrcode(0, 'M');
                qr.addData(shareLink);
                qr.make();
                qrContainer.innerHTML = qr.createImgTag(5); // Increased size slightly

                // Setup download button
                if (downloadQrBtn) {
                    downloadQrBtn.onclick = () => {
                        const img = qrContainer.querySelector('img');
                        if (img && img.src) {
                            const link = document.createElement('a');
                            link.href = img.src;
                            link.download = `job-qr-${jobId}.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }
                    };
                }
            } catch (err) {
                console.error('QR Code generation failed:', err);
            }
        }

        // Event Listeners
        if (copyBtn) {
            copyBtn.onclick = async () => {
                const link = linkInput.value;
                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(link);
                    } else {
                        linkInput.select();
                        document.execCommand('copy');
                    }
                    
                    const originalIcon = copyBtn.innerHTML;
                    copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                    copyBtn.classList.add('btn-success');
                    setTimeout(() => {
                        copyBtn.innerHTML = originalIcon;
                        copyBtn.classList.remove('btn-success');
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy:', err);
                }
            };
        }

        if (postAnotherBtn) {
            postAnotherBtn.onclick = () => {
                modal.classList.add('opacity-0');
                modal.classList.remove('opacity-100');
                const content = modal.querySelector('div');
                if (content) {
                    content.classList.add('scale-95');
                    content.classList.remove('scale-100');
                }
                setTimeout(() => {
                    modal.classList.add('hidden');
                    document.body.classList.remove('overflow-hidden');
                }, 300);
            };
        }

        if (goToDashboardBtn) {
            goToDashboardBtn.onclick = () => {
                window.location.href = '/hire_dashboard.html';
            };
        }
    }
});
