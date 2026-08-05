const { generateEmailHtmlWrapperRTL } = require('./layout');

const sendAccountActivationEmailTemplate = (activationCode, firstName) => {
    const subject = 'رمز الدخول إلى هايرلي | Hirly Login Code';
    const mainContentHtml = `
        <div style="text-align: right; direction: rtl;">
            <p style="font-size: 16px;">مرحباً ${firstName || 'بك'} مجدداً في هايرلي!</p>
            <p style="font-size: 16px;">إليك رمز الدخول الخاص بك لإتمام عملية تسجيل الدخول:</p>
            <div style="text-align: center; margin: 30px 0;">
                <div style="font-size: 32px; letter-spacing: 5px; font-weight: bold; padding: 15px; background-color: #f5f5f5; border-radius: 8px; display: inline-block; color: #1e293b;">
                    ${activationCode}
                </div>
            </div>
            <p style="font-size: 14px; color: #64748b;">هذا الرمز صالح لمدة 15 دقيقة.</p>
            
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;">
            
            <div style="direction: ltr; text-align: left;">
                <p style="font-size: 16px;">Hi again ${firstName || ''}!</p>
                <p style="font-size: 16px;">Here is your login code to complete your sign-in:</p>
                <p style="font-size: 14px; color: #64748b;">This code is valid for 15 minutes.</p>
            </div>
        </div>
    `;
    return { subject, html: generateEmailHtmlWrapperRTL(subject, mainContentHtml) };
};

module.exports = sendAccountActivationEmailTemplate;
