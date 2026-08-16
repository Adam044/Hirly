/**
 * dashboard-profile.js
 * Handles profile editing, avatar updates, and profile sharing
 * Updated with inline editing (no modals) and fixed dropdown loading
 */

const DashboardProfile = {
    selectedProfilePicFile: null,
    profilePicRemoved: false,
    cvRemoved: false,
    selectedInterestedProfessions: [],
    currentSkills: [],
    educationHistory: [],
    
    // Track edit mode state
    editMode: {
        personal: false,
        professional: false,
        education: false
    },
    hasUnsavedChanges: false,

    /**
     * Mark current section as dirty (unsaved changes)
     */
    setDirty() {
        this.hasUnsavedChanges = true;
    },

    /**
     * Initializes profile section
     */
    init() {
        this.setupEventListeners();
        this.setupCustomDropdowns();
        this.initEducationSection();

        // Listen for language changes to re-populate dropdowns
        window.addEventListener('translationsApplied', () => {
            this.populateEducationDropdowns();
            this.renderEducationList();
            this.populateCountryDropdownForEdit();
            this.populateCityDropdownForEdit();
            if (window.currentUser) {
                this.updateSidebar(window.currentUser);
                this.initSettings(window.currentUser);
                this.renderPersonalSection(window.currentUser);
            }
        });
    },

    /**
     * Initialize settings toggles with user data
     */
    initSettings(user) {
        if (!user) return;
        
        const visibilityAll = document.getElementById('visibilityAll');
        const visibilityCompanies = document.getElementById('visibilityCompanies');
        const visibilityPrivate = document.getElementById('visibilityPrivate');
        const hideContact = document.getElementById('hideContactInfoToggle');

        if (visibilityAll) visibilityAll.checked = user.privacy_visibility === 'ALL';
        if (visibilityCompanies) visibilityCompanies.checked = user.privacy_visibility === 'companies';
        if (visibilityPrivate) visibilityPrivate.checked = user.privacy_visibility === 'none';
        if (hideContact) hideContact.checked = !!user.privacy_hide_contact_info;
        
        const emailToggle = document.getElementById('emailNotificationsToggle');
        if (emailToggle) {
            // Default to true if the property is undefined (for new users/missing entries)
            emailToggle.checked = user.notifications_enabled !== false;
        }
    },

    /**
     * Populates all dropdowns (called when user data is loaded)
     */
    populateAllDropdowns() {
        this.populateCategoryDropdowns();
        this.populateEducationDropdowns();
        this.populateStatusDropdown();
    },

    /**
     * Populates the status dropdown with alphabetical sorting
     */
    populateStatusDropdown() {
        const menu = document.getElementById('editStatusMenu');
        if (!menu) return;

        const lang = window.currentLanguage || 'en';
        const currentStatus = document.getElementById('editStatus')?.value;

        const statuses = [
            { id: 'Working', key: 'status_working', icon: 'fa-solid fa-briefcase' },
            { id: 'Freelancing', key: 'status_professional', icon: 'fa-solid fa-laptop-code' },
            { id: 'Student', key: 'status_student', icon: 'fa-solid fa-graduation-cap' },
            { id: 'Other', key: 'status_other', icon: 'fa-solid fa-circle-question' }
        ];

        // Sort statuses alphabetically by translated name
        const sortedStatuses = statuses.map(s => ({
            ...s,
            name: window.translations?.[s.key]?.[lang] || s.id
        })).sort((a, b) => a.name.localeCompare(b.name, lang));

        menu.innerHTML = '<div class="p-2 space-y-1"></div>';
        const container = menu.querySelector('div');

        sortedStatuses.forEach(status => {
            const isSelected = status.id === currentStatus;
            const item = document.createElement('div');
            item.className = `p-3 hover:bg-slate-50 cursor-pointer rounded-xl flex items-center justify-between group transition-all ${isSelected ? 'bg-blue-50/30' : ''}`;
            
            item.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all ${isSelected ? 'bg-blue-50 text-blue-500' : ''}">
                        <i class="${status.icon} text-sm"></i>
                    </div>
                    <span class="text-sm font-bold text-slate-600 group-hover:text-slate-900 ${isSelected ? 'text-blue-700' : ''}">${status.name}</span>
                </div>
                ${isSelected ? `
                    <div class="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-sm animate-in zoom-in-50 duration-200">
                        <i class="fa-solid fa-check text-[8px]"></i>
                    </div>
                ` : ''}
            `;

            item.addEventListener('click', () => {
                this.selectStatus(status.id, status.name, status.icon);
            });

            container.appendChild(item);
        });
    },

    /**
     * Populates category and profession dropdowns
     */
    populateCategoryDropdowns() {
        if (!window.globalCategoriesAndProfessions) {
            console.warn('globalCategoriesAndProfessions not available');
            return;
        }

        const lang = window.currentLanguage || 'en';
        const currentCategoryValue = document.getElementById('selectedMainCategory')?.dataset.value;

        // Main Category Menu
        const mainCategoryMenu = document.getElementById('mainCategoryMenu');
        if (mainCategoryMenu) {
            mainCategoryMenu.innerHTML = '';
            
            // Sort categories alphabetically by translated name
            const sortedCategories = [...window.globalCategoriesAndProfessions].sort((a, b) => {
                const nameA = typeof a.name === 'object' ? (a.name[lang] || a.name.en) : a.name;
                const nameB = typeof b.name === 'object' ? (b.name[lang] || b.name.en) : b.name;
                return nameA.localeCompare(nameB, lang);
            });

            sortedCategories.forEach(cat => {
                const nameEn = typeof cat.name === 'object' ? cat.name.en : cat.name;
                const nameTranslated = typeof cat.name === 'object' ? (cat.name[lang] || cat.name.en) : cat.name;
                const isSelected = nameEn === currentCategoryValue;
                
                const item = document.createElement('div');
                item.className = `p-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-all border-b border-slate-50 last:border-0 group ${isSelected ? 'bg-emerald-50/30' : ''}`;
                
                item.innerHTML = `
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all ${isSelected ? 'bg-emerald-50 text-emerald-500' : ''}">
                            <i class="${cat.icon || 'fas fa-briefcase'} text-lg"></i>
                        </div>
                        <span class="font-bold text-slate-700 group-hover:text-slate-900 ${isSelected ? 'text-emerald-700' : ''}">${nameTranslated}</span>
                    </div>
                    ${isSelected ? `
                        <div class="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-200 animate-in zoom-in-50 duration-200">
                            <i class="fa-solid fa-check text-[10px]"></i>
                        </div>
                    ` : `
                        <div class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 opacity-0 group-hover:opacity-100 transition-all">
                            <i class="fa-solid fa-arrow-right text-[10px]"></i>
                        </div>
                    `}
                `;

                item.addEventListener('click', () => {
                    this.selectMainCategory(nameEn, nameTranslated, cat.icon);
                });

                mainCategoryMenu.appendChild(item);
            });
        }

        // Interest Category Menu
        this.populateInterestedCategoriesDropdown();
    },

    /**
     * Set up custom dropdown behavior
     */
    setupCustomDropdowns() {
        const dropdowns = [
            { id: 'mainCategoryDropdown', menuId: 'mainCategoryMenu' },
            { id: 'currentProfessionDropdown', menuId: 'currentProfessionMenu' },
            { id: 'interestCategoryDropdown', menuId: 'interestCategoryMenu' },
            { id: 'interestProfessionDropdown', menuId: 'interestProfessionMenu' },
            { id: 'studyFieldCategoryDropdown', menuId: 'studyFieldCategoryMenu' },
            { id: 'specificFieldDropdown', menuId: 'specificFieldMenu' },
            { id: 'currentStatusDropdown', menuId: 'currentStatusMenu' },
            { id: 'editStatusDropdown', menuId: 'editStatusMenu' },
            { id: 'editCountryDropdown', menuId: 'editCountryMenu' },
            { id: 'editCityDropdown', menuId: 'editCityMenu' },
            { id: 'degreeCategoryDropdownModal', menuId: 'degreeCategoryMenuModal' },
            { id: 'degreeTitleDropdownModal', menuId: 'degreeTitleMenuModal' }
        ];

        dropdowns.forEach(({ id, menuId }) => {
            const dropdown = document.getElementById(id);
            if (!dropdown) return;

            const trigger = dropdown.querySelector('button');
            const menu = document.getElementById(menuId);
            
            if (!trigger || !menu) return;

            // Prevent multiple listeners
            if (trigger.dataset.dropdownInitialized) return;
            trigger.dataset.dropdownInitialized = "true";

            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const isHidden = menu.classList.contains('hidden');

                // Close other dropdowns
                dropdowns.forEach(d => {
                    const otherMenu = document.getElementById(d.menuId);
                    if (otherMenu && d.id !== id) {
                        otherMenu.classList.add('hidden');
                        const otherTrigger = document.getElementById(d.id)?.querySelector('button');
                        if (otherTrigger) {
                            const icon = otherTrigger.querySelector('.fa-chevron-down');
                            if (icon) icon.classList.remove('rotate-180');
                        }
                    }
                });

                if (isHidden) {
                    menu.classList.remove('hidden');
                    trigger.querySelector('.fa-chevron-down')?.classList.add('rotate-180');
                } else {
                    menu.classList.add('hidden');
                    trigger.querySelector('.fa-chevron-down')?.classList.remove('rotate-180');
                }
            });
        });

        // Close dropdowns on outside click - only add once
        if (!window.dropdownOutsideClickInitialized) {
            window.dropdownOutsideClickInitialized = true;
            document.addEventListener('click', () => {
                dropdowns.forEach(({ menuId, id }) => {
                    const menu = document.getElementById(menuId);
                    if (menu) menu.classList.add('hidden');
                    const trigger = document.getElementById(id)?.querySelector('button');
                    if (trigger) {
                        const icon = trigger.querySelector('.fa-chevron-down');
                        if (icon) icon.classList.remove('rotate-180');
                    }
                });
            });
        }
    },

    /**
     * Initialize education section
     */
    initEducationSection() {
        this.populateEducationDropdowns();
        
        // Setup Modal Form Handlers
        this.setupEducationFormLogic('Modal');

        // Add Education Button (Header)
        const addBtn = document.getElementById('addEducationBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.resetEducationForm('Modal');
                if (window.DashboardModals) {
                    window.DashboardModals.show('addEducationModal');
                }
            });
        }

        // Modal Confirm Button
        const confirmAddBtnModal = document.getElementById('confirmAddDegreeBtnModal');
        if (confirmAddBtnModal) {
            confirmAddBtnModal.onclick = () => this.saveEducationEntry('Modal');
        }
    },

    /**
     * Setup form logic for a specific education form (Modal or Inline)
     */
    setupEducationFormLogic(suffix = '') {
        const typeBtns = document.querySelectorAll(`.edu-type-btn${suffix === 'Modal' ? '[data-modal="addEducationModal"]' : ''}`);
        // For inline, we'll handle this when rendering the inline form.
        // For modal, we can do it now.
        if (suffix === 'Modal') {
            const modal = document.getElementById('addEducationModal');
            if (!modal) return;

            const modalTypeBtns = modal.querySelectorAll('.edu-type-btn');
            modalTypeBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.handleEducationTypeSwitch(btn.dataset.type, 'Modal');
                });
            });
        }
    },

    /**
     * Handles type switching for education forms
     */
    handleEducationTypeSwitch(type, suffix = '') {
        const isModal = suffix === 'Modal';
        const container = isModal ? document.getElementById('addEducationModal') : document.getElementById(`edu-edit-${suffix}`);
        if (!container) return;

        const typeBtns = container.querySelectorAll('.edu-type-btn');
        const uniWrapper = container.querySelector(isModal ? '#uniSelectWrapperModal' : `#uniSelectWrapperInline-${suffix}`);
        const orgWrapper = container.querySelector(isModal ? '#orgNameWrapperModal' : `#orgNameWrapperInline-${suffix}`);
        const levelWrapper = container.querySelector(isModal ? '#eduLevelWrapperModal' : `#eduLevelWrapperInline-${suffix}`);
        const degreeCategoryWrapper = container.querySelector(isModal ? '#degreeCategoryWrapperModal' : `#degreeCategoryWrapperInline-${suffix}`);
        const degreeDropdownWrapper = container.querySelector(isModal ? '#degreeTitleDropdownModal' : `#degreeSelectContainerInline-${suffix}`);
        const degreeWrapper = container.querySelector(isModal ? '#degreeTitleWrapperModal' : `#degreeTitleWrapperInline-${suffix}`);
        const fieldWrapper = container.querySelector(isModal ? '#fieldWrapperModal' : `#fieldWrapperInline-${suffix}`);
        const linkWrapper = container.querySelector(isModal ? '#linkWrapperModal' : `#linkWrapperInline-${suffix}`);
        const orgLabel = isModal ? container.querySelector('label[data-lang-key="organization"]') : document.getElementById(`orgLabelInline-${suffix}`);
        
        // Update button states
        typeBtns.forEach(b => {
            b.classList.remove('active', 'border-indigo-500', 'text-indigo-600', 'border-emerald-500', 'text-emerald-600', 'border-amber-500', 'text-amber-600', 'border-blue-500', 'text-blue-600', 'bg-indigo-50', 'bg-emerald-50', 'bg-amber-50', 'bg-blue-50');
            b.classList.add('bg-white', 'border-slate-100', 'text-slate-600');
            if (b.dataset.type === type) {
                b.classList.remove('bg-white', 'border-slate-100', 'text-slate-600');
                b.classList.add('active');
                const colorClass = type === 'University' ? 'indigo' : (type === 'School' ? 'blue' : (type === 'Certificate' ? 'emerald' : 'amber'));
                b.classList.add(`border-${colorClass}-500`, `text-${colorClass}-600`, `bg-${colorClass}-50`);
            }
        });

        // Toggle visibility
        const lang = window.currentLanguage || 'en';
        if (type === 'University') {
            uniWrapper?.classList.remove('hidden');
            orgWrapper?.classList.add('hidden');
            levelWrapper?.classList.remove('hidden');
            degreeCategoryWrapper?.classList.remove('hidden');
            degreeWrapper?.classList.remove('hidden');
            fieldWrapper?.classList.add('hidden'); // Field is now Title
            linkWrapper?.classList.add('hidden');

            // Update Label for University
            const titleLabel = isModal ? container.querySelector('label[data-lang-key="title"]') : container.querySelector('label[data-lang-key="title"]');
            if (titleLabel) titleLabel.textContent = window.translations?.field_of_study?.[lang] || 'Field of Study';

            // Filter Education Level: Remove High School for University
            const levelSelect = container.querySelector(isModal ? '#editEduLevelModal' : `#editLevel-${suffix}`);
            if (levelSelect) {
                const highSchoolOpt = levelSelect.querySelector('option[value="HighSchool"]');
                if (highSchoolOpt) highSchoolOpt.classList.add('hidden');
                if (levelSelect.value === 'HighSchool') levelSelect.value = '';
            }
        } else if (type === 'School') {
            uniWrapper?.classList.add('hidden');
            orgWrapper?.classList.remove('hidden');
            levelWrapper?.classList.add('hidden');
            degreeCategoryWrapper?.classList.add('hidden');
            degreeWrapper?.classList.add('hidden');
            fieldWrapper?.classList.remove('hidden');
            linkWrapper?.classList.add('hidden');
            if (orgLabel) orgLabel.textContent = window.translations?.school_name?.[lang] || 'School Name';
            
            // For school, the "Field" input acts as the grade/title
            const fieldLabel = container.querySelector('label[data-lang-key="field"]');
            if (fieldLabel) fieldLabel.textContent = window.translations?.grade_score?.[lang] || 'Grade / Score';
        } else if (type === 'Certificate' || type === 'Course') {
            uniWrapper?.classList.add('hidden');
            orgWrapper?.classList.remove('hidden');
            levelWrapper?.classList.add('hidden');
            degreeCategoryWrapper?.classList.add('hidden');
            degreeWrapper?.classList.add('hidden');
            fieldWrapper?.classList.remove('hidden');
            linkWrapper?.classList.remove('hidden');
            
            if (orgLabel) {
                orgLabel.textContent = type === 'Certificate' ? (window.translations?.issuer_platform?.[lang] || 'Issuer / Platform') : (window.translations?.platform?.[lang] || 'Platform');
            }
            
            // For Cert/Course, the "Field" input acts as the Name
            const fieldLabel = container.querySelector('label[data-lang-key="field"]');
            if (fieldLabel) {
                fieldLabel.textContent = type === 'Certificate' ? (window.translations?.certificate_name?.[lang] || 'Certificate Name') : (window.translations?.course_name?.[lang] || 'Course Name');
            }
            const fieldInput = container.querySelector(isModal ? '#editDegreeFieldModal' : `#editField-${suffix}`);
            if (fieldInput) {
                fieldInput.placeholder = type === 'Certificate' ? (window.translations?.cert_name_placeholder?.[lang] || 'e.g., AWS Certified Developer') : (window.translations?.course_name_placeholder?.[lang] || 'e.g., Full Stack Web Development');
            }
        }

        // Show High School for non-university if needed (though levelWrapper is hidden for SCH/CERT/CRS)
        if (type !== 'University') {
            const levelSelect = container.querySelector(isModal ? '#editEduLevelModal' : `#editLevel-${suffix}`);
            if (levelSelect) {
                const highSchoolOpt = levelSelect.querySelector('option[value="HighSchool"]');
                if (highSchoolOpt) highSchoolOpt.classList.remove('hidden');
            }
        }
    },

    /**
     * Populates education dropdowns
     */
    populateEducationDropdowns() {
        const catMenu = document.getElementById('degreeCategoryMenuModal');
        if (!window.globalStudyFields || !catMenu) return;

        const lang = window.currentLanguage || 'en';
        const currentCat = document.getElementById('selectedDegreeCategoryModal')?.dataset.value;

        // 1. Populate Category Menu
        catMenu.innerHTML = '<div class="p-2 space-y-1"></div>';
        const container = catMenu.querySelector('div');
        
        // Sort categories alphabetically
        const sortedCats = [...window.globalStudyFields].sort((a, b) => {
            const nameA = a.name[lang] || a.name.en;
            const nameB = b.name[lang] || b.name.en;
            return nameA.localeCompare(nameB, lang);
        });

        sortedCats.forEach(cat => {
            const isSelected = cat.name.en === currentCat;
            const item = document.createElement('div');
            item.className = `p-3 hover:bg-slate-50 cursor-pointer rounded-xl flex items-center justify-between group transition-all ${isSelected ? 'bg-indigo-50/30' : ''}`;
            
            item.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all ${isSelected ? 'bg-indigo-50 text-indigo-500' : ''}">
                        <i class="${cat.icon || 'fas fa-graduation-cap'} text-sm"></i>
                    </div>
                    <span class="text-sm font-bold text-slate-600 group-hover:text-slate-900 ${isSelected ? 'text-indigo-700' : ''}">${cat.name[lang] || cat.name.en}</span>
                </div>
                ${isSelected ? `
                    <div class="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-sm animate-in zoom-in-50 duration-200">
                        <i class="fa-solid fa-check text-[8px]"></i>
                    </div>
                ` : ''}
            `;

            item.addEventListener('click', () => {
                this.selectDegreeCategory(cat.name.en, cat.name[lang] || cat.name.en, cat.icon);
            });

            container.appendChild(item);
        });

        // Add "Other" to category
        const isOtherSelected = currentCat === 'Other';
        const otherItem = document.createElement('div');
        otherItem.className = `p-3 hover:bg-slate-50 cursor-pointer rounded-xl flex items-center justify-between group transition-all ${isOtherSelected ? 'bg-indigo-50/30' : ''}`;
        otherItem.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all ${isOtherSelected ? 'bg-indigo-50 text-indigo-500' : ''}">
                    <i class="fas fa-plus text-sm"></i>
                </div>
                <span class="text-sm font-bold text-slate-600 group-hover:text-slate-900 ${isOtherSelected ? 'text-indigo-700' : ''}">${window.translations?.other_option?.[lang] || 'Other'}</span>
            </div>
        `;
        otherItem.addEventListener('click', () => {
            this.selectDegreeCategory('Other', window.translations?.other_option?.[lang] || 'Other', 'fas fa-plus');
        });
        container.appendChild(otherItem);
    },

    /**
     * Handles Category Selection
     */
    selectDegreeCategory(val, label, icon) {
         const lang = window.currentLanguage || 'en';
         const selectedSpan = document.getElementById('selectedDegreeCategoryModal');
         if (selectedSpan) {
             selectedSpan.textContent = label;
             selectedSpan.dataset.value = val;
             selectedSpan.dataset.icon = icon;
         }

         // Reset Title selection
         const titleSpan = document.getElementById('selectedDegreeTitleModal');
         if (titleSpan) {
             titleSpan.textContent = window.translations?.select_degree?.[lang] || 'Select Degree';
             delete titleSpan.dataset.value;
         }

        const textInput = document.getElementById('editDegreeTitleTextModal');
        const degreeDropdown = document.getElementById('degreeTitleDropdownModal');

        if (val === 'Other') {
            degreeDropdown?.classList.add('hidden');
            if (textInput) {
                textInput.classList.remove('hidden');
                textInput.focus();
            }
        } else {
            degreeDropdown?.classList.remove('hidden');
            if (textInput) textInput.classList.add('hidden');
            this.populateDegreeTitles(val);
        }

        // Close menu
        document.getElementById('degreeCategoryMenuModal')?.classList.add('hidden');
    },

    /**
     * Populates Degree Titles based on category
     */
    populateDegreeTitles(catEn) {
        const menu = document.getElementById('degreeTitleMenuModal');
        if (!menu) return;

        const lang = window.currentLanguage || 'en';
        const currentTitle = document.getElementById('selectedDegreeTitleModal')?.dataset.value;

        menu.innerHTML = '<div class="p-2 space-y-1"></div>';
        const container = menu.querySelector('div');

        const category = window.globalStudyFields.find(c => c.name.en === catEn);
        if (!category) return;

        // Sort fields alphabetically
        const sortedFields = [...category.fields].sort((a, b) => {
            const nameA = a[lang] || a.en;
            const nameB = b[lang] || b.en;
            return nameA.localeCompare(nameB, lang);
        });

        sortedFields.forEach(field => {
            const isSelected = field.en === currentTitle;
            const item = document.createElement('div');
            item.className = `p-3 hover:bg-slate-50 cursor-pointer rounded-xl flex items-center justify-between group transition-all ${isSelected ? 'bg-emerald-50/30' : ''}`;
            
            item.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all ${isSelected ? 'bg-emerald-50 text-emerald-500' : ''}">
                        <i class="${field.icon || 'fas fa-book'} text-sm"></i>
                    </div>
                    <span class="text-sm font-bold text-slate-600 group-hover:text-slate-900 ${isSelected ? 'text-emerald-700' : ''}">${field[lang] || field.en}</span>
                </div>
                ${isSelected ? `
                    <div class="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm animate-in zoom-in-50 duration-200">
                        <i class="fa-solid fa-check text-[8px]"></i>
                    </div>
                ` : ''}
            `;

            item.addEventListener('click', () => {
                this.selectDegreeTitle(field.en, field[lang] || field.en, field.icon);
            });

            container.appendChild(item);
        });

        // Add "Other" to titles
        const otherItem = document.createElement('div');
        otherItem.className = 'p-3 hover:bg-slate-50 cursor-pointer rounded-xl group transition-all';
        otherItem.innerHTML = `<span class="text-sm font-bold text-slate-600 group-hover:text-slate-900">${window.translations?.other_option?.[lang] || 'Other'}</span>`;
        otherItem.addEventListener('click', () => {
            this.selectDegreeTitle('Other', window.translations?.other_option?.[lang] || 'Other', 'fas fa-plus');
        });
        container.appendChild(otherItem);
    },

    /**
     * Handles Title Selection
     */
    selectDegreeTitle(val, label, icon) {
        const selectedSpan = document.getElementById('selectedDegreeTitleModal');
        if (selectedSpan) {
            selectedSpan.textContent = label;
            selectedSpan.dataset.value = val;
        }

        const textInput = document.getElementById('editDegreeTitleTextModal');
        if (textInput) {
            textInput.classList.toggle('hidden', val !== 'Other');
            if (val === 'Other') textInput.focus();
        }

        // Close menu
        document.getElementById('degreeTitleMenuModal')?.classList.add('hidden');
    },

    /**
     * Resets education form
     */
    resetEducationForm(suffix = '') {
        const container = suffix === 'Modal' ? document.getElementById('addEducationModal') : document.getElementById(`edu-edit-${suffix}`);
        if (!container) return;

        const inputs = container.querySelectorAll('input:not([type="hidden"]), select');
        inputs.forEach(i => {
            if (i.type === 'checkbox') i.checked = false;
            else i.value = '';
        });

        // Reset Custom Dropdowns for Modal
        if (suffix === 'Modal') {
            const lang = window.currentLanguage || 'en';
            const catSpan = document.getElementById('selectedDegreeCategoryModal');
            const titleSpan = document.getElementById('selectedDegreeTitleModal');
            if (catSpan) {
                catSpan.textContent = window.translations?.select_field_category?.[lang] || 'Select Category';
                delete catSpan.dataset.value;
            }
            if (titleSpan) {
                titleSpan.textContent = window.translations?.select_degree?.[lang] || 'Select Degree';
                delete titleSpan.dataset.value;
            }
            const degreeDropdown = document.getElementById('degreeTitleDropdownModal');
            degreeDropdown?.classList.remove('hidden');
            const textInput = document.getElementById('editDegreeTitleTextModal');
            if (textInput) textInput.classList.add('hidden');
        }

        // Default to University
        this.handleEducationTypeSwitch('University', suffix);
    },

    /**
     * Renders inline edit form for an education entry
     */
    editEducationEntry(id) {
        const entry = this.educationHistory.find(e => String(e.id) === String(id));
        if (!entry) return;

        const viewEl = document.getElementById(`edu-view-${id}`);
        const editEl = document.getElementById(`edu-edit-${id}`);
        if (!viewEl || !editEl) return;

        const lang = window.currentLanguage || 'en';
        const type = entry.type.charAt(0).toUpperCase() + entry.type.slice(1).toLowerCase();
        const accentColor = type === 'University' ? 'indigo' : (type === 'School' ? 'blue' : (type === 'Certificate' ? 'emerald' : 'amber'));

        // Generate inline form HTML
        editEl.innerHTML = `
            <div class="pt-6 border-t border-slate-50 mt-4 space-y-6">
                <div class="flex items-center justify-between mb-4">
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest" data-lang-key="edit_entry">${window.translations?.edit_entry?.[lang] || 'Edit Entry'}</span>
                    <div class="flex gap-2">
                        <button type="button" class="edu-type-btn px-4 py-2 rounded-xl text-[10px] font-black transition-all ${type === 'University' ? 'active bg-indigo-50 text-indigo-500 border border-indigo-100' : 'bg-white border border-slate-100 text-slate-400'}" data-type="University">UNI</button>
                        <button type="button" class="edu-type-btn px-4 py-2 rounded-xl text-[10px] font-black transition-all ${type === 'School' ? 'active bg-blue-50 text-blue-500 border border-blue-100' : 'bg-white border border-slate-100 text-slate-400'}" data-type="School">SCH</button>
                        <button type="button" class="edu-type-btn px-4 py-2 rounded-xl text-[10px] font-black transition-all ${type === 'Certificate' ? 'active bg-emerald-50 text-emerald-500 border border-emerald-100' : 'bg-white border border-slate-100 text-slate-400'}" data-type="Certificate">CERT</button>
                        <button type="button" class="edu-type-btn px-4 py-2 rounded-xl text-[10px] font-black transition-all ${type === 'Course' ? 'active bg-amber-50 text-amber-500 border border-amber-100' : 'bg-white border border-slate-100 text-slate-400'}" data-type="Course">CRS</button>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-3 ${type === 'University' ? '' : 'hidden'}" id="uniSelectWrapperInline-${id}">
                        <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1" data-lang-key="university">${window.translations?.university?.[lang] || 'University Name'}</label>
                        <input type="text" id="editUniName-${id}" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 transition-all outline-none text-xs font-bold text-slate-700 shadow-sm" value="${entry.organization || ''}" placeholder="${window.translations?.uni_placeholder?.[lang] || 'e.g., An-Najah National University'}" data-lang-placeholder="uni_placeholder">
                    </div>

                    <div class="space-y-3 ${type === 'University' ? 'hidden' : ''}" id="orgNameWrapperInline-${id}">
                        <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1" id="orgLabelInline-${id}" data-lang-key="organization">${window.translations?.organization?.[lang] || 'School / Platform Name'}</label>
                        <input type="text" id="editOrgName-${id}" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 transition-all outline-none text-xs font-bold text-slate-700 shadow-sm" value="${entry.organization || ''}" placeholder="${type === 'School' ? (window.translations?.school_placeholder?.[lang] || 'e.g., Al-Rawdah School') : (window.translations?.platform_placeholder?.[lang] || 'e.g., Coursera, Udacity...')}" data-lang-placeholder="${type === 'School' ? 'school_placeholder' : 'platform_placeholder'}">
                    </div>

                    <div class="space-y-3 ${type === 'University' ? '' : 'hidden'}" id="eduLevelWrapperInline-${id}">
                        <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1" data-lang-key="edu_level">${window.translations?.edu_level?.[lang] || 'Education Level'}</label>
                        <div class="relative">
                            <select id="editLevel-${id}" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 transition-all outline-none text-xs font-bold text-slate-700 shadow-sm appearance-none cursor-pointer">
                                <option value="" data-lang-key="select_level">${window.translations?.select_level?.[lang] || 'Select Level'}</option>
                                <option value="Bachelor" ${entry.education_level === 'Bachelor' ? 'selected' : ''} data-lang-key="degree_bachelor">${window.translations?.degree_bachelor?.[lang] || "Bachelor's"}</option>
                                <option value="Master" ${entry.education_level === 'Master' ? 'selected' : ''} data-lang-key="degree_masters">${window.translations?.degree_masters?.[lang] || "Master's"}</option>
                                <option value="PhD" ${entry.education_level === 'PhD' ? 'selected' : ''} data-lang-key="degree_phd">${window.translations?.degree_phd?.[lang] || 'PhD'}</option>
                                <option value="Diploma" ${entry.education_level === 'Diploma' ? 'selected' : ''} data-lang-key="degree_diploma">${window.translations?.degree_diploma?.[lang] || 'Diploma'}</option>
                                <option value="HighSchool" ${entry.education_level === 'HighSchool' ? 'selected' : ''} data-lang-key="degree_highschool">${window.translations?.degree_highschool?.[lang] || 'High School'}</option>
                            </select>
                            <i class="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"></i>
                        </div>
                    </div>

                    <div class="space-y-3 col-span-full ${type !== 'School' ? '' : 'hidden'}" id="degreeCategoryWrapperInline-${id}">
                        <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1" data-lang-key="field_category_label">${window.translations?.field_category_label?.[lang] || 'Field Category'}</label>
                        <div class="relative">
                            <select id="editDegreeCategory-${id}" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 transition-all outline-none text-xs font-bold text-slate-700 shadow-sm appearance-none cursor-pointer">
                                <option value="" data-lang-key="select_field_category">${window.translations?.select_field_category?.[lang] || 'Select Category'}</option>
                            </select>
                            <i class="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"></i>
                        </div>
                    </div>

                    <div class="space-y-3 col-span-full ${type !== 'School' ? '' : 'hidden'}" id="degreeTitleWrapperInline-${id}">
                        <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1" data-lang-key="title">${window.translations?.title?.[lang] || 'Degree / Specialization'}</label>
                        <div class="relative" id="degreeSelectContainerInline-${id}">
                            <select id="editDegreeSelect-${id}" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 transition-all outline-none text-xs font-bold text-slate-700 shadow-sm appearance-none cursor-pointer">
                                <option value="" data-lang-key="select_degree">${window.translations?.select_degree?.[lang] || 'Select Degree'}</option>
                            </select>
                            <i class="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"></i>
                        </div>
                        <input type="text" id="editDegreeText-${id}" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 transition-all outline-none text-xs font-bold text-slate-700 shadow-sm mt-2 hidden" value="${entry.title || ''}" placeholder="${window.translations?.title_placeholder?.[lang] || 'e.g., B.Sc. Computer Science'}">
                    </div>

                    <div class="space-y-3 col-span-full ${['School', 'Certificate', 'Course'].includes(type) ? '' : 'hidden'}" id="fieldWrapperInline-${id}">
                        <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1" data-lang-key="field">${type === 'School' ? (window.translations?.grade_score?.[lang] || 'Grade / Score') : (type === 'Certificate' ? (window.translations?.certificate_name?.[lang] || 'Certificate Name') : (window.translations?.course_name?.[lang] || 'Course Name'))}</label>
                        <input type="text" id="editField-${id}" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 transition-all outline-none text-xs font-bold text-slate-700 shadow-sm" value="${entry.title || ''}" placeholder="${type === 'Certificate' ? (window.translations?.cert_name_placeholder?.[lang] || 'e.g., AWS Certified Developer') : (type === 'Course' ? (window.translations?.course_name_placeholder?.[lang] || 'e.g., Full Stack Web Development') : (window.translations?.grade_placeholder?.[lang] || 'e.g., 90% or 3.8/4.0'))}">
                    </div>

                    <div class="col-span-full">
                        <div class="space-y-3">
                            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1" data-lang-key="graduation_year_label">${window.translations?.graduation_year_label?.[lang] || 'Graduation Year'}</label>
                            <input type="text" id="editYear-${id}" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 transition-all outline-none text-xs font-bold text-slate-700 shadow-sm" value="${entry.date || ''}">
                        </div>
                    </div>

                    <div class="space-y-3 ${['Certificate', 'Course'].includes(type) ? '' : 'hidden'}" id="linkWrapperInline-${id}">
                        <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1" data-lang-key="link">${window.translations?.link?.[lang] || 'Link'}</label>
                        <input type="text" id="editLink-${id}" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 transition-all outline-none text-xs font-bold text-slate-700 shadow-sm" value="${entry.link || ''}">
                    </div>
                </div>

                <div class="flex justify-end gap-3 pt-4">
                    <button type="button" class="px-5 py-2.5 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all" onclick="DashboardProfile.cancelInlineEdit('${id}')" data-lang-key="cancel">${window.translations?.cancel?.[lang] || 'Cancel'}</button>
                    <button type="button" class="px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black rounded-xl hover:bg-slate-800 transition-all shadow-lg uppercase tracking-widest" onclick="DashboardProfile.saveEducationEntry('${id}')" data-lang-key="save">${window.translations?.save?.[lang] || 'Save'}</button>
                </div>
            </div>
        `;

        // Populate inline category and degree dropdowns
        const catSelect = document.getElementById(`editDegreeCategory-${id}`);
        const degreeSelect = document.getElementById(`editDegreeSelect-${id}`);
        const degreeText = document.getElementById(`editDegreeText-${id}`);
        
        if (catSelect && degreeSelect && window.globalStudyFields) {
            const catPlaceholder = window.translations?.select_field_category?.[lang] || 'Select Category';
            const degreePlaceholder = window.translations?.select_degree?.[lang] || 'Select Degree';

            // 1. Populate Category Dropdown
            catSelect.innerHTML = `<option value="">${catPlaceholder}</option>`;
            const sortedCats = [...window.globalStudyFields].sort((a, b) => (a.name[lang] || a.name.en).localeCompare(b.name[lang] || b.name.en, lang));
            
            let initialCatEn = 'Other';
            sortedCats.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.name.en;
                opt.textContent = cat.name[lang] || cat.name.en;
                
                const fieldExists = cat.fields.some(f => f.en === entry.title);
                if (fieldExists) {
                    opt.selected = true;
                    initialCatEn = cat.name.en;
                }
                catSelect.appendChild(opt);
            });
            
            const otherCat = document.createElement('option');
            otherCat.value = 'Other';
            otherCat.textContent = window.translations?.other_option?.[lang] || 'Other';
            if (initialCatEn === 'Other') otherCat.selected = true;
            catSelect.appendChild(otherCat);

            // 2. Function to populate fields based on category
            const updateFields = (catEn, initialValue = null) => {
                if (catEn === 'Other') {
                    degreeSelect.innerHTML = `<option value="Other" selected>${window.translations?.other_option?.[lang] || 'Other'}</option>`;
                    if (initialValue && initialValue !== 'Other') {
                        degreeText.classList.remove('hidden');
                    }
                    return;
                }

                const category = window.globalStudyFields.find(c => c.name.en === catEn);
                degreeSelect.innerHTML = `<option value="">${degreePlaceholder}</option>`;
                
                if (category) {
                    const sortedFields = [...category.fields].sort((a, b) => (a[lang] || a.en).localeCompare(b[lang] || b.en, lang));
                    let found = false;
                    sortedFields.forEach(field => {
                        const opt = document.createElement('option');
                        opt.value = field.en;
                        opt.textContent = field[lang] || field.en;
                        if (initialValue && field.en === initialValue) {
                            opt.selected = true;
                            found = true;
                        }
                        degreeSelect.appendChild(opt);
                    });
                    
                    const otherOpt = document.createElement('option');
                    otherOpt.value = 'Other';
                    otherOpt.textContent = window.translations?.other_option?.[lang] || 'Other';
                    if (initialValue && !found && initialValue !== 'Other') {
                        otherOpt.selected = true;
                        degreeText.classList.remove('hidden');
                    }
                    degreeSelect.appendChild(otherOpt);
                }
            };

            // 3. Initial population
            updateFields(initialCatEn, entry.title);

            // 4. Listeners
            catSelect.addEventListener('change', (e) => {
                updateFields(e.target.value);
                degreeText.classList.add('hidden');
            });

            degreeSelect.addEventListener('change', (e) => {
                degreeText.classList.toggle('hidden', e.target.value !== 'Other');
                if (e.target.value === 'Other') degreeText.focus();
            });
        }

        // Setup inline type switching
        const typeBtns = editEl.querySelectorAll('.edu-type-btn');
        typeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleEducationTypeSwitch(btn.dataset.type, id);
            });
        });

        // Hide view, show edit
        viewEl.classList.add('hidden');
        editEl.classList.remove('hidden');
        
        // Hide other items' edit modes
        this.educationHistory.forEach(e => {
            if (String(e.id) !== String(id)) {
                this.cancelInlineEdit(e.id);
            }
        });
    },

    /**
     * Cancels inline editing
     */
    cancelInlineEdit(id) {
        const viewEl = document.getElementById(`edu-view-${id}`);
        const editEl = document.getElementById(`edu-edit-${id}`);
        if (viewEl && editEl) {
            viewEl.classList.remove('hidden');
            editEl.classList.add('hidden');
            editEl.innerHTML = '';
        }
    },

    /**
     * Saves education entry (Add or Update)
     */
    async saveEducationEntry(source) {
        const isModal = source === 'Modal';
        const id = isModal ? '' : source;
        const container = isModal ? document.getElementById('addEducationModal') : document.getElementById(`edu-edit-${id}`);
        if (!container) return;

        const lang = window.currentLanguage || 'en';
        
        // Get values based on source
        const type = container.querySelector('.edu-type-btn.active')?.dataset.type || 'University';
        const year = container.querySelector(isModal ? '#editGradYearModal' : `#editYear-${id}`)?.value.trim();
        const link = container.querySelector(isModal ? '#editEduLinkModal' : `#editLink-${id}`)?.value.trim();
        
        let organization = '';
        let educationLevel = '';
        let title = '';
        let fieldOfStudy = '';

        if (type === 'University') {
            organization = container.querySelector(isModal ? '#editUniNameModal' : `#editUniName-${id}`)?.value.trim();
            educationLevel = container.querySelector(isModal ? '#editEduLevelModal' : `#editLevel-${id}`)?.value;
            
            let degreeVal = '';
            if (isModal) {
                degreeVal = document.getElementById('selectedDegreeTitleModal')?.dataset.value;
            } else {
                const degreeSelect = container.querySelector(`#editDegreeSelect-${id}`);
                degreeVal = degreeSelect?.value;
            }

            const degreeText = container.querySelector(isModal ? '#editDegreeTitleTextModal' : `#editDegreeText-${id}`);
            
            title = degreeVal === 'Other' ? degreeText?.value.trim() : degreeVal;
            fieldOfStudy = title; // Field of study IS the title for University

            if (!organization) {
                window.DashboardUI.showToast(window.translations?.enter_uni_name?.[lang] || 'Please enter university name', 'error');
                return;
            }
            if (!educationLevel) {
                window.DashboardUI.showToast(window.translations?.select_level?.[lang] || 'Please select education level', 'error');
                return;
            }
        } else if (type === 'School') {
            organization = container.querySelector(isModal ? '#editUniNameModal' : `#editUniName-${id}`)?.value.trim() || 
                           container.querySelector(isModal ? '#editOrgNameModal' : `#editOrgName-${id}`)?.value.trim();
            
            // For school, the "Field" input is the grade/title
            title = container.querySelector(isModal ? '#editDegreeFieldModal' : `#editField-${id}`)?.value.trim();
            
            if (!organization) {
                window.DashboardUI.showToast(window.translations?.enter_school_name?.[lang] || 'Please enter school name', 'error');
                return;
            }
        } else {
            // Certificate or Course
            organization = container.querySelector(isModal ? '#editOrgNameModal' : `#editOrgName-${id}`)?.value.trim();
            
            // For Cert/Course, the "Field" input is the name
            title = container.querySelector(isModal ? '#editDegreeFieldModal' : `#editField-${id}`)?.value.trim();
            
            if (!organization) {
                const orgMsg = type === 'Certificate' ? 'Please enter issuer name' : 'Please enter platform name';
                window.DashboardUI.showToast(window.translations?.[type === 'Certificate' ? 'enter_issuer_name' : 'enter_platform_name']?.[lang] || orgMsg, 'error');
                return;
            }
        }

        if (!title || !year) {
            window.DashboardUI.showToast(window.translations?.fill_required_fields?.[lang] || 'Please fill required fields', 'error');
            return;
        }

        const data = {
            id: id || undefined,
            type: type.toLowerCase(),
            institution_name: organization,
            title: title,
            field_of_study: fieldOfStudy || null,
            education_level: educationLevel || null,
            end_date: year,
            is_current: false,
            credential_url: link || null
        };

        try {
            const response = await fetch('/api/user/education', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();

            if (result.success) {
                window.DashboardUI.showToast(result.message || 'Saved successfully', 'success');
                if (isModal) window.hideModal('addEducationModal');
                await this.renderEducationSection(window.currentUser);
            } else {
                window.DashboardUI.showToast(result.error || 'Failed to save', 'error');
            }
        } catch (error) {
            console.error('Error saving education:', error);
            window.DashboardUI.showToast('Server error', 'error');
        }
    },

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Edit buttons - now toggle inline edit mode
        const editPersonalBtn = document.getElementById('editPersonalInfoBtn');
        const editProfessionalBtn = document.getElementById('editProfessionalInfoBtn');
        const shareProfileBtn = document.getElementById('shareProfileBtn');

        if (editPersonalBtn) {
            editPersonalBtn.addEventListener('click', () => this.toggleEditMode('personal'));
        }
        if (editProfessionalBtn) {
            editProfessionalBtn.addEventListener('click', () => this.toggleEditMode('professional'));
        }
        
        // Inline edit controls for professional section
        const saveProfessionalBtn = document.getElementById('saveProfessionalEdit');
        const cancelProfessionalBtn = document.getElementById('cancelProfessionalEdit');
        
        if (saveProfessionalBtn) {
            saveProfessionalBtn.addEventListener('click', () => this.saveProfessionalInfo());
        }
        
        if (cancelProfessionalBtn) {
            cancelProfessionalBtn.addEventListener('click', () => this.exitEditMode('professional'));
        }

        if (shareProfileBtn) {
            shareProfileBtn.addEventListener('click', () => this.openShareModal());
        }

        const downloadQRBtn = document.getElementById('downloadQRBtn');
        if (downloadQRBtn) {
            downloadQRBtn.addEventListener('click', () => this.downloadQRCode());
        }

        // Settings Toggles
        const privacyToggles = [
            'visibilityAll', 
            'visibilityCompanies', 
            'visibilityPrivate', 
            'hideContactInfoToggle'
        ];
        
        privacyToggles.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => this.savePrivacySettings());
            }
        });

        const emailToggle = document.getElementById('emailNotificationsToggle');
        if (emailToggle) {
            emailToggle.addEventListener('change', () => this.saveEmailPreferences());
        }
    },

    /**
     * Saves privacy settings to the server
     */
    async savePrivacySettings() {
        const visibilityAll = document.getElementById('visibilityAll');
        const visibilityCompanies = document.getElementById('visibilityCompanies');
        const visibilityPrivate = document.getElementById('visibilityPrivate');
        const hideContact = document.getElementById('hideContactInfoToggle');

        let visibilityVal = 'ALL';
        if (visibilityCompanies?.checked) visibilityVal = 'companies';
        if (visibilityPrivate?.checked) visibilityVal = 'none';

        const data = {
            privacy_visibility: visibilityVal,
            privacy_hide_contact_info: !!hideContact?.checked
        };

        try {
            const result = await window.DashboardAPI.updatePrivacySettings(data);
            if (result.success) {
                if (window.DashboardUI) {
                    window.DashboardUI.showToast('Privacy settings updated!', 'success');
                }
            } else {
                throw new Error(result.error || 'Failed to update privacy settings');
            }
        } catch (error) {
            console.error('Error saving privacy settings:', error);
            if (window.DashboardUI) {
                window.DashboardUI.showToast('Error saving privacy settings', 'error');
            }
        }
    },

    /**
     * Saves email notification preferences
     */
    async saveEmailPreferences() {
        const emailToggle = document.getElementById('emailNotificationsToggle');
        const enabled = !!emailToggle?.checked;

        try {
            const result = await window.DashboardAPI.updateEmailPreferences({ enabled });
            if (result.success) {
                if (window.DashboardUI) {
                    window.DashboardUI.showToast('Notification preferences updated!', 'success');
                }
            } else {
                throw new Error(result.error || 'Failed to update email preferences');
            }
        } catch (error) {
            console.error('Error saving email preferences:', error);
            if (window.DashboardUI) {
                window.DashboardUI.showToast('Error saving email preferences', 'error');
            }
        }
    },

    /**
     * Toggle edit mode for a section
     */
    toggleEditMode(section) {
        const isEditing = this.editMode[section];
        
        if (isEditing) {
            // Already editing, do nothing (save/cancel handles exit)
            return;
        }

        // Enter edit mode
        this.editMode[section] = true;

        switch(section) {
            case 'personal':
                this.renderPersonalEditMode();
                break;
            case 'professional':
                this.renderProfessionalEditMode();
                break;
            case 'education':
                this.renderEducationEditMode();
                break;
        }
    },

    /**
     * Renders personal section in edit mode
     */
    renderPersonalEditMode() {
        const user = window.currentUser;
        if (!user) return;

        const container = document.getElementById('personalSection');
        const lang = window.currentLanguage || 'en';

        // Reset state
        this.selectedProfilePicFile = null;
        this.profilePicRemoved = false;

        // Get current values
        const firstName = user.first_name || user.firstName || '';
        const lastName = user.last_name || user.lastName || '';
        const email = user.email || '';
        const phone = user.phone || '';
        const country = user.country || '';
        const city = user.city || '';
        const birthdate = user.birthdate || user.birthday || '';
        const gender = String(user.gender || '').toLowerCase();
        const profilePicUrl = user.profile_picture_url || user.profile_pic || user.profilePic;

        // Build edit form
        const editHTML = `
            <header class="page-header">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="page-title" data-lang-key="personal_info">Personal Info</h1>
                        <p class="page-subtitle" data-lang-key="personal_info_subtitle">Your basic account information and contact details</p>
                    </div>
                    <div class="flex gap-2">
                        <button id="cancelPersonalEdit" class="px-6 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all">
                            <span data-lang-key="cancel">Cancel</span>
                        </button>
                        <button id="savePersonalEdit" class="px-6 py-2 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl shadow-slate-100">
                            <i class="fa-solid fa-check text-xs"></i>
                            <span data-lang-key="save">Save Changes</span>
                        </button>
                    </div>
                </div>
            </header>
            
            <form id="personalEditForm" class="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <!-- Left Column: Avatar & Basic Details -->
                    <div class="space-y-6">
                        <div class="p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                            <h2 class="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4" data-lang-key="profile_picture">Profile Picture</h2>
                            
                            <div class="flex items-center gap-8">
                                <div class="relative group">
                                    <div id="editAvatarPlaceholder" class="w-24 h-24 rounded-[30px] bg-slate-50 flex items-center justify-center text-slate-300 text-3xl border-2 border-dashed border-slate-100 transition-all ${profilePicUrl ? 'hidden' : ''}">
                                        <i class="fa-solid fa-user"></i>
                                    </div>
                                    <img id="editAvatarPreview" src="${profilePicUrl || ''}" alt="Preview" class="w-24 h-24 rounded-[30px] object-cover border-2 border-white shadow-xl ${profilePicUrl ? '' : 'hidden'}">
                                    
                                    <button type="button" id="removeAvatarBtn" class="absolute -top-2 -right-2 w-8 h-8 bg-white text-rose-500 rounded-xl flex items-center justify-center shadow-lg hover:bg-rose-500 hover:text-white transition-all ${profilePicUrl ? '' : 'hidden'}">
                                        <i class="fa-solid fa-trash-can text-xs"></i>
                                    </button>
                                </div>
                                
                                <div class="flex flex-col gap-2">
                                    <input type="file" id="editProfilePicInput" class="hidden" accept="image/*">
                                    <button type="button" onclick="document.getElementById('editProfilePicInput').click()" class="px-6 py-2.5 bg-emerald-50 text-emerald-600 font-bold text-xs uppercase tracking-widest rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-all">
                                        <span data-lang-key="change_photo">Upload Photo</span>
                                    </button>
                                    <p class="text-[10px] text-slate-400 font-medium leading-relaxed">JPG, PNG or WEBP.<br>Max size 2MB.</p>
                                </div>
                            </div>
                        </div>

                        <div class="p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                            <h2 class="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4" data-lang-key="basic_details">Basic Details</h2>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1" data-lang-key="first_name">First Name</label>
                                    <input type="text" id="editFirstName" name="firstName" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-emerald-500 transition-all outline-none text-sm font-medium" value="${firstName}" required>
                                </div>
                                <div class="space-y-2">
                                    <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1" data-lang-key="last_name">Last Name</label>
                                    <input type="text" id="editLastName" name="lastName" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-emerald-500 transition-all outline-none text-sm font-medium" value="${lastName}" required>
                                </div>
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1" data-lang-key="email">Email Address</label>
                                <input type="email" class="w-full px-4 py-3 bg-slate-100 border border-slate-100 rounded-xl text-slate-400 text-sm font-medium cursor-not-allowed" value="${email}" disabled>
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1" data-lang-key="phone">Phone Number</label>
                                <input type="tel" id="editPhone" name="phone" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-emerald-500 transition-all outline-none text-sm font-medium" value="${phone}">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Right Column: Additional Info -->
                    <div class="space-y-6">
                        <div class="p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                            <h2 class="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4" data-lang-key="additional_info">Additional Information</h2>
                            
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1" data-lang-key="country">Country</label>
                                <div class="relative group" id="editCountryDropdown">
                                    <button type="button" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-sm font-medium text-slate-400 hover:border-emerald-500 transition-all">
                                        <span id="selectedEditCountry" data-lang-key="select_country_placeholder">Select Country</span>
                                        <i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-300"></i>
                                    </button>
                                    <div id="editCountryMenu" class="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl hidden max-h-60 overflow-y-auto custom-scrollbar">
                                        <!-- Countries populated by JS -->
                                    </div>
                                    <input type="hidden" id="editCountryInput" name="country" value="${country}">
                                </div>
                            </div>

                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1" data-lang-key="city">City</label>
                                <div class="relative group" id="editCityDropdown">
                                    <button type="button" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-sm font-medium text-slate-400 hover:border-emerald-500 transition-all">
                                        <span id="selectedEditCity" data-lang-key="select_city_placeholder">Select City</span>
                                        <i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-300"></i>
                                    </button>
                                    <div id="editCityMenu" class="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl hidden max-h-60 overflow-y-auto custom-scrollbar">
                                        <!-- Cities populated by JS -->
                                    </div>
                                    <input type="hidden" id="editCityInput" name="city" value="${city}">
                                </div>
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1" data-lang-key="gender">Gender</label>
                                <div class="flex gap-3">
                                    <label class="flex-1 relative cursor-pointer group">
                                        <input type="radio" name="gender" value="male" class="peer sr-only" ${gender === 'male' ? 'checked' : ''}>
                                        <div class="p-3 text-center rounded-xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-500 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 peer-checked:text-white transition-all group-hover:bg-slate-100">
                                            <span data-lang-key="male">Male</span>
                                        </div>
                                    </label>
                                    <label class="flex-1 relative cursor-pointer group">
                                        <input type="radio" name="gender" value="female" class="peer sr-only" ${gender === 'female' ? 'checked' : ''}>
                                        <div class="p-3 text-center rounded-xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-500 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 peer-checked:text-white transition-all group-hover:bg-slate-100">
                                            <span data-lang-key="female">Female</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1" data-lang-key="birthdate">Date of Birth</label>
                                <input type="date" id="editBirthdate" name="birthdate" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-emerald-500 transition-all outline-none text-sm font-medium" value="${birthdate ? birthdate.split('T')[0] : ''}">
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        `;

        // Replace the container content (keep the section wrapper)
        const contentWrapper = container.querySelector('.grid');
        if (contentWrapper) {
            contentWrapper.style.display = 'none';
        }
        
        const existingEdit = document.getElementById('personalEditContainer');
        if (existingEdit) existingEdit.remove();

        const editContainer = document.createElement('div');
        editContainer.id = 'personalEditContainer';
        editContainer.innerHTML = editHTML;
        container.appendChild(editContainer);

        // Populate dropdowns
        this.populateCountryDropdownForEdit();
        this.populateCityDropdownForEdit();
        
        // Initialize custom dropdowns for the newly added edit form
        this.setupCustomDropdowns();

        // Setup image upload handling
        const picInput = document.getElementById('editProfilePicInput');
        const picPreview = document.getElementById('editAvatarPreview');
        const picPlaceholder = document.getElementById('editAvatarPlaceholder');
        const removePicBtn = document.getElementById('removeAvatarBtn');

        picInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.selectedProfilePicFile = file;
                this.profilePicRemoved = false;
                const reader = new FileReader();
                reader.onload = (event) => {
                    picPreview.src = event.target.result;
                    picPreview.classList.remove('hidden');
                    picPlaceholder.classList.add('hidden');
                    removePicBtn.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });

        removePicBtn.addEventListener('click', () => {
            this.selectedProfilePicFile = null;
            this.profilePicRemoved = true;
            picPreview.src = '';
            picPreview.classList.add('hidden');
            picPlaceholder.classList.remove('hidden');
            removePicBtn.classList.add('hidden');
            picInput.value = '';
        });

        // Setup event listeners
        const formInputs = editContainer.querySelectorAll('input, select, textarea');
        formInputs.forEach(input => {
            input.addEventListener('change', () => this.setDirty());
            if (input.type === 'text' || input.type === 'textarea') {
                input.addEventListener('input', () => this.setDirty());
            }
        });

        document.getElementById('cancelPersonalEdit').addEventListener('click', () => {
            this.exitEditMode('personal');
        });
        
        document.getElementById('savePersonalEdit').addEventListener('click', () => {
            this.savePersonalInfo();
        });

        // Apply translations to dynamic content
        if (typeof window.applyTranslations === 'function') {
            window.applyTranslations(window.currentLanguage || 'en');
        }
    },

    /**
     * Populate country dropdown for edit form
     */
    populateCountryDropdownForEdit() {
        const menu = document.getElementById('editCountryMenu');
        const display = document.getElementById('selectedEditCountry');
        const input = document.getElementById('editCountryInput');
        
        if (!menu || !window.palestinianCitiesTranslations) return;

        const lang = window.currentLanguage || 'en';
        let currentCountry = input?.value || window.currentUser?.country || '';

        // Mapping logic for legacy strings or custom names
        if (currentCountry && !currentCountry.startsWith('country_')) {
            const key = Object.keys(window.palestinianCitiesTranslations).find(k => 
                k.startsWith('country_') && 
                (window.palestinianCitiesTranslations[k].en === currentCountry || window.palestinianCitiesTranslations[k].ar === currentCountry)
            );
            if (key) {
                currentCountry = key;
            }
        }

        // Add search input at the top
        const searchPlaceholder = lang === 'ar' ? 'بحث عن دولة...' : 'Search country...';
        menu.innerHTML = `
            <div class="sticky top-0 bg-white p-2 border-b border-slate-50 z-10">
                <div class="relative">
                    <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input type="text" id="countrySearchInput" class="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:bg-white focus:border-emerald-500 transition-all outline-none" placeholder="${searchPlaceholder}">
                </div>
            </div>
            <div id="countryListItems" class="max-h-60 overflow-y-auto custom-scrollbar"></div>
        `;

        const listContainer = menu.querySelector('#countryListItems');
        const searchInput = menu.querySelector('#countrySearchInput');

        const countries = Object.keys(window.palestinianCitiesTranslations)
            .filter(key => key.startsWith('country_'))
            .map(key => ({
                key: key,
                name: window.palestinianCitiesTranslations[key][lang] || window.palestinianCitiesTranslations[key].en,
                en: window.palestinianCitiesTranslations[key].en,
                ar: window.palestinianCitiesTranslations[key].ar
            }))
            .sort((a, b) => {
                if (a.key === 'country_palestine') return -1;
                if (b.key === 'country_palestine') return 1;
                return a.name.localeCompare(b.name, lang);
            });

        const renderList = (filter = '') => {
            listContainer.innerHTML = '';
            const filtered = countries.filter(c => 
                c.name.toLowerCase().includes(filter.toLowerCase()) || 
                c.en.toLowerCase().includes(filter.toLowerCase()) ||
                (c.ar && c.ar.includes(filter))
            );

            if (filtered.length === 0) {
                listContainer.innerHTML = `<div class="p-4 text-center text-slate-400 text-xs">${lang === 'ar' ? 'لا توجد نتائج' : 'No results found'}</div>`;
                return;
            }

            filtered.forEach(country => {
                const isSelected = country.key === currentCountry;
                
                if (isSelected && display && !filter) {
                    display.textContent = country.name;
                    display.classList.remove('text-slate-400');
                    if (input) input.value = country.key;
                }

                const item = document.createElement('div');
                item.className = `p-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-all border-b border-slate-50 last:border-0 group ${isSelected ? 'bg-emerald-50/30' : ''}`;
                item.innerHTML = `
                    <span class="text-sm font-bold ${isSelected ? 'text-emerald-700' : 'text-slate-600'} group-hover:text-slate-900 transition-colors">${country.name}</span>
                    ${isSelected ? `
                        <div class="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-200 animate-in zoom-in-50 duration-200">
                            <i class="fa-solid fa-check text-[10px]"></i>
                        </div>
                    ` : `
                        <div class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 opacity-0 group-hover:opacity-100 transition-all">
                            <i class="fa-solid fa-globe text-[10px]"></i>
                        </div>
                    `}
                `;

                item.addEventListener('click', () => {
                    if (country.key === 'country_other') {
                        const customCountry = prompt(lang === 'ar' ? 'أدخل اسم الدولة:' : 'Enter country name:');
                        if (customCountry) {
                            this.selectCountry(customCountry, customCountry);
                        }
                    } else {
                        this.selectCountry(country.key, country.name);
                    }
                });

                listContainer.appendChild(item);
             });
         };

         // Handle custom country display (not a key)
         if (currentCountry && !currentCountry.startsWith('country_')) {
             if (display) {
                 display.textContent = currentCountry;
                 display.classList.remove('text-slate-400');
             }
         }

         searchInput.addEventListener('input', (e) => renderList(e.target.value));
        searchInput.addEventListener('click', (e) => e.stopPropagation());
        
        renderList();
    },

    selectCountry(value, label) {
        const display = document.getElementById('selectedEditCountry');
        const input = document.getElementById('editCountryInput');
        const cityInput = document.getElementById('editCityInput');
        const cityDisplay = document.getElementById('selectedEditCity');

        if (display) {
            display.textContent = label;
            display.classList.remove('text-slate-400');
            display.removeAttribute('data-lang-key');
        }
        
        if (input) {
            const oldVal = input.value;
            input.value = value;
            if (oldVal !== value) {
                // Reset city hidden input to ensure it doesn't carry over old city
                if (cityInput) cityInput.value = '';
                if (cityDisplay) {
                    cityDisplay.textContent = window.translations?.select_city_placeholder?.[window.currentLanguage || 'en'] || 'Select City';
                    cityDisplay.classList.add('text-slate-400');
                    cityDisplay.setAttribute('data-lang-key', 'select_city_placeholder');
                }
                this.setDirty();
            }
        }

        // Update menus
        this.populateCountryDropdownForEdit();
        this.populateCityDropdownForEdit();

        // Close menu
        const menu = document.getElementById('editCountryMenu');
        if (menu) menu.classList.add('hidden');
    },

    /**
     * Populate city dropdown for edit form
     */
    populateCityDropdownForEdit() {
        const menu = document.getElementById('editCityMenu');
        const display = document.getElementById('selectedEditCity');
        const input = document.getElementById('editCityInput');
        const countryInput = document.getElementById('editCountryInput');
        
        if (!menu || !window.palestinianCitiesTranslations) return;

        const lang = window.currentLanguage || 'en';
        const selectedCountryKey = countryInput?.value || '';
        
        let currentCity = input?.value || '';
        if (currentCity === '' && input && input.dataset.initialValue === undefined) {
            currentCity = window.currentUser?.city || '';
            input.dataset.initialValue = currentCity;
        }

        // Mapping logic for legacy strings or custom names
        if (currentCity && !currentCity.startsWith('city_')) {
            const key = Object.keys(window.palestinianCitiesTranslations).find(k => 
                k.startsWith('city_') && 
                (window.palestinianCitiesTranslations[k].en === currentCity || window.palestinianCitiesTranslations[k].ar === currentCity)
            );
            if (key) {
                currentCity = key;
            }
        }

        // If no country selected, show a message
        if (!selectedCountryKey) {
            const msg = window.translations?.select_country_first?.[lang] || 'Please select a country first';
            menu.innerHTML = `<div class="p-8 text-center text-slate-400 text-xs font-medium">${msg}</div>`;
            return;
        }

        // Add search input at the top
        const searchPlaceholder = lang === 'ar' ? 'بحث عن مدينة...' : 'Search city...';
        menu.innerHTML = `
            <div class="sticky top-0 bg-white p-2 border-b border-slate-50 z-10">
                <div class="relative">
                    <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input type="text" id="citySearchInput" class="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:bg-white focus:border-emerald-500 transition-all outline-none" placeholder="${searchPlaceholder}">
                </div>
            </div>
            <div id="cityListItems" class="max-h-60 overflow-y-auto custom-scrollbar"></div>
        `;

        const listContainer = menu.querySelector('#cityListItems');
        const searchInput = menu.querySelector('#citySearchInput');

        const cities = Object.keys(window.palestinianCitiesTranslations)
            .filter(key => {
                const data = window.palestinianCitiesTranslations[key];
                return key.startsWith('city_') && data.country === selectedCountryKey;
            })
            .map(key => ({
                key: key,
                name: window.palestinianCitiesTranslations[key][lang] || window.palestinianCitiesTranslations[key].en,
                en: window.palestinianCitiesTranslations[key].en,
                ar: window.palestinianCitiesTranslations[key].ar
            }))
            .sort((a, b) => a.name.localeCompare(b.name, lang));

        // Add "Other" option
        const otherKey = 'city_other';
        const otherData = window.palestinianCitiesTranslations[otherKey];
        if (otherData) {
            cities.push({ 
                key: otherKey, 
                name: otherData[lang] || otherData.en,
                en: otherData.en,
                ar: otherData.ar
            });
        }

        const renderList = (filter = '') => {
            listContainer.innerHTML = '';
            const filtered = cities.filter(c => 
                c.name.toLowerCase().includes(filter.toLowerCase()) || 
                c.en.toLowerCase().includes(filter.toLowerCase()) ||
                (c.ar && c.ar.includes(filter))
            );

            if (filtered.length === 0) {
                listContainer.innerHTML = `<div class="p-4 text-center text-slate-400 text-xs">${lang === 'ar' ? 'لا توجد نتائج' : 'No results found'}</div>`;
                return;
            }

            let cityFound = false;
            filtered.forEach(city => {
                const isSelected = city.key === currentCity;
                
                if (isSelected && !filter) {
                    cityFound = true;
                    if (display) {
                        display.textContent = city.name;
                        display.classList.remove('text-slate-400');
                    }
                    if (input) input.value = city.key;
                }

                const item = document.createElement('div');
                item.className = `p-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-all border-b border-slate-50 last:border-0 group ${isSelected ? 'bg-emerald-50/30' : ''}`;
                item.innerHTML = `
                    <span class="text-sm font-bold ${isSelected ? 'text-emerald-700' : 'text-slate-600'} group-hover:text-slate-900 transition-colors">${city.name}</span>
                    ${isSelected ? `
                        <div class="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-200 animate-in zoom-in-50 duration-200">
                            <i class="fa-solid fa-check text-[10px]"></i>
                        </div>
                    ` : `
                        <div class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 opacity-0 group-hover:opacity-100 transition-all">
                            <i class="fa-solid fa-location-dot text-[10px]"></i>
                        </div>
                    `}
                `;

                item.addEventListener('click', () => {
                    if (city.key === 'city_other') {
                        const customCity = prompt(lang === 'ar' ? 'أدخل اسم المدينة:' : 'Enter city name:');
                        if (customCity) {
                            this.selectCity(customCity, customCity);
                        }
                    } else {
                        this.selectCity(city.key, city.name);
                    }
                });

                listContainer.appendChild(item);
            });

            // If current city was not found in the list (custom value), show it
            if (!cityFound && currentCity && !currentCity.startsWith('city_') && !filter) {
                if (display) {
                    display.textContent = currentCity;
                    display.classList.remove('text-slate-400');
                }
            }
        };

        searchInput.addEventListener('input', (e) => renderList(e.target.value));
        searchInput.addEventListener('click', (e) => e.stopPropagation());
        
        renderList();
    },

    selectCity(key, label) {
        const display = document.getElementById('selectedEditCity');
        const input = document.getElementById('editCityInput');
        if (display) {
            display.textContent = label;
            display.classList.remove('text-slate-400');
            display.removeAttribute('data-lang-key');
        }
        if (input) {
            const oldVal = input.value;
            input.value = key;
            if (oldVal !== key) this.setDirty();
        }

        // Close menu
        const menu = document.getElementById('editCityMenu');
        if (menu) menu.classList.add('hidden');
        
        this.populateCityDropdownForEdit();
    },

    /**
     * Save personal info changes
     */
    async savePersonalInfo() {
        const form = document.getElementById('personalEditForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const btn = document.getElementById('savePersonalEdit');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        btn.disabled = true;

        try {
            const formData = new FormData();
            formData.append('firstName', document.getElementById('editFirstName').value);
            formData.append('lastName', document.getElementById('editLastName').value);
            formData.append('phone', document.getElementById('editPhone').value);
            formData.append('country', document.getElementById('editCountryInput').value);
            formData.append('city', document.getElementById('editCityInput').value);
            formData.append('birthdate', document.getElementById('editBirthdate').value);
            
            const gender = document.querySelector('input[name="gender"]:checked');
            if (gender) formData.append('gender', gender.value);

            // Handle Profile Picture
            if (this.profilePicRemoved) {
                formData.append('removeProfilePic', 'true');
            } else if (this.selectedProfilePicFile) {
                formData.append('profilePic', this.selectedProfilePicFile);
            }

            const result = await window.DashboardAPI.updateProfile(formData);
            
            if (result.success) {
                window.currentUser = result.data;
                this.renderPersonalSection(result.data);
                this.updateSidebar(result.data);
                
                if (window.DashboardUI) {
                    window.DashboardUI.showToast('Profile updated successfully!', 'success');
                }
                
                this.exitEditMode('personal');
            } else {
                throw new Error(result.message || 'Update failed');
            }
        } catch (error) {
            console.error('Save error:', error);
            if (window.DashboardUI) {
                window.DashboardUI.showToast(error.message || 'Failed to save changes', 'error');
            }
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },

    /**
     * Toggles the professional section between view and edit modes
     */
    toggleProfessionalEditMode(isEdit) {
        const section = document.getElementById('professionalSection');
        if (!section) return;

        const viewElements = section.querySelectorAll('.view-mode-only');
        const editElements = section.querySelectorAll('.edit-mode-only');

        if (isEdit) {
            viewElements.forEach(el => el.classList.add('hidden'));
            editElements.forEach(el => el.classList.remove('hidden'));
        } else {
            viewElements.forEach(el => el.classList.remove('hidden'));
            editElements.forEach(el => el.classList.add('hidden'));
            this.editMode.professional = false;
        }
    },

    /**
     * Renders professional section in edit mode (Populates existing fields)
     */
    renderProfessionalEditMode() {
        const user = window.currentUser;
        if (!user) return;

        // Reset state
        this.cvRemoved = false;
        
        // Get current values
        const bio = user.bio || '';
        const website = user.website_link || user.websiteLink || '';
        const currentStatus = user.current_status || user.currentStatus || '';
        const profession = user.profession || '';
        const cvPath = user.cv_path || user.cvPath;
        const lang = window.currentLanguage || 'en';
        
        // Populate Skills - handle various formats (array, JSON string, comma string)
        let skills = user.skills || [];
        if (typeof skills === 'string') {
            try { 
                const parsed = JSON.parse(skills); 
                skills = Array.isArray(parsed) ? parsed : skills.split(',').map(s => s.trim());
            } catch (e) { 
                skills = skills.split(',').map(s => s.trim()); 
            }
        }
        this.currentSkills = Array.isArray(skills) ? [...skills].filter(s => s !== '') : [];
        this.refreshSkillsEditUI(this.currentSkills);

        // Populate Interests - handle various formats
        let interests = user.interested_professions || user.interestedProfessions || [];
        if (typeof interests === 'string') {
            try { 
                const parsed = JSON.parse(interests);
                interests = Array.isArray(parsed) ? parsed : interests.split(',').map(i => i.trim());
            } catch (e) { 
                interests = interests.split(',').map(i => i.trim()); 
            }
        }
        this.selectedInterestedProfessions = Array.isArray(interests) ? [...interests].filter(i => i !== '') : [];
        
        // IMPORTANT: Ensure the UI is updated for interests
        this.updateInterestedProfessionsUI();

        // Populate Fields
        const bioInput = document.getElementById('editBio');
        const websiteInput = document.getElementById('editWebsite');
        const statusInput = document.getElementById('editStatus');
        const professionInput = document.getElementById('editProfession');

        if (bioInput) bioInput.value = bio;
        if (websiteInput) {
            websiteInput.value = website;
            console.log('Website populated:', website); // Debugging
        }
        if (statusInput) statusInput.value = currentStatus;
        if (professionInput) professionInput.value = profession;

        // Setup change listeners for unsaved changes warning
        const pEditForm = document.getElementById('professionalSection');
        const allInputs = pEditForm.querySelectorAll('input, textarea, select');
        allInputs.forEach(input => {
            if (input.dataset.listenerAdded) return;
            input.addEventListener('change', () => this.setDirty());
            if (input.type === 'text' || input.tagName === 'TEXTAREA') {
                input.addEventListener('input', () => this.setDirty());
            }
            input.dataset.listenerAdded = "true";
        });

        // Populate Dropdowns
        if (currentStatus) {
            const statusLabel = window.translations?.[`status_${currentStatus.toLowerCase()}`]?.[lang] || currentStatus;
            const statusIcon = {
                'Working': 'fa-solid fa-briefcase',
                'Freelancing': 'fa-solid fa-laptop-code',
                'Student': 'fa-solid fa-graduation-cap',
                'Other': 'fa-solid fa-circle-question'
            }[currentStatus] || 'fa-solid fa-circle-dot';
            this.selectStatus(currentStatus, statusLabel, statusIcon);
        }

        if (profession) {
            if (window.globalCategoriesAndProfessions) {
                const searchProf = profession.toLowerCase().trim();
                window.globalCategoriesAndProfessions.some(cat => {
                    const profObj = cat.professions.find(p => {
                        const enName = (typeof p === 'object' ? (p.en || p) : p).toLowerCase().trim();
                        return enName === searchProf;
                    });
                    
                    if (profObj) {
                        const catNameEn = cat.name.en || cat.name;
                        const catNameTranslated = cat.name[lang] || cat.name.en;
                        const profTranslated = typeof profObj === 'object' ? (profObj[lang] || profObj.en) : profObj;
                        
                        this.selectMainCategory(catNameEn, catNameTranslated, cat.icon);
                        this.selectSpecialization(profession, profTranslated);
                        return true;
                    }
                    return false;
                });
            }
        }

        // CV handling
        const cvInput = document.getElementById('editCvFile');
        const cvEmpty = document.getElementById('cvEmptyState');
        const cvActions = document.getElementById('cvFileActions');
        const cvNameDisplay = document.getElementById('cvFileNameDisplay');
        const removeCvBtn = document.getElementById('removeCvBtn');

        if (cvPath) {
            if (cvNameDisplay) cvNameDisplay.textContent = 'My CV.pdf';
            if (cvEmpty) cvEmpty.classList.add('hidden');
            if (cvActions) cvActions.classList.remove('hidden');
        } else {
            if (cvEmpty) cvEmpty.classList.remove('hidden');
            if (cvActions) cvActions.classList.add('hidden');
        }

        if (cvInput && !cvInput.dataset.listenerAdded) {
            cvInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.cvRemoved = false;
                    this.setDirty();
                    if (cvNameDisplay) cvNameDisplay.textContent = file.name;
                    if (cvEmpty) cvEmpty.classList.add('hidden');
                    if (cvActions) cvActions.classList.remove('hidden');
                }
            });
            cvInput.dataset.listenerAdded = "true";
        }

        if (removeCvBtn && !removeCvBtn.dataset.listenerAdded) {
            removeCvBtn.addEventListener('click', () => {
                this.cvRemoved = true;
                this.setDirty();
                if (cvInput) cvInput.value = '';
                if (cvEmpty) cvEmpty.classList.remove('hidden');
                if (cvActions) cvActions.classList.add('hidden');
            });
            removeCvBtn.dataset.listenerAdded = "true";
        }

        // Skill management logic
        const addSkillBtn = document.getElementById('addSkillBtn');
        const newSkillInput = document.getElementById('newSkillInput');
        
        const addSkill = () => {
            const skill = newSkillInput.value.trim();
            if (skill && !this.currentSkills.includes(skill)) {
                this.currentSkills.push(skill);
                this.refreshSkillsEditUI(this.currentSkills);
                this.setDirty();
                newSkillInput.value = '';
            }
        };

        if (addSkillBtn && !addSkillBtn.dataset.listenerAdded) {
            addSkillBtn.addEventListener('click', addSkill);
            addSkillBtn.dataset.listenerAdded = "true";
        }
        
        if (newSkillInput && !newSkillInput.dataset.listenerAdded) {
            newSkillInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                }
            });
            newSkillInput.dataset.listenerAdded = "true";
        }

        // Delegate skill/interest removals
        const skillsEditContainer = document.getElementById('editSkillsContainer');
        const interestsEditContainer = document.getElementById('editInterestsContainer');

        if (skillsEditContainer && !skillsEditContainer.dataset.listenerAdded) {
            skillsEditContainer.addEventListener('click', (e) => {
                const removeBtn = e.target.closest('.remove-skill-btn');
                if (removeBtn) {
                    const skillToRemove = removeBtn.dataset.skill;
                    this.currentSkills = this.currentSkills.filter(s => s !== skillToRemove);
                    this.refreshSkillsEditUI(this.currentSkills);
                    this.setDirty();
                }
            });
            skillsEditContainer.dataset.listenerAdded = "true";
        }

        if (interestsEditContainer && !interestsEditContainer.dataset.listenerAdded) {
            interestsEditContainer.addEventListener('click', (e) => {
                const removeBtn = e.target.closest('.remove-interest-btn');
                if (removeBtn) {
                    const interestToRemove = removeBtn.dataset.interest;
                    this.selectedInterestedProfessions = this.selectedInterestedProfessions.filter(i => i !== interestToRemove);
                    this.updateInterestedProfessionsUI();
                    this.setDirty();
                }
            });
            interestsEditContainer.dataset.listenerAdded = "true";
        }

        // Re-init dropdowns
        this.populateInterestedCategoriesDropdown();
        this.populateCategoryDropdowns();
        this.setupCustomDropdowns();

        // Show edit mode
        this.toggleProfessionalEditMode(true);

        if (typeof window.applyTranslations === 'function') {
            window.applyTranslations(window.currentLanguage || 'en');
        }
    },

    refreshSkillsEditUI(skills) {
        const container = document.getElementById('editSkillsContainer');
        if (!container) return;

        if (skills.length === 0) {
            container.innerHTML = `<span class="text-slate-300 text-xs italic" data-lang-key="no_skills_added">${window.translations?.no_skills_added?.[window.currentLanguage || 'en'] || 'No skills added yet'}</span>`;
            return;
        }

        container.innerHTML = skills.map(skill => `
            <span class="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100 flex items-center gap-2 animate-in zoom-in-95 duration-200">
                ${skill}
                <button type="button" class="remove-skill-btn hover:text-emerald-900 transition-colors" data-skill="${skill}"><i class="fa-solid fa-times text-[10px]"></i></button>
            </span>
        `).join('');
    },

    updateInterestedProfessionsUI() {
        const container = document.getElementById('editInterestsContainer');
        if (!container) return;

        const lang = window.currentLanguage || 'en';
        const count = this.selectedInterestedProfessions.length;

        if (count === 0) {
            container.innerHTML = `<span class="text-slate-300 text-xs italic" data-lang-key="no_interests_added">${window.translations?.no_interests_added?.[lang] || 'No interests added yet'}</span>`;
        } else {
            container.innerHTML = this.selectedInterestedProfessions.map(profEn => {
                let translatedName = profEn;
                if (window.globalCategoriesAndProfessions) {
                    window.globalCategoriesAndProfessions.some(cat => {
                        const prof = cat.professions.find(p => (typeof p === 'object' ? (p.en || p.name?.en || p) : p) === profEn);
                        if (prof) {
                            translatedName = typeof prof === 'object' ? (prof[lang] || prof.en || prof.name?.[lang] || prof.name?.en) : prof;
                            return true;
                        }
                        return false;
                    });
                }
                return `
                    <span class="px-3 py-1.5 bg-white text-slate-700 rounded-xl text-[11px] font-black border border-slate-100 shadow-sm flex items-center gap-2 animate-in zoom-in-95 duration-200 uppercase tracking-wider group hover:border-rose-100 transition-all">
                        <i class="fa-solid fa-star text-emerald-500 text-[8px]"></i>
                        ${translatedName}
                        <button type="button" class="remove-interest-btn text-slate-300 hover:text-rose-500 transition-colors" data-interest="${profEn}"><i class="fa-solid fa-circle-xmark"></i></button>
                    </span>
                `;
            }).join('');
        }

        // Add/Update limit hint with counter
        let hint = container.parentElement.querySelector('.interest-limit-hint');
        if (!hint) {
            hint = document.createElement('p');
            hint.className = 'interest-limit-hint text-[9px] font-bold mt-2 uppercase tracking-widest';
            container.parentElement.appendChild(hint);
        }
        
        const maxInterests = 5;
        if (count >= maxInterests) {
            hint.className = 'interest-limit-hint text-[9px] font-bold mt-2 uppercase tracking-widest text-rose-500 animate-pulse';
            hint.innerHTML = `<i class="fa-solid fa-circle-exclamation mr-1"></i> ${window.translations?.max_interests_reached?.[lang] || 'Maximum 5 interests reached'}`;
        } else {
            hint.className = 'interest-limit-hint text-[9px] font-bold mt-2 uppercase tracking-widest text-slate-400';
            const interestsSelectedText = window.translations?.interests_selected?.[lang] || 'interests selected';
            hint.innerHTML = `<i class="fa-solid fa-circle-info mr-1"></i> ${count}/${maxInterests} ${interestsSelectedText}`;
        }

        // Apply translations to the newly added hint if needed
        if (typeof window.applyTranslations === 'function') {
            window.applyTranslations(lang);
        }
    },

    toggleInterestedProfession(profEn, profTranslated) {
        const index = this.selectedInterestedProfessions.indexOf(profEn);
        const lang = window.currentLanguage || 'en';
        
        if (index > -1) {
            this.selectedInterestedProfessions.splice(index, 1);
        } else {
            if (this.selectedInterestedProfessions.length >= 5) {
                const msg = window.translations?.max_interests_reached?.[lang] || 'You can select up to 5 interests only.';
                if (window.DashboardUI) window.DashboardUI.showToast(msg, 'warning');
                return;
            }
            this.selectedInterestedProfessions.push(profEn);
        }
        
        this.setDirty();
        this.updateInterestedProfessionsUI();
        
        // Keep the dropdown open by re-populating it to show updated checkmarks
        const currentCategory = document.getElementById('selectedInterestCategory')?.dataset.value;
        if (currentCategory) {
            this.populateInterestProfessions(currentCategory);
        }
    },

    async saveProfessionalInfo() {
        const btn = document.getElementById('saveProfessionalEdit');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        btn.disabled = true;

        try {
            const formData = new FormData();
            formData.append('bio', document.getElementById('editBio').value);
            formData.append('website_link', document.getElementById('editWebsite').value);
            formData.append('current_status', document.getElementById('editStatus').value);
            formData.append('profession', document.getElementById('editProfession').value);
            
            // Skills
            formData.append('skills', this.currentSkills.join(', '));

            // Interested Professions
            formData.append('interested_professions', JSON.stringify(this.selectedInterestedProfessions));

            // CV Handling
            if (this.cvRemoved) {
                formData.append('removeCv', 'true');
            } else {
                const cvFile = document.getElementById('editCvFile').files[0];
                if (cvFile) formData.append('cv', cvFile);
            }

            const result = await window.DashboardAPI.updateProfile(formData);
            
            if (result.success) {
                window.currentUser = result.data;
                this.renderProfessionalSection(result.data);
                if (window.DashboardUI) {
                    window.DashboardUI.showToast('Professional info updated!', 'success');
                }
                this.exitEditMode('professional');
            } else {
                throw new Error(result.message || 'Update failed');
            }
        } catch (error) {
            console.error('Save error:', error);
            if (window.DashboardUI) {
                window.DashboardUI.showToast(error.message || 'Failed to save changes', 'error');
            }
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },

    /**
     * Exit edit mode and return to view mode
     */
    exitEditMode(section) {
        this.editMode[section] = false;
        this.hasUnsavedChanges = false;

        // Special handling for professional section (inline editing)
        if (section === 'professional') {
            this.toggleProfessionalEditMode(false);
            this.renderProfessionalSection(window.currentUser);
            return;
        }

        const container = document.getElementById(`${section}Section`);
        const editContainer = document.getElementById(`${section}EditContainer`);
        
        if (editContainer) {
            editContainer.remove();
        }

        // Show the original content
        const contentWrapper = container.querySelector('.grid');
        if (contentWrapper) {
            contentWrapper.style.display = '';
        }

        // Re-render the section to ensure data is fresh
        if (window.currentUser) {
            switch(section) {
                case 'personal':
                    this.renderPersonalSection(window.currentUser);
                    break;
                case 'professional':
                    this.renderProfessionalSection(window.currentUser);
                    break;
                case 'education':
                    this.renderEducationSection(window.currentUser);
                    break;
            }
        }
    },

    /**
     * Renders view sections with current user data
     */
    renderViewSections(user) {
        if (!user) return;
        this.renderPersonalSection(user);
        this.renderProfessionalSection(user);
        this.renderEducationSection(user);
        this.renderProfileCardSection(user);
    },

    /**
     * Renders the profile card preview and QR code
     */
    renderProfileCardSection(user) {
        const u = { ...user, ...(user.profile || {}) };
        const lang = window.currentLanguage || 'en';
        
        const fullName = `${u.first_name || u.firstName || ''} ${u.last_name || u.lastName || ''}`.trim() || u.username || (window.translations?.professional?.[lang] || 'Professional');
        let profession = u.profession || (window.translations?.professional?.[lang] || 'Professional');
        if (u.profession && window.globalCategoriesAndProfessions) {
            window.globalCategoriesAndProfessions.some(cat => {
                const prof = cat.professions.find(p => {
                    const enName = (typeof p === 'object' ? (p.en || p) : p).toLowerCase().trim();
                    return enName === u.profession.toLowerCase().trim();
                });
                if (prof) {
                    profession = typeof prof === 'object' ? (prof[lang] || prof.en) : prof;
                    return true;
                }
                return false;
            });
        }

        const bio = u.bio || (window.translations?.no_bio_added?.[lang] || 'No bio added yet.');
        const views = u.profile_views || 0;
        
        // Update basic info
        const nameEl = document.getElementById('viewProfileCardName');
        const profEl = document.getElementById('viewProfileCardProfession');
        const bioEl = document.getElementById('viewProfileCardBio');
        const viewsEl = document.getElementById('viewProfileCardViewsCount');
        
        if (nameEl) nameEl.textContent = fullName;
        if (profEl) profEl.textContent = profession;
        if (bioEl) bioEl.textContent = bio;
        if (viewsEl) {
            viewsEl.textContent = `${views} ${window.translations?.views?.[lang] || 'Views'}`;
        }
        
        // Update Avatar
        const avatarPlaceholder = document.getElementById('viewProfileCardAvatar');
        const avatarImg = document.getElementById('viewProfileCardAvatarImg');
        
        if (u.profile_picture_url || u.profilePictureUrl) {
            if (avatarPlaceholder) avatarPlaceholder.classList.add('hidden');
            if (avatarImg) {
                avatarImg.src = u.profile_picture_url || u.profilePictureUrl;
                avatarImg.classList.remove('hidden');
            }
        } else {
            if (avatarPlaceholder) {
                avatarPlaceholder.textContent = fullName.charAt(0).toUpperCase();
                avatarPlaceholder.classList.remove('hidden');
            }
            if (avatarImg) avatarImg.classList.add('hidden');
        }
        
        // Update Skills
        const skillsContainer = document.getElementById('viewProfileCardSkills');
        if (skillsContainer) {
            skillsContainer.innerHTML = '';
            let skills = u.skills || [];
            if (typeof skills === 'string') {
                try { skills = JSON.parse(skills); } catch (e) { skills = skills.split(',').map(s => s.trim()); }
            }
            if (Array.isArray(skills) && skills.length > 0) {
                skills.slice(0, 4).forEach(skill => {
                    const tag = document.createElement('span');
                    tag.className = 'px-2 py-1 bg-slate-50 text-slate-600 rounded-lg text-[8px] font-bold uppercase tracking-wider border border-slate-100';
                    tag.textContent = skill;
                    skillsContainer.appendChild(tag);
                });
                if (skills.length > 4) {
                    const more = document.createElement('span');
                    more.className = 'px-2 py-1 text-slate-400 text-[8px] font-bold';
                    more.textContent = `+${skills.length - 4}`;
                    skillsContainer.appendChild(more);
                }
            }
        }
        
        // Update Visit Link
        const visitBtn = document.getElementById('visitMyProfileBtn');
        if (visitBtn) {
            const profileUrl = u.slug ? `${window.location.origin}/${u.slug}` : `${window.location.origin}/profile.html?id=${u.id}`;
            visitBtn.href = profileUrl;
        }
        
        // Generate QR Code
        this.generateQRCode(u.id, u.slug);
    },

    /**
     * Generates a QR code for the user profile
     */
    generateQRCode(userId, slug = null) {
        const container = document.getElementById('qrCodeContainer');
        if (!container || !userId) return;
        
        const profileUrl = slug ? `${window.location.origin}/${slug}` : `${window.location.origin}/profile.html?id=${userId}`;
        container.innerHTML = '';
        
        try {
            if (typeof QRCode !== 'undefined') {
                new QRCode(container, {
                    text: profileUrl,
                    width: 160,
                    height: 160,
                    colorDark: "#0f172a", // slate-900
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
            } else {
                container.innerHTML = '<div class="text-xs text-slate-400 italic">QR Code library not loaded</div>';
            }
        } catch (error) {
            console.error('QR Code generation failed:', error);
        }
    },

    /**
     * Opens the share modal with profile link
     */
    openShareModal() {
        const user = window.currentUser;
        if (!user) return;
        
        const profileUrl = user.slug ? `${window.location.origin}/${user.slug}` : `${window.location.origin}/profile.html?id=${user.id}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Hirly Professional Profile',
                text: `Check out my professional profile on Hirly!`,
                url: profileUrl
            }).catch(console.error);
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(profileUrl).then(() => {
                const lang = window.currentLanguage || 'en';
                const msg = window.translations?.link_copied?.[lang] || 'Profile link copied to clipboard!';
                window.DashboardUI.showToast(msg, 'success');
            });
        }
    },

    /**
     * Downloads the generated QR code as an image
     */
    downloadQRCode() {
        const container = document.getElementById('qrCodeContainer');
        if (!container) return;
        
        const img = container.querySelector('img');
        if (!img) {
            const canvas = container.querySelector('canvas');
            if (canvas) {
                const link = document.createElement('a');
                link.download = 'hirly-profile-qr.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            }
            return;
        }
        
        const link = document.createElement('a');
        link.download = 'hirly-profile-qr.png';
        link.href = img.src;
        link.click();
    },

    /**
     * Renders the personal info view section
     */
    renderPersonalSection(user) {
        const u = { ...user, ...(user.profile || {}) };
        const lang = window.currentLanguage || 'en';

        const fullName = `${u.first_name || u.firstName || ''} ${u.last_name || u.lastName || ''}`.trim();
        const email = u.email || '-';
        const phone = u.phone || '-';
        
        let countryLabel = '-';
        if (u.country && window.palestinianCitiesTranslations) {
            let countryKey = u.country;
            // If it's a name, find the key
            if (!countryKey.startsWith('country_')) {
                const foundKey = Object.keys(window.palestinianCitiesTranslations).find(k => 
                    k.startsWith('country_') && 
                    (window.palestinianCitiesTranslations[k].en === countryKey || window.palestinianCitiesTranslations[k].ar === countryKey)
                );
                if (foundKey) countryKey = foundKey;
            }
            
            const countryData = window.palestinianCitiesTranslations[countryKey];
            if (countryData) countryLabel = countryData[lang] || countryData.en;
            else countryLabel = u.country;
        }

        let cityLabel = '-';
        if (u.city && window.palestinianCitiesTranslations) {
            let cityKey = u.city;
            // If it's a name, find the key
            if (!cityKey.startsWith('city_')) {
                const foundKey = Object.keys(window.palestinianCitiesTranslations).find(k => 
                    k.startsWith('city_') && 
                    (window.palestinianCitiesTranslations[k].en === cityKey || window.palestinianCitiesTranslations[k].ar === cityKey)
                );
                if (foundKey) cityKey = foundKey;
            }

            const cityData = window.palestinianCitiesTranslations[cityKey];
            if (cityData) cityLabel = cityData[lang] || cityData.en;
            else cityLabel = u.city;
        }

        const genderKey = u.gender ? `gender_${String(u.gender).toLowerCase()}` : null;
        const genderLabel = genderKey ? (window.translations?.[genderKey]?.[lang] || u.gender) : '-';
        
        const birthdate = u.birthdate || u.birthday;
        const birthdateLabel = birthdate ? new Date(birthdate).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : '-';

        const elements = {
            'viewFullName': fullName,
            'viewEmail': email,
            'viewPhone': phone,
            'viewCountry': countryLabel,
            'viewCity': cityLabel,
            'viewGender': genderLabel,
            'viewBirthdate': birthdateLabel
        };

        for (const [id, value] of Object.entries(elements)) {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        }
    },

    /**
     * Renders the professional info view section
     */
    renderProfessionalSection(user) {
        const u = { ...user, ...(user.profile || {}) };
        const lang = window.currentLanguage || 'en';

        // Bio
        const bioEl = document.getElementById('viewBio');
        if (bioEl) {
            bioEl.textContent = u.bio || (window.translations?.no_bio_added?.[lang] || 'No bio added yet.');
            bioEl.className = u.bio ? "text-sm text-slate-600 leading-relaxed font-medium" : "text-sm text-slate-400 italic font-medium";
        }

        // Skills
        const skillsContainer = document.getElementById('viewSkills');
        if (skillsContainer) {
            skillsContainer.innerHTML = '';
            let skills = u.skills || [];
            if (typeof skills === 'string') {
                try { skills = JSON.parse(skills); } catch (e) { skills = skills.split(',').map(s => s.trim()); }
            }
            if (Array.isArray(skills) && skills.length > 0) {
                skills.forEach(skill => {
                    if (!skill) return;
                    const tag = document.createElement('span');
                    tag.className = 'px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-wider border border-emerald-100/50 shadow-sm shadow-emerald-50/50 transition-all hover:scale-105 flex items-center gap-2';
                    tag.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles text-[8px]"></i> ${skill}`;
                    skillsContainer.appendChild(tag);
                });
            } else {
                skillsContainer.innerHTML = `<span class="text-xs text-slate-400 italic font-medium">${window.translations?.no_skills_added?.[lang] || 'No skills added yet.'}</span>`;
            }
        }

        // Career Info
        const statusKey = u.current_status || u.currentStatus;
        const statusLabel = statusKey ? (window.translations?.[`status_${String(statusKey).toLowerCase()}`]?.[lang] || statusKey) : '-';
        
        // Update Status Icon based on value
        const statusIconEl = document.querySelector('#viewCurrentStatus').parentElement.nextElementSibling?.querySelector('i');
        if (statusIconEl) {
            const statusIcons = {
                'Working': 'fa-solid fa-briefcase',
                'Freelancing': 'fa-solid fa-laptop-code',
                'Student': 'fa-solid fa-graduation-cap',
                'Other': 'fa-solid fa-circle-question'
            };
            statusIconEl.className = (statusIcons[statusKey] || 'fa-solid fa-circle-dot') + ' transition-all duration-300';
        }

        let professionLabel = '-';
        if (u.profession) {
            if (window.globalCategoriesAndProfessions) {
                const searchProf = u.profession.toLowerCase().trim();
                window.globalCategoriesAndProfessions.some(cat => {
                    const prof = cat.professions.find(p => {
                        const enName = (typeof p === 'object' ? (p.en || p) : p).toLowerCase().trim();
                        return enName === searchProf;
                    });
                    
                    if (prof) {
                        professionLabel = typeof prof === 'object' ? (prof[lang] || prof.en) : prof;
                        return true;
                    }
                    return false;
                });
            } else {
                professionLabel = u.profession;
            }
        }

        const websiteEl = document.getElementById('viewWebsite');
        if (websiteEl) {
            const link = u.website_link || u.websiteLink;
            if (link) {
                websiteEl.textContent = link.replace(/^https?:\/\//, '');
                websiteEl.href = link.startsWith('http') ? link : `https://${link}`;
                websiteEl.classList.remove('text-slate-400', 'italic');
                websiteEl.classList.add('text-indigo-600');
            } else {
                websiteEl.textContent = '-';
                websiteEl.href = '#';
                websiteEl.classList.add('text-slate-400', 'italic');
                websiteEl.classList.remove('text-indigo-600');
            }
        }

        // Interests
        const interestsContainer = document.getElementById('viewInterestedProfessions');
        if (interestsContainer) {
            interestsContainer.innerHTML = '';
            let interests = u.interested_professions || u.interestedProfessions || [];
            if (typeof interests === 'string') {
                try { interests = JSON.parse(interests); } catch (e) { interests = interests.split(',').map(i => i.trim()); }
            }
            if (Array.isArray(interests) && interests.length > 0) {
                interests.forEach(profEn => {
                    let translatedName = profEn;
                    if (window.globalCategoriesAndProfessions) {
                        window.globalCategoriesAndProfessions.some(cat => {
                            const prof = cat.professions.find(p => (p.en || p) === profEn);
                            if (prof) {
                                translatedName = typeof prof === 'object' ? (prof[lang] || prof.en) : prof;
                                return true;
                            }
                            return false;
                        });
                    }
                    const tag = document.createElement('span');
                    tag.className = 'px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-100 shadow-sm shadow-slate-100/50 transition-all hover:scale-105 flex items-center gap-2';
                    tag.innerHTML = `<i class="fa-solid fa-star text-emerald-500 text-[8px]"></i> ${translatedName}`;
                    interestsContainer.appendChild(tag);
                });
            } else {
                interestsContainer.innerHTML = `<span class="text-xs text-slate-400 italic font-medium">${window.translations?.no_interests_added?.[lang] || 'No interests added yet.'}</span>`;
            }
        }

        // CV
        const cvLink = document.getElementById('viewCvFile');
        const cvWrapper = document.getElementById('viewCvWrapper');
        const viewCvEmptyState = document.getElementById('viewCvEmptyState');
        const cvPath = u.cv_path || u.cvPath;
        
        if (cvPath) {
            if (cvLink) cvLink.href = cvPath;
            if (cvWrapper) cvWrapper.classList.remove('hidden');
            if (viewCvEmptyState) viewCvEmptyState.classList.add('hidden');
        } else {
            if (cvWrapper) cvWrapper.classList.add('hidden');
            if (viewCvEmptyState) viewCvEmptyState.classList.remove('hidden');
        }

        const elements = {
            'viewCurrentStatus': statusLabel,
            'viewProfession': professionLabel
        };

        for (const [id, value] of Object.entries(elements)) {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        }
    },

    /**
     * Renders the education history view section
     */
    async renderEducationSection(user) {
        // Fetch fresh education data from API
        try {
            const response = await fetch('/api/user/education');
            const result = await response.json();
            
            if (result.success) {
                this.educationHistory = result.data.map(e => {
                    // Extract year from date string (e.g. "2026-01-01" or ISO string)
                    let yearOnly = e.end_date;
                    if (e.end_date) {
                        const dateObj = new Date(e.end_date);
                        if (!isNaN(dateObj.getTime())) {
                            yearOnly = dateObj.getFullYear().toString();
                        }
                    }
                    
                    return {
                        id: e.id,
                        type: e.type.charAt(0).toUpperCase() + e.type.slice(1),
                        organization: e.institution_name,
                        orgId: e.institution_id,
                        title: e.title,
                        field: e.field_of_study,
                        level: e.education_level,
                        date: yearOnly,
                        link: e.credential_url
                    };
                });
            }
        } catch (error) {
            console.error('Error fetching education:', error);
            let history = user.education_history || [];
            if (typeof history === 'string') {
                try { history = JSON.parse(history); } catch (e) { history = []; }
            }
            this.educationHistory = Array.isArray(history) ? [...history] : [];
        }

        // Toggle header Add button visibility based on history
        const headerAddBtn = document.getElementById('addEducationBtn');
        if (headerAddBtn) {
            // Only show in header if we already have entries
            headerAddBtn.classList.toggle('hidden', this.educationHistory.length === 0);
        }

        this.renderEducationList(true); // Always show actions in this unified view
    },

    /**
     * Renders the education list into the container
     */
    renderEducationList(showActions = true) {
        const container = document.getElementById('viewEducationList');
        if (!container) return;

        const lang = window.currentLanguage || 'en';

        if (this.educationHistory.length === 0) {
            container.innerHTML = `
                <div class="empty-state col-span-full py-16 text-center bg-slate-50/50 rounded-[40px] border border-dashed border-slate-200 animate-in fade-in zoom-in-95 duration-700">
                    <div class="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 mb-6 mx-auto shadow-sm border border-slate-50">
                        <i class="fa-solid fa-graduation-cap text-3xl"></i>
                    </div>
                    <h3 class="text-base font-black text-slate-400 uppercase tracking-[0.2em]" data-lang-key="no_education">${window.translations?.no_education?.[lang] || 'No education history'}</h3>
                    <p class="text-sm text-slate-300 font-medium mt-2 mb-8" data-lang-key="no_education_desc">${window.translations?.no_education_desc?.[lang] || 'Add your degrees and academic achievements'}</p>
                    
                    <button onclick="document.getElementById('addEducationBtn').click()" class="px-8 py-4 bg-slate-900 text-white text-xs font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 uppercase tracking-[0.2em] flex items-center gap-3 mx-auto group">
                        <i class="fa-solid fa-plus text-[10px] group-hover:rotate-90 transition-transform duration-300"></i>
                        <span data-lang-key="add_education">${window.translations?.add_education?.[lang] || 'Add Education'}</span>
                    </button>
                </div>
            `;
            return;
        }

        // Section by type
        const types = ['University', 'School', 'Certificate', 'Course'];
        let html = '';

        types.forEach(type => {
            const items = this.educationHistory.filter(e => e.type === type || (!e.type && type === 'University'));
            if (items.length > 0) {
                const typeLabel = window.translations?.[type.toLowerCase()]?.[window.currentLanguage] || type;
                const iconClass = type === 'University' ? 'fa-graduation-cap text-indigo-500 bg-indigo-50' : (type === 'School' ? 'fa-school text-blue-500 bg-blue-50' : (type === 'Certificate' ? 'fa-award text-emerald-500 bg-emerald-50' : 'fa-book text-amber-500 bg-amber-50'));
                const accentColor = type === 'University' ? 'indigo' : (type === 'School' ? 'blue' : (type === 'Certificate' ? 'emerald' : 'amber'));

                html += `
                    <div class="col-span-full mt-4 first:mt-0">
                        <div class="flex items-center gap-3 mb-6">
                            <div class="h-[1px] flex-1 bg-slate-100"></div>
                            <span class="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">${typeLabel}</span>
                            <div class="h-[1px] flex-1 bg-slate-100"></div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            ${items.map(edu => `
                                <div id="edu-card-${edu.id}" class="p-6 bg-white rounded-[28px] border border-slate-100 flex flex-col group hover:border-${accentColor}-200 hover:shadow-xl hover:shadow-${accentColor}-50/30 transition-all duration-500 animate-in slide-in-from-bottom-2">
                                    <div id="edu-view-${edu.id}" class="flex items-center justify-between w-full">
                                        <div class="flex items-center gap-5">
                                            <div class="w-14 h-14 ${iconClass.split(' ').slice(1).join(' ')} rounded-[20px] flex items-center justify-center transition-all duration-500 group-hover:scale-110">
                                                <i class="fa-solid ${iconClass.split(' ')[0]} text-xl"></i>
                                            </div>
                                            <div>
                                                <h4 class="text-sm font-black text-slate-700 group-hover:text-slate-900 transition-colors uppercase tracking-wider">${edu.organization}</h4>
                                                <div class="flex flex-wrap items-center gap-2 mt-1">
                                                    <span class="text-[10px] font-black text-${accentColor}-500 uppercase tracking-widest">${edu.title}</span>
                                                    ${edu.level ? `
                                                        <span class="w-1 h-1 rounded-full bg-slate-200"></span>
                                                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${window.translations?.[`degree_${edu.level.toLowerCase()}`]?.[lang] || edu.level}</span>
                                                    ` : ''}
                                                    ${edu.field ? `
                                                        <span class="w-1 h-1 rounded-full bg-slate-200"></span>
                                                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${edu.field}</span>
                                                    ` : ''}
                                                </div>
                                                <div class="flex items-center gap-4 mt-3">
                                                    <div class="flex items-center gap-1.5">
                                                        <i class="fa-solid fa-calendar-check text-[8px] text-slate-300"></i>
                                                        <span class="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">${edu.date}</span>
                                                    </div>
                                                    ${edu.link ? `
                                                        <a href="${edu.link}" target="_blank" class="flex items-center gap-1.5 text-indigo-500 hover:text-indigo-600 transition-colors">
                                                            <i class="fa-solid fa-external-link text-[8px]"></i>
                                                            <span class="text-[9px] font-black uppercase tracking-[0.2em]">${window.translations?.view?.[lang] || 'View'}</span>
                                                        </a>
                                                    ` : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <button type="button" class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 hover:bg-indigo-50 hover:text-indigo-500 transition-all duration-300" onclick="DashboardProfile.editEducationEntry('${edu.id}')">
                                                <i class="fa-solid fa-pen-to-square text-xs"></i>
                                            </button>
                                            <button type="button" class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all duration-300" onclick="DashboardProfile.removeEducationEntry('${edu.id}')">
                                                <i class="fa-solid fa-trash-can text-xs"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div id="edu-edit-${edu.id}" class="hidden w-full animate-in fade-in slide-in-from-top-2 duration-300"></div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        });

        container.innerHTML = html;
    },

    async removeEducationEntry(id) {
        const lang = window.currentLanguage || 'en';
        const confirmMsg = window.translations?.confirm_delete?.[lang] || 'Are you sure you want to delete this?';
        if (!confirm(confirmMsg)) return;

        try {
            const response = await fetch(`/api/user/education/${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (result.success) {
                window.DashboardUI.showToast(result.message || 'Removed successfully', 'success');
                await this.renderEducationSection(window.currentUser);
            } else {
                window.DashboardUI.showToast(result.error || 'Failed to remove', 'error');
            }
        } catch (error) {
            console.error('Error removing education:', error);
            window.DashboardUI.showToast('Server error', 'error');
        }
    },

    populateInterestedCategoriesDropdown() {
        const menu = document.getElementById('interestCategoryMenu');
        if (!menu || !window.globalCategoriesAndProfessions) return;

        const lang = window.currentLanguage || 'en';
        const currentCategoryValue = document.getElementById('selectedInterestCategory')?.dataset.value;
        menu.innerHTML = '';

        // Sort categories alphabetically by translated name
        const sortedCategories = [...window.globalCategoriesAndProfessions].sort((a, b) => {
            const nameA = typeof a.name === 'object' ? (a.name[lang] || a.name.en) : a.name;
            const nameB = typeof b.name === 'object' ? (b.name[lang] || b.name.en) : b.name;
            return nameA.localeCompare(nameB, lang);
        });

        sortedCategories.forEach(cat => {
            const nameEn = typeof cat.name === 'object' ? cat.name.en : cat.name;
            const nameTranslated = typeof cat.name === 'object' ? (cat.name[lang] || cat.name.en) : cat.name;
            const isSelected = nameEn === currentCategoryValue;

            const item = document.createElement('div');
            item.className = `p-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-all border-b border-slate-50 last:border-0 group ${isSelected ? 'bg-purple-50/30' : ''}`;
            
            item.innerHTML = `
                <div class="flex items-center gap-4">
                    <div class="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-500 transition-all ${isSelected ? 'bg-purple-50 text-purple-500' : ''}">
                        <i class="${cat.icon || 'fas fa-briefcase'} text-sm"></i>
                    </div>
                    <span class="font-bold text-slate-700 group-hover:text-slate-900 ${isSelected ? 'text-purple-700' : ''}">${nameTranslated}</span>
                </div>
                ${isSelected ? `
                    <div class="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white shadow-sm shadow-purple-200 animate-in zoom-in-50 duration-200">
                        <i class="fa-solid fa-check text-[10px]"></i>
                    </div>
                ` : `
                    <div class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 opacity-0 group-hover:opacity-100 transition-all">
                        <i class="fa-solid fa-arrow-right text-[10px]"></i>
                    </div>
                `}
            `;

            item.addEventListener('click', () => {
                this.selectInterestCategory(nameEn, nameTranslated, cat.icon);
            });

            menu.appendChild(item);
        });
    },

    populateSpecializations(categoryName) {
        const menu = document.getElementById('currentProfessionMenu');
        if (!menu || !window.globalCategoriesAndProfessions) return;

        const category = window.globalCategoriesAndProfessions.find(c => {
            const nameEn = typeof c.name === 'object' ? c.name.en : c.name;
            return nameEn === categoryName;
        });

        if (!category || !category.professions) return;

        const lang = window.currentLanguage || 'en';
        menu.innerHTML = '';

        // Sort professions alphabetically by translated name
        const sortedProfessions = [...category.professions].sort((a, b) => {
            const nameA = typeof a === 'object' ? (a[lang] || a.en) : a;
            const nameB = typeof b === 'object' ? (b[lang] || b.en) : b;
            return nameA.localeCompare(nameB, lang);
        });

        sortedProfessions.forEach(prof => {
            const profEn = prof.en || prof;
            const profTranslated = typeof prof === 'object' ? (prof[lang] || prof.en) : prof;
            const isSelected = document.getElementById('editProfession').value === profEn;

            const item = document.createElement('div');
            item.className = `p-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-all border-b border-slate-50 last:border-0 group ${isSelected ? 'bg-emerald-50/30' : ''}`;
            item.innerHTML = `
                <span class="text-sm font-bold ${isSelected ? 'text-emerald-700' : 'text-slate-600'} group-hover:text-slate-900 transition-colors">${profTranslated}</span>
                ${isSelected ? `
                    <div class="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-200 animate-in zoom-in-50 duration-200">
                        <i class="fa-solid fa-check text-[10px]"></i>
                    </div>
                ` : `
                    <div class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 opacity-0 group-hover:opacity-100 transition-all">
                        <i class="fa-solid fa-arrow-right text-[10px]"></i>
                    </div>
                `}
            `;

            item.addEventListener('click', () => {
                this.selectSpecialization(profEn, profTranslated);
            });

            menu.appendChild(item);
        });
    },

    selectMainCategory(value, label, icon) {
        const selectedDisplay = document.getElementById('selectedMainCategory');
        if (selectedDisplay) {
            const oldVal = selectedDisplay.dataset.value;
            selectedDisplay.textContent = label;
            selectedDisplay.dataset.value = value;
            selectedDisplay.classList.remove('text-slate-400');
            selectedDisplay.removeAttribute('data-lang-key');
            if (oldVal !== value) this.setDirty();
        }
        this.populateSpecializations(value);

        // Update the category menu to show the new checkmark
        this.populateCategoryDropdowns();

        // Close menu
        const menu = document.getElementById('mainCategoryMenu');
        if (menu) menu.classList.add('hidden');
    },

    selectStatus(value, label, icon) {
        const display = document.getElementById('selectedEditStatus') || document.getElementById('selectedCurrentStatus');
        const input = document.getElementById('editStatus');
        const iconEl = document.getElementById('editStatusIcon');

        if (display) {
            display.textContent = label;
            display.dataset.value = value;
            display.classList.remove('text-slate-400');
        }
        if (input) {
            const oldVal = input.value;
            input.value = value;
            if (oldVal !== value) this.setDirty();
        }
        if (iconEl && icon) {
            iconEl.className = `${icon} text-emerald-500 transition-all duration-300`;
        }

        // Re-populate menu to show checkmark
        this.populateStatusDropdown();

        // Close menu
        const menu = document.getElementById('editStatusMenu') || document.getElementById('currentStatusMenu');
        if (menu) menu.classList.add('hidden');
    },

    selectSpecialization(value, label) {
        const display = document.getElementById('selectedSpecialization');
        const input = document.getElementById('editProfession');
        if (display) {
            display.textContent = label;
            display.dataset.value = value;
            display.classList.remove('text-slate-400');
            display.removeAttribute('data-lang-key');
        }
        if (input) {
            const oldVal = input.value;
            input.value = value;
            if (oldVal !== value) this.setDirty();
        }

        // Close menu
        const menu = document.getElementById('currentProfessionMenu');
        if (menu) menu.classList.add('hidden');
    },

    resetDropdown(displayId, placeholderKey, defaultText) {
        const display = document.getElementById(displayId);
        if (!display) return;
        
        const lang = window.currentLanguage || 'en';
        display.textContent = window.translations?.[placeholderKey]?.[lang] || defaultText;
        display.dataset.value = '';
        display.classList.add('text-slate-400');
        display.setAttribute('data-lang-key', placeholderKey);
    },

    resetProfessionalForm() {
        this.resetDropdown('selectedCurrentStatus', 'select_status_placeholder', 'Select Status');
        this.resetDropdown('selectedMainCategory', 'select_category_placeholder', 'Select Category');
        this.resetDropdown('selectedSpecialization', 'select_specialization_placeholder', 'Select Specialization');
        this.selectedInterestedProfessions = [];
        this.updateInterestedProfessionsUI();
    },

    resetDegreeEntryForm() {
        const uniSelect = document.getElementById('dashboardUniSelect');
        if (uniSelect) uniSelect.value = '';
    },

    selectStudyFieldCategory(value, label, icon) {
        const selectedDisplay = document.getElementById('selectedStudyFieldCategory');
        if (selectedDisplay) {
            selectedDisplay.textContent = label;
            selectedDisplay.dataset.value = value;
            selectedDisplay.classList.remove('text-slate-400');
        }
    },

    selectSpecificField(value, label) {
        const selectedDisplay = document.getElementById('selectedSpecificField');
        if (selectedDisplay) {
            selectedDisplay.textContent = label;
            selectedDisplay.dataset.value = value;
            selectedDisplay.classList.remove('text-slate-400');
        }
    },

    selectInterestCategory(value, label, icon) {
        const selectedDisplay = document.getElementById('selectedInterestCategory');
        if (selectedDisplay) {
            selectedDisplay.textContent = label;
            selectedDisplay.dataset.value = value;
            selectedDisplay.classList.remove('text-slate-400');
        }
        this.populateInterestProfessions(value);

        // Update the category menu to show the new checkmark
        this.populateInterestedCategoriesDropdown();

        // Close menu
        const menu = document.getElementById('interestCategoryMenu');
        if (menu) menu.classList.add('hidden');
    },

    selectInterestProfession(value, label) {
        this.toggleInterestedProfession(value, label);
        // Note: We don't close the menu here to allow multiple selections
    },

    populateInterestProfessions(categoryName) {
        // Populate professions for selected category
        const menu = document.getElementById('interestProfessionMenu');
        if (!menu || !window.globalCategoriesAndProfessions) return;

        const category = window.globalCategoriesAndProfessions.find(c => {
            const nameEn = typeof c.name === 'object' ? c.name.en : c.name;
            return nameEn === categoryName;
        });

        if (!category || !category.professions) return;

        const lang = window.currentLanguage || 'en';
        menu.innerHTML = '';

        // Sort professions alphabetically by translated name
        const sortedProfessions = [...category.professions].sort((a, b) => {
            const nameA = typeof a === 'object' ? (a[lang] || a.en) : a;
            const nameB = typeof b === 'object' ? (b[lang] || b.en) : b;
            return nameA.localeCompare(nameB, lang);
        });

        sortedProfessions.forEach(prof => {
            const profEn = prof.en || prof;
            const profTranslated = typeof prof === 'object' ? (prof[lang] || prof.en) : prof;
            const isSelected = this.selectedInterestedProfessions.includes(profEn);

            const item = document.createElement('div');
            item.className = `p-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-all border-b border-slate-50 last:border-0 group ${isSelected ? 'bg-emerald-50/30' : ''}`;
            item.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-500' : 'bg-slate-200'} transition-all"></div>
                    <span class="text-sm font-bold ${isSelected ? 'text-emerald-700' : 'text-slate-600'} group-hover:text-slate-900 transition-colors">${profTranslated}</span>
                </div>
                ${isSelected ? `
                    <div class="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-200 animate-in zoom-in-50 duration-200">
                        <i class="fa-solid fa-check text-[10px]"></i>
                    </div>
                ` : `
                    <div class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 opacity-0 group-hover:opacity-100 transition-all">
                        <i class="fa-solid fa-plus text-[10px]"></i>
                    </div>
                `}
            `;

            item.addEventListener('click', (e) => {
                e.stopPropagation(); // Keep dropdown open
                this.selectInterestProfession(profEn, profTranslated);
            });

            menu.appendChild(item);
        });
    },

    populateSpecificFields(categoryName) {
        // Populate specific study fields
    },

    /**
     * Updates sidebar content and completeness
     */
    updateSidebar(user) {
        if (!user) return;
        
        // Calculate completeness
        const percentage = this.calculateCompleteness(user);
        
        // Update global UI completeness bar
        if (window.DashboardUI) {
            window.DashboardUI.updateProfileCompleteness(percentage);
        }
        
        // Update sidebar name/role
        const sidebarName = document.querySelector('.user-name');
        const userMenuName = document.getElementById('userMenuName');
        const userMenuEmail = document.getElementById('userMenuEmail');
        
        const fullName = `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim() || user.username || 'Professional';
        
        if (sidebarName) sidebarName.textContent = fullName;
        if (userMenuName) userMenuName.textContent = fullName;
        if (userMenuEmail) userMenuEmail.textContent = user.email || '';
        
        const sidebarRole = document.querySelector('.user-role');
        if (sidebarRole) {
            const role = user.profession || (window.translations?.professional?.[window.currentLanguage] || 'Professional');
            sidebarRole.textContent = role;
        }

        // Update Avatar Initial
        const avatar = document.getElementById('userAvatar');
        const menuInitials = document.getElementById('userMenuInitials');
        const firstChar = fullName.charAt(0).toUpperCase();
        if (avatar && !avatar.querySelector('img')) avatar.textContent = firstChar;
        if (menuInitials) menuInitials.textContent = firstChar;
    },

    /**
     * Calculates profile completeness percentage
     */
    calculateCompleteness(user) {
        const u = { ...user, ...(user.profile || {}) };
        let score = 0;

        // 1. Personal Info (20%)
        if (u.first_name || u.firstName) score += 3;
        if (u.last_name || u.lastName) score += 3;
        if (u.phone) score += 4;
        if (u.city) score += 3;
        if (u.country) score += 3;
        if (u.birthdate) score += 4;

        // 2. Profile Picture (10%)
        if (u.profile_picture_url || u.profilePictureUrl) score += 10;

        // 3. Bio (10%)
        const bioText = String(u.bio || '').trim();
        if (bioText.length >= 20) score += 10;

        // 4. Skills (15%)
        let skills = u.skills;
        if (typeof skills === 'string') {
            try { skills = JSON.parse(skills); } catch(e) { skills = skills ? [skills] : []; }
        }
        if (Array.isArray(skills) && skills.length > 0) score += 15;

        // 5. Interested Professions (10%)
        let interests = u.interested_professions || u.interestedProfessions;
        if (typeof interests === 'string') {
            try { interests = JSON.parse(interests); } catch(e) { interests = interests ? [interests] : []; }
        }
        if (Array.isArray(interests) && interests.length > 0) score += 10;

        // 6. CV (15%)
        if (u.cv_path || u.cvPath) score += 15;

        // 7. Status & Education (20%)
        if (u.current_status || u.currentStatus) score += 5;
        
        let history = u.education_history || u.educationHistory;
        if (typeof history === 'string') {
            try { history = JSON.parse(history); } catch(e) { history = []; }
        }
        if (Array.isArray(history) && history.length > 0) score += 10;

        // Website / Presence (5%) - Bonus for bio > 50 if website is missing
        if (u.website_link || u.websiteLink || bioText.length >= 50) score += 5;

        return Math.min(100, score);
    }
};

window.DashboardProfile = DashboardProfile;
