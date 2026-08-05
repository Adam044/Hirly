import { state } from './dashboard-state.js';
import { 
    showToast, 
    renderFreelancers, 
    renderEmployers,
    renderAggregatedJobs,
    renderJobSources,
    renderJobs,
    renderReviews,
    renderJobsWithApplications,
    renderDashboardStats
} from './dashboard-ui.js';
import { getStatusBadgeClass, createLoadingSpinner } from './dashboard-utils.js';

// Helper to handle fetch responses and non-JSON errors
const handleFetchResponse = async (response) => {
    const contentType = response.headers.get("content-type");
    if (!contentType || contentType.indexOf("application/json") === -1) {
        const text = await response.text();
        // Only log in development
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.error('Server returned non-JSON response:', text);
        }
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || data.message || `Error ${response.status}`);
    }
    return data;
};

// --- Dashboard Stats ---
export const loadDashboardStats = async () => {
    const container = document.getElementById('dashboardStats');
    if (!container) return;
    
    container.innerHTML = createLoadingSpinner('Loading stats...');
    
    try {
        const response = await fetch(`/admin/dashboard-stats?t=${Date.now()}`);
        const data = await handleFetchResponse(response);
        
        if (data.success) {
            renderDashboardStats(data.stats);
        }
    } catch (error) {
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.error('Error loading stats:', error);
        }
        container.innerHTML = `<p class="text-danger">Error loading stats: ${error.message}</p>`;
    }
};

// --- Freelancers ---
export const loadAllFreelancers = async (search = '', status = 'All', append = false) => {
    const tableBody = document.getElementById('freelancersTableBody');
    if (!tableBody) return;
    
    const p = state.pagination.freelancers;
    if (p.loading) return;
    
    if (!append) {
        p.page = 1;
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-12">${createLoadingSpinner('Searching freelancers...')}</td></tr>`;
    }
    
    p.loading = true;
    const f = state.filters.freelancers;
    
    try {
        const queryParams = new URLSearchParams({
            search: search || f.search,
            status: status || f.status,
            category: f.category,
            city: f.city,
            page: p.page,
            limit: p.limit
        });

        const response = await fetch(`/admin/professionals?${queryParams.toString()}`);
        const data = await handleFetchResponse(response);
        
        if (data.success) {
            renderFreelancers(data.professionals || [], append);
            p.hasMore = data.pagination.hasMore;
            p.page++;
        }
    } catch (error) {
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.error('Error loading freelancers:', error);
        }
        if (!append) tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-danger">Error loading data.</td></tr>';
        showToast('Failed to load freelancers', 'error');
    } finally {
        p.loading = false;
    }
};

// --- Employers ---
export const loadAllEmployers = async (search = '', status = 'All', append = false) => {
    const tableBody = document.getElementById('employersTableBody');
    if (!tableBody) return;
    
    const p = state.pagination.employers;
    if (p.loading) return;
    
    if (!append) {
        p.page = 1;
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-12">${createLoadingSpinner('Searching employers...')}</td></tr>`;
    }
    
    p.loading = true;
    const f = state.filters.employers;
    
    try {
        const queryParams = new URLSearchParams({
            search: search || f.search,
            status: status || f.status,
            type: f.type,
            logo: f.logo,
            city: f.city,
            page: p.page,
            limit: p.limit
        });

        const response = await fetch(`/admin/employers?${queryParams.toString()}`);
        const data = await handleFetchResponse(response);
        
        if (data.success) {
            renderEmployers(data.employers, append);
            p.hasMore = data.pagination.hasMore;
            p.page++;
        }
    } catch (error) {
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.error('Error loading employers:', error);
        }
        if (!append) tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Error loading data.</td></tr>';
        showToast('Failed to load employers', 'error');
    } finally {
        p.loading = false;
    }
};

// --- Jobs ---
export const loadJobs = async (search = '', sectionId = 'jobsSection') => {
    const isJobAlerts = sectionId === 'jobAlertsSection';
    const tableBodyId = isJobAlerts ? 'jobAlertsTableBody' : 'jobsTableBody';
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;
    
    tableBody.innerHTML = `<tr><td colspan="${isJobAlerts ? 6 : 7}" class="text-center py-4">${createLoadingSpinner('Loading jobs...')}</td></tr>`;
    
    try {
        let url = `/admin/jobs?t=${Date.now()}&search=${encodeURIComponent(search)}`;
        
        // Add specific filters for Job Alerts section if applicable
        if (isJobAlerts) {
            const city = document.getElementById('jobFilterCity')?.value || 'all';
            const category = document.getElementById('jobFilterCategory')?.value || 'all';
            const status = document.getElementById('jobFilterSentStatus')?.value || 'all';
            url += `&city=${encodeURIComponent(city)}&category=${encodeURIComponent(category)}&sentStatus=${encodeURIComponent(status)}`;
        }

        const response = await fetch(url);
        const data = await handleFetchResponse(response);
        
        const jobs = Array.isArray(data.jobs) ? data.jobs : [];
        
        if (data.success && jobs.length > 0) {
            // Update global state for job lookups (e.g. for selection)
            if (isJobAlerts) {
                state.allJobsData = jobs;
            }

            renderJobs(jobs, sectionId);
        } else {
            tableBody.innerHTML = `<tr><td colspan="${isJobAlerts ? 6 : 7}" class="text-center py-4 text-gray-400">No jobs found.</td></tr>`;
        }
    } catch (error) {
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.error('Error loading jobs:', error);
        }
        tableBody.innerHTML = `<tr><td colspan="${isJobAlerts ? 6 : 7}" class="text-center py-4 text-danger">Error loading data.</td></tr>`;
    }
};

