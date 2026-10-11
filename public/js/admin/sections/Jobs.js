/**
 * Jobs Management Section Module
 * Handles platform manually posted job listings.
 */
import { getJobs, bulkRemoveJobs, bulkCloseJobs } from '../core/api.js';
import { state } from '../core/state.js';
import { createLoadingSpinner, getStatusBadgeClass, formatDate } from '../core/utils.js';
import { showToast, showConfirmationModal } from '../components/UI.js';

// --- State & Variables ---
let currentEliteJobId = null;
let listenersAttached = false;
let tableListenerAttached = false;

// --- Helper Functions ---
function updateJobBulkActionsUI() {
    const bulkBar = document.getElementById('jobBulkActions');
    const countSpan = document.getElementById('selectedJobsCount');
    if (bulkBar && countSpan) {
        const count = state.selectedJobsList.size;
        countSpan.textContent = count;
        bulkBar.classList.toggle('hidden', count === 0);
    }
}

async function handleTableActions(e) {
    const target = e.target;
    console.log('JobsTable Click Target:', target);
    
    // Checkbox handling
    if (target.classList.contains('job-checkbox')) {
        const id = target.dataset.id;
        if (target.checked) state.selectedJobsList.add(id);
        else state.selectedJobsList.delete(id);
        updateJobBulkActionsUI();
        return;
    }

    const viewBtn = target.closest('.view-job-btn');
    const eliteBtn = target.closest('.elite-access-btn');
    const closeBtn = target.closest('.close-job-btn');
    const deleteBtn = target.closest('.delete-job-btn');

    if (viewBtn) {
        console.log('View Job Clicked:', viewBtn.dataset.id);
        const id = viewBtn.dataset.id;
        const title = viewBtn.dataset.title;
        const company = viewBtn.dataset.company;
        const slug = window.generateJobSlug ? window.generateJobSlug(title, company) : 'job';
        window.open(`/jobs/${id}/${slug}`, '_blank');
        return;
    }

    if (eliteBtn) {
        console.log('Elite Access Button Clicked! ID:', eliteBtn.dataset.id, 'Title:', eliteBtn.dataset.title);
        openEliteAccessModal(eliteBtn.dataset.id, eliteBtn.dataset.title);
        return;
    }

    if (closeBtn) {
        console.log('Close Job Clicked:', closeBtn.dataset.id);
        const id = closeBtn.dataset.id;
        showConfirmationModal(
            'Close Job',
            'Mark this job as closed? It will remain in the database but won\'t be active.',
            async () => {
                try {
                    await bulkCloseJobs([id]);
                    showToast('Job closed', 'success');
                    loadJobsData();
                } catch (err) { showToast(err.message, 'error'); }
            }
        );
        return;
    }

    if (deleteBtn) {
        console.log('Delete Job Clicked:', deleteBtn.dataset.id);
        const id = deleteBtn.dataset.id;
        showConfirmationModal(
            'Delete Permanently',
            'Are you sure you want to PERMANENTLY delete this job? This action cannot be undone.',
            async () => {
                try {
                    await bulkRemoveJobs([id]);
                    showToast('Job deleted permanently', 'success');
                    loadJobsData();
                } catch (err) { showToast(err.message, 'error'); }
            }
        );
        return;
    }
}

