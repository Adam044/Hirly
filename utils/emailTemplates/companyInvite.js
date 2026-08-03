const { generateEmailHtmlWrapperRTL } = require('./layout');

const sendCompanyInviteEmailTemplate = (appBaseUrl = process.env.APP_BASE_URL || 'https://hirly.com') => {
    const subject = 'منصة هايرلي للتوظيف الذكي — دعوة للانضمام';
    const mainContentHtml = `
        <!-- Preheader text -->
        <div style="display:none !important; visibility:hidden; mso-hide:all; opacity:0; color:transparent; height:0; width:0;">دعوة رسمية للانضمام إلى منصة هايرلي للتوظيف الذكي — جرّبوا خطة Pro مجاناً لمدة شهر.</div>
        
        <!-- Hero image -->
        <div style="margin: -30px -25px 20px -25px;">
            <img src="https://images.pexels.com/photos/5668869/pexels-photo-5668869.jpeg" alt="التوظيف الذكي مع هايرلي" style="width:100%; height:auto; display:block; border-radius: 8px 8px 0 0;">
        </div>

        <!-- Main content -->
        <h1 style="margin:0 0 8px 0; font-size:26px; color:#0f172a; line-height:1.2;">دعوة للانضمام إلى منصة هايرلي للتوظيف</h1>
        <p style="margin:0 0 14px 0; color:#475569; font-size:16px; line-height:1.8;">
            السادة المحترمون،<br>
            يسرّنا دعوتكم للانضمام إلى منصة <strong>هايرلي</strong>؛ منظومة متكاملة تُبسّط رحلة التوظيف من نشر الوظيفة حتى التعاقد، وتُسرّع الوصول لأفضل المواهب في فلسطين وخارجها.
        </p>

        <!-- Key points -->
        <div style="background:#f8fafc; border-radius:10px; padding:15px; margin-top:12px;">
            <div style="font-weight:700; color:#0f172a; margin-bottom:6px; font-size:15px;">مزايا رئيسية للشركات</div>
            <ul style="margin:0; padding:0 0 0 18px; color:#334155; font-size:15px; line-height:1.9;">
                <li>نشر يصل فوراً إلى آلاف المهنيين النشطين.</li>
                <li>مطابقة ذكية وتحليل متقدم لملفات المرشحين (تقارير تفصيلية).</li>
                <li>تواصل مباشر مع المرشّح: هاتف، بريد إلكتروني، ورسائل داخل المنصة.</li>
                <li>لوحة تحكّم احترافية لإدارة الطلبات والمتابعة.</li>
                <li>دعم محلي سريع وشريك موثوق لحملات التوظيف.</li>
            </ul>
        </div>

        <!-- Important block -->
        <div style="background:#0f172a; color:#ffffff; padding:18px; border-radius:10px; margin-top:18px;">
            <div style="font-weight:800; font-size:16px; margin-bottom:6px;">تجربة احترافية دون مخاطرة</div>
            <div style="font-size:15px; line-height:1.8;">
                يمكنكم البدء بالخطة المجانية، أو تفعيل نسخة <strong>Pro</strong> التجريبية لمدة شهر للاستفادة من جميع المزايا المتقدمة بدون قيود. يتم التفعيل مباشرة من لوحة التحكم.
            </div>
        </div>

        <p style="margin:16px 0 8px 0; color:#475569; font-size:15px;">
            سواء كنتم تبحثون عن موظف دائم أو مستقل لإنجاز مهمة محددة، هايرلي يوفّر لكم سرعة، جودة، وثقة في كل خطوة.
        </p>

        <div style="text-align:center; margin-top:18px;">
            <a href="https://www.hirly.net/employers" target="_blank"
                style="background:#0f172a; color:#fff; display:inline-block; padding:12px 26px; border-radius:10px; font-weight:800; font-size:16px; text-decoration:none;">
                ابدأ التوظيف الذكي الآن
            </a>
        </div>

        <p style="margin:14px 0 0 0; color:#94a3b8; font-size:13px; text-align:center;">
            إذا كان لديكم حساب مسبقاً، سجّلوا الدخول للوصول إلى لوحة التحكم وتفعيل النسخة التجريبية.
        </p>

        <!-- Stats and Contact (Trust Badges) -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eef2f7;">
            <div style="display: flex; justify-content: space-between; text-align: center; margin-bottom: 20px;">
                <div style="flex: 1;">
                    <div style="font-size:20px; font-weight:800; color:#0f172a;">40+</div>
                    <div style="font-size:12px; color:#64748b;">جهات عمل مسجّلة</div>
                </div>
                <div style="flex: 1;">
                    <div style="font-size:20px; font-weight:800; color:#0f172a;">500+</div>
                    <div style="font-size:12px; color:#64748b;">باحثون عن عمل</div>
                </div>
                <div style="flex: 1;">
                    <div style="font-size:20px; font-weight:800; color:#0f172a;">شبكة موثوقة</div>
                    <div style="font-size:12px; color:#64748b;">خبرات متخصصة</div>
                </div>
            </div>
            <div style="text-align: center; color:#475569; font-size:14px;">
                لأي استفسار أو دعم، يُسعدنا تواصلكم عبر: <br>
                <a href="mailto:hirly.service@gmail.com" style="color:#0f172a; font-weight:700;">hirly.service@gmail.com</a> • هاتف/واتساب: +970 594444403
            </div>
        </div>
    `;
    return { subject, html: generateEmailHtmlWrapperRTL(subject, mainContentHtml, appBaseUrl) };
};

module.exports = sendCompanyInviteEmailTemplate;
