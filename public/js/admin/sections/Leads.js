/**
 * Outreach Leads Section Module
 * Handles external job leads and candidate outreach.
 */
import { getOutreachLeads, sendOutreach, updateOutreachEmail } from '../core/api.js';
import { state } from '../core/state.js';
import { createLoadingSpinner, formatDate } from '../core/utils.js';
import { showToast, showConfirmationModal } from '../components/UI.js';

export const initLeads = () => {
    document.addEventListener('sectionLoaded', (e) => {
        if (e.detail.sectionId === 'leads') {
            loadLeadsData();
        }
    });

    // Search & Filters
    const searchInput = document.getElementById('leadsSearchInput');
    const statusFilter = document.getElementById('leadsStatusFilter');
    const emailFilter = document.getElementById('leadsEmailFilter');
    const applicantSlider = document.getElementById('leadsMinApplicantsSlider');
    const sliderValue = document.getElementById('leadsMinApplicantsValue');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.filters.outreach.search = e.target.value;
            loadLeadsData();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            state.filters.outreach.status = e.target.value;
            loadLeadsData();
        });
    }

    if (emailFilter) {
        emailFilter.addEventListener('change', (e) => {
            state.filters.outreach.emailStatus = e.target.value;
            loadLeadsData();
        });
    }

    if (applicantSlider) {
        applicantSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            if (sliderValue) sliderValue.textContent = val;
            state.filters.outreach.minApplicants = val;
            loadLeadsData();
        });
    }

    // Refresh Button
    const refreshBtn = document.getElementById('refreshLeadsBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadLeadsData();
        });
    }

    // Load More
    const loadMoreBtn = document.getElementById('loadMoreLeadsBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            loadLeadsData(true);
        });
    }

    // Delegation for table actions
    const tableBody = document.getElementById('leadsTableBody');
    if (tableBody) {
        tableBody.addEventListener('click', handleTableActions);
    }
};

export const loadLeadsData = async (append = false) => {
    const tableBody = document.getElementById('leadsTableBody');
    const loadMoreContainer = document.getElementById('leadsLoadMoreContainer');
    if (!tableBody) return;

    const p = state.pagination.outreach;
    const f = state.filters.outreach;

    if (p.loading) return;

    if (!append) {
        p.page = 1;
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-12">${createLoadingSpinner('Searching leads...')}</td></tr>`;
    }

    p.loading = true;

    try {
        const params = {
            page: p.page,
            limit: p.limit,
            search: f.search,
            status: f.status,
            minApplicants: f.minApplicants,
            emailStatus: f.emailStatus
        };

        const data = await getOutreachLeads(params);
        if (data.success) {
            renderLeads(data.leads || [], append);
            p.hasMore = data.pagination.hasMore;
            p.page++;

            if (loadMoreContainer) {
                loadMoreContainer.classList.toggle('hidden', !p.hasMore);
            }
        }
    } catch (error) {
        showToast('Failed to load outreach leads', 'error');
        if (!append) tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-red-500 font-bold">Error loading leads</td></tr>';
    } finally {
        p.loading = false;
    }
};

