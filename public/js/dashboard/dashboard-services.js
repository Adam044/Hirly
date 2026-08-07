/**
 * dashboard-services.js
 * Handles service creation, editing, and listing
 */

const DashboardServices = {
    serviceImageRemoved: false,

    /**
     * Initializes service listeners
     */
    init() {
        const cancelBtn = document.getElementById('cancelServiceBtn');
        const confirmDeleteBtn = document.getElementById('confirmDeleteServiceBtn');
        const serviceForm = document.getElementById('serviceForm');
        
        const openModal = () => {
            this.openServiceModal();
        };

        // Event delegation for Add Service buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-service-trigger')) {
                openModal();
            }
        });

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                const modal = document.getElementById('serviceModal');
                if (modal && window.DashboardModals) window.DashboardModals.hide(modal);
            });
        }

        if (serviceForm) {
            serviceForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(serviceForm);
                if (this.serviceImageRemoved) {
                    formData.append('removeServiceImage', 'true');
                }
                await this.handleServiceSubmit(formData);
            });
        }

        // Image Upload Listeners
        const imageInput = document.getElementById('serviceImage');
        const imagePreview = document.getElementById('serviceImagePreviewImg');
        const imagePreviewContainer = document.getElementById('serviceImagePreview');
        const imagePlaceholder = document.getElementById('serviceImagePlaceholder');
        const removeImageBtn = document.getElementById('removeServiceImageBtn');

        if (imageInput) {
            imageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.serviceImageRemoved = false;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        if (imagePreview) {
                            imagePreview.src = event.target.result;
                        }
                        if (imagePreviewContainer) imagePreviewContainer.classList.remove('hidden');
                        if (imagePlaceholder) imagePlaceholder.classList.add('hidden');
                        if (removeImageBtn) removeImageBtn.classList.remove('hidden');
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        if (removeImageBtn) {
            removeImageBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.serviceImageRemoved = true;
                if (imageInput) imageInput.value = '';
                if (imagePreview) imagePreview.src = '';
                if (imagePreviewContainer) imagePreviewContainer.classList.add('hidden');
                if (imagePlaceholder) imagePlaceholder.classList.remove('hidden');
                if (removeImageBtn) removeImageBtn.classList.add('hidden');
            });
        }

        this.populateCategories();

        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', async () => {
                if (window.serviceToDeleteId && window.DashboardAPI) {
                    try {
                        if (window.DashboardUI) window.DashboardUI.toggleLoading(true);
                        const result = await window.DashboardAPI.deleteService(window.serviceToDeleteId);
                        if (result.success) {
                            const modal = document.getElementById('deleteServiceModal');
                            if (modal && window.DashboardModals) window.DashboardModals.hide(modal);
                            if (window.DashboardUI) {
                                window.DashboardUI.showToast(window.translations?.service_deleted?.[window.currentLanguage] || 'Service deleted successfully!', 'success');
                                await window.DashboardUI.loadServices();
                            }
                        }
                    } catch (error) {
                        console.error('Error deleting service:', error);
                        if (window.DashboardUI) window.DashboardUI.showToast(window.translations?.service_delete_failed?.[window.currentLanguage] || 'Failed to delete service.', 'error');
                    } finally {
                        if (window.DashboardUI) window.DashboardUI.toggleLoading(false);
                    }
                }
            });
        }
    },

    /**
     * Handles service form submission
     * @param {FormData} formData 
     */
    async handleServiceSubmit(formData) {
        if (!window.DashboardAPI || !window.DashboardUI) return;

        const serviceId = document.getElementById('serviceId').value;
        
        try {
            window.DashboardUI.toggleLoading(true);
            const result = await window.DashboardAPI.saveService(formData, serviceId);
            
            if (result.success) {
                const successMsg = serviceId 
                    ? (window.translations?.service_updated?.[window.currentLanguage] || 'Service updated successfully!')
                    : (window.translations?.service_created?.[window.currentLanguage] || 'Service created successfully!');
                window.DashboardUI.showToast(successMsg, 'success');
                
                const modal = document.getElementById('serviceModal');
                if (modal && window.DashboardModals) window.DashboardModals.hide(modal);
                
                // Reload services list
                await window.DashboardUI.loadServices();
            }
        } catch (error) {
            console.error('Service save error:', error);
            window.DashboardUI.showToast(window.translations?.service_save_failed?.[window.currentLanguage] || 'Failed to save service.', 'error');
        } finally {
            window.DashboardUI.toggleLoading(false);
        }
    },

    /**
     * Renders the list of services
     * @param {Array} services 
     */
    renderServices(services) {
        const container = document.getElementById('allServicesList')?.querySelector('.grid');
        if (!container) return;

        container.innerHTML = '';
        
        if (!services || services.length === 0) {
            const lang = window.currentLanguage || 'en';
            container.classList.remove('grid'); // Temporary remove grid for centering empty state
            container.innerHTML = `
                <div class="col-span-full py-20 flex flex-col items-center justify-center text-center animate-in fade-in duration-700">
                    <div class="w-20 h-20 bg-slate-50 rounded-[30px] flex items-center justify-center text-slate-300 mb-6 border border-slate-100 shadow-sm">
                        <i class="fa-solid fa-layer-group text-3xl"></i>
                    </div>
                    <h3 class="text-xl font-extrabold text-slate-900 mb-2 editorial-heading" data-lang-key="no_services_title">
                        ${window.translations?.no_services_title?.[lang] || 'No services yet'}
                    </h3>
                    <p class="text-sm text-slate-400 font-medium max-w-xs mb-8 editorial-subheading" data-lang-key="no_services_desc">
                        ${window.translations?.no_services_desc?.[lang] || 'Create your first service to showcase your expertise and attract clients.'}
                    </p>
                    <button class="add-service-trigger px-8 py-4 bg-slate-900 text-white font-black rounded-[20px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 flex items-center gap-3 group">
                        <i class="fa-solid fa-plus text-xs group-hover:rotate-90 transition-transform duration-300"></i>
                        <span class="uppercase tracking-widest text-[10px]" data-lang-key="add_first_service">${window.translations?.add_first_service?.[lang] || 'Add Your First Service'}</span>
                    </button>
                </div>
            `;
            return;
        }

        container.classList.add('grid');
        services.forEach(service => {
            container.appendChild(this.createServiceCard(service));
        });
    },

    /**
     * Creates a service card element
     * @param {Object} service 
     */
    createServiceCard(service) {
        const card = document.createElement('div');
        card.className = 'service-card group';
        
        const imageUrl = service.image_url || '/images/IT.jpg';
        const lang = window.currentLanguage || 'en';
        
        let translatedCategory = service.category || '';
        if (window.globalCategoriesAndProfessions && service.category) {
            const cat = window.globalCategoriesAndProfessions.find(c => (c.name.en || c.name) === service.category);
            if (cat) translatedCategory = cat.name[lang] || cat.name.en;
        }
        
        card.innerHTML = `
            <div class="relative overflow-hidden rounded-[32px] bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500">
                <div class="relative h-64 overflow-hidden">
                    <img src="${imageUrl}" alt="${service.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    ${translatedCategory ? `
                        <div class="absolute top-6 left-6 px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-xl shadow-lg">
                            <span class="text-[10px] font-black text-slate-900 uppercase tracking-widest">${translatedCategory}</span>
                        </div>
                    ` : ''}

                    <div class="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                        <button class="edit-service-btn w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-slate-700 hover:bg-slate-900 hover:text-white shadow-xl transition-all" data-id="${service.id}">
                            <i class="fas fa-edit text-sm"></i>
                        </button>
                        <button class="delete-service-btn w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white shadow-xl transition-all" data-id="${service.id}">
                            <i class="fas fa-trash-alt text-sm"></i>
                        </button>
                    </div>
                </div>
                
                <div class="p-8">
                    <div class="flex justify-between items-start gap-4 mb-6">
                        <h3 class="text-xl font-extrabold text-slate-900 line-clamp-2 flex-1 editorial-heading leading-tight">${service.title}</h3>
                        <div class="flex flex-col items-end shrink-0 pt-1">
                            <span class="text-2xl font-black text-slate-900">${service.price}</span>
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest editorial-subheading">${service.currency || 'USD'}</span>
                        </div>
                    </div>
                    
                    <div class="pt-6 border-t border-slate-50 flex items-center justify-between">
                        <div class="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest editorial-subheading">
                            <i class="far fa-clock text-emerald-500"></i>
                            <span>${service.delivery_time || (window.translations?.duration_1_3_days?.[window.currentLanguage] || '1-3 days')}</span>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                            <i class="fas fa-arrow-right text-xs"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add listeners
        card.querySelector('.edit-service-btn').addEventListener('click', () => {
            this.openServiceModal(service);
        });
        
        card.querySelector('.delete-service-btn').addEventListener('click', () => {
            this.openDeleteModal(service.id);
        });

        return card;
    },

    /**
     * Opens service modal for create or edit
     * @param {Object|null} service 
     */
    openServiceModal(service = null) {
        const modal = document.getElementById('serviceModal');
        if (!modal) return;

        // Reset form
        const form = modal.querySelector('form');
        if (form) form.reset();

        // Reset image preview and placeholder
        const imagePreviewImg = document.getElementById('serviceImagePreviewImg');
        const imagePreviewContainer = document.getElementById('serviceImagePreview');
        const imagePlaceholder = document.getElementById('serviceImagePlaceholder');
        const imageInput = document.getElementById('serviceImage');
        const removeImageBtn = document.getElementById('removeServiceImageBtn');

        this.serviceImageRemoved = false;
        if (imagePreviewImg) imagePreviewImg.src = '';
        if (imagePreviewContainer) imagePreviewContainer.classList.add('hidden');
        if (imagePlaceholder) imagePlaceholder.classList.remove('hidden');
        if (removeImageBtn) removeImageBtn.classList.add('hidden');
        if (imageInput) imageInput.value = '';

        if (service) {
            // Edit mode
            document.getElementById('serviceModalTitle').textContent = window.translations?.edit_service_title?.[window.currentLanguage] || 'Edit Service';
            document.getElementById('serviceId').value = service.id;
            document.getElementById('serviceTitle').value = service.title;
            document.getElementById('serviceDeliveryTime').value = service.delivery_time || '';
            document.getElementById('servicePrice').value = service.price;
            document.getElementById('serviceCurrency').value = service.currency || 'USD';
            document.getElementById('serviceDescription').value = service.description;
            document.getElementById('serviceCategory').value = service.category || '';
            
            if (service.image_url && service.image_url !== '/images/IT.jpg') {
                if (imagePreviewImg) imagePreviewImg.src = service.image_url;
                if (imagePreviewContainer) imagePreviewContainer.classList.remove('hidden');
                if (imagePlaceholder) imagePlaceholder.classList.add('hidden');
                if (removeImageBtn) removeImageBtn.classList.remove('hidden');
            }

            const submitBtn = modal.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = window.translations?.update_service_btn?.[window.currentLanguage] || 'Update Service';
            }
        } else {
            // Create mode
            document.getElementById('serviceModalTitle').textContent = window.translations?.add_service_title?.[window.currentLanguage] || 'Add Service';
            document.getElementById('serviceId').value = '';
            document.getElementById('serviceCurrency').value = 'USD';
            
            const submitBtn = modal.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = window.translations?.create_service_btn?.[window.currentLanguage] || 'Create Service';
            }
        }

        if (window.DashboardModals) {
            window.DashboardModals.show(modal);
        }
    },

    /**
     * Populates the category dropdown in the service modal
     */
    populateCategories() {
        const categorySelect = document.getElementById('serviceCategory');
        if (!categorySelect || !window.globalCategoriesAndProfessions) return;

        const lang = window.currentLanguage || 'en';
        const placeholder = window.translations?.select_category_placeholder?.[lang] || 'Select a category';
        
        categorySelect.innerHTML = `<option value="" data-lang-key="select_category_placeholder">${placeholder}</option>`;

        // Sort categories alphabetically by translated name
        const sortedCategories = [...window.globalCategoriesAndProfessions].sort((a, b) => {
            const nameA = typeof a.name === 'object' ? (a.name[lang] || a.name.en) : a.name;
            const nameB = typeof b.name === 'object' ? (b.name[lang] || b.name.en) : b.name;
            return nameA.localeCompare(nameB, lang);
        });

        sortedCategories.forEach(cat => {
            const nameEn = typeof cat.name === 'object' ? cat.name.en : cat.name;
            const nameTranslated = typeof cat.name === 'object' ? (cat.name[lang] || cat.name.en) : cat.name;
            
            const option = document.createElement('option');
            option.value = nameEn;
            option.textContent = nameTranslated;
            categorySelect.appendChild(option);
        });
    },

    /**
     * Opens delete confirmation modal
     * @param {string} serviceId 
     */
    openDeleteModal(serviceId) {
        const modal = document.getElementById('deleteServiceModal');
        if (!modal) return;

        window.serviceToDeleteId = serviceId;
        
        if (window.DashboardModals) {
            window.DashboardModals.show(modal);
        }
    }
};

// Global Exposure
window.openServiceModal = (service) => DashboardServices.openServiceModal(service);
window.openDeleteServiceModal = (id) => DashboardServices.openDeleteModal(id);
window.DashboardServices = DashboardServices;
