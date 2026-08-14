/**
 * Helper function to generate a basic RTL HTML email wrapper with Font Awesome.
 * @param {string} subject - The subject line of the email.
 * @param {string} mainContentHtml - The HTML content for the body of the email.
 * @param {string} [appBaseUrl] - The base URL of the application (optional).
 * @returns {string} The full HTML content for the email.
 */
function generateEmailHtmlWrapperRTL(subject, mainContentHtml, appBaseUrl = 'https://hirly.net') {
    const logoUrl = `https://ecxvfjceuynwtpjvmxpw.supabase.co/storage/v1/object/public/assets/logo.jpg`;
    const year = new Date().getFullYear();

    return `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f4f7fa; }
                .container { max-width: 600px; margin: 20px auto; padding: 40px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
                .header { text-align: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 1px solid #f1f5f9; }
                .logo-img { height: 75px; width: auto; }
                .content { text-align: right; }
                .footer { margin-top: 50px; padding-top: 30px; border-top: 1px solid #f1f5f9; text-align: center; }
                .footer-brand { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 10px; display: block; }
                .footer-links { margin: 20px 0; }
                .footer-link { color: #64748b; text-decoration: none; font-size: 13px; margin: 0 10px; font-weight: 500; }
                .social-links { margin: 25px 0; }
                .footer-tagline { font-size: 12px; color: #94a3b8; margin-top: 15px; }
                .palestine-flag { margin-top: 5px; font-size: 14px; font-weight: 700; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="${logoUrl}" alt="Hirly Logo" class="logo-img">
                </div>
                <div class="content">
                    ${mainContentHtml}
                </div>
                <div class="footer">
                    <span class="footer-brand">Hirly</span>
                    <p style="font-size: 13px; color: #64748b; max-width: 400px; margin: 0 auto;">Hirly — نوحّد عملية التوظيف، من الفرصة إلى أفضل المرشحين.</p>
                    
                    <div class="social-links">
                        <a href="https://www.facebook.com/share/1CGgEU9Ekw/?mibextid=wwXIfr" target="_blank">
                            <img src="https://img.icons8.com/ios-filled/50/64748b/facebook-new.png" alt="Facebook" style="width: 24px; height: 24px; margin: 0 10px;">
                        </a>
                        <a href="https://www.instagram.com/hirly.ps" target="_blank">
                            <img src="https://img.icons8.com/ios-filled/50/64748b/instagram-new.png" alt="Instagram" style="width: 24px; height: 24px; margin: 0 10px;">
                        </a>
                    </div>

                    <div class="footer-links">
                        <a href="https://hirly.net" class="footer-link">الموقع الإلكتروني</a>
                        <a href="https://hirly.net/jobs.html" class="footer-link">تصفح الوظائف</a>
                        <a href="https://hirly.net/contact.html" class="footer-link">اتصل بنا</a>
                    </div>

                    <div class="footer-tagline">
                        © ${year} Hirly. جميع الحقوق محفوظة.
                        <div class="palestine-flag">صنع بفخر في فلسطين 🇵🇸</div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Helper function to generate a basic LTR HTML email wrapper with Font Awesome.
 * @param {string} subject - The subject line of the email.
 * @param {string} mainContentHtml - The HTML content for the body of the email.
 * @param {string} [appBaseUrl] - The base URL of the application (optional).
 * @returns {string} The full HTML content for the email.
 */
function generateEmailHtmlWrapperLTR(subject, mainContentHtml, appBaseUrl = 'https://hirly.net') {
    const logoUrl = `https://ecxvfjceuynwtpjvmxpw.supabase.co/storage/v1/object/public/assets/logo.jpg`;
    const year = new Date().getFullYear();

    return `
        <!DOCTYPE html>
        <html lang="en" dir="ltr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f4f7fa; }
                .container { max-width: 600px; margin: 20px auto; padding: 40px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
                .header { text-align: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 1px solid #f1f5f9; }
                .logo-img { height: 75px; width: auto; }
                .content { text-align: left; }
                .footer { margin-top: 50px; padding-top: 30px; border-top: 1px solid #f1f5f9; text-align: center; }
                .footer-brand { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 10px; display: block; }
                .footer-links { margin: 20px 0; }
                .footer-link { color: #64748b; text-decoration: none; font-size: 13px; margin: 0 10px; font-weight: 500; }
                .social-links { margin: 25px 0; }
                .footer-tagline { font-size: 12px; color: #94a3b8; margin-top: 15px; }
                .palestine-flag { margin-top: 5px; font-size: 14px; font-weight: 700; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="${logoUrl}" alt="Hirly Logo" class="logo-img">
                </div>
                <div class="content">
                    ${mainContentHtml}
                </div>
                <div class="footer">
                    <span class="footer-brand">Hirly</span>
                    <p style="font-size: 13px; color: #64748b; max-width: 400px; margin: 0 auto;">Hirly — making hiring simpler, smarter, and more organized.</p>
                    
                    <div class="social-links">
                        <a href="https://www.facebook.com/share/1CGgEU9Ekw/?mibextid=wwXIfr" target="_blank">
                            <img src="https://img.icons8.com/ios-filled/50/64748b/facebook-new.png" alt="Facebook" style="width: 24px; height: 24px; margin: 0 10px;">
                        </a>
                        <a href="https://www.instagram.com/hirly.ps" target="_blank">
                            <img src="https://img.icons8.com/ios-filled/50/64748b/instagram-new.png" alt="Instagram" style="width: 24px; height: 24px; margin: 0 10px;">
                        </a>
                    </div>

                    <div class="footer-links">
                        <a href="https://hirly.net" class="footer-link">Website</a>
                        <a href="https://hirly.net/jobs.html" class="footer-link">Browse Jobs</a>
                        <a href="https://hirly.net/contact.html" class="footer-link">Contact Support</a>
                    </div>

                    <div class="footer-tagline">
                        © ${year} Hirly. All rights reserved.
                        <div class="palestine-flag">Proudly Palestinian 🇵🇸</div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
}

module.exports = { generateEmailHtmlWrapperRTL, generateEmailHtmlWrapperLTR };
