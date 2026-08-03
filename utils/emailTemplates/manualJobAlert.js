const { generateEmailHtmlWrapperRTL } = require('./layout');

const sendManualJobAlertsTemplate = (jobsHtml) => {
    const subject = 'فرص جديدة بانتظارك على منصة هايرلي!';
    const mainContentHtml = `
        <h2 style="font-size: 20px; color: #1e293b; margin-bottom: 20px;">فرص جديدة بانتظارك على منصة هايرلي!</h2>
        <p style="font-size: 16px; color: #555555; line-height: 1.6;">مرحباً بك،</p>
        <p style="font-size: 16px; color: #555555; line-height: 1.6;">نحن نؤمن بقدراتك ونسعى دائماً لربطك بأفضل الفرص. نقدم لك هذه القائمة المحدثة من الوظائف التي قد تلهمك وتساعدك في رحلتك المهنية.</p>
        <p style="font-size: 16px; color: #555555; line-height: 1.6;">لا تفوت فرصة التقدم لهذه الوظائف المميزة. انقر على الرابط أدناه لاستكشاف المزيد!</p>
        ${jobsHtml}
        <p style="font-size: 16px; color: #555555; margin-top: 20px;">نتمنى لك كل التوفيق في رحلتك المهنية!</p>
        <p style="font-size: 14px; color: #999999; margin-top: 10px;">مع أطيب التحيات،<br>فريق هايرلي</p>
    `;
    return { subject, html: generateEmailHtmlWrapperRTL(subject, mainContentHtml) };
};

module.exports = sendManualJobAlertsTemplate;
