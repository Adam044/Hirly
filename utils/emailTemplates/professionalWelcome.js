const { generateEmailHtmlWrapperRTL } = require('./layout');

const sendFreelancerWelcomeEmailTemplate = (recipientName, appBaseUrl) => {
    const subject = 'مرحباً بك في مجتمع هايرلي للمستقلين!';
    const mainContentHtml = `
        <p>مرحباً ${recipientName}،</p>
        <p>يسعدنا انضمامك إلينا. ابدأ رحلتك المهنية الآن وتصفح أحدث المشاريع.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${appBaseUrl}/dashboard.html" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">تصفح المشاريع</a>
        </div>
    `;
    return { subject, html: generateEmailHtmlWrapperRTL(subject, mainContentHtml) };
};

module.exports = sendFreelancerWelcomeEmailTemplate;
