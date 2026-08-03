const nodemailer = require('nodemailer');
const logger = require('./logger');
const { Pool } = require('pg');
const crypto = require('crypto');

const { generateEmailHtmlWrapperRTL } = require('./emailTemplates/layout');
// Import Email Templates
const sendVerificationEmailTemplate = require('./emailTemplates/verificationEmail');
const sendInterviewCompletedEmailTemplate = require('./emailTemplates/interviewCompleted');
const sendInterviewInviteEmailTemplate = require('./emailTemplates/interviewInvite');
const sendContactFormEmailTemplate = require('./emailTemplates/contactForm');
const sendPasswordResetEmailTemplate = require('./emailTemplates/passwordReset');
const sendApplicationAcceptedEmailTemplate = require('./emailTemplates/applicationAccepted');
const sendApplicationRejectedEmailTemplate = require('./emailTemplates/applicationRejected');
const sendJobOfferEmailTemplate = require('./emailTemplates/jobOffer');
const sendCompanyInviteEmailTemplate = require('./emailTemplates/companyInvite');
const sendEmployerMarketingEmailTemplate = require('./emailTemplates/employerMarketing');
const sendEmployerEngagementEmailTemplate = require('./emailTemplates/employerEngagement');
const sendIdVerificationReminderEmailTemplate = require('./emailTemplates/idVerificationReminder');
const sendEmailVerificationReminderEmailTemplate = require('./emailTemplates/emailVerificationReminder');
const sendProfessionalWelcomeEmailTemplate = require('./emailTemplates/professionalWelcome');
const sendGeneralWelcomeEmailTemplate = require('./emailTemplates/generalWelcome');
const sendManualJobAlertsTemplate = require('./emailTemplates/manualJobAlert');
const sendAdminVerificationEmailTemplate = require('./emailTemplates/adminVerificationEmail');
const sendPasswordResetConfirmationEmailTemplate = require('./emailTemplates/passwordResetConfirmation');
const sendUserToProfessionalEmailTemplate = require('./emailTemplates/userToProfessional');

// Initialize PostgreSQL pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// --- Smart Email Load Balancer ---
const senders = [
    { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
    { user: process.env.AUTO_EMAIL_USER, pass: process.env.AUTO_EMAIL_PASSWORD }
].filter(s => s.user && s.pass);

/**
 * Gets the best transporter based on 24h sent count
 */
const getSmartTransporter = async () => {
    if (senders.length === 0) throw new Error('No email senders configured');
    
    // Default threshold (Gmail limit is 500/day, we stay safe at 490)
    const THRESHOLD = 490;
    
    let client;
    try {
        client = await pool.connect();
        const counts = await Promise.all(senders.map(async (sender) => {
            const res = await client.query(
                "SELECT COUNT(*) FROM email_logs WHERE sender_email = $1 AND sent_at > NOW() - INTERVAL '24 hours'",
                [sender.user]
            );
            return { ...sender, count: parseInt(res.rows[0].count) };
        }));
        
        // Find senders below threshold
        const availableSenders = counts.filter(s => s.count < THRESHOLD);
        
        let selected;
        if (availableSenders.length > 0) {
            // Select the one with lowest count
            selected = availableSenders.sort((a, b) => a.count - b.count)[0];
        } else {
            // If all over threshold, use the one with lowest count anyway, but log warning
            selected = counts.sort((a, b) => a.count - b.count)[0];
            logger.warn(`ALL EMAIL SENDERS OVER THRESHOLD! Using ${selected.user} (count: ${selected.count})`);
        }
        
        return {
            transporter: nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: { user: selected.user, pass: selected.pass }
            }),
            senderEmail: selected.user
        };
    } catch (err) {
        logger.error(`Error in getSmartTransporter: ${err.message}`);
        // Fallback to first sender if DB fails
        return {
            transporter: nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: { user: senders[0].user, pass: senders[0].pass }
            }),
            senderEmail: senders[0].user
        };
    } finally {
        if (client) client.release();
    }
};

/**
 * Logs email sending to database
 */
const logEmailSent = async (sender, recipient, subject) => {
    let client;
    try {
        client = await pool.connect();
        await client.query(
            "INSERT INTO email_logs (sender_email, recipient_email, subject) VALUES ($1, $2, $3)",
            [sender, Array.isArray(recipient) ? recipient.join(', ') : recipient, subject]
        );
    } catch (err) {
        logger.error(`Failed to log email to database: ${err.message}`);
    } finally {
        if (client) client.release();
    }
};

// Smart Transporter Wrapper
const smartTransporter = {
    sendMail: async (mailOptions) => {
        const { transporter, senderEmail } = await getSmartTransporter();
        
        // Ensure 'from' is correct if not explicitly set to something else
        if (!mailOptions.from || mailOptions.from.includes(process.env.EMAIL_USER) || mailOptions.from.includes(process.env.AUTO_EMAIL_USER)) {
            const senderName = process.env.EMAIL_SENDER_NAME || 'Hirly Notifications';
            mailOptions.from = `"${senderName}" <${senderEmail}>`;
        }
        
        const result = await transporter.sendMail(mailOptions);
        
        // Log to database
        await logEmailSent(senderEmail, mailOptions.to, mailOptions.subject);
        
        return result;
    }
};

// Replace static transporters with smart wrapper
const transporter = smartTransporter;
const autoTransporter = smartTransporter;

async function sendInterviewCompletedEmail(to, jobTitle, candidateName) {
    const { subject, html } = sendInterviewCompletedEmailTemplate(jobTitle, candidateName);
    const mailOptions = { from: process.env.MAIL_FROM || process.env.EMAIL_USER, to, subject, html };
    await transporter.sendMail(mailOptions);
    return { success: true };
}

