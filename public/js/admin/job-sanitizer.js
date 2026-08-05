/**
 * Job Sanitizer Controller
 * Handles duplicate detection UI and bulk cleanup
 */

let duplicateClusters = [];
let jobsToDelete = new Set();
let jobsToClose = new Set();
let jobsToFix = new Set();

document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) analyzeBtn.addEventListener('click', runAnalysis);

    const confirmBtn = document.getElementById('confirmBtn');
    if (confirmBtn) confirmBtn.addEventListener('click', confirmCleanup);

    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', () => {
        document.getElementById('summaryBar').style.display = 'none';
        jobsToDelete.clear();
        jobsToClose.clear();
        jobsToFix.clear();
        renderClusters();
    });
});

async function runAnalysis() {
    const loader = document.getElementById('loader');
    const container = document.getElementById('resultsContainer');
    const timeframe = document.getElementById('timeframe').value;
    
    loader.style.display = 'block';
    container.innerHTML = '';
    jobsToDelete.clear();
    jobsToClose.clear();
    jobsToFix.clear();
    updateSummaryBar();

    try {
        const response = await fetch(`/admin/analyze-duplicates?timeframe=${encodeURIComponent(timeframe)}`);
        const data = await response.json();

        if (data.success) {
            duplicateClusters = data.clusters;
            autoSelectDuplicates();
            renderClusters();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Analysis failed:', error);
        container.innerHTML = `<div style="color:var(--danger); text-align:center; padding:50px;">Error: ${error.message}</div>`;
    } finally {
        loader.style.display = 'none';
    }
}

/**
 * Auto-selects duplicates to delete
 */
function autoSelectDuplicates() {
    duplicateClusters.forEach(cluster => {
        if (cluster.type === 'bad_source_cluster') {
            // Delete ALL jobs in a bad source cluster
            cluster.jobs.forEach(job => {
                jobsToDelete.add(String(job.id));
            });
        } else if (cluster.type === 'expired_cluster') {
            // CLOSE ALL jobs in an expired cluster (User preference: never delete)
            cluster.jobs.forEach(job => {
                jobsToClose.add(String(job.id));
            });
        } else if (cluster.type === 'same_location_cluster') {
            // Flag ALL jobs in a same location cluster for fixing
            cluster.jobs.forEach(job => {
                jobsToFix.add(String(job.id));
            });
        } else {
            // Standard duplicates: keep the newest one
            cluster.jobs.slice(1).forEach(job => {
                jobsToDelete.add(String(job.id));
            });
        }
    });
    updateSummaryBar();
}

function renderClusters() {
    const container = document.getElementById('resultsContainer');
    if (duplicateClusters.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:100px; color:var(--text-muted)">No issues found in this timeframe.</div>';
        return;
    }

    let html = '';
    duplicateClusters.forEach((cluster, clusterIndex) => {
        const isBadSource = cluster.type === 'bad_source_cluster';
        const isExpired = cluster.type === 'expired_cluster';
        const isSameLoc = cluster.type === 'same_location_cluster';
        const isSpecial = isBadSource || isExpired || isSameLoc;
        
        let borderColor = 'var(--primary)';
        let badgeText = cluster.job_count + ' Variants';
        
        if (isExpired) {
            borderColor = 'var(--danger)';
            badgeText = 'EXPIRED';
        } else if (isBadSource) {
            borderColor = 'var(--warning)';
            badgeText = 'UNRELIABLE SOURCE';
        } else if (isSameLoc) {
            borderColor = '#8b5cf6'; // Purple for Fixes
            badgeText = 'SAME CITY & COUNTRY';
        }

        html += `
            <div class="cluster-group" style="border-color: ${borderColor}">
                <div class="cluster-header">
                    <div>
                        <h3 style="margin:0">${cluster.norm_title}</h3>
                        <p style="color:var(--text-muted); font-size:12px; margin:5px 0 0">${cluster.norm_company} | ${cluster.city}</p>
                    </div>
                    <div class="badge" style="background:${borderColor}">${badgeText}</div>
                </div>
                <div class="job-grid">
                    ${cluster.jobs.map((job, jobIndex) => {
                        const jobIdStr = String(job.id);
                        const isSelected = jobsToDelete.has(jobIdStr);
                        const isToClose = jobsToClose.has(jobIdStr);
                        const isToFix = jobsToFix.has(jobIdStr);
                        const isNewest = jobIndex === 0 && !isSpecial;
                        
                        let cardClass = 'job-mini-card';
                        if (isSelected) cardClass += ' to-delete';
                        else if (isToClose) cardClass += ' to-close';
                        else if (isToFix) cardClass += ' to-fix';
                        else cardClass += ' keep';

                        return `
                            <div class="${cardClass}" id="job_${jobIdStr}">
                                ${isNewest ? '<span class="status-tag tag-keep">Newest</span>' : ''}
                                ${isSelected ? `<span class="status-tag tag-delete">${isBadSource ? 'Remove' : 'Duplicate'}</span>` : ''}
                                ${isToClose ? `<span class="status-tag tag-close">Close Listing</span>` : ''}
                                ${isToFix ? `<span class="status-tag tag-fix">Fix Location</span>` : ''}
                                <div class="job-title">${job.title}</div>
                                <div class="job-meta">
                                    <div><i class="far fa-clock"></i> ${new Date(job.created_at).toLocaleDateString()}</div>
                                    <div><i class="fas fa-database"></i> Source: ${job.source_name || 'Manual'}</div>
                                    <div style="font-family: monospace; font-size: 10px; margin-top:5px">ID: ${job.external_id || 'N/A'}</div>
                                </div>
                                <div class="action-overlay">
                                    ${isSameLoc ? `
                                        <button class="btn btn-outline" style="padding:4px 8px; font-size:11px; border-color:#8b5cf6; color:#8b5cf6" onclick="toggleJobFix('${jobIdStr}')">
                                            ${isToFix ? 'Cancel Fix' : 'Fix City to "Other"'}
                                        </button>
                                        <button class="btn btn-outline" style="padding:4px 8px; font-size:11px; border-color:var(--danger); color:var(--danger); margin-top:5px" onclick="toggleJobSelection('${jobIdStr}')">
                                            ${isSelected ? 'Keep this' : 'Delete Instead'}
                                        </button>
                                    ` : (isExpired ? `
                                        <button class="btn btn-outline" style="padding:4px 8px; font-size:11px; border-color:var(--warning); color:var(--warning)" onclick="toggleJobClose('${jobIdStr}')">
                                            ${isToClose ? 'Keep Open' : 'Mark as Closed'}
                                        </button>
                                        <button class="btn btn-outline" style="padding:4px 8px; font-size:11px; border-color:var(--danger); color:var(--danger); margin-top:5px" onclick="toggleJobSelection('${jobIdStr}')">
                                            ${isSelected ? 'Keep this' : 'Delete Instead'}
                                        </button>
                                    ` : `
                                        <button class="btn btn-outline" style="padding:4px 8px; font-size:11px" onclick="toggleJobSelection('${jobIdStr}')">
                                            ${isSelected ? 'Keep this' : (isSpecial ? 'Flag for Removal' : 'Mark as Duplicate')}
                                        </button>
                                    `)}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function toggleJobSelection(jobId) {
    const id = String(jobId);
    if (jobsToDelete.has(id)) {
        jobsToDelete.delete(id);
    } else {
        jobsToDelete.add(id);
        jobsToFix.delete(id);
        jobsToClose.delete(id);
    }
    renderClusters();
    updateSummaryBar();
}

function toggleJobClose(jobId) {
    const id = String(jobId);
    if (jobsToClose.has(id)) {
        jobsToClose.delete(id);
    } else {
        jobsToClose.add(id);
        jobsToDelete.delete(id);
        jobsToFix.delete(id);
    }
    renderClusters();
    updateSummaryBar();
}

function toggleJobFix(jobId) {
    const id = String(jobId);
    if (jobsToFix.has(id)) {
        jobsToFix.delete(id);
    } else {
        jobsToFix.add(id);
        jobsToDelete.delete(id);
        jobsToClose.delete(id);
    }
    renderClusters();
    updateSummaryBar();
}

function updateSummaryBar() {
    const bar = document.getElementById('summaryBar');
    const count = document.getElementById('removeCount');
    const closeCount = document.getElementById('closeCount');
    const fixCount = document.getElementById('fixCount');
    
    if (jobsToDelete.size > 0 || jobsToClose.size > 0 || jobsToFix.size > 0) {
        bar.style.display = 'flex';
        if (count) count.textContent = jobsToDelete.size;
        if (closeCount) closeCount.textContent = jobsToClose.size;
        if (fixCount) fixCount.textContent = jobsToFix.size;
    } else {
        bar.style.display = 'none';
    }
}

async function confirmCleanup() {
    if (jobsToDelete.size === 0 && jobsToClose.size === 0 && jobsToFix.size === 0) return;
    
    const message = `Are you sure you want to:\n- Delete ${jobsToDelete.size} jobs\n- Close ${jobsToClose.size} jobs\n- Fix ${jobsToFix.size} locations\n\nThis action cannot be undone.`;
    if (!confirm(message)) return;

    const btn = document.getElementById('confirmBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    try {
        // 1. Handle Deletions
        if (jobsToDelete.size > 0) {
            const delRes = await fetch('/admin/bulk-remove-jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobIds: Array.from(jobsToDelete) })
            });
            const delData = await delRes.json();
            if (!delData.success) throw new Error('Deletion failed: ' + delData.error);
        }

        // 2. Handle Closures
        if (jobsToClose.size > 0) {
            const closeRes = await fetch('/admin/bulk-close-jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobIds: Array.from(jobsToClose) })
            });
            const closeData = await closeRes.json();
            if (!closeData.success) throw new Error('Closing failed: ' + closeData.error);
        }

        // 3. Handle Fixes
        if (jobsToFix.size > 0) {
            const fixRes = await fetch('/admin/bulk-fix-locations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobIds: Array.from(jobsToFix) })
            });
            const fixData = await fixRes.json();
            if (!fixData.success) throw new Error('Fixing failed: ' + fixData.error);
        }

        alert('Cleanup and fixes completed successfully.');
        runAnalysis(); // Refresh
    } catch (error) {
        alert('Action failed: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}
