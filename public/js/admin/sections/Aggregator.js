/**
 * Job Aggregator Section Module
 * Handles job intelligence sources management.
 */
import { getJobSources, triggerSourceScan, deleteJobSource, saveJobSource } from '../core/api.js';
import { createLoadingSpinner } from '../core/utils.js';
import { showToast, showConfirmationModal } from '../components/UI.js';

export const initAggregator = () => {
    document.addEventListener('sectionLoaded', (e) => {
        if (e.detail.sectionId === 'aggregator') {
            loadSourcesData();
        }
    });

    const refreshBtn = document.getElementById('refreshAggregatorBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadSourcesData);
    }
    
    const addSourceBtn = document.getElementById('addSourceBtn');
    if (addSourceBtn) {
        addSourceBtn.addEventListener('click', () => {
            // Modal logic for adding source
            showToast('Add source modal not implemented yet', 'info');
        });
    }
};

export const loadSourcesData = async () => {
    const tableBody = document.getElementById('jobSourcesTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="7">${createLoadingSpinner('Loading sources...')}</td></tr>`;

    try {
        const data = await getJobSources();
        if (data.success) {
            renderSources(data.sources);
        }
    } catch (error) {
        showToast('Failed to load intelligence sources', 'error');
    }
};

const renderSources = (sources) => {
    const tableBody = document.getElementById('jobSourcesTableBody');
    if (!tableBody) return;

    if (!sources || !sources.length) {
        tableBody.innerHTML = `<tr><td colspan="6" class="py-12 text-center text-gray-400 font-bold uppercase tracking-widest">No sources found</td></tr>`;
        return;
    }

    tableBody.innerHTML = sources.map(s => `
        <tr class="hover:bg-gray-50/50 transition-all group">
            <td class="py-4 px-6">
                <div class="flex flex-col">
                    <p class="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">${s.name}</p>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Priority: ${s.priority || 100}</p>
                </div>
            </td>
            <td class="py-4 px-6">
                <span class="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200 uppercase tracking-widest">
                    ${s.type}
                </span>
            </td>
            <td class="py-4 px-6">
                <div class="flex items-center gap-2">
                    <span class="text-lg">${s.country_code === 'PS' ? '🇵🇸' : s.country_code === 'AE' ? '🇦🇪' : '🌍'}</span>
                    <span class="text-xs text-gray-700 font-medium">${s.country_code || 'Global'}</span>
                </div>
            </td>
            <td class="py-4 px-6">
                <div class="text-[10px] text-gray-400 font-medium">
                    ${s.last_sync ? new Date(s.last_sync).toLocaleString() : 'Never Scanned'}
                </div>
            </td>
            <td class="py-4 px-6">
                <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full ${s.active ? 'bg-green-500' : 'bg-gray-300'}"></div>
                    <span class="text-[10px] font-bold uppercase tracking-wider ${s.active ? 'text-green-600' : 'text-gray-400'}">${s.active ? 'Active' : 'Inactive'}</span>
                </div>
            </td>
            <td class="py-4 px-6 text-right">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm trigger-scan-btn" data-id="${s.id}">
                        <i class="fas fa-sync-alt text-xs"></i>
                    </button>
                    <button class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center shadow-sm delete-source-btn" data-id="${s.id}">
                        <i class="fas fa-trash-alt text-xs"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    // Attach listeners
    tableBody.querySelectorAll('.trigger-scan-btn').forEach(btn => {
        btn.onclick = async () => {
            try {
                const icon = btn.querySelector('i');
                icon.classList.add('fa-spin');
                await triggerSourceScan(btn.dataset.id);
                showToast('Scan triggered successfully', 'success');
                loadSourcesData();
            } catch (err) { 
                showToast(err.message, 'error'); 
            } finally {
                btn.querySelector('i').classList.remove('fa-spin');
            }
        };
    });

    tableBody.querySelectorAll('.delete-source-btn').forEach(btn => {
        btn.onclick = () => {
            showConfirmationModal('Delete Source', 'Are you sure you want to remove this intelligence source?', async () => {
                try {
                    await deleteJobSource(btn.dataset.id);
                    showToast('Source deleted', 'success');
                    loadSourcesData();
                } catch (err) { showToast(err.message, 'error'); }
            });
        };
    });
};
