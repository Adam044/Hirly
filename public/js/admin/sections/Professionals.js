/**
 * Professional Management Section Module
 */
import { getProfessionals, bulkVerifyProfessionals } from '../core/api.js';
import { state } from '../core/state.js';
import { createLoadingSpinner, getStatusBadgeClass } from '../core/utils.js';
import { showToast } from '../components/UI.js';

export const initProfessionals = () => {
    document.addEventListener('sectionLoaded', (e) => {
        if (e.detail.sectionId === 'professionals') {
            loadProfessionalsData();
        }
    });

    // Search & Filters
    const searchInput = document.getElementById('freelancerSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.filters.freelancers.search = e.target.value;
            loadProfessionalsData();
        });
    }

    const verificationFilter = document.getElementById('freelancerVerificationFilter');
    if (verificationFilter) {
        verificationFilter.addEventListener('change', (e) => {
            state.filters.freelancers.status = e.target.value;
            loadProfessionalsData();
        });
    }

    // Load More
    const loadMoreBtn = document.getElementById('loadMoreFreelancersBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => loadProfessionalsData(true));
    }

    const tableBody = document.getElementById('freelancersTableBody');
    if (tableBody) {
        tableBody.addEventListener('click', handleTableActions);
    }

    const selectAll = document.getElementById('selectAllFreelancers');
    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.freelancer-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = e.target.checked;
                if (e.target.checked) state.selectedFreelancers.add(cb.dataset.id);
                else state.selectedFreelancers.delete(cb.dataset.id);
            });
            updateBulkActionsUI();
        });
    }

    const bulkVerifyBtn = document.getElementById('bulkVerifyFreelancersBtn');
    if (bulkVerifyBtn) {
        bulkVerifyBtn.addEventListener('click', handleBulkVerify);
    }
};

const handleTableActions = async (e) => {
    const verifyBtn = e.target.closest('.verify-btn');
    const deleteBtn = e.target.closest('.delete-btn');

    if (verifyBtn) {
        const id = verifyBtn.dataset.id;
        try {
            await bulkVerifyProfessionals([id], 'Verified');
            showToast('Professional verified', 'success');
            loadProfessionalsData();
        } catch (err) { showToast(err.message, 'error'); }
    }

    if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        showConfirmationModal(
            'Delete Professional',
            'Permanently delete this professional account? This action cannot be undone.',
            async () => {
                try {
                    const response = await fetch('/admin/delete-user', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: id })
                    });
                    const data = await response.json();
                    if (data.success) {
                        showToast('Professional deleted', 'success');
                        loadProfessionalsData();
                    } else {
                        showToast(data.error || 'Failed to delete professional', 'error');
                    }
                } catch (err) { showToast(err.message, 'error'); }
            }
        );
    }
};

const handleBulkVerify = async () => {
    const ids = Array.from(state.selectedFreelancers);
    if (ids.length === 0) return;

    try {
        await bulkVerifyProfessionals(ids, 'Verified');
        showToast(`Verified ${ids.length} professionals`, 'success');
        state.selectedFreelancers.clear();
        updateBulkActionsUI();
        loadProfessionalsData();
    } catch (err) { showToast(err.message, 'error'); }
};

const updateBulkActionsUI = () => {
    const bulkBar = document.getElementById('freelancerBulkActions');
    const countSpan = document.getElementById('selectedFreelancersCount');
    if (bulkBar && countSpan) {
        const count = state.selectedFreelancers.size;
        countSpan.textContent = count;
        bulkBar.classList.toggle('hidden', count === 0);
    }
};

export const loadProfessionalsData = async (append = false) => {
    const tableBody = document.getElementById('freelancersTableBody');
    if (!tableBody) return;

    const p = state.pagination.freelancers;
    const f = state.filters.freelancers;

    if (!append) {
        p.page = 1;
        tableBody.innerHTML = `<tr><td colspan="6">${createLoadingSpinner('Loading talent...')}</td></tr>`;
    }

    try {
        const data = await getProfessionals({
            page: p.page,
            limit: p.limit,
            search: f.search,
            status: f.status
        });

        if (data.success) {
            renderProfessionals(data.professionals, append);
            p.hasMore = data.pagination.hasMore;
            p.page++;
        }
    } catch (error) {
        showToast('Failed to load professionals', 'error');
    }
};

const renderProfessionals = (professionals, append) => {
    const tableBody = document.getElementById('freelancersTableBody');
    if (!tableBody) return;

    const html = professionals.map(f => `
        <tr class="hover:bg-gray-50/50 transition-all group">
            <td class="py-4 px-6 text-center">
                <input type="checkbox" class="freelancer-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300" data-id="${f.id}" ${state.selectedFreelancers.has(f.id.toString()) ? 'checked' : ''}>
            </td>
            <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                        ${f.profile_picture_url ? 
                            `<img src="${typeof ImageOptimizer !== 'undefined' ? ImageOptimizer.getOptimizedUrl(f.profile_picture_url, 'thumb') : f.profile_picture_url}" 
                                  class="w-full h-full object-cover" 
                                  onerror="this.onerror=null; this.src='${f.profile_picture_url}';">` 
                            : (f.first_name || 'P').charAt(0)}
                    </div>
                    <div>
                        <p class="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">${f.first_name} ${f.last_name}</p>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">${f.profession || 'Talent'}</p>
                    </div>
                </div>
            </td>
            <td class="py-4 px-6">
                <div class="flex flex-col">
                    <p class="text-xs text-gray-700 font-medium">${f.email}</p>
                    <p class="text-[10px] text-gray-400">${f.city || 'No Location'}</p>
                </div>
            </td>
            <td class="py-4 px-6">
                <span class="${getStatusBadgeClass(f.current_status)} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm">
                    ${f.current_status || 'freelancer'}
                </span>
            </td>
            <td class="py-4 px-6 text-right">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center verify-btn" data-id="${f.id}">
                        <i class="fas fa-check text-xs"></i>
                    </button>
                    <button class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center delete-btn" data-id="${f.id}">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    if (append) tableBody.insertAdjacentHTML('beforeend', html);
    else tableBody.innerHTML = html;
};
