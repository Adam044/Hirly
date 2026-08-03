/**
 * Helper function to generate a basic RTL HTML email wrapper with Font Awesome.
 * @param {string} subject - The subject line of the email.
 * @param {string} mainContentHtml - The HTML content for the body of the email.
 * @param {string} [appBaseUrl] - The base URL of the application (optional).
 * @returns {string} The full HTML content for the email.
 */
function generateEmailHtmlWrapperRTL(subject, mainContentHtml, appBaseUrl = process.env.APP_BASE_URL || 'https://www.hirly.net') {
    // Ensure appBaseUrl is a valid URL and doesn't look like a template placeholder
    let baseUrl = appBaseUrl;
    if (!baseUrl || typeof baseUrl !== 'string' || baseUrl.includes('{{') || !baseUrl.startsWith('http')) {
        baseUrl = process.env.APP_BASE_URL || 'https://www.hirly.net';
    }
    
    // Ensure baseUrl doesn't have trailing slash
    baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // Use a reliable absolute URL for the logo
    const logoUrl = `${baseUrl}/images/logo.jpg`;

    return `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                body {
                    font-family: "Segoe UI", Tahoma, Arial, "Noto Kufi Arabic", sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                    color: #333333;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    background-color: #ffffff;
                    padding: 0;
                    border-radius: 8px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                    overflow: hidden;
                    border: 1px solid #e2e8f0;
                }
                .header {
                    text-align: center;
                    padding: 25px 20px;
                    background-color: #ffffff;
                    border-bottom: 1px solid #f1f5f9;
                }
                .header img {
                    height: 45px;
                    width: auto;
                    display: inline-block;
                    max-width: 100%;
                }
                .content {
                    padding: 30px 25px;
                    line-height: 1.7;
                    text-align: right;
                    color: #334155;
                    font-size: 16px;
                    word-wrap: break-word;
                }
                .button {
                    display: inline-block;
                    background-color: #2563eb;
                    color: #ffffff;
                    padding: 12px 28px;
                    text-decoration: none;
                    border-radius: 6px;
                    text-align: center;
                    font-weight: 700;
                    margin: 20px 0;
                    font-size: 15px;
                }
                .footer {
                    text-align: center;
                    padding: 20px;
                    border-top: 1px solid #f1f5f9;
                    font-size: 13px;
                    color: #94a3b8;
                    background: #f8fafc;
                }
                .footer a {
                    color: #64748b;
                    text-decoration: none;
                    margin: 0 5px;
                }
                .footer a:hover {
                    text-decoration: underline;
                    color: #2563eb;
                }
                h1, h2, h3 { color: #1e293b; margin-top: 0; }
                p { margin-bottom: 15px; }
            </style>
        </head>
        <body style="text-align: right; direction: rtl;">
            <div class="container">
                <!-- Unified Header -->
                <div class="header">
                    <img src="${logoUrl}" alt="Hirly Logo">
                </div>
                
                <!-- Main Content -->
                <div class="content">
                    ${mainContentHtml}
                </div>
                
                <!-- Unified Footer -->
                <div class="footer">
                    <p style="margin-bottom: 10px;">&copy; ${new Date().getFullYear()} Hirly. جميع الحقوق محفوظة.</p>
                    <p style="margin: 0;">
                        <a href="${appBaseUrl}">زيارة الموقع</a> • 
                        <a href="${appBaseUrl}/privacy">سياسة الخصوصية</a> • 
                        <a href="${appBaseUrl}/contact">اتصل بنا</a>
                    </p>
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
function generateEmailHtmlWrapperLTR(subject, mainContentHtml, appBaseUrl = process.env.APP_BASE_URL || 'https://www.hirly.net') {
    // Ensure appBaseUrl is a valid URL and doesn't look like a template placeholder
    let baseUrl = appBaseUrl;
    if (!baseUrl || typeof baseUrl !== 'string' || baseUrl.includes('{{') || !baseUrl.startsWith('http')) {
        baseUrl = process.env.APP_BASE_URL || 'https://www.hirly.net';
    }
    
    // Ensure baseUrl doesn't have trailing slash
    baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // Use a reliable absolute URL for the logo
    const logoUrl = `${baseUrl}/images/logo.jpg`;

    return `
        <!DOCTYPE html>
        <html lang="en" dir="ltr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                body {
                    font-family: "Segoe UI", Tahoma, Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                    color: #333333;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    background-color: #ffffff;
                    padding: 0;
                    border-radius: 8px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                    overflow: hidden;
                    border: 1px solid #e2e8f0;
                }
                .header {
                    text-align: center;
                    padding: 25px 20px;
                    background-color: #ffffff;
                    border-bottom: 1px solid #f1f5f9;
                }
                .header img {
                    height: 45px;
                    width: auto;
                    display: inline-block;
                    max-width: 100%;
                }
                .content {
                    padding: 30px 25px;
                    line-height: 1.7;
                    text-align: left;
                    color: #334155;
                    font-size: 16px;
                    word-wrap: break-word;
                }
                .button {
                    display: inline-block;
                    background-color: #2563eb;
                    color: #ffffff;
                    padding: 12px 28px;
                    text-decoration: none;
                    border-radius: 6px;
                    text-align: center;
                    font-weight: 700;
                    margin: 20px 0;
                    font-size: 15px;
                }
                .footer {
                    text-align: center;
                    padding: 20px;
                    border-top: 1px solid #f1f5f9;
                    font-size: 13px;
                    color: #94a3b8;
                    background: #f8fafc;
                }
                .footer a {
                    color: #64748b;
                    text-decoration: none;
                    margin: 0 5px;
                }
                .footer a:hover {
                    text-decoration: underline;
                    color: #2563eb;
                }
                h1, h2, h3 { color: #1e293b; margin-top: 0; }
                p { margin-bottom: 15px; }
            </style>
        </head>
        <body style="text-align: left; direction: ltr;">
            <div class="container">
                <!-- Unified Header -->
                <div class="header">
                    <img src="${logoUrl}" alt="Hirly Logo">
                </div>
                
                <!-- Main Content -->
                <div class="content">
                    ${mainContentHtml}
                </div>
                
                <!-- Unified Footer -->
                <div class="footer">
                    <p style="margin-bottom: 10px;">&copy; ${new Date().getFullYear()} Hirly. All rights reserved.</p>
                    <p style="margin: 0;">
                        <a href="${appBaseUrl}">Visit Website</a> • 
                        <a href="${appBaseUrl}/privacy">Privacy Policy</a> • 
                        <a href="${appBaseUrl}/contact">Contact Us</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;
}

module.exports = { generateEmailHtmlWrapperRTL, generateEmailHtmlWrapperLTR };