const renderLeads = (leads, append) => {
    const tableBody = document.getElementById('leadsTableBody');
    if (!tableBody) return;

    const html = leads.map(l => {
        const selectedLang = state.leadLanguages.get(l.id.toString()) || 'en';
        return `
            <tr class="hover:bg-gray-50/50 transition-all group">
                <td class="py-4 px-6">
                    <div class="flex flex-col">
                        <a href="/jobs/${l.id}" target="_blank" class="text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors">${l.title}</a>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Job #${l.id}</p>
                    </div>
                </td>
                <td class="py-4 px-6">
                    <div class="flex flex-col gap-2">
                        <p class="text-sm text-gray-700 font-bold uppercase tracking-tight">${l.external_company_name || 'Unknown'}</p>
                        <div class="flex items-center gap-2 group/email">
                            <div class="relative flex-grow">
                                <i class="fas fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400"></i>
                                <input type="email" 
                                    class="external-email-input w-full bg-white border border-gray-200 text-[10px] text-indigo-600 font-bold rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                    value="${l.external_company_email || ''}" 
                                    placeholder="Insert company email..."
                                    data-id="${l.id}">
                            </div>
                            <button class="save-email-btn w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm opacity-0 group-hover/email:opacity-100" 
                                data-id="${l.id}" title="Save Email">
                                <i class="fas fa-check text-xs"></i>
                            </button>
                        </div>
                    </div>
                </td>
                <td class="py-4 px-6">
                    <span class="${l.auto_outreach_sent ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm">
                        ${l.auto_outreach_sent ? 'Sent' : 'Pending'}
                    </span>
                    <div class="flex items-center mt-2 bg-gray-100 rounded-lg p-0.5 border border-gray-200 w-fit">
                        <button class="px-2 py-0.5 text-[9px] font-bold rounded-md transition-all lang-toggle-btn ${selectedLang === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}" 
                            data-id="${l.id}" data-lang="en">EN</button>
                        <button class="px-2 py-0.5 text-[9px] font-bold rounded-md transition-all lang-toggle-btn ${selectedLang === 'ar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}" 
                            data-id="${l.id}" data-lang="ar">AR</button>
                    </div>
                </td>
                <td class="py-4 px-6">
                    <div class="flex flex-col gap-1.5">
                        <span class="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit shadow-sm">
                            ${l.applicant_count} Applicants
                        </span>
                        ${l.high_match_count > 0 ? `
                            <span class="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit shadow-sm">
                                <i class="fas fa-magic mr-1"></i> ${l.high_match_count} Elite Match
                            </span>
                        ` : ''}
                    </div>
                </td>
                <td class="py-4 px-6">
                    <div class="flex flex-col">
                        <p class="text-xs text-gray-700 font-bold uppercase tracking-widest">${l.deadline ? formatDate(l.deadline) : 'No Deadline'}</p>
                        ${l.deadline && new Date(l.deadline) < new Date() ? 
                            '<p class="text-[10px] text-red-600 font-bold uppercase tracking-wider mt-0.5">Expired</p>' : 
                            '<p class="text-[10px] text-green-600 font-bold uppercase tracking-wider mt-0.5">Active</p>'}
                    </div>
                </td>
                <td class="py-4 px-6 text-right">
                    <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <a href="/jobs/${l.id}" target="_blank" class="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm" title="View on Hirly">
                            <i class="fas fa-eye text-xs"></i>
                        </a>
                        <button class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm send-outreach-self-btn" data-id="${l.id}" title="Test Send">
                            <i class="fas fa-flask text-xs"></i>
                        </button>
                        <button class="w-10 h-10 rounded-xl ${l.auto_outreach_sent ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'} transition-all flex items-center justify-center send-outreach-employer-btn" data-id="${l.id}">
                            <i class="fas fa-paper-plane text-sm"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    if (append) {
        tableBody.insertAdjacentHTML('beforeend', html);
    } else {
        tableBody.innerHTML = html;
    }
};

const handleTableActions = async (e) => {
    const saveEmailBtn = e.target.closest('.save-email-btn');
    const sendTestBtn = e.target.closest('.send-outreach-self-btn');
    const sendEmployerBtn = e.target.closest('.send-outreach-employer-btn');
    const langBtn = e.target.closest('.lang-toggle-btn');

    if (saveEmailBtn) {
        const jobId = saveEmailBtn.dataset.id;
        const input = document.querySelector(`.external-email-input[data-id="${jobId}"]`);
        const email = input.value.trim();
        if (!email) return showToast('Please enter an email', 'warning');
        
        try {
            await updateOutreachEmail(jobId, email);
            showToast('Email updated successfully', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    if (langBtn) {
        const jobId = langBtn.dataset.id;
        const lang = langBtn.dataset.lang;
        state.leadLanguages.set(jobId.toString(), lang);
        loadLeadsData(); // Refresh current page view
    }

    if (sendTestBtn) {
        const jobId = sendTestBtn.dataset.id;
        const lang = state.leadLanguages.get(jobId.toString()) || 'en';
        const testEmail = prompt("Enter test email:");
        if (!testEmail) return;
        
        try {
            await sendOutreach(jobId, testEmail, lang);
            showToast(`Test sent to ${testEmail}`, 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    if (sendEmployerBtn) {
        const jobId = sendEmployerBtn.dataset.id;
        const lang = state.leadLanguages.get(jobId.toString()) || 'en';
        showConfirmationModal(
            'Confirm Outreach',
            `Send <b>${lang.toUpperCase()}</b> outreach email to employer?`,
            async () => {
                try {
                    await sendOutreach(jobId, null, lang);
                    showToast('Outreach sent to employer', 'success');
                    loadLeadsData();
                } catch (err) {
                    showToast(err.message, 'error');
                }
            }
        );
    }
};
