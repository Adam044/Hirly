import { 
    getAggregatedJobs, 
    magicFetchLogo, 
    fetchLogoFromUrl, 
    updateAggregatedJobLogo, 
    bulkMagicFetchLogos, 
    getBulkLogoProgress, 
    stopBulkLogoFetch,
    deleteAggregatedJob,
    bulkRemoveJobs
} from '../core/api.js';
import { state } from '../core/state.js';
import { formatDate } from '../core/utils.js';
import { showToast, showConfirmationModal } from '../components/UI.js';

let currentJobForLogo = null;
let bulkLogoInterval = null;
let selectedJobIds = new Set();
const aggregatedJobsMap = new Map();

/**
 * Centrally manages modal visibility with forced flex centering
 * to override any conflicting CSS !important rules.
 */
const toggleModal = (modalId, show) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    if (show) {
        modal.style.cssText = ''; // Clear previous
        modal.classList.remove('hidden');
        modal.style.setProperty('display', 'flex', 'important');
        modal.style.setProperty('align-items', 'center', 'important');
        modal.style.setProperty('justify-content', 'center', 'important');
        modal.style.setProperty('visibility', 'visible', 'important');
        modal.style.setProperty('opacity', '1', 'important');
        modal.style.setProperty('z-index', '9999', 'important');
        modal.style.setProperty('position', 'fixed', 'important');
        modal.style.setProperty('top', '0', 'important');
        modal.style.setProperty('left', '0', 'important');
        modal.style.setProperty('width', '100%', 'important');
        modal.style.setProperty('height', '100%', 'important');
    } else {
        modal.style.cssText = '';
        modal.classList.add('hidden');
    }
};

// Initialize the section
export const initAggregatedJobs = () => {
    document.addEventListener('sectionLoaded', (e) => {
        if (e.detail.sectionId === 'aggregatedJobs') {
            selectedJobIds.clear();
            loadAggregatedJobsData();
        }
    });

    document.addEventListener('click', (e) => {
        handleAggregatedJobsClick(e);
    });

    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('job-checkbox')) {
            const jobId = e.target.dataset.jobId;
            if (e.target.checked) selectedJobIds.add(jobId);
            else selectedJobIds.delete(jobId);
            updateSelectAllState();
        }

        if (e.target.id === 'selectAllAggregatedJobs') {
            const checkboxes = document.querySelectorAll('.job-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = e.target.checked;
                const jobId = cb.dataset.jobId;
                if (e.target.checked) selectedJobIds.add(jobId);
                else selectedJobIds.delete(jobId);
            });
        }
    });

    setupInputListeners();
};

const updateSelectAllState = () => {
    const selectAll = document.getElementById('selectAllAggregatedJobs');
    const bulkActions = document.getElementById('aggregatedJobBulkActions');
    const countDisplay = document.getElementById('selectedAggregatedJobsCount');
    
    if (!selectAll) return;
    const checkboxes = document.querySelectorAll('.job-checkbox');
    
    const count = selectedJobIds.size;
    if (countDisplay) countDisplay.textContent = count;
    if (bulkActions) bulkActions.classList.toggle('hidden', count === 0);

    if (checkboxes.length === 0) {
        selectAll.checked = false;
        return;
    }
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    selectAll.checked = allChecked;
};

const setupInputListeners = () => {
    const searchInput = document.getElementById('aggregatorSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.filters.aggregatedJobs.search = e.target.value;
            loadAggregatedJobsData(false);
        });
    }

    const logoFilter = document.getElementById('aggregatorLogoFilter');
    if (logoFilter) {
        logoFilter.addEventListener('change', (e) => {
            state.filters.aggregatedJobs.logoStatus = e.target.value;
            loadAggregatedJobsData(false);
        });
    }

    const fileInput = document.getElementById('aggregatedLogoFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    // Paste image listener
    document.addEventListener('paste', handleImagePaste);

    document.querySelectorAll('.agg-sort-btn').forEach(btn => {
        btn.addEventListener('click', () => handleSort(btn));
    });
};

