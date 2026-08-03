const { generateEmailHtmlWrapperRTL } = require('./layout');

const sendPasswordResetConfirmationEmailTemplate = (recipientName) => {
    const subject = 'تم تغيير كلمة المرور بنجاح - هايرلي | Password Reset Successful - Hirly';
    const mainContentHtml = `
            <div style="text-align: center; padding: 20px;">
                <!-- Header with Key Icon -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 15px; margin-bottom: 30px;">
                    <div style="font-size: 48px; margin-bottom: 15px;">
                        🔐
                    </div>
                    <h1 style="margin: 0; font-size: 28px; font-weight: bold;">تم تغيير كلمة المرور بنجاح</h1>
                    <h2 style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; opacity: 0.9;">Password Reset Successful</h2>
                    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">تم تحديث كلمة المرور الخاصة بك بنجاح</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">Your password has been updated successfully</p>
                </div>
                
                <!-- Main Content -->
                <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 25px; text-align: right;">
                    <h2 style="color: #333; margin-bottom: 15px; text-align: center;">مرحباً ${recipientName || 'المستخدم'} 👋</h2>
                    <h3 style="color: #555; margin-bottom: 15px; text-align: center;">Hello ${recipientName || 'User'}</h3>
                    
                    <p style="color: #666; line-height: 1.8; margin-bottom: 15px; font-size: 16px;">
                        تم تغيير كلمة المرور الخاصة بك بنجاح. يمكنك الآن تسجيل الدخول إلى حسابك في هايرلي باستخدام كلمة المرور الجديدة.
                    </p>
                    <p style="color: #666; line-height: 1.6; margin-bottom: 15px; font-size: 14px; text-align: left;">
                        Your password has been successfully reset. You can now log in to your Hirly account using your new password.
                    </p>
                    
                    <p style="color: #666; line-height: 1.8; margin-bottom: 15px; font-size: 16px;">
                        إذا لم تطلب تغيير كلمة المرور هذه، يرجى التواصل مع فريق الدعم فوراً.
                    </p>
                    <p style="color: #666; line-height: 1.6; margin-bottom: 15px; font-size: 14px; text-align: left;">
                        If you did not request this password reset, please contact our support team immediately.
                    </p>
                </div>
                
                <!-- Security Notice -->
                <div style="background: linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%); padding: 20px; border-radius: 10px; border-left: 4px solid #28a745; margin-bottom: 25px;">
                    <p style="color: #155724; margin: 0; font-weight: 500; font-size: 16px;">
                        🛡️ حسابك الآن آمن مع كلمة المرور الجديدة
                    </p>
                    <p style="color: #155724; margin: 5px 0 0 0; font-weight: 400; font-size: 14px;">
                        Your account is now secure with your new password
                    </p>
                </div>
                
                <!-- Login Button -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'https://hirly.com'}/login" 
                       style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                              color: white; 
                              padding: 15px 40px; 
                              text-decoration: none; 
                              border-radius: 25px; 
                              font-weight: bold; 
                              display: inline-block; 
                              margin: 10px;
                              font-size: 16px;
                              box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                              transition: all 0.3s ease;">
                        🚀 تسجيل الدخول إلى حسابك | Login to Your Account
                    </a>
                </div>
                
                <!-- Tips Section -->
                <div style="background: #fff3cd; padding: 20px; border-radius: 10px; border-left: 4px solid #ffc107; margin-bottom: 25px;">
                    <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 18px;">💡 نصائح للأمان | Security Tips</h3>
                    <ul style="color: #856404; text-align: right; margin: 0; padding-right: 20px; line-height: 1.6;">
                        <li style="margin-bottom: 8px;">استخدم كلمة مرور قوية ومعقدة</li>
                        <li style="margin-bottom: 8px;">لا تشارك كلمة المرور مع أي شخص</li>
                        <li style="margin-bottom: 8px;">قم بتغيير كلمة المرور بانتظام</li>
                    </ul>
                    <ul style="color: #856404; text-align: left; margin: 10px 0 0 0; padding-left: 20px; line-height: 1.4; font-size: 14px;">
                        <li style="margin-bottom: 5px;">Use a strong and complex password</li>
                        <li style="margin-bottom: 5px;">Never share your password with anyone</li>
                        <li style="margin-bottom: 5px;">Change your password regularly</li>
                    </ul>
                </div>
            </div>
        `;
    
    return { subject, html: generateEmailHtmlWrapperRTL(subject, mainContentHtml) };
};

module.exports = sendPasswordResetConfirmationEmailTemplate;
