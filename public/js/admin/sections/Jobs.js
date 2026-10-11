/**
 * Jobs Management Section Module
 * Handles platform manually posted job listings.
 */
import { getJobs, bulkRemoveJobs, bulkCloseJobs } from '../core/api.js';
import { state } from '../core/state.js';
import { createLoadingSpinner, getStatusBadgeClass, formatDate } from '../core/utils.js';
import { showToast, showConfirmationModal } from '../components/UI.js';

// --- Helper Functions ---
const updateJobBulkActionsUI = () => {
    const bulkBar = document.getElementById('jobBulkActions');
    const countSpan = document.getElementById('selectedJobsCount');
    if (bulkBar && countSpan) {
        const count = state.selectedJobsList.size;
        countSpan.textContent = count;
        bulkBar.classList.toggle('hidden', count === 0);
    }
};

const handleTableActions = async (e) => {
    const viewBtn = e.target.closest('.view-job-btn');
    const eliteBtn = e.target.closest('.elite-access-btn');
    const closeBtn = e.target.closest('.close-job-btn');
    const deleteBtn = e.target.closest('.delete-job-btn');

    if (viewBtn) {
        const id = viewBtn.dataset.id;
        const title = viewBtn.dataset.title;
        const company = viewBtn.dataset.company;
        const slug = window.generateJobSlug ? window.generateJobSlug(title, company) : 'job';
        window.open(`/jobs/${id}/${slug}`, '_blank');
        return;
    }

    if (eliteBtn) {
        openEliteAccessModal(eliteBtn.dataset.id, eliteBtn.dataset.title);
        return;
    }

    if (closeBtn) {
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
};

const handleBulkDelete = async () => {
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
};

const handleBulkClose = async () => {
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
};

export const initJobs = () => {
    document.addEventListener('sectionLoaded', (e) => {
        if (e.detail.sectionId === 'jobs') {
            loadJobsData();
            initEliteAccessListeners(); // Ensure listeners are ready when section is active
        }
    });

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

    // Select All
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

    const tableBody = document.getElementById('jobsTableBody');
    if (tableBody) {
        tableBody.addEventListener('click', handleTableActions);
    }

    const bulkDeleteBtn = document.getElementById('bulkDeleteJobsBtn');
    if (bulkDeleteBtn) {
        bulkDeleteBtn.addEventListener('click', handleBulkDelete);
    }

    const bulkCloseBtn = document.getElementById('bulkCloseJobsBtn');
    if (bulkCloseBtn) {
        bulkCloseBtn.addEventListener('click', handleBulkClose);
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

    // Attach listeners
    tableBody.querySelectorAll('.job-checkbox').forEach(cb => {
        cb.onchange = () => {
            if (cb.checked) state.selectedJobsList.add(cb.dataset.id);
            else state.selectedJobsList.delete(cb.dataset.id);
            updateJobBulkActionsUI();
        };
    });
};

// --- Partner Access Logic ---
let currentEliteJobId = null;

const openEliteAccessModal = (jobId, jobTitle) => {
    currentEliteJobId = jobId;
    const modal = document.getElementById('eliteAccessModal');
    const targetDisplay = document.getElementById('eliteTargetJob');
    const setupView = document.getElementById('eliteAccessSetup');
    const resultView = document.getElementById('eliteAccessResult');
    
    if (!modal || !targetDisplay) return;

    targetDisplay.textContent = `#${jobId} - ${jobTitle}`;
    setupView.classList.remove('hidden');
    resultView.classList.add('hidden');
    modal.classList.remove('hidden');
    
    // Auto-generate a password
    document.getElementById('eliteEmployerPassword').value = Math.random().toString(36).slice(-10);
};

// Initialize Access Modal Listeners
let listenersAttached = false;
const initEliteAccessListeners = () => {
    if (listenersAttached) return; // Prevent multiple attachments

    const closeBtn = document.getElementById('closeEliteAccessModal');
    const generatePassBtn = document.getElementById('generateElitePass');
    const confirmBtn = document.getElementById('confirmEliteAccess');
    const copyBtn = document.getElementById('copyEliteDetails');

    if (closeBtn) closeBtn.onclick = () => document.getElementById('eliteAccessModal').classList.add('hidden');
    
    if (generatePassBtn) {
        generatePassBtn.onclick = () => {
            document.getElementById('eliteEmployerPassword').value = Math.random().toString(36).slice(-10);
        };
    }

    if (confirmBtn) {
        confirmBtn.onclick = async () => {
            const email = document.getElementById('eliteEmployerEmail').value;
            const password = document.getElementById('eliteEmployerPassword').value;

            if (!email || !password) {
                showToast('Email and Password are required', 'error');
                return;
            }

            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Generating...</span>';

            try {
                const response = await fetch('/admin/generate-elite-access', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jobId: currentEliteJobId, email, password })
                });

                const data = await response.json();
                if (data.success) {
                    document.getElementById('eliteAccessSetup').classList.add('hidden');
                    const resultView = document.getElementById('eliteAccessResult');
                    resultView.classList.remove('hidden');
                    
                    document.getElementById('resEliteUrl').textContent = `${window.location.origin}/engagement-portal.html`;
                    document.getElementById('resEliteEmail').textContent = email;
                    document.getElementById('resElitePass').textContent = password;
                } else {
                    throw new Error(data.error || 'Failed to generate access');
                }
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '<i class="fas fa-link"></i> <span>Generate Access</span>';
            }
        };
    }

    if (copyBtn) {
        copyBtn.onclick = () => {
            const url = document.getElementById('resEliteUrl').textContent;
            const email = document.getElementById('resEliteEmail').textContent;
            const pass = document.getElementById('resElitePass').textContent;
            const text = `HIRLY PARTNER LOGIN\nURL: ${url}\nID: ${email}\nKEY: ${pass}`;
            
            navigator.clipboard.writeText(text).then(() => {
                showToast('Access details copied', 'success');
            });
        };
    }
    
    listenersAttached = true;
};