const handleAggregatedJobsClick = async (e) => {
    const target = e.target;

    // Logo button - just open modal
    const logoBtn = target.closest('.manage-logo-btn');
    if (logoBtn) {
        e.preventDefault();
        const job = aggregatedJobsMap.get(logoBtn.dataset.jobId);
        if (job) openLogoModal(job);
        return;
    }

    // Bulk logo fetch options
    const bulkOptionBtn = target.closest('.bulk-option-btn');
    if (bulkOptionBtn) {
        e.preventDefault();
        const mode = bulkOptionBtn.dataset.mode;
        showBulkFetchConfirmation(mode);
        return;
    }

    // Single job delete
    const deleteBtn = target.closest('.delete-job-btn');
    if (deleteBtn) {
        e.preventDefault();
        const jobId = deleteBtn.dataset.jobId;
        handleJobDelete(jobId);
        return;
    }

    // Bulk delete button
    const bulkDeleteBtn = target.closest('#bulkDeleteAggregatedJobsBtn');
    if (bulkDeleteBtn) {
        e.preventDefault();
        handleBulkDelete();
        return;
    }

    // Bulk logo fetch button (main) - just show dropdown (handled by CSS/HTML)
    const bulkBtn = target.closest('#bulkLogoFetchBtn');
    if (bulkBtn) {
        e.preventDefault();
        return;
    }

    // Refresh button
    const refreshBtn = target.closest('#refreshAggregatedJobsBtn');
    if (refreshBtn) {
        e.preventDefault();
        loadAggregatedJobsData(false);
        return;
    }

    // Load more button
    const loadMoreBtn = target.closest('#loadMoreAggregatedJobsBtn');
    if (loadMoreBtn) {
        e.preventDefault();
        loadAggregatedJobsData(true);
        return;
    }

    // Logo modal buttons
    const logoModalBtn = target.closest('#aggregatedJobLogoModal button');
    if (logoModalBtn) {
        await handleLogoModalClick(logoModalBtn);
        return;
    }

    // Bulk progress modal buttons
    const bulkModalBtn = target.closest('#bulkLogoProgressModal button');
    if (bulkModalBtn) {
        await handleBulkModalClick(bulkModalBtn);
        return;
    }
};

const handleJobDelete = (jobId) => {
    const job = aggregatedJobsMap.get(jobId);
    if (!job) return;

    showConfirmationModal(
        'Delete Aggregated Job?',
        `Are you sure you want to delete "${job.title}" from ${job.external_company_name}? This action is permanent.`,
        async () => {
            try {
                const response = await deleteAggregatedJob(jobId);
                if (response.success) {
                    showToast('Job deleted successfully', 'success');
                    loadAggregatedJobsData(false);
                } else {
                    showToast(response.error || 'Failed to delete job', 'error');
                }
            } catch (error) {
                showToast('Failed to delete job', 'error');
            }
        }
    );
};

const handleBulkDelete = () => {
    const count = selectedJobIds.size;
    if (count === 0) return;

    showConfirmationModal(
        'Delete Multiple Jobs?',
        `Are you sure you want to delete ${count} selected aggregated jobs? This action is permanent.`,
        async () => {
            try {
                const response = await bulkRemoveJobs(Array.from(selectedJobIds));
                if (response.success) {
                    showToast(`${count} jobs deleted successfully`, 'success');
                    selectedJobIds.clear();
                    loadAggregatedJobsData(false);
                } else {
                    showToast(response.error || 'Failed to delete jobs', 'error');
                }
            } catch (error) {
                showToast('Failed to delete jobs', 'error');
            }
        }
    );
};

const showBulkFetchConfirmation = (mode) => {
    let title = 'Start Bulk Logo Discovery?';
    let message = '';
    let count = 0;

    if (mode === 'selected') {
        count = selectedJobIds.size;
        if (count === 0) return showToast('Please select at least one job.', 'warning');
        title = `Process ${count} Selected Jobs?`;
        message = `This will attempt to find logos for the ${count} jobs you've selected.`;
    } else if (mode === 'no-logo') {
        title = 'Process Jobs with Missing Logos?';
        message = 'This will attempt to find logos for all aggregated jobs currently missing them.';
    } else {
        title = 'Process All Aggregated Jobs?';
        message = 'This will re-process every aggregated job listing to find brand assets.';
    }

    showConfirmationModal(
        title,
        message,
        () => startBulkLogoFetch(mode)
    );
};

const openLogoModal = (job) => {
    currentJobForLogo = job;
    const nameDisplay = document.getElementById('aggregatedLogoModalCompanyName');
    
    if (nameDisplay) {
        nameDisplay.textContent = job.external_company_name || 'Unknown Company';
        toggleModal('aggregatedJobLogoModal', true);
    }
};

const startBulkLogoFetch = async (mode) => {
    const bulkLogoBtn = document.getElementById('bulkLogoFetchBtn');
    const originalHtml = bulkLogoBtn ? bulkLogoBtn.innerHTML : '';
    
    try {
        if (bulkLogoBtn) {
            bulkLogoBtn.disabled = true;
            bulkLogoBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Starting...';
        }
        
        // Open modal immediately to show "Starting..." state
        toggleModal('bulkLogoProgressModal', true);
        const logsContainer = document.getElementById('bulkLogoLogs');
        if (logsContainer) logsContainer.innerHTML = '<div class="text-blue-600 font-bold uppercase tracking-widest">[System] Initializing bulk discovery...</div>';
        
        const options = { mode };
        if (mode === 'selected') options.jobIds = Array.from(selectedJobIds);

        const data = await bulkMagicFetchLogos(options);
        if (data.success) {
            pollBulkLogoProgress();
        } else {
            toggleModal('bulkLogoProgressModal', false);
            showToast(data.error || 'Failed to start bulk discovery', 'error');
        }
    } catch (error) {
        toggleModal('bulkLogoProgressModal', false);
        showToast('Failed to start bulk discovery', 'error');
    } finally {
        if (bulkLogoBtn) {
            bulkLogoBtn.disabled = false;
            bulkLogoBtn.innerHTML = originalHtml;
        }
    }
};

const pollBulkLogoProgress = () => {
    if (bulkLogoInterval) clearInterval(bulkLogoInterval);
    
    // Initial reset
    updateBulkProgressUI({ total: 0, success: 0, failed: 0, sanitized: 0, current: 0 });
    
    bulkLogoInterval = setInterval(async () => {
        try {
            const response = await getBulkLogoProgress();
            if (response.success && response.status) {
                const data = response.status;
                updateBulkProgressUI(data);
                updateBulkLogs(data.logs || []);
                
                if (!data.isWorking || data.stopRequested) {
                    clearInterval(bulkLogoInterval);
                    bulkLogoInterval = null;
                    const finishBtn = document.getElementById('finishBulkLogoBtn');
                    if (finishBtn) finishBtn.disabled = false;
                    
                    if (!data.stopRequested) {
                        showToast(`Discovery finished! Found ${data.success} logos.`, 'success');
                    } else {
                        showToast('Discovery stopped manually.', 'warning');
                    }
                }
            }
        } catch (error) {
            // Error logged on server
        }
    }, 2000);
};

