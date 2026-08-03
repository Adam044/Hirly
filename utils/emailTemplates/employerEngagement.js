const sendEmployerEngagementEmailTemplate = () => {
    const subject = 'اكتشف هايرلي واستفد من منصتنا الآن!';
    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="background-color: #6366f1; color: #ffffff; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">أهلاً بك في هايرلي!</h1>
        </div>
        <div style="padding: 30px;">
            <p style="font-size: 16px;">مرحباً،</p>
            
            <p style="font-size: 16px;">نشكرك على تسجيلك في منصة هايرلي! 🎉</p>
            
            <p style="font-size: 16px;">نحن متحمسون لوجودك معنا ونريد أن نساعدك في الاستفادة من كل ما تقدمه منصتنا.</p>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 12px; color: white; text-align: center; margin: 25px 0;">
                <h3 style="margin: 0 0 15px 0; font-size: 22px;">🎯 اكتشف إمكانيات هايرلي</h3>
                <p style="margin: 0; font-size: 18px; font-weight: bold;">منصتك الشاملة للعثور على أفضل المحترفين في جميع المجالات</p>
            </div>

            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border-right: 4px solid #6366f1; margin: 15px 0;">
                <strong style="font-size: 18px; color: #1e293b;">🏢 للشركات وأصحاب الأعمال:</strong><br>
                <p style="margin-top: 5px; color: #475569;">ابحث عن المحترفين في أكثر من 150 مجال مهني - مثل المبرمجين والمصممين والمحاسبين والمسوقين وغيرهم الكثير</p>
            </div>

            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border-right: 4px solid #22c55e; margin: 15px 0;">
                <strong style="font-size: 18px; color: #1e293b;">🏠 للأفراد:</strong><br>
                <p style="margin-top: 5px; color: #475569;">احصل على خدمات من أكثر من 150 تخصص مهني - مثل الكهربائيين والسباكين والمصممين والمدرسين الخصوصيين وغيرهم الكثير</p>
            </div>

            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-right: 4px solid #f59e0b; margin: 15px 0;">
                <strong style="font-size: 18px; color: #1e293b;">🌟 صفحة الخدمات:</strong><br>
                <p style="margin-top: 5px; color: #475569;">اكتشف خدمات جاهزة من محترفين معتمدين في أكثر من 150 مجال - مثل التصميم والبرمجة والترجمة والتسويق والمحاسبة وغيرها الكثير</p>
            </div>

            <div style="text-align: center; margin: 35px 0;">
                 <a href="https://www.hirly.net" style="display: inline-block; background-color: #6366f1; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    ابدأ الاستكشاف الآن
                </a>
            </div>
            
            <p style="font-size: 16px;">مع أطيب التحيات،<br>فريق هايرلي</p>
        </div>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p>&copy; ${new Date().getFullYear()} Hirly. جميع الحقوق محفوظة.</p>
        </div>
    </div>
</body>
</html>`;

    return { subject, html };
};

module.exports = sendEmployerEngagementEmailTemplate;
