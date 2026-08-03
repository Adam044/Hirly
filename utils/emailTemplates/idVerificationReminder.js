const { generateEmailHtmlWrapperRTL } = require('./layout');

const sendIdVerificationReminderEmailTemplate = (recipientName, appBaseUrl) => {
    const subject = 'تذكير: يرجى استكمال التحقق من الهوية';
    const mainContentHtml = `
        <p>مرحباً ${recipientName}،</p>
        <p>لاحظنا أنك لم تكمل عملية التحقق من الهوية بعد.</p>
        <p>التحقق من الهوية ضروري لضمان أمان وموثوقية منصة هايرلي.</p>
        <p>يرجى النقر على الزر أدناه لاستكمال العملية:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${appBaseUrl}/verify-identity" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">استكمال التحقق من الهوية</a>
        </div>
        <p>شكراً لتعاونك.</p>
    `;
    return { subject, html: generateEmailHtmlWrapperRTL(subject, mainContentHtml, appBaseUrl) };
};

module.exports = sendIdVerificationReminderEmailTemplate;
