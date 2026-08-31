/**
 * Job Aggregator Admin JavaScript
 * 
 * Handles the job aggregation admin dashboard:
 * - Populates country checkboxes
 * - Collects selected countries and options
 * - Triggers aggregation via API
 * - Displays real-time status and logs
 */

// Middle East countries configuration
const MIDDLE_EAST_COUNTRIES = [
    { code: 'Palestine', name: '🇵🇸 Palestine', flag: '🇵🇸' },
    { code: 'United Arab Emirates', name: '🇦🇪 UAE', flag: '🇦🇪' },
    { code: 'Saudi Arabia', name: '🇸🇦 Saudi Arabia', flag: '🇸🇦' },
    { code: 'Qatar', name: '🇶🇦 Qatar', flag: '🇶🇦' },
    { code: 'Kuwait', name: '🇰🇼 Kuwait', flag: '🇰🇼' },
    { code: 'Egypt', name: '🇪🇬 Egypt', flag: '🇪🇬' },
    { code: 'Oman', name: '🇴🇲 Oman', flag: '🇴🇲' },
    { code: 'Bahrain', name: '🇧🇭 Bahrain', flag: '🇧🇭' },
    { code: 'Jordan', name: '🇯🇴 Jordan', flag: '🇯🇴' },
    { code: 'Lebanon', name: '🇱🇧 Lebanon', flag: '🇱🇧' },
    { code: 'Iraq', name: '🇮🇶 Iraq', flag: '🇮🇶' }
];

// Default keywords
const DEFAULT_KEYWORDS = [
    'software', 'marketing', 'sales', 'design', 'engineering',
    'management', 'finance', 'healthcare', 'education', 'customer service'
];

document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI
    populateCountryList();
    loadIntelligenceCategories();
    initializeEventListeners();
    loadStatus();
});

/**
 * Load intelligence hub categories/sources
 */
async function loadIntelligenceCategories() {
    const container = document.getElementById('intelligenceCategories');
    if (!container) return;

    try {
        const response = await fetch('/admin/job-aggregation-status');
        const data = await response.json();
        
        // Fetch the actual sources from a new endpoint or the status
        const sourcesResponse = await fetch('/admin/intelligence-sources');
        const sourcesData = await sourcesResponse.json();
        
        if (sourcesData.success && sourcesData.sources) {
            let html = '';
            sourcesData.sources.forEach(source => {
                html += `
                    <div class="checkbox-item">
                        <input type="checkbox" id="source_check_${source.id}" value="${source.id}" checked>
                        <label for="source_check_${source.id}">${source.name} (${source.country_code})</label>
                    </div>
                `;
            });
            container.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading intelligence categories:', error);
        container.innerHTML = '<div style="color:var(--danger)">Failed to load categories.</div>';
    }
}

/**
 * Populate country checkbox list
 */
function populateCountryList() {
    const countryList = document.getElementById('countryList');
    if (!countryList) return;

    // Palestine first (checked by default), then others
    let html = '';
    
    MIDDLE_EAST_COUNTRIES.forEach((country, index) => {
        const isPalestine = country.code === 'Palestine';
        const checked = isPalestine ? 'checked' : '';
        const priorityClass = isPalestine ? 'priority-country' : '';
        
        html += `
            <div class="checkbox-item ${priorityClass}">
                <input type="checkbox" id="country_${index}" value="${country.code}" ${checked}>
                <label for="country_${index}">${country.name}</label>
            </div>
        `;
    });

    countryList.innerHTML = html;
}

/**
 * Initialize all event listeners
 */
function initializeEventListeners() {
    // Start aggregation button
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', startAggregation);
    }

    // NEW: Start remote hub button
    const startRemoteBtn = document.getElementById('startRemoteBtn');
    if (startRemoteBtn) {
        startRemoteBtn.addEventListener('click', startRemoteAggregation);
    }

    // NEW: Stop remote hub button
    const stopRemoteBtn = document.getElementById('stopRemoteBtn');
    if (stopRemoteBtn) {
        stopRemoteBtn.addEventListener('click', stopAggregation);
    }

    // Stop aggregation button
    const stopBtn = document.getElementById('stopBtn');
    if (stopBtn) {
        stopBtn.addEventListener('click', stopAggregation);
    }

    // Test connections button
    const testConnBtn = document.getElementById('testConnBtn');
    if (testConnBtn) {
        testConnBtn.addEventListener('click', testConnections);
    }

    // Prune jobs button
    const pruneBtn = document.getElementById('pruneBtn');
    if (pruneBtn) {
        pruneBtn.addEventListener('click', pruneJobs);
    }

    // Schedule update button
    const updateScheduleBtn = document.getElementById('updateScheduleBtn');
    if (updateScheduleBtn) {
        updateScheduleBtn.addEventListener('click', updateSchedule);
    }

    // Dropdown change tracking
    const hourSelect = document.getElementById('scheduleHour');
    const minuteSelect = document.getElementById('scheduleMinute');
    if (hourSelect) hourSelect.addEventListener('change', () => hourSelect.setAttribute('data-user-changed', 'true'));
    if (minuteSelect) minuteSelect.addEventListener('change', () => minuteSelect.setAttribute('data-user-changed', 'true'));

    // Automation toggle
    const automationToggle = document.getElementById('automationToggle');
    if (automationToggle) {
        automationToggle.addEventListener('change', toggleAutomation);
    }
}

