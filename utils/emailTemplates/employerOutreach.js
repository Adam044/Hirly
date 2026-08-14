const { generateEmailHtmlWrapperRTL, generateEmailHtmlWrapperLTR } = require('./layout');

/**
 * Employer Outreach Email Template
 * Supports English and Arabic
 */
function sendEmployerOutreachEmailTemplate(companyName, jobTitle, applicantCount, highMatchCount, reviewUrl, language = 'en') {
    const isAr = language === 'ar';
    const translations = {
        en: {
            subject: `${applicantCount} candidates applied to your job through Hirly`,
            hello: `Hello ${companyName},`,
            body1: `Your ${jobTitle} opportunity has received ${applicantCount} applications through Hirly.`,
            body2: `We’ve organized the applicants into a clear hiring workspace, including their professional profiles, CVs, skills, experience, and AI-powered candidate evaluation.`,
            ready: `Your candidates are ready to review.`,
            cta: `Review ${applicantCount} Candidates`,
            body3: `You can review the strongest matches and explore each candidate's profile directly through Hirly.`,
            snapshotTitle: `Application Snapshot`,
            applicantsLabel: `Applicants`,
            highMatchLabel: `High-Match Candidates`,
            aiComplete: `AI Evaluation Complete`
        },
        ar: {
            subject: `الموضوع: تقدّم ${applicantCount} شخصًا لفرصتك الوظيفية عبر Hirly`,
            hello: `مرحبًا ${companyName}،`,
            body1: `تلقّت فرصة [${jobTitle}] الخاصة بكم ${applicantCount} طلب تقديم عبر Hirly.`,
            body2: `قمنا بتنظيم جميع المتقدمين في مساحة توظيف واضحة، تتضمن ملفاتهم المهنية، سيرهم الذاتية، مهاراتهم، خبراتهم، وتقييمًا ذكيًا للمرشحين باستخدام الذكاء الاصطناعي.`,
            ready: `مرشحوكم جاهزون للمراجعة.`,
            cta: `مراجعة ${applicantCount} مرشحًا`,
            body3: `يمكنكم استعراض أفضل المرشحين والاطلاع على الملف المهني الكامل لكل متقدم مباشرة عبر Hirly.`,
            snapshotTitle: `ملخص الطلبات`,
            applicantsLabel: `متقدم`,
            highMatchLabel: `مرشحين بمطابقة عالية`,
            aiComplete: `اكتمل تقييم الذكاء الاصطناعي`
        }
    };

    const t = translations[language] || translations.en;

    const contentHtml = `
        <p><strong>${t.hello}</strong></p>
        <p>${t.body1}</p>
        <p>${t.body2}</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
            <div style="font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20px;">${t.snapshotTitle}</div>
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td align="center" style="width: 50%;">
                        <div style="font-size: 32px; font-weight: 800; color: #1e293b; line-height: 1;">${applicantCount}</div>
                        <div style="font-size: 13px; color: #64748b; margin-top: 5px; font-weight: 700;">${t.applicantsLabel}</div>
                    </td>
                    <td align="center" style="width: 50%;">
                        <div style="font-size: 32px; font-weight: 800; color: #1e293b; line-height: 1;">${highMatchCount}</div>
                        <div style="font-size: 13px; color: #64748b; margin-top: 5px; font-weight: 700;">${t.highMatchLabel}</div>
                    </td>
                </tr>
            </table>
            <div style="display: inline-block; background-color: #dcfce7; color: #166534; font-size: 11px; font-weight: 800; padding: 6px 16px; border-radius: 50px; margin-top: 15px; text-transform: uppercase;">✓ ${t.aiComplete}</div>
        </div>

        <p><strong>${t.ready}</strong></p>
        
        <div style="text-align: center; margin: 40px 0;">
            <a href="${reviewUrl}" style="background-color: #6366f1; color: white !important; padding: 16px 36px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">${t.cta}</a>
        </div>

        <p>${t.body3}</p>
    `;

    const wrapper = isAr ? generateEmailHtmlWrapperRTL : generateEmailHtmlWrapperLTR;
    return { subject: t.subject, html: wrapper(t.subject, contentHtml) };
}

module.exports = sendEmployerOutreachEmailTemplate;