const updateBulkProgressUI = (data) => {
    const elements = {
        total: document.getElementById('bulkLogoTotal'),
        success: document.getElementById('bulkLogoSuccess'),
        failed: document.getElementById('bulkLogoFailed'),
        sanitized: document.getElementById('bulkLogoSanitized'),
        bar: document.getElementById('bulkLogoProgressBar'),
        percent: document.getElementById('bulkLogoProgressPercent'),
        label: document.getElementById('bulkLogoProgressLabel')
    };
    
    if (elements.total) elements.total.textContent = data.total || 0;
    if (elements.success) elements.success.textContent = data.success || 0;
    if (elements.failed) elements.failed.textContent = data.failed || 0;
    if (elements.sanitized) elements.sanitized.textContent = data.sanitized || 0;
    
    const processed = data.current || 0;
    const total = data.total || 0;
    const percent = total > 0 ? Math.round((processed / total) * 100) : 0;
    
    if (elements.bar) elements.bar.style.width = `${percent}%`;
    if (elements.percent) elements.percent.textContent = `${percent}%`;
    
    if (elements.label) {
        if (!data.isWorking) elements.label.textContent = 'Discovery Complete';
        else if (data.stopRequested) elements.label.textContent = 'Stopping...';
        else elements.label.textContent = `Processing ${processed} of ${total}...`;
    }

    const stopBtn = document.getElementById('stopBulkLogoBtn');
    if (stopBtn) {
        stopBtn.disabled = !data.isWorking || data.stopRequested;
        if (data.stopRequested) stopBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Stopping...';
        else if (!data.isWorking) stopBtn.innerHTML = '<i class="fas fa-check mr-2"></i> Finished';
        else stopBtn.innerHTML = '<i class="fas fa-hand-paper mr-2"></i> Stop Discovery';
    }
};

const updateBulkLogs = (logs) => {
    const logsContainer = document.getElementById('bulkLogoLogs');
    if (!logsContainer || !logs.length) return;
    
    logsContainer.innerHTML = logs.map(log => {
        const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        let statusClass = 'text-blue-600'; // info
        if (log.type === 'success') statusClass = 'text-green-600';
        else if (log.type === 'error') statusClass = 'text-red-600';
        else if (log.type === 'warning') statusClass = 'text-amber-600';
        
        return `<div class="${statusClass} py-0.5 border-b border-gray-100 last:border-0"><span class="opacity-50 mr-2">${time}</span> ${log.message}</div>`;
    }).join('');
    
    logsContainer.scrollTop = logsContainer.scrollHeight;
};

const handleLogoModalClick = async (btn) => {
    const id = btn.id;
    
    if (id === 'closeAggregatedJobLogoModalBtn' || id === 'cancelAggregatedLogoBtn') {
        toggleModal('aggregatedJobLogoModal', false);
        resetLogoModal();
        return;
    }

    if (id === 'fetchLogoFromUrlBtn') {
        await handleUrlFetch(btn);
        return;
    }

    if (id === 'saveAggregatedLogoBtn') {
        await handleLogoSave(btn);
        return;
    }
};

const handleBulkModalClick = async (btn) => {
    const modal = document.getElementById('bulkLogoProgressModal');
    const id = btn.id;

    if (id === 'closeBulkLogoProgressBtn' || id === 'finishBulkLogoBtn') {
        if (bulkLogoInterval && id === 'closeBulkLogoProgressBtn') {
            if (!confirm('Discovery is still running. Close anyway?')) return;
            clearInterval(bulkLogoInterval);
            bulkLogoInterval = null;
        }
        toggleModal('bulkLogoProgressModal', false);
        if (id === 'finishBulkLogoBtn') loadAggregatedJobsData(false);
        return;
    }

    if (id === 'stopBulkLogoBtn') {
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Stopping...';
        await stopBulkLogoFetch();
        showToast('Discovery stopping...', 'info');
        return;
    }
};

const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
        window._pastedImageBlob = null; // Clear pasted image if file selected
        const reader = new FileReader();
        reader.onload = (event) => updatePreview(event.target.result);
        reader.readAsDataURL(file);
    }
};

const handleImagePaste = (e) => {
    // Only handle if modal is open
    const modal = document.getElementById('aggregatedJobLogoModal');
    if (!modal || modal.classList.contains('hidden')) return;

    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            const reader = new FileReader();
            reader.onload = (event) => {
                updatePreview(event.target.result);
                // Clear file input if image pasted
                const fileInput = document.getElementById('aggregatedLogoFileInput');
                if (fileInput) fileInput.value = '';
                
                window._pastedImageBlob = blob;
                showToast('Image pasted!', 'success');
            };
            reader.readAsDataURL(blob);
            break;
        }
    }
};