/**
 * Toggle daily automation
 */
async function toggleAutomation(e) {
    const enabled = e.target.checked;
    
    try {
        const response = await fetch('/admin/toggle-job-aggregator-automation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ enabled })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message, 'success');
            updateAutomationUI(enabled);
        } else {
            throw new Error(data.error || 'Failed to toggle automation');
        }
    } catch (error) {
        console.error('Error toggling automation:', error);
        showNotification('Error: ' + error.message, 'error');
        // Revert toggle if failed
        e.target.checked = !enabled;
    }
}

function updateAutomationUI(enabled) {
    const display = document.getElementById('automationDisplay');
    const toggle = document.getElementById('automationToggle');
    
    if (display) {
        display.textContent = enabled ? 'ACTIVE' : 'OFF';
        display.style.color = enabled ? 'var(--success)' : 'var(--text-muted)';
    }
    
    if (toggle && toggle.checked !== enabled) {
        toggle.checked = enabled;
    }
}

/**
 * Get selected countries from checkboxes
 */
function getSelectedCountries() {
    const checkboxes = document.querySelectorAll('#countryList input[type="checkbox"]:checked');
    const countries = Array.from(checkboxes).map(cb => cb.value);
    
    // If Palestine is selected, make sure it's first
    const palestineIndex = countries.indexOf('Palestine');
    if (palestineIndex > 0) {
        countries.splice(palestineIndex, 1);
        countries.unshift('Palestine');
    }
    
    return countries;
}

/**
 * Start only Remote Hub aggregation
 */
async function startRemoteAggregation() {
    const startRemoteBtn = document.getElementById('startRemoteBtn');
    const stopRemoteBtn = document.getElementById('stopRemoteBtn');
    const stopBtn = document.getElementById('stopBtn');
    const remoteKeywordsInput = document.getElementById('remoteKeywords');
    
    // Parse keywords
    const keywordsRaw = remoteKeywordsInput?.value || '';
    const keywords = keywordsRaw.split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
        
    const finalKeywords = keywords.length > 0 ? keywords : DEFAULT_KEYWORDS;
    const lookbackDays = parseInt(document.getElementById('remoteLookbackDays')?.value || '7');
    const remoteMarketFilter = document.getElementById('remoteMarketFilter')?.value || 'all';

    // Update UI
    startRemoteBtn.disabled = true;
    startRemoteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> DOMINATING...';
    if (stopRemoteBtn) stopRemoteBtn.style.display = 'block';
    if (stopBtn) stopBtn.style.display = 'block';
    
    updateWorkBadge('running', 'Running Remote Hub...');
    
    try {
        const response = await fetch('/admin/trigger-job-aggregation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sources: ['remote'],
                keywords: finalKeywords,
                lookbackDays: lookbackDays,
                remoteMarketFilter: remoteMarketFilter,
                countries: ['Global']
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Remote Hub Domination started!', 'success');
            startStatusPolling();
        } else {
            throw new Error(data.error || 'Failed to start remote aggregation');
        }
    } catch (error) {
        console.error('Error starting remote aggregation:', error);
        showNotification('Error: ' + error.message, 'error');
        startRemoteBtn.disabled = false;
        startRemoteBtn.innerHTML = '<i class="fas fa-bolt"></i> START REMOTE AGGREGATION';
        if (stopBtn) stopBtn.style.display = 'none';
        updateWorkBadge('idle', 'Idle');
    }
}

