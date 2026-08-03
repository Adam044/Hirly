const { generateEmailHtmlWrapperRTL } = require('./layout');

const sendUserToFreelancerEmailTemplate = (senderDetails, subject, message) => {
    const mainContentHtml = `
        <div style="border-right: 4px solid #2563eb; padding-right: 20px; margin-bottom: 25px;">
            <h2 style="color: #1e293b; margin: 0 0 10px 0; font-size: 20px;">رسالة جديدة من ${senderDetails.firstName} ${senderDetails.lastName}</h2>
            <p style="color: #64748b; margin: 0; font-size: 14px;">تم الإرسال عبر منصة هايرلي</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 16px;">الموضوع: ${subject}</h3>
            <div style="color: #374151; line-height: 1.6; font-size: 15px;">
                ${message.replace(/\n/g, '<br>')}
            </div>
        </div>
        
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h4 style="color: #1e40af; margin: 0 0 10px 0; font-size: 14px;">معلومات المرسل:</h4>
            <p style="color: #1e40af; margin: 0; font-size: 14px;">
                <strong>الاسم:</strong> ${senderDetails.firstName} ${senderDetails.lastName}<br>
                <strong>البريد الإلكتروني:</strong> ${senderDetails.email}
            </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="mailto:${senderDetails.email}?subject=رد: ${subject}" 
               class="button">
                الرد على ${senderDetails.firstName}
            </a>
        </div>
    `;
    
    return { subject: `[هايرلي] ${subject}`, html: generateEmailHtmlWrapperRTL(`[هايرلي] ${subject}`, mainContentHtml) };
};

module.exports = sendUserToFreelancerEmailTemplate;
