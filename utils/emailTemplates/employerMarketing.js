const { generateEmailHtmlWrapperRTL } = require('./layout');

const sendEmployerMarketingEmailTemplate = (appBaseUrl = process.env.APP_BASE_URL || 'https://www.hirly.net') => {
    const subject = '🚀 ارتقِ بعملية التوظيف مع هايرلي: الذكاء الاصطناعي، أدوات متكاملة، وأفضل المواهب';
    
    const contentHtml = `
        <!-- Preheader -->
        <div style="display:none !important; visibility:hidden; mso-hide:all; opacity:0; color:transparent; height:0; width:0;">
            اكتشف Hirly Pilot وجناح المؤسسات المتكامل. توظيف أذكى، أسرع، وبنتائج مضمونة.
        </div>

        <!-- Hero Section -->
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 16px; line-height: 1.4;">
                هل تعبت من عمليات التوظيف التقليدية؟
            </h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                انضم إلى أكثر من <strong>130 جهة توظيفية</strong>، بما في ذلك البنوك، شركات التأمين، الشركات الكبرى، البلديات، شركات التكنولوجيا، إذاعات وغيرها الكثير! تستخدم هايرلي للوصول إلى <strong>الآلاف من المواهب</strong> المحترفة. دعنا نساعدك في بناء فريق أحلامك بأدوات تسبق عصرها.
            </p>
            <a href="https://hirly.ps/employers" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                ابدأ التوظيف مجانًا
            </a>
        </div>

        <!-- Stats Grid -->
        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td width="33%" style="text-align: center; border-left: 1px solid #cbd5e1;">
                        <div style="font-size: 24px; font-weight: 800; color: #2563eb;">130+</div>
                        <div style="font-size: 13px; color: #64748b; font-weight: 600;">جهة توظيفية</div>
                    </td>
                    <td width="33%" style="text-align: center; border-left: 1px solid #cbd5e1;">
                        <div style="font-size: 24px; font-weight: 800; color: #2563eb;">+1000</div>
                        <div style="font-size: 13px; color: #64748b; font-weight: 600;">مهني نشط</div>
                    </td>
                    <td width="33%" style="text-align: center;">
                        <div style="font-size: 24px; font-weight: 800; color: #2563eb;">85%</div>
                        <div style="font-size: 13px; color: #64748b; font-weight: 600;">توفير في الوقت</div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Feature: Hirly Pilot -->
        <div style="margin-bottom: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 30px;">
            <span style="background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700;">جديد</span>
            <h3 style="margin: 12px 0; color: #0f172a; font-size: 20px;">تعرف على Hirly Pilot (v1.0) 🤖</h3>
            <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                ليس مجرد أداة، بل مساعد توظيف ذكي يقوم بفرز السير الذاتية، إجراء مقابلات أولية، وتحليل شخصية المرشحين نيابة عنك.
            </p>
            <ul style="color: #475569; font-size: 15px; line-height: 1.8; padding-right: 20px; margin-top: 15px;">
                <li>تحليل دقيق للمهارات والخبرات.</li>
                <li>تقارير مفصلة عن كل مرشح.</li>
                <li>توفير ساعات من المقابلات الروتينية.</li>
            </ul>
        </div>

        <!-- Feature: Enterprise Suite -->
        <div style="margin-bottom: 30px;">
            <span style="background-color: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700;">شامل</span>
            <h3 style="margin: 12px 0; color: #0f172a; font-size: 20px;">جناح المؤسسات المتكامل 💼</h3>
            <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                كل ما تحتاجه لإدارة فريقك وعمليات التوظيف في مكان واحد.
            </p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
                <tr>
                    <td width="50%" style="padding: 10px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <div style="font-weight: 700; color: #0f172a; font-size: 14px;">صفحة شركة مخصصة</div>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">اعرض ثقافتك وعلامتك التجارية.</div>
                    </td>
                    <td width="10"></td>
                    <td width="50%" style="padding: 10px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <div style="font-weight: 700; color: #0f172a; font-size: 14px;">نظام تتبع المتقدمين (ATS)</div>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">تتبع كل طلب بوضوح وسهولة.</div>
                    </td>
                </tr>
                <tr><td height="10"></td></tr>
                <tr>
                    <td width="50%" style="padding: 10px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <div style="font-weight: 700; color: #0f172a; font-size: 14px;">تحليلات متقدمة</div>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">رؤى مبنية على البيانات لقرارات أفضل.</div>
                    </td>
                    <td width="10"></td>
                    <td width="50%" style="padding: 10px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <div style="font-weight: 700; color: #0f172a; font-size: 14px;">دعم فني مخصص</div>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">فريقنا معك في كل خطوة.</div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- CTA Section -->
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="background-color: #eff6ff; border-radius: 12px; padding: 30px; border: 1px dashed #bfdbfe;">
                <h3 style="margin: 0 0 10px; color: #1e40af; font-size: 18px;">جاهز لنقلة نوعية؟</h3>
                <p style="margin: 0 0 20px; color: #1e3a8a; font-size: 14px;">
                    سجل الآن مجانًا تمامًا واستفد من أحد أكثر الأنظمة تطورًا مجانًا!
                </p>
                <a href="https://hirly.net/employers" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
                    سجل الآن مجانًا
                </a>
            </div>
        </div>
    `;

    return { subject, html: generateEmailHtmlWrapperRTL(subject, contentHtml, appBaseUrl) };
};

module.exports = sendEmployerMarketingEmailTemplate;
