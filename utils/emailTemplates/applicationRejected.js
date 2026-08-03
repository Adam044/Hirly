const { generateEmailHtmlWrapperRTL } = require('./layout');

const sendApplicationRejectedEmailTemplate = (recipientName, jobTitle, rejectionReason, appBaseUrl) => {
    const subject = `تحديث بخصوص طلبك للوظيفة في هايرلي`;
    
    let rejectionReasonHtml = '';
    if (rejectionReason && rejectionReason.trim()) {
        rejectionReasonHtml = `
            <div style="background-color: #f8f9fa; border-right: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <h4 style="color: #dc3545; margin: 0 0 10px 0; font-size: 16px;">رسالة من صاحب العمل:</h4>
                <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #495057;">${rejectionReason}</p>
            </div>
        `;
    }
    
    const mainContentHtml = `
        <p style="font-size: 16px;">مرحباً ${recipientName},</p>
        <p style="font-size: 16px;">شكراً لاهتمامك بفرصة العمل: <strong>"${jobTitle}"</strong>. لقد تلقينا عدداً كبيراً من الطلبات المتميزة لهذه الوظيفة، وبعد مراجعة متأنية، نأسف لإبلاغك بأننا لن نتمكن من المتابعة بطلبك في هذه المرحلة.</p>
        ${rejectionReasonHtml}
        <p style="font-size: 16px;">نشجعك على الاستمرار في البحث عن فرص أخرى على منصة هايرلي التي قد تكون مناسبة لخبراتك ومهاراتك.</p>
        <p style="margin-top: 30px; text-align: center;">
            <a href="${appBaseUrl}/jobs.html" style="background-color: #4A90E2; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px; font-weight: bold;">
                استعرض المزيد من الوظائف
            </a>
        </p>
        <p style="font-size: 16px; margin-top: 20px;">نتمنى لك كل التوفيق في بحثك المستقبلي.</p>
        <p style="font-size: 16px;">مع أطيب التحيات,<br>فريق هايرلي</p>
    `;
    return { subject, html: generateEmailHtmlWrapperRTL(subject, mainContentHtml, appBaseUrl) };
};

module.exports = sendApplicationRejectedEmailTemplate;
