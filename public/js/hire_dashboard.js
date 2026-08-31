document.addEventListener('DOMContentLoaded', function() {
    // --- Global State ---
    let lastLoadedUserData = null;
    let currentStep = 1;
    const totalSteps = 5;
    let initialLoadCompleted = false;
    let companyCategories = window.globalCategoriesAndProfessions || [];
    let palestinianCities = [];
    let selectedCompanyCategory = null;
    let isOtherCategorySelected = false;
    let hasUnsavedDetails = false;
    let pendingSectionSwitch = null;

    // --- DOM Elements - Core ---
    const pageLoadingOverlay = document.getElementById('pageLoadingOverlay');
    const userNameSpan = document.getElementById('userNameSidebar');
    const sidebarUserAvatarImg = document.getElementById('sidebarUserAvatarImg');
    const sidebarUserAvatarText = document.getElementById('sidebarUserAvatarText');
    const totalPostedJobsSpan = document.getElementById('totalPostedJobs');
    const activeJobsSpan = document.getElementById('activeJobs');
    const totalApplicationsSpan = document.getElementById('totalApplications');
    const profileViewsOverviewSpan = document.getElementById('profileViewsOverview');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const sections = document.querySelectorAll('.section-content');
    const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
    const dashboardSidebar = document.getElementById('dashboardSidebar');

    // --- Mobile Sidebar Toggle ---
    if (mobileSidebarToggle && dashboardSidebar) {
        mobileSidebarToggle.addEventListener('click', () => {
            dashboardSidebar.classList.toggle('show');
            const icon = mobileSidebarToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });

        // Close sidebar when clicking a link on mobile
        sidebarLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 1024) {
                    dashboardSidebar.classList.remove('show');
                    const icon = mobileSidebarToggle.querySelector('i');
                    if (icon) {
                        icon.classList.add('fa-bars');
                        icon.classList.remove('fa-times');
                    }
                }
            });
        });
    }

    // --- Localization for Cities ---
    if (window.palestinianCitiesTranslations) {
        palestinianCities = Object.keys(window.palestinianCitiesTranslations).map(key => ({
            key: key,
            ar: window.palestinianCitiesTranslations[key].ar,
            en: window.palestinianCitiesTranslations[key].en
        })).sort((a, b) => {
            const nameA = a[window.currentLanguage] || a.en;
            const nameB = b[window.currentLanguage] || b.en;
            return nameA.localeCompare(nameB);
        });
    }

    // Use global modal helpers if available, otherwise fallback to local ones
    const getModalEl = (idOrEl) => typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;

    function showModal(modalId) {
        const modal = getModalEl(modalId);
        if (!modal) return;
        
        if (typeof window.showModal === 'function' && window.showModal !== showModal) {
            window.showModal(modal);
        } else {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            void modal.offsetWidth;
            modal.classList.add('show');
            document.body.classList.add('modal-open');
        }
    }

    function hideModal(modalId) {
        const modal = getModalEl(modalId);
        if (!modal) return;

        if (typeof window.hideModal === 'function' && window.hideModal !== hideModal) {
            window.hideModal(modal);
        } else {
            modal.classList.remove('show');
            setTimeout(() => {
                if (!modal.classList.contains('show')) {
                    modal.style.display = 'none';
                    modal.classList.add('hidden');
                    document.body.classList.remove('modal-open');
                }
            }, 300);
        }
    }

    // --- Section Management ---
    async function switchSection(sectionId) {
        if (hasUnsavedDetails && sectionId !== 'company-details') {
            pendingSectionSwitch = sectionId;
            showModal('unsavedChangesModal');
            
            // Bind buttons
            document.getElementById('stayAndSaveBtn').onclick = () => {
                hideModal('unsavedChangesModal');
            };
            
            document.getElementById('discardAndLeaveBtn').onclick = () => {
                hideModal('unsavedChangesModal');
                hasUnsavedDetails = false;
                switchSection(pendingSectionSwitch);
            };
            return;
        }

        sections.forEach(section => section.classList.add('hidden'));
        const targetSection = document.getElementById(sectionId + 'Section');
        if (targetSection) targetSection.classList.remove('hidden');

        sidebarLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-section') === sectionId);
        });

        // Load section-specific data
        if (sectionId === 'posted-jobs') {
            loadPostedJobs();
        } else if (sectionId === 'settings') {
            updateSettingsUI();
        }

        if (!lastLoadedUserData && (sectionId === 'company-details' || sectionId === 'company-profile' || sectionId === 'overview')) {
            await loadUserData();
        }

        if (lastLoadedUserData) {
            if (sectionId === 'company-details') {
                loadCompanyDetails(lastLoadedUserData);
            } else if (sectionId === 'company-profile') {
                loadCompanyProfile(lastLoadedUserData);
            } else if (sectionId === 'overview') {
                updateAccountCompleteness(lastLoadedUserData);
            }
        }

        if (window.location.hash !== '#' + sectionId) {
            history.pushState(null, null, '#' + sectionId);
        }
    }

    function updateSettingsUI() {
        const lang = window.currentLanguage || 'en';
        const enBtn = document.getElementById('langEnBtn');
        const arBtn = document.getElementById('langArBtn');

        if (enBtn) {
            enBtn.classList.toggle('bg-white', lang === 'en');
            enBtn.classList.toggle('shadow-sm', lang === 'en');
            enBtn.classList.toggle('text-indigo-600', lang === 'en');
            enBtn.classList.toggle('text-slate-500', lang !== 'en');
        }

        if (arBtn) {
            arBtn.classList.toggle('bg-white', lang === 'ar');
            arBtn.classList.toggle('shadow-sm', lang === 'ar');
            arBtn.classList.toggle('text-indigo-600', lang === 'ar');
            arBtn.classList.toggle('text-slate-500', lang !== 'ar');
        }
    }

    // --- Helper Functions ---
    function getTranslatedCityName(cityInput) {
        if (!cityInput) return '';
        const lang = window.currentLanguage || 'en';
        const data = window.palestinianCitiesTranslations || {};
        
        // 1. Check if it's already a valid key (e.g., 'city_ramallah')
        if (data[cityInput]) {
            return data[cityInput][lang] || data[cityInput].en;
        }

        // 2. Try to find by normalized English name
        const normalize = (s) => String(s).toLowerCase().replace(/[_\s\-]/g, '');
        const normalizedInput = normalize(cityInput);

        const foundKey = Object.keys(data).find(key => {
            const cityData = data[key];
            return normalize(cityData.en) === normalizedInput || normalize(key.replace('city_', '')) === normalizedInput;
        });

        if (foundKey) {
            return data[foundKey][lang] || data[foundKey].en;
        }

        // 3. Fallback
        let displayValue = cityInput.replace('city_', '').replace(/_/g, ' ');
        return displayValue.charAt(0).toUpperCase() + displayValue.slice(1);
    }

    // Helper to generate premium job cards
    function createJobCard(job) {
        const isActive = job.status === 'open';
        const applicantsCount = parseInt(job.applications_count) || 0;
        const viewsCount = parseInt(job.views_count) || 0;
        
        const card = document.createElement('div');
        card.className = 'job-card-premium';
        
        // Use translations for status
        const statusKey = isActive ? 'active' : 'inactive';
        const statusText = (window.translations && window.translations[statusKey] && window.translations[statusKey][window.currentLanguage]) || (isActive ? 'Active' : 'Inactive');

        const isRemote = job.job_site_type === 'Remote';
        const translatedCity = job.city ? getTranslatedCityName(job.city) : '';
        const remoteTagHtml = isRemote ? `
            <span class="remote-tag" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                <i class="fas fa-laptop-house"></i>
                <span>${window.translations?.remote?.[window.currentLanguage] || 'Remote'}</span>
            </span>` : '';

        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}" data-lang-key="${statusKey}">
                    ${statusText}
                </span>
                ${remoteTagHtml}
            </div>
            <h3 class="truncate font-bold text-slate-800 mb-1">${job.title}</h3>
            ${translatedCity ? `
            <div class="location text-slate-500 text-sm flex items-center gap-1 mb-3">
                <i class="fas fa-location-dot"></i>
                <span>${translatedCity}</span>
            </div>` : ''}
            
            <div class="stats-row">
                <div class="stat-box">
                    <span class="count">${applicantsCount}</span>
                    <span class="label" data-lang-key="applicants">Applicants</span>
                </div>
                <div class="stat-box">
                    <span class="count">${viewsCount}</span>
                    <span class="label" data-lang-key="job_views">Views</span>
                </div>
            </div>
            
            <div class="actions-row">
                <button onclick="const slug = window.generateJobSlug ? window.generateJobSlug('${job.title}', lastLoadedUserData ? lastLoadedUserData.companyName : 'hirly') : 'details'; window.open('/jobs/${job.id}/' + slug, '_blank')" class="btn-job-action btn-job-view">
                    <i class="fas fa-eye"></i>
                    <span data-lang-key="view_btn">View</span>
                </button>
                <button onclick="window.open('/applicants.html?job_id=${job.id}', '_blank')" class="btn-job-action btn-job-candidates bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
                    <i class="fas fa-users-viewfinder"></i>
                    <span data-lang-key="review_candidates_btn">Candidates</span>
                </button>
                <button onclick="window.toggleJobStatus('${job.id}', '${job.status}', '${job.deadline}')" class="btn-job-action ${isActive ? 'btn-job-close' : 'btn-job-reopen'}">
                    <i class="fas ${isActive ? 'fa-times-circle' : 'fa-folder-open'}"></i>
                    <span data-lang-key="${isActive ? 'close' : 'reopen'}">${isActive ? 'Close' : 'Reopen'}</span>
                </button>
            </div>
        `;
        return card;
    }

    function loadCompanyProfile(user) {
        const previewName = document.getElementById('profilePreviewName');
        const previewCategory = document.getElementById('profilePreviewCategory');
        const logoPreview = document.getElementById('profilePreviewLogo');
        const logoPlaceholder = document.getElementById('profilePreviewPlaceholder');
        const viewsCount = document.getElementById('profileViewsCount');
        
        if (previewName) previewName.textContent = user.companyName || 'Your Company';
        
        if (previewCategory) {
            const cat = user.companyCategory || 'General';
            const catData = (window.globalCategoriesAndProfessions || []).find(c => 
                c.name.en === cat || c.name.ar === cat
            );
            const icon = catData ? catData.icon : 'fas fa-briefcase';
            const label = window.currentLanguage === 'ar' && catData ? catData.name.ar : (catData ? catData.name.en : cat);
            previewCategory.innerHTML = `<i class="${icon} mr-2"></i> ${label}`;
        }

        if (logoPreview && logoPlaceholder) {
            if (user.companyLogo) {
                logoPreview.src = user.companyLogo;
                logoPreview.classList.remove('hidden');
                logoPlaceholder.classList.add('hidden');
            } else {
                logoPreview.classList.add('hidden');
                logoPlaceholder.classList.remove('hidden');
            }
        }

        if (viewsCount) viewsCount.textContent = user.profileViews || '0';
        
        const slug = user.slug;
        const publicUrl = slug ? `${window.location.origin}/${slug}` : `${window.location.origin}/employer_profile.html?id=${user.id}`;
        
        // QR Code Generation
        const qrContainer = document.getElementById('companyQrContainer');
        if (qrContainer) {
            qrContainer.innerHTML = '';
            if (typeof QRCode !== 'undefined') {
                new QRCode(qrContainer, {
                    text: publicUrl,
                    width: 140, 
                    height: 140,
                    colorDark: "#0f172a",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
            }
        }

        const shareBtn = document.getElementById('shareProfileBtn');
        if (shareBtn) {
            shareBtn.onclick = () => {
                const modal = document.getElementById('shareProfileModal');
                const linkDisplay = document.getElementById('shareModalLinkDisplay');
                const copyBtn = document.getElementById('shareModalCopyBtn');
                
                if (modal && linkDisplay) {
                    linkDisplay.textContent = publicUrl;
                    showModal('shareProfileModal');
                    
                    // Social Links
                    const encodedUrl = encodeURIComponent(publicUrl);
                    const encodedText = encodeURIComponent(`Check out ${user.companyName || 'this company'} on Hirly!`);
                    
                    document.getElementById('shareLinkedIn').href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
                    document.getElementById('shareFacebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
                    document.getElementById('shareX').href = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
                    document.getElementById('shareInstagram').href = `https://www.instagram.com/`; // IG doesn't support direct URL sharing via link easily
                    
                    if (copyBtn) {
                        copyBtn.onclick = () => {
                            navigator.clipboard.writeText(publicUrl).then(() => {
                                const old = copyBtn.innerHTML;
                                copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                                setTimeout(() => copyBtn.innerHTML = old, 2000);
                                showToast('Link copied!', 'success');
                            });
                        };
                    }
                }
            };
        }

        const downloadQrBtn = document.getElementById('downloadQrBtn');
        if (downloadQrBtn) {
            downloadQrBtn.onclick = () => {
                const qrImg = qrContainer.querySelector('img');
                const qrCanvas = qrContainer.querySelector('canvas');
                
                let dataUrl = '';
                if (qrImg && qrImg.src) {
                    dataUrl = qrImg.src;
                } else if (qrCanvas) {
                    dataUrl = qrCanvas.toDataURL("image/png");
                }
                
                if (dataUrl) {
                    const link = document.createElement('a');
                    link.href = dataUrl;
                    link.download = `${user.companyName || 'company'}-qr.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else {
                    showToast('QR code not ready', 'error');
                }
            };
        }

        const viewProfileBtn = document.getElementById('viewPublicProfileFullBtn');
        if (viewProfileBtn) {
            viewProfileBtn.onclick = () => window.open(publicUrl, '_blank');
        }
    }

    function loadCompanyDetails(user) {
        const container = document.getElementById('formsContainer');
        if (!container) return;
        
        const lang = window.currentLanguage || 'en';
        const countries = Object.keys(window.palestinianCitiesTranslations || {})
            .filter(key => key.startsWith('country_'))
            .map(key => ({
                key: key,
                name: window.palestinianCitiesTranslations[key][lang] || window.palestinianCitiesTranslations[key].en,
                en: window.palestinianCitiesTranslations[key].en
            }));

        // Find current category object
        const currentCat = companyCategories.find(c => c.name.en === user.companyCategory) || companyCategories[0];
        const currentCatName = currentCat ? (currentCat.name[lang] || currentCat.name.en) : (user.companyCategory || 'Select Category');
        const currentCatIcon = currentCat ? currentCat.icon : 'fas fa-briefcase';

        container.innerHTML = `
            <div class="details-form-premium">
                <div class="flex justify-between items-center mb-10">
                    <h2 class="text-2xl font-black text-slate-900" data-lang-key="identity_branding">Identity & Branding</h2>
                    <button type="button" id="editDetailsToggleBtn" class="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-all flex items-center gap-2" data-editing="false">
                        <i class="fas fa-pen-to-square"></i>
                        <span data-lang-key="edit_btn">Edit</span>
                    </button>
                </div>
                
                <form id="companyDetailsForm">
                    <div class="logo-edit-premium mb-12 flex items-center gap-8">
                        <div class="relative group">
                            <div class="w-32 h-32 rounded-[2.5rem] bg-slate-50 overflow-hidden border-4 border-white shadow-xl relative">
                                <img id="detailsLogoPreview" src="${user.companyLogo || ''}" alt="Logo" class="w-full h-full object-cover ${user.companyLogo ? '' : 'hidden'}">
                                <div id="detailsLogoPlaceholder" class="w-full h-full flex items-center justify-center text-4xl text-slate-200 ${user.companyLogo ? 'hidden' : ''}">
                                    <i class="fas fa-building"></i>
                                </div>
                                <div id="logoUploadOverlay" class="absolute inset-0 opacity-0 transition-opacity flex items-center justify-center cursor-pointer hidden">
                                    <i class="fas fa-camera text-white text-xl"></i>
                                </div>
                            </div>
                            <input type="file" id="logoFileInput" class="hidden" accept="image/*">
                        </div>
                        <div>
                            <h4 class="text-lg font-black text-slate-900 mb-1" data-lang-key="company_logo">Company Logo</h4>
                            <p class="text-slate-400 text-xs font-medium" data-lang-key="branding_desc">Professional branding for your profile.</p>
                            <button type="button" id="removeLogoBtn" class="mt-3 btn-remove-logo flex items-center gap-2 hidden">
                                <i class="fas fa-trash-can"></i>
                                <span data-lang-key="remove_logo">Remove</span>
                            </button>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="form-group-premium">
                            <label data-lang-key="company_name_label">Company Name</label>
                            <input type="text" name="companyName" class="form-control-premium bg-slate-50 border-transparent cursor-default" value="${user.companyName || ''}" id="editCompanyName" readonly>
                        </div>
                        <div class="form-group-premium">
                            <label data-lang-key="company_category_label">Business Category</label>
                            <div class="custom-select-premium disabled" id="categoryCustomSelect">
                                <div class="custom-select-trigger">
                                    <div class="selected-value">
                                        <i class="${currentCatIcon}"></i>
                                        <span>${currentCatName}</span>
                                    </div>
                                    <i class="fas fa-chevron-down"></i>
                                </div>
                                <div class="custom-select-options">
                                    ${companyCategories.map(cat => `
                                        <div class="custom-select-option ${user.companyCategory === cat.name.en ? 'selected' : ''}" data-value="${cat.name.en}" data-icon="${cat.icon}">
                                            <i class="${cat.icon}"></i>
                                            <span>${cat.name[lang] || cat.name.en}</span>
                                        </div>
                                    `).join('')}
                                </div>
                                <input type="hidden" name="companyCategory" id="editCompanyCategory" value="${user.companyCategory || ''}">
                            </div>
                        </div>
                        <div class="form-group-premium">
                            <label data-lang-key="company_email_label">Company Email</label>
                            <input type="email" name="companyEmail" class="form-control-premium bg-slate-50 border-transparent cursor-default" value="${user.companyEmail || ''}" id="editCompanyEmail" readonly>
                        </div>
                        <div class="form-group-premium">
                            <label data-lang-key="company_phone_label">Company Phone Number</label>
                            <input type="tel" name="companyPhone" class="form-control-premium bg-slate-50 border-transparent cursor-default" value="${user.companyPhone || ''}" id="editCompanyPhone" readonly>
                        </div>
                        <div class="form-group-premium">
                            <label data-lang-key="country_label">Country</label>
                            <select name="country" class="form-control-premium bg-slate-50 border-transparent pointer-events-none" id="editCompanyCountry" disabled>
                                <option value="" data-lang-key="select_country">Select Country</option>
                                ${countries.map(c => `<option value="${c.en}" ${(user.country === c.en || user.country === c.name) ? 'selected' : ''}>${c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group-premium">
                            <label data-lang-key="address_label">Company Address</label>
                            <input type="text" name="address" class="form-control-premium bg-slate-50 border-transparent cursor-default" value="${user.address || ''}" placeholder="e.g. Ramallah, Al-Irsal St." readonly>
                        </div>
                    </div>
                    
                    <div class="form-group-premium mt-8">
                        <label data-lang-key="company_description_label">Company Bio</label>
                        <textarea name="companyDescription" class="form-control-premium min-h-[150px] bg-slate-50 border-transparent cursor-default" id="editCompanyBio" placeholder="Tell talent about your company mission..." readonly>${user.companyDescription || ''}</textarea>
                    </div>

                    <div class="mt-12 flex justify-end hidden" id="saveDetailsActions">
                        <button type="submit" id="saveDetailsBtn" class="btn-save-premium">
                            <span data-lang-key="save_changes_btn">Save Changes</span>
                        </button>
                    </div>
                </form>
            </div>
        `;

        if (window.translatePage) window.translatePage(container);

        const toggleBtn = document.getElementById('editDetailsToggleBtn');
        const saveActions = document.getElementById('saveDetailsActions');
        const form = document.getElementById('companyDetailsForm');
        const inputs = form.querySelectorAll('input, select, textarea');
        const categorySelect = document.getElementById('categoryCustomSelect');
        const logoInput = document.getElementById('logoFileInput');
        const logoOverlay = document.getElementById('logoUploadOverlay');
        const logoPreview = document.getElementById('detailsLogoPreview');
        const logoPlaceholder = document.getElementById('detailsLogoPlaceholder');
        const removeLogoBtn = document.getElementById('removeLogoBtn');

        // Track changes
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                if (toggleBtn.getAttribute('data-editing') === 'true') {
                    hasUnsavedDetails = true;
                }
            });
            input.addEventListener('change', () => {
                if (toggleBtn.getAttribute('data-editing') === 'true') {
                    hasUnsavedDetails = true;
                }
            });
        });

        // Logo Upload Logic
        if (logoOverlay && logoInput) {
            logoOverlay.onclick = () => logoInput.click();
            logoInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const formData = new FormData();
                formData.append('file', file);

                try {
                    const res = await fetch('/api/employer/upload-logo', {
                        method: 'POST',
                        body: formData
                    });
                    if (res.ok) {
                        const data = await res.json();
                        const logoUrl = data.company_logo_path;
                        const thumbUrl = typeof ImageOptimizer !== 'undefined'
                            ? ImageOptimizer.getOptimizedUrl(logoUrl, 'thumb')
                            : logoUrl;
                            
                        if (logoPreview) {
                            logoPreview.src = thumbUrl;
                            logoPreview.onerror = function() {
                                this.onerror = null;
                                this.src = logoUrl;
                            };
                            logoPreview.classList.remove('hidden');
                        }
                        if (logoPlaceholder) logoPlaceholder.classList.add('hidden');
                        if (removeLogoBtn) removeLogoBtn.classList.remove('hidden');
                        showToast('Logo updated!', 'success');
                        
                        // Sync with other sections
                        const updatedUser = await loadUserData();
                        window.currentUser = updatedUser;
                        loadCompanyProfile(updatedUser);
                        updateSidebar(updatedUser);
                    } else {
                        const errorData = await res.json();
                        showToast(errorData.error || 'Error uploading logo', 'error');
                    }
                } catch (err) { 
                    console.error('Logo upload error:', err);
                    showToast('Error uploading logo', 'error'); 
                }
            };
        }

        if (removeLogoBtn) {
            removeLogoBtn.onclick = async () => {
                if (!confirm('Remove company logo?')) return;
                try {
                    const res = await fetch('/api/employer/remove-logo', { method: 'DELETE' });
                    if (res.ok) {
                        if (logoPreview) {
                            logoPreview.src = '';
                            logoPreview.classList.add('hidden');
                        }
                        if (logoPlaceholder) logoPlaceholder.classList.remove('hidden');
                        removeLogoBtn.classList.add('hidden');
                        showToast('Logo removed', 'success');
                        
                        const updatedUser = await loadUserData();
                        window.currentUser = updatedUser;
                        loadCompanyProfile(updatedUser);
                        updateSidebar(updatedUser);
                    } else {
                        const errorData = await res.json();
                        showToast(errorData.error || 'Error removing logo', 'error');
                    }
                } catch (err) { 
                    console.error('Logo removal error:', err);
                    showToast('Error removing logo', 'error'); 
                }
            };
        }

        // Custom Dropdown Logic
        if (categorySelect) {
            const trigger = categorySelect.querySelector('.custom-select-trigger');
            const options = categorySelect.querySelectorAll('.custom-select-option');
            const hiddenInput = document.getElementById('editCompanyCategory');
            const selectedSpan = trigger.querySelector('.selected-value span');
            const selectedIcon = trigger.querySelector('.selected-value i');

            trigger.onclick = (e) => {
                if (categorySelect.classList.contains('disabled')) return;
                e.stopPropagation();
                categorySelect.classList.toggle('active');
            };

            options.forEach(opt => {
                opt.onclick = () => {
                    const val = opt.getAttribute('data-value');
                    const icon = opt.getAttribute('data-icon');
                    const text = opt.querySelector('span').textContent;

                    hiddenInput.value = val;
                    selectedSpan.textContent = text;
                    selectedIcon.className = icon;
                    hasUnsavedDetails = true;

                    options.forEach(o => o.classList.remove('selected'));
                    opt.classList.add('selected');
                    categorySelect.classList.remove('active');
                };
            });

            // Close on click outside
            document.addEventListener('click', () => {
                categorySelect.classList.remove('active');
            });
        }

        toggleBtn.onclick = () => {
            const isEditing = toggleBtn.getAttribute('data-editing') === 'true';
            if (!isEditing) {
                // Switch to Edit Mode
                toggleBtn.setAttribute('data-editing', 'true');
                toggleBtn.innerHTML = `<i class="fas fa-times"></i> <span data-lang-key="cancel_btn">Cancel</span>`;
                toggleBtn.classList.replace('bg-indigo-50', 'bg-slate-100');
                toggleBtn.classList.replace('text-indigo-600', 'text-slate-600');
                
                inputs.forEach(input => {
                    input.removeAttribute('readonly');
                    input.removeAttribute('disabled');
                    input.classList.remove('bg-slate-50', 'border-transparent', 'cursor-default', 'pointer-events-none');
                    input.classList.add('bg-white', 'border-slate-200');
                });

                if (categorySelect) {
                    categorySelect.classList.remove('disabled');
                }

                if (logoOverlay) logoOverlay.classList.remove('hidden');
                if (user.companyLogo && removeLogoBtn) removeLogoBtn.classList.remove('hidden');

                saveActions.classList.remove('hidden');
            } else {
                // Revert to Read-only
                hasUnsavedDetails = false;
                loadCompanyDetails(user); // Re-render to original state
            }
            if (window.translatePage) window.translatePage(toggleBtn);
        };

        form.onsubmit = async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(form).entries());
            const saveBtn = document.getElementById('saveDetailsBtn');
            saveBtn.disabled = true;
            try {
                const res = await fetch('/api/employer/profile', { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify(data) 
                });
                if (res.ok) { 
                    hasUnsavedDetails = false;
                    showToast('Details updated!', 'success'); 
                    const updatedUser = await loadUserData(); 
                    loadCompanyDetails(updatedUser);
                }
            } catch (err) { showToast('Error updating details', 'error'); }
            finally { saveBtn.disabled = false; }
        };
    }

    // --- Before Unload Warning ---
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedDetails) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const sectionId = link.getAttribute('data-section');
            if (sectionId) {
                e.preventDefault();
                switchSection(sectionId);
            }
        });
    });

    // --- Account Completeness Engine ---
    function updateAccountCompleteness(user) {
        const fields = [
            { id: 'companyLogo', key: 'readiness_logo', icon: 'fa-image', section: 'company-details' },
            { id: 'companyDescription', key: 'readiness_description', icon: 'fa-align-left', section: 'company-details' },
            { id: 'address', key: 'readiness_address', icon: 'fa-location-dot', section: 'company-details' },
            { id: 'companyCategory', key: 'readiness_category', icon: 'fa-layer-group', section: 'company-details' },
            { id: 'idVerificationStatus', key: 'id_verification_label', icon: 'fa-id-card', section: 'company-details', isVerified: true }
        ];

        let completedCount = fields.filter(f => {
            if (f.isVerified) return user[f.id] === 'Verified';
            return user[f.id];
        }).length;
        
        // Add job check
        const jobCount = parseInt(totalPostedJobsSpan?.textContent || '0');
        if (jobCount > 0) completedCount++;
        
        const totalPossible = fields.length + 1; // fields + 1 for the job
        const score = Math.round((completedCount / totalPossible) * 100);
        
        const scoreDisplay = document.getElementById('completenessScore');
        const completenessCircle = document.getElementById('completenessCircle');
        const missingContainer = document.getElementById('missingFieldsContainer');

        if (scoreDisplay) scoreDisplay.textContent = score + '%';
        
        if (completenessCircle) {
            const radius = 40;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (score / 100) * circumference;
            completenessCircle.style.strokeDasharray = `${circumference} ${circumference}`;
            completenessCircle.style.strokeDashoffset = offset;
        }

        if (missingContainer) {
            missingContainer.innerHTML = '';
            const missing = [];
            
            // Check fields
            fields.forEach(f => {
                if (f.isVerified) {
                    if (user[f.id] !== 'Verified') missing.push(f);
                } else if (!user[f.id]) {
                    missing.push(f);
                }
            });
            
            // Check job
            if (jobCount === 0) {
                missing.push({ id: 'postJob', key: 'readiness_post_job', icon: 'fa-plus', section: 'overview', isJob: true });
            }

            if (missing.length === 0) {
                missingContainer.innerHTML = `<div class="md:col-span-2 flex items-center gap-4 p-6 bg-emerald-50 rounded-[1.5rem] border border-emerald-100 text-emerald-700 w-full">
                    <div class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-xl">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div>
                        <p class="font-black text-lg" data-lang-key="profile_complete">Everything is set!</p>
                        <p class="text-sm font-medium opacity-80" data-lang-key="company_readiness_ready">Your company profile is 100% ready.</p>
                    </div>
                </div>`;
            } else {
                missing.slice(0, 4).forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'missing-field-premium';
                    
                    // Get translation directly to avoid dynamic issues
                    const label = (window.translations[item.key] && window.translations[item.key][window.currentLanguage || 'en']) || item.key;
                    const btnText = (window.translations['complete_btn'] && window.translations['complete_btn'][window.currentLanguage || 'en']) || 'Complete';
                    
                    div.innerHTML = `
                        <div class="missing-field-info">
                            <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs">
                                <i class="fas ${item.icon}"></i>
                            </div>
                            <span class="text-sm font-bold text-slate-700">${label}</span>
                        </div>
                        <button onclick="${item.isJob ? "window.open('/employer/post_job.html', '_blank')" : `window.switchSection('${item.section}')`}" class="btn-missing-action whitespace-nowrap">
                            ${btnText}
                        </button>`;
                    missingContainer.appendChild(div);
                });
            }
            if (window.translatePage) window.translatePage(missingContainer);
        }
    }

    // --- Profile & Company Data Management ---
    async function loadUserData() {
        try {
            const response = await fetch('/api/employer/profile');
            if (response.ok) {
                const data = await response.json();
                const user = data.user || data;
                lastLoadedUserData = user;

                if (userNameSpan) userNameSpan.textContent = user.firstName + ' ' + (user.lastName || '');
                if (profileViewsOverviewSpan) profileViewsOverviewSpan.textContent = user.profileViews || '0';
                updateSidebarAvatar(user);
                updateAccountCompleteness(user);
                
                // Hide/Show company profile link based on type
                const profileLink = document.getElementById('companyProfileLinkSidebar');
                if (profileLink) profileLink.style.display = user.employerType === 'company' ? 'block' : 'none';

                return user;
            }
        } catch (error) { console.error('Error loading user data:', error); }
    }

    function updateSidebarAvatar(user) {
        const avatarImg = document.getElementById('sidebarUserAvatarImg');
        const avatarText = document.getElementById('sidebarUserAvatarText');
        const badge = document.getElementById('sidebarVerificationBadge');
        
        if (user.companyLogo) {
            avatarImg.src = user.companyLogo;
            avatarImg.style.display = 'block';
            avatarText.style.display = 'none';
        } else {
            avatarImg.style.display = 'none';
            avatarText.style.display = 'flex';
            const name = user.companyName || (user.firstName + ' ' + (user.lastName || ''));
            avatarText.textContent = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        }

        // Show verification badge if ID is verified
        if (badge) {
            badge.style.display = user.idVerificationStatus === 'verified' ? 'flex' : 'none';
        }
    }

    // --- Intro Modal V3 ---
    async function loadPostedJobs() {
        const list = document.getElementById('postedJobsList');
        const noJobs = document.getElementById('noJobsMessage');
        if (!list) return;
        try {
            const res = await fetch('/api/jobs/my');
            if (res.ok) {
                const data = await res.json();
                const jobs = data.jobs || [];
                list.innerHTML = '';
                if (jobs.length === 0) { 
                    noJobs?.classList.remove('hidden'); 
                    list.classList.add('hidden'); 
                } else {
                    noJobs?.classList.add('hidden'); 
                    list.classList.remove('hidden');
                    jobs.forEach(job => list.appendChild(createJobCard(job)));
                }
                if (totalPostedJobsSpan) totalPostedJobsSpan.textContent = jobs.length;
                if (activeJobsSpan) activeJobsSpan.textContent = jobs.filter(j => j.status === 'open').length;
                
                // Update total applications count
                if (totalApplicationsSpan) {
                    const totalApps = jobs.reduce((sum, job) => sum + (parseInt(job.applications_count) || 0), 0);
                    totalApplicationsSpan.textContent = totalApps;
                }

                if (window.translatePage) window.translatePage(list);
                
                // Update readiness after job count is loaded
                if (lastLoadedUserData) updateAccountCompleteness(lastLoadedUserData);
            }
        } catch (err) { console.error(err); }
    }

    window.openShareModal = function(id, title) {
        const modal = document.getElementById('shareJobModal');
        const jobUrl = window.location.origin + '/job/' + id;
        document.getElementById('shareJobLink').value = jobUrl;
        const qr = document.getElementById('shareQrCode'); qr.innerHTML = '';
        new QRCode(qr, { text: jobUrl, width: 140, height: 140 });
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('opacity-100'), 10);
    };

    window.deleteJob = async (id) => {
        if (!confirm('Delete job?')) return;
        const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
        if (res.ok) { showToast('Job deleted', 'success'); loadPostedJobs(); }
    };

    window.toggleJobStatus = async (id, currentStatus, deadline) => {
        if (currentStatus === 'open') {
            // Simply close the job
            if (!confirm('Close this job?')) return;
            const res = await fetch(`/api/jobs/${id}/toggle-status`, { 
                method: 'PATCH', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'closed' }) 
            });
            if (res.ok) { 
                showToast('Job closed', 'success'); 
                loadPostedJobs(); 
            }
        } else {
            // Handle Reopen
            const deadlineDate = new Date(deadline);
            const now = new Date();
            
            if (deadlineDate < now) {
                // Deadline passed, show modal
                const modal = document.getElementById('reopenJobModal');
                const confirmBtn = document.getElementById('confirmReopenJobBtn');
                const deadlineInput = document.getElementById('newJobDeadline');
                const deadlineSection = document.getElementById('deadlineInputSection');
                
                deadlineSection.classList.remove('hidden');
                modal.classList.add('show');
                
                confirmBtn.onclick = async () => {
                    const newDeadline = deadlineInput.value;
                    if (!newDeadline) {
                        showToast('Please select a new deadline', 'error');
                        return;
                    }
                    
                    const res = await fetch(`/api/jobs/${id}/toggle-status`, { 
                        method: 'PATCH', 
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ newDeadline: newDeadline }) 
                    });
                    if (res.ok) {
                        showToast('Job reopened with new deadline', 'success');
                        modal.classList.remove('show');
                        loadPostedJobs();
                    }
                };

                document.getElementById('cancelReopenJobBtn').onclick = () => modal.classList.remove('show');
                document.getElementById('closeReopenJobModalBtn').onclick = () => modal.classList.remove('show');
            } else {
                // Deadline still valid, just reopen
                const res = await fetch(`/api/jobs/${id}/toggle-status`, { 
                    method: 'PATCH', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'open' }) 
                });
                if (res.ok) {
                    showToast('Job reopened', 'success');
                    loadPostedJobs();
                }
            }
        }
    };

    // --- Intro Modal V3 ---
    function updateIntroModal() {
        document.querySelectorAll('.intro-slide').forEach((s, i) => s.classList.toggle('active', i + 1 === currentStep));
        document.querySelectorAll('.v3-dot').forEach((d, i) => d.classList.toggle('active', i + 1 === currentStep));
        const prev = document.getElementById('introPrevBtn');
        const next = document.getElementById('introNextBtn');
        const finish = document.getElementById('introFinishBtn');
        if (prev) prev.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
        if (next) next.style.display = currentStep === totalSteps ? 'none' : 'inline-flex';
        if (finish) finish.style.display = currentStep === totalSteps ? 'inline-flex' : 'none';
    }

    function goToStep(step) {
        currentStep = Math.max(1, Math.min(step, totalSteps));
        updateIntroModal();
    }

    // --- Logout & Global Helpers ---
    window.switchSection = switchSection; // Make global for missing fields buttons
    window.showModal = showModal;
    window.hideModal = hideModal;

    window.setLanguage = function(lang) {
        if (typeof window.applyTranslations === 'function') {
            window.applyTranslations(lang);
            updateSettingsUI();
            showModal('languageSelectionModal');
        }
    };

    document.getElementById('logoutLinkSidebar')?.addEventListener('click', (e) => { 
        e.preventDefault(); 
        
        if (typeof window.showConfirmModal === 'function') {
            const confirmTitle = (window.translations && window.translations['logout_confirm_title'] && window.translations['logout_confirm_title'][window.currentLanguage]) || 'Sign Out?';
            const confirmMessage = (window.translations && window.translations['logout_confirm_text'] && window.translations['logout_confirm_text'][window.currentLanguage]) || 'Are you sure you want to sign out of your account?';
            const confirmText = (window.translations && window.translations['logout_btn'] && window.translations['logout_btn'][window.currentLanguage]) || 'Sign Out';
            
            window.showConfirmModal(
                confirmTitle,
                confirmMessage,
                window.handleLogout || (async () => {
                    const res = await fetch('/api/logout', { method: 'POST' });
                    if (res.ok) window.location.href = '/login.html';
                }),
                null,
                confirmText,
                'btn-danger bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/20 transition-all'
            );
        } else {
            showModal('logoutConfirmModal'); 
        }
    });
    
    document.getElementById('cancelLogoutBtn')?.addEventListener('click', () => hideModal('logoutConfirmModal'));
    
    document.getElementById('confirmLogoutBtn')?.addEventListener('click', async () => {
        if (typeof window.handleLogout === 'function') {
            window.handleLogout();
        } else {
            try {
                const res = await fetch('/api/logout', { method: 'POST' });
                window.location.href = '/login.html';
            } catch (err) {
                window.location.href = '/login.html';
            }
        }
    });

    // --- Initialization ---
    async function init() {
        if (pageLoadingOverlay) pageLoadingOverlay.classList.add('show');
        await loadUserData();
        await loadPostedJobs();
        const hash = window.location.hash.substring(1) || 'overview';
        switchSection(hash);
        if (pageLoadingOverlay) pageLoadingOverlay.classList.remove('show');
        initialLoadCompleted = true;

        const hasSeenIntro = localStorage.getItem('hasSeenHireDashboardIntro_v4');
        if (!hasSeenIntro && document.getElementById('introductionModal')) {
            goToStep(1);
            document.getElementById('introductionModal').classList.remove('hidden');
            localStorage.setItem('hasSeenHireDashboardIntro_v4', 'true');
        }

        // Bind Post Job buttons
        document.getElementById('postJobBtn')?.addEventListener('click', () => window.open('/employer/post_job.html', '_blank'));
        document.getElementById('postJobBtn2')?.addEventListener('click', () => window.open('/employer/post_job.html', '_blank'));

        // Bind Overview Quick Actions
        document.getElementById('overviewViewProfileBtn')?.addEventListener('click', () => {
            const user = lastLoadedUserData;
            if (user) {
                const slug = user.slug;
                const publicUrl = slug ? `${window.location.origin}/${slug}` : `${window.location.origin}/employer_profile.html?id=${user.id}`;
                window.open(publicUrl, '_blank');
            }
        });
        document.getElementById('overviewSettingsBtn')?.addEventListener('click', () => switchSection('settings'));

        // Bind intro buttons
        document.getElementById('introNextBtn')?.addEventListener('click', () => goToStep(currentStep + 1));
        document.getElementById('introPrevBtn')?.addEventListener('click', () => goToStep(currentStep - 1));
        document.getElementById('introFinishBtn')?.addEventListener('click', () => document.getElementById('introductionModal').classList.add('hidden'));
        document.getElementById('skipIntroBtn')?.addEventListener('click', () => document.getElementById('introductionModal').classList.add('hidden'));
        document.querySelectorAll('.v3-dot').forEach(dot => dot.addEventListener('click', () => goToStep(parseInt(dot.dataset.step))));
    }

    function formatDate(date) {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString(window.currentLanguage || 'en', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    init();
});