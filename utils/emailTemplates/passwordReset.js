const { generateEmailHtmlWrapper } = require('./layout');

const sendPasswordResetEmailTemplate = (resetCode) => {
    const subject = 'Your Hirly Password Reset Code';
    const mainContentHtml = `
        <p>Dear Hirly User,</p>
        <p>You have requested to reset your password. Please use the following code to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 32px; letter-spacing: 5px; font-weight: bold; padding: 15px; background-color: #f5f5f5; border-radius: 8px; display: inline-block;">
                ${resetCode}
            </div>
        </div>
        <p>This code is valid for 15 minutes. If you did not request this, please ignore this email.</p>
        <p>Best regards,<br>The Hirly Team</p>
    `;
    return { subject, html: generateEmailHtmlWrapper(subject, mainContentHtml) };
};

module.exports = sendPasswordResetEmailTemplate;