// --- Translation Data (Copied from local files) ---
// This data is needed on the server to correctly render the emails.
const categoriesAndProfessionsTranslations = [
    {
        name: { 'ar': "الخدمات الحرفية والعامة", 'en': "Trades & Services" },
        icon: "fas fa-tools",
        professions: [
            { 'ar': "سباك", 'en': "Plumber", icon: "fas fa-wrench" },
            { 'ar': "كهربائي", 'en': "Electrician", icon: "fas fa-bolt" },
            { 'ar': "ميكانيكي", 'en': "Mechanic", icon: "fas fa-car-side" },
            { 'ar': "دهان", 'en': "Painter", icon: "fas fa-paint-roller" },
            { 'ar': "لحام", 'en': "Welder" },
            { 'ar': "عامل بناء", 'en': "Construction Worker", icon: "fas fa-helmet-safety" },
            { 'ar': "عامل نظافة", 'en': "Cleaner", icon: "fas fa-broom" },
            { 'ar': "حداد", 'en': "Blacksmith", icon: "fas fa-hammer" },
            { 'ar': "مزارع", 'en': "Farmer", icon: "fas fa-tractor" },
        ]
    },
    {
        name: { 'ar': "الخدمات العامة", 'en': "General Services" },
        icon: "fas fa-cash-register",
        professions: [
            { 'ar': "صراف", 'en': "Cashier" },
            { 'ar': "موظف سوبر ماركت", 'en': "Supermarket Staff", icon: "fas fa-shopping-cart" },
            { 'ar': "موظف مطعم", 'en': "Restaurant Staff" },
            { 'ar': "موظف فندق", 'en': "Hotel Staff" },
            { 'ar': "مربية", 'en': "Nanny" },
            { 'ar': "خياط", 'en': "Tailor" },
            { 'ar': "خَبّاز", 'en': "Baker" },
            { 'ar': "طباخ", 'en': "Chef" },
            { 'ar': "حارس أمن", 'en': "Security Guard" },
            { 'ar': "مقدم رعاية للمسنين", 'en': "Elderly Caregiver" },
            { 'ar': "مدرب حيوانات", 'en': "Animal Trainer" },
            { 'ar': "باريستا", 'en': "Barista", icon: "fas fa-mug-hot" },
            { 'ar': "عامل مستودع", 'en': "Warehouse Worker" },
            { 'ar': "مصفف شعر", 'en': "Hairdresser", icon: "fas fa-cut" }
        ]
    },
    {
        name: { 'ar': "الإبداع والتصميم", 'en': "Creative & Design" },
        icon: "fas fa-palette",
        professions: [
            { 'ar': "فنان", 'en': "Artist" },
            { 'ar': "مصمم (جرافيك/واجهة مستخدم/تجربة مستخدم)", 'en': "Designer (Graphic/UI/UX)" },
            { 'ar': "رسام توضيحي", 'en': "Illustrator" },
            { 'ar': "مصور", 'en': "Photographer" },
            { 'ar': "محرر فيديو", 'en': "Video Editor" },
            { 'ar': "موسيقي", 'en': "Musician" },
            { 'ar': "رسام رسوم متحركة", 'en': "Animator" },
            { 'ar': "مصمم أزياء", 'en': "Fashion Designer" },
            { 'ar': "مصمم داخلي", 'en': "Interior Designer" },
            { 'ar': "فنان ألعاب", 'en': "Game Artist" },
            { 'ar': "مهندس صوت", 'en': "Sound Engineer" },
            { 'ar': "ملحن", 'en': "Composer" },
            { 'ar': "صانع أفلام", 'en': "Filmmaker" },
            { 'ar': "كاتب سيناريو", 'en': "Screenwriter" },
            { 'ar': "ممثل", 'en': "Actor" },
            { 'ar': "مدير فني", 'en': "Art Director" },
            { 'ar': "مدير إبداعي", 'en': "Creative Director" },
            { 'ar': "مصمم ديكور", 'en': "Set Designer" },
            { 'ar': "مصمم أزياء (ملابس)", 'en': "Costume Designer" },
            { 'ar': "فنان مكياج", 'en': "Makeup Artist" },
            { 'ar': "مصمم مجوهرات", 'en': "Jewelry Designer" },
            { 'ar': "فنان خزف", 'en': "Ceramic Artist" },
            { 'ar': "نحات", 'en': "Sculptor" },
            { 'ar': "باحث تجربة مستخدم", 'en': "UX Researcher" },
            { 'ar': "مصمم منتجات", 'en': "Product Designer" }
        ]
    },
    {
        name: { 'ar': "التكنولوجيا والتطوير", 'en': "Tech & Development" },
        icon: "fas fa-code",
        professions: [
            { 'ar': "مطور ويب (واجهة أمامية)", 'en': "Web Developer (Frontend)" },
            { 'ar': "مطور ويب (واجهة خلفية)", 'en': "Web Developer (Backend)" },
            { 'ar': "مصمم ويب", 'en': "Web Designer", icon: "fas fa-desktop" },
            { 'ar': "مطور شامل", 'en': "Full-Stack Developer" },
            { 'ar': "مطور تطبيقات جوال (iOS)", 'en': "Mobile App Developer (iOS)" },
            { 'ar': "مطور تطبيقات جوال (أندرويد)", 'en': "Mobile App Developer (Android)" },
            { 'ar': "مطور برمجيات", 'en': "Software Developer" },
            { 'ar': "مطور ألعاب", 'en': "Game Developer" },
            { 'ar': "محلل بيانات", 'en': "Data Analyst" },
            { 'ar': "عالم بيانات", 'en': "Data Scientist" },
            { 'ar': "أخصائي دعم تكنولوجيا المعلومات", 'en': "IT Support Specialist" },
            { 'ar': "مسؤول شبكة", 'en': "Network Administrator" },
            { 'ar': "أخصائي أمن سيبراني", 'en': "Cybersecurity Specialist" },
            { 'ar': "مهندس سحابة", 'en': "Cloud Engineer" },
            { 'ar': "مهندس DevOps", 'en': "DevOps Engineer" },
            { 'ar': "مهندس تعلم آلي", 'en': "Machine Learning Engineer" },
            { 'ar': "مهندس ذكاء اصطناعي", 'en': "AI Engineer" },
            { 'ar': "مطور بلوكتشين", 'en': "Blockchain Developer" },
            { 'ar': "مسؤول قاعدة بيانات", 'en': "Database Administrator" },
            { 'ar': "مسؤول نظام", 'en': "System Administrator" },
            { 'ar': "مهندس ضمان الجودة", 'en': "QA Engineer" },
            { 'ar': "كاتب تقني", 'en': "Technical Writer" },
            { 'ar': "محلل ذكاء الأعمال", 'en': "Business Intelligence Analyst" },
            { 'ar': "استشاري ERP", 'en': "ERP Consultant" },
            { 'ar': "استشاري CRM", 'en': "CRM Consultant" },
            { 'ar': "أخصائي معلوماتية حيوية", 'en': "Bioinformatics Specialist" },
            { 'ar': "مهندس روبوتات", 'en': "Robotics Engineer" },
            { 'ar': "مهندس أنظمة مدمجة", 'en': "Embedded Systems Engineer" },
            { 'ar': "مطور واقع افتراضي/معزز", 'en': "AR/VR Developer" }
        ]
    },
    {
        name: { 'ar': "الأعمال والمالية", 'en': "Business & Finance" },
        icon: "fas fa-chart-line",
        professions: [
            { 'ar': "محاسب", 'en': "Accountant" },
            { 'ar': "محلل أعمال", 'en': "Business Analyst" },
            { 'ar': "اقتصادي", 'en': "Economist" },
            { 'ar': "مستشار مالي", 'en': "Financial Advisor" },
            { 'ar': "أخصائي موارد بشرية", 'en': "HR Specialist" },
            { 'ar': "مدير مشروع", 'en': "Project Manager" },
            { 'ar': "أخصائي مبيعات", 'en': "Sales Professional" },
            { 'ar': "مساعد افتراضي", 'en': "Virtual Assistant" },
            { 'ar': "أخصائي تسويق", 'en': "Marketing Specialist" },
            { 'ar': "مدير عمليات", 'en': "Operations Manager" },
            { 'ar': "مدير سلسلة الإمداد", 'en': "Supply Chain Manager" },
            { 'ar': "مدقق حسابات", 'en': "Auditor" },
            { 'ar': "مصرفي استثماري", 'en': "Investment Banker" },
            { 'ar': "محلل مالي", 'en': "Financial Analyst" },
            { 'ar': "مدير مخاطر", 'en': "Risk Manager" },
            { 'ar': "مسؤول امتثال", 'en': "Compliance Officer" },
            { 'ar': "استشاري إدارة", 'en': "Management Consultant" },
            { 'ar': "مدير تطوير أعمال", 'en': "Business Development Manager" },
            { 'ar': "ممثل خدمة عملاء", 'en': "Customer Service Representative" },
            { 'ar': "أخصائي علاقات عامة", 'en': "Public Relations Specialist" },
            { 'ar': "استشاري توظيف", 'en': "Recruitment Consultant" },
            { 'ar': "مساعد تنفيذي", 'en': "Executive Assistant" },
            { 'ar': "مدير مكتب", 'en': "Office Manager" },
            { 'ar': "منسق لوجستيات", 'en': "Logistics Coordinator" },
            { 'ar': "أخصائي مشتريات", 'en': "Procurement Specialist" },
            { 'ar': "وكيل عقارات", 'en': "Real Estate Agent" },
            { 'ar': "وكيل تأمين", 'en': "Insurance Agent" },
            { 'ar': "رائد أعمال", 'en': "Entrepreneur" },
            { 'ar': "مستشار شركات ناشئة", 'en': "Startup Advisor" }
        ]
    },
    {
        name: { 'ar': "الكتابة والمحتوى", 'en': "Writing & Content" },
        icon: "fas fa-pen-nib",
        professions: [
            { 'ar': "منشئ محتوى", 'en': "Content Creator" },
            { 'ar': "كاتب إعلانات", 'en': "Copywriter" },
            { 'ar': "محرر", 'en': "Editor" },
            { 'ar': "صحفي", 'en': "Journalist" },
            { 'ar': "كاتب", 'en': "Writer" },
            { 'ar': "مترجم", 'en': "Translator" },
            { 'ar': "أخصائي علاقات عامة", 'en': "Public Relations Specialist" },
            { 'ar': "مدير وسائل التواصل الاجتماعي", 'en': "Social Media Manager" },
            { 'ar': "مدون", 'en': "Blogger" },
            { 'ar': "مدقق لغوي", 'en': "Proofreader" },
            { 'ar': "كاتب تقني", 'en': "Technical Writer" },
            { 'ar': "كاتب منح", 'en': "Grant Writer" },
            { 'ar': "كاتب سيناريو", 'en': "Scriptwriter" },
            { 'ar': "شاعر", 'en': "Poet" },
            { 'ar': "روائي", 'en': "Novelist" },
            { 'ar': "كاتب عمود", 'en': "Columnist" },
            { 'ar': "استراتيجي محتوى", 'en': "Content Strategist" },
            { 'ar': "كاتب محتوى SEO", 'en': "SEO Content Writer" },
            { 'ar': "كاتب أكاديمي", 'en': "Academic Writer" },
            { 'ar': "كاتب خطابات", 'en': "Speechwriter" }
        ]
    },
    {
        name: { 'ar': "التعليم والبحث", 'en': "Education & Research" },
        icon: "fas fa-graduation-cap",
        professions: [
            { 'ar': "جامعة (رياضيات)", 'en': "Uni (Math)" },
            { 'ar': "جامعة (فيزياء)", 'en': "Uni (Physics)" },
            { 'ar': "جامعة (كيمياء)", 'en': "Uni (Chemistry)" },
            { 'ar': "جامعة (أحياء)", 'en': "Uni (Biology)" },
            { 'ar': "مدرسة (رياضيات)", 'en': "School (Math)" },
            { 'ar': "مدرسة (فيزياء)", 'en': "School (Physics)" },
            { 'ar': "مدرسة (كيمياء)", 'en': "School (Chemistry)" },
            { 'ar': "مدرسة (أحياء)", 'en': "School (Biology)" },
            { 'ar': "مدرس لغة (إنجليزية)", 'en': "Language Tutor (English)" },
            { 'ar': "مدرس لغة (عربية)", 'en': "Language Tutor (Arabic)" },
            { 'ar': "مدرس لغة (فرنسية)", 'en': "Language Tutor (French)" },
            { 'ar': "مدرس", 'en': "Tutor", icon: "fas fa-chalkboard-user" }
        ]
    },
    {
        name: { 'ar': "القانون والاستشارات", 'en': "Legal & Consulting" },
        icon: "fas fa-balance-scale",
        professions: [
            { 'ar': "محامي", 'en': "Lawyer" },
            { 'ar': "استشاري (عام)", 'en': "Consultant (General)" },
            { 'ar': "مستشار قانوني", 'en': "Legal Advisor" },
            { 'ar': "مساعد قانوني", 'en': "Paralegal" },
            { 'ar': "وسيط", 'en': "Mediator" },
            { 'ar': "محكم", 'en': "Arbitrator" },
            { 'ar': "مستشار ضرائب", 'en': "Tax Consultant" },
            { 'ar': "استشاري تكنولوجيا المعلومات", 'en': "IT Consultant" },
            { 'ar': "استشاري موارد بشرية", 'en': "HR Consultant" },
            { 'ar': "استشاري تسويق", 'en': "Marketing Consultant" },
            { 'ar': "استشاري بيئي", 'en': "Environmental Consultant" },
            { 'ar': "استشاري مالي", 'en': "Financial Consultant" },
            { 'ar': "استشاري أعمال", 'en': "Business Consultant" },
            { 'ar': "استشاري استراتيجية", 'en': "Strategy Consultant" }
        ]
    },
    {
        name: { 'ar': "الهندسة", 'en': "Engineering" },
        icon: "fas fa-cogs",
        professions: [
            { 'ar': "مهندس مدني", 'en': "Civil Engineer" },
            { 'ar': "مهندس (عام)", 'en': "Engineer (General)" },
            { 'ar': "مصمم معماري", 'en': "Architectural Designer" },
            { 'ar': "مهندس معماري", 'en': "Architect" },
            { 'ar': "مهندس ميكانيكي", 'en': "Mechanical Engineer" },
            { 'ar': "مهندس كهربائي", 'en': "Electrical Engineer" },
            { 'ar': "مهندس كيميائي", 'en': "Chemical Engineer" },
            { 'ar': "مهندس برمجيات", 'en': "Software Engineer" },
            { 'ar': "مهندس طيران", 'en': "Aerospace Engineer" },
            { 'ar': "مهندس طبي حيوي", 'en': "Biomedical Engineer" },
            { 'ar': "مهندس صناعي", 'en': "Industrial Engineer" },
            { 'ar': "مهندس بترول", 'en': "Petroleum Engineer" },
            { 'ar': "مهندس بيئي", 'en': "Environmental Engineer" },
            { 'ar': "مهندس إنشائي", 'en': "Structural Engineer" },
            { 'ar': "مهندس جيوتقني", 'en': "Geotechnical Engineer" },
            { 'ar': "مهندس موارد مائية", 'en': "Water Resources Engineer" },
            { 'ar': "مخطط حضري", 'en': "Urban Planner" }
        ]
    },
    {
        name: { 'ar': "الرعاية الصحية", 'en': "Healthcare" },
        icon: "fas fa-heartbeat",
        professions: [
            { 'ar': "طبيب", 'en': "Doctor" },
            { 'ar': "ممرض", 'en': "Nurse" },
            { 'ar': "صيدلي", 'en': "Pharmacist" },
            { 'ar': "طبيب أسنان", 'en': "Dentist" },
            { 'ar': "جراح", 'en': "Surgeon" },
            { 'ar': "مساعد طبي", 'en': "Medical Assistant" },
            { 'ar': "مساعد طبيب أسنان", 'en': "Dental Assistant" },
            { 'ar': "أخصائي علاج طبيعي", 'en': "Physical Therapist" },
            { 'ar': "أخصائي علاج وظيفي", 'en': "Occupational Therapist" },
            { 'ar': "أخصائي علاج النطق", 'en': "Speech Therapist" },
            { 'ar': "أخصائي أشعة", 'en': "Radiologist" },
            { 'ar': "عالم مختبرات طبية", 'en': "Medical Laboratory Scientist" },
            { 'ar': "أخصائي تغذية", 'en': "Nutritionist" },
            { 'ar': "أخصائي حمية", 'en': "Dietitian" },
            { 'ar': "طبيب نفسي", 'en': "Psychiatrist" },
            { 'ar': "مقوّم عظام", 'en': "Chiropractor" },
            { 'ar': "أخصائي بصريات", 'en': "Optometrist" },
            { 'ar': "طبيب بيطري", 'en': "Veterinarian" },
            { 'ar': "مسعف/فني طوارئ طبية", 'en': "EMT/Paramedic" },
            { 'ar': "مُشفر طبي", 'en': "Medical Coder" },
            { 'ar': "محاسب طبي", 'en': "Medical Biller" }
        ]
    },
    {
        name: { 'ar': "المبيعات والتسويق", 'en': "Sales & Marketing" },
        icon: "fas fa-bullhorn",
        professions: [
            { 'ar': "مندوب مبيعات", 'en': "Sales Representative" },
            { 'ar': "مدير تسويق", 'en': "Marketing Manager" },
            { 'ar': "أخصائي تسويق رقمي", 'en': "Digital Marketing Specialist" },
            { 'ar': "أخصائي SEO", 'en': "SEO Specialist" },
            { 'ar': "أخصائي SEM", 'en': "SEM Specialist" },
            { 'ar': "مدير وسائل التواصل الاجتماعي", 'en': "Social Media Manager" },
            { 'ar': "أخصائي تسويق محتوى", 'en': "Content Marketing Specialist" },
            { 'ar': "مدير علامة تجارية", 'en': "Brand Manager" },
            { 'ar': "أخصائي علاقات عامة", 'en': "Public Relations Specialist" },
            { 'ar': "أخصائي إعلانات", 'en': "Advertising Specialist" },
            { 'ar': "محلل أبحاث سوق", 'en': "Market Research Analyst" },
            { 'ar': "أخصائي تجارة إلكترونية", 'en': "E-commerce Specialist" },
            { 'ar': "ممثل تطوير أعمال", 'en': "Business Development Representative" },
            { 'ar': "مدير حسابات", 'en': "Account Manager" },
            { 'ar': "مهندس مبيعات", 'en': "Sales Engineer" }
        ]
    },
    {
        name: { 'ar': "الضيافة والسياحة", 'en': "Hospitality & Tourism" },
        icon: "fas fa-hotel",
        professions: [
            { 'ar': "مدير فندق", 'en': "Hotel Manager" },
            { 'ar': "طباخ", 'en': "Cook" },
            { 'ar': "نادل", 'en': "Waiter" },
            { 'ar': "مرشد سياحي", 'en': "Tour Guide" },
            { 'ar': "وكيل سفر", 'en': "Travel Agent" },
            { 'ar': "منسق فعاليات", 'en': "Event Coordinator" },
            { 'ar': "بواب", 'en': "Concierge" },
            { 'ar': "مدبرة منزل", 'en': "Housekeeper" },
            { 'ar': "موظف استقبال", 'en': "Front Desk Agent" },
            { 'ar': "مدير منتجع", 'en': "Resort Manager" },
            { 'ar': "مدير تموين", 'en': "Catering Manager" },
            { 'ar': "خبير نبيذ", 'en': "Sommelier" }
        ]
    },
    {
        name: { 'ar': "العلوم والبحث", 'en': "Science & Research" },
        icon: "fas fa-flask",
        professions: [
            { 'ar': "عالم أحياء", 'en': "Biologist" },
            { 'ar': "كيميائي", 'en': "Chemist" },
            { 'ar': "فيزيائي", 'en': "Physicist" },
            { 'ar': "عالم بيئة", 'en': "Environmental Scientist" },
            { 'ar': "جيولوجي", 'en': "Geologist" },
            { 'ar': "عالم فلك", 'en': "Astronomer" },
            { 'ar': "عالم رياضيات", 'en': "Mathematician" },
            { 'ar': "إحصائي", 'en': "Statistician" },
            { 'ar': "عالم بيانات", 'en': "Data Scientist" },
            { 'ar': "باحث", 'en': "Researcher" },
            { 'ar': "فني مختبر", 'en': "Laboratory Technician" },
            { 'ar': "منسق بحث سريري", 'en': "Clinical Research Coordinator" },
            { 'ar': "عالم أوبئة", 'en': "Epidemiologist" },
            { 'ar': "عالم أحياء دقيقة", 'en': "Microbiologist" }
        ]
    },
    {
        name: { 'ar': "خدمة العملاء", 'en': "Customer Service" },
        icon: "fas fa-headset",
        professions: [
            { 'ar': "ممثل خدمة عملاء", 'en': "Customer Service Representative" },
            { 'ar': "وكيل مركز اتصال", 'en': "Call Center Agent" },
            { 'ar': "أخصائي دعم", 'en': "Support Specialist" },
            { 'ar': "مدير علاقات العملاء", 'en': "Client Relations Manager" },
            { 'ar': "دعم فني", 'en': "Technical Support" },
            { 'ar': "فني مكتب مساعدة", 'en': "Help Desk Technician" }
        ]
    },
    {
        name: { 'ar': "الفنون والترفيه", 'en': "Arts & Entertainment" },
        icon: "fas fa-mask",
        professions: [
            { 'ar': "موسيقي", 'en': "Musician" },
            { 'ar': "ممثل", 'en': "Actor" },
            { 'ar': "راقص", 'en': "Dancer" },
            { 'ar': "رسام", 'en': "Painter" },
            { 'ar': "نحات", 'en': "Sculptor" },
            { 'ar': "مصور", 'en': "Photographer" },
            { 'ar': "صانع أفلام", 'en': "Filmmaker" },
            { 'ar': "محرر فيديو", 'en': "Video Editor" },
            { 'ar': "رسام رسوم متحركة", 'en': "Animator" },
            { 'ar': "مهندس صوت", 'en': "Sound Engineer" },
            { 'ar': "ملحن", 'en': "Composer" },
            { 'ar': "كاتب", 'en': "Writer" },
            { 'ar': "صحفي", 'en': "Journalist" },
            { 'ar': "مدير فعاليات", 'en': "Event Manager" },
            { 'ar': "مدير مسرح", 'en': "Stage Manager" },
            { 'ar': "مصمم إضاءة", 'en': "Lighting Designer" },
            { 'ar': "مصمم أزياء (ملابس)", 'en': "Costume Designer" },
            { 'ar': "فنان مكياج", 'en': "Makeup Artist" },
            { 'ar': "مساعد معرض فني", 'en': "Gallery Assistant" }
        ]
    },
    {
        name: { 'ar': "الرياضة واللياقة البدنية", 'en': "Sports & Fitness" },
        icon: "fas fa-dumbbell",
        professions: [
            { 'ar': "مدرب شخصي", 'en': "Personal Trainer" },
            { 'ar': "مدرب لياقة بدنية", 'en': "Fitness Instructor" },
            { 'ar': "مدرب رياضي", 'en': "Sports Coach" },
            { 'ar': "مدرب يوجا", 'en': "Yoga Instructor" },
            { 'ar': "مدرب بيلاتس", 'en': "Pilates Instructor" },
            { 'ar': "مدير صالة ألعاب رياضية", 'en': "Gym Manager" },
            { 'ar': "أخصائي علاج رياضي", 'en': "Sports Therapist" },
            { 'ar': "مدرب رياضي", 'en': "Athletic Trainer" },
            { 'ar': "أخصائي تغذية", 'en': "Nutritionist" },
            { 'ar': "حكم/مراقب", 'en': "Referee/Umpire" },
            { 'ar': "صحفي رياضي", 'en': "Sports Journalist" }
        ]
    },
    {
        name: { 'ar': "اللوجستيات والنقل", 'en': "Logistics & Transportation" },
        icon: "fas fa-truck",
        professions: [
            { 'ar': "سائق", 'en': "Driver" },
            { 'ar': "منسق لوجستيات", 'en': "Logistics Coordinator" },
            { 'ar': "مدير سلسلة الإمداد", 'en': "Supply Chain Manager" },
            { 'ar': "مدير مستودع", 'en': "Warehouse Manager" },
            { 'ar': "مشغل رافعة شوكية", 'en': "Forklift Operator" },
            { 'ar': "سائق توصيل", 'en': "Delivery Driver", icon: "fas fa-box-open" },
            { 'ar': "مرسل", 'en': "Dispatcher" },
            { 'ar': "وسيط شحن", 'en': "Freight Broker" },
            { 'ar': "وسيط جمارك", 'en': "Customs Broker" },
            { 'ar': "سائق شاحنة سحب", 'en': "Tow Truck Driver", icon: "fas fa-truck-pickup" }
        ]
    },
    {
        name: { 'ar': "الزراعة والغذاء", 'en': "Agriculture & Food" },
        icon: "fas fa-seedling",
        professions: [
            { 'ar': "مزارع", 'en': "Farmer" },
            { 'ar': "مهندس زراعي", 'en': "Agricultural Engineer" },
            { 'ar': "مهندس زراعي", 'en': "Agronomist" },
            { 'ar': "عالم أغذية", 'en': "Food Scientist" },
            { 'ar': "طباخ", 'en': "Chef" },
            { 'ar': "خَبّاز", 'en': "Baker" },
            { 'ar': "جزار", 'en': "Butcher" },
            { 'ar': "أخصائي تكنولوجيا الغذاء", 'en': "Food Technologist" },
            { 'ar': "صياد", 'en': "Fisherman" },
        ]
    }
];

