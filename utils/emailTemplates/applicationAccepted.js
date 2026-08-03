const { generateEmailHtmlWrapperRTL } = require('./layout');

const sendApplicationAcceptedEmailTemplate = (recipientName, jobTitle, appBaseUrl) => {
    const subject = `تهانينا! تم قبول طلبك للوظيفة في هايرلي`;
    const mainContentHtml = `
        <p style="font-size: 16px;">مرحباً ${recipientName},</p>
        <p style="font-size: 16px;">يسعدنا أن نبلغك بأن طلبك للوظيفة: <strong>"${jobTitle}"</strong> قد تم قبوله!</p>
        <p style="font-size: 16px;">صاحب العمل قد اختارك للمتابعة في عملية التوظيف. يمكنك الآن تسجيل الدخول إلى لوحة التحكم الخاصة بك للتواصل معهم مباشرة.</p>
        <p style="font-size: 16px;">تهانينا على هذا الإنجاز!</p>
        <p style="margin-top: 30px; text-align: center;">
            <a href="${appBaseUrl}/dashboard.html" style="background-color: #50E3C2; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px; font-weight: bold;">
                اذهب إلى لوحة التحكم
            </a>
        </p>
        <p style="font-size: 16px; margin-top: 20px;">مع أطيب التحيات,<br>فريق هايرلي</p>
    `;
    return { subject, html: generateEmailHtmlWrapperRTL(subject, mainContentHtml, appBaseUrl) };
};

module.exports = sendApplicationAcceptedEmailTemplate;
