const { generateEmailHtmlWrapperRTL } = require('./layout');

const sendGeneralWelcomeEmailTemplate = (recipientName) => {
    const subject = 'مرحباً بك في هايرلي';
    const mainContentHtml = `
        <p>مرحباً ${recipientName}،</p>
        <p>شكراً لانضمامك إلى هايرلي. نحن هنا لمساعدتك في تحقيق أهدافك المهنية.</p>
    `;
    return { subject, html: generateEmailHtmlWrapperRTL(subject, mainContentHtml) };
};

module.exports = sendGeneralWelcomeEmailTemplate;