function generateSecureKey() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Readable chars
    let key = 'HIRLY-';
    for (let i = 0; i < 4; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
    key += '-';
    for (let i = 0; i < 4; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
    return key;
}

function openEliteAccessModal(jobId, jobTitle) {
    currentEliteJobId = jobId;
    const modal = document.getElementById('eliteAccessModal');
    const targetDisplay = document.getElementById('eliteTargetJob');
    const setupView = document.getElementById('eliteAccessSetup');
    const resultView = document.getElementById('eliteAccessResult');
    
    if (!modal) {
        console.error('CRITICAL: Elite Access Modal not found in DOM');
        showToast('UI Error: Modal not found', 'error');
        return;
    }

    if (targetDisplay) targetDisplay.textContent = `#${jobId} - ${jobTitle}`;
    
    // Reset views
    if (setupView) setupView.classList.remove('hidden');
    if (resultView) resultView.classList.add('hidden');
    
    // Force show modal
    modal.classList.remove('hidden');
    modal.style.display = 'flex'; 
    modal.style.zIndex = '9999';
    
    const passInput = document.getElementById('eliteEmployerPassword');
    if (passInput) passInput.value = generateSecureKey();
}

function initEliteAccessListeners() {
    if (listenersAttached) return;

    const modal = document.getElementById('eliteAccessModal');
    const closeBtn = document.getElementById('closeEliteAccessModal');
    const generatePassBtn = document.getElementById('generateElitePass');
    const confirmBtn = document.getElementById('confirmEliteAccess');
    const copyBtn = document.getElementById('copyEliteDetails');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        });
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        });
    }

    if (generatePassBtn) {
        generatePassBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const passInput = document.getElementById('eliteEmployerPassword');
            if (passInput) passInput.value = generateSecureKey();
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            const passInput = document.getElementById('eliteEmployerPassword');
            const customKey = passInput?.value;

            if (!customKey) {
                showToast('Access Key is required', 'error');
                return;
            }

            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Provisioning...</span>';

            try {
                const response = await fetch('/admin/generate-job-access-key', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jobId: currentEliteJobId, customKey })
                });

                const data = await response.json();
                if (data.success) {
                    document.getElementById('eliteAccessSetup')?.classList.add('hidden');
                    const resultView = document.getElementById('eliteAccessResult');
                    if (resultView) resultView.classList.remove('hidden');
                    
                    const resUrl = document.getElementById('resEliteUrl');
                    const resPass = document.getElementById('resElitePass');
                    
                    const directUrl = `${window.location.origin}/employer/applicants.html?job_id=${currentEliteJobId}&mode=direct`;
                    if (resUrl) resUrl.textContent = directUrl;
                    if (resPass) resPass.textContent = customKey;
                } else {
                    throw new Error(data.error || 'Failed to generate access');
                }
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '<i class="fas fa-lock"></i> <span>Provision Secure Link</span>';
            }
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const url = document.getElementById('resEliteUrl')?.textContent;
            const key = document.getElementById('resElitePass')?.textContent;
            const text = `HIRLY SECURE ACCESS\nJob ID: #${currentEliteJobId}\nAccess URL: ${url}\nSecure Key: ${key}`;
            
            navigator.clipboard.writeText(text).then(() => {
                showToast('Access details copied', 'success');
            });
        });
    }
    
    listenersAttached = true;
}

export const initJobs = () => {
    console.log('Initializing Jobs Section...');
    
    document.addEventListener('sectionLoaded', (e) => {
        if (e.detail.sectionId === 'jobs') {
            console.log('Jobs Section Loaded Event Fired');
            loadJobsData();
            initEliteAccessListeners();
        }
    });

    // Global listener for the jobs table body - attached once
    if (!tableListenerAttached) {
        console.log('Attaching Global Click Listener for Jobs Table');
        document.addEventListener('click', (e) => {
            // We look for the closest table row to see if it's within our jobs table
            const tableBody = document.getElementById('jobsTableBody');
            if (!tableBody) return;

            // Check if the click is within the table body OR if the target is one of our buttons
            // This is more robust than just tableBody.contains(e.target)
            const isTableClick = tableBody.contains(e.target);
            const isActionButton = e.target.closest('.view-job-btn, .elite-access-btn, .close-job-btn, .delete-job-btn, .job-checkbox');

            if (isTableClick || isActionButton) {
                handleTableActions(e);
            }
        });
        tableListenerAttached = true;
    }

    const searchInput = document.getElementById('jobSearchInput');
    const statusFilter = document.getElementById('jobStatusFilter');
    const clearBtn = document.getElementById('clearJobFilters');
    const loadMoreBtn = document.getElementById('loadMoreJobsBtn');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.filters.jobs.search = e.target.value;
            loadJobsData();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            state.filters.jobs.status = e.target.value;
            loadJobsData();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            state.filters.jobs = { search: '', status: 'all', type: 'hirly' };
            if (searchInput) searchInput.value = '';
            if (statusFilter) statusFilter.value = 'all';
            loadJobsData();
        });
    }

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            if (state.pagination.jobs.hasMore) {
                loadJobsData(true);
            }
        });
    }

    // Bulk Actions
    const selectAll = document.getElementById('selectAllJobs');
    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.job-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = e.target.checked;
                if (e.target.checked) state.selectedJobsList.add(cb.dataset.id);
                else state.selectedJobsList.delete(cb.dataset.id);
            });
            updateJobBulkActionsUI();
        });
    }

    const bulkDeleteBtn = document.getElementById('bulkDeleteJobsBtn');
    if (bulkDeleteBtn) {
        bulkDeleteBtn.addEventListener('click', async () => {
            const ids = Array.from(state.selectedJobsList);
            if (ids.length === 0) return;

            showConfirmationModal(
                'Bulk Delete',
                `Permanently delete ${ids.length} selected jobs? This cannot be undone.`,
                async () => {
                    try {
                        await bulkRemoveJobs(ids);
                        showToast(`Deleted ${ids.length} jobs`, 'success');
                        state.selectedJobsList.clear();
                        updateJobBulkActionsUI();
                        loadJobsData();
                    } catch (err) { showToast(err.message, 'error'); }
                }
            );
        });
    }

    const bulkCloseBtn = document.getElementById('bulkCloseJobsBtn');
    if (bulkCloseBtn) {
        bulkCloseBtn.addEventListener('click', async () => {
            const ids = Array.from(state.selectedJobsList);
            if (ids.length === 0) return;

            showConfirmationModal(
                'Bulk Close',
                `Mark ${ids.length} selected jobs as closed?`,
                async () => {
                    try {
                        await bulkCloseJobs(ids);
                        showToast(`Closed ${ids.length} jobs`, 'success');
                        state.selectedJobsList.clear();
                        updateJobBulkActionsUI();
                        loadJobsData();
                    } catch (err) { showToast(err.message, 'error'); }
                }
            );
        });
    }
};