/**
 * Start the aggregation process
 */
async function startAggregation() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    // Get selected options
    const countries = getSelectedCountries();
    const deepScan = document.getElementById('deepScan')?.checked || false;
    const maxPages = parseInt(document.getElementById('maxPages')?.value || '1');
    const lookbackDays = parseInt(document.getElementById('lookbackDays')?.value || '0');
    
    // Get selected intelligence sources
    const intelligenceSources = Array.from(document.querySelectorAll('#intelligenceCategories input[type="checkbox"]:checked'))
        .map(cb => cb.value);

    // Get selected sources
    const sources = [];
    if (document.getElementById('source_jooble')?.checked) sources.push('jooble');
    if (document.getElementById('source_adzuna')?.checked) sources.push('adzuna');
    if (document.getElementById('source_intelligence')?.checked) sources.push('intelligence');
    if (document.getElementById('source_remote')?.checked) sources.push('remote');
    
    if (countries.length === 0 && !deepScan && intelligenceSources.length === 0) {
        alert('Please select at least one country or intelligence category.');
        return;
    }
    
    if (sources.length === 0) {
        alert('Please select at least one source (Jooble/Adzuna/Intelligence).');
        return;
    }
    
    // Update UI
    startBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    updateWorkBadge('running', 'Running...');
    
    try {
        const response = await fetch('/admin/trigger-job-aggregation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                countries: countries,
                intelligenceSources: intelligenceSources,
                keywords: DEFAULT_KEYWORDS,
                deepScan: deepScan,
                maxPages: maxPages,
                lookbackDays: lookbackDays,
                sources: sources
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Aggregation started in background', 'success');
            startStatusPolling();
        } else {
            throw new Error(data.error || 'Failed to start aggregation');
        }
    } catch (error) {
        console.error('Error starting aggregation:', error);
        showNotification('Error: ' + error.message, 'error');
        startBtn.style.display = 'block';
        stopBtn.style.display = 'none';
        updateWorkBadge('idle', 'Idle');
    }
}

/**
 * Stop the aggregation process
 */
