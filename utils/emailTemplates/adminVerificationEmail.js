const { generateEmailHtmlWrapperRTL } = require('./layout');

const sendAdminVerificationEmailTemplate = (recipientName, verificationCode) => {
    const subject = 'تفعيل حسابك في منصة هايرلي';
    const mainContentHtml = `
        <p style="font-size: 16px;">مرحباً ${recipientName},</p>
        <p style="font-size: 16px;">لاحظنا أن حسابك في منصة <strong style="color: #4A90E2;">هايرلي</strong> لم يتم تفعيله بعد.</p>
        <p style="font-size: 16px;">لإكمال عملية التسجيل وتفعيل حسابك، يرجى استخدام رمز التحقق المكون من 6 أرقام أدناه:</p>
        <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 32px; letter-spacing: 5px; font-weight: bold; padding: 15px; background-color: #f5f5f5; border-radius: 8px; display: inline-block;">
                ${verificationCode}
            </div>
        </div>
        <p style="font-size: 16px;">هذا الرمز صالح لفترة محدودة. إذا كنت بحاجة إلى مساعدة، يرجى التواصل مع فريق الدعم.</p>
        <p style="font-size: 16px;">مع أطيب التحيات,<br>فريق هايرلي</p>
    `;
    return { subject, html: generateEmailHtmlWrapperRTL(subject, mainContentHtml) };
};

module.exports = sendAdminVerificationEmailTemplate;
