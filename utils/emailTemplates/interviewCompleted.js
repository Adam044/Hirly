const { generateEmailHtmlWrapper } = require('./layout');

const sendInterviewCompletedEmailTemplate = (jobTitle, candidateName, appBaseUrl = process.env.APP_BASE_URL || 'https://hirly.com') => {
    const subject = `Interview Completed: ${candidateName || ''}`;
    const mainContentHtml = `
      <div style="font-family:Arial,sans-serif;color:#111">
        <h2>Interview Completed</h2>
        <p>The interview for <strong>${jobTitle || 'your job'}</strong> with <strong>${candidateName || 'the candidate'}</strong> has finished.</p>
        <p>You can review the transcript and evaluation in your employer dashboard.</p>
      </div>`;
    return { subject, html: generateEmailHtmlWrapper(subject, mainContentHtml, appBaseUrl) };
};

module.exports = sendInterviewCompletedEmailTemplate;
