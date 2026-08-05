// Core Dashboard Logic
// Initializes state, event listeners, and navigation

import { showSection, 
    setActiveLink, 
    showConfirmationModal, 
    showToast, 
    showModal, 
    hideModal, 
    handleSingleSelectFilter, 
    updateFreelancerSelectionUI,
    updateEmployerSelectionUI,
    updateJobSelectionUI
} from './dashboard-ui.js';
import { loadDashboardStats } from './dashboard-api.js';
import { 
    loadAllFreelancers, 
    loadAllEmployers, 
    loadJobs, 
    loadAllReviews, 
    fetchCategories, 
    fetchCities,
    fetchLoggedInUserEmail,
    updateVerificationStatus,
    sendVerificationEmail,
    deleteReview,
    removeEmployerLogo,
    loadJobsWithApplications,
    sendJobAppNotifications,
    updateJobAppNotificationSelectionUI,
    sendEmailCampaign,
    bulkVerifyFreelancers,
    bulkVerifyEmployers,
    bulkDeleteJobs,
    loadAggregatedJobs,
    fetchLogoFromUrl,
    updateAggregatedJobLogo,
    loadJobSources,
    saveJobSource,
    deleteJobSource,
    triggerSourceScan
} from './dashboard-api.js';
import { 
    applyEmailTemplate, 
    sendJobAlerts, 
    confirmSendAlerts,
    updateJobAlertEmailPreview,
    loadMatchingRecipients
} from './dashboard-ui.js';

// --- State Variables ---
import { state } from './dashboard-state.js';

