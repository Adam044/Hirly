// public/language/categories-professions-translations.js
// This file defines global categories and professions data with translations.
// It will be loaded by pages that need access to this structured, translatable data.

// Ensure window.globalCategoriesAndProfessions is defined once, or define it if not.
// The primary purpose of this file is to set this global variable.
if (typeof window.globalCategoriesAndProfessions === 'undefined') {
    window.globalCategoriesAndProfessions = [
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
                { 'ar': "خراط خشب", 'en': "Woodturner", icon: "fas fa-tree" },
                { 'ar': "صانع فخار", 'en': "Potter", icon: "fas fa-vase" },
                { 'ar': "نساج", 'en': "Weaver", icon: "fas fa-fabric" },
                { 'ar': "صانع صابون", 'en': "Soap Maker", icon: "fas fa-soap" },
                { 'ar': "صانع زجاج", 'en': "Glassblower", icon: "fas fa-wine-glass" },
                { 'ar': "فني تكييف", 'en': "HVAC Technician", icon: "fas fa-fan" },
                { 'ar': "فني أجهزة منزلية", 'en': "Appliance Repair Technician", icon: "fas fa-tools" },
                { 'ar': "فني طاقة شمسية", 'en': "Solar Panel Technician", icon: "fas fa-solar-panel" },
                { 'ar': "نجار", 'en': "Carpenter", icon: "fas fa-hammer" },
                { 'ar': "عامل ألمنيوم", 'en': "Aluminum Worker", icon: "fas fa-industry" },
                { 'ar': "سائق باجر", 'en': "Excavator Operator", icon: "fas fa-truck-monster" },
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
                { 'ar': "رسام رسوم متحركة", 'en': "Animator" },
                { 'ar': "مصمم أزياء", 'en': "Fashion Designer" },
                { 'ar': "مصمم داخلي", 'en': "Interior Designer" },
                { 'ar': "فنان ألعاب", 'en': "Game Artist" },
                { 'ar': "مدير فني", 'en': "Art Director" },
                { 'ar': "مدير إبداعي", 'en': "Creative Director" },
                { 'ar': "مصمم ديكور", 'en': "Set Designer" },
                { 'ar': "مصمم مجوهرات", 'en': "Jewelry Designer" },
                { 'ar': "فنان خزف", 'en': "Ceramic Artist" },
                { 'ar': "باحث تجربة مستخدم", 'en': "UX Researcher" },
                { 'ar': "مصمم منتجات", 'en': "Product Designer" }
            ]
        },
        {
            name: { 'ar': "الإعلام والصحافة", 'en': "Media & Journalism" },
            icon: "fas fa-bullhorn",
            professions: [
                { 'ar': "صحفي", 'en': "Journalist" },
                { 'ar': "محرر فيديو", 'en': "Video Editor" },
                { 'ar': "صانع أفلام", 'en': "Filmmaker" },
                { 'ar': "كاتب سيناريو", 'en': "Screenwriter" },
                { 'ar': "مذيع أخبار", 'en': "News Anchor" },
                { 'ar': "مقدم برامج إذاعية", 'en': "Radio Host" },
                { 'ar': "مهندس صوت", 'en': "Sound Engineer" }
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
                
                { 'ar': "مدقق حسابات", 'en': "Auditor" },
                { 'ar': "مصرفي استثماري", 'en': "Investment Banker" },
                { 'ar': "محلل مالي", 'en': "Financial Analyst" },
                { 'ar': "مدير مخاطر", 'en': "Risk Manager" },
                { 'ar': "مسؤول امتثال", 'en': "Compliance Officer" },
                { 'ar': "استشاري إدارة", 'en': "Management Consultant" },
                { 'ar': "مدير تطوير أعمال", 'en': "Business Development Manager" },
                { 'ar': "ممثل خدمة عملاء", 'en': "Customer Service Representative" },
                
                { 'ar': "استشاري توظيف", 'en': "Recruitment Consultant" },
                { 'ar': "مساعد تنفيذي", 'en': "Executive Assistant" },
                { 'ar': "مدير مكتب", 'en': "Office Manager" },
                
                { 'ar': "أخصائي مشتريات", 'en': "Procurement Specialist" },
                
                { 'ar': "رائد أعمال", 'en': "Entrepreneur" },
                { 'ar': "مستشار شركات ناشئة", 'en': "Startup Advisor" },
                { 'ar': "متداول أسهم", 'en': "Stock Trader" },
                { 'ar': "متداول فوركس", 'en': "Forex Trader" },
                { 'ar': "متداول سلع", 'en': "Commodities Trader" },
                { 'ar': "محلل سوق المال", 'en': "Market Analyst" },
                { 'ar': "مدير محفظة استثمارية", 'en': "Portfolio Manager" },
                { 'ar': "مستشار استثمار", 'en': "Investment Advisor" },
                { 'ar': "متداول عقود مستقبلية", 'en': "Futures Trader" },
                { 'ar': "متداول options", 'en': "Options Trader" },
                { 'ar': "خبير تداول خوارزمي", 'en': "Algorithmic Trading Specialist" },
                { 'ar': "محلل مخاطر مالية", 'en': "Financial Risk Analyst" },
                { 'ar': "محلل بيانات مالية", 'en': "Financial Data Analyst" },
                { 'ar': "متداول عملات رقمية", 'en': "Cryptocurrency Trader" },
                { 'ar': "مستشار تداول", 'en': "Trading Consultant" },
                { 'ar': "مقيم عقارات", 'en': "Property Appraiser", icon: "fas fa-home" },
                { 'ar': "منسق حفلات زفاف", 'en': "Wedding Planner", icon: "fas fa-heart" },
                { 'ar': "مصمم مناظر طبيعية", 'en': "Landscape Designer", icon: "fas fa-seedling" },
                { 'ar': "مدرب قيادة", 'en': "Driving Instructor", icon: "fas fa-car" }
            ]
        },
        {
            name: { 'ar': "الكتابة والمحتوى", 'en': "Writing & Content" },
            icon: "fas fa-pen-nib",
            professions: [
                { 'ar': "منشئ محتوى", 'en': "Content Creator" },
                { 'ar': "كاتب إعلانات", 'en': "Copywriter" },
                { 'ar': "محرر", 'en': "Editor" },
                { 'ar': "كاتب", 'en': "Writer" },
                { 'ar': "مترجم", 'en': "Translator" },
                { 'ar': "مدون", 'en': "Blogger" },
                { 'ar': "مدقق لغوي", 'en': "Proofreader" },
                { 'ar': "كاتب تقني", 'en': "Technical Writer" },
                { 'ar': "شاعر", 'en': "Poet" },
                { 'ar': "روائي", 'en': "Novelist" },
                { 'ar': "كاتب عمود", 'en': "Columnist" },
                { 'ar': "استراتيجي محتوى", 'en': "Content Strategist" },
                { 'ar': "كاتب محتوى SEO", 'en': "SEO Content Writer" },
                { 'ar': "كاتب أكاديمي", 'en': "Academic Writer" },
                { 'ar': "كاتب خطابات", 'en': "Speechwriter" },
                { 'ar': "معلق صوتي", 'en': "Voiceover Artist" }
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
                
                { 'ar': "أخصائي حمية", 'en': "Dietitian" },
                { 'ar': "طبيب نفسي", 'en': "Psychiatrist" },
                { 'ar': "مقوّم عظام", 'en': "Chiropractor" },
                { 'ar': "أخصائي بصريات", 'en': "Optometrist" },
                { 'ar': "طبيب بيطري", 'en': "Veterinarian" },
                { 'ar': "مسعف/فني طوارئ طبية", 'en': "EMT/Paramedic" },
                { 'ar': "مُشفر طبي", 'en': "Medical Coder" },
                { 'ar': "محاسب طبي", 'en': "Medical Biller" },
                { 'ar': "مساج علاجي", 'en': "Massage Therapist", icon: "fas fa-hands" },
                { 'ar': "أخصائي علاج بالأعشاب", 'en': "Herbalist", icon: "fas fa-leaf" }
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
                { 'ar': "طاهي", 'en': "Chef" },
                { 'ar': "نادل", 'en': "Waiter" },
                { 'ar': "مرشد سياحي", 'en': "Tour Guide" },
                { 'ar': "وكيل سفر", 'en': "Travel Agent" },
                { 'ar': "منسق فعاليات", 'en': "Event Coordinator" },
                { 'ar': "بواب", 'en': "Concierge" },
                { 'ar': "مدبرة منزل", 'en': "Housekeeper" },
                { 'ar': "موظف استقبال", 'en': "Front Desk Agent" },
                { 'ar': "مدير منتجع", 'en': "Resort Manager" },
                { 'ar': "مدير تموين", 'en': "Catering Manager" }
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
                { 'ar': "رسام", 'en': "Painter" },
                { 'ar': "نحات", 'en': "Sculptor" },
                { 'ar': "ملحن", 'en': "Composer" },
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
                { 'ar': "مهندس زراعي", 'en': "Agricultural Engineer" },
                { 'ar': "اختصاصي زراعة", 'en': "Agronomist" },
                { 'ar': "عالم أغذية", 'en': "Food Scientist" },
                
                { 'ar': "خَبّاز", 'en': "Baker" },
                { 'ar': "جزار", 'en': "Butcher" },
                { 'ar': "أخصائي تكنولوجيا الغذاء", 'en': "Food Technologist" },
                { 'ar': "صياد", 'en': "Fisherman" },
            ]
        },
        {
            name: { 'ar': "التأمين", 'en': "Insurance" },
            icon: "fas fa-shield-alt",
            professions: [
                { 'ar': "وكيل تأمين", 'en': "Insurance Agent" },
                { 'ar': "مُقيِّم مطالبات", 'en': "Claims Adjuster" },
                { 'ar': "مُكتتب تأمين", 'en': "Underwriter" },
                { 'ar': "خبير اكتواري", 'en': "Actuary" },
                { 'ar': "وسيط تأمين", 'en': "Insurance Broker" },
                { 'ar': "محلل مخاطر تأمينية", 'en': "Insurance Risk Analyst" },
                { 'ar': "أخصائي تأمين تكافلي", 'en': "Takaful Specialist" },
                { 'ar': "مدقق داخلي", 'en': "Internal Auditor" }
            ]
        },
        {
            name: { 'ar': "التصنيع والإنتاج", 'en': "Manufacturing & Production" },
            icon: "fas fa-industry",
            professions: [
                { 'ar': "عامل تجميع", 'en': "Assembly Line Worker" },
                { 'ar': "مشغل آلة", 'en': "Machine Operator" },
                { 'ar': "مشغل CNC", 'en': "CNC Operator" },
                { 'ar': "مفتش جودة", 'en': "Quality Control Inspector" },
                { 'ar': "مشرف إنتاج", 'en': "Production Supervisor" },
                { 'ar': "مخطط إنتاج", 'en': "Production Planner" },
                { 'ar': "عامل مصنع", 'en': "Factory Worker" }
            ]
        },
        {
            name: { 'ar': "الطاقة والمرافق", 'en': "Energy & Utilities" },
            icon: "fas fa-bolt",
            professions: [
                { 'ar': "فني خطوط كهرباء", 'en': "Electrical Line Worker" },
                { 'ar': "مشغل محطة طاقة", 'en': "Power Plant Operator" },
                { 'ar': "فني طاقة متجددة", 'en': "Renewable Energy Technician" },
                { 'ar': "فني توربينات رياح", 'en': "Wind Turbine Technician" },
                { 'ar': "مشغل معالجة مياه", 'en': "Water Treatment Operator" },
                { 'ar': "فني عدادات مرافق", 'en': "Utility Meter Technician" }
            ]
        },
        {
            name: { 'ar': "الاتصالات", 'en': "Telecommunications" },
            icon: "fas fa-satellite-dish",
            professions: [
                { 'ar': "مهندس اتصالات", 'en': "Telecom Engineer" },
                { 'ar': "فني شبكات", 'en': "Network Technician" },
                { 'ar': "فني ألياف ضوئية", 'en': "Fiber Optic Technician" },
                { 'ar': "فني أبراج اتصالات", 'en': "Tower Technician" },
                { 'ar': "مدير تشغيل الاتصالات", 'en': "Telecom Operations Manager" }
            ]
        },
        {
            name: { 'ar': "العقارات وإدارة الممتلكات", 'en': "Real Estate & Property Management" },
            icon: "fas fa-home",
            professions: [
                { 'ar': "وكيل عقارات", 'en': "Real Estate Agent" },
                { 'ar': "مدير ممتلكات", 'en': "Property Manager" },
                { 'ar': "مسؤول التأجير", 'en': "Leasing Agent" },
                { 'ar': "مدير مرافق", 'en': "Facilities Manager" },
                { 'ar': "فني صيانة", 'en': "Maintenance Technician" }
            ]
        },
        {
            name: { 'ar': "القطاع العام والحكومة", 'en': "Public Sector & Government" },
            icon: "fas fa-landmark",
            professions: [
                { 'ar': "موظف حكومي", 'en': "Civil Servant" },
                { 'ar': "محلل سياسات عامة", 'en': "Public Policy Analyst" },
                { 'ar': "منسق تواصل مجتمعي", 'en': "Community Outreach Coordinator" },
                { 'ar': "مخطط حضري", 'en': "Urban Planner" },
                { 'ar': "أخصائي علاقات حكومية", 'en': "Government Relations Specialist" }
            ]
        },
        {
            name: { 'ar': "المنظمات غير الربحية والمنظمات الإنسانية", 'en': "Non‑profit & NGOs" },
            icon: "fas fa-hands-helping",
            professions: [
                { 'ar': "مدير برنامج", 'en': "Program Manager" },
                { 'ar': "منسق متطوعين", 'en': "Volunteer Coordinator" },
                { 'ar': "مسؤول جمع تبرعات", 'en': "Fundraiser" },
                { 'ar': "كاتب منح", 'en': "Grant Writer" },
                { 'ar': "مسؤول المتابعة والتقييم", 'en': "Monitoring & Evaluation Specialist" },
                { 'ar': "مسؤول ميداني", 'en': "Field Officer" }
            ]
        },
        {
            name: { 'ar': "رعاية الأطفال والتعليم المبكر", 'en': "Childcare & Early Education" },
            icon: "fas fa-baby",
            professions: [
                { 'ar': "معلّم مرحلة ما قبل المدرسة", 'en': "Preschool Teacher" },
                { 'ar': "مُربّي أطفال", 'en': "Childcare Worker" },
                { 'ar': "معلّم تربية خاصة", 'en': "Special Education Teacher" },
                { 'ar': "مرشد مدرسي", 'en': "School Counselor" },
                { 'ar': "معلّم حضانة", 'en': "Nursery Teacher" }
            ]
        }
    ];
}

// NEW: Define the list of popular quick-access professions here.
// This ensures that the quick filters section is also dynamically generated from a single source of truth.
if (typeof window.popularProfessions === 'undefined') {
    window.popularProfessions = [
        "Plumber",
        "Electrician",
        "Mechanic",
        "Tow Truck Driver",
        "Tutor",
        "Cleaner",
        "Painter",
        "Delivery Driver",
        "Hairdresser",
        "Barista",
        "Supermarket Staff",
        "Construction Worker",
        "Blacksmith",
        "Farmer"
    ];
}
