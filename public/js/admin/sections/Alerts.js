/**
 * Job Alerts Section Module
 */
import { getJobs } from '../core/api.js';
import { state } from '../core/state.js';
import { createLoadingSpinner, formatDate } from '../core/utils.js';
import { showToast } from '../components/UI.js';

export const initAlerts = () => {
    document.addEventListener('sectionLoaded', (e) => {
        if (e.detail.sectionId === 'alerts') {
            loadAlertsData();
        }
    });

    const searchInput = document.getElementById('jobAlertSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            loadAlertsData(e.target.value);
        });
    }

    const broadcastBtn = document.getElementById('sendAlertsBtn');
    if (broadcastBtn) {
        broadcastBtn.addEventListener('click', handleBroadcast);
    }

    const selectAll = document.getElementById('selectAllAlertJobs');
    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.job-alert-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
        });
    }
};

const handleBroadcast = async () => {
    const selectedCheckboxes = document.querySelectorAll('.job-alert-checkbox:checked');
    const jobIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    if (jobIds.length === 0) {
        return showToast('Please select at least one job', 'warning');
    }

    showConfirmationModal(
        'Broadcast Alerts',
        `Send job alerts for ${jobIds.length} selected jobs?`,
        async () => {
            try {
                const response = await fetch('/admin/broadcast-job-alerts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jobIds })
                });
                const data = await response.json();
                if (data.success) {
                    showToast('Alerts broadcasted successfully', 'success');
                    loadAlertsData();
                } else {
                    showToast(data.error || 'Failed to broadcast alerts', 'error');
                }
            } catch (err) {
                showToast(err.message, 'error');
            }
        }
    );
};

export const loadAlertsData = async (search = '') => {
    const tableBody = document.getElementById('jobAlertsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="6">${createLoadingSpinner('Loading alerts...')}</td></tr>`;

    try {
        const data = await getJobs({ search, t: Date.now() });
        if (data.success) {
            renderAlerts(data.jobs || []);
        }
    } catch (error) {
        showToast('Failed to load job alerts', 'error');
    }
};

const renderAlerts = (jobs) => {
    const tableBody = document.getElementById('jobAlertsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = jobs.map(j => `
        <tr class="hover:bg-gray-50/50 transition-all group">
            <td class="py-4 px-6 text-center">
                <input type="checkbox" class="job-alert-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300" value="${j.id}">
            </td>
            <td class="py-4 px-6 text-sm text-gray-900 font-bold">${j.title}</td>
            <td class="py-4 px-6 text-sm text-gray-700 font-medium">${j.employer_company_name || 'N/A'}</td>
            <td class="py-4 px-6">
                <span class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 uppercase tracking-widest">
                    ${j.category || 'N/A'}
                </span>
            </td>
            <td class="py-4 px-6 text-xs text-gray-500 font-medium">${j.city || 'N/A'}</td>
            <td class="py-4 px-6 text-center">
                ${j.last_alert_sent_at 
                    ? `<span class="text-green-600 bg-green-50 border border-green-100 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider"><i class="fas fa-check mr-1"></i> ${formatDate(j.last_alert_sent_at)}</span>` 
                    : '<span class="text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">Never Sent</span>'}
            </td>
        </tr>
    `).join('');
};