const citiesTranslations = {
    'city_abasan_al_kabira': { 'ar': 'عبسان الكبيرة', 'en': 'Abasan al-Kabira' },
    'city_abu_dis': { 'ar': 'أبو ديس', 'en': 'Abu Dis' },
    'city_bani_naim': { 'ar': 'بني نعيم', 'en': 'Bani Na\'im' },
    'city_bani_suheila': { 'ar': 'بني سهيلا', 'en': 'Bani Suheila' },
    'city_beit_hanoun': { 'ar': 'بيت حانون', 'en': 'Beit Hanoun' },
    'city_beit_jala': { 'ar': 'بيت جالا', 'en': 'Beit Jala' },
    'city_beit_lahia': { 'ar': 'بيت لاهيا', 'en': 'Beit Lahia' },
    'city_beit_sahour': { 'ar': 'بيت ساحور', 'en': 'Beit Sahour' },
    'city_beit_ummar': { 'ar': 'بيت أمر', 'en': 'Beit Ummar' },
    'city_beitunia': { 'ar': 'بيتونيا', 'en': 'Beitunia' },
    'city_bethlehem': { 'ar': 'بيت لحم', 'en': 'Bethlehem' },
    'city_al_bireh': { 'ar': 'البيرة', 'en': 'al-Bireh' },
    'city_deir_al_balah': { 'ar': 'دير البلح', 'en': 'Deir al-Balah' },
    'city_ad_dhahiriya': { 'ar': 'الظاهرية', 'en': 'ad-Dhahiriya' },
    'city_dura': { 'ar': 'دورا', 'en': 'Dura' },
    'city_gaza_city': { 'ar': 'مدينة غزة', 'en': 'Gaza City' },
    'city_halhul': { 'ar': 'حلحول', 'en': 'Halhul' },
    'city_hebron': { 'ar': 'الخليل', 'en': 'Hebron' },
    'city_idhna': { 'ar': 'إذنا', 'en': 'Idhna' },
    'city_jabalia': { 'ar': 'جباليا', 'en': 'Jabalia' },
    'city_jenin': { 'ar': 'جنين', 'en': 'Jenin' },
    'city_jericho': { 'ar': 'أريحا', 'en': 'Jericho' },
    'city_jerusalem': { 'ar': 'القدس', 'en': 'Jerusalem' },
    'city_khan_yunis': { 'ar': 'خان يونس', 'en': 'Khan Yunis' },
    'city_nablus': { 'ar': 'نابلس', 'en': 'Nablus' },
    'city_qabatiya': { 'ar': 'قباطية', 'en': 'Qabatiya' },
    'city_qalqilya': { 'ar': 'قلقيلية', 'en': 'Qalqilya' },
    'city_rafah': { 'ar': 'رفح', 'en': 'Rafah' },
    'city_ramallah': { 'ar': 'رام الله', 'en': 'Ramallah' },
    'city_sair': { 'ar': 'سعير', 'en': 'Sa\'ir' },
    'city_as_samu': { 'ar': 'السموع', 'en': 'as-Samu' },
    'city_surif': { 'ar': 'صوريف', 'en': 'Surif' },
    'city_tubas': { 'ar': 'طوباس', 'en': 'Tubas' },
    'city_tulkarm': { 'ar': 'طولكرم', 'en': 'Tulkarm' },
    'city_yabad': { 'ar': 'يعبد', 'en': 'Ya\'bad' },
    'city_al_yamun': { 'ar': 'اليمون', 'en': 'al-Yamun' },
    'city_yatta': { 'ar': 'يطا', 'en': 'Yatta' },
    'city_az_zawayda': { 'ar': 'الزوايدة', 'en': 'az-Zawayda' }
};