const handleSort = (btn) => {
    const sortBy = btn.dataset.sort;
    if (state.filters.aggregatedJobs.sortBy === sortBy) {
        state.filters.aggregatedJobs.sortOrder = state.filters.aggregatedJobs.sortOrder === 'DESC' ? 'ASC' : 'DESC';
    } else {
        state.filters.aggregatedJobs.sortBy = sortBy;
        state.filters.aggregatedJobs.sortOrder = 'DESC';
    }
    updateSortIcons(btn);
    loadAggregatedJobsData(false);
};

const handleUrlFetch = async (btn) => {
    const urlInput = document.getElementById('companyWebsiteUrl');
    const url = urlInput?.value?.trim();

    const statusEl = document.getElementById('fetchStatus');
    const statusText = statusEl?.querySelector('.status-text');
    const statusSpinner = statusEl?.querySelector('.status-spinner');
    
    const setStatus = (text, isError = false, isLoading = true) => {
        if (!statusEl) return;
        statusEl.classList.remove('hidden');
        if (statusText) statusText.textContent = text;
        if (statusText) statusText.className = `status-text text-[10px] font-bold uppercase tracking-widest ${isError ? 'text-red-500' : 'text-gray-500'}`;
        if (statusSpinner) statusSpinner.style.display = isLoading ? 'block' : 'none';
    };

    try {
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        if (!url) {
            setStatus('Auto-Guessing company domain...');
        } else {
            setStatus('Extracting brand assets from URL...');
        }
        
        const data = await fetchLogoFromUrl(currentJobForLogo.external_company_name, url || null);
        
        if (data.success && data.logoUrl) {
            updatePreview(data.logoUrl);
            setStatus('Brand asset discovered!', false, false);
            showToast('Logo found!', 'success');
        } else {
            setStatus(data.error || 'Could not find institutional logo.', true, false);
            showToast(data.error || 'Fetch failed', 'error');
        }
    } catch (error) {
        setStatus('Failed to connect to fetcher', true, false);
        showToast('Failed to fetch logo', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-magic mr-2"></i> Fetch Logo';
    }
};

const handleLogoSave = async (btn) => {
    if (!currentJobForLogo) return;

    const fileInput = document.getElementById('aggregatedLogoFileInput');
    const previewImage = document.getElementById('aggregatedLogoPreviewImage');
    const spinner = document.getElementById('saveAggregatedLogoSpinner');
    const modal = document.getElementById('aggregatedJobLogoModal');

    const formData = new FormData();
    formData.append('jobId', currentJobForLogo.id);
    
    const file = fileInput.files[0] || window._pastedImageBlob;
    if (file) {
        formData.append('logo', file);
    } else if (previewImage?.src) {
        formData.append('logoUrl', previewImage.src);
    } else {
        return showToast('No logo selected', 'warning');
    }

    try {
        btn.disabled = true;
        if (spinner) spinner.style.display = 'inline-block';
        
        const data = await updateAggregatedJobLogo(formData);
        if (data.success) {
            showToast('Logo updated successfully', 'success');
            toggleModal('aggregatedJobLogoModal', false);
            loadAggregatedJobsData(false);
        }
    } catch (error) {
        showToast('Failed to update logo', 'error');
    } finally {
        btn.disabled = false;
        if (spinner) spinner.style.display = 'none';
    }
};

const updatePreview = (url) => {
    const previewImage = document.getElementById('aggregatedLogoPreviewImage');
    const previewContainer = document.getElementById('aggregatedLogoPreviewContainer');
    const saveBtn = document.getElementById('saveAggregatedLogoBtn');
    
    if (previewImage) previewImage.src = url;
    if (previewContainer) previewContainer.classList.remove('hidden');
    if (saveBtn) saveBtn.disabled = false;
};

const resetLogoModal = () => {
    const previewContainer = document.getElementById('aggregatedLogoPreviewContainer');
    const previewImage = document.getElementById('aggregatedLogoPreviewImage');
    const saveBtn = document.getElementById('saveAggregatedLogoBtn');
    const fileInput = document.getElementById('aggregatedLogoFileInput');
    const websiteUrl = document.getElementById('companyWebsiteUrl');
    const statusEl = document.getElementById('fetchStatus');
    
    if (previewContainer) previewContainer.classList.add('hidden');
    if (previewImage) previewImage.src = '';
    if (saveBtn) saveBtn.disabled = true;
    if (fileInput) fileInput.value = '';
    if (websiteUrl) websiteUrl.value = '';
    if (statusEl) statusEl.classList.add('hidden');
    
    window._pastedImageBlob = null;
    currentJobForLogo = null;
};

const updateSortIcons = (activeBtn) => {
    document.querySelectorAll('.agg-sort-btn i').forEach(icon => {
        icon.className = 'fas fa-sort ml-1 text-[10px] opacity-50';
    });
    
    const icon = activeBtn.querySelector('i');
    const order = state.filters.aggregatedJobs.sortOrder;
    icon.className = `fas fa-sort-${order === 'DESC' ? 'down' : 'up'} ml-1 text-[10px] text-indigo-600 opacity-100`;
};

const loadAggregatedJobsData = async (append = false) => {
    const tableBody = document.getElementById('aggregatedJobsTableBody');
    const loadMoreContainer = document.getElementById('aggregatedJobsLoadMoreContainer');
    if (!tableBody) return;

    const p = state.pagination.aggregatedJobs;
    const f = state.filters.aggregatedJobs;

    if (!append) {
        p.page = 1;
        tableBody.innerHTML = '<tr><td colspan="6" class="py-12 text-center"><div class="flex flex-col items-center gap-2"><div class="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div><span class="text-gray-400 text-xs uppercase font-bold tracking-widest">Loading...</span></div></td></tr>';
    }

    try {
        const data = await getAggregatedJobs({
            page: p.page,
            limit: p.limit,
            search: f.search,
            logoStatus: f.logoStatus,
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
        console.error('Load error:', error);
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
            tableBody.innerHTML = '<tr><td colspan="7" class="py-12 text-center text-gray-400 font-bold uppercase tracking-widest">No aggregated jobs found</td></tr>';
        }
        return;
    }

    if (!append) aggregatedJobsMap.clear();

    const html = jobs.map(j => {
        const jobId = j.id.toString();
        aggregatedJobsMap.set(jobId, j);
        const hasLogo = j.external_company_logo && j.external_company_logo !== '' && !j.external_company_logo.includes('ui-avatars.com');
        const isSelected = selectedJobIds.has(jobId);
        const slug = window.generateJobSlug ? window.generateJobSlug(j.title, j.external_company_name) : 'job';
        
        return `
            <tr class="hover:bg-gray-50/50 transition-all group">
                <td class="py-4 px-6 text-center">
                    <input type="checkbox" class="job-checkbox rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" data-job-id="${j.id}" ${isSelected ? 'checked' : ''}>
                </td>
                <td class="py-4 px-6">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 relative group/logo cursor-pointer manage-logo-btn" data-job-id="${j.id}">
                            ${hasLogo ? `<img src="${j.external_company_logo}" class="w-full h-full object-contain">` : '<i class="fas fa-building text-gray-300"></i>'}
                            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center">
                                <i class="fas fa-edit text-white text-xs"></i>
                            </div>
                        </div>
                        <div>
                            <a href="/jobs/${j.id}/${slug}" target="_blank" class="text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors">${j.title}</a>
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
                        <button class="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-indigo-600 hover:text-white transition-all inline-flex items-center justify-center shadow-sm manage-logo-btn" data-job-id="${j.id}">
                            <i class="fas fa-image text-xs"></i>
                        </button>
                        <a href="/jobs/${j.id}/${slug}" target="_blank" class="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:bg-indigo-600 hover:text-white transition-all inline-flex items-center justify-center shadow-sm">
                            <i class="fas fa-eye text-xs"></i>
                        </a>
                        <button class="w-8 h-8 rounded-lg bg-gray-50 text-red-400 hover:bg-red-600 hover:text-white transition-all inline-flex items-center justify-center shadow-sm delete-job-btn" data-job-id="${j.id}">
                            <i class="fas fa-trash-alt text-xs"></i>
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
    updateSelectAllState();
};
