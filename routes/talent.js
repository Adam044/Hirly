const express = require('express');
const { query } = require('express-validator');

module.exports = function registerTalentRoutes(app, pool, { isAuthenticated, isEmployer, isEmployerVerified, handleValidationErrors }) {
  const router = express.Router();

  router.get(
    ['/talent', '/talents'],
    [
      query('limit').optional().isInt({ min: 1, max: 100 }),
      query('offset').optional().isInt({ min: 0 }),
      query('sort').optional().isIn(['newest', 'rating'])
    ],
    handleValidationErrors,
    async (req, res) => {
      let client;
      try {
        client = await pool.connect();
        const { search, location, professions, skills, sort, category, limit, offset } = req.query;

        const globalCategoriesAndProfessionsData = [
          {
            name: { ar: 'الخدمات الحرفية والعامة', en: 'Trades & Services' }, icon: 'fas fa-tools', professions: [
              { ar: 'سباك', en: 'Plumber' }, { ar: 'كهربائي', en: 'Electrician' }, { ar: 'ميكانيكي', en: 'Mechanic' }, { ar: 'دهان', en: 'Painter' }, { ar: 'لحام', en: 'Welder' }, { ar: 'عامل بناء', en: 'Construction Worker' }, { ar: 'عامل نظافة', en: 'Cleaner' }
            ]
          },
          {
            name: { ar: 'الخدمات العامة', en: 'General Services' }, icon: 'fas fa-cash-register', professions: [
              { ar: 'صراف', en: 'Cashier' }, { ar: 'موظف سوبر ماركت', en: 'Supermarket Staff' }, { ar: 'موظف مطعم', en: 'Restaurant Staff' }, { ar: 'موظف فندق', en: 'Hotel Staff' }, { ar: 'مربية', en: 'Nanny' }, { ar: 'خياط', en: 'Tailor' }, { ar: 'خَبّاز', en: 'Baker' }, { ar: 'طباخ', en: 'Chef' }, { ar: 'حارس أمن', en: 'Security Guard' }, { ar: 'مقدم رعاية للمسنين', en: 'Elderly Caregiver' }, { ar: 'مدرب حيوانات', en: 'Animal Trainer' }, { ar: 'باريستا', en: 'Barista' }, { ar: 'عامل مستودع', en: 'Warehouse Worker' }
            ]
          },
          {
            name: { ar: 'الإبداع والتصميم', en: 'Creative & Design' }, icon: 'fas fa-palette', professions: [
              { ar: 'فنان', en: 'Artist' }, { ar: 'مصمم (جرافيك/واجهة مستخدم/تجربة مستخدم)', en: 'Designer (Graphic/UI/UX)' }, { ar: 'رسام توضيحي', en: 'Illustrator' }, { ar: 'مصور', en: 'Photographer' }, { ar: 'محرر فيديو', en: 'Video Editor' }, { ar: 'موسيقي', en: 'Musician' }, { ar: 'رسام رسوم متحركة', en: 'Animator' }, { ar: 'مصمم أزياء', en: 'Fashion Designer' }, { ar: 'مصمم داخلي', en: 'Interior Designer' }, { ar: 'مصمم معماري', en: 'Architectural Designer' }, { ar: 'فنان ألعاب', en: 'Game Artist' }, { ar: 'مهندس صوت', en: 'Sound Engineer' }, { ar: 'ملحن', en: 'Composer' }, { ar: 'صانع أفلام', en: 'Filmmaker' }, { ar: 'كاتب سيناريو', en: 'Screenwriter' }, { ar: 'ممثل', en: 'Actor' }, { ar: 'راقص', en: 'Dancer' }, { ar: 'مصمم رقصات', en: 'Choreographer' }, { ar: 'مدير فني', en: 'Art Director' }, { ar: 'مدير إبداعي', en: 'Creative Director' }, { ar: 'مصمم ديكور', en: 'Set Designer' }, { ar: 'مصمم أزياء (ملابس)', en: 'Costume Designer' }, { ar: 'فنان مكياج', en: 'Makeup Artist' }, { ar: 'فنان وشم', en: 'Tattoo Artist' }, { ar: 'مصمم مجوهرات', en: 'Jewelry Designer' }, { ar: 'فنان خزف', en: 'Ceramic Artist' }, { ar: 'نحات', en: 'Sculptor' }, { ar: 'مصمم ويب', en: 'Web Designer' }, { ar: 'باحث تجربة مستخدم', en: 'UX Researcher' }, { ar: 'مصمم منتجات', en: 'Product Designer' }
            ]
          },
          {
            name: { ar: 'التكنولوجيا والتطوير', en: 'Tech & Development' }, icon: 'fas fa-code', professions: [
              { ar: 'مطور ويب (واجهة أمامية)', en: 'Web Developer (Frontend)' }, { ar: 'مطور ويب (واجهة خلفية)', en: 'Web Developer (Backend)' }, { ar: 'مطور شامل', en: 'Full-Stack Developer' }, { ar: 'مطور تطبيقات جوال (iOS)', en: 'Mobile App Developer (iOS)' }, { ar: 'مطور تطبيقات جوال (أندرويد)', en: 'Mobile App Developer (Android)' }, { ar: 'مطور برمجيات', en: 'Software Developer' }, { ar: 'مطور ألعاب', en: 'Game Developer' }, { ar: 'محلل بيانات', en: 'Data Analyst' }, { ar: 'عالم بيانات', en: 'Data Scientist' }, { ar: 'أخصائي دعم تكنولوجيا المعلومات', en: 'IT Support Specialist' }, { ar: 'مسؤول شبكة', en: 'Network Administrator' }, { ar: 'أخصائي أمن سيبراني', en: 'Cybersecurity Specialist' }, { ar: 'مهندس سحابة', en: 'Cloud Engineer' }, { ar: 'مهندس DevOps', en: 'DevOps Engineer' }, { ar: 'مهندس تعلم آلي', en: 'Machine Learning Engineer' }, { ar: 'مهندس ذكاء اصطناعي', en: 'AI Engineer' }, { ar: 'مطور بلوكتشين', en: 'Blockchain Developer' }, { ar: 'مسؤول قاعدة بيانات', en: 'Database Administrator' }, { ar: 'مسؤول نظام', en: 'System Administrator' }, { ar: 'مهندس ضمان الجودة', en: 'QA Engineer' }, { ar: 'كاتب تقني', en: 'Technical Writer' }, { ar: 'محلل ذكاء الأعمال', en: 'Business Intelligence Analyst' }, { ar: 'استشاري ERP', en: 'ERP Consultant' }, { ar: 'استشاري CRM', en: 'CRM Consultant' }, { ar: 'أخصائي معلوماتية حيوية', en: 'Bioinformatics Specialist' }, { ar: 'مهندس روبوتات', en: 'Robotics Engineer' }, { ar: 'مهندس أنظمة مدمجة', en: 'Embedded Systems Engineer' }, { ar: 'مطور واقع افتراضي/معزز', en: 'AR/VR Developer' }
            ]
          },
          {
            name: { ar: 'الأعمال والمالية', en: 'Business & Finance' }, icon: 'fas fa-chart-line', professions: [
              { ar: 'محاسب', en: 'Accountant' }, { ar: 'محلل أعمال', en: 'Business Analyst' }, { ar: 'اقتصادي', en: 'Economist' }, { ar: 'مستشار مالي', en: 'Financial Advisor' }, { ar: 'أخصائي موارد بشرية', en: 'HR Specialist' }, { ar: 'مدير مشروع', en: 'Project Manager' }, { ar: 'أخصائي مبيعات', en: 'Sales Professional' }, { ar: 'مساعد افتراضي', en: 'Virtual Assistant' }, { ar: 'أخصائي تسويق', en: 'Marketing Specialist' }, { ar: 'مدير عمليات', en: 'Operations Manager' }, { ar: 'مدير سلسلة الإمداد', en: 'Supply Chain Manager' }, { ar: 'مدقق حسابات', en: 'Auditor' }, { ar: 'مصرفي استثماري', en: 'Investment Banker' }, { ar: 'محلل مالي', en: 'Financial Analyst' }, { ar: 'مدير مخاطر', en: 'Risk Manager' }, { ar: 'مسؤول امتثال', en: 'Compliance Officer' }, { ar: 'استشاري إدارة', en: 'Management Consultant' }, { ar: 'مدير تطوير أعمال', en: 'Business Development Manager' }, { ar: 'ممثل خدمة عملاء', en: 'Customer Service Representative' }, { ar: 'أخصائي علاقات عامة', en: 'Public Relations Specialist' }, { ar: 'استشاري توظيف', en: 'Recruitment Consultant' }, { ar: 'مساعد تنفيذي', en: 'Executive Assistant' }, { ar: 'مدير مكتب', en: 'Office Manager' }, { ar: 'منسق لوجستيات', en: 'Logistics Coordinator' }, { ar: 'أخصائي مشتريات', en: 'Procurement Specialist' }, { ar: 'وكيل عقارات', en: 'Real Estate Agent' }, { ar: 'وكيل تأمين', en: 'Insurance Agent' }, { ar: 'رائد أعمال', en: 'Entrepreneur' }, { ar: 'مستشار شركات ناشئة', en: 'Startup Advisor' }
            ]
          },
          {
            name: { ar: 'الكتابة والمحتوى', en: 'Writing & Content' }, icon: 'fas fa-pen-nib', professions: [
              { ar: 'منشئ محتوى', en: 'Content Creator' }, { ar: 'كاتب إعلانات', en: 'Copywriter' }, { ar: 'محرر', en: 'Editor' }, { ar: 'صحفي', en: 'Journalist' }, { ar: 'كاتب', en: 'Writer' }, { ar: 'مترجم', en: 'Translator' }, { ar: 'أخصائي علاقات عامة', en: 'Public Relations Specialist' }, { ar: 'مدير وسائل التواصل الاجتماعي', en: 'Social Media Manager' }, { ar: 'مدون', en: 'Blogger' }, { ar: 'مدقق لغوي', en: 'Proofreader' }, { ar: 'كاتب تقني', en: 'Technical Writer' }, { ar: 'كاتب منح', en: 'Grant Writer' }, { ar: 'كاتب سيناريو', en: 'Scriptwriter' }, { ar: 'شاعر', en: 'Poet' }, { ar: 'روائي', en: 'Novelist' }, { ar: 'كاتب عمود', en: 'Columnist' }, { ar: 'استراتيجي محتوى', en: 'Content Strategist' }, { ar: 'كاتب محتوى SEO', en: 'SEO Content Writer' }, { ar: 'كاتب أكاديمي', en: 'Academic Writer' }, { ar: 'كاتب خطابات', en: 'Speechwriter' }
            ]
          },
          {
            name: { ar: 'التعليم والبحث', en: 'Education & Research' }, icon: 'fas fa-graduation-cap', professions: [
              { ar: 'جامعة (رياضيات)', en: 'Uni (Math)' }, { ar: 'جامعة (فيزياء)', en: 'Uni (Physics)' }, { ar: 'جامعة (كيمياء)', en: 'Uni (Chemistry)' }, { ar: 'جامعة (أحياء)', en: 'Uni (Biology)' }, { ar: 'مدرسة (رياضيات)', en: 'School (Math)' }, { ar: 'مدرسة (فيزياء)', en: 'School (Physics)' }, { ar: 'مدرسة (كيمياء)', en: 'School (Chemistry)' }, { ar: 'مدرسة (أحياء)', en: 'School (Biology)' }, { ar: 'مدرس لغة (إنجليزية)', en: 'Language Tutor (English)' }, { ar: 'مدرس لغة (عربية)', en: 'Language Tutor (Arabic)' }, { ar: 'مدرس لغة (فرنسية)', en: 'Language Tutor (French)' }, { ar: 'مدرس', en: 'Tutor' }
            ]
          },
          {
            name: { ar: 'القانون والاستشارات', en: 'Legal & Consulting' }, icon: 'fas fa-balance-scale', professions: [
              { ar: 'محامي', en: 'Lawyer' }, { ar: 'استشاري (عام)', en: 'Consultant (General)' }, { ar: 'مستشار قانوني', en: 'Legal Advisor' }, { ar: 'مساعد قانوني', en: 'Paralegal' }, { ar: 'وسيط', en: 'Mediator' }, { ar: 'محكم', en: 'Arbitrator' }, { ar: 'مستشار ضرائب', en: 'Tax Consultant' }, { ar: 'استشاري تكنولوجيا المعلومات', en: 'IT Consultant' }, { ar: 'استشاري موارد بشرية', en: 'HR Consultant' }, { ar: 'استشاري تسويق', en: 'Marketing Consultant' }, { ar: 'استشاري بيئي', en: 'Environmental Consultant' }, { ar: 'استشاري مالي', en: 'Financial Consultant' }, { ar: 'استشاري أعمال', en: 'Business Consultant' }, { ar: 'استشاري استراتيجية', en: 'Strategy Consultant' }
            ]
          },
          {
            name: { ar: 'الهندسة', en: 'Engineering' }, icon: 'fas fa-cogs', professions: [
              { ar: 'مهندس مدني', en: 'Civil Engineer' }, { ar: 'مهندس (عام)', en: 'Engineer (General)' }, { ar: 'مهندس معماري', en: 'Architect' }, { ar: 'مهندس ميكانيكي', en: 'Mechanical Engineer' }, { ar: 'مهندس كهربائي', en: 'Electrical Engineer' }, { ar: 'مهندس كيميائي', en: 'Chemical Engineer' }, { ar: 'مهندس برمجيات', en: 'Software Engineer' }, { ar: 'مهندس طيران', en: 'Aerospace Engineer' }, { ar: 'مهندس طبي حيوي', en: 'Biomedical Engineer' }, { ar: 'مهندس صناعي', en: 'Industrial Engineer' }, { ar: 'مهندس بترول', en: 'Petroleum Engineer' }, { ar: 'مهندس بيئي', en: 'Environmental Engineer' }, { ar: 'مهندس إنشائي', en: 'Structural Engineer' }, { ar: 'مهندس جيوتقني', en: 'Geotechnical Engineer' }, { ar: 'مهندس موارد مائية', en: 'Water Resources Engineer' }, { ar: 'مخطط حضري', en: 'Urban Planner' }
            ]
          },
          {
            name: { ar: 'الرعاية الصحية', en: 'Healthcare' }, icon: 'fas fa-heartbeat', professions: [
              { ar: 'طبيب', en: 'Doctor' }, { ar: 'ممرض', en: 'Nurse' }, { ar: 'صيدلي', en: 'Pharmacist' }, { ar: 'طبيب أسنان', en: 'Dentist' }, { ar: 'جراح', en: 'Surgeon' }, { ar: 'مساعد طبي', en: 'Medical Assistant' }, { ar: 'مساعد طبيب أسنان', en: 'Dental Assistant' }, { ar: 'أخصائي علاج طبيعي', en: 'Physical Therapist' }, { ar: 'أخصائي علاج وظيفي', en: 'Occupational Therapist' }, { ar: 'أخصائي علاج النطق', en: 'Speech Therapist' }, { ar: 'أخصائي أشعة', en: 'Radiologist' }, { ar: 'عالم مختبرات طبية', en: 'Medical Laboratory Scientist' }, { ar: 'أخصائي تغذية', en: 'Nutritionist' }, { ar: 'أخصائي حمية', en: 'Dietitian' }, { ar: 'طبيب نفسي', en: 'Psychiatrist' }, { ar: 'مقوّم عظام', en: 'Chiropractor' }, { ar: 'أخصائي بصريات', en: 'Optometrist' }, { ar: 'طبيب بيطري', en: 'Veterinarian' }, { ar: 'مسعف/فني طوارئ طبية', en: 'EMT/Paramedic' }, { ar: 'مُشفر طبي', en: 'Medical Coder' }, { ar: 'محاسب طبي', en: 'Medical Biller' }
            ]
          },
          {
            name: { ar: 'المبيعات والتسويق', en: 'Sales & Marketing' }, icon: 'fas fa-bullhorn', professions: [
              { ar: 'مندوب مبيعات', en: 'Sales Representative' }, { ar: 'مدير تسويق', en: 'Marketing Manager' }, { ar: 'أخصائي تسويق رقمي', en: 'Digital Marketing Specialist' }, { ar: 'أخصائي SEO', en: 'SEO Specialist' }, { ar: 'أخصائي SEM', en: 'SEM Specialist' }, { ar: 'مدير وسائل التواصل الاجتماعي', en: 'Social Media Manager' }, { ar: 'أخصائي تسويق محتوى', en: 'Content Marketing Specialist' }, { ar: 'مدير علامة تجارية', en: 'Brand Manager' }, { ar: 'أخصائي علاقات عامة', en: 'Public Relations Specialist' }, { ar: 'أخصائي إعلانات', en: 'Advertising Specialist' }, { ar: 'محلل أبحاث سوق', en: 'Market Research Analyst' }, { ar: 'أخصائي تجارة إلكترونية', en: 'E-commerce Specialist' }, { ar: 'ممثل تطوير أعمال', en: 'Business Development Representative' }, { ar: 'مدير حسابات', en: 'Account Manager' }, { ar: 'مهندس مبيعات', en: 'Sales Engineer' }
            ]
          },
          {
            name: { ar: 'الضيافة والسياحة', en: 'Hospitality & Tourism' }, icon: 'fas fa-hotel', professions: [
              { ar: 'مدير فندق', en: 'Hotel Manager' }, { ar: 'طباخ', en: 'Cook' }, { ar: 'نادل', en: 'Waiter' }, { ar: 'مرشد سياحي', en: 'Tour Guide' }, { ar: 'وكيل سفر', en: 'Travel Agent' }, { ar: 'منسق فعاليات', en: 'Event Coordinator' }, { ar: 'بواب', en: 'Concierge' }, { ar: 'مدبرة منزل', en: 'Housekeeper' }, { ar: 'موظف استقبال', en: 'Front Desk Agent' }, { ar: 'مدير منتجع', en: 'Resort Manager' }, { ar: 'مدير تموين', en: 'Catering Manager' }, { ar: 'خبير نبيذ', en: 'Sommelier' }
            ]
          },
          {
            name: { ar: 'العلوم والبحث', en: 'Science & Research' }, icon: 'fas fa-flask', professions: [
              { ar: 'عالم أحياء', en: 'Biologist' }, { ar: 'كيميائي', en: 'Chemist' }, { ar: 'فيزيائي', en: 'Physicist' }, { ar: 'عالم بيئة', en: 'Environmental Scientist' }, { ar: 'جيولوجي', en: 'Geologist' }, { ar: 'عالم فلك', en: 'Astronomer' }, { ar: 'عالم رياضيات', en: 'Mathematician' }, { ar: 'إحصائي', en: 'Statistician' }, { ar: 'عالم بيانات', en: 'Data Scientist' }, { ar: 'باحث', en: 'Researcher' }, { ar: 'فني مختبر', en: 'Laboratory Technician' }, { ar: 'منسق بحث سريري', en: 'Clinical Research Coordinator' }, { ar: 'عالم أوبئة', en: 'Epidemiologist' }, { ar: 'عالم أحياء دقيقة', en: 'Microbiologist' }
            ]
          },
          {
            name: { ar: 'خدمة العملاء', en: 'Customer Service' }, icon: 'fas fa-headset', professions: [
              { ar: 'ممثل خدمة عملاء', en: 'Customer Service Representative' }, { ar: 'وكيل مركز اتصال', en: 'Call Center Agent' }, { ar: 'أخصائي دعم', en: 'Support Specialist' }, { ar: 'مدير علاقات العملاء', en: 'Client Relations Manager' }, { ar: 'دعم فني', en: 'Technical Support' }, { ar: 'فني مكتب مساعدة', en: 'Help Desk Technician' }
            ]
          },
          {
            name: { ar: 'الفنون والترفيه', en: 'Arts & Entertainment' }, icon: 'fas fa-mask', professions: [
              { ar: 'موسيقي', en: 'Musician' }, { ar: 'ممثل', en: 'Actor' }, { ar: 'راقص', en: 'Dancer' }, { ar: 'رسام', en: 'Painter' }, { ar: 'نحات', en: 'Sculptor' }, { ar: 'مصور', en: 'Photographer' }, { ar: 'صانع أفلام', en: 'Filmmaker' }, { ar: 'محرر فيديو', en: 'Video Editor' }, { ar: 'رسام رسوم متحركة', en: 'Animator' }, { ar: 'مهندس صوت', en: 'Sound Engineer' }, { ar: 'ملحن', en: 'Composer' }, { ar: 'كاتب', en: 'Writer' }, { ar: 'صحفي', en: 'Journalist' }, { ar: 'مدير فعاليات', en: 'Event Manager' }, { ar: 'مدير مسرح', en: 'Stage Manager' }, { ar: 'مصمم إضاءة', en: 'Lighting Designer' }, { ar: 'مصمم أزياء (ملابس)', en: 'Costume Designer' }, { ar: 'فنان مكياج', en: 'Makeup Artist' }, { ar: 'مساعد معرض فني', en: 'Gallery Assistant' }
            ]
          },
          {
            name: { ar: 'الرياضة واللياقة البدنية', en: 'Sports & Fitness' }, icon: 'fas fa-dumbbell', professions: [
              { ar: 'مدرب شخصي', en: 'Personal Trainer' }, { ar: 'مدرب لياقة بدنية', en: 'Fitness Instructor' }, { ar: 'مدرب رياضي', en: 'Sports Coach' }, { ar: 'مدرب يوجا', en: 'Yoga Instructor' }, { ar: 'مدرب بيلاتس', en: 'Pilates Instructor' }, { ar: 'مدير صالة ألعاب رياضية', en: 'Gym Manager' }, { ar: 'أخصائي علاج رياضي', en: 'Sports Therapist' }, { ar: 'مدرب رياضي', en: 'Athletic Trainer' }, { ar: 'أخصائي تغذية', en: 'Nutritionist' }, { ar: 'حكم/مراقب', en: 'Referee/Umpire' }, { ar: 'صحفي رياضي', en: 'Sports Journalist' }
            ]
          },
          {
            name: { ar: 'اللوجستيات والنقل', en: 'Logistics & Transportation' }, icon: 'fas fa-truck', professions: [
              { ar: 'سائق', en: 'Driver' }, { ar: 'منسق لوجستيات', en: 'Logistics Coordinator' }, { ar: 'مدير سلسلة الإمداد', en: 'Supply Chain Manager' }, { ar: 'مدير مستودع', en: 'Warehouse Manager' }, { ar: 'مشغل رافعة شوكية', en: 'Forklift Operator' }, { ar: 'سائق توصيل', en: 'Delivery Driver' }, { ar: 'مرسل', en: 'Dispatcher' }, { ar: 'وسيط شحن', en: 'Freight Broker' }, { ar: 'وسيط جمارك', en: 'Customs Broker' }, { ar: 'سائق شاحنة سحب', en: 'Tow Truck Driver' }
            ]
          },
          {
            name: { ar: 'الزراعة والغذاء', en: 'Agriculture & Food' }, icon: 'fas fa-seedling', professions: [
              { ar: 'مزارع', en: 'Farmer' }, { ar: 'مهندس زراعي', en: 'Agricultural Engineer' }, { ar: 'مهندس زراعي', en: 'Agronomist' }, { ar: 'عالم أغذية', en: 'Food Scientist' }, { ar: 'طباخ', en: 'Chef' }, { ar: 'خَبّاز', en: 'Baker' }, { ar: 'جزار', en: 'Butcher' }, { ar: 'أخصائي تكنولوجيا الغذاء', en: 'Food Technologist' }, { ar: 'صياد', en: 'Fisherman' }, { ar: 'بستاني', en: 'Gardener' }
            ]
          },
          {
            name: { ar: 'التأمين', en: 'Insurance' }, icon: 'fas fa-shield-alt', professions: [
              { ar: 'وكيل تأمين', en: 'Insurance Agent' }, { ar: 'مُقيِّم مطالبات', en: 'Claims Adjuster' }, { ar: 'مُكتتب تأمين', en: 'Underwriter' }, { ar: 'خبير اكتواري', en: 'Actuary' }, { ar: 'وسيط تأمين', en: 'Insurance Broker' }, { ar: 'محلل مخاطر تأمينية', en: 'Insurance Risk Analyst' }, { ar: 'أخصائي تأمين تكافلي', en: 'Takaful Specialist' }, { ar: 'مدقق داخلي', en: 'Internal Auditor' }
            ]
          }
        ];

        const getProfessionsForCategories = (categoryNames) => {
          const professionsSet = new Set();
          categoryNames.forEach((catName) => {
            const categoryData = globalCategoriesAndProfessionsData.find((c) => c.name.en === catName);
            if (categoryData) {
              categoryData.professions.forEach((p) => professionsSet.add(p.en));
            }
          });
          return Array.from(professionsSet);
        };

        const params = [];
        let paramIndex = 1;

        const viewerIsCompany = req.session && req.session.userType === 'employer'
          ? (await (async () => {
            try {
              const r = await client.query('SELECT employer_type FROM employers WHERE user_id = $1', [req.session.userId]);
              return r.rows[0]?.employer_type === 'company';
            } catch (e) {
              return false;
            }
          })())
          : false;
        const viewerIsCompanyPlaceholder = `$${paramIndex}`;
        params.push(viewerIsCompany);
        paramIndex++;

        let query = `
          SELECT 
            u.id,
            u.slug,
            u.first_name,
            u.last_name,
          CASE WHEN f.privacy_hide_contact_info THEN NULL ELSE u.email END AS email,
          u.city AS location,
          CASE WHEN f.privacy_hide_contact_info THEN NULL ELSE u.phone END AS phone,
          u.created_at,
          u.profile_picture_url,
          f.skills,
          f.bio,
          f.profession,
          f.current_status,
          f.interested_professions,
          f.verification_status,
          f.rating,
          f.profile_views_count,
          f.cv_path,
          f.website_link,
          f.id_verification_path,
          f.id AS professional_db_id
        FROM users u
        JOIN professionals f ON u.id = f.user_id
        WHERE u.user_type = 'professional'
        AND (
          f.privacy_visibility = 'ALL' OR
          (f.privacy_visibility = 'companies' AND ${viewerIsCompanyPlaceholder} = TRUE)
        )
      `;

        if (search) {
          const searchTerm = `%${(search || '').toLowerCase()}%`;
          query += `
          AND (
            CONCAT(u.first_name, ' ', u.last_name) ILIKE $${paramIndex} OR
            f.profession ILIKE $${paramIndex} OR
            f.skills ILIKE $${paramIndex}
          )
        `;
          params.push(searchTerm);
          paramIndex++;
        }

        let professionsToFilter = [];
        let explicitProfessions = []; // NEW: Track explicit selections for Priority 1
        let professionsStartIndex = null;
        
        if (professions) {
          try {
            const parsedProfessions = JSON.parse(professions);
            if (Array.isArray(parsedProfessions)) {
              explicitProfessions = [...parsedProfessions];
              professionsToFilter = [...parsedProfessions];
            }
          } catch (e) {
            console.error("Error parsing professions:", e);
          }
        }
        
        if (category) {
          try {
            const parsedCategories = JSON.parse(category);
            if (Array.isArray(parsedCategories) && parsedCategories.length > 0) {
              const categoryProfessions = getProfessionsForCategories(parsedCategories);
              // Combine and unique
              professionsToFilter = [...new Set([...professionsToFilter, ...categoryProfessions])];
            }
          } catch (e) {
            console.error("Error parsing categories:", e);
          }
        }

        if (professionsToFilter.length > 0) {
          professionsStartIndex = paramIndex; 
          const professionPlaceholders = professionsToFilter.map(() => `$${paramIndex++}`).join(', ');
          query += `
          AND (
            LOWER(f.profession) IN (${professionPlaceholders})
            OR EXISTS (
              SELECT 1 FROM jsonb_array_elements_text(f.interested_professions) AS ip_elem
              WHERE LOWER(ip_elem.value) IN (${professionPlaceholders})
            )
          )
        `;
          params.push(...professionsToFilter.map((p) => p.toLowerCase()));
        }

        if (location) {
          try {
            const parsedLocations = JSON.parse(location);
            if (Array.isArray(parsedLocations) && parsedLocations.length > 0) {
              if (parsedLocations.includes('Remote')) {
                query += ` AND u.city IS NULL`;
              } else {
                const locationPlaceholders = parsedLocations.map(() => `LOWER($${paramIndex++})`).join(', ');
                query += ` AND LOWER(u.city) IN (${locationPlaceholders})`;
                params.push(...parsedLocations.map((loc) => loc.toLowerCase()));
              }
            }
          } catch (e) {
            query += ` AND u.city = $${paramIndex}`;
            params.push(location);
            paramIndex++;
          }
        }

        if (skills) {
          const skillTerms = skills.split(',').map((s) => `%${s.trim().toLowerCase()}%`);
          query += ` AND (`;
          query += skillTerms.map((_, idx) => `LOWER(f.skills) ILIKE $${paramIndex + idx}`).join(' OR ');
          query += `)`;
          params.push(...skillTerms);
          paramIndex += skillTerms.length;
        }

        // TIERED SMART SORTING LOGIC:
        const sortingTiers = [];

        if (professionsToFilter.length > 0 && professionsStartIndex !== null) {
            // Find which indices in the params array are our "explicit" choices
            const explicitIndices = explicitProfessions.map(p => {
                const idx = professionsToFilter.indexOf(p);
                return idx !== -1 ? `$${professionsStartIndex + idx}` : null;
            }).filter(Boolean);

            const allPlaceholders = professionsToFilter.map((_, i) => `$${professionsStartIndex + i}`).join(', ');

            if (explicitIndices.length > 0) {
                const explicitPlaceholders = explicitIndices.join(', ');
                
                // Group 0: Explicit selection matches Main Profession
                // Group 1: Explicit selection matches an Interested Profession
                // Group 2: Broad Category match
                sortingTiers.push(`(CASE 
                    WHEN LOWER(f.profession) IN (${explicitPlaceholders}) THEN 0 
                    WHEN EXISTS (
                        SELECT 1 FROM jsonb_array_elements_text(f.interested_professions) AS ip_elem
                        WHERE LOWER(ip_elem.value) IN (${explicitPlaceholders})
                    ) THEN 1
                    WHEN LOWER(f.profession) IN (${allPlaceholders}) THEN 2
                    ELSE 3 
                END) ASC`);
            } else {
                // Broad match only
                sortingTiers.push(`(CASE WHEN LOWER(f.profession) IN (${allPlaceholders}) THEN 0 ELSE 1 END) ASC`);
            }
            
            // Visual Priority: Apply WITHIN the groups above (Main with pic > Main without pic > Interest with pic...)
            sortingTiers.push(`(CASE WHEN u.profile_picture_url IS NOT NULL AND u.profile_picture_url != '' THEN 0 ELSE 1 END) ASC`);

            // Breadth: Length of interested professions (ASC - fewer interests = more focused)
            sortingTiers.push(`jsonb_array_length(COALESCE(f.interested_professions, '[]'::jsonb)) ASC`);
        } else {
            // INITIAL STATE (No filters): Profile Picture > Rating > Recency
            sortingTiers.push(`(CASE WHEN u.profile_picture_url IS NOT NULL AND u.profile_picture_url != '' THEN 0 ELSE 1 END) ASC`);
        }
        
        sortingTiers.push(`f.rating DESC NULLS LAST`);
        sortingTiers.push(`u.created_at DESC`);

        const baseOrderBy = sortingTiers.join(', ');

        if (sort) {
          switch (sort) {
            case 'newest':
              query += ` ORDER BY u.created_at DESC`;
              break;
            case 'rating':
              query += ` ORDER BY ${baseOrderBy}`;
              break;
            default:
              query += ` ORDER BY ${baseOrderBy}`;
          }
        } else {
          query += ` ORDER BY ${baseOrderBy}`;
        }

        if (limit) {
          const limitValue = parseInt(limit, 10);
          const offsetValue = parseInt(offset || 0, 10);
          if (limitValue > 0) {
            query += ` LIMIT $${paramIndex}`;
            params.push(limitValue);
            paramIndex++;
            if (offsetValue > 0) {
              query += ` OFFSET $${paramIndex}`;
              params.push(offsetValue);
              paramIndex++;
            }
          }
        }

        const { rows } = await client.query(query, params);

        let totalCount = null;
        if (limit) {
          let countQuery = `
          SELECT COUNT(*) as total
          FROM users u
          JOIN professionals f ON u.id = f.user_id
          WHERE u.user_type = 'professional'
        `;
          let countParams = [];
          let countParamIndex = 1;
          const viewerIsCompanyPlaceholderCount = `$${countParamIndex}`;
          countQuery += ` AND ( f.privacy_visibility = 'ALL' OR (f.privacy_visibility = 'companies' AND ${viewerIsCompanyPlaceholderCount} = TRUE) )`;
          countParams.push(viewerIsCompany);
          countParamIndex++;
          if (search) {
            countQuery += ` AND (
            LOWER(CONCAT(u.first_name, ' ', u.last_name)) ILIKE $${countParamIndex} OR
            LOWER(f.profession) ILIKE $${countParamIndex} OR
            LOWER(f.skills) ILIKE $${countParamIndex}
          )`;
            countParams.push(`%${search.toLowerCase()}%`);
            countParamIndex++;
          }
          let professionsToFilterCount = [];
          if (professions) {
            try {
              const parsedProfessions = JSON.parse(professions);
              if (Array.isArray(parsedProfessions) && parsedProfessions.length > 0) {
                professionsToFilterCount = parsedProfessions;
              }
            } catch (e) {
              professionsToFilterCount = [professions];
            }
          }
          if (category) {
            try {
              const parsedCategories = JSON.parse(category);
              if (Array.isArray(parsedCategories) && parsedCategories.length > 0) {
                professionsToFilterCount = getProfessionsForCategories(parsedCategories);
              }
            } catch (e) {
              professionsToFilterCount = [];
            }
          }
          if (professionsToFilterCount.length > 0) {
            const professionPlaceholders = professionsToFilterCount.map(() => `LOWER($${countParamIndex++})`).join(', ');
            countQuery += `
            AND (
              LOWER(f.profession) IN (${professionPlaceholders})
              OR EXISTS (
                SELECT 1 FROM jsonb_array_elements_text(f.interested_professions) AS ip_elem
                WHERE LOWER(ip_elem.value) IN (${professionPlaceholders})
              )
            )
          `;
            countParams.push(...professionsToFilterCount.map((p) => p.toLowerCase()));
          }
          if (location) {
            try {
              const parsedLocations = JSON.parse(location);
              if (Array.isArray(parsedLocations) && parsedLocations.length > 0) {
                if (parsedLocations.includes('Remote')) {
                  countQuery += ` AND u.city IS NULL`;
                } else {
                  const locationPlaceholders = parsedLocations.map(() => `LOWER($${countParamIndex++})`).join(', ');
                  countQuery += ` AND LOWER(u.city) IN (${locationPlaceholders})`;
                  countParams.push(...parsedLocations.map((loc) => loc.toLowerCase()));
                }
              }
            } catch (e) {
              countQuery += ` AND u.city = $${countParamIndex}`;
              countParams.push(location);
              countParamIndex++;
            }
          }
          if (skills) {
            const skillTerms = skills.split(',').map((s) => `%${s.trim().toLowerCase()}%`);
            countQuery += ` AND (`;
            countQuery += skillTerms.map((_, idx) => `LOWER(f.skills) ILIKE $${countParamIndex + idx}`).join(' OR ');
            countQuery += `)`;
            countParams.push(...skillTerms);
            countParamIndex += skillTerms.length;
          }
          const { rows: countRows } = await client.query(countQuery, countParams);
          totalCount = parseInt(countRows[0].total, 10);
        }

        res.json({ talent: rows, totalCount });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error while fetching talent.' });
      } finally {
        if (client) client.release();
      }
    }
  );

  router.post('/talent/:id/view', isAuthenticated, isEmployer, isEmployerVerified, async (req, res) => {
    let client;
    try {
      client = await pool.connect();
      const professionalUserId = parseInt(req.params.id, 10);
      const employerUserId = req.session.userId;
      if (isNaN(professionalUserId)) {
        return res.status(400).json({ success: false, error: 'Invalid professional ID.' });
      }
      if (employerUserId === professionalUserId) {
        return res.json({ success: true, message: 'Self-view not tracked.' });
      }
      await client.query('BEGIN');
      const professionalProfileResult = await client.query('SELECT id FROM professionals WHERE user_id = $1', [professionalUserId]);
      const professionalDbId = professionalProfileResult.rows[0]?.id;
      if (!professionalDbId) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Professional profile not found in professionals table.' });
      }
      const employerRecordResult = await client.query('SELECT id FROM employers WHERE user_id = $1', [employerUserId]);
      const employerDbId = employerRecordResult.rows[0]?.id;
      if (!employerDbId) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Employer profile not found in employers table.' });
      }
      const insertViewResult = await client.query(
        `INSERT INTO profile_views (viewer_id, professional_id, viewed_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (viewer_id, professional_id) DO NOTHING RETURNING id`,
        [employerDbId, professionalDbId]
      );
      if (insertViewResult.rowCount > 0) {
        await client.query('UPDATE professionals SET profile_views_count = COALESCE(profile_views_count, 0) + 1 WHERE id = $1', [professionalDbId]);
      }
      await client.query('COMMIT');
      res.json({ success: true });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      res.status(500).json({ success: false, error: error.message || 'Failed to record profile view.' });
    } finally {
      if (client) client.release();
    }
  });

  router.get('/talents/featured', async (req, res) => {
    let client;
    const limit = parseInt(req.query.limit) || 10;
    const isRandom = req.query.random === 'true';
    
    try {
      client = await pool.connect();
      
      // We want profiles that have:
      // 1. Profile picture
      // 2. Profession
      // 3. At least 2 skills (approximate by length or check in code)
      // 4. Bio (approximate by length)
      
      let query = `
        SELECT
          u.id,
          u.first_name,
          u.last_name,
          u.city,
          u.country,
          f.profession,
          f.current_status,
          f.skills,
          f.bio,
          f.interested_professions,
          f.rating,
          f.profile_views_count,
          f.cv_path,
          f.id_verification_path,
          f.verification_status,
          u.profile_picture_url
        FROM users u
        JOIN professionals f ON u.id = f.user_id
        WHERE u.user_type = 'professional'
        AND f.privacy_visibility = 'ALL'
        AND u.profile_picture_url IS NOT NULL 
        AND u.profile_picture_url != ''
        AND f.profession IS NOT NULL
        AND f.profession != ''
        AND f.skills IS NOT NULL
        AND LENGTH(f.skills) > 5
        AND f.bio IS NOT NULL
        AND LENGTH(f.bio) > 20
      `;

      if (isRandom) {
        query += ` ORDER BY RANDOM()`;
      } else {
        query += ` ORDER BY f.rating DESC NULLS LAST, f.profile_views_count DESC, u.created_at DESC`;
      }

      query += ` LIMIT $1`;

      const result = await client.query(query, [limit]);
      
      const talents = result.rows.map((talent) => ({
        ...talent,
        interested_professions: talent.interested_professions || [],
        skills: talent.skills ? talent.skills.split(',').map((s) => s.trim()) : []
      }));
      
      res.json({ success: true, talents });
    } catch (error) {
      console.error('Error fetching featured talents:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch featured talents.' });
    } finally {
      if (client) client.release();
    }
  });

  app.use('/api', router);
};
