// public/data/education-data.js
// Standardized list of Palestinian Universities and Fields of Study

window.educationData = {
    universities: [
        { id: 'najah', name: { en: 'An-Najah National University', ar: 'جامعة النجاح الوطنية' } },
        { id: 'birzeit', name: { en: 'Birzeit University', ar: 'جامعة بيرزيت' } },
        { id: 'alquds', name: { en: 'Al-Quds University', ar: 'جامعة القدس' } },
        { id: 'ppu', name: { en: 'Palestine Polytechnic University', ar: 'جامعة بوليتكنك فلسطين' } },
        { id: 'hebron', name: { en: 'Hebron University', ar: 'جامعة الخليل' } },
        { id: 'aauj', name: { en: 'Arab American University', ar: 'الجامعة العربية الأمريكية' } },
        { id: 'ptuk', name: { en: 'Palestine Technical University - Kadoorie', ar: 'جامعة فلسطين التقنية - خضوري' } },
        { id: 'bethlehem', name: { en: 'Bethlehem University', ar: 'جامعة بيت لحم' } },
        { id: 'iugaza', name: { en: 'Islamic University of Gaza', ar: 'الجامعة الإسلامية بغزة' } },
        { id: 'alazhar', name: { en: 'Al-Azhar University - Gaza', ar: 'جامعة الأزهر - غزة' } },
        { id: 'qou', name: { en: 'Al-Quds Open University', ar: 'جامعة القدس المفتوحة' } },
        { id: 'puc', name: { en: 'Palestine University College', ar: 'الكلية الجامعية للعلوم التطبيقية' } },
        { id: 'other', name: { en: 'Other', ar: 'أخرى' } }
    ],

    fieldCategories: [
        {
            id: 'tech',
            name: { en: 'Technology', ar: 'التكنولوجيا' },
            icon: 'fas fa-laptop-code',
            fields: [
                { id: 'cs', name: { en: 'Computer Science', ar: 'علم الحاسوب' } },
                { id: 'se', name: { en: 'Software Engineering', ar: 'هندسة البرمجيات' } },
                { id: 'it', name: { en: 'Information Technology', ar: 'تكنولوجيا المعلومات' } },
                { id: 'ce', name: { en: 'Computer Engineering', ar: 'هندسة الحاسوب' } },
                { id: 'ai', name: { en: 'Artificial Intelligence', ar: 'الذكاء الاصطناعي' } },
                { id: 'ds', name: { en: 'Data Science', ar: 'علم البيانات' } },
                { id: 'cyber', name: { en: 'Cybersecurity', ar: 'الأمن السيبراني' } }
            ]
        },
        {
            id: 'eng',
            name: { en: 'Engineering', ar: 'الهندسة' },
            icon: 'fas fa-gears',
            fields: [
                { id: 'ee', name: { en: 'Electrical Engineering', ar: 'الهندسة الكهربائية' } },
                { id: 'me', name: { en: 'Mechanical Engineering', ar: 'الهندسة الميكانيكية' } },
                { id: 'civil', name: { en: 'Civil Engineering', ar: 'الهندسة المدنية' } },
                { id: 'arch', name: { en: 'Architecture', ar: 'الهندسة المعمارية' } },
                { id: 'industrial', name: { en: 'Industrial Engineering', ar: 'الهندسة الصناعية' } },
                { id: 'mechatronics', name: { en: 'Mechatronics Engineering', ar: 'هندسة الميكاترونكس' } }
            ]
        },
        {
            id: 'business',
            name: { en: 'Business', ar: 'الأعمال' },
            icon: 'fas fa-briefcase',
            fields: [
                { id: 'business', name: { en: 'Business Administration', ar: 'إدارة الأعمال' } },
                { id: 'accounting', name: { en: 'Accounting', ar: 'المحاسبة' } },
                { id: 'marketing', name: { en: 'Marketing', ar: 'التسويق' } },
                { id: 'finance', name: { en: 'Finance', ar: 'المالية' } },
                { id: 'economics', name: { en: 'Economics', ar: 'الاقتصاد' } },
                { id: 'hr', name: { en: 'Human Resources', ar: 'إدارة الموارد البشرية' } }
            ]
        },
        {
            id: 'medical',
            name: { en: 'Medical', ar: 'الطب والعلوم الصحية' },
            icon: 'fas fa-house-medical',
            fields: [
                { id: 'med', name: { en: 'Medicine', ar: 'الطب البشري' } },
                { id: 'dent', name: { en: 'Dentistry', ar: 'طب الأسنان' } },
                { id: 'pharmacy', name: { en: 'Pharmacy', ar: 'الصيدلة' } },
                { id: 'nursing', name: { en: 'Nursing', ar: 'التمريض' } },
                { id: 'lab', name: { en: 'Medical Laboratory Sciences', ar: 'التحاليل الطبية' } }
            ]
        },
        {
            id: 'humanities',
            name: { en: 'Humanities & Law', ar: 'العلوم الإنسانية والحقوق' },
            icon: 'fas fa-scale-balanced',
            fields: [
                { id: 'law', name: { en: 'Law', ar: 'الحقوق' } },
                { id: 'english', name: { en: 'English Language', ar: 'اللغة الإنجليزية' } },
                { id: 'arabic', name: { en: 'Arabic Language', ar: 'اللغة العربية' } },
                { id: 'media', name: { en: 'Media & Journalism', ar: 'الإعلام والصحافة' } },
                { id: 'psychology', name: { en: 'Psychology', ar: 'علم النفس' } }
            ]
        },
        {
            id: 'creative',
            name: { en: 'Creative Arts', ar: 'الفنون والتصميم' },
            icon: 'fas fa-palette',
            fields: [
                { id: 'design', name: { en: 'Graphic Design', ar: 'التصميم الجرافيكي' } },
                { id: 'interior', name: { en: 'Interior Design', ar: 'التصميم الداخلي' } }
            ]
        },
        {
            id: 'other',
            name: { en: 'Other', ar: 'أخرى' },
            icon: 'fas fa-ellipsis-h',
            fields: [
                { id: 'other', name: { en: 'Other', ar: 'أخرى' } }
            ]
        }
    ]
};
