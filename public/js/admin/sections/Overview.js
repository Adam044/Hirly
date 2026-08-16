/**
 * Overview Section Module
 * Handles platform statistics and growth metrics.
 */
import { getDashboardStats } from '../core/api.js';
import { createLoadingSpinner } from '../core/utils.js';
import { showToast } from '../components/UI.js';

let currentRange = '30D';
let growthChart = null;

export const initOverview = () => {
    document.addEventListener('sectionLoaded', (e) => {
        if (e.detail.sectionId === 'overview') {
            loadOverviewData(currentRange);
        }
    });

    const refreshBtn = document.getElementById('refreshStatsBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            const icon = refreshBtn.querySelector('i');
            if (icon) icon.classList.add('fa-spin');
            loadOverviewData(currentRange).finally(() => {
                if (icon) icon.classList.remove('fa-spin');
            });
        });
    }

    // Graph range filters
    const rangeButtons = document.querySelectorAll('[data-range]');
    rangeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            rangeButtons.forEach(b => b.classList.remove('bg-white', 'text-indigo-600', 'shadow-sm'));
            rangeButtons.forEach(b => b.classList.add('text-gray-500'));
            
            btn.classList.remove('text-gray-500');
            btn.classList.add('bg-white', 'text-indigo-600', 'shadow-sm');
            
            currentRange = btn.dataset.range;
            loadOverviewData(currentRange);
        });
    });
};

export const loadOverviewData = async (range = '30D') => {
    const container = document.getElementById('dashboardStats');
    const chartContainer = document.querySelector('.h-80');
    if (!container || !chartContainer) return;

    // Show loading states
    if (!container.children.length) {
        container.innerHTML = createLoadingSpinner('Loading stats...');
    }
    
    try {
        const data = await getDashboardStats(range);
        if (data.success) {
            renderStats(data.stats);
        }
    } catch (error) {
        showToast('Failed to load overview statistics', 'error');
        container.innerHTML = `<div class="col-span-full py-12 text-center text-red-500 font-bold">${error.message}</div>`;
    }
};

const renderStats = (stats) => {
    const container = document.getElementById('dashboardStats');
    if (!container) return;

    const cards = [
        { label: 'Total Talent', value: stats.totalProfessionals, icon: 'fa-user-tie', color: 'indigo', trend: '+8.2%' },
        { label: 'Active Companies', value: stats.companyEmployers, icon: 'fa-building', color: 'violet', trend: '+12.5%' },
        { label: 'Live Opportunities', value: stats.openJobs, icon: 'fa-briefcase', color: 'emerald', trend: '+18.4%' },
        { label: 'Total Users', value: stats.totalUsers, icon: 'fa-users', color: 'blue', trend: '+5.1%' }
    ];

    container.innerHTML = cards.map(card => `
        <div class="saas-card stat-card-modern group cursor-pointer hover:border-indigo-200 transition-all">
            <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 rounded-xl bg-${card.color}-50 text-${card.color}-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-sm border border-${card.color}-100">
                    <i class="fas ${card.icon}"></i>
                </div>
                <div class="trend text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                    <i class="fas fa-arrow-up mr-1"></i>
                    ${card.trend}
                </div>
            </div>
            <div>
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">${card.label}</p>
                <h3 class="text-3xl font-black text-gray-900 tracking-tight">${card.value || 0}</h3>
            </div>
        </div>
    `).join('');

    // Initialize Growth Chart with real data
    initGrowthChart(stats.growthData);
    renderSystemPulse(stats.recentEvents);
};

const initGrowthChart = (growthData) => {
    const ctx = document.createElement('canvas');
    const container = document.querySelector('.h-80');
    if (!container) return;

    container.innerHTML = '';
    container.appendChild(ctx);
    container.classList.remove('flex', 'items-center', 'justify-center', 'text-gray-300', 'border-2', 'border-dashed');

    const labels = growthData.map(d => new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    const data = growthData.map(d => parseInt(d.count));

    if (growthChart) growthChart.destroy();

    growthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'New Users',
                data: data,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.05)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#6366f1',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleFont: { size: 12, weight: 'bold' },
                    bodyFont: { size: 12 },
                    padding: 12,
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { display: true, color: '#f3f4f6' },
                    ticks: { font: { weight: 'bold', size: 10 }, color: '#9ca3af' }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { weight: 'bold', size: 10 }, color: '#9ca3af' }
                }
            }
        }
    });
};

const renderSystemPulse = (events) => {
    const container = document.getElementById('systemPulseLog');
    if (!container) return;

    if (!events || !events.length) {
        container.innerHTML = '<div class="text-center py-8 text-gray-400 text-xs font-bold uppercase tracking-widest">No recent activity</div>';
        return;
    }

    const typeConfig = {
        'user': { icon: 'fa-user-plus', color: 'green', label: 'Signup' },
        'job': { icon: 'fa-briefcase', color: 'indigo', label: 'Job Posting' },
        'application': { icon: 'fa-paper-plane', color: 'blue', label: 'Application' }
    };

    container.innerHTML = events.map(ev => {
        const config = typeConfig[ev.type] || { icon: 'fa-circle', color: 'gray', label: 'Event' };
        const timeStr = new Date(ev.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 group">
                <div class="w-10 h-10 rounded-xl bg-${config.color}-50 text-${config.color}-600 flex items-center justify-center flex-shrink-0 border border-${config.color}-100 group-hover:scale-110 transition-transform">
                    <i class="fas ${config.icon} text-sm"></i>
                </div>
                <div class="flex-grow min-w-0">
                    <div class="flex justify-between items-start">
                        <p class="text-sm font-bold text-gray-900 truncate pr-2">${ev.title}</p>
                        <span class="text-[9px] font-black text-gray-400 uppercase whitespace-nowrap">${timeStr}</span>
                    </div>
                    <p class="text-[10px] text-gray-500 font-medium truncate">${ev.detail}</p>
                </div>
            </div>
        `;
    }).join('');
};
