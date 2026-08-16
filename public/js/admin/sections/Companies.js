/**
 * Company Management Section Module
 */
import { getEmployers, bulkVerifyEmployers, removeCompanyLogo } from '../core/api.js';
import { state } from '../core/state.js';
import { createLoadingSpinner, getStatusBadgeClass } from '../core/utils.js';
import { showToast, showConfirmationModal } from '../components/UI.js';

export const initCompanies = () => {
    document.addEventListener('sectionLoaded', (e) => {
        if (e.detail.sectionId === 'companies') {
            loadCompaniesData();
        }
    });

    // Search & Filters
    const searchInput = document.getElementById('employerSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.filters.employers.search = e.target.value;
            loadCompaniesData();
        });
    }

    const verificationFilter = document.getElementById('employerVerificationFilter');
    if (verificationFilter) {
        verificationFilter.addEventListener('change', (e) => {
            state.filters.employers.status = e.target.value;
            loadCompaniesData();
        });
    }

    // Select All
    const selectAll = document.getElementById('selectAllEmployers');
    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.employer-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = e.target.checked;
                if (e.target.checked) state.selectedEmployers.add(cb.dataset.id);
                else state.selectedEmployers.delete(cb.dataset.id);
            });
            updateBulkActionsUI();
        });
    }

    const tableBody = document.getElementById('employersTableBody');
    if (tableBody) {
        tableBody.addEventListener('click', handleTableActions);
    }

    const bulkVerifyBtn = document.getElementById('bulkVerifyEmployersBtn');
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
            await bulkVerifyEmployers([id], 'Verified');
            showToast('Employer verified', 'success');
            loadCompaniesData();
        } catch (err) { showToast(err.message, 'error'); }
    }

    if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        showConfirmationModal(
            'Delete Employer',
            'Permanently delete this employer and all their jobs? This cannot be undone.',
            async () => {
                try {
                    const response = await fetch('/admin/delete-user', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: id })
                    });
                    const data = await response.json();
                    if (data.success) {
                        showToast('Employer deleted', 'success');
                        loadCompaniesData();
                    } else {
                        showToast(data.error || 'Failed to delete employer', 'error');
                    }
                } catch (err) { showToast(err.message, 'error'); }
            }
        );
    }
};

const handleBulkVerify = async () => {
    const ids = Array.from(state.selectedEmployers);
    if (ids.length === 0) return;

    try {
        await bulkVerifyEmployers(ids, 'Verified');
        showToast(`Verified ${ids.length} employers`, 'success');
        state.selectedEmployers.clear();
        updateBulkActionsUI();
        loadCompaniesData();
    } catch (err) { showToast(err.message, 'error'); }
};

export const loadCompaniesData = async (append = false) => {
    const tableBody = document.getElementById('employersTableBody');
    if (!tableBody) return;

    const p = state.pagination.employers;
    const f = state.filters.employers;

    if (!append) {
        p.page = 1;
        tableBody.innerHTML = `<tr><td colspan="5">${createLoadingSpinner('Loading companies...')}</td></tr>`;
    }

    try {
        const data = await getEmployers({
            page: p.page,
            limit: p.limit,
            search: f.search,
            status: f.status
        });

        if (data.success) {
            renderCompanies(data.employers, append);
            p.hasMore = data.pagination.hasMore;
            p.page++;
        }
    } catch (error) {
        showToast('Failed to load companies', 'error');
    }
};

const renderCompanies = (employers, append) => {
    const tableBody = document.getElementById('employersTableBody');
    if (!tableBody) return;

    const html = employers.map(e => `
        <tr class="hover:bg-gray-50/50 transition-all group">
            <td class="py-4 px-6 text-center">
                <input type="checkbox" class="employer-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300" data-id="${e.id}" ${state.selectedEmployers.has(e.id.toString()) ? 'checked' : ''}>
            </td>
            <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                        ${e.company_logo_url ? `<img src="${e.company_logo_url}" class="w-full h-full object-contain">` : (e.company_name || 'C').charAt(0)}
                    </div>
                    <div>
                        <p class="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">${e.company_name || 'Personal Account'}</p>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">${e.first_name} ${e.last_name}</p>
                    </div>
                </div>
            </td>
            <td class="py-4 px-6">
                <div class="flex flex-col">
                    <p class="text-xs text-gray-700 font-medium">${e.email}</p>
                    <p class="text-[10px] text-gray-400">${e.phone || 'No Phone'}</p>
                </div>
            </td>
            <td class="py-4 px-6">
                <span class="${getStatusBadgeClass(e.current_status)} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm">
                    ${e.current_status || 'Unknown'}
                </span>
            </td>
            <td class="py-4 px-6 text-right">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center verify-btn" data-id="${e.id}">
                        <i class="fas fa-check text-xs"></i>
                    </button>
                    <button class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center delete-btn" data-id="${e.id}">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    if (append) tableBody.insertAdjacentHTML('beforeend', html);
    else tableBody.innerHTML = html;

    // Attach checkbox listeners
    tableBody.querySelectorAll('.employer-checkbox').forEach(cb => {
        cb.onchange = () => {
            if (cb.checked) state.selectedEmployers.add(cb.dataset.id);
            else state.selectedEmployers.delete(cb.dataset.id);
            updateBulkActionsUI();
        };
    });
};

const updateBulkActionsUI = () => {
    const bulkBar = document.getElementById('employerBulkActions');
    const countSpan = document.getElementById('selectedEmployersCount');
    if (bulkBar && countSpan) {
        const count = state.selectedEmployers.size;
        countSpan.textContent = count;
        bulkBar.classList.toggle('hidden', count === 0);
    }
};
