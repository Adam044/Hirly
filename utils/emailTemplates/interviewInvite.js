const { generateEmailHtmlWrapperRTL } = require('./layout');

const sendInterviewInviteEmailTemplate = (jobTitle, interviewLink, opts = {}) => {
    const { expiresAt, durationMinutes, instructions } = opts;
    const subject = `دعوة لمقابلة تمهيدية — ${jobTitle}`;
    const mainContentHtml = `
        <div style="background:#0f172a; color:#ffffff; padding:18px 20px; border-radius:12px 12px 0 0;">
            <div style="font-weight:800; font-size:18px;">دعوة لإجراء مقابلة تعريفية عبر هايرلي</div>
            <p style="margin:8px 0 0; font-size:13px; color:#cbd5e1;">هذه المقابلة موجهة بواسطة الذكاء الاصطناعي وتهدف لفهم توقعاتك وأسلوب عملك.</p>
        </div>
        <div style="padding:18px 20px;">
            <p style="margin:0 0 10px; color:#334155; font-size:14px;">سيُطرح عليك أسئلة عامة وغير تقنية حول:</p>
            <ul style="padding-right:18px; margin:0; color:#334155; font-size:14px;">
                <li>طريقة تفكيرك واتخاذ القرار</li>
                <li>التوقعات حول الميزانية والأجر</li>
                <li>التوفر والالتزام</li>
                <li>نقاط مهمة أخرى يراها الذكاء الاصطناعي ذات صلة</li>
            </ul>
            <div style="margin-top:14px;">
                <a href="${interviewLink}" class="button" style="background:#10b981; color:#0f172a; display:inline-block; padding:10px 24px; border-radius:999px; font-weight:800; font-size:15px; text-decoration:none;">ابدأ المقابلة الآن</a>
            </div>
            <p style="margin-top:10px; color:#64748b; font-size:12px;">${expiresAt ? `يرجى إتمام الجلسة قبل ${new Date(expiresAt).toLocaleString('ar')}.` : 'الرجاء إتمام الجلسة خلال 7 أيام من استلام هذه الدعوة.'}</p>
            ${durationMinutes ? `<p style="margin-top:4px; color:#64748b; font-size:12px;">المدة المتوقعة: ${durationMinutes} دقيقة.</p>` : ''}
            ${instructions ? `<div style="margin-top:12px; background:#f1f5f9; border:1px solid #e2e8f0; padding:12px; border-radius:8px; color:#334155; font-size:13px;"><b>تركيز المقابلة:</b><br>${instructions}</div>` : ''}
        </div>
    `;
    return { subject, html: generateEmailHtmlWrapperRTL(subject, mainContentHtml, appBaseUrl) };
};

module.exports = sendInterviewInviteEmailTemplate;
