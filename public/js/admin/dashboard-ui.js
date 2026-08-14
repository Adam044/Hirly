// Dashboard UI Helper Functions
// Handles DOM manipulation, Modals, Toasts, and Rendering

import { state } from './dashboard-state.js';
import { 
    loadDashboardStats, 
    loadAllFreelancers, 
    loadAllEmployers, 
    loadJobs, 
    loadAllReviews, 
    fetchLoggedInUserEmail, 
    loadJobsWithApplications,
    loadEmailTemplate,
    loadAggregatedJobs,
    loadJobSources,
    loadOutreachLeads,
    sendOutreach
} from './dashboard-api.js';
import { getStatusBadgeClass, createLoadingSpinner } from './dashboard-utils.js';

export const renderFreelancers = (freelancers = [], append = false) => {
    const tableBody = document.getElementById('freelancersTableBody');
    const loadMoreContainer = document.getElementById('freelancerLoadMoreContainer');
    if (!tableBody) return;

    if (!append) tableBody.innerHTML = '';

    const list = Array.isArray(freelancers) ? freelancers : [];

    if (list.length === 0 && !append) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500"><i class="fas fa-user-slash text-4xl mb-3 block opacity-20"></i>No professionals found matching your criteria.</td></tr>';
        if (loadMoreContainer) loadMoreContainer.classList.add('hidden');
        return;
    }

    const html = list.map(f => `
        <tr class="border-b border-slate-700/50 hover:bg-slate-700/30 transition-all group">
            <td class="py-4 px-4 text-center">
                <input type="checkbox" class="freelancer-checkbox h-4 w-4 text-primary bg-slate-800 border-slate-700 rounded focus:ring-primary transition-all cursor-pointer" 
                    data-id="${f.id}" ${state.selectedFreelancers.has(f.id.toString()) ? 'checked' : ''}>
            </td>
            <td class="py-4 px-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-primary border border-slate-700 font-bold overflow-hidden shadow-sm">
                        ${f.profile_picture_url ? `<img src="${f.profile_picture_url}" class="w-full h-full object-cover">` : (f.first_name || 'H').charAt(0)}
                    </div>
                    <div>
                        <p class="text-sm font-semibold text-white group-hover:text-primary transition-colors">${f.first_name} ${f.last_name}</p>
                        <p class="text-[10px] text-gray-500 font-medium">#${f.id} • ${f.city || 'No City'}</p>
                    </div>
                </div>
            </td>
            <td class="py-4 px-4">
                <div class="flex flex-col gap-0.5">
                    <p class="text-sm text-gray-300 font-medium">${f.email}</p>
                    <p class="text-[10px] text-gray-500">${f.phone || 'No phone'}</p>
                </div>
            </td>
            <td class="py-4 px-4">
                <span class="text-xs font-semibold text-indigo-400 bg-indigo-400/10 px-2.5 py-1 rounded-md border border-indigo-400/20 inline-block w-fit">
                    ${f.profession || 'N/A'}
                </span>
            </td>
            <td class="py-4 px-4">
                <span class="${getStatusBadgeClass(f.current_status || 'freelancer')} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border">
                    ${f.current_status || 'freelancer'}
                </span>
            </td>
            <td class="py-4 px-4 text-right">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="btn-icon btn-primary" title="View Profile" onclick="window.open('${f.slug ? `/${f.slug}` : `/profile.html?id=${f.id}`}', '_blank')">
                        <i class="fas fa-external-link-alt"></i>
                    </button>
                    <button class="btn-icon btn-warning edit-user-btn" data-id="${f.id}" data-type="freelancer" title="Edit Info">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger delete-user-btn" data-id="${f.id}" data-type="freelancer" title="Delete User">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    if (append) {
        tableBody.insertAdjacentHTML('beforeend', html);
    } else {
        tableBody.innerHTML = html;
    }

    // Update Load More visibility
    if (loadMoreContainer) {
        if (state.pagination.freelancers.hasMore) {
            loadMoreContainer.classList.remove('hidden');
        } else {
            loadMoreContainer.classList.add('hidden');
        }
    }
};

export const renderEmployers = (employers = [], append = false) => {
    const tableBody = document.getElementById('employersTableBody');
    const loadMoreContainer = document.getElementById('employerLoadMoreContainer');
    if (!tableBody) return;

    if (!append) tableBody.innerHTML = '';

    const list = Array.isArray(employers) ? employers : [];

    if (list.length === 0 && !append) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-500"><i class="fas fa-building-circle-exclamation text-4xl mb-3 block opacity-20"></i>No employers found matching your criteria.</td></tr>';
        if (loadMoreContainer) loadMoreContainer.classList.add('hidden');
        return;
    }

    const html = list.map(e => `
        <tr class="border-b border-slate-700/50 hover:bg-slate-700/30 transition-all group">
            <td class="py-4 px-4 text-center">
                <input type="checkbox" class="employer-checkbox h-4 w-4 text-primary bg-slate-800 border-slate-700 rounded focus:ring-primary transition-all cursor-pointer" 
                    data-id="${e.id}" ${state.selectedEmployers.has(e.id.toString()) ? 'checked' : ''}>
            </td>
            <td class="py-4 px-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-primary border border-slate-700 font-bold overflow-hidden">
                        ${e.company_logo_path && e.company_logo_path !== 'N/A' ? `<img src="${e.company_logo_path}" class="w-full h-full object-cover">` : `<i class="fas fa-building text-lg"></i>`}
                    </div>
                    <div>
                        <p class="text-sm font-semibold text-white group-hover:text-primary transition-colors">${e.company_name || `${e.first_name} ${e.last_name}`}</p>
                        <p class="text-[10px] text-gray-500 font-medium">#${e.id} • ${e.employer_type || 'individual'}</p>
                    </div>
                </div>
            </td>
            <td class="py-4 px-4">
                <div class="flex flex-col gap-0.5">
                    <p class="text-sm text-gray-300 font-medium">${e.email}</p>
                    <p class="text-[10px] text-gray-500">${e.city || 'No City'}</p>
                </div>
            </td>
            <td class="py-4 px-4">
                <span class="${getStatusBadgeClass(e.verification_status)} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border">
                    ${e.verification_status}
                </span>
            </td>
            <td class="py-4 px-4 text-right">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="btn-icon btn-primary" title="View Profile" onclick="window.open('${e.slug ? `/${e.slug}` : `/employer_profile.html?id=${e.id}`}', '_blank')">
                        <i class="fas fa-external-link-alt"></i>
                    </button>
                    <button class="btn-icon btn-warning edit-user-btn" data-id="${e.id}" data-type="employer" title="Edit Info">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger delete-user-btn" data-id="${e.id}" data-type="employer" title="Delete User">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    if (append) {
        tableBody.insertAdjacentHTML('beforeend', html);
    } else {
        tableBody.innerHTML = html;
    }

    if (loadMoreContainer) {
        if (state.pagination.employers.hasMore) {
            loadMoreContainer.classList.remove('hidden');
        } else {
            loadMoreContainer.classList.add('hidden');
        }
    }
};