// --- Reviews ---
export const loadAllReviews = async () => {
    const tableBody = document.getElementById('reviewsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4">${createLoadingSpinner('Loading reviews...')}</td></tr>`;
    
    try {
        const response = await fetch(`/admin/reviews?t=${Date.now()}`);
        const data = await handleFetchResponse(response);
        
        if (data.success) {
             renderReviews(data.reviews || []);
        } else {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-gray-400">No reviews found.</td></tr>';
        }
    } catch (error) {
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.error('Error loading reviews:', error);
        }
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-danger">Error loading data.</td></tr>';
    }
};

// --- Helpers ---

export const fetchCategories = async () => {
    const response = await fetch(`/admin/categories?t=${Date.now()}`);
    return await handleFetchResponse(response);
};

export const fetchCities = async () => {
    const response = await fetch(`/admin/cities?t=${Date.now()}`);
    return await handleFetchResponse(response);
};

export const fetchLoggedInUserEmail = async () => {
    try {
        const response = await fetch('/api/user');
        const data = await handleFetchResponse(response);
        return data.email;
    } catch (error) {
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.error('Error fetching user:', error);
        }
    }
    return 'Admin';
};

// --- Actions ---
export const updateVerificationStatus = async (userId, userType, newStatus, rejectionReason = '') => {
    const response = await fetch('/admin/update-verification-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userType: userType.toLowerCase(), newStatus, rejectionReason })
    });
    return await handleFetchResponse(response);
};

export const sendVerificationEmail = async (email, link) => {
    // Placeholder as this logic usually happens on backend via updateVerificationStatus
};

export const deleteReview = async (reviewId) => {
    const response = await fetch(`/admin/reviews/${reviewId}`, { method: 'DELETE' });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data;
};

export const removeEmployerLogo = async (userId) => {
    const response = await fetch('/admin/remove-company-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employerId: userId })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data;
};

// --- Job Application Notifications ---

export const loadJobsWithApplications = async (search = '', city = 'all', category = 'all', notified = 'all') => {
    const tableBody = document.getElementById('jobAppNotificationsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4">${createLoadingSpinner('Loading jobs...')}</td></tr>`;

    try {
        const queryParams = new URLSearchParams({ search, city, category, notified });
        const response = await fetch(`/admin/jobs-with-applications?${queryParams}`);
        const data = await handleFetchResponse(response);

        if (data.success) {
            renderJobsWithApplications(data.jobs || []);
        }
    } catch (error) {
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.error('Error loading jobs with applications:', error);
        }
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-danger">Error loading data.</td></tr>`;
        showToast('Error loading jobs with applications.', 'error');
    }
};

export const updateJobAppNotificationSelectionUI = () => {
    const count = state.selectedJobAppNotificationIds.size;
    const summaryDiv = document.getElementById('selectedJobsSummary');
    const sendBtn = document.getElementById('sendJobAppNotificationsBtn');
    
    if (summaryDiv) {
        if (count === 0) {
            summaryDiv.innerHTML = '<p>No jobs selected</p>';
        } else {
            summaryDiv.innerHTML = `<p><span class="text-primary font-bold">${count}</span> job(s) selected for notification.</p>`;
        }
    }
    
    if (sendBtn) {
        sendBtn.disabled = count === 0;
        if (count > 0) sendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        else sendBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
};

export const sendJobAppNotifications = async () => {
    const jobIds = Array.from(state.selectedJobAppNotificationIds);
    if (jobIds.length === 0) return;
    
    const sendBtn = document.getElementById('sendJobAppNotificationsBtn');
    const progressDiv = document.getElementById('jobAppNotificationProgress');
    
    if (sendBtn) sendBtn.classList.add('hidden');
    if (progressDiv) progressDiv.classList.remove('hidden');
    
    try {
        const response = await fetch('/admin/send-application-notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobIds })
        });
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || 'Failed to send notifications');
        
        showToast(data.message || 'Notifications sent successfully!', 'success');
        
        // Refresh list
        const search = document.getElementById('jobAppNotificationSearchInput')?.value || '';
        const city = document.getElementById('jobAppNotificationFilterCity')?.value || 'all';
        const category = document.getElementById('jobAppNotificationFilterCategory')?.value || 'all';
        const notified = document.getElementById('jobAppNotificationFilterNotified')?.value || 'all';
        loadJobsWithApplications(search, city, category, notified);
        
        state.selectedJobAppNotificationIds.clear();
        updateJobAppNotificationSelectionUI();
        
    } catch (error) {
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.error('Error sending notifications:', error);
        }
        showToast(error.message || 'Error sending notifications.', 'error');
    } finally {
        if (sendBtn) sendBtn.classList.remove('hidden');
        if (progressDiv) progressDiv.classList.add('hidden');
    }
};

