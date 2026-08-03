const adminVerificationEmail = require('./emailTemplates/adminVerificationEmail');
const applicationAccepted = require('./emailTemplates/applicationAccepted');
const applicationRejected = require('./emailTemplates/applicationRejected');
const companyInvite = require('./emailTemplates/companyInvite');
const emailVerificationReminder = require('./emailTemplates/emailVerificationReminder');
const employerEngagement = require('./emailTemplates/employerEngagement');
const employerMarketing = require('./emailTemplates/employerMarketing');
const professionalWelcome = require('./emailTemplates/professionalWelcome');
const generalWelcome = require('./emailTemplates/generalWelcome');
const idVerificationReminder = require('./emailTemplates/idVerificationReminder');
const interviewCompleted = require('./emailTemplates/interviewCompleted');
const interviewInvite = require('./emailTemplates/interviewInvite');
const jobApplicationNotification = require('./emailTemplates/jobApplicationNotification');
const jobOffer = require('./emailTemplates/jobOffer');
const manualJobAlert = require('./emailTemplates/manualJobAlert');
const userToProfessional = require('./emailTemplates/userToProfessional');
const verificationEmail = require('./emailTemplates/verificationEmail');
const logger = require('./logger');

const templates = {
    'admin-verification': {
        name: 'Admin Verification',
        fn: adminVerificationEmail,
        args: ['{{Recipient Name}}', '123456']
    },
    'application-accepted': {
        name: 'Application Accepted',
        fn: applicationAccepted,
        args: ['{{Recipient Name}}', '{{Job Title}}', '{{Company Name}}']
    },
    'application-rejected': {
        name: 'Application Rejected',
        fn: applicationRejected,
        args: ['{{Recipient Name}}', '{{Job Title}}', '{{Company Name}}']
    },
    'company-invite': {
        name: 'Company Invite',
        fn: companyInvite,
        args: ['{{Recipient Name}}', '{{Inviter Name}}', '{{Company Name}}', '{{Invite Link}}']
    },
    'email-verification-reminder': {
        name: 'Email Verification Reminder',
        fn: emailVerificationReminder,
        args: ['{{Recipient Name}}', '{{Verification Link}}']
    },
    'employer-engagement': {
        name: 'Employer Engagement',
        fn: employerEngagement,
        args: ['{{Recipient Name}}']
    },
    'employer-marketing': {
        name: 'Employer Marketing',
        fn: employerMarketing,
        args: []
    },
    'professional-welcome': {
        name: 'Professional Welcome',
        fn: professionalWelcome,
        args: ['{{Recipient Name}}']
    },
    'general-welcome': {
        name: 'General Welcome',
        fn: generalWelcome,
        args: ['{{Recipient Name}}']
    },
    'id-verification-reminder': {
        name: 'ID Verification Reminder',
        fn: idVerificationReminder,
        args: ['{{Recipient Name}}', '{{App Base URL}}']
    },
    'interview-completed': {
        name: 'Interview Completed',
        fn: interviewCompleted,
        args: ['{{Recipient Name}}', '{{Job Title}}']
    },
    'interview-invite': {
        name: 'Interview Invite',
        fn: interviewInvite,
        args: ['{{Recipient Name}}', '{{Job Title}}', '{{Company Name}}', '{{Date/Time}}', '{{Location/Link}}']
    },
    'job-application-notification': {
        name: 'Job Application Notification',
        fn: jobApplicationNotification,
        args: ['{{Recipient Name}}', '{{Job Title}}', '{{Applicant Name}}', '{{Application Link}}']
    },
    'job-offer': {
        name: 'Job Offer',
        fn: jobOffer,
        args: ['{{Recipient Name}}', '{{Job Title}}', '{{Company Name}}', '{{Offer Link}}']
    },
    'manual-job-alert': {
        name: 'Manual Job Alert',
        fn: manualJobAlert,
        args: ['{{Recipient Name}}', [], '{{Job Search Link}}'] // Expects jobs array
    },
    'user-to-professional': {
        name: 'User to Professional Message',
        fn: userToProfessional,
        args: ['{{Recipient Name}}', '{{Sender Name}}', '{{Message Content}}']
    },
    'verification-email': {
        name: 'Verification Email',
        fn: verificationEmail,
        args: ['{{Recipient Name}}', '{{Verification Link}}']
    }
};

const getAvailableTemplates = () => {
    return Object.keys(templates).map(id => ({
        id,
        name: templates[id].name
    }));
};

const getTemplateContent = (id) => {
    const template = templates[id];
    if (!template) {
        throw new Error('Template not found');
    }
    
    try {
        // Invoke the template function with dummy arguments
        return template.fn(...template.args);
    } catch (error) {
        logger.error(`Error rendering template ${id}:`, error);
        return { subject: 'Error', html: '<p>Error rendering template</p>' };
    }
};

module.exports = {
    getAvailableTemplates,
    getTemplateContent
};