// --- Helper Functions ---

/**
 * Helper to get currency symbol for email templates.
 * @param {string} currencyCode - The currency code (e.g., 'USD').
 * @returns {string} The corresponding currency symbol.
 */
const getCurrencySymbolForEmail = (currencyCode) => {
    switch (currencyCode) {
        case 'USD': return '$';
        case 'ILS': return '₪';
        case 'JOD': return 'JD';
        case 'EUR': return '€';
        default: return '';
    }
};



/**
 * NEW: Helper function to get the Arabic translation for a given English key from a translation object.
 * @param {string} englishKey - The English key (e.g., 'Hebron', 'Home Maintenance').
 * @param {Object} translationsObject - The object containing translations (e.g., citiesTranslations).
 * @returns {string} The Arabic translation or the original key if not found.
 */
const getTranslation = (englishKey, translationsObject) => {
    if (!englishKey || !translationsObject) return englishKey || 'N/A';
    const translationEntry = Object.values(translationsObject).find(t => t.en === englishKey);
    return translationEntry ? translationEntry.ar : englishKey;
};

/**
 * NEW: Helper function to get the Font Awesome icon class for a category.
 * @param {string} englishCategory - The English category name (e.g., 'Home Maintenance').
 * @returns {string} The icon class or an empty string if not found.
 */
