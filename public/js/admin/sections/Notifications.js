/**
 * Notifications Section Module
 */
import { getJobsWithApplications, sendJobAppNotifications } from '../core/api.js';
import { state } from '../core/state.js';
import { createLoadingSpinner } from '../core/utils.js';
import { showToast, showConfirmationModal } from '../components/UI.js';

export const initNotifications = () => {
    document.addEventListener('sectionLoaded', (e) => {
        if (e.detail.sectionId === 'notifications') {
            loadNotificationsData();
        }
    });

    const sendBtn = document.getElementById('sendJobAppNotificationsBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', async () => {
            const ids = Array.from(state.selectedJobAppNotificationIds);
            if (ids.length === 0) return;

            showConfirmationModal(
                'Send Notifications',
                `Send job application alerts to ${ids.length} employers?`,
                async () => {
                    try {
                        await sendJobAppNotifications(ids);
                        showToast('Notifications sent', 'success');
                        state.selectedJobAppNotificationIds.clear();
                        loadNotificationsData();
                    } catch (err) {
                        showToast(err.message, 'error');
                    }
                }
            );
        });
    }

    const selectAll = document.getElementById('jobAppNotificationSelectAll');
    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.notification-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = e.target.checked;
                if (e.target.checked) state.selectedJobAppNotificationIds.add(cb.dataset.id);
                else state.selectedJobAppNotificationIds.delete(cb.dataset.id);
            });
            updateNotificationUI();
        });
    }
};

export const loadNotificationsData = async () => {
    const tableBody = document.getElementById('jobAppNotificationsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="4">${createLoadingSpinner('Checking applications...')}</td></tr>`;

    try {
        const response = await fetch('/admin/jobs-with-applications');
        const data = await response.json();
        if (data.success) {
            renderNotifications(data.jobs || []);
        }
    } catch (error) {
        showToast('Failed to load notifications', 'error');
    }
};

const renderNotifications = (jobs) => {
    const tableBody = document.getElementById('jobAppNotificationsTableBody');
    if (!tableBody) return;

    if (jobs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="py-12 text-center text-gray-400 font-medium">All notifications are up to date</td></tr>';
        return;
    }

    tableBody.innerHTML = jobs.map(j => `
        <tr class="hover:bg-gray-50/50 transition-all group">
            <td class="py-4 px-6 text-center">
                <input type="checkbox" class="notification-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300" data-id="${j.id}" ${state.selectedJobAppNotificationIds.has(j.id.toString()) ? 'checked' : ''}>
            </td>
            <td class="py-4 px-6">
                <div class="flex flex-col">
                    <span class="text-sm font-bold text-gray-900">${j.title}</span>
                    <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">${j.employer_company_name || 'Individual'}</span>
                </div>
            </td>
            <td class="py-4 px-6">
                <div class="flex items-center gap-2">
                    <span class="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-black border border-blue-100">${j.application_count} New Apps</span>
                    <span class="text-[10px] text-gray-400 font-medium">${j.city || 'Remote'}</span>
                </div>
            </td>
            <td class="py-4 px-6">
                <span class="${j.last_notified_at ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-current/20 shadow-sm">
                    ${j.last_notified_at ? 'Already Notified' : 'Pending'}
                </span>
            </td>
        </tr>
    `).join('');

    // Attach listeners
    tableBody.querySelectorAll('.notification-checkbox').forEach(cb => {
        cb.onchange = () => {
            if (cb.checked) state.selectedJobAppNotificationIds.add(cb.dataset.id);
            else state.selectedJobAppNotificationIds.delete(cb.dataset.id);
            updateNotificationUI();
        };
    });
};

const updateNotificationUI = () => {
    const sendBtn = document.getElementById('sendJobAppNotificationsBtn');
    if (sendBtn) {
        const count = state.selectedJobAppNotificationIds.size;
        sendBtn.disabled = count === 0;
        const span = sendBtn.querySelector('span');
        if (span) span.textContent = count > 0 ? `Send ${count} Notifications` : 'Send Notifications';
    }
};
