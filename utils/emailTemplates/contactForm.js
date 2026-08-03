const { generateEmailHtmlWrapperRTL } = require('./layout');

const sendContactFormEmailTemplate = (formData) => {
    const subject = `استفسار من نموذج الاتصال - ${formData.subject}`;
    const mainContentHtml = `
        <p><strong>الموضوع:</strong> ${formData.subject}</p>
        <p><strong>الرسالة:</strong></p>
        <p style="background: #f9f9f9; padding: 15px; border-radius: 5px;">${formData.message.replace(/\n/g, '<br>')}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <h3>تفاصيل المرسل:</h3>
        <p><strong>الاسم:</strong> ${formData.name}</p>
        <p><strong>البريد الإلكتروني:</strong> ${formData.email}</p>
    `;
    return { subject, html: generateEmailHtmlWrapperRTL(subject, mainContentHtml) };
};

module.exports = sendContactFormEmailTemplate;
