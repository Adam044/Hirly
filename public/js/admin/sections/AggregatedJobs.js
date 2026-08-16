/**
 * Aggregated Jobs Section Module
 * Handles insights and management for aggregated listings.
 */
import { getAggregatedJobs } from '../core/api.js';
import { state } from '../core/state.js';
import { createLoadingSpinner, formatDate } from '../core/utils.js';
import { showToast } from '../components/UI.js';

export const initAggregatedJobs = () => {
    document.addEventListener('sectionLoaded', (e) => {
        if (e.detail.sectionId === 'aggregatedJobs') {
            loadAggregatedJobsData();
        }
    });

    const refreshBtn = document.getElementById('refreshAggregatedJobsBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => loadAggregatedJobsData(false));
    }

    const searchInput = document.getElementById('aggregatorSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.filters.aggregatedJobs.search = e.target.value;
            loadAggregatedJobsData(false);
        });
    }

    const loadMoreBtn = document.getElementById('loadMoreAggregatedJobsBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => loadAggregatedJobsData(true));
    }

    // Sorting
    document.querySelectorAll('.agg-sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const sortBy = btn.dataset.sort;
            if (state.filters.aggregatedJobs.sortBy === sortBy) {
                state.filters.aggregatedJobs.sortOrder = state.filters.aggregatedJobs.sortOrder === 'DESC' ? 'ASC' : 'DESC';
            } else {
                state.filters.aggregatedJobs.sortBy = sortBy;
                state.filters.aggregatedJobs.sortOrder = 'DESC';
            }
            
            // Update UI Icons
            updateSortIcons(btn);
            loadAggregatedJobsData(false);
        });
    });

    // Initial Sort UI state
    const defaultSortBtn = document.querySelector(`.agg-sort-btn[data-sort="${state.filters.aggregatedJobs.sortBy}"]`);
    if (defaultSortBtn) updateSortIcons(defaultSortBtn);
};

const updateSortIcons = (activeBtn) => {
    document.querySelectorAll('.agg-sort-btn i').forEach(icon => {
        icon.className = 'fas fa-sort ml-1 text-[10px] opacity-50';
    });
    
    const icon = activeBtn.querySelector('i');
    const order = state.filters.aggregatedJobs.sortOrder;
    icon.className = `fas fa-sort-${order === 'DESC' ? 'down' : 'up'} ml-1 text-[10px] text-indigo-600 opacity-100`;
};

export const loadAggregatedJobsData = async (append = false) => {
    const tableBody = document.getElementById('aggregatedJobsTableBody');
    const loadMoreContainer = document.getElementById('aggregatedJobsLoadMoreContainer');
    if (!tableBody) return;

    const p = state.pagination.aggregatedJobs;
    const f = state.filters.aggregatedJobs;

    if (!append) {
        p.page = 1;
        tableBody.innerHTML = `<tr><td colspan="6">${createLoadingSpinner('Loading aggregated jobs...')}</td></tr>`;
    }

    try {
        const data = await getAggregatedJobs({
            page: p.page,
            limit: p.limit,
            search: f.search,
            sortBy: f.sortBy,
            sortOrder: f.sortOrder
        });

        if (data.success) {
            renderAggregatedJobs(data.jobs, append);
            renderInsights(data.insights);
            
            p.hasMore = data.pagination.hasMore;
            p.page++;
            
            if (loadMoreContainer) {
                loadMoreContainer.classList.toggle('hidden', !p.hasMore);
            }
        }
    } catch (error) {
        showToast('Failed to load aggregated jobs', 'error');
    }
};

const renderInsights = (insights) => {
    if (!insights) return;
    const totalEl = document.getElementById('totalAggregatedCount');
    const activeEl = document.getElementById('activeAggregatedCount');
    const appsEl = document.getElementById('totalAggregatedApps');

    if (totalEl) totalEl.textContent = insights.total || 0;
    if (activeEl) activeEl.textContent = insights.active || 0;
    if (appsEl) appsEl.textContent = insights.applications || 0;
};

const renderAggregatedJobs = (jobs, append) => {
    const tableBody = document.getElementById('aggregatedJobsTableBody');
    if (!tableBody) return;

    if (!jobs || !jobs.length) {
        if (!append) {
            tableBody.innerHTML = `<tr><td colspan="6" class="py-12 text-center text-gray-400 font-bold uppercase tracking-widest">No aggregated jobs found</td></tr>`;
        }
        return;
    }

    const html = jobs.map(j => `
        <tr class="hover:bg-gray-50/50 transition-all group">
            <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                        ${j.external_company_logo ? `<img src="${j.external_company_logo}" class="w-full h-full object-contain">` : '<i class="fas fa-building text-gray-300"></i>'}
                    </div>
                    <div>
                        <a href="/jobs/${j.id}" target="_blank" class="text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors">${j.title}</a>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">${j.external_company_name || 'Unknown Company'}</p>
                    </div>
                </div>
            </td>
            <td class="py-4 px-6">
                <span class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 uppercase tracking-widest">
                    ${j.source_name || 'External'}
                </span>
            </td>
            <td class="py-4 px-6 text-center">
                <span class="text-xs font-bold ${j.app_count > 0 ? 'text-indigo-600' : 'text-gray-400'}">${j.app_count || 0}</span>
            </td>
            <td class="py-4 px-6 text-center">
                <span class="text-xs font-bold text-gray-600">${j.views || 0}</span>
            </td>
            <td class="py-4 px-6">
                <div class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">${formatDate(j.created_at)}</div>
            </td>
            <td class="py-4 px-6 text-right">
                <div class="flex items-center justify-end gap-2">
                    <a href="/jobs/${j.id}" target="_blank" class="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-indigo-600 hover:text-white transition-all inline-flex items-center justify-center shadow-sm">
                        <i class="fas fa-eye text-xs"></i>
                    </a>
                </div>
            </td>
        </tr>
    `).join('');

    if (append) tableBody.insertAdjacentHTML('beforeend', html);
    else tableBody.innerHTML = html;
};