export const renderAggregatedJobs = (jobs, append = false) => {
    const tableBody = document.getElementById('aggregatedJobsTableBody');
    const loadMoreContainer = document.getElementById('aggregatedJobLoadMoreContainer');
    if (!tableBody) return;

    if (!append) tableBody.innerHTML = '';

    if (jobs.length === 0 && !append) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-500"><i class="fas fa-database text-4xl mb-3 block opacity-20"></i>No aggregated jobs found.</td></tr>';
        if (loadMoreContainer) loadMoreContainer.classList.add('hidden');
        return;
    }

    const html = jobs.map(j => `
        <tr class="border-b border-slate-700/50 hover:bg-slate-700/30 transition-all group">
            <td class="py-4 px-4">
                <div class="flex flex-col">
                    <p class="text-sm font-semibold text-white group-hover:text-primary transition-colors">${j.title}</p>
                    <p class="text-[10px] text-gray-500 font-medium">${j.external_company_name || 'Unknown Company'}</p>
                </div>
            </td>
            <td class="py-4 px-4">
                <div class="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden shadow-sm">
                    ${j.external_company_logo ? 
                        `<img src="${j.external_company_logo}" class="w-full h-full object-contain p-1" onerror="this.src='https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=professional+company+logo+placeholder&image_size=square'">` : 
                        `<i class="fas fa-briefcase text-gray-600"></i>`}
                </div>
            </td>
            <td class="py-4 px-4">
                <div class="flex flex-col">
                    <p class="text-xs text-gray-300 font-medium">${j.country || 'N/A'}</p>
                    <p class="text-[10px] text-gray-500">${j.city || 'N/A'}</p>
                </div>
            </td>
            <td class="py-4 px-4">
                <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded border border-slate-700">
                    ${j.external_source || 'Unknown'}
                </span>
            </td>
            <td class="py-4 px-4 text-right">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="btn-icon bg-primary/10 text-primary hover:bg-primary hover:text-white auto-fetch-logo-btn" 
                        data-id="${j.id}" 
                        data-company="${j.external_company_name}"
                        title="Auto-Fetch Logo">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button class="btn-icon btn-secondary edit-aggregated-logo-btn" 
                        data-id="${j.id}" 
                        data-company="${j.external_company_name}"
                        data-logo="${j.external_company_logo || ''}"
                        data-apply-url="${j.external_apply_url || ''}"
                        title="Update Logo">
                        <i class="fas fa-image"></i>
                    </button>
                    <button class="btn-icon btn-secondary" title="View Original" onclick="window.open('${j.external_apply_url}', '_blank')">
                        <i class="fas fa-external-link-alt"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    if (append) {
        tableBody.insertAdjacentHTML('beforeend', html);
    } else {
        tableBody.innerHTML = html;
    }

    if (loadMoreContainer) {
        if (state.pagination.aggregatedJobs.hasMore) {
            loadMoreContainer.classList.remove('hidden');
        } else {
            loadMoreContainer.classList.add('hidden');
        }
    }
};

export const renderJobSources = (sources) => {
    const tableBody = document.getElementById('jobSourcesTableBody');
    if (!tableBody) return;

    if (sources.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-500"><i class="fas fa-server text-4xl mb-3 block opacity-20"></i>No intelligence sources found.</td></tr>';
        return;
    }

    tableBody.innerHTML = sources.map(s => `
        <tr class="border-b border-slate-700/50 hover:bg-slate-700/30 transition-all group">
            <td class="py-4 px-4">
                <div class="flex flex-col">
                    <p class="text-sm font-semibold text-white group-hover:text-primary transition-colors">${s.name}</p>
                    <p class="text-[10px] text-gray-500 font-medium">Priority: ${s.priority || 100}</p>
                </div>
            </td>
            <td class="py-4 px-4">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded border border-slate-700">
                    ${s.type}
                </span>
            </td>
            <td class="py-4 px-4">
                <div class="flex items-center gap-2">
                    <span class="text-lg">${s.country_code === 'PS' ? '🇵🇸' : s.country_code === 'AE' ? '🇦🇪' : '🌍'}</span>
                    <span class="text-xs text-gray-300">${s.country_code || 'Global'}</span>
                </div>
            </td>
            <td class="py-4 px-4">
                <div class="text-xs text-gray-400 truncate max-w-[200px]" title="${s.base_url || ''}">
                    ${s.base_url || 'N/A'}
                </div>
            </td>
            <td class="py-4 px-4">
                <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full ${s.active ? 'bg-success' : 'bg-gray-600'}"></div>
                    <span class="text-xs ${s.active ? 'text-success' : 'text-gray-500'}">${s.active ? 'Active' : 'Inactive'}</span>
                </div>
            </td>
            <td class="py-4 px-4">
                <div class="text-[10px] text-gray-500">
                    ${s.last_sync ? new Date(s.last_sync).toLocaleString() : 'Never Scanned'}
                </div>
            </td>
            <td class="py-4 px-4 text-right">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="btn-icon btn-primary trigger-source-scan-btn" data-id="${s.id}" title="Scan Now">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button class="btn-icon btn-warning edit-source-btn" 
                        data-id="${s.id}" 
                        data-name="${s.name}"
                        data-type="${s.type}"
                        data-country="${s.country_code || ''}"
                        data-url="${s.base_url || ''}"
                        data-active="${s.active}"
                        data-priority="${s.priority}"
                        data-config='${JSON.stringify(s.config || {})}'
                        title="Edit Source">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger delete-source-btn" data-id="${s.id}" title="Delete Source">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
};

