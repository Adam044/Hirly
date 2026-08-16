const { generateEmailHtmlWrapperRTL } = require('./layout');

const sendProfessionalEngagementEmailTemplate = (recipientName = 'مبدعنا العزيز', appBaseUrl = process.env.APP_BASE_URL || 'https://www.hirly.net') => {
    const subject = '✨ أكثر من 600 وظيفة بانتظارك! ابدأ رحلتك على هايرلي الآن';
    
    const contentHtml = `
        <!-- Preheader -->
        <div style="display:none !important; visibility:hidden; mso-hide:all; opacity:0; color:transparent; height:0; width:0;">
            وظائف من البنوك، المؤسسات الدولية، والشركات الكبرى. لا تفوت فرصتك اليوم.
        </div>

        <!-- Hero Section -->
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #0f172a; font-size: 26px; font-weight: 800; margin-bottom: 16px; line-height: 1.3;">
                مرحباً ${recipientName}.. مستقبلك يبدأ هنا! 🚀
            </h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.7; margin-bottom: 24px;">
                هل تعلم أن هناك أكثر من <strong>600 فرصة عمل</strong> مفتوحة الآن على هايرلي؟ من كبرى البنوك الفلسطينية إلى المنظمات الدولية والشركات الناشئة المبدعة.
            </p>
            <a href="${appBaseUrl}/talent.html" style="display: inline-block; background-color: #6366f1; color: #ffffff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);">
                تصفح 600+ وظيفة الآن
            </a>
        </div>

        <!-- Engagement Grid -->
        <div style="background-color: #f8fafc; padding: 25px; border-radius: 16px; margin-bottom: 35px; border: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 20px; color: #1e293b; font-size: 18px; font-weight: 700; text-align: center;">لماذا هايرلي هو خيارك الأفضل؟</h3>
            
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td style="padding-bottom: 20px;">
                        <div style="display: flex; align-items: flex-start; gap: 12px;">
                            <div style="background-color: #e0e7ff; color: #4338ca; padding: 8px; border-radius: 8px; font-weight: bold;">01</div>
                            <div>
                                <div style="font-weight: 700; color: #1e293b;">وظائف موثوقة حصراً</div>
                                <div style="font-size: 14px; color: #64748b;">نحن نقوم بتنقية الوظائف لضمان وصولك للشركات الحقيقية فقط.</div>
                            </div>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td style="padding-bottom: 20px;">
                        <div style="display: flex; align-items: flex-start; gap: 12px;">
                            <div style="background-color: #dcfce7; color: #15803d; padding: 8px; border-radius: 8px; font-weight: bold;">02</div>
                            <div>
                                <div style="font-weight: 700; color: #1e293b;">ملف شخصي فاخر (Luxe)</div>
                                <div style="font-size: 14px; color: #64748b;">ابهر أصحاب العمل بملف شخصي احترافي يعكس مهاراتك الحقيقية.</div>
                            </div>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>
                        <div style="display: flex; align-items: flex-start; gap: 12px;">
                            <div style="background-color: #fef3c7; color: #b45309; padding: 8px; border-radius: 8px; font-weight: bold;">03</div>
                            <div>
                                <div style="font-weight: 700; color: #1e293b;">تنبيهات ذكية</div>
                                <div style="font-size: 14px; color: #64748b;">كن أول من يعلم عند نشر وظائف تناسب تخصصك.</div>
                            </div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- CTA Section -->
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); border-radius: 16px; padding: 35px; color: #ffffff;">
                <h3 style="margin: 0 0 12px; color: #ffffff; font-size: 20px; font-weight: 800;">فرصتك القادمة بانتظارك!</h3>
                <p style="margin: 0 0 25px; color: #e0e7ff; font-size: 15px; line-height: 1.6;">
                    انضم إلى آلاف المهنيين الذين يستخدمون هايرلي يومياً لبناء مستقبلهم المهني.
                </p>
                <a href="${appBaseUrl}/talent.html" style="display: inline-block; background-color: #ffffff; color: #4f46e5; padding: 16px 35px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">
                    اكتشف الوظائف الآن
                </a>
            </div>
        </div>

        <!-- Closing -->
        <div style="text-align: center; margin-top: 30px;">
            <p style="font-size: 14px; color: #64748b;">
                نتمنى لك كل التوفيق في رحلتك المهنية!<br>
                <strong>فريق هايرلي</strong>
            </p>
        </div>
    `;

    return { subject, html: generateEmailHtmlWrapperRTL(subject, contentHtml, appBaseUrl) };
};

module.exports = sendProfessionalEngagementEmailTemplate;