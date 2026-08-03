const hirlyHierarchy = [
    {
        name: { 'ar': "الخدمات الحرفية والعامة", 'en': "Trades & Services" },
        professions: [
            { 'ar': "سباك", 'en': "Plumber" },
            { 'ar': "كهربائي", 'en': "Electrician" },
            { 'ar': "ميكانيكي", 'en': "Mechanic" },
            { 'ar': "دهان", 'en': "Painter" },
            { 'ar': "لحام", 'en': "Welder" },
            { 'ar': "عامل بناء", 'en': "Construction Worker" },
            { 'ar': "عامل نظافة", 'en': "Cleaner" },
            { 'ar': "حداد", 'en': "Blacksmith" },
            { 'ar': "مزارع", 'en': "Farmer" },
            { 'ar': "نجار", 'en': "Carpenter" },
            { 'ar': "عامل ألمنيوم", 'en': "Aluminum Worker" },
            { 'ar': "فني تكييف", 'en': "HVAC Technician" }
        ]
    },
    {
        name: { 'ar': "الخدمات العامة", 'en': "General Services" },
        professions: [
            { 'ar': "صراف", 'en': "Cashier" },
            { 'ar': "موظف سوبر ماركت", 'en': "Supermarket Staff" },
            { 'ar': "موظف مطعم", 'en': "Restaurant Staff" },
            { 'ar': "موظف فندق", 'en': "Hotel Staff" },
            { 'ar': "مربية", 'en': "Nanny" },
            { 'ar': "خياط", 'en': "Tailor" },
            { 'ar': "خَبّاز", 'en': "Baker" },
            { 'ar': "حارس أمن", 'en': "Security Guard" },
            { 'ar': "باريستا", 'en': "Barista" },
            { 'ar': "عامل مستودع", 'en': "Warehouse Worker" },
            { 'ar': "مصفف شعر", 'en': "Hairdresser" }
        ]
    },
    {
        name: { 'ar': "الإبداع والتصميم", 'en': "Creative & Design" },
        professions: [
            { 'ar': "فنان", 'en': "Artist" },
            { 'ar': "مصمم (جرافيك/واجهة مستخدم/تجربة مستخدم)", 'en': "Designer (Graphic/UI/UX)" },
            { 'ar': "رسام توضيحي", 'en': "Illustrator" },
            { 'ar': "مصور", 'en': "Photographer" },
            { 'ar': "رسام رسوم متحركة", 'en': "Animator" },
            { 'ar': "مصمم أزياء", 'en': "Fashion Designer" },
            { 'ar': "مصمم داخلي", 'en': "Interior Designer" },
            { 'ar': "باحث تجربة مستخدم", 'en': "UX Researcher" },
            { 'ar': "مصمم منتجات", 'en': "Product Designer" }
        ]
    },
    {
        name: { 'ar': "الإعلام والصحافة", 'en': "Media & Journalism" },
        professions: [
            { 'ar': "صحفي", 'en': "Journalist" },
            { 'ar': "محرر فيديو", 'en': "Video Editor" },
            { 'ar': "صانع أفلام", 'en': "Filmmaker" },
            { 'ar': "مهندس صوت", 'en': "Sound Engineer" }
        ]
    },
    {
        name: { 'ar': "التكنولوجيا والتطوير", 'en': "Tech & Development" },
        professions: [
            { 'ar': "مطور ويب (واجهة أمامية)", 'en': "Web Developer (Frontend)" },
            { 'ar': "مطور ويب (واجهة خلفية)", 'en': "Web Developer (Backend)" },
            { 'ar': "مطور شامل", 'en': "Full-Stack Developer" },
            { 'ar': "مطور تطبيقات جوال (iOS)", 'en': "Mobile App Developer (iOS)" },
            { 'ar': "مطور تطبيقات جوال (أندرويد)", 'en': "Mobile App Developer (Android)" },
            { 'ar': "مطور برمجيات", 'en': "Software Developer" },
            { 'ar': "محلل بيانات", 'en': "Data Analyst" },
            { 'ar': "أخصائي دعم تكنولوجيا المعلومات", 'en': "IT Support Specialist" },
            { 'ar': "أخصائي أمن سيبراني", 'en': "Cybersecurity Specialist" },
            { 'ar': "مهندس DevOps", 'en': "DevOps Engineer" },
            { 'ar': "مهندس ذكاء اصطناعي", 'en': "AI Engineer" }
        ]
    },
    {
        name: { 'ar': "الأعمال والمالية", 'en': "Business & Finance" },
        professions: [
            { 'ar': "محاسب", 'en': "Accountant" },
            { 'ar': "محلل أعمال", 'en': "Business Analyst" },
            { 'ar': "أخصائي موارد بشرية", 'en': "HR Specialist" },
            { 'ar': "مدير مشروع", 'en': "Project Manager" },
            { 'ar': "أخصائي مبيعات", 'en': "Sales Professional" },
            { 'ar': "أخصائي تسويق", 'en': "Marketing Specialist" },
            { 'ar': "محلل مالي", 'en': "Financial Analyst" },
            { 'ar': "ممثل خدمة عملاء", 'en': "Customer Service Representative" }
        ]
    },
    {
        name: { 'ar': "الكتابة والمحتوى", 'en': "Writing & Content" },
        professions: [
            { 'ar': "منشئ محتوى", 'en': "Content Creator" },
            { 'ar': "كاتب إعلانات", 'en': "Copywriter" },
            { 'ar': "محرر", 'en': "Editor" },
            { 'ar': "مترجم", 'en': "Translator" },
            { 'ar': "مدقق لغوي", 'en': "Proofreader" }
        ]
    },
    {
        name: { 'ar': "الهندسة", 'en': "Engineering" },
        professions: [
            { 'ar': "مهندس مدني", 'en': "Civil Engineer" },
            { 'ar': "مهندس معماري", 'en': "Architect" },
            { 'ar': "مهندس ميكانيكي", 'en': "Mechanical Engineer" },
            { 'ar': "مهندس كهربائي", 'en': "Electrical Engineer" },
            { 'ar': "مهندس برمجيات", 'en': "Software Engineer" }
        ]
    },
    {
        name: { 'ar': "الرعاية الصحية", 'en': "Healthcare" },
        professions: [
            { 'ar': "طبيب", 'en': "Doctor" },
            { 'ar': "ممرض", 'en': "Nurse" },
            { 'ar': "صيدلي", 'en': "Pharmacist" },
            { 'ar': "طبيب أسنان", 'en': "Dentist" },
            { 'ar': "أخصائي علاج طبيعي", 'en': "Physical Therapist" }
        ]
    },
    {
        name: { 'ar': "المبيعات والتسويق", 'en': "Sales & Marketing" },
        professions: [
            { 'ar': "مندوب مبيعات", 'en': "Sales Representative" },
            { 'ar': "مدير تسويق", 'en': "Marketing Manager" },
            { 'ar': "أخصائي تسويق رقمي", 'en': "Digital Marketing Specialist" },
            { 'ar': "أخصائي SEO", 'en': "SEO Specialist" },
            { 'ar': "مدير وسائل التواصل الاجتماعي", 'en': "Social Media Manager" }
        ]
    }
];

module.exports = hirlyHierarchy;