const getCategoryIcon = (englishCategory) => {
    const category = categoriesAndProfessionsTranslations.find(c => c.name.en === englishCategory);
    // Add inline style to ensure icon color is consistent
    return category && category.icon ? `<i class="${category.icon}" style="margin-left: 8px; color: #6366f1;"></i>` : '';
};

/**
 * NEW: Converts simple markdown for bolding to HTML.
 * @param {string} text - The text containing markdown.
 * @returns {string} The text with bold markdown converted to HTML.
 */
const convertMarkdownToHtml = (text) => {
    if (!text) return '';
    // Replace **text** with <strong>text</strong>
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
};


/**
 * Function to send email verification email.
 * @param {string} recipientEmail - The email address to send to.
 * @param {string} verificationCode - The verification code.
 * @returns {Object} - An object with a success status.
 */
async function sendVerificationEmail(recipientEmail, verificationCode) {
    try {
        logger.debug(`sendVerificationEmail called for: ${recipientEmail}`);
        const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:8080';
        const { subject, html } = sendVerificationEmailTemplate(verificationCode, appBaseUrl);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: subject,
            html: html
        };
        await transporter.sendMail(mailOptions);
        logger.info(`Verification email successfully sent to ${recipientEmail}`);
        return { success: true };
    } catch (error) {
        logger.error(`Error sending verification code to ${recipientEmail}:`, error);
        return { success: false, error: error.message };
    }
}

// --- New function for sending company invitations ---

/**
 * Sends a special invitation email to companies to sign up on haierly.
 * @param {string[]} recipientEmails - An array of email addresses to send the invitation to.
 * @returns {Promise<{success: boolean, count: number, error?: string}>}
 */
async function sendCompanyInviteEmail(recipientEmails) {
    let client;
    try {
        logger.debug(`Attempting to send company invitation emails to ${recipientEmails.length} recipients.`);
        client = await pool.connect();
        const { subject, html } = sendCompanyInviteEmailTemplate();

        const emailPromises = recipientEmails.map(email => {
            try {
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: subject,
                    html: html
                };
                return transporter.sendMail(mailOptions);
            } catch (error) {
                logger.error(`Error generating/sending company invite email to ${email}:`, error);
                throw error;
            }
        });

        await Promise.allSettled(emailPromises);
        logger.info(`Company invitation email sent to ${recipientEmails.length} recipients.`);
        return { success: true, count: recipientEmails.length };
    } catch (error) {
        logger.error(`Error sending company invite email:`, error);
        return { success: false, error: error.message };
    } finally {
        if (client) client.release();
    }
}

/**
 * Sends an AI interview invitation to an applicant with a secure link.
 * @param {string} recipientEmail
 * @param {string} jobTitle
 * @param {string} interviewLink
 * @param {number} employerUserId
 */