export const renderJobs = (jobs = [], sectionId = 'jobsSection') => {
    const isJobAlerts = sectionId === 'jobAlertsSection';
    const tableBodyId = isJobAlerts ? 'jobAlertsTableBody' : 'jobsTableBody';
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;

    if (jobs.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="${isJobAlerts ? 6 : 7}" class="text-center py-4 text-gray-400">No jobs found.</td></tr>`;
        return;
    }

    if (isJobAlerts) {
        tableBody.innerHTML = jobs.map(j => {
            const isSelected = state.selectedJobs.has(j.id);
            return `
                <tr class="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                    <td class="py-3 px-4 text-center">
                        <input type="checkbox" class="job-alert-checkbox h-4 w-4 text-primary bg-slate-700 border-slate-600 rounded focus:ring-primary" 
                            value="${j.id || ''}" ${isSelected ? 'checked' : ''}>
                    </td>
                    <td class="py-3 px-4 text-sm text-white font-medium">${j.title || 'Untitled Job'}</td>
                    <td class="py-3 px-4 text-sm text-gray-300">
                    <a href="${j.employer_slug ? `/${j.employer_slug}` : `/employer_profile.html?id=${j.employer_id}`}" target="_blank" class="hover:text-primary transition-colors">
                        ${j.employer_company_name || `${j.employer_first_name || ''} ${j.employer_last_name || ''}`.trim() || 'Not Specified'}
                    </a>
                </td>
                    <td class="py-3 px-4 text-sm text-gray-300">${j.category || 'N/A'}</td>
                    <td class="py-3 px-4 text-sm text-gray-300">${j.city || 'N/A'}</td>
                    <td class="py-3 px-4 text-sm text-center">
                        ${j.last_alert_sent_at 
                            ? `<span class="text-green-400 text-xs"><i class="fas fa-check"></i> ${new Date(j.last_alert_sent_at).toLocaleDateString()}</span>` 
                            : '<span class="text-gray-500 text-xs">Never Sent</span>'}
                    </td>
                </tr>
            `}).join('');
    } else {
        tableBody.innerHTML = jobs.map(j => `
            <tr class="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                <td class="py-3 px-4 text-center">
                    <input type="checkbox" class="job-checkbox h-4 w-4 text-primary bg-slate-800 border-slate-700 rounded focus:ring-primary" data-id="${j.id}" ${state.selectedJobsList.has(j.id) ? 'checked' : ''}>
                </td>
                <td class="py-3 px-4 text-sm text-gray-300">#${j.id || 'N/A'}</td>
                <td class="py-3 px-4 text-sm text-white font-medium">${j.title || 'Untitled Job'}</td>
                <td class="py-3 px-4 text-sm text-gray-300">
                    <a href="${j.employer_slug ? `/${j.employer_slug}` : `/employer_profile.html?id=${j.employer_id}`}" target="_blank" class="hover:text-primary transition-colors">
                        ${j.employer_company_name || `${j.employer_first_name || ''} ${j.employer_last_name || ''}`.trim() || 'Not Specified'}
                    </a>
                </td>
                <td class="py-3 px-4 text-sm">
                    <span class="${getStatusBadgeClass(j.status === 'open' ? 'verified' : 'pending')} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border">
                        ${j.status || 'unknown'}
                    </span>
                </td>
                <td class="py-3 px-4 text-sm text-gray-400">${j.created_at ? new Date(j.created_at).toLocaleDateString() : 'N/A'}</td>
                <td class="py-3 px-4 text-sm">
                    <button class="btn-icon btn-danger delete-job-btn" data-job-id="${j.id}" title="Delete Job">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
};

export const renderReviews = (reviews = []) => {
    const tableBody = document.getElementById('reviewsTableBody');
    if (!tableBody) return;

    if (reviews.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-gray-400">No reviews found.</td></tr>';
        return;
    }

    tableBody.innerHTML = reviews.map(r => `
        <tr class="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
            <td class="py-3 px-4 text-sm text-gray-300">#${r.id || 'N/A'}</td>
            <td class="py-3 px-4 text-sm text-white font-medium">${r.job_title || 'N/A'}</td>
            <td class="py-3 px-4 text-sm text-gray-300">${r.reviewer_name || 'Anonymous'}</td>
            <td class="py-3 px-4 text-sm text-gray-300">${r.reviewee_name || 'Anonymous'}</td>
            <td class="py-3 px-4 text-sm text-warning font-bold">${r.rating || '0'} <i class="fas fa-star text-xs"></i></td>
            <td class="py-3 px-4 text-sm text-gray-400 italic truncate max-w-xs" title="${r.comment || ''}">${r.comment || 'No comment'}</td>
            <td class="py-3 px-4 text-sm text-gray-400">${r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A'}</td>
            <td class="py-3 px-4 text-sm">
                <button class="btn-icon btn-danger delete-review-btn" data-review-id="${r.id}" title="Delete Review">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
};

export const renderJobsWithApplications = (jobs = []) => {
    const tableBody = document.getElementById('jobAppNotificationTableBody');
    if (!tableBody) return;

    if (jobs.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-400">No jobs found matching filters.</td></tr>`;
        return;
    }

    tableBody.innerHTML = jobs.map(job => {
        const isSelected = state.selectedJobAppNotificationIds.has(job.id);
        const notifStatus = job.last_notification_sent_at 
            ? `<div class="text-xs text-green-400 mt-1"><i class="fas fa-check-circle"></i> Sent: ${new Date(job.last_notification_sent_at).toLocaleDateString()}</div>`
            : `<div class="text-xs text-gray-500 mt-1">Not notified yet</div>`;

        return `
            <tr class="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                <td class="py-3 px-4 border-b border-slate-700">
                    <div class="flex items-center justify-center">
                        <input type="checkbox" class="job-app-notif-checkbox h-5 w-5 text-primary bg-slate-700 border-slate-600 rounded focus:ring-primary" 
                            value="${job.id || ''}" ${isSelected ? 'checked' : ''}>
                    </div>
                </td>
                <td class="py-3 px-4 border-b border-slate-700">
                    <div class="font-bold text-white">${job.title || 'Untitled Job'}</div>
                    <div class="text-sm text-gray-400">
                        <a href="${job.employer_slug ? `/${job.employer_slug}` : `/employer_profile.html?id=${job.employer_id}`}" target="_blank" class="hover:text-primary transition-colors">
                            ${job.employer_company_name || `${job.employer_first_name || ''} ${job.employer_last_name || ''}`.trim() || 'Not Specified'}
                        </a>
                    </div>
                </td>
                <td class="py-3 px-4 border-b border-slate-700 text-gray-300">
                    <div>${job.city || 'N/A'}</div>
                    <div class="text-xs text-gray-500">${job.category || 'N/A'}</div>
                </td>
                <td class="py-3 px-4 border-b border-slate-700 text-center">
                    <span class="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border">${job.application_count || 0} Apps</span>
                    ${notifStatus}
                </td>
            </tr>
        `;
    }).join('');
};

export const renderDashboardStats = (stats) => {
    const container = document.getElementById('dashboardStats');
    if (!container) return;

    container.innerHTML = `
        <div class="stat-card bg-card-bg p-6 rounded-xl shadow-md border-l-4 border-primary flex items-center gap-4">
            <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xl">
                <i class="fas fa-users"></i>
            </div>
            <div>
                <div class="text-gray-400 text-xs font-medium uppercase mb-1">Total Users</div>
                <div class="text-3xl font-bold text-white">${stats.totalUsers || 0}</div>
            </div>
        </div>
        <div class="stat-card bg-card-bg p-6 rounded-xl shadow-md border-l-4 border-secondary flex items-center gap-4">
            <div class="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-secondary text-xl">
                <i class="fas fa-user-tie"></i>
            </div>
            <div>
                <div class="text-gray-400 text-xs font-medium uppercase mb-1">Professionals</div>
                <div class="text-3xl font-bold text-white">${stats.totalProfessionals || 0}</div>
            </div>
        </div>
        <div class="stat-card bg-card-bg p-6 rounded-xl shadow-md border-l-4 border-accent flex items-center gap-4">
            <div class="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent text-xl">
                <i class="fas fa-building"></i>
            </div>
            <div>
                <div class="text-gray-400 text-xs font-medium uppercase mb-1">Companies</div>
                <div class="text-3xl font-bold text-white">${stats.companyEmployers || 0}</div>
            </div>
        </div>
        <div class="stat-card bg-card-bg p-6 rounded-xl shadow-md border-l-4 border-indigo-500 flex items-center gap-4">
            <div class="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 text-xl">
                <i class="fas fa-user"></i>
            </div>
            <div>
                <div class="text-gray-400 text-xs font-medium uppercase mb-1">Individual Employers</div>
                <div class="text-3xl font-bold text-white">${stats.individualEmployers || 0}</div>
            </div>
        </div>
        <div class="stat-card bg-card-bg p-6 rounded-xl shadow-md border-l-4 border-info flex items-center gap-4">
            <div class="w-12 h-12 bg-info/10 rounded-full flex items-center justify-center text-info text-xl">
                <i class="fas fa-briefcase"></i>
            </div>
            <div>
                <div class="text-gray-400 text-xs font-medium uppercase mb-1">Total Jobs</div>
                <div class="text-3xl font-bold text-white">${stats.totalJobs || 0}</div>
            </div>
        </div>
         <div class="stat-card bg-card-bg p-6 rounded-xl shadow-md border-l-4 border-success flex items-center gap-4">
            <div class="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center text-success text-xl">
                <i class="fas fa-check-circle"></i>
            </div>
            <div>
                <div class="text-gray-400 text-xs font-medium uppercase mb-1">Open Jobs</div>
                <div class="text-3xl font-bold text-white">${stats.openJobs || 0}</div>
            </div>
        </div>
        <div class="stat-card bg-card-bg p-6 rounded-xl shadow-md border-l-4 border-warning flex items-center gap-4">
            <div class="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center text-warning text-xl">
                <i class="fas fa-file-invoice"></i>
            </div>
            <div>
                <div class="text-gray-400 text-xs font-medium uppercase mb-1">Pending Apps</div>
                <div class="text-3xl font-bold text-white">${stats.pendingApplications || 0}</div>
            </div>
        </div>
         <div class="stat-card bg-card-bg p-6 rounded-xl shadow-md border-l-4 border-danger flex items-center gap-4">
            <div class="w-12 h-12 bg-danger/10 rounded-full flex items-center justify-center text-danger text-xl">
                <i class="fas fa-user-shield"></i>
            </div>
            <div>
                <div class="text-gray-400 text-xs font-medium uppercase mb-1">Verifications</div>
                <div class="text-3xl font-bold text-white">${stats.pendingVerifications || 0}</div>
            </div>
        </div>

        <!-- Email Load Balancer Stats (Integrated) -->
        <div class="stat-card bg-card-bg p-6 rounded-xl shadow-md border-l-4 border-primary flex items-center gap-4">
            <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xl">
                <i class="fas fa-envelope"></i>
            </div>
            <div class="flex-grow">
                <div class="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Emails (Primary)</div>
                <div class="flex items-center justify-between">
                    <div class="text-2xl font-bold text-white">${stats.emailStats?.sender1?.count || 0}</div>
                    <div class="text-[10px] text-gray-500 font-bold">/ 500</div>
                </div>
                <div class="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div class="h-full bg-primary" style="width: ${Math.min(((stats.emailStats?.sender1?.count || 0) / 500) * 100, 100)}%"></div>
                </div>
            </div>
        </div>

        <div class="stat-card bg-card-bg p-6 rounded-xl shadow-md border-l-4 border-indigo-500 flex items-center gap-4">
            <div class="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 text-xl">
                <i class="fas fa-robot"></i>
            </div>
            <div class="flex-grow">
                <div class="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Emails (Auto)</div>
                <div class="flex items-center justify-between">
                    <div class="text-2xl font-bold text-white">${stats.emailStats?.sender2?.count || 0}</div>
                    <div class="text-[10px] text-gray-500 font-bold">/ 500</div>
                </div>
                <div class="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div class="h-full bg-indigo-500" style="width: ${Math.min(((stats.emailStats?.sender2?.count || 0) / 500) * 100, 100)}%"></div>
                </div>
            </div>
        </div>
    `;

    // --- Update Secondary Email Load Balancer Section (If it exists) ---
    if (stats.emailStats) {
        const s1 = stats.emailStats.sender1;
        const s2 = stats.emailStats.sender2;

        const s1Email = document.getElementById('sender1Email');
        const s1Count = document.getElementById('sender1Count');
        const s1Progress = document.getElementById('sender1Progress');
        const s1Percent = document.getElementById('sender1Percent');

        if (s1Email) s1Email.textContent = s1.email || 'N/A';
        if (s1Count) s1Count.textContent = s1.count || 0;
        if (s1Progress) s1Progress.style.width = Math.min((s1.count / 500) * 100, 100) + '%';
        if (s1Percent) s1Percent.textContent = Math.floor(Math.min((s1.count / 500) * 100, 100));

        const s2Email = document.getElementById('sender2Email');
        const s2Count = document.getElementById('sender2Count');
        const s2Progress = document.getElementById('sender2Progress');
        const s2Percent = document.getElementById('sender2Percent');

        if (s2Email) s2Email.textContent = s2.email || 'N/A';
        if (s2Count) s2Count.textContent = s2.count || 0;
        if (s2Progress) s2Progress.style.width = Math.min((s2.count / 500) * 100, 100) + '%';
        if (s2Percent) s2Percent.textContent = Math.floor(Math.min((s2.count / 500) * 100, 100));
    }
};

export const renderOutreachLeads = (leads = []) => {
    const tableBody = document.getElementById('outreachLeadsTableBody');
    if (!tableBody) return;

    // Filter Logic using state
    const searchTerm = state.filters.outreach.search.toLowerCase();
    const statusFilter = state.filters.outreach.status;
    const minApps = state.filters.outreach.minApplicants;

    const filteredLeads = leads.filter(l => {
        const matchesSearch = !searchTerm || 
                            l.title.toLowerCase().includes(searchTerm) || 
                            (l.external_company_name && l.external_company_name.toLowerCase().includes(searchTerm)) ||
                            (l.external_company_email && l.external_company_email.toLowerCase().includes(searchTerm));
        
        const matchesStatus = statusFilter === 'all' || 
                            (statusFilter === 'pending' && !l.auto_outreach_sent) ||
                            (statusFilter === 'sent' && l.auto_outreach_sent);
        
        const matchesApps = parseInt(l.applicant_count) >= minApps;

        return matchesSearch && matchesStatus && matchesApps;
    });

    if (filteredLeads.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-12 text-gray-500"><i class="fas fa-filter text-4xl mb-3 block opacity-20"></i>No leads match your current filters.</td></tr>';
        return;
    }

    tableBody.innerHTML = filteredLeads.map(l => {
        const selectedLang = state.leadLanguages.get(l.id.toString()) || 'en';
        
        return `
        <tr class="border-b border-slate-700/50 hover:bg-slate-700/30 transition-all group">
            <td class="py-4 px-6">
                <div class="flex flex-col">
                    <p class="text-sm font-semibold text-white group-hover:text-primary transition-colors">${l.title}</p>
                    <p class="text-[10px] text-gray-500 font-medium">Job #${l.id}</p>
                </div>
            </td>
            <td class="py-4 px-6">
                <div class="flex flex-col">
                    <p class="text-sm text-gray-300 font-medium">${l.external_company_name || 'Unknown'}</p>
                    <p class="text-[10px] text-primary font-bold">${l.external_company_email}</p>
                </div>
            </td>
            <td class="py-4 px-6">
                <span class="${l.auto_outreach_sent ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border">
                    ${l.auto_outreach_sent ? 'Sent' : 'Pending'}
                </span>
            </td>
            <td class="py-4 px-6">
                <div class="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700 w-fit">
                    <button class="px-2 py-1 text-[10px] font-bold rounded-md transition-all lang-toggle-btn ${selectedLang === 'en' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}" 
                        data-id="${l.id}" data-lang="en">EN</button>
                    <button class="px-2 py-1 text-[10px] font-bold rounded-md transition-all lang-toggle-btn ${selectedLang === 'ar' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}" 
                        data-id="${l.id}" data-lang="ar">AR</button>
                </div>
            </td>
            <td class="py-4 px-6">
                <div class="flex flex-col gap-1">
                    <span class="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit">
                        ${l.applicant_count} Applicants
                    </span>
                    ${l.high_match_count > 0 ? `
                        <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit">
                            <i class="fas fa-check-circle mr-1"></i> ${l.high_match_count} High-Match
                        </span>
                    ` : ''}
                </div>
            </td>
            <td class="py-4 px-6">
                <div class="flex flex-col">
                    <p class="text-xs text-gray-400">${new Date(l.deadline).toLocaleDateString()}</p>
                    <p class="text-[10px] text-danger font-semibold italic">Expired</p>
                </div>
            </td>
            <td class="py-4 px-6 text-right">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="btn-icon btn-info send-outreach-self-btn" data-id="${l.id}" title="Send to Self (Test)">
                        <i class="fas fa-vial"></i>
                    </button>
                    <button class="btn-icon ${l.auto_outreach_sent ? 'btn-secondary' : 'btn-primary'} send-outreach-employer-btn" data-id="${l.id}" title="${l.auto_outreach_sent ? 'Resend to Employer' : 'Send to Employer'}">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </td>
        </tr>
    `; }).join('');

    // Attach Language Toggle Listeners
    tableBody.querySelectorAll('.lang-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const jobId = btn.dataset.id;
            const lang = btn.dataset.lang;
            state.leadLanguages.set(jobId.toString(), lang);
            renderOutreachLeads(state.allOutreachLeads);
        });
    });

    // Attach Listeners
    tableBody.querySelectorAll('.send-outreach-self-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const jobId = btn.dataset.id;
            const language = state.leadLanguages.get(jobId.toString()) || 'en';
            const testEmail = prompt("Enter test email (leave blank for yours):");
            if (testEmail === null) return;

            btn.disabled = true;
            const icon = btn.querySelector('i');
            icon.className = 'fas fa-spinner fa-spin';

            try {
                const res = await sendOutreach(jobId, testEmail || 'self', language);
                showToast(`Test email (${language.toUpperCase()}) sent to ${res.recipient}`, 'success');
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                btn.disabled = false;
                icon.className = 'fas fa-vial';
            }
        });
    });

    tableBody.querySelectorAll('.send-outreach-employer-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const jobId = btn.dataset.id;
            const language = state.leadLanguages.get(jobId.toString()) || 'en';
            showConfirmationModal(
                'Confirm Outreach',
                `Are you sure you want to send the outreach email in <b>${language === 'ar' ? 'Arabic' : 'English'}</b> to the employer?`,
                async () => {
                    btn.disabled = true;
                    const icon = btn.querySelector('i');
                    const originalIcon = icon.className;
                    icon.className = 'fas fa-spinner fa-spin';

                    try {
                        const res = await sendOutreach(jobId, null, language);
                        showToast(`Outreach email sent to ${res.recipient}`, 'success');
                        loadOutreachLeads(); // Refresh to update status
                    } catch (err) {
                        showToast(err.message, 'error');
                    } finally {
                        btn.disabled = false;
                        icon.className = originalIcon;
                    }
                }
            );
        });
    });
};

