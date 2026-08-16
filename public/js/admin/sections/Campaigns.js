/**
 * Campaigns Section Module
 * Handles bulk email campaigns and templates.
 */
import { getCampaignRecipients, sendEmailCampaign, getCampaignProgress } from '../core/api.js';
import { state } from '../core/state.js';
import { showToast, showConfirmationModal } from '../components/UI.js';

export const initCampaigns = () => {
    document.addEventListener('sectionLoaded', (e) => {
        if (e.detail.sectionId === 'campaigns') {
            // No initial data load needed, but could check for active campaigns
        }
    });

    const form = document.getElementById('emailCampaignForm');
    if (form) {
        setupCampaignForm(form);
    }

    const templateSelect = document.getElementById('emailTemplateSelect');
    if (templateSelect) {
        templateSelect.addEventListener('change', handleTemplateChange);
    }

    const recipientRadios = document.querySelectorAll('input[name="recipientType"]');
    recipientRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const isCustom = e.target.value === 'custom';
            document.getElementById('filteredRecipientsSection').classList.toggle('hidden', isCustom);
            document.getElementById('customRecipientsSection').classList.toggle('hidden', !isCustom);
        });
    });

    const closeProgressBtn = document.getElementById('closeCampaignProgressBtn');
    if (closeProgressBtn) {
        closeProgressBtn.addEventListener('click', () => {
            document.getElementById('emailCampaignProgressModal').classList.add('hidden');
            if (state.campaignPollingInterval) {
                clearInterval(state.campaignPollingInterval);
                state.campaignPollingInterval = null;
            }
        });
    }
};

const setupCampaignForm = (form) => {
    const sendBtn = document.getElementById('confirmSendCampaignBtn');
    const testBtn = document.getElementById('sendTestCampaignBtn');

    if (sendBtn) {
        sendBtn.addEventListener('click', () => triggerCampaign(false));
    }

    if (testBtn) {
        testBtn.addEventListener('click', () => triggerCampaign(true));
    }

    const messageArea = document.getElementById('emailMessage');
    const charCount = document.getElementById('emailMessageCharCount');
    if (messageArea && charCount) {
        messageArea.addEventListener('input', () => {
            charCount.textContent = `${messageArea.value.length} chars`;
        });
    }
};

const handleTemplateChange = (e) => {
    const template = e.target.value;
    const subjectInput = document.getElementById('emailSubject');
    const messageInput = document.getElementById('emailMessage');

    // Simple template mapping
    const templates = {
        'custom': { subject: '', message: '' },
        'id-verification': { 
            subject: 'Action Required: Verify Your Identity on Hirly', 
            message: 'Hello {name},\n\nPlease verify your identity to continue using Hirly features...' 
        },
        'professional-engagement': {
            subject: 'New Opportunities Waiting for You',
            message: 'Hello {name},\n\nWe noticed you haven\'t applied to any jobs lately. There are new matches for your profile...'
        }
        // Add more templates as needed
    };

    const selected = templates[template] || templates.custom;
    if (subjectInput) subjectInput.value = selected.subject;
    if (messageInput) messageInput.value = selected.message;
    
    // Trigger char count update
    messageInput.dispatchEvent(new Event('input'));
};

const triggerCampaign = async (isDryRun) => {
    const subject = document.getElementById('emailSubject').value.trim();
    const message = document.getElementById('emailMessage').value.trim();
    const template = document.getElementById('emailTemplateSelect').value;
    const recipientType = document.querySelector('input[name="recipientType"]:checked').value;
    
    if (!subject || !message) {
        return showToast('Subject and message are required', 'warning');
    }

    const filters = {
        userType: document.querySelector('select[name="userTypeFilter"]').value,
        idVerified: document.querySelector('select[name="idVerificationFilter"]').value
    };

    if (recipientType === 'custom') {
        const customEmails = document.getElementById('customRecipientEmails').value
            .split(',')
            .map(e => e.trim())
            .filter(e => e.includes('@'));
        
        if (customEmails.length === 0) {
            return showToast('Please enter at least one valid email', 'warning');
        }
        filters.emails = customEmails;
    }

    const campaignData = {
        subject,
        message,
        template,
        filters,
        dryRun: isDryRun
    };

    if (isDryRun) {
        const testEmail = prompt("Enter test email address:");
        if (!testEmail) return;
        campaignData.filters = { emails: [testEmail] };
        
        try {
            const res = await sendEmailCampaign(campaignData);
            showToast('Test email sent successfully', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    } else {
        showConfirmationModal(
            'Launch Campaign',
            `Are you sure you want to start this campaign? It will be sent to all matching users.`,
            async () => {
                try {
                    const res = await sendEmailCampaign(campaignData);
                    if (res.success && res.campaignId) {
                        startCampaignTracking(res.campaignId);
                    }
                } catch (err) {
                    showToast(err.message, 'error');
                }
            }
        );
    }
};

const startCampaignTracking = (campaignId) => {
    state.activeCampaignId = campaignId;
    const modal = document.getElementById('emailCampaignProgressModal');
    const progressBar = document.getElementById('campaignProgressBar');
    const statusText = document.getElementById('campaignProgressStatus');
    const statsText = document.getElementById('campaignProgressStats');
    const closeBtn = document.getElementById('closeCampaignProgressBtn');
    const resultDiv = document.getElementById('campaignResult');
    const resultMsg = document.getElementById('campaignResultMessage');

    modal.classList.remove('hidden');
    closeBtn.classList.add('hidden');
    resultDiv.classList.add('hidden');
    progressBar.style.width = '0%';

    if (state.campaignPollingInterval) clearInterval(state.campaignPollingInterval);

    state.campaignPollingInterval = setInterval(async () => {
        try {
            const data = await getCampaignProgress(campaignId);
            const p = data.progress;

            const percent = p.totalEmails > 0 ? Math.round((p.processedEmails / p.totalEmails) * 100) : 0;
            progressBar.style.width = `${percent}%`;
            statusText.textContent = p.status.toUpperCase();
            statsText.textContent = `${p.processedEmails} / ${p.totalEmails}`;

            if (p.status === 'completed' || p.status === 'failed') {
                clearInterval(state.campaignPollingInterval);
                state.campaignPollingInterval = null;
                closeBtn.classList.remove('hidden');
                resultDiv.classList.remove('hidden');
                resultMsg.textContent = p.message || `Campaign ${p.status} with ${p.successCount} successes and ${p.failureCount} failures.`;
            }
        } catch (err) {
            console.error('Campaign tracking error:', err);
        }
    }, 2000);
};
