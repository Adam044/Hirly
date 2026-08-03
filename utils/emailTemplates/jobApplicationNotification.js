const sendJobApplicationNotificationEmailTemplate = (employerName, jobTitle, applicationCount, jobPostedDate) => {
    const subject = 'تم استلام طلبات جديدة لوظيفتك في هايرلي';
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
            <h1 style="margin: 0; font-size: 24px;">طلبات جديدة لوظيفتك</h1>
        </div>
        <div style="padding: 30px;">
            <p style="font-size: 16px;">مرحباً ${employerName},</p>
            <p style="font-size: 16px;">نود إعلامك بأن وظيفتك "<strong>${jobTitle}</strong>" قد استقبلت طلبات جديدة من مرشحين مهتمين.</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #4f46e5;">تفاصيل الوظيفة:</h3>
                <ul style="list-style-type: none; padding: 0;">
                    <li style="margin-bottom: 10px;"><strong>عنوان الوظيفة:</strong> ${jobTitle}</li>
                    <li style="margin-bottom: 10px;"><strong>عدد الطلبات الجديدة:</strong> ${applicationCount}</li>
                    <li style="margin-bottom: 10px;"><strong>تاريخ النشر:</strong> ${jobPostedDate}</li>
                </ul>
            </div>
            
            <p style="font-size: 16px;">يمكنك الآن مراجعة الطلبات والتواصل مع المرشحين المناسبين من خلال لوحة التحكم الخاصة بك.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.hirly.net/hire_dashboard.html" style="display: inline-block; background-color: #6366f1; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    عرض الطلبات الآن
                </a>
            </div>
            
            <p style="font-size: 16px;">لا تفوت الفرصة للعثور على أفضل المواهب لشركتك!</p>
            <br>
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

module.exports = sendJobApplicationNotificationEmailTemplate;