// --- UI Helpers ---

export const showToast = (message, type = 'info') => {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.warn('Toast container not found. Message:', message);
        }
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} opacity-0 transform translate-y-[-20px] transition-all duration-300 ease-out`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    void toast.offsetWidth; // Trigger reflow

    toast.classList.add('show');
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';

    setTimeout(() => {
        toast.classList.remove('show');
        toast.style.transform = 'translateY(-20px)';
        toast.style.opacity = '0';
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
};


export const showModal = (modalElement) => {
    if (modalElement) {
        modalElement.classList.remove('hidden');
        modalElement.classList.add('open');
        document.body.classList.add('overflow-hidden');
    }
};

export const hideModal = (modalElement) => {
    if (modalElement) {
        modalElement.classList.remove('open');
        modalElement.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    }
};

export const showConfirmationModal = (title, message, onConfirmOrText) => {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmationModal');
        if (!modal) return resolve(false);

        document.getElementById('confirmationModalTitle').textContent = title;
        document.getElementById('confirmationModalMessage').innerHTML = message;

        const confirmBtn = document.getElementById('confirmationModalConfirmBtn');
        const cancelBtn = document.getElementById('confirmationModalCancelBtn');
        const closeBtn = document.getElementById('closeConfirmationModalBtn');

        // Set confirm button text if provided as a string
        const originalConfirmText = 'Confirm';
        if (typeof onConfirmOrText === 'string') {
            confirmBtn.textContent = onConfirmOrText;
        } else {
            confirmBtn.textContent = originalConfirmText;
        }

        // Remove existing listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);

        const handleClose = (result) => {
            hideModal(modal);
            resolve(result);
        };

        newConfirmBtn.addEventListener('click', async () => {
            if (typeof onConfirmOrText === 'function') {
                newConfirmBtn.disabled = true;
                const btnText = newConfirmBtn.textContent;
                newConfirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                
                try {
                    await onConfirmOrText();
                    handleClose(true);
                } catch (error) {
                    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                        console.error('Action failed:', error);
                    }
                    showToast(error.message || 'Action failed', 'error');
                } finally {
                    newConfirmBtn.disabled = false;
                    newConfirmBtn.textContent = btnText;
                }
            } else {
                handleClose(true);
            }
        });

        newCancelBtn.addEventListener('click', () => handleClose(false));
        newCloseBtn.addEventListener('click', () => handleClose(false));

        showModal(modal);
    });
};

// --- Section Navigation ---

export const showSection = (sectionId) => {
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => section.classList.add('hidden'));
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        state.currentActiveSectionId = sectionId;
        
        // Trigger data load based on section
        switch (sectionId) {
            case 'overviewSection': loadDashboardStats(); break;
            case 'freelancersSection': loadAllFreelancers(); break;
            case 'employersSection': loadAllEmployers(); break;
            case 'jobsSection': loadJobs(document.getElementById('jobSearchInput').value, 'jobsSection'); break;
            case 'reviewsSection': loadAllReviews(); break;
            case 'jobAlertsSection': 
                loadJobs(document.getElementById('jobAlertSearchInput').value, 'jobAlertsSection');
                // fetchCategories and fetchCities are imported from api
                break;
            case 'emailCampaignsSection':
                document.getElementById('emailCampaignForm').reset();
                document.getElementById('filteredRecipientsSection').classList.remove('hidden');
                document.getElementById('customRecipientsSection').classList.add('hidden');
                fetchLoggedInUserEmail();
                break;
            case 'jobApplicationNotificationsSection': 
                loadJobsWithApplications(
                    document.getElementById('jobAppNotificationSearchInput').value,
                    document.getElementById('jobAppNotificationFilterCity').value,
                    document.getElementById('jobAppNotificationFilterCategory').value,
                    document.getElementById('jobAppNotificationFilterNotified').value
                );
                break;
            case 'aggregatedJobsSection':
                loadAggregatedJobs();
                break;
            case 'jobSourcesSection':
                loadJobSources();
                break;
            case 'outreachLeadsSection':
                loadOutreachLeads();
                break;
            default: 
                if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                    console.warn('Unknown section:', sectionId);
                }
        }
    }
};

export const setActiveLink = (linkId) => {
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
    sidebarLinks.forEach(link => {
        link.classList.remove('active-link');
        link.classList.add('text-gray-300');
    });
    const targetLink = document.getElementById(linkId);
    if (targetLink) {
        targetLink.classList.remove('text-gray-300');
        targetLink.classList.add('active-link');
    }
};

export const getDisplayStatus = (status) => {
    switch (status) {
        case 'freelancer': return 'Professional';
        case 'employer': return 'Employer';
        default: return status;
    }
};

export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

// --- Job Alerts Helper ---

export const updateJobAlertEmailPreview = (jobs) => {
    const previewContainer = document.getElementById('finalEmailPreview');
    if (!previewContainer) return;

    if (jobs.length === 0) {
        previewContainer.innerHTML = '<p class="text-gray-400">No jobs selected.</p>';
        return;
    }

    const jobListHtml = jobs.map(job => {
        const employerName = job.company_name || job.employer_company_name || `${job.employer_first_name || ''} ${job.employer_last_name || ''}`.trim() || 'Confidential';
        return `
        <div style="margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
            <h3 style="color: #4f46e5; margin: 0 0 5px 0;">${job.title || 'Untitled Job'}</h3>
            <p style="margin: 0; color: #64748b; font-size: 14px;">${employerName}</p>
            <p style="margin: 5px 0 0 0; color: #334155; font-size: 14px;">${job.city || 'N/A'} • ${job.budget || 'Negotiable'} ${job.currency || ''}</p>
        </div>
    `}).join('');

    previewContainer.innerHTML = `
        <div style="font-family: sans-serif; padding: 15px;">
            <h2 style="color: #1e293b; margin-bottom: 20px;">New Job Opportunities</h2>
            ${jobListHtml}
            <div style="margin-top: 20px; text-align: center;">
                <a href="#" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View All Jobs</a>
            </div>
        </div>
    `;
};

// --- Bulk Action UI Helpers ---

export const updateFreelancerSelectionUI = () => {
    const bulkActions = document.getElementById('freelancerBulkActions');
    const countDisplay = document.getElementById('selectedFreelancersCount');
    const selectAll = document.getElementById('selectAllFreelancers');
    
    if (!bulkActions || !countDisplay) return;

    const count = state.selectedFreelancers.size;
    countDisplay.textContent = count;
    
    if (count > 0) {
        bulkActions.classList.remove('hidden');
    } else {
        bulkActions.classList.add('hidden');
    }

    // Update Select All state
    if (selectAll) {
        const checkboxes = document.querySelectorAll('.freelancer-checkbox');
        if (checkboxes.length > 0) {
            selectAll.checked = Array.from(checkboxes).every(cb => cb.checked);
        } else {
            selectAll.checked = false;
        }
    }
};

export const updateEmployerSelectionUI = () => {
    const bulkActions = document.getElementById('employerBulkActions');
    const countDisplay = document.getElementById('selectedEmployersCount');
    const selectAll = document.getElementById('selectAllEmployers');
    
    if (!bulkActions || !countDisplay) return;

    const count = state.selectedEmployers.size;
    countDisplay.textContent = count;
    
    if (count > 0) {
        bulkActions.classList.remove('hidden');
    } else {
        bulkActions.classList.add('hidden');
    }

    // Update Select All state
    if (selectAll) {
        const checkboxes = document.querySelectorAll('.employer-checkbox');
        if (checkboxes.length > 0) {
            selectAll.checked = Array.from(checkboxes).every(cb => cb.checked);
        } else {
            selectAll.checked = false;
        }
    }
};

export const updateJobSelectionUI = () => {
    const bulkActions = document.getElementById('jobBulkActions');
    const countDisplay = document.getElementById('selectedJobsCount');
    const selectAll = document.getElementById('selectAllJobs');
    
    if (!bulkActions || !countDisplay) return;

    const count = state.selectedJobsList.size;
    countDisplay.textContent = count;
    
    if (count > 0) {
        bulkActions.classList.remove('hidden');
    } else {
        bulkActions.classList.add('hidden');
    }

    // Update Select All state
    if (selectAll) {
        const checkboxes = document.querySelectorAll('.job-checkbox');
        if (checkboxes.length > 0) {
            selectAll.checked = Array.from(checkboxes).every(cb => cb.checked);
        } else {
            selectAll.checked = false;
        }
    }
};

// --- Email Campaigns Helper ---

export const applyEmailTemplate = async (templateId) => {
    const subjectInput = document.getElementById('emailSubject');
    const messageInput = document.getElementById('emailMessage');
    
    if (!subjectInput || !messageInput) return;

    if (templateId === 'custom') {
        subjectInput.value = '';
        messageInput.value = '';
        return;
    }

    try {
        // Show loading state
        const originalSubject = subjectInput.value;
        const originalMessage = messageInput.value;
        subjectInput.value = 'Loading template...';
        messageInput.disabled = true;

        const templateContent = await loadEmailTemplate(templateId);
        
        if (templateContent) {
            subjectInput.value = templateContent.subject || '';
            // If the content is an object with html, use that, otherwise use it directly
            messageInput.value = templateContent.html || templateContent.message || '';
        } else {
            // Fallback to client-side templates if server fails or returns null
            if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                console.warn('Template not found on server, using fallback');
            }
            let subject = '';
            let message = '';
            
            switch (templateId) {
                case 'employer-marketing':
                    subject = 'Find Top Talent on Hirly';
                    message = `
                        <p>Hello,</p>
                        <p>Did you know that Hirly has thousands of verified freelancers ready to work?</p>
                        <p>Post a job today and find the perfect match for your project.</p>
                        <br>
                        <p>Best regards,<br>The Hirly Team</p>
                    `;
                    break;
                case 'employer-engagement':
                    subject = 'How was your experience?';
                    message = `
                        <p>Hello,</p>
                        <p>We'd love to hear about your recent experience hiring on Hirly. Your feedback helps us improve.</p>
                        <br>
                        <p>Best regards,<br>The Hirly Team</p>
                    `;
                    break;
                default:
                    subject = '';
                    message = '';
            }
            subjectInput.value = subject;
            messageInput.value = message;
        }
        // Trigger input event to update char count
        messageInput.dispatchEvent(new Event('input'));
    } catch (error) {
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.error('Error applying template:', error);
        }
        showToast('Failed to load template content', 'error');
        subjectInput.value = '';
        messageInput.value = '';
    } finally {
        messageInput.disabled = false;
    }
};

export const loadMatchingRecipients = async () => {
    // This is a placeholder as the backend handles filtering.
    // In a more advanced version, this could fetch a count preview.
};

export const confirmSendAlerts = async () => {
    // Logic for sending alerts is handled in dashboard-core via event listener calling api
    // This export might not be needed if logic is in core, but keeping for compatibility if imported
};

export const sendJobAlerts = async () => {
    // Logic for opening modal
    const modal = document.getElementById('jobAlertConfirmModal');
    if (modal) showModal(modal);
};

// Generic Filter Logic
export const handleSingleSelectFilter = (buttons, onChange, dataAttribute = 'filter') => {
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const value = button.dataset[dataAttribute];
            onChange(value);
        });
    });
};
