/**
 * Email Load Balancer Section Module
 * Monitors email throughput and sender health.
 */
import { getEmailStats } from '../core/api.js';
import { showToast } from '../components/UI.js';

export const initBalancer = () => {
    document.addEventListener('sectionLoaded', (e) => {
        if (e.detail.sectionId === 'balancer') {
            loadBalancerData();
        }
    });
};

export const loadBalancerData = async () => {
    const s1Email = document.getElementById('sender1Email');
    const s2Email = document.getElementById('sender2Email');
    if (!s1Email || !s2Email) return;

    try {
        const data = await getEmailStats();
        if (data.success && data.stats.emailStats) {
            updateSenderUI('1', data.stats.emailStats.sender1);
            updateSenderUI('2', data.stats.emailStats.sender2);
        }
    } catch (error) {
        showToast('Failed to load balancer statistics', 'error');
    }
};

const updateSenderUI = (num, sender) => {
    const email = document.getElementById(`sender${num}Email`);
    const count = document.getElementById(`sender${num}Count`);
    const progress = document.getElementById(`sender${num}Progress`);
    const percent = document.getElementById(`sender${num}Percent`);

    if (email) email.textContent = sender.email;
    if (count) count.textContent = sender.count;

    const limit = 500; // Standard daily limit
    const p = Math.min(Math.round((sender.count / limit) * 100), 100);
    
    if (progress) progress.style.width = `${p}%`;
    if (percent) percent.textContent = p;

    // Color coding based on usage
    if (p > 90) {
        progress.classList.replace('bg-indigo-500', 'bg-red-500');
        progress.classList.replace('bg-blue-500', 'bg-red-500');
    } else if (p > 70) {
        progress.classList.replace('bg-indigo-500', 'bg-amber-500');
        progress.classList.replace('bg-blue-500', 'bg-amber-500');
    }
};
