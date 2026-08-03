const { generateEmailHtmlWrapperRTL } = require('./layout');

const sendJobOfferEmailTemplate = (professionalName, employerName, jobTitle, offerMessage, jobId, appBaseUrl) => {
    const subject = `عرض عمل من ${employerName} لوظيفة ${jobTitle}`;
    const jobLink = `${appBaseUrl}/job_details/${jobId}`;
    
    const mainContentHtml = `
        <p style="font-size: 16px;">مرحباً ${professionalName},</p>
        <p style="font-size: 16px;">صاحب عمل مهتم بمهاراتك قام بإرسال عرض عمل مباشر إليك. يرى ${employerName} أنك مرشح ممتاز للوظيفة التالية:</p>
        <p style="font-size: 18px; font-weight: bold; color: #865D36; text-align: center;">"${jobTitle}"</p>
        <p style="font-size: 16px;">رسالة من صاحب العمل:</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
            <p style="font-size: 16px; font-style: italic; white-space: pre-wrap; text-align: right; direction: rtl;">${offerMessage}</p>
        </div>
        <p style="font-size: 16px;">نرجو منك الاطلاع على تفاصيل العرض والرد عليه من خلال زيارة صفحة الوظيفة:</p>
        <div style="text-align: center; margin-top: 30px;">
            <a href="${jobLink}" style="display: inline-block; padding: 12px 25px; background-color: #50E3C2; color: white; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                عرض تفاصيل الوظيفة
            </a>
        </div>
        <p style="font-size: 16px; margin-top: 30px;">نتمنى لك كل التوفيق في مسيرتك المهنية.</p>
        <p style="font-size: 16px;">مع أطيب التحيات,<br>فريق هايرلي</p>
    `;
    return { subject, html: generateEmailHtmlWrapperRTL(subject, mainContentHtml, appBaseUrl) };
};

module.exports = sendJobOfferEmailTemplate;