export const loadJobsData = async (append = false) => {
    const tableBody = document.getElementById('jobsTableBody');
    const loadMoreContainer = document.getElementById('jobsLoadMoreContainer');
    if (!tableBody) return;

    const p = state.pagination.jobs;
    const f = state.filters.jobs;

    if (p.loading) return;

    if (!append) {
        p.page = 1;
        tableBody.innerHTML = `<tr><td colspan="8">${createLoadingSpinner('Searching jobs...')}</td></tr>`;
    }

    p.loading = true;

    try {
        const data = await getJobs({
            page: p.page,
            limit: p.limit,
            search: f.search,
            type: 'hirly',
            status: f.status
        });

        if (data.success) {
            renderJobs(data.jobs || [], append);
            p.hasMore = data.pagination.hasMore;
            p.page++;

            if (loadMoreContainer) {
                loadMoreContainer.classList.toggle('hidden', !p.hasMore);
            }
        }
    } catch (error) {
        showToast('Failed to load jobs', 'error');
        if (!append) tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-red-500 font-bold">Error loading jobs</td></tr>';
    } finally {
        p.loading = false;
    }
};

const renderJobs = (jobs, append) => {
    const tableBody = document.getElementById('jobsTableBody');
    if (!tableBody) return;

    if (!jobs || !jobs.length) {
        if (!append) {
            tableBody.innerHTML = `<tr><td colspan="8" class="py-12 text-center text-gray-400 font-bold uppercase tracking-widest">No manual jobs found</td></tr>`;
        }
        return;
    }

    const html = jobs.map(j => {
        const companyName = j.employer_company_name || 'Individual';
        const slug = window.generateJobSlug ? window.generateJobSlug(j.title, companyName) : 'job';
        
        const badgesHtml = `
            <div class="flex flex-wrap gap-1 mt-1">
                ${j.is_verified ? '<span class="text-[9px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 uppercase tracking-tighter">Verified</span>' : ''}
                ${j.is_confidential ? '<span class="text-[9px] font-black text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 uppercase tracking-tighter">Confidential</span>' : ''}
            </div>
        `;
        
        return `
        <tr class="hover:bg-gray-50/50 transition-all group">
            <td class="py-4 px-6 text-center">
                <input type="checkbox" class="job-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300" data-id="${j.id}" ${state.selectedJobsList.has(j.id.toString()) ? 'checked' : ''}>
            </td>
            <td class="py-4 px-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest">#${j.id}</td>
            <td class="py-4 px-6">
                <div class="flex flex-col">
                    <a href="/jobs/${j.id}/${slug}" target="_blank" class="text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors">${j.title}</a>
                    ${badgesHtml}
                </div>
            </td>
            <td class="py-4 px-6">
                <div class="flex flex-col">
                    <p class="text-xs text-gray-700 font-bold">${companyName}</p>
                    <span class="text-[10px] text-gray-400 font-medium">${j.city || 'Remote'}</span>
                </div>
            </td>
            <td class="py-4 px-6 text-center">
                <span class="text-xs font-bold ${j.app_count > 0 ? 'text-indigo-600' : 'text-gray-400'}">${j.app_count || 0}</span>
            </td>
            <td class="py-4 px-6">
                <span class="${getStatusBadgeClass(j.status)} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm">
                    ${j.status || 'open'}
                </span>
            </td>
            <td class="py-4 px-6">
                <div class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">${formatDate(j.created_at)}</div>
            </td>
            <td class="py-4 px-6 text-right">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button class="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center view-job-btn" 
                            data-id="${j.id}" 
                            data-title="${j.title.replace(/"/g, '&quot;')}" 
                            data-company="${companyName.replace(/"/g, '&quot;')}">
                        <i class="fas fa-eye text-xs"></i>
                    </button>
                    ${(j.is_confidential) ? `
                    <button class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 elite-access-btn" 
                            data-id="${j.id}" 
                            data-title="${j.title.replace(/"/g, '&quot;')}" 
                            title="Generate Access">
                        <i class="fas fa-key"></i>
                        <span class="text-[10px] font-bold uppercase">Access</span>
                    </button>
                    ` : ''}
                    <button class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all flex items-center justify-center close-job-btn" 
                            data-id="${j.id}" title="Close Job">
                        <i class="fas fa-times-circle text-xs"></i>
                    </button>
                    <button class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center delete-job-btn" 
                            data-id="${j.id}" title="Delete Permanently">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');

    if (append) tableBody.insertAdjacentHTML('beforeend', html);
    else tableBody.innerHTML = html;
};
