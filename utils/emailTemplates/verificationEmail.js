const { generateEmailHtmlWrapperRTL } = require('./layout');

const sendVerificationEmailTemplate = (verificationCode, appBaseUrl) => {
    const subject = 'تفعيل حسابك في هايرلي';
    const mainContentHtml = `
        <p style="font-size: 16px;">مرحباً بك في هايرلي!</p>
        <p style="font-size: 16px;">شكراً لتسجيلك. لتفعيل حسابك، يرجى استخدام رمز التحقق أدناه:</p>
        <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 32px; letter-spacing: 5px; font-weight: bold; padding: 15px; background-color: #f5f5f5; border-radius: 8px; display: inline-block;">
                ${verificationCode}
            </div>
        </div>
        <p style="font-size: 16px;">هذا الرمز صالح لمدة 30 دقيقة. إذا لم تقم بإنشاء حساب، يرجى تجاهل هذا البريد الإلكتروني.</p>
        <p style="font-size: 16px;">مع أطيب التحيات,<br>فريق هايرلي</p>
        <p style="text-align: center;"><a href="${appBaseUrl}/verify-email?token=${verificationCode}" style="display: inline-block; padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">تفعيل الحساب</a></p>
    `;
    return { subject, html: generateEmailHtmlWrapperRTL(subject, mainContentHtml) };
};

module.exports = sendVerificationEmailTemplate;
