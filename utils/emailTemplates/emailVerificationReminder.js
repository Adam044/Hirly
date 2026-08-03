const { generateEmailHtmlWrapperRTL } = require('./layout');

const sendEmailVerificationReminderEmailTemplate = (recipientName, appBaseUrl) => {
    const subject = 'تذكير: يرجى تفعيل بريدك الإلكتروني';
    const mainContentHtml = `
        <p>مرحباً ${recipientName}،</p>
        <p>يرجى تفعيل بريدك الإلكتروني لتتمكن من استخدام كافة ميزات هايرلي.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${appBaseUrl}/resend-verification" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">تفعيل البريد الإلكتروني</a>
        </div>
    `;
    return { subject, html: generateEmailHtmlWrapperRTL(subject, mainContentHtml, appBaseUrl) };
};

module.exports = sendEmailVerificationReminderEmailTemplate;
