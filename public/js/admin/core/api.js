/**
 * Dashboard API Layer
 * Pure data fetching functions. No UI logic or rendering.
 */

const handleFetchResponse = async (response) => {
    const contentType = response.headers.get("content-type");
    if (!contentType || contentType.indexOf("application/json") === -1) {
        const text = await response.text();
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.error('Server returned non-JSON response:', text);
        }
        throw new Error(`Server error: ${response.status}`);
    }
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || data.message || `Error ${response.status}`);
    }
    return data;
};

// --- Platform Stats ---
export const getDashboardStats = async (range = '30D') => {
    const response = await fetch(`/admin/dashboard-stats?range=${range}&t=${Date.now()}`);
    return await handleFetchResponse(response);
};

// --- Professionals / Freelancers ---
export const getProfessionals = async (params) => {
    const query = new URLSearchParams(params);
    const response = await fetch(`/admin/professionals?${query.toString()}`);
    return await handleFetchResponse(response);
};

export const bulkVerifyProfessionals = async (userIds, status) => {
    const response = await fetch('/admin/bulk-verify-professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds, status })
    });
    return await handleFetchResponse(response);
};

// --- Employers / Companies ---
export const getEmployers = async (params) => {
    const query = new URLSearchParams(params);
    const response = await fetch(`/admin/employers?${query.toString()}`);
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

export const removeCompanyLogo = async (employerId) => {
    const response = await fetch('/admin/remove-company-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employerId })
    });
    return await handleFetchResponse(response);
};

// --- Jobs (Unified & Aggregated) ---
export const getJobs = async (params) => {
    const query = new URLSearchParams({ ...params, t: Date.now() });
    const response = await fetch(`/admin/jobs?${query.toString()}`);
    return await handleFetchResponse(response);
};

export const getAggregatedJobs = async (params) => {
    const query = new URLSearchParams(params);
    const response = await fetch(`/admin/aggregated-jobs?${query.toString()}`);
    return await handleFetchResponse(response);
};

export const magicFetchLogo = async (jobId) => {
    const response = await fetch('/admin/magic-fetch-aggregated-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
    });
    return await handleFetchResponse(response);
};

export const fetchLogoFromUrl = async (companyName, url) => {
    const response = await fetch('/admin/fetch-logo-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, url })
    });
    return await handleFetchResponse(response);
};

export const deleteAggregatedJob = async (jobId) => {
    const response = await fetch('/admin/delete-aggregated-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
    });
    return await handleFetchResponse(response);
};

export const updateAggregatedJobLogo = async (formData) => {
    const response = await fetch('/admin/update-aggregated-job-logo', {
        method: 'POST',
        body: formData
    });
    return await handleFetchResponse(response);
};

export const bulkMagicFetchLogos = async (options = {}) => {
    const response = await fetch('/admin/bulk-magic-fetch-logos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
    });
    return await handleFetchResponse(response);
};

export const getBulkLogoProgress = async () => {
    const response = await fetch('/admin/bulk-logo-progress');
    return await handleFetchResponse(response);
};

export const stopBulkLogoFetch = async () => {
    const response = await fetch('/admin/stop-bulk-logo-fetch', { method: 'POST' });
    return await handleFetchResponse(response);
};

export const bulkRemoveJobs = async (jobIds) => {
    const response = await fetch('/admin/bulk-remove-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobIds })
    });
    return await handleFetchResponse(response);
};

// --- Intelligence / Sources ---
export const getJobSources = async () => {
    const response = await fetch(`/admin/job-sources?t=${Date.now()}`);
    return await handleFetchResponse(response);
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

// --- Outreach Leads ---
export const getOutreachLeads = async (params) => {
    const query = new URLSearchParams({ ...params, t: Date.now() });
    const response = await fetch(`/admin/outreach-leads?${query.toString()}`);
    return await handleFetchResponse(response);
};

export const sendOutreach = async (jobId, testEmail = null, language = 'en') => {
    const response = await fetch('/admin/send-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, testEmail, language })
    });
    return await handleFetchResponse(response);
};

export const updateOutreachEmail = async (jobId, email) => {
    const response = await fetch('/admin/update-outreach-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, email })
    });
    return await handleFetchResponse(response);
};

// --- Reviews ---
export const getReviews = async () => {
    const response = await fetch(`/admin/reviews?t=${Date.now()}`);
    return await handleFetchResponse(response);
};

export const deleteReview = async (reviewId) => {
    const response = await fetch(`/admin/reviews/${reviewId}`, { method: 'DELETE' });
    return await handleFetchResponse(response);
};

// --- Notifications ---
export const getJobsWithApplications = async () => {
    const response = await fetch(`/admin/jobs-with-applications?t=${Date.now()}`);
    return await handleFetchResponse(response);
};

export const sendJobAppNotifications = async (jobIds) => {
    const response = await fetch('/admin/send-job-app-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobIds })
    });
    return await handleFetchResponse(response);
};

// --- Campaigns ---
export const getCampaignRecipients = async (filters) => {
    const response = await fetch('/admin/get-campaign-recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters })
    });
    return await handleFetchResponse(response);
};

export const sendEmailCampaign = async (campaignData) => {
    const response = await fetch('/admin/send-email-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData)
    });
    return await handleFetchResponse(response);
};

export const getCampaignProgress = async (campaignId) => {
    const response = await fetch(`/admin/email-campaign-progress/${campaignId}?t=${Date.now()}`);
    return await handleFetchResponse(response);
};

// --- Balancer / System ---
export const getEmailStats = async () => {
    const response = await fetch(`/admin/dashboard-stats?t=${Date.now()}`);
    return await handleFetchResponse(response);
};

// --- Common Data ---
export const getCategories = async () => {
    const response = await fetch(`/admin/categories?t=${Date.now()}`);
    return await handleFetchResponse(response);
};

export const getCities = async () => {
    const response = await fetch(`/admin/cities?t=${Date.now()}`);
    return await handleFetchResponse(response);
};

export const getLoggedInUser = async () => {
    const response = await fetch('/api/user');
    return await handleFetchResponse(response);
};