// --- Email Campaigns ---

export const loadEmailTemplate = async (templateId) => {
    try {
        const response = await fetch(`/admin/email-templates/${templateId}?t=${Date.now()}`);
        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error('Failed to load template');
        }
        const data = await handleFetchResponse(response);
        return data.content; // { subject, html }
    } catch (error) {
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.error('Error loading template:', error);
        }
        throw error;
    }
};

export const sendEmailCampaign = async (campaignData) => {
    // campaignData: { subject, message, filters, template, dryRun, testEmail }
    const endpoint = campaignData.testEmail ? '/admin/send-emails-test' : '/admin/send-email-campaign';
    
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData)
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to send campaign');
    return data;
};

export const bulkVerifyFreelancers = async (userIds, status) => {
    const response = await fetch('/admin/bulk-verify-professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds, status })
    });
    return await handleFetchResponse(response);
};

export const bulkVerifyEmployers = async (userIds, status) => {
    const response = await fetch('/admin/bulk-verify-employers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds, status })
    });
    return await handleFetchResponse(response);
};

export const bulkDeleteJobs = async (jobIds) => {
    const response = await fetch('/admin/bulk-remove-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobIds })
    });
    return await handleFetchResponse(response);
};

// --- Aggregated Jobs ---
export const loadAggregatedJobs = async (search = '', logoStatus = 'all', append = false) => {
    const tableBody = document.getElementById('aggregatedJobsTableBody');
    if (!tableBody) return;
    
    const p = state.pagination.aggregatedJobs;
    if (p.loading) return;
    
    if (!append) {
        p.page = 1;
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-12">${createLoadingSpinner('Searching aggregated jobs...')}</td></tr>`;
    }
    
    p.loading = true;
    const f = state.filters.aggregatedJobs;
    
    try {
        const queryParams = new URLSearchParams({
            search: search || f.search,
            logoStatus: logoStatus || f.logoStatus,
            page: p.page,
            limit: p.limit
        });

        const response = await fetch(`/admin/aggregated-jobs?${queryParams.toString()}`);
        const data = await handleFetchResponse(response);
        
        if (data.success) {
            renderAggregatedJobs(data.jobs, append);
            p.hasMore = data.pagination.hasMore;
            p.page++;
        }
    } catch (error) {
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.error('Error loading aggregated jobs:', error);
        }
        if (!append) tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-danger">Error loading data.</td></tr>';
        showToast('Failed to load aggregated jobs', 'error');
    } finally {
        p.loading = false;
    }
};

export const fetchLogoFromUrl = async (url, companyName) => {
    const response = await fetch('/admin/fetch-logo-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, companyName })
    });
    return await handleFetchResponse(response);
};

export const updateAggregatedJobLogo = async (jobId, logoUrl, logoFile) => {
    const formData = new FormData();
    formData.append('jobId', jobId);
    if (logoUrl) formData.append('logoUrl', logoUrl);
    if (logoFile) formData.append('logo', logoFile); // Note: field name is 'logo' as per uploadAdminLogo middleware

    const response = await fetch('/admin/update-aggregated-job-logo', {
        method: 'POST',
        body: formData
    });
    return await handleFetchResponse(response);
};

// --- Job Sources ---
export const loadJobSources = async () => {
    const tableBody = document.getElementById('jobSourcesTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-8">${createLoadingSpinner('Loading sources...')}</td></tr>`;
    
    try {
        const response = await fetch(`/admin/job-sources?t=${Date.now()}`);
        const data = await handleFetchResponse(response);
        
        if (data.success) {
            renderJobSources(data.sources);
        }
    } catch (error) {
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.error('Error loading job sources:', error);
        }
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Error loading sources.</td></tr>';
        showToast('Failed to load job sources', 'error');
    }
};

export const saveJobSource = async (sourceData) => {
    const isEdit = !!sourceData.id;
    const url = isEdit ? `/admin/job-sources/${sourceData.id}` : '/admin/job-sources';
    const method = isEdit ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sourceData)
    });
    return await handleFetchResponse(response);
};

export const deleteJobSource = async (id) => {
    const response = await fetch(`/admin/job-sources/${id}`, { method: 'DELETE' });
    return await handleFetchResponse(response);
};

export const triggerSourceScan = async (id) => {
    const response = await fetch(`/admin/trigger-source-scan/${id}`, { method: 'POST' });
    return await handleFetchResponse(response);
};
