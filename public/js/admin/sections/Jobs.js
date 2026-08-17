/**
 * Jobs Management Section Module
 * Handles platform manually posted job listings.
 */
import { getJobs, bulkRemoveJobs } from '../core/api.js';
import { state } from '../core/state.js';
import { createLoadingSpinner, getStatusBadgeClass, formatDate } from '../core/utils.js';
import { showToast, showConfirmationModal } from '../components/UI.js';

export const initJobs = () => {
    document.addEventListener('sectionLoaded', (e) => {
        if (e.detail.sectionId === 'jobs') {
            loadJobsData();
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
            loadJobsData(true);
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
};

const handleTableActions = async (e) => {
    const viewBtn = e.target.closest('.view-job-btn');
    const deleteBtn = e.target.closest('.delete-job-btn');

    if (viewBtn) {
        const id = viewBtn.dataset.id;
        window.open(`/job_details.html?id=${id}`, '_blank');
    }

    if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        showConfirmationModal(
            'Delete Job',
            'Are you sure you want to remove this job listing?',
            async () => {
                try {
                    await bulkRemoveJobs([id]);
                    showToast('Job deleted', 'success');
                    loadJobsData();
                } catch (err) { showToast(err.message, 'error'); }
            }
        );
    }
};

const handleBulkDelete = async () => {
    const ids = Array.from(state.selectedJobsList);
    if (ids.length === 0) return;

    showConfirmationModal(
        'Bulk Delete',
        `Delete ${ids.length} selected jobs?`,
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

    const html = jobs.map(j => `
        <tr class="hover:bg-gray-50/50 transition-all group">
            <td class="py-4 px-6 text-center">
                <input type="checkbox" class="job-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300" data-id="${j.id}" ${state.selectedJobsList.has(j.id.toString()) ? 'checked' : ''}>
            </td>
            <td class="py-4 px-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest">#${j.id}</td>
            <td class="py-4 px-6">
                <a href="/job_details.html?id=${j.id}" target="_blank" class="text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors">${j.title}</a>
                <div class="flex items-center gap-2 mt-1">
                    <span class="text-[10px] text-gray-400 font-medium">${j.city || 'Remote'}</span>
                </div>
            </td>
            <td class="py-4 px-6">
                <p class="text-xs text-gray-700 font-bold">${j.employer_company_name || 'Individual'}</p>
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
                    <button class="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center view-job-btn" data-id="${j.id}">
                        <i class="fas fa-eye text-xs"></i>
                    </button>
                    <button class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center delete-job-btn" data-id="${j.id}">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

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

const updateJobBulkActionsUI = () => {
    const bulkBar = document.getElementById('jobBulkActions');
    const countSpan = document.getElementById('selectedJobsCount');
    if (bulkBar && countSpan) {
        const count = state.selectedJobsList.size;
        countSpan.textContent = count;
        bulkBar.classList.toggle('hidden', count === 0);
    }
};