async function sendInterviewInviteEmail(recipientEmail, jobTitle, interviewLink, employerUserId, opts = {}) {
    try {
        const { expiresAt, durationMinutes, instructions } = opts || {};
        const { subject, html } = sendInterviewInviteEmailTemplate(jobTitle, interviewLink, expiresAt, durationMinutes, instructions);
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject,
            html
        };
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Function to send contact form email.
 * @param {Object} formData - The contact form data.
 * @returns {Object} - An object with a success status.
 */
async function sendContactFormEmail(formData) {
    try {
        const { subject, html } = sendContactFormEmailTemplate(formData);
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.CONTACT_EMAIL_RECIPIENT,
            subject: subject,
            html: html
        };
        await transporter.sendMail(mailOptions);
        logger.info(`Contact form email sent from ${formData.email}`);
        return { success: true };
    } catch (error) {
        logger.error('Error sending contact form email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Function to send password reset code email.
 * @param {string} recipientEmail - The email address to send the reset code to.
 * @param {string} resetCode - The password reset code.
 * @returns {Object} - An object with a success status.
 */
async function sendPasswordResetEmail(recipientEmail, resetCode) {
    try {
        logger.debug(`sendPasswordResetEmail called for: ${recipientEmail}`);
        const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:8080';
        const { subject, html } = sendPasswordResetEmailTemplate(resetCode);
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: subject,
            html: html
        };
        await transporter.sendMail(mailOptions);
        logger.info(`Password reset code email successfully sent to ${recipientEmail}`);
        return { success: true };
    } catch (error) {
        logger.error(`Error sending password reset code email to ${recipientEmail}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Function for when an application is accepted.
 * @param {string} recipientEmail - The recipient's email address.
 * @param {string} recipientName - The recipient's name.
 * @param {string} jobTitle - The title of the job.
 * @returns {Object} - An object with a success status.
 */
async function sendApplicationAcceptedEmail(recipientEmail, recipientName, jobTitle) {
    try {
        logger.debug(`sendApplicationAcceptedEmail called for: ${recipientEmail}`);
        const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:8080';
        const { subject, html } = sendApplicationAcceptedEmailTemplate(recipientName, jobTitle, appBaseUrl);
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: subject,
            html: html
        };
        await transporter.sendMail(mailOptions);
        logger.info(`Application accepted email sent to ${recipientEmail}`);
        return { success: true };
    } catch (error) {
        logger.error(`Error sending application accepted email to ${recipientEmail}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Function for when an application is rejected.
 * @param {string} recipientEmail - The recipient's email address.
 * @param {string} recipientName - The recipient's name.
 * @param {string} jobTitle - The title of the job.
 * @returns {Object} - An object with a success status.
 */
async function sendApplicationRejectedEmail(recipientEmail, recipientName, jobTitle, rejectionReason = null) {
    try {
        logger.debug(`sendApplicationRejectedEmail called for: ${recipientEmail}`);
        const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:8080';
        const { subject, html } = sendApplicationRejectedEmailTemplate(recipientName, jobTitle, appBaseUrl, rejectionReason);
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: subject,
            html: html
        };
        await transporter.sendMail(mailOptions);
        logger.info(`Application rejected email sent to ${recipientEmail}`);
        return { success: true };
    } catch (error) {
        logger.error(`Error sending application rejected email to ${recipientEmail}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Function to send a direct job offer to a professional.
 * @param {Object} - Object containing email details.
 * @returns {Object} - An object with a success status.
 */
const sendJobOfferEmail = async ({ professionalEmail, professionalName, employerName, jobTitle, offerMessage, jobId }) => {
    const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:8080';
    const jobLink = `${appBaseUrl}/job_details/${jobId}`;
    const { subject, html } = sendJobOfferEmailTemplate(professionalName, employerName, jobTitle, offerMessage, jobId, appBaseUrl);

    try {
        await transporter.sendMail({
            from: { name: 'Hirly', address: process.env.EMAIL_USER },
            to: professionalEmail,
            subject: subject,
            html: html,
        });
        return { success: true };
    } catch (error) {
        logger.error('Error sending job offer email:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Sends a manual job alert to a filtered list of users.
 * @param {Array<number>} jobIds - The IDs of the jobs to include in the alert.
 * @param {Object} filters - An object containing filters for recipients (e.g., location, professions, or a custom list of emails).
 * @returns {Object} - An object with a success status.
 */
const sendManualJobAlerts = async (jobIds, filters) => {
    let client;
    try {
        logger.debug(`sendManualJobAlerts called with jobIds: ${jobIds} and filters:`, filters);

        if (!jobIds || jobIds.length === 0) {
            return { success: false, error: 'No job IDs provided.' };
        }

        const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:8080';
        client = await pool.connect();

        // Step 1: Fetch job details for the selected jobs
        const jobQueryText = `
            SELECT j.id, j.title, e.company_name AS employer_company_name, u.first_name AS employer_first_name, u.last_name AS employer_last_name, j.category, j.city, j.budget, j.currency
            FROM jobs j
            LEFT JOIN users u ON j.employer_id = u.id
            LEFT JOIN employers e ON u.id = e.user_id
            WHERE j.id = ANY($1::int[])`;
        const { rows: jobs } = await client.query(jobQueryText, [jobIds]);
        
        if (jobs.length === 0) {
            return { success: false, error: 'No jobs found for the provided IDs.' };
        }

        let jobsHtml = '';
        jobs.forEach(job => {
            const currencySymbol = getCurrencySymbolForEmail(job.currency);
            const employerName = job.employer_company_name || `${job.employer_first_name || 'N/A'} ${job.last_name || 'N/A'}`;
            // Correctly get translated category and city names and the icon
            const translatedCategory = categoriesAndProfessionsTranslations.find(c => c.name.en === job.category)?.name.ar || job.category;
            const translatedCity = citiesTranslations[Object.keys(citiesTranslations).find(key => citiesTranslations[key].en === job.city)]?.ar || job.city;
            const categoryIcon = getCategoryIcon(job.category);
            jobsHtml += `
                <div style="padding: 15px; border-radius: 8px; border: 1px solid #e0e6eb; margin-bottom: 15px; background-color: #fdfdfd; text-align: right; direction: rtl;">
                    <h4 style="margin-top: 0; font-size: 18px; color: #333;">${job.title}</h4>
                    <p style="margin: 5px 0; font-size: 14px; color: #666;"><strong>صاحب العمل:</strong> ${employerName}</p>
                    <p style="margin: 5px 0; font-size: 14px; color: #666;">${categoryIcon} <strong>الفئة:</strong> ${translatedCategory}</p>
                    <p style="margin: 5px 0; font-size: 14px; color: #666;"><strong>الموقع:</strong> ${translatedCity}</p>
                    <p style="margin: 5px 0; font-size: 14px; color: #666;"><strong>المبلغ:</strong> ${currencySymbol}${parseFloat(job.budget).toLocaleString()}</p>
                    <a href="${appBaseUrl}/job_details.html?id=${job.id}" style="display: inline-block; margin-top: 10px; padding: 8px 15px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-size: 14px;">عرض الوظيفة</a>
                </div>
            `;
        });

        let recipients = [];
        if (filters.emails && filters.emails.length > 0) {
             recipients = filters.emails.map(email => ({ email, first_name: 'هايرلي User' }));
        } else {
            // Step 2: Fetch recipients based on filters if no custom list is provided
            const filterConditions = [];
            const filterValues = [];
            let paramIndex = 1;
            const joinClauses = [];

            // Always filter for professionals only
            filterConditions.push(`u.user_type = 'professional'`);

            if (filters.location && filters.location !== 'all') {
                filterConditions.push(`u.city = $${paramIndex++}`);
                filterValues.push(filters.location);
            }

            
            if (filters.professions && filters.professions.length > 0) {
                joinClauses.push(`JOIN professionals f ON u.id = f.professional_id`);
                if (Array.isArray(filters.professions)) {
                     filterConditions.push(`f.interested_professions @> $${paramIndex++}::jsonb`);
                     filterValues.push(JSON.stringify(filters.professions));
                } else {
                     throw new Error('Professions filter is not a valid array.');
                }
            }
            
            const whereClause = filterConditions.length > 0 ? `WHERE ${filterConditions.join(' AND ')}` : '';
            
            const recipientQueryText = `
                SELECT DISTINCT u.email, u.first_name
                FROM users u
                ${joinClauses.join(' ')}
                ${whereClause}
            `;
            const { rows: dbRecipients } = await client.query(recipientQueryText, filterValues);
            recipients = dbRecipients;
        }

        if (recipients.length === 0) {
            return { success: false, error: 'No recipients found for the selected filters or custom list.' };
        }
        
       // Step 3: Send emails to all recipients
        const { subject, html: mainContentHtml } = sendManualJobAlertsTemplate(jobsHtml);

        const emailPromises = recipients.map(recipient => {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: recipient.email,
                subject: subject,
                html: mainContentHtml
            };
            return transporter.sendMail(mailOptions);
        });

        const results = await Promise.allSettled(emailPromises);
        let failures = results.filter(r => r.status === 'rejected');
        
        if (failures.length > 0) {
            logger.warn(`${failures.length} emails failed to send.`);
        }

        logger.info(`Manual job alerts sent successfully to ${recipients.length - failures.length} out of ${recipients.length} recipients.`);
        return { success: true, count: recipients.length - failures.length };
    } catch (error) {
        logger.error(`Error sending manual job alerts:`, error);
        return { success: false, error: error.message };
    } finally {
        if (client) client.release();
    }
};

/**
 * Sends a general email campaign to a filtered list of users.
 * @param {string} subject - The subject of the email campaign.
 * @param {string} message - The HTML message body of the email.
 * @param {Object} filters - An object containing filters for recipients (e.g., userType, idVerificationStatus).
 * @param {string} template - The name of the template used.
 * @param {boolean} dryRun - Whether this is a dry run.
 * @param {string} testEmail - An email for a test send.
 * @returns {Object} - An object with a success status.
 */
const sendEmailCampaign = async (subject, message, filters, template, dryRun) => {
    let client;
    try {
        logger.info('Starting email campaign', { filters, template, dryRun });

        let recipientEmails = [];
        let recipients = [];
        
        if (filters.emails) {
            recipientEmails = filters.emails;
            recipients = recipientEmails.map(email => ({ email, first_name: '', last_name: '' }));
        } else {
            client = await pool.connect();
            const filterConditions = [];
            const filterValues = [];
            let paramIndex = 1;
            let joinClauses = '';

            if (filters.userType) {
                filterConditions.push(`u.user_type = ANY($${paramIndex++}::text[])`);
                filterValues.push(filters.userType);
            } else {
                 filterConditions.push(`u.user_type IN ('professional', 'employer')`);
            }
            if (filters.isEmailVerified !== undefined) {
                 filterConditions.push(`u.is_email_verified = $${paramIndex++}`);
                 filterValues.push(filters.isEmailVerified);
            }
            
            if (filters.idVerificationStatus) {
                const combinedStatus = filters.idVerificationStatus;
                
                if (filters.userType && filters.userType.includes('professional')) {
                     joinClauses += ` LEFT JOIN professionals f ON u.id = f.professional_id`;
                     filterConditions.push(`f.verification_status = ANY($${paramIndex++}::text[])`);
                     filterValues.push(combinedStatus);
                }
                
                if (filters.userType && filters.userType.includes('employer')) {
                     joinClauses += ` LEFT JOIN employers e ON u.id = e.user_id`;
                     filterConditions.push(`e.verification_status = ANY($${paramIndex++}::text[])`);
                     filterValues.push(combinedStatus);
                }
                
                if (!filters.userType || (filters.userType.length === 2 && filters.userType.includes('professional') && filters.userType.includes('employer'))) { // Case for 'all' user types
                    joinClauses = ` LEFT JOIN professionals f ON u.id = f.professional_id LEFT JOIN employers e ON u.id = e.user_id`;
                    filterConditions.push(`(f.verification_status = ANY($${paramIndex++}::text[]) OR e.verification_status = ANY($${paramIndex++}::text[]))`);
                    filterValues.push(combinedStatus, combinedStatus);
                }
            }
            
            const whereClause = filterConditions.length > 0 ? `WHERE ${filterConditions.join(' AND ')}` : '';
            const recipientQueryText = `
                SELECT DISTINCT u.email, u.first_name, u.last_name
                FROM users u
                ${joinClauses}
                ${whereClause}
            `;
            const result = await client.query(recipientQueryText, filterValues);
            recipients = result.rows;
            
            if (recipients.length === 0) {
                 return { success: false, error: 'No recipients found for the selected filters.' };
            }
            recipientEmails = recipients.map(r => r.email);
            logger.debug(`Found ${recipients.length} recipients for campaign.`);
        }

        if (dryRun) {
            logger.info('Email campaign DRY RUN', {
                subject,
                filters,
                template: template || 'Custom',
                recipientCount: recipients.length,
                recipients: recipientEmails
            });
            return { success: true, message: `Dry run successful. No emails were sent.`, count: recipients.length };
        }

        let emailResult;
        if (template === 'id-verification') {
            emailResult = await sendIdVerificationReminder(recipientEmails);
        } else if (template === 'email-verification') {
            emailResult = await sendEmailVerificationReminder(recipientEmails);
        } else if (template === 'general-welcome') {
            emailResult = await sendGeneralWelcomeEmail(recipientEmails);
        } else if (template === 'company-invite') {
            emailResult = await sendCompanyInviteEmail(recipientEmails);
        } else if (template === 'professional-welcome') {
            emailResult = await sendProfessionalWelcomeEmail(recipientEmails);
        } else if (template === 'employer-marketing') {
            const { subject: templateSubject, html } = sendEmployerMarketingEmailTemplate();
            const emailPromises = recipientEmails.map((email) => {
                const mailOptions = { from: process.env.EMAIL_USER, to: email, subject: templateSubject, html };
                return transporter.sendMail(mailOptions);
            });
            await Promise.allSettled(emailPromises);
            emailResult = { success: true, count: recipientEmails.length };
        } else {
            // New: Convert markdown message to HTML before sending
            const htmlMessage = convertMarkdownToHtml(message);
            
            // For custom templates, we need to personalize each email
            const emailPromises = recipients.map(async (recipient) => {
                // Replace template variables with user data
                let personalizedMessage = htmlMessage;
                let personalizedSubject = subject;
                
                // Replace {{first_name || company_name}} with actual user data
                const userName = recipient.first_name || recipient.last_name || 'فريق التوظيف المحترم';
                personalizedMessage = personalizedMessage.replace(/\{\{first_name \|\| company_name\}\}/g, userName);
                personalizedSubject = personalizedSubject.replace(/\{\{first_name \|\| company_name\}\}/g, userName);
                
                // Replace other common variables
                personalizedMessage = personalizedMessage.replace(/\{\{first_name\}\}/g, recipient.first_name || 'عزيزي المستخدم');
                personalizedMessage = personalizedMessage.replace(/\{\{last_name\}\}/g, recipient.last_name || '');
                personalizedMessage = personalizedMessage.replace(/\{\{email\}\}/g, recipient.email || '');
                
                const emailHtml = generateEmailHtmlWrapperRTL(personalizedSubject, personalizedMessage);
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: recipient.email,
                    subject: personalizedSubject,
                    html: emailHtml
                };
                return transporter.sendMail(mailOptions);
            });
            
            await Promise.allSettled(emailPromises);
            emailResult = { success: true, count: recipients.length };
        }

        logger.info(`Email campaign sent to ${emailResult.count} recipients.`);
        return { success: true, count: emailResult.count, message: `Email campaign sent to ${emailResult.count} recipients.` };
    } catch (error) {
        logger.error(`Error sending email campaign:`, error);
        return { success: false, error: error.message };
    } finally {
        if (client) client.release();
    }
};

/**
 * Sends a test email for a general email campaign.
 * @param {string} subject - The subject of the email campaign.
 * @param {string} message - The HTML message body of the email.
 * @param {string} testEmail - The email address to send the test to.
 * @param {string} template - The template name (optional).
 * @returns {Object} - An object with a success status.
 */
const sendEmailCampaignTest = async (subject, message, testEmail, template) => {
     try {
        logger.info('Starting email campaign test', { testEmail, template });
        
        if (template && template !== 'custom') {
            let emailResult;
            logger.debug(`Testing template: ${template}`);
            
            if (template === 'id-verification') {
                emailResult = await sendIdVerificationReminder([testEmail]);
            } else if (template === 'email-verification') {
                emailResult = await sendEmailVerificationReminder([testEmail]);
            } else if (template === 'general-welcome') {
                emailResult = await sendGeneralWelcomeEmail([testEmail]);
            } else if (template === 'company-invite') {
                emailResult = await sendCompanyInviteEmail([testEmail]);
            } else if (template === 'professional-welcome') {
                emailResult = await sendProfessionalWelcomeEmail([testEmail]);
            } else if (template === 'employer-marketing') {
                const { subject: templateSubject, html } = sendEmployerMarketingEmailTemplate();
                const mailOptions = { from: process.env.EMAIL_USER, to: testEmail, subject: templateSubject, html };
                await transporter.sendMail(mailOptions);
                emailResult = { success: true };
            } else if (template === 'employer-engagement') {
                const { subject: templateSubject, html } = sendEmployerEngagementEmailTemplate();
                const mailOptions = { from: process.env.EMAIL_USER, to: testEmail, subject: templateSubject, html };
                await transporter.sendMail(mailOptions);
                emailResult = { success: true };
            } else if (template === 'job-application-notification') {
                // Mock data for test
                const employerName = "صاحب العمل (تجريبي)";
                const jobTitle = "مهندس برمجيات (تجريبي)";
                const applicationCount = 5;
                const jobPostedDate = new Date().toLocaleDateString('ar-EG');
                const { subject: templateSubject, html } = sendJobApplicationNotificationEmailTemplate(employerName, jobTitle, applicationCount, jobPostedDate);
                const mailOptions = { from: process.env.EMAIL_USER, to: testEmail, subject: templateSubject, html };
                await transporter.sendMail(mailOptions);
                emailResult = { success: true };
            } else {
                // If template is not recognized, fall back or error? 
                // For safety, let's treat unknown templates as errors or fallback to message if provided.
                // But usually we want to know if it's not working.
                logger.warn(`Unknown template for test: ${template}`);
                // Proceed to custom message if provided, otherwise error.
                if (!message && !subject) throw new Error(`Template ${template} not found and no custom message provided.`);
            }

            if (emailResult) {
                if (emailResult.success) {
                    logger.info(`Test email campaign sent to ${testEmail} using template ${template}.`);
                    return { success: true, message: `Test email (${template}) sent successfully to ${testEmail}.` };
                } else {
                    throw new Error(emailResult.error || 'Failed to send template test email.');
                }
            }
        }

        // Default custom message behavior
        const htmlMessage = convertMarkdownToHtml(message);
        const emailHtml = generateEmailHtmlWrapperRTL(subject, htmlMessage);
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: testEmail,
            subject: subject,
            html: emailHtml
        };
        await transporter.sendMail(mailOptions);
        logger.info(`Test email campaign sent to ${testEmail}.`);
        return { success: true, message: `Test email sent successfully to ${testEmail}.` };
    } catch (error) {
        logger.error(`Error sending test email campaign to ${testEmail}:`, error);
        return { success: false, error: error.message };
    }
};

/**
 * Function for an admin to send a manual verification email to a user.
 * @param {string} recipientEmail - The email address to send to.
 * @param {string} recipientName - The name of the recipient.
 * @param {string} verificationCode - The verification code.
 * @returns {Object} - An object with a success status.
 */
async function sendAdminVerificationEmail(recipientEmail, recipientName, verificationCode) {
    try {
        logger.debug(`sendAdminVerificationEmail called for: ${recipientEmail}`);
        const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:8080';
        const { subject, html } = sendAdminVerificationEmailTemplate(recipientName, verificationCode, appBaseUrl);
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: subject,
            html: html
        };
        await transporter.sendMail(mailOptions);
        logger.info(`Admin verification email successfully sent to ${recipientEmail}`);
        return { success: true };
    } catch (error) {
        logger.error(`Error sending admin verification email to ${recipientEmail}:`, error);
        return { success: false, error: error.message };
    }
}


/**
 * Function to send an ID verification reminder email.
 * @param {Array<string>} recipientEmails - An array of email addresses to send to.
 * @returns {Object} - An object with a success status and count.
 */
async function sendIdVerificationReminder(recipientEmails) {
    let client;
    try {
        logger.debug(`sendIdVerificationReminder called for ${recipientEmails.length} recipients`);
        const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:8080';

        const emailPromises = recipientEmails.map(async (email) => {
            client = await pool.connect();
            try {
                const userResult = await client.query('SELECT first_name, last_name, user_type FROM users WHERE email = $1', [email]);
                const user = userResult.rows[0];
                const userName = user ? `${user.first_name} ${user.last_name}`.trim() : '';
                
                const { subject, html } = sendIdVerificationReminderEmailTemplate(userName, appBaseUrl);
                
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: subject,
                    html: html
                };
                return transporter.sendMail(mailOptions);
            } catch (error) {
                logger.error(`Error generating/sending ID verification reminder to ${email}:`, error);
                throw error;
            } finally {
                client.release();
            }
        });

        await Promise.allSettled(emailPromises);
        logger.info(`ID verification reminder sent to ${recipientEmails.length} recipients.`);
        return { success: true, count: recipientEmails.length };
    } catch (error) {
        logger.error(`Error sending ID verification reminder:`, error);
        return { success: false, error: error.message };
    } finally {
        if (client) client.release();
    }
}


/**
 * Function to send an email verification reminder email.
 * @param {Array<string>} recipientEmails - An array of email addresses to send to.
 * @returns {Object} - An object with a success status and count.
 */
async function sendEmailVerificationReminder(recipientEmails) {
    let client;
    try {
        logger.debug(`sendEmailVerificationReminder called for ${recipientEmails.length} recipients`);
        const subject = 'تذكير: يرجى تفعيل حسابك في منصة هايرلي';
        const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:8080';

        const emailPromises = recipientEmails.map(async (email) => {
            client = await pool.connect();
            try {
                const userResult = await client.query('SELECT id, first_name FROM users WHERE email = $1', [email]);
                const user = userResult.rows[0];

                if (!user) {
                    logger.warn(`User with email ${email} not found for email verification reminder. Skipping.`);
                    return { success: false, error: `User ${email} not found` };
                }

                // Generate new token
                const newToken = Math.floor(100000 + Math.random() * 900000).toString();
                const newExpiry = new Date(Date.now() + 30 * 60 * 1000);
                await client.query('DELETE FROM email_verification_tokens WHERE user_id = $1', [user.id]);
                await client.query(
                    'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
                    [user.id, newToken, newExpiry]
                );

                const userName = user ? user.first_name || 'هايرلي User' : 'هايرلي User';
                const verificationLink = `${appBaseUrl}/email_verification_pending.html?email=${encodeURIComponent(email)}`;

                const { subject, html } = sendEmailVerificationReminderEmailTemplate(userName, verificationLink, newToken);
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: subject,
                    html: html
                };
                return transporter.sendMail(mailOptions);
            } catch (error) {
                logger.error(`Error generating/sending email verification reminder to ${email}:`, error);
                throw error;
            } finally {
                client.release();
            }
        });

        await Promise.allSettled(emailPromises);
        logger.info(`Email verification reminder sent to ${recipientEmails.length} recipients.`);
        return { success: true, count: recipientEmails.length };
    } catch (error) {
        logger.error(`Error sending email verification reminder:`, error);
        return { success: false, error: error.message };
    } finally {
        if (client) client.release();
    }
}


/**
 * Function to send a general welcome email. This is a new function for a general welcome email
 * campaign that can be sent to both new and old users without appearing strange.
 * @param {Array<string>} recipientEmails - An array of email addresses to send to.
 * @returns {Object} - An object with a success status and count.
 */
async function sendGeneralWelcomeEmail(recipientEmails) {
    let client;
    try {
        logger.debug(`sendGeneralWelcomeEmail called for ${recipientEmails.length} recipients`);
        const subject = 'أهلاً بك في عائلة هايرلي!';
        const emailPromises = recipientEmails.map(async (email) => {
            client = await pool.connect();
            try {
                const userResult = await client.query('SELECT first_name FROM users WHERE email = $1', [email]);
                const user = userResult.rows[0];
                const userName = user ? user.first_name || 'هايرلي User' : 'هايرلي User';
                
                const { subject, html } = sendGeneralWelcomeEmailTemplate(userName);
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: subject,
                    html: html
                };
                return transporter.sendMail(mailOptions);
            } catch (error) {
                logger.error(`Error generating/sending general welcome email to ${email}:`, error);
                throw error;
            } finally {
                client.release();
            }
        });

        await Promise.allSettled(emailPromises);
        logger.info(`General welcome email sent to ${recipientEmails.length} recipients.`);
        return { success: true, count: recipientEmails.length };
    } catch (error) {
        logger.error(`Error sending general welcome email:`, error);
        return { success: false, error: error.message };
    } finally {
        if (client) client.release();
    }
}

/**
 * Function to send a welcome email to a new professional.
 * @param {string[]} recipientEmails - An array of email addresses to send to.
 * @returns {Object} - An object with a success status.
 */
async function sendProfessionalWelcomeEmail(recipientEmails) {
    let client;
    try {
        logger.debug(`sendProfessionalWelcomeEmail called for ${recipientEmails.length} recipients`);
        const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:8080';

        const emailPromises = recipientEmails.map(async (email) => {
            client = await pool.connect();
            try {
                const userResult = await client.query('SELECT first_name FROM users WHERE email = $1', [email]);
                const user = userResult.rows[0];
                const userName = user ? user.first_name || 'Professional' : 'Professional';

                const { subject, html } = sendProfessionalWelcomeEmailTemplate(userName, appBaseUrl);

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: subject,
                    html: html
                };
                return transporter.sendMail(mailOptions);
            } catch (error) {
                logger.error(`Error sending professional welcome email to ${email}:`, error);
                throw error;
            } finally {
                client.release();
            }
        });

        await Promise.allSettled(emailPromises);
        logger.info(`Professional welcome email sent to ${recipientEmails.length} recipients.`);
        return { success: true, count: recipientEmails.length };
    } catch (error) {
        logger.error(`Error sending professional welcome email:`, error);
        return { success: false, error: error.message };
    } finally {
        if (client) client.release();
    }
}


// --- Generic Send Email Function ---
async function sendPasswordResetConfirmationEmail(recipientEmail, recipientName) {
    try {
        const { subject, html } = sendPasswordResetConfirmationEmailTemplate(recipientName);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: subject,
            html: html
        };

        const result = await transporter.sendMail(mailOptions);
        logger.info(`Password reset confirmation email successfully sent to ${recipientEmail}`);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        logger.error(`Failed to send password reset confirmation email to ${recipientEmail}:`, error);
        return { success: false, error: error.message };
    }
}

const sendEmail = async (to, subject, message, options = {}) => {
    try {
        // Check if message is already a full HTML document
        const isHtml = options.isHtml || /<html|<body|<div/i.test(message);
        const emailHtml = isHtml ? message : generateEmailHtmlWrapperRTL(subject, message.replace(/\n/g, '<br>'));
        
        const mailOptions = {
            to: to,
            subject: subject,
            text: isHtml ? 'Please view this email in an HTML-compatible client.' : message,
            html: emailHtml,
            ...options
        };
        
        await transporter.sendMail(mailOptions);
        logger.info(`Email successfully sent to ${to}`);
        return { success: true };
    } catch (error) {
        logger.error(`Error sending email to ${to}:`, error);
        return { success: false, error: error.message };
    }
};

/**
 * Special function for the Auto Email System using dedicated credentials
 */
const sendAutoEmail = async (to, subject, message) => {
    return sendEmail(to, subject, message);
};

/**
 * Function to send an email from a user to a professional.
 * This allows users to contact professionals directly through the platform.
 */
async function sendUserToProfessionalEmail(senderDetails, recipientEmail, subject, message) {
    try {
        const { html } = sendUserToProfessionalEmailTemplate(senderDetails, subject, message);

        const mailOptions = {
            from: `"${senderDetails.firstName} ${senderDetails.lastName} عبر هايرلي" <${process.env.EMAIL_USER}>`,
            to: recipientEmail,
            replyTo: senderDetails.email,
            subject: `[هايرلي] ${subject}`,
            text: `رسالة من ${senderDetails.firstName} ${senderDetails.lastName} (${senderDetails.email}):\n\nالموضوع: ${subject}\n\n${message}\n\nرد مباشرة على هذا البريد الإلكتروني للرد على ${senderDetails.firstName}.`,
            html: html
        };
        
        await transporter.sendMail(mailOptions);
        logger.info(`User-to-professional email successfully sent from ${senderDetails.email} to ${recipientEmail}`);
        return { success: true };
    } catch (error) {
        logger.error(`Error sending user-to-professional email:`, error);
        return { success: false, error: error.message };
    }
}

// --- Module Exports ---
module.exports = {
    sendEmail,
    sendAutoEmail,
    sendVerificationEmail,
    sendContactFormEmail,
    sendApplicationAcceptedEmail,
    sendApplicationRejectedEmail,
    sendJobOfferEmail,
    sendManualJobAlerts,
    sendEmailCampaign,
    sendEmailCampaignTest,
    sendIdVerificationReminder,
    sendEmailVerificationReminder,
    sendGeneralWelcomeEmail,
    sendCompanyInviteEmail,
    sendProfessionalWelcomeEmail,
    sendPasswordResetEmail,
    sendPasswordResetConfirmationEmail,
    sendUserToProfessionalEmail,
    sendInterviewInviteEmail,
    sendInterviewCompletedEmail
};