document.addEventListener('DOMContentLoaded', function() {
    // --- DOM Elements ---
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
    const logoutLinkSidebar = document.getElementById('logoutLinkSidebar');

    // Freelancers Section Elements
    const freelancerSearchInput = document.getElementById('freelancerSearchInput');
    const freelancerIdFilterButtons = document.querySelectorAll('#freelancersSection .freelancer-id-filter-btn');

    // Employers Section Elements
    const employerSearchInput = document.getElementById('employerSearchInput');
    const employerIdFilterButtons = document.querySelectorAll('#employersSection .employer-id-filter-btn');
    const employerLogoFilterButtons = document.querySelectorAll('#employersSection .employer-logo-filter-btn');
    const employerTypeFilterButtons = document.querySelectorAll('#employersSection .employer-type-filter-btn');

    // Jobs Section Elements
    const jobSearchInput = document.getElementById('jobSearchInput');

    // Job Alerts Section Elements
    const jobAlertSearchInput = document.getElementById('jobAlertSearchInput');
    const jobFilterCategory = document.getElementById('jobFilterCategory');
    const jobFilterCity = document.getElementById('jobFilterCity');
    const jobFilterSentStatus = document.getElementById('jobFilterSentStatus');
    const sendAlertsBtn = document.getElementById('sendAlertsBtn');
    const confirmSendAlertsBtn = document.getElementById('confirmSendAlertsBtn');
    const cancelSendAlertsBtn = document.getElementById('cancelSendAlertsBtn');
    const jobAlertRecipientTypeRadios = document.querySelectorAll('input[name="jobAlertRecipientType"]');
    const recipientFilterCity = document.getElementById('recipientFilterCity');
    const recipientFilterCategory = document.getElementById('recipientFilterCategory');
    const recipientFilterStatus = document.getElementById('recipientFilterStatus');

    // Email Campaigns Section Elements
    const emailTemplateSelect = document.getElementById('emailTemplateSelect');
    const sendTestCampaignBtn = document.getElementById('sendTestCampaignBtn');
    const confirmSendCampaignBtn = document.getElementById('confirmSendCampaignBtn');
    const recipientTypeRadios = document.querySelectorAll('input[name="recipientType"]');
    const filteredRecipientsSection = document.getElementById('filteredRecipientsSection');
    const customRecipientsSection = document.getElementById('customRecipientsSection');

    // Logo Upload Elements
    const logoFileInput = document.getElementById('logoFileInput');
    const logoPreview = document.getElementById('logoPreview');
    const logoPreviewImage = document.getElementById('logoPreviewImage');
    const confirmUploadLogoBtn = document.getElementById('confirmUploadLogoBtn');
    const cancelUploadLogoBtn = document.getElementById('cancelUploadLogoBtn');
    const closeLogoUploadModalBtn = document.getElementById('closeLogoUploadModalBtn');
    const logoUploadModal = document.getElementById('logoUploadModal');

    // Job Application Notifications Elements
    const jobAppNotificationSearchInput = document.getElementById('jobAppNotificationSearchInput');
    const jobAppNotificationFilterCity = document.getElementById('jobAppNotificationFilterCity');
    const jobAppNotificationFilterCategory = document.getElementById('jobAppNotificationFilterCategory');
    const jobAppNotificationFilterNotified = document.getElementById('jobAppNotificationFilterNotified');
    const sendJobAppNotificationsBtn = document.getElementById('sendJobAppNotificationsBtn');
    const jobAppNotificationSelectAll = document.getElementById('jobAppNotificationSelectAll');

    // --- Initialize Header Info ---
    const currentDateDisplay = document.getElementById('currentDateDisplay');
    if (currentDateDisplay) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateDisplay.textContent = new Date().toLocaleDateString('en-US', options);
    }

    const adminEmailDisplay = document.getElementById('adminEmailDisplay');
    if (adminEmailDisplay) {
        fetchLoggedInUserEmail().then(email => {
            if (email) adminEmailDisplay.textContent = email;
        }).catch(err => {
            if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                console.error('Error fetching admin email:', err);
            }
        });
    }

    // --- Event Listeners ---
    const refreshStatsBtn = document.getElementById('refreshStatsBtn');
    if (refreshStatsBtn) {
        refreshStatsBtn.addEventListener('click', () => {
            const icon = refreshStatsBtn.querySelector('i');
            if (icon) icon.classList.add('fa-spin');
            loadDashboardStats().finally(() => {
                if (icon) icon.classList.remove('fa-spin');
            });
        });
    }

    // --- Delete User Action ---
    document.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.delete-user-btn');
        if (deleteBtn) {
            const userId = deleteBtn.dataset.id;
            const userType = deleteBtn.dataset.type;
            
            showConfirmationModal(
                'Delete User Account',
                'Are you sure you want to permanently delete this user? This will also delete all their related data (jobs, applications, profile). This action cannot be undone.',
                async () => {
                    try {
                        const response = await fetch('/admin/delete-user', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId })
                        });
                        const data = await response.json();
                        if (data.success) {
                            showToast('User deleted successfully', 'success');
                            // Refresh current list
                            if (userType === 'freelancer') loadAllFreelancers();
                            else loadAllEmployers();
                        } else {
                            showToast(data.error || 'Failed to delete user', 'error');
                        }
                    } catch (err) {
                        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                            console.error('Delete user error:', err);
                        }
                        showToast('Server error during deletion', 'error');
                    }
                }
            );
        }
    });

    // --- Edit User Action ---
    document.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.edit-user-btn');
        if (editBtn) {
            const userId = editBtn.dataset.id;
            const userType = editBtn.dataset.type;
            
            // For now, let's use a simple prompt-based edit or we can build a proper modal
            // Let's implement a simple modal-like prompt for key fields
            const newCity = prompt("Enter new city (leave blank to keep current):");
            const newPhone = prompt("Enter new phone (leave blank to keep current):");
            
            if (newCity === null && newPhone === null) return; // User cancelled

            try {
                const response = await fetch('/admin/update-user-info', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        userId, 
                        city: newCity || undefined, 
                        phone: newPhone || undefined 
                    })
                });
                const data = await response.json();
                if (data.success) {
                    showToast('User updated successfully', 'success');
                    if (userType === 'freelancer') loadAllFreelancers();
                    else loadAllEmployers();
                } else {
                    showToast(data.error || 'Failed to update user', 'error');
                }
            } catch (err) {
                if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                    console.error('Update user error:', err);
                }
                showToast('Server error during update', 'error');
            }
        }
    });

    // Navigation
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
    });

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            // Only prevent default for internal section anchors
            if (href.startsWith('#')) {
                e.preventDefault();
                const sectionId = href.substring(1);
                showSection(sectionId);
                setActiveLink(link.id);
                if (window.innerWidth < 768) {
                    sidebar.classList.add('-translate-x-full');
                }
            }
            // Otherwise, let the browser handle the navigation (e.g., /admin/auto-email)
        });
    });

    logoutLinkSidebar.addEventListener('click', (e) => {
        e.preventDefault();
        showConfirmationModal(
            'Logout Confirmation',
            'Are you sure you want to log out of the admin dashboard?',
            async () => {
                try {
                    const response = await fetch('/api/logout', { 
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    const data = await response.json();
                    if (data.success) {
                        window.location.href = data.redirect || '/login.html';
                    } else {
                        throw new Error(data.error || 'Logout failed');
                    }
                } catch (err) {
                    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                        console.error('Logout error:', err);
                    }
                    showToast('Failed to log out. Please try again.', 'error');
                }
            }
        );
    });

    // Freelancer Filters
    freelancerSearchInput.addEventListener('input', debounce(() => loadAllFreelancers(freelancerSearchInput.value, state.filters.freelancers.status), 300));
    
    handleSingleSelectFilter(freelancerIdFilterButtons, (value) => {
        state.filters.freelancers.status = value;
        loadAllFreelancers(freelancerSearchInput.value, value);
    }, 'filterStatus');

    const freelancerCategoryFilter = document.getElementById('freelancerCategoryFilter');
    const freelancerCityFilter = document.getElementById('freelancerCityFilter');
    const loadMoreFreelancersBtn = document.getElementById('loadMoreFreelancersBtn');

    if (freelancerCategoryFilter) {
        freelancerCategoryFilter.addEventListener('change', (e) => {
            state.filters.freelancers.category = e.target.value;
            loadAllFreelancers(freelancerSearchInput.value, state.filters.freelancers.status);
        });
    }

    if (freelancerCityFilter) {
        freelancerCityFilter.addEventListener('change', (e) => {
            state.filters.freelancers.city = e.target.value;
            loadAllFreelancers(freelancerSearchInput.value, state.filters.freelancers.status);
        });
    }

    if (loadMoreFreelancersBtn) {
        loadMoreFreelancersBtn.addEventListener('click', () => {
            loadAllFreelancers(freelancerSearchInput.value, state.filters.freelancers.status, true);
        });
    }

    // Employer Filters
    employerSearchInput.addEventListener('input', debounce(() => loadAllEmployers(employerSearchInput.value, state.filters.employers.status), 300));

    handleSingleSelectFilter(employerIdFilterButtons, (value) => {
        state.filters.employers.status = value;
        loadAllEmployers(employerSearchInput.value, value);
    }, 'filterStatus');

    handleSingleSelectFilter(employerLogoFilterButtons, (value) => {
        state.filters.employers.logo = value;
        loadAllEmployers(employerSearchInput.value, state.filters.employers.status);
    }, 'logoFilter');

    handleSingleSelectFilter(employerTypeFilterButtons, (value) => {
        state.filters.employers.type = value;
        loadAllEmployers(employerSearchInput.value, state.filters.employers.status);
    }, 'typeFilter');

    const employerCityFilter = document.getElementById('employerCityFilter');
    const loadMoreEmployersBtn = document.getElementById('loadMoreEmployersBtn');

    if (employerCityFilter) {
        employerCityFilter.addEventListener('change', (e) => {
            state.filters.employers.city = e.target.value;
            loadAllEmployers(employerSearchInput.value, state.filters.employers.status);
        });
    }

    if (loadMoreEmployersBtn) {
        loadMoreEmployersBtn.addEventListener('click', () => {
            loadAllEmployers(employerSearchInput.value, state.filters.employers.status, true);
        });
    }

    // Clear Filters Listeners
    const clearFreelancerFiltersBtn = document.getElementById('clearFreelancerFilters');
    if (clearFreelancerFiltersBtn) {
        clearFreelancerFiltersBtn.addEventListener('click', () => {
            freelancerSearchInput.value = '';
            state.filters.freelancers = { search: '', status: 'All', category: 'all', profession: 'all', city: 'all' };
            freelancerIdFilterButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.filterStatus === 'All'));
            if (freelancerCategoryFilter) freelancerCategoryFilter.value = 'all';
            if (freelancerCityFilter) freelancerCityFilter.value = 'all';
            loadAllFreelancers('', 'All');
        });
    }

    const clearEmployerFiltersBtn = document.getElementById('clearEmployerFilters');
    if (clearEmployerFiltersBtn) {
        clearEmployerFiltersBtn.addEventListener('click', () => {
            employerSearchInput.value = '';
            state.filters.employers = { search: '', status: 'All', type: 'all', logo: 'all', city: 'all' };
            
            employerIdFilterButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.filterStatus === 'All'));
            employerLogoFilterButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.logoFilter === 'all'));
            employerTypeFilterButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.typeFilter === 'all'));
            if (employerCityFilter) employerCityFilter.value = 'all';
            
            loadAllEmployers('', 'All');
        });
    }

    const clearJobFiltersBtn = document.getElementById('clearJobFilters');
    if (clearJobFiltersBtn) {
        clearJobFiltersBtn.addEventListener('click', () => {
            jobSearchInput.value = '';
            loadJobs('', 'jobsSection');
        });
    }

    const clearReviewFiltersBtn = document.getElementById('clearReviewFilters');
    if (clearReviewFiltersBtn) {
        clearReviewFiltersBtn.addEventListener('click', () => {
            loadAllReviews();
        });
    }

    const clearJobAlertFiltersBtn = document.getElementById('clearJobAlertFilters');
    if (clearJobAlertFiltersBtn) {
        clearJobAlertFiltersBtn.addEventListener('click', () => {
            if (jobAlertSearchInput) jobAlertSearchInput.value = '';
            if (jobFilterCity) jobFilterCity.value = 'all';
            if (jobFilterCategory) jobFilterCategory.value = 'all';
            if (jobFilterSentStatus) jobFilterSentStatus.value = 'all';
            if (recipientFilterCity) recipientFilterCity.value = 'all';
            if (recipientFilterCategory) recipientFilterCategory.value = 'all';
            loadJobs('', 'jobAlertsSection');
            loadMatchingRecipients();
        });
    }

    const clearJobAppNotifFiltersBtn = document.getElementById('clearJobAppNotifFilters');
    if (clearJobAppNotifFiltersBtn) {
        clearJobAppNotifFiltersBtn.addEventListener('click', () => {
            if (jobAppNotificationSearchInput) jobAppNotificationSearchInput.value = '';
            if (jobAppNotificationFilterCity) jobAppNotificationFilterCity.value = 'all';
            if (jobAppNotificationFilterCategory) jobAppNotificationFilterCategory.value = 'all';
            if (jobAppNotificationFilterNotified) jobAppNotificationFilterNotified.value = 'all';
            loadJobsWithApplications('', 'all', 'all', 'all');
        });
    }


    // Job Search
    if (jobSearchInput) jobSearchInput.addEventListener('input', debounce(() => loadJobs(jobSearchInput.value, 'jobsSection'), 300));

    // Job Alerts
    if (jobAlertSearchInput) jobAlertSearchInput.addEventListener('input', debounce(() => loadJobs(jobAlertSearchInput.value, 'jobAlertsSection'), 300));
    if (jobFilterCategory) jobFilterCategory.addEventListener('change', () => loadJobs(jobAlertSearchInput.value, 'jobAlertsSection'));
    if (jobFilterCity) jobFilterCity.addEventListener('change', () => loadJobs(jobAlertSearchInput.value, 'jobAlertsSection'));
    if (jobFilterSentStatus) jobFilterSentStatus.addEventListener('change', () => loadJobs(jobAlertSearchInput.value, 'jobAlertsSection'));

    if (sendAlertsBtn) sendAlertsBtn.addEventListener('click', sendJobAlerts);
    if (confirmSendAlertsBtn) confirmSendAlertsBtn.addEventListener('click', confirmSendAlerts);
    if (cancelSendAlertsBtn) cancelSendAlertsBtn.addEventListener('click', () => {
        hideModal(document.getElementById('jobAlertConfirmModal'));
    });
    
    // Close Job Alert Confirm Modal (X button)
    const closeJobAlertConfirmModalBtn = document.getElementById('closeJobAlertConfirmModalBtn');
    if (closeJobAlertConfirmModalBtn) {
        closeJobAlertConfirmModalBtn.addEventListener('click', () => {
             hideModal(document.getElementById('jobAlertConfirmModal'));
        });
    }

    // Logo Upload Modal
    if (cancelUploadLogoBtn) {
        cancelUploadLogoBtn.addEventListener('click', () => {
            hideModal(logoUploadModal);
        });
    }
    
    if (closeLogoUploadModalBtn) {
        closeLogoUploadModalBtn.addEventListener('click', () => {
            hideModal(logoUploadModal);
        });
    }

    jobAlertRecipientTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'filtered') {
                document.getElementById('filteredJobAlertRecipientsSection').classList.remove('hidden');
                document.getElementById('customJobAlertRecipientsSection').classList.add('hidden');
            } else {
                document.getElementById('filteredJobAlertRecipientsSection').classList.add('hidden');
                document.getElementById('customJobAlertRecipientsSection').classList.remove('hidden');
            }
            updateJobAlertEmailPreview(); // Update preview when switching types
        });
    });
    
    // Recipient filters change listeners
    if (recipientFilterCity) recipientFilterCity.addEventListener('change', loadMatchingRecipients);
    if (recipientFilterCategory) recipientFilterCategory.addEventListener('change', loadMatchingRecipients);

    const customJobAlertEmails = document.getElementById('customJobAlertEmails');
    if (customJobAlertEmails) customJobAlertEmails.addEventListener('input', debounce(loadMatchingRecipients, 500));


    // Email Campaigns
    const emailMessage = document.getElementById('emailMessage');
    const emailMessageCharCount = document.getElementById('emailMessageCharCount');
    if (emailMessage && emailMessageCharCount) {
        emailMessage.addEventListener('input', () => {
            emailMessageCharCount.textContent = `${emailMessage.value.length} characters`;
        });
    }

    if (emailTemplateSelect) {
        emailTemplateSelect.addEventListener('change', (e) => {
            const templateName = e.target.value;
            if (templateName !== 'custom') {
                applyEmailTemplate(templateName);
            }
        });
    }

    recipientTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'filtered') {
                filteredRecipientsSection.classList.remove('hidden');
                customRecipientsSection.classList.add('hidden');
            } else {
                filteredRecipientsSection.classList.add('hidden');
                customRecipientsSection.classList.remove('hidden');
            }
        });
    });

    // Aggregated Jobs Filters
    const aggregatedJobSearchInput = document.getElementById('aggregatedJobSearchInput');
    const aggregatedLogoFilterButtons = document.querySelectorAll('.aggregated-logo-filter-btn');
    const loadMoreAggregatedJobsBtn = document.getElementById('loadMoreAggregatedJobsBtn');
    const clearAggregatedJobFiltersBtn = document.getElementById('clearAggregatedJobFilters');

    if (aggregatedJobSearchInput) {
        aggregatedJobSearchInput.addEventListener('input', debounce(() => {
            state.filters.aggregatedJobs.search = aggregatedJobSearchInput.value;
            loadAggregatedJobs(aggregatedJobSearchInput.value, state.filters.aggregatedJobs.logoStatus);
        }, 300));
    }

    handleSingleSelectFilter(aggregatedLogoFilterButtons, (value) => {
        state.filters.aggregatedJobs.logoStatus = value;
        loadAggregatedJobs(state.filters.aggregatedJobs.search, value);
    }, 'logoStatus');

    if (loadMoreAggregatedJobsBtn) {
        loadMoreAggregatedJobsBtn.addEventListener('click', () => {
            loadAggregatedJobs(state.filters.aggregatedJobs.search, state.filters.aggregatedJobs.logoStatus, true);
        });
    }

    if (clearAggregatedJobFiltersBtn) {
        clearAggregatedJobFiltersBtn.addEventListener('click', () => {
            if (aggregatedJobSearchInput) aggregatedJobSearchInput.value = '';
            state.filters.aggregatedJobs = { search: '', logoStatus: 'all' };
            aggregatedLogoFilterButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.logoStatus === 'all'));
            loadAggregatedJobs('', 'all');
        });
    }

    // Aggregated Job Logo Modal Logic
    const aggregatedJobLogoModal = document.getElementById('aggregatedJobLogoModal');
    const companyWebsiteUrl = document.getElementById('companyWebsiteUrl');
    const fetchLogoFromUrlBtn = document.getElementById('fetchLogoFromUrlBtn');
    const aggregatedLogoFileInput = document.getElementById('aggregatedLogoFileInput');
    const aggregatedLogoPreviewContainer = document.getElementById('aggregatedLogoPreviewContainer');
    const aggregatedLogoPreviewImage = document.getElementById('aggregatedLogoPreviewImage');
    const saveAggregatedLogoBtn = document.getElementById('saveAggregatedLogoBtn');
    const cancelAggregatedLogoBtn = document.getElementById('cancelAggregatedLogoBtn');
    const closeAggregatedJobLogoModalBtn = document.getElementById('closeAggregatedJobLogoModalBtn');

    if (fetchLogoFromUrlBtn) {
        fetchLogoFromUrlBtn.addEventListener('click', async () => {
            const url = companyWebsiteUrl.value;
            const companyName = state.currentAggregatedJob?.company;
            if (!url) {
                showToast('Please enter a website URL', 'error');
                return;
            }

            fetchLogoFromUrlBtn.disabled = true;
            fetchLogoFromUrlBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching...';

            try {
                const data = await fetchLogoFromUrl(url, companyName);
                if (data.success && data.logoUrl) {
                    aggregatedLogoPreviewImage.src = data.logoUrl;
                    aggregatedLogoPreviewContainer.classList.remove('hidden');
                    saveAggregatedLogoBtn.disabled = false;
                    state.currentAggregatedJob.newLogoUrl = data.logoUrl;
                    state.currentAggregatedJob.newLogoFile = null;
                    showToast('Logo fetched successfully', 'success');
                } else {
                    showToast('Could not find logo on that website', 'warning');
                }
            } catch (err) {
                showToast('Error fetching logo', 'error');
            } finally {
                fetchLogoFromUrlBtn.disabled = false;
                fetchLogoFromUrlBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Fetch';
            }
        });
    }

    if (aggregatedLogoFileInput) {
        aggregatedLogoFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    aggregatedLogoPreviewImage.src = e.target.result;
                    aggregatedLogoPreviewContainer.classList.remove('hidden');
                    saveAggregatedLogoBtn.disabled = false;
                    state.currentAggregatedJob.newLogoFile = file;
                    state.currentAggregatedJob.newLogoUrl = null;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (saveAggregatedLogoBtn) {
        saveAggregatedLogoBtn.addEventListener('click', async () => {
            const { id, newLogoUrl, newLogoFile } = state.currentAggregatedJob;
            
            saveAggregatedLogoBtn.disabled = true;
            document.getElementById('saveAggregatedLogoSpinner').style.display = 'inline-block';

            try {
                const data = await updateAggregatedJobLogo(id, newLogoUrl, newLogoFile);
                if (data.success) {
                    showToast('Logo updated successfully', 'success');
                    hideModal(aggregatedJobLogoModal);
                    loadAggregatedJobs(state.filters.aggregatedJobs.search, state.filters.aggregatedJobs.logoStatus);
                } else {
                    showToast(data.error || 'Failed to update logo', 'error');
                }
            } catch (err) {
                showToast('Server error updating logo', 'error');
            } finally {
                saveAggregatedLogoBtn.disabled = false;
                document.getElementById('saveAggregatedLogoSpinner').style.display = 'none';
            }
        });
    }

    if (cancelAggregatedLogoBtn) cancelAggregatedLogoBtn.addEventListener('click', () => hideModal(aggregatedJobLogoModal));
    if (closeAggregatedJobLogoModalBtn) closeAggregatedJobLogoModalBtn.addEventListener('click', () => hideModal(aggregatedJobLogoModal));

    // Logo Upload Logic
    if (logoFileInput) {
        logoFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) {
                    showToast('File size must be less than 2MB', 'error');
                    logoFileInput.value = '';
                    return;
                }
                if (!file.type.startsWith('image/')) {
                    showToast('Please select a valid image file', 'error');
                    logoFileInput.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                    logoPreviewImage.src = e.target.result;
                    logoPreview.classList.remove('hidden');
                    confirmUploadLogoBtn.disabled = false;
                };
                reader.readAsDataURL(file);
            } else {
                logoPreview.classList.add('hidden');
                confirmUploadLogoBtn.disabled = true;
            }
        });
    }

    // Job Application Notifications Listeners
    if (jobAppNotificationSearchInput) jobAppNotificationSearchInput.addEventListener('input', debounce(() => loadJobsWithApplications(jobAppNotificationSearchInput.value, jobAppNotificationFilterCity.value, jobAppNotificationFilterCategory.value, jobAppNotificationFilterNotified.value), 300));
    if (jobAppNotificationFilterCity) jobAppNotificationFilterCity.addEventListener('change', () => loadJobsWithApplications(jobAppNotificationSearchInput.value, jobAppNotificationFilterCity.value, jobAppNotificationFilterCategory.value, jobAppNotificationFilterNotified.value));
    if (jobAppNotificationFilterCategory) jobAppNotificationFilterCategory.addEventListener('change', () => loadJobsWithApplications(jobAppNotificationSearchInput.value, jobAppNotificationFilterCity.value, jobAppNotificationFilterCategory.value, jobAppNotificationFilterNotified.value));
    if (jobAppNotificationFilterNotified) jobAppNotificationFilterNotified.addEventListener('change', () => loadJobsWithApplications(jobAppNotificationSearchInput.value, jobAppNotificationFilterCity.value, jobAppNotificationFilterCategory.value, jobAppNotificationFilterNotified.value));

    if (sendJobAppNotificationsBtn) sendJobAppNotificationsBtn.addEventListener('click', sendJobAppNotifications);
    
    if (jobAppNotificationSelectAll) {
        jobAppNotificationSelectAll.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            document.querySelectorAll('.job-app-notif-checkbox').forEach(cb => {
                cb.checked = isChecked;
                const jobId = parseInt(cb.value);
                if (isChecked) state.selectedJobAppNotificationIds.add(jobId);
                else state.selectedJobAppNotificationIds.delete(jobId);
            });
            updateJobAppNotificationSelectionUI();
        });
    }

    // Select All Listeners for Bulk Actions
    const selectAllFreelancers = document.getElementById('selectAllFreelancers');
    if (selectAllFreelancers) {
        selectAllFreelancers.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            document.querySelectorAll('.freelancer-checkbox').forEach(cb => {
                cb.checked = isChecked;
                const id = parseInt(cb.dataset.id);
                if (isChecked) state.selectedFreelancers.add(id);
                else state.selectedFreelancers.delete(id);
            });
            updateFreelancerSelectionUI();
        });
    }

    const selectAllEmployers = document.getElementById('selectAllEmployers');
    if (selectAllEmployers) {
        selectAllEmployers.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            document.querySelectorAll('.employer-checkbox').forEach(cb => {
                cb.checked = isChecked;
                const id = parseInt(cb.dataset.id);
                if (isChecked) state.selectedEmployers.add(id);
                else state.selectedEmployers.delete(id);
            });
            updateEmployerSelectionUI();
        });
    }

    const selectAllJobs = document.getElementById('selectAllJobs');
    if (selectAllJobs) {
        selectAllJobs.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            document.querySelectorAll('.job-checkbox').forEach(cb => {
                cb.checked = isChecked;
                const id = parseInt(cb.dataset.id);
                if (isChecked) state.selectedJobsList.add(id);
                else state.selectedJobsList.delete(id);
            });
            updateJobSelectionUI();
        });
    }

    // Global Change Listener for Checkboxes
    document.body.addEventListener('change', (e) => {
        if (e.target.classList.contains('job-app-notif-checkbox')) {
            const jobId = parseInt(e.target.value);
            if (e.target.checked) state.selectedJobAppNotificationIds.add(jobId);
            else state.selectedJobAppNotificationIds.delete(jobId);
            
            updateJobAppNotificationSelectionUI();
            
            // Update Select All checkbox state
            const allCheckboxes = document.querySelectorAll('.job-app-notif-checkbox');
            const allChecked = Array.from(allCheckboxes).every(cb => cb.checked);
            const selectAll = document.getElementById('jobAppNotificationSelectAll');
            if (selectAll) selectAll.checked = allChecked;
        }

        // Job Alerts Checkboxes
        if (e.target.classList.contains('job-alert-checkbox')) {
            const jobId = parseInt(e.target.value);
            const isChecked = e.target.checked;
            
            if (isChecked) {
                const job = state.allJobsData.find(j => j.id === jobId);
                if (job) state.selectedJobs.set(jobId, job);
            } else {
                state.selectedJobs.delete(jobId);
            }
            
            updateJobAlertEmailPreview(Array.from(state.selectedJobs.values()));
            
            // Update Select All checkbox state
            const allCheckboxes = document.querySelectorAll('.job-alert-checkbox');
            const allChecked = Array.from(allCheckboxes).every(cb => cb.checked);
            const selectAll = document.getElementById('jobAlertSelectAll');
            if (selectAll) selectAll.checked = allChecked;
        }

        // Freelancer Checkboxes
        if (e.target.classList.contains('freelancer-checkbox')) {
            const id = parseInt(e.target.dataset.id);
            if (e.target.checked) state.selectedFreelancers.add(id);
            else state.selectedFreelancers.delete(id);
            updateFreelancerSelectionUI();
        }

        // Employer Checkboxes
        if (e.target.classList.contains('employer-checkbox')) {
            const id = parseInt(e.target.dataset.id);
            if (e.target.checked) state.selectedEmployers.add(id);
            else state.selectedEmployers.delete(id);
            updateEmployerSelectionUI();
        }

        // Job Checkboxes
        if (e.target.classList.contains('job-checkbox')) {
            const id = parseInt(e.target.dataset.id);
            if (e.target.checked) state.selectedJobsList.add(id);
            else state.selectedJobsList.delete(id);
            updateJobSelectionUI();
        }
    });

    // Modal Close Listeners (Generic)
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal-overlay');
            if (modal) {
                modal.classList.remove('open');
                modal.classList.add('hidden');
                document.body.classList.remove('overflow-hidden');
            }
        });
    });

    // Global Event Delegation for Dynamic Elements
    document.body.addEventListener('click', async (e) => {
        const target = e.target;
        
        // Accept ID
        const acceptBtn = target.closest('.accept-id-btn');
        if (acceptBtn) {
            const userId = acceptBtn.dataset.userId;
            const userName = acceptBtn.dataset.userName;
            const userType = acceptBtn.dataset.userType || (acceptBtn.closest('#freelancersTableBody') ? 'Freelancer' : 'Employer');
            
            showConfirmationModal(
                'Confirm ID Acceptance',
                `Are you sure you want to <span class="text-success font-bold">ACCEPT</span> the ID for <strong>${userName}</strong>?`,
                async () => {
                    await updateVerificationStatus(userId, userType, 'Verified');
                    showToast('ID Accepted successfully', 'success');
                    if (userType === 'Freelancer') loadAllFreelancers(freelancerSearchInput.value, state.currentFreelancerIdFilter);
                    else loadAllEmployers(employerSearchInput.value, state.currentEmployerIdFilter, state.currentEmployerLogoFilter, state.currentEmployerTypeFilter);
                }
            );
            return;
        }

        // Reject ID
        const rejectBtn = target.closest('.reject-id-btn');
        if (rejectBtn) {
            const userId = rejectBtn.dataset.userId;
            const userName = rejectBtn.dataset.userName;
            const userType = rejectBtn.dataset.userType || (rejectBtn.closest('#freelancersTableBody') ? 'Freelancer' : 'Employer');
            
            showConfirmationModal(
                'Confirm ID Rejection',
                `Are you sure you want to <span class="text-danger font-bold">REJECT</span> the ID for <strong>${userName}</strong>?<br><br>
                 <label class="block text-sm mb-2 text-gray-400">Reason for Rejection:</label>
                 <textarea id="rejectionReasonInput" class="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white focus:outline-none focus:border-primary" rows="3" placeholder="Enter reason..."></textarea>`,
                async () => {
                    const reason = document.getElementById('rejectionReasonInput').value;
                    if (!reason) {
                        throw new Error('Please provide a rejection reason.');
                    }
                    await updateVerificationStatus(userId, userType, 'Rejected', reason);
                    showToast('ID Rejected successfully', 'success');
                    if (userType === 'Freelancer') loadAllFreelancers(freelancerSearchInput.value, state.currentFreelancerIdFilter);
                    else loadAllEmployers(employerSearchInput.value, state.currentEmployerIdFilter, state.currentEmployerLogoFilter, state.currentEmployerTypeFilter);
                }
            );
            return;
        }

        // Send Verification Email
        const sendEmailBtn = target.closest('.send-verification-email-btn');
        if (sendEmailBtn) {
            const userId = sendEmailBtn.dataset.userId;
            const userName = sendEmailBtn.dataset.userName;
            const userType = sendEmailBtn.dataset.userType || (sendEmailBtn.closest('#freelancersTableBody') ? 'Freelancer' : 'Employer');

            showConfirmationModal(
                'Send Verification Email',
                `Send a verification reminder email to <strong>${userName}</strong>?`,
                async () => {
                    await sendVerificationEmail(userId, userType);
                    showToast('Verification email sent', 'success');
                }
            );
            return;
        }

        // Bulk Actions
        const bulkVerifyFreelancersBtn = target.closest('#bulkVerifyFreelancersBtn');
        if (bulkVerifyFreelancersBtn) {
            const count = state.selectedFreelancers.size;
            showConfirmationModal(
                'Bulk Verify Freelancers',
                `Are you sure you want to <span class="text-success font-bold">VERIFY</span> all <strong>${count}</strong> selected freelancers?`,
                async () => {
                    await bulkVerifyFreelancers(Array.from(state.selectedFreelancers), 'Verified');
                    showToast(`Successfully verified ${count} freelancers`, 'success');
                    state.selectedFreelancers.clear();
                    updateFreelancerSelectionUI();
                    loadAllFreelancers(freelancerSearchInput.value, state.currentFreelancerIdFilter);
                }
            );
            return;
        }

        const bulkVerifyEmployersBtn = target.closest('#bulkVerifyEmployersBtn');
        if (bulkVerifyEmployersBtn) {
            const count = state.selectedEmployers.size;
            showConfirmationModal(
                'Bulk Verify Employers',
                `Are you sure you want to <span class="text-success font-bold">VERIFY</span> all <strong>${count}</strong> selected employers?`,
                async () => {
                    await bulkVerifyEmployers(Array.from(state.selectedEmployers), 'Verified');
                    showToast(`Successfully verified ${count} employers`, 'success');
                    state.selectedEmployers.clear();
                    updateEmployerSelectionUI();
                    loadAllEmployers(employerSearchInput.value, state.currentEmployerIdFilter, state.currentEmployerLogoFilter, state.currentEmployerTypeFilter);
                }
            );
            return;
        }

        const bulkDeleteJobsBtn = target.closest('#bulkDeleteJobsBtn');
        if (bulkDeleteJobsBtn) {
            const count = state.selectedJobsList.size;
            showConfirmationModal(
                'Bulk Delete Jobs',
                `Are you sure you want to <span class="text-danger font-bold">DELETE</span> all <strong>${count}</strong> selected jobs? This action cannot be undone.`,
                async () => {
                    await bulkDeleteJobs(Array.from(state.selectedJobsList));
                    showToast(`Successfully deleted ${count} jobs`, 'success');
                    state.selectedJobsList.clear();
                    updateJobSelectionUI();
                    loadJobs(jobSearchInput.value, 'jobsSection');
                }
            );
            return;
        }

        // Delete Review
        const deleteReviewBtn = target.closest('.delete-review-btn');
        if (deleteReviewBtn) {
            const reviewId = deleteReviewBtn.dataset.reviewId;
            showConfirmationModal(
                'Delete Review',
                'Are you sure you want to delete this review? This action cannot be undone.',
                async () => {
                    await deleteReview(reviewId);
                    showToast('Review deleted', 'success');
                    loadAllReviews();
                }
            );
            return;
        }
        
        // Upload Logo (Open Modal)
        const uploadLogoBtn = target.closest('.upload-logo-btn');
        if (uploadLogoBtn) {
            const userId = uploadLogoBtn.dataset.userId;
            const companyName = uploadLogoBtn.dataset.companyName;
            
            state.currentEmployerForLogo = { id: userId, name: companyName };
            document.getElementById('logoModalCompanyName').textContent = companyName;
            
            // Reset file input
            if(logoFileInput) logoFileInput.value = '';
            logoPreview.classList.add('hidden');
            confirmUploadLogoBtn.disabled = true;
            
            showModal(logoUploadModal);
            return;
        }

        // Remove Logo
        const removeLogoBtn = target.closest('.remove-logo-btn');
        if (removeLogoBtn) {
            const userId = removeLogoBtn.dataset.userId;
            showConfirmationModal(
                'Remove Logo',
                'Are you sure you want to remove this employer\'s logo?',
                async () => {
                    await removeEmployerLogo(userId);
                    showToast('Logo removed', 'success');
                    loadAllEmployers(employerSearchInput.value, state.currentEmployerIdFilter, state.currentEmployerLogoFilter, state.currentEmployerTypeFilter);
                }
            );
            return;
        }
        
        // Copy Gift Code
        const copyBtn = target.closest('.copy-btn');
        if (copyBtn) {
            navigator.clipboard.writeText(copyBtn.dataset.code);
            showToast('Code copied to clipboard!', 'success');
            return;
        }

        // Edit Aggregated Logo
        const editAggregatedLogoBtn = target.closest('.edit-aggregated-logo-btn');
        if (editAggregatedLogoBtn) {
            const jobId = editAggregatedLogoBtn.dataset.id;
            const companyName = editAggregatedLogoBtn.dataset.company;
            const currentLogo = editAggregatedLogoBtn.dataset.logo;

            state.currentAggregatedJob = { id: jobId, company: companyName, logo: currentLogo };
            
            document.getElementById('aggregatedLogoModalCompanyName').textContent = companyName;
            document.getElementById('companyWebsiteUrl').value = '';
            document.getElementById('aggregatedLogoFileInput').value = '';
            
            if (currentLogo) {
                document.getElementById('aggregatedLogoPreviewImage').src = currentLogo;
                document.getElementById('aggregatedLogoPreviewContainer').classList.remove('hidden');
            } else {
                document.getElementById('aggregatedLogoPreviewContainer').classList.add('hidden');
            }
            
            document.getElementById('saveAggregatedLogoBtn').disabled = true;
            showModal(document.getElementById('aggregatedJobLogoModal'));
            return;
        }

        // --- Job Source Actions ---
        
        // Add New Source
        const addSourceBtn = target.closest('#addSourceBtn');
        if (addSourceBtn) {
            state.currentJobSource = null;
            document.getElementById('jobSourceModalTitle').textContent = 'Add New Intelligence Source';
            document.getElementById('jobSourceForm').reset();
            document.getElementById('sourceId').value = '';
            showModal(document.getElementById('jobSourceModal'));
            return;
        }

        // Edit Source
        const editSourceBtn = target.closest('.edit-source-btn');
        if (editSourceBtn) {
            const d = editSourceBtn.dataset;
            state.currentJobSource = { id: d.id };
            
            document.getElementById('jobSourceModalTitle').textContent = 'Edit Intelligence Source';
            document.getElementById('sourceId').value = d.id;
            document.getElementById('sourceName').value = d.name;
            document.getElementById('sourceType').value = d.type;
            document.getElementById('sourceCountry').value = d.country;
            document.getElementById('sourceUrl').value = d.url;
            document.getElementById('sourceActive').checked = d.active === 'true';
            document.getElementById('sourcePriority').value = d.priority;
            document.getElementById('sourceConfig').value = JSON.stringify(JSON.parse(d.config), null, 2);
            
            showModal(document.getElementById('jobSourceModal'));
            return;
        }

        // Delete Source
        const deleteSourceBtn = target.closest('.delete-source-btn');
        if (deleteSourceBtn) {
            const id = deleteSourceBtn.dataset.id;
            showConfirmationModal(
                'Delete Job Source',
                'Are you sure you want to delete this intelligence source? This will stop all future scans for this company.',
                async () => {
                    await deleteJobSource(id);
                    showToast('Source deleted successfully', 'success');
                    loadJobSources();
                }
            );
            return;
        }

        // Trigger Scan
        const triggerScanBtn = target.closest('.trigger-source-scan-btn');
        if (triggerScanBtn) {
            const id = triggerScanBtn.dataset.id;
            triggerScanBtn.disabled = true;
            const icon = triggerScanBtn.querySelector('i');
            if (icon) icon.classList.add('fa-spin');
            
            try {
                await triggerSourceScan(id);
                showToast('Scan triggered in background', 'success');
            } catch (err) {
                showToast('Failed to trigger scan', 'error');
            } finally {
                setTimeout(() => {
                    triggerScanBtn.disabled = false;
                    if (icon) icon.classList.remove('fa-spin');
                }, 2000);
            }
            return;
        }
    });

    // Job Source Modal Save
    const saveJobSourceBtn = document.getElementById('saveJobSourceBtn');
    if (saveJobSourceBtn) {
        saveJobSourceBtn.addEventListener('click', async () => {
            const form = document.getElementById('jobSourceForm');
            const formData = new FormData(form);
            const sourceId = document.getElementById('sourceId').value;
            
            let config = {};
            try {
                const configText = document.getElementById('sourceConfig').value;
                config = configText ? JSON.parse(configText) : {};
            } catch (e) {
                showToast('Invalid JSON in configuration field', 'error');
                return;
            }

            const data = {
                id: sourceId || undefined,
                name: document.getElementById('sourceName').value,
                type: document.getElementById('sourceType').value,
                country_code: document.getElementById('sourceCountry').value,
                base_url: document.getElementById('sourceUrl').value,
                active: document.getElementById('sourceActive').checked,
                priority: parseInt(document.getElementById('sourcePriority').value) || 100,
                config: config
            };

            if (!data.name || !data.type) {
                showToast('Name and Type are required', 'error');
                return;
            }

            saveJobSourceBtn.disabled = true;
            saveJobSourceBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            try {
                await saveJobSource(data);
                showToast(sourceId ? 'Source updated' : 'Source created', 'success');
                hideModal(document.getElementById('jobSourceModal'));
                loadJobSources();
            } catch (err) {
                showToast(err.message || 'Failed to save source', 'error');
            } finally {
                saveJobSourceBtn.disabled = false;
                saveJobSourceBtn.innerHTML = 'Save Source';
            }
        });
    }

    const cancelJobSourceBtn = document.getElementById('cancelJobSourceBtn');
    if (cancelJobSourceBtn) {
        cancelJobSourceBtn.addEventListener('click', () => {
            hideModal(document.getElementById('jobSourceModal'));
        });
    }

    // --- Email Campaign Event Listeners ---

    if (emailTemplateSelect) {
        emailTemplateSelect.addEventListener('change', async (e) => {
            await applyEmailTemplate(e.target.value);
        });
    }

    if (recipientTypeRadios) {
        recipientTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    customRecipientsSection.classList.remove('hidden');
                    filteredRecipientsSection.classList.add('hidden');
                } else {
                    customRecipientsSection.classList.add('hidden');
                    filteredRecipientsSection.classList.remove('hidden');
                }
            });
        });
    }

    if (sendTestCampaignBtn) {
        sendTestCampaignBtn.addEventListener('click', async () => {
            const subject = document.getElementById('emailSubject').value;
            const message = document.getElementById('emailMessage').value;
            const template = emailTemplateSelect.value;
            
            if (!subject || !message) {
                showToast('Please enter subject and message.', 'error');
                return;
            }
            
            const testEmail = prompt("Enter email address for test (leave empty to send to yourself):");
            if (testEmail === null) return; // Cancelled

            const originalText = sendTestCampaignBtn.innerHTML;
            sendTestCampaignBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            sendTestCampaignBtn.disabled = true;

            try {
                // Determine if we are using custom template or not for test
                // The backend handles specific templates, but for custom we pass subject/message
                await sendEmailCampaign({
                    subject,
                    message,
                    template,
                    testEmail: testEmail || 'self', // 'self' or empty will be handled by backend or default to user email
                    dryRun: false
                });
                showToast('Test email sent successfully.', 'success');
            } catch (error) {
                showToast(error.message || 'Failed to send test email.', 'error');
            } finally {
                sendTestCampaignBtn.innerHTML = originalText;
                sendTestCampaignBtn.disabled = false;
            }
        });
    }

    if (confirmSendCampaignBtn) {
        confirmSendCampaignBtn.addEventListener('click', async () => {
            const subject = document.getElementById('emailSubject').value;
            const message = document.getElementById('emailMessage').value;
            const template = emailTemplateSelect.value;
            const recipientType = document.querySelector('input[name="recipientType"]:checked').value;
            
            if (!subject || !message) {
                showToast('Please enter subject and message.', 'error');
                return;
            }

            // Build Filters
            const filters = {};
            if (recipientType === 'custom') {
                const emailsText = document.getElementById('customRecipientEmails').value;
                if (!emailsText.trim()) {
                    showToast('Please enter at least one recipient email.', 'error');
                    return;
                }
                filters.emails = emailsText.split(/[\n,]+/).map(e => e.trim()).filter(e => e);
            } else {
                filters.userType = document.querySelector('input[name="userTypeFilter"]:checked').value;
                filters.isIdVerified = document.querySelector('input[name="idVerificationFilter"]:checked').value;
                filters.isEmailVerified = document.querySelector('input[name="emailVerificationFilter"]:checked').value;
            }

            showConfirmationModal(
                'Send Email Campaign',
                `Are you sure you want to send this campaign? This action cannot be undone.`,
                async () => {
                    const originalText = confirmSendCampaignBtn.innerHTML;
                    const spinner = document.getElementById('campaignSpinner');
                    if(spinner) spinner.style.display = 'inline-block';
                    confirmSendCampaignBtn.disabled = true;
                    
                    try {
                        const result = await sendEmailCampaign({
                            subject,
                            message,
                            filters,
                            template,
                            dryRun: false
                        });
                        showToast(result.message || 'Campaign started successfully!', 'success');
                        
                        // Optional: Reset form or show progress
                    } catch (error) {
                        showToast(error.message || 'Failed to send campaign.', 'error');
                    } finally {
                        confirmSendCampaignBtn.innerHTML = originalText;
                        confirmSendCampaignBtn.disabled = false;
                        if(spinner) spinner.style.display = 'none';
                    }
                }
            );
        });
    }

    // Initial Load
    setActiveLink('overviewLink');
    showSection('overviewSection');

    // Load stats and populate select filters
    loadDashboardStats();
    populateSelectFilters();
});

/**
 * Populates Category and City filters from the backend and global files
 */
async function populateSelectFilters() {
    const categorySelects = [document.getElementById('freelancerCategoryFilter')];
    const citySelects = [document.getElementById('freelancerCityFilter'), document.getElementById('employerCityFilter')];
    
    // 1. Populate Categories from global file
    if (window.globalCategoriesAndProfessions) {
        window.globalCategoriesAndProfessions.forEach(cat => {
            const catName = cat.name.en; // Use English as primary key for value
            categorySelects.forEach(select => {
                if (select) {
                    const option = document.createElement('option');
                    option.value = catName;
                    option.textContent = cat.name.ar + ' (' + catName + ')';
                    select.appendChild(option);
                }
            });
        });
    }

    // 2. Populate Cities from backend
    try {
        const cityRes = await fetch('/admin/cities');
        const cityData = await cityRes.json();
        
        if (cityData.success) {
            cityData.cities.forEach(city => {
                citySelects.forEach(select => {
                    if (select) {
                        const option = document.createElement('option');
                        option.value = city.name;
                        option.textContent = city.name;
                        select.appendChild(option);
                    }
                });
            });
        }
    } catch (error) {
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.error('Error populating city filters:', error);
        }
    }
}


// Helper debounce function
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}
