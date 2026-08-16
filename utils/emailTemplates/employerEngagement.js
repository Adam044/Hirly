const { generateEmailHtmlWrapperRTL } = require('./layout');

const sendEmployerEngagementEmailTemplate = (recipientName = 'شريكنا العزيز', appBaseUrl = process.env.APP_BASE_URL || 'https://www.hirly.net') => {
    const subject = '🚀 هل تتوجه لتوظيف أفضل الكفاءات؟ اكتشف ما فاتك على هايرلي';
    
    const contentHtml = `
        <!-- Preheader -->
        <div style="display:none !important; visibility:hidden; mso-hide:all; opacity:0; color:transparent; height:0; width:0;">
            أكثر من 600 وظيفة و130+ مؤسسة رائدة تثق بهايرلي. لا تترك مقعدك شاغراً.
        </div>

        <!-- Hero Section -->
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #0f172a; font-size: 26px; font-weight: 800; margin-bottom: 16px; line-height: 1.3;">
                مرحباً ${recipientName}.. هل شركتك بين الـ 130 مؤسسة النشطة؟ 💼
            </h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.7; margin-bottom: 24px;">
                نحن ننمو بسرعة! انضم إلى مجتمع يضم أكثر من <strong>130 مؤسسة رائدة</strong>، تشمل البنوك الوطنية، المؤسسات الحكومية، والمنظمات الدولية التي اختارت <strong>هايرلي</strong> كشريكها التقني الأول للتوظيف.
            </p>
            <div style="margin-bottom: 25px;">
                <p style="color: #ef4444; font-weight: 700; font-size: 18px; margin-bottom: 15px;">⚠️ هناك أكثر من 600 وظيفة نشطة حالياً على المنصة!</p>
            </div>
            <a href="${appBaseUrl}/hire_dashboard.html" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);">
                إدارة توظيفك الآن
            </a>
        </div>

        <!-- Stats Grid -->
        <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 25px; border-radius: 16px; margin-bottom: 35px; border: 1px solid #e2e8f0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td width="33%" style="text-align: center; border-left: 1px solid #cbd5e1;">
                        <div style="font-size: 28px; font-weight: 900; color: #1e293b;">600+</div>
                        <div style="font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-top: 5px;">وظيفة منشورة</div>
                    </td>
                    <td width="33%" style="text-align: center; border-left: 1px solid #cbd5e1;">
                        <div style="font-size: 28px; font-weight: 900; color: #2563eb;">130+</div>
                        <div style="font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-top: 5px;">شريك توظيف</div>
                    </td>
                    <td width="33%" style="text-align: center;">
                        <div style="font-size: 28px; font-weight: 900; color: #1e293b;">10k+</div>
                        <div style="font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-top: 5px;">مهني متخصص</div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Social Proof Section -->
        <div style="margin-bottom: 35px; text-align: center;">
            <p style="color: #64748b; font-size: 14px; font-weight: 600; margin-bottom: 20px;">مؤسسات تثق بنا</p>
            <div style="opacity: 0.7; filter: grayscale(100%);">
                <p style="font-size: 13px; color: #94a3b8; font-style: italic;">
                    البنوك الوطنية • كبرى شركات التكنولوجيا • منظمات دولية • بلديات ومؤسسات عامة
                </p>
            </div>
        </div>

        <!-- Feature Highlighting -->
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 25px; margin-bottom: 35px;">
            <h3 style="margin: 0 0 15px; color: #0f172a; font-size: 18px; font-weight: 700;">لماذا يفضل المحترفون التقديم عبر هايرلي؟ 🌟</h3>
            <ul style="padding: 0; margin: 0; list-style: none; color: #475569; font-size: 15px;">
                <li style="margin-bottom: 12px; display: flex; align-items: center;">✅ تجربة مستخدم سلسة واحترافية (Luxe UI).</li>
                <li style="margin-bottom: 12px; display: flex; align-items: center;">✅ شفافية كاملة في عملية التوظيف.</li>
                <li style="margin-bottom: 0; display: flex; align-items: center;">✅ وصول مباشر لأفضل الفرص في السوق الفلسطيني.</li>
            </ul>
        </div>

        <!-- CTA -->
        <div style="text-align: center; border-top: 1px solid #e2e8f0; pt: 30px;">
            <p style="color: #64748b; font-size: 14px; margin-bottom: 20px;">لا تدع الكفاءات تفوتك، ابدأ النشر اليوم!</p>
            <a href="${appBaseUrl}/hire_dashboard.html" style="color: #2563eb; font-weight: 700; text-decoration: none;">انتقل إلى لوحة التحكم ←</a>
        </div>
    `;

    return { subject, html: generateEmailHtmlWrapperRTL(subject, contentHtml, appBaseUrl) };
};

module.exports = sendEmployerEngagementEmailTemplate;

module.exports = sendEmployerEngagementEmailTemplate;
