const { generateEmailHtmlWrapperRTL } = require('./layout');

const sendEmployerMarketingEmailTemplate = (appBaseUrl = process.env.APP_BASE_URL || 'https://www.hirly.net') => {
    const subject = '🚀 هل تتوجه لتوظيف أفضل الكفاءات؟ اكتشف ما فاتك على هايرلي';
    
    const contentHtml = `
        <!-- Preheader -->
        <div style="display:none !important; visibility:hidden; mso-hide:all; opacity:0; color:transparent; height:0; width:0;">
            أكثر من 600 وظيفة و130+ مؤسسة رائدة تثق بهايرلي. لا تترك مقعدك شاغراً.
        </div>

        <!-- Hero Section -->
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #0f172a; font-size: 26px; font-weight: 800; margin-bottom: 16px; line-height: 1.3;">
                أكثر من 600 وظيفة نشطة.. هل شركتك بينها؟ 💼
            </h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.7; margin-bottom: 24px;">
                انضم إلى مجتمع يضم أكثر من <strong>130 مؤسسة رائدة</strong>، تشمل البنوك الوطنية، المؤسسات الحكومية، والمنظمات الدولية التي اختارت <strong>هايرلي</strong> كشريكها التقني الأول للتوظيف.
            </p>
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
                <!-- Logos Placeholder/Visual Cue -->
                <p style="font-size: 13px; color: #94a3b8; font-style: italic;">
                    البنوك الوطنية • كبرى شركات التكنولوجيا • منظمات دولية • بلديات ومؤسسات عامة
                </p>
            </div>
        </div>

        <!-- Feature Highlighting -->
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 25px; margin-bottom: 35px;">
            <h3 style="margin: 0 0 15px; color: #0f172a; font-size: 18px; font-weight: 700;">لماذا يفضل المحترفون التقديم عبر هايرلي؟ 🌟</h3>
            <div style="margin-bottom: 15px;">
                <div style="color: #2563eb; font-weight: 700; margin-bottom: 4px;">✓ تجربة مستخدم فاخرة (Luxe UI)</div>
                <div style="font-size: 14px; color: #64748b;">تجذب الكفاءات العالية التي تبحث عن الاحترافية.</div>
            </div>
            <div style="margin-bottom: 15px;">
                <div style="color: #2563eb; font-weight: 700; margin-bottom: 4px;">✓ أدوات تتبع ذكية (ATS)</div>
                <div style="font-size: 14px; color: #64748b;">نظم متقدمة لإدارة الطلبات والمقابلات في مكان واحد.</div>
            </div>
            <div>
                <div style="color: #2563eb; font-weight: 700; margin-bottom: 4px;">✓ وصول مباشر للمبدعين</div>
                <div style="font-size: 14px; color: #64748b;">أكثر من 10,000 مهني جاهز للعمل.</div>
            </div>
        </div>

        <!-- CTA Section -->
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="background-color: #eff6ff; border-radius: 16px; padding: 35px; border: 2px dashed #bfdbfe;">
                <h3 style="margin: 0 0 12px; color: #1e40af; font-size: 20px; font-weight: 800;">لا تتأخر عن الركب!</h3>
                <p style="margin: 0 0 25px; color: #1e3a8a; font-size: 15px; line-height: 1.6;">
                    المنافسة على المواهب في أوجها. استخدم أدواتنا المتقدمة اليوم لضمان وصولك لأفضل الكفاءات قبل غيرك.
                </p>
                <a href="${appBaseUrl}/hire_dashboard.html" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 16px 35px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">
                    ابدأ التوظيف الاحترافي
                </a>
            </div>
        </div>
    `;

    return { subject, html: generateEmailHtmlWrapperRTL(subject, contentHtml, appBaseUrl) };
};

module.exports = sendEmployerMarketingEmailTemplate;