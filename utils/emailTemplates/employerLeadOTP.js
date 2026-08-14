const { generateEmailHtmlWrapperRTL } = require('./layout');

const sendEmployerLeadOTPTemplate = (otpCode, jobTitle, appBaseUrl = 'https://hirly.net') => {
    const subject = `رمز التحقق الخاص بك لمراجعة مرشحي وظيفة ${jobTitle}`;
    
    const contentHtml = `
        <h2 style="color: #1e293b; font-size: 22px; margin-bottom: 20px; font-weight: 800;">مرحباً،</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.8; margin-bottom: 30px;">
            لقد طلبت رمز تحقق للوصول إلى قائمة المرشحين لوظيفة <strong>${jobTitle}</strong> على منصة Hirly.
        </p>
        
        <div style="background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 16px; padding: 35px; text-align: center; margin-bottom: 30px;">
            <p style="color: #64748b; font-size: 14px; margin-bottom: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">رمز التحقق الخاص بك هو:</p>
            <div style="font-size: 42px; font-weight: 900; color: #6366f1; letter-spacing: 6px; line-height: 1;">${otpCode}</div>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 15px;">هذا الرمز صالح لمدة 15 دقيقة فقط.</p>
        </div>

        <p style="color: #64748b; font-size: 14px; line-height: 1.8; margin-bottom: 0;">
            إذا لم تطلب هذا الرمز، يمكنك تجاهل هذا البريد الإلكتروني بأمان.
        </p>
    `;

    return { subject, html: generateEmailHtmlWrapperRTL(subject, contentHtml, appBaseUrl) };
};

module.exports = sendEmployerLeadOTPTemplate;