async function stopAggregation() {
    try {
        const response = await fetch('/admin/stop-job-aggregation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Stop request sent', 'success');
        } else {
            throw new Error(data.error || 'Failed to stop aggregation');
        }
    } catch (error) {
        console.error('Error stopping aggregation:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

/**
 * Test API connections
 */
async function testConnections() {
    const testBtn = document.getElementById('testConnBtn');
    const testResults = document.getElementById('testResults');
    const adzunaResult = document.getElementById('adzunaResult');
    const joobleResult = document.getElementById('joobleResult');
    
    testBtn.disabled = true;
    testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
    testResults.style.display = 'block';
    adzunaResult.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing Adzuna...';
    joobleResult.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing Jooble...';
    
    try {
        const response = await fetch('/admin/test-aggregator-connections', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const adzuna = data.results.adzuna;
            const jooble = data.results.jooble;
            
            adzunaResult.innerHTML = adzuna.success 
                ? `<i class="fas fa-check-circle" style="color:var(--success)"></i> Adzuna: ${adzuna.message}`
                : `<i class="fas fa-times-circle" style="color:var(--danger)"></i> Adzuna: ${adzuna.message}`;
            
            joobleResult.innerHTML = jooble.success
                ? `<i class="fas fa-check-circle" style="color:var(--success)"></i> Jooble: ${jooble.message}`
                : `<i class="fas fa-times-circle" style="color:var(--danger)"></i> Jooble: ${jooble.message}`;
        } else {
            throw new Error(data.error || 'Test failed');
        }
    } catch (error) {
        console.error('Error testing connections:', error);
        adzunaResult.innerHTML = `<i class="fas fa-times-circle" style="color:var(--danger)"></i> Error: ${error.message}`;
        joobleResult.innerHTML = `<i class="fas fa-times-circle" style="color:var(--danger)"></i> Error: ${error.message}`;
    } finally {
        testBtn.disabled = false;
        testBtn.innerHTML = '<i class="fas fa-vial"></i> Test API Connections';
    }
}

/**
 * Prune old jobs
 */
async function pruneJobs() {
    if (!confirm('Are you sure you want to delete all external jobs older than 30 days? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch('/admin/prune-jobs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message, 'success');
        } else {
            throw new Error(data.error || 'Prune failed');
        }
    } catch (error) {
        console.error('Error pruning jobs:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

/**
 * Update aggregation schedule
 */
async function updateSchedule() {
    const hourSelect = document.getElementById('scheduleHour');
    const minuteSelect = document.getElementById('scheduleMinute');
    
    const hour = parseInt(hourSelect.value);
    const minute = parseInt(minuteSelect.value);
    
    try {
        const response = await fetch('/admin/update-job-aggregator-schedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ hour, minute })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message, 'success');
            document.getElementById('scheduleDisplay').textContent = 
                `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} daily`;
        } else {
            throw new Error(data.error || 'Update failed');
        }
    } catch (error) {
        console.error('Error updating schedule:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

/**
 * Load current status from server
 */
async function loadStatus() {
    try {
        const response = await fetch('/admin/job-aggregation-status');
        const data = await response.json();
        
        if (data.success && data.status) {
            updateStatusUI(data.status);
        }
    } catch (error) {
        console.error('Error loading status:', error);
    }
}

/**
 * Start polling for status updates
 */
let statusInterval = null;

function startStatusPolling() {
    if (statusInterval) return;
    
    statusInterval = setInterval(async () => {
        try {
            const response = await fetch('/admin/job-aggregation-status');
            const data = await response.json();
            
            if (data.success && data.status) {
                updateStatusUI(data.status);
                
                // Stop polling if not working
                if (!data.status.isWorking) {
                    clearInterval(statusInterval);
                    statusInterval = null;
                    
                    // Reset UI
                    document.getElementById('startBtn').style.display = 'block';
                    const startRemoteBtn = document.getElementById('startRemoteBtn');
                    const stopRemoteBtn = document.getElementById('stopRemoteBtn');
                    if (startRemoteBtn) {
                        startRemoteBtn.disabled = false;
                        startRemoteBtn.innerHTML = '<i class="fas fa-bolt"></i> START REMOTE';
                    }
                    if (stopRemoteBtn) stopRemoteBtn.style.display = 'none';
                    document.getElementById('stopBtn').style.display = 'none';
                    updateWorkBadge('idle', 'Idle');
                }
            }
        } catch (error) {
            console.error('Error polling status:', error);
        }
    }, 500); // Poll every 500ms for real-time feel
}

/**
 * Update UI with current status
 */
function updateStatusUI(status) {
    // Update progress
    const progressBar = document.getElementById('progressBar');
    const progressPercent = document.getElementById('progressPercent');
    const currentTask = document.getElementById('currentTask');
    
    if (progressBar) {
        progressBar.style.width = `${status.progress || 0}%`;
    }
    if (progressPercent) {
        progressPercent.textContent = `${status.progress || 0}%`;
    }
    if (currentTask) {
        if (status.isWorking) {
            currentTask.textContent = `Processing: ${status.currentCountry || '...'} (${status.completedTasks || 0}/${status.totalTasks || 0})`;
            const ratioEl = document.getElementById('tasksRatio');
            if (ratioEl) ratioEl.textContent = `${status.completedTasks || 0}/${status.totalTasks || 0}`;
        } else {
            currentTask.textContent = 'Waiting for trigger...';
            const ratioEl = document.getElementById('tasksRatio');
            if (ratioEl) ratioEl.textContent = '0/0';
        }
    }
    
    // Update stats
    const jobsFoundEl = document.getElementById('jobsFound');
    const jobsSavedEl = document.getElementById('jobsSaved');
    
    if (jobsFoundEl) jobsFoundEl.textContent = status.jobsFound || 0;
    if (jobsSavedEl) jobsSavedEl.textContent = status.jobsSaved || 0;
    
    // Update schedule display
    if (status.schedule) {
        const scheduleDisplay = document.getElementById('scheduleDisplay');
        if (scheduleDisplay) {
            // cron format: "minute hour * * *"
            const parts = status.schedule.split(' ');
            if (parts.length >= 2) {
                const minute = parts[0].padStart(2, '0');
                const hour = parts[1].padStart(2, '0');
                scheduleDisplay.textContent = `${hour}:${minute} daily`;
                
                // Also update dropdowns if they haven't been interacted with yet
                const hourSelect = document.getElementById('scheduleHour');
                const minuteSelect = document.getElementById('scheduleMinute');
                if (hourSelect && !hourSelect.getAttribute('data-user-changed')) hourSelect.value = parseInt(parts[1]);
                if (minuteSelect && !minuteSelect.getAttribute('data-user-changed')) minuteSelect.value = parseInt(parts[0]);
            }
        }
    }
    
    // Update automation status
    if (status.isAutoTriggerEnabled !== undefined) {
        updateAutomationUI(status.isAutoTriggerEnabled);
    }
    
    // Update work badge
    if (status.isWorking) {
        updateWorkBadge('running', 'Running...');
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('stopBtn').style.display = 'block';
        startStatusPolling();
    }
    
    // Update logs
    updateLogs(status.logs || []);
}

/**
 * Update work badge
 */
function updateWorkBadge(status, text) {
    const badge = document.getElementById('workBadge');
    if (!badge) return;
    
    badge.className = `badge badge-${status}`;
    badge.textContent = text;
}

/**
 * Update logs display
 */
function updateLogs(logs) {
    const logContainer = document.getElementById('logBox');
    if (!logContainer || !logs || logs.length === 0) return;
    
    // Only update if logs have changed
    const currentLogs = logContainer.getAttribute('data-logs') || '';
    const newLogsHash = JSON.stringify(logs.slice(-10));
    
    if (currentLogs === newLogsHash) return;
    
    logContainer.setAttribute('data-logs', newLogsHash);
    
    // Build HTML for logs
    const html = logs.slice(-100).map(log => {
        const time = new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        let message = log.message;
        let sourceBadge = '';
        
        // Extract source from message if it exists (e.g., "[Jobs.ps Playwright] ...")
        const sourceMatch = message.match(/^\[(.*?)\]/);
        if (sourceMatch) {
            sourceBadge = `<span class="log-source">${sourceMatch[1]}</span>`;
            message = message.replace(/^\[(.*?)\]\s*/, '');
        }

        const typeClass = log.type === 'error' ? 'log-error' : 
                         log.type === 'warn' ? 'log-warn' : 
                         log.type === 'debug' ? 'log-debug' : 
                         message.toLowerCase().includes('success') || message.toLowerCase().includes('completed') ? 'log-success' : 'log-info';

        return `
            <div class="log-line ${typeClass}">
                <span class="log-timestamp">${time}</span>
                <div class="log-message">
                    ${sourceBadge}
                    ${escapeHtml(message)}
                </div>
            </div>
        `;
    }).join('');
    
    logContainer.innerHTML = html;
    logContainer.scrollTop = logContainer.scrollHeight;
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${escapeHtml(message)}
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('notification-hiding');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize schedule dropdowns
document.addEventListener('DOMContentLoaded', function() {
    const hourSelect = document.getElementById('scheduleHour');
    if (hourSelect) {
        for (let i = 0; i < 24; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i.toString().padStart(2, '0');
            hourSelect.appendChild(option);
        }
        hourSelect.value = '3'; // Default 3 AM
    }
});
