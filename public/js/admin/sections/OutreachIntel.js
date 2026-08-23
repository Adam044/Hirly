/**
 * Outreach Intelligence Section Module
 * Tracks conversion funnel and engagement for outreach leads.
 */
import { getOutreachIntelStats, getOutreachIntelEvents } from '../core/api.js';
import { state } from '../core/state.js';
import { createLoadingSpinner, formatDate } from '../core/utils.js';
import { showToast } from '../components/UI.js';

export const initOutreachIntel = () => {
    document.addEventListener('sectionLoaded', (e) => {
        if (e.detail.sectionId === 'outreachIntel') {
            loadIntelData();
        }
    });

    // Filters
    const eventTypeFilter = document.getElementById('intelEventTypeFilter');
    if (eventTypeFilter) {
        eventTypeFilter.addEventListener('change', (e) => {
            state.filters.outreachIntel.eventType = e.target.value;
            loadIntelEvents();
        });
    }

    // Refresh
    const refreshBtn = document.getElementById('refreshOutreachIntelBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadIntelData();
        });
    }

    // Load More
    const loadMoreBtn = document.getElementById('loadMoreIntelBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            loadIntelEvents(true);
        });
    }
};

export const loadIntelData = async () => {
    await Promise.all([
        loadIntelStats(),
        loadIntelEvents()
    ]);
};

const loadIntelStats = async () => {
    const funnelContainer = document.getElementById('outreachFunnel');
    if (!funnelContainer) return;

    funnelContainer.innerHTML = createLoadingSpinner('Loading funnel...');

    try {
        const data = await getOutreachIntelStats();
        if (data.success) {
            renderFunnel(data.funnel, data.uniqueFunnel);
        }
    } catch (error) {
        console.error('Error loading intel stats:', error);
        funnelContainer.innerHTML = '<p class="text-red-500 font-bold">Error loading stats</p>';
    }
};

const renderFunnel = (funnel, uniqueFunnel) => {
    const funnelContainer = document.getElementById('outreachFunnel');
    if (!funnelContainer) return;

    const steps = [
        { key: 'page_access', label: 'Page Access', icon: 'fa-eye', color: 'indigo' },
        { key: 'cta_click', label: 'CTA Click', icon: 'fa-mouse-pointer', color: 'blue' },
        { key: 'otp_stage_reached', label: 'OTP Stage', icon: 'fa-envelope-open', color: 'amber' },
        { key: 'otp_verify_success', label: 'Verified', icon: 'fa-check-circle', color: 'emerald' },
        { key: 'workspace_created', label: 'Converted', icon: 'fa-rocket', color: 'secondary' }
    ];

    funnelContainer.innerHTML = steps.map(step => {
        const count = funnel[step.key] || 0;
        const unique = uniqueFunnel[step.key] || 0;
        
        return `
            <div class="saas-card p-6 flex flex-col items-center text-center relative overflow-hidden group">
                <div class="absolute top-0 right-0 p-2 opacity-5">
                    <i class="fas ${step.icon} text-6xl"></i>
                </div>
                <div class="w-12 h-12 rounded-xl bg-${step.color}-50 text-${step.color}-600 flex items-center justify-center mb-4 shadow-sm border border-${step.color}-100">
                    <i class="fas ${step.icon} text-xl"></i>
                </div>
                <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">${step.label}</p>
                <h4 class="text-2xl font-black text-gray-900">${count}</h4>
                <p class="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">${unique} Unique Leads</p>
            </div>
        `;
    }).join('');
};

export const loadIntelEvents = async (append = false) => {
    const tableBody = document.getElementById('outreachIntelTableBody');
    const loadMoreContainer = document.getElementById('intelLoadMoreContainer');
    if (!tableBody) return;

    const p = state.pagination.outreachIntel;
    const f = state.filters.outreachIntel;

    if (p.loading) return;

    if (!append) {
        p.page = 1;
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-12">${createLoadingSpinner('Fetching activity...')}</td></tr>`;
    }

    p.loading = true;

    try {
        const data = await getOutreachIntelEvents({
            page: p.page,
            limit: p.limit,
            eventType: f.eventType
        });

        if (data.success) {
            renderEvents(data.events || [], append);
            p.hasMore = data.pagination.hasMore;
            p.page++;

            if (loadMoreContainer) {
                loadMoreContainer.classList.toggle('hidden', !p.hasMore);
            }
        }
    } catch (error) {
        showToast('Failed to load activity', 'error');
        if (!append) tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-red-500 font-bold">Error loading activity</td></tr>';
    } finally {
        p.loading = false;
    }
};

const renderEvents = (events, append) => {
    const tableBody = document.getElementById('outreachIntelTableBody');
    if (!tableBody) return;

    const getEventBadge = (type) => {
        const map = {
            'page_access': { label: 'Accessed', class: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
            'cta_click': { label: 'Interested', class: 'bg-blue-50 text-blue-600 border-blue-100' },
            'otp_stage_reached': { label: 'OTP Stage', class: 'bg-amber-50 text-amber-600 border-amber-100' },
            'otp_verify_success': { label: 'Verified', class: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
            'workspace_created': { label: 'Converted', class: 'bg-indigo-600 text-white border-indigo-700' }
        };
        const item = map[type] || { label: type, class: 'bg-gray-50 text-gray-600 border-gray-100' };
        return `<span class="${item.class} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm">${item.label}</span>`;
    };

    const html = events.map(e => {
        const metadata = e.metadata || {};
        const platformInfo = metadata.user_agent ? metadata.user_agent.split(')')[0].split('(')[1] : 'Unknown';
        
        return `
            <tr class="hover:bg-gray-50/50 transition-all group">
                <td class="py-4 px-6">
                    <div class="flex flex-col">
                        <span class="text-sm font-bold text-gray-900">${e.email}</span>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">${e.ip_address || 'No IP'}</p>
                    </div>
                </td>
                <td class="py-4 px-6">
                    <div class="flex flex-col">
                        <span class="text-sm text-gray-700 font-bold uppercase tracking-tight">${e.job_title}</span>
                        <p class="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">${e.company_name || 'Hirly'}</p>
                    </div>
                </td>
                <td class="py-4 px-6">
                    ${getEventBadge(e.event_type)}
                </td>
                <td class="py-4 px-6">
                    <p class="text-xs text-gray-700 font-bold uppercase tracking-widest">${formatDate(e.created_at)}</p>
                    <p class="text-[10px] text-gray-400 font-bold">${new Date(e.created_at).toLocaleTimeString()}</p>
                </td>
                <td class="py-4 px-6">
                    <div class="flex flex-col">
                        <span class="text-[10px] text-gray-600 font-bold uppercase tracking-widest">${platformInfo}</span>
                        <span class="text-[9px] text-gray-400">${metadata.lang ? 'Lang: ' + metadata.lang.toUpperCase() : ''}</span>
                    </div>
                </td>
                <td class="py-4 px-6 text-right">
                    <button class="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm" title="View Details">
                        <i class="fas fa-info-circle text-xs"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    if (append) {
        tableBody.insertAdjacentHTML('beforeend', html);
    } else {
        tableBody.innerHTML = html || '<tr><td colspan="6" class="text-center py-12 text-gray-400 font-bold uppercase tracking-widest">No activity found</td></tr>';
    }
};
