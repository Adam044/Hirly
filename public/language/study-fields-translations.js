// public/language/study-fields-translations.js
// This file defines study fields data with translations and icons.

if (typeof window.globalStudyFields === 'undefined') {
    window.globalStudyFields = [
        {
            name: { 'ar': "الطب والعلوم الصحية", 'en': "Medicine & Health" },
            icon: "fas fa-heartbeat",
            fields: [
                { 'ar': "الطب البشري", 'en': "General Medicine", icon: "fas fa-user-md" },
                { 'ar': "طب الأسنان", 'en': "Dentistry", icon: "fas fa-tooth" },
                { 'ar': "الصيدلة", 'en': "Pharmacy", icon: "fas fa-pills" },
                { 'ar': "التمريض", 'en': "Nursing", icon: "fas fa-user-nurse" },
                { 'ar': "العلاج الطبيعي", 'en': "Physical Therapy", icon: "fas fa-walking" },
                { 'ar': "التحاليل الطبية", 'en': "Medical Analysis", icon: "fas fa-vial" },
                { 'ar': "التغذية", 'en': "Nutrition", icon: "fas fa-apple-alt" },
                { 'ar': "الصحة العامة", 'en': "Public Health", icon: "fas fa-shield-virus" },
                { 'ar': "الأشعة", 'en': "Radiology", icon: "fas fa-x-ray" },
                { 'ar': "التخدير", 'en': "Anesthesia", icon: "fas fa-syringe" },
                { 'ar': "الطب البيطري", 'en': "Veterinary Medicine", icon: "fas fa-dog" },
                { 'ar': "علم النفس العيادي", 'en': "Clinical Psychology", icon: "fas fa-brain" },
                { 'ar': "البصريات", 'en': "Optometry", icon: "fas fa-eye" },
                { 'ar': "الإسعاف والطوارئ", 'en': "Emergency Medicine", icon: "fas fa-ambulance" }
            ]
        },
        {
            name: { 'ar': "الهندسة والتكنولوجيا", 'en': "Engineering & Tech" },
            icon: "fas fa-microchip",
            fields: [
                { 'ar': "هندسة الحاسوب", 'en': "Computer Engineering", icon: "fas fa-laptop-code" },
                { 'ar': "هندسة البرمجيات", 'en': "Software Engineering", icon: "fas fa-code" },
                { 'ar': "الهندسة المدنية", 'en': "Civil Engineering", icon: "fas fa-building" },
                { 'ar': "الهندسة المعمارية", 'en': "Architecture", icon: "fas fa-archway" },
                { 'ar': "الهندسة الميكانيكية", 'en': "Mechanical Engineering", icon: "fas fa-cogs" },
                { 'ar': "الهندسة الكهربائية", 'en': "Electrical Engineering", icon: "fas fa-bolt" },
                { 'ar': "هندسة الميكاترونكس", 'en': "Mechatronics Engineering", icon: "fas fa-robot" },
                { 'ar': "تكنولوجيا المعلومات", 'en': "Information Technology", icon: "fas fa-network-wired" },
                { 'ar': "الأمن السيبراني", 'en': "Cybersecurity", icon: "fas fa-user-shield" },
                { 'ar': "الذكاء الاصطناعي", 'en': "Artificial Intelligence", icon: "fas fa-brain" },
                { 'ar': "علوم البيانات", 'en': "Data Science", icon: "fas fa-database" },
                { 'ar': "الهندسة الكيميائية", 'en': "Chemical Engineering", icon: "fas fa-flask" },
                { 'ar': "الهندسة الصناعية", 'en': "Industrial Engineering", icon: "fas fa-industry" },
                { 'ar': "هندسة الطاقة المتجددة", 'en': "Renewable Energy Engineering", icon: "fas fa-solar-panel" },
                { 'ar': "هندسة الاتصالات", 'en': "Telecommunications Engineering", icon: "fas fa-satellite-dish" },
                { 'ar': "الهندسة الحيوية", 'en': "Biomedical Engineering", icon: "fas fa-dna" }
            ]
        },
        {
            name: { 'ar': "الأعمال والاقتصاد", 'en': "Business & Economics" },
            icon: "fas fa-chart-line",
            fields: [
                { 'ar': "إدارة الأعمال", 'en': "Business Administration", icon: "fas fa-briefcase" },
                { 'ar': "المحاسبة", 'en': "Accounting", icon: "fas fa-calculator" },
                { 'ar': "العلوم المالية والمصرفية", 'en': "Finance & Banking", icon: "fas fa-university" },
                { 'ar': "التسويق", 'en': "Marketing", icon: "fas fa-ad" },
                { 'ar': "الاقتصاد", 'en': "Economics", icon: "fas fa-chart-pie" },
                { 'ar': "إدارة الموارد البشرية", 'en': "HR Management", icon: "fas fa-users-cog" },
                { 'ar': "ريادة الأعمال", 'en': "Entrepreneurship", icon: "fas fa-lightbulb" },
                { 'ar': "سلاسل الإمداد", 'en': "Supply Chain Management", icon: "fas fa-truck-loading" },
                { 'ar': "الأعمال الدولية", 'en': "International Business", icon: "fas fa-globe" },
                { 'ar': "التجارة الإلكترونية", 'en': "E-commerce", icon: "fas fa-shopping-cart" },
                { 'ar': "العقارات", 'en': "Real Estate", icon: "fas fa-home" },
                { 'ar': "نظم المعلومات الإدارية", 'en': "MIS", icon: "fas fa-desktop" },
                { 'ar': "إدارة المشاريع", 'en': "Project Management", icon: "fas fa-tasks" }
            ]
        },
        {
            name: { 'ar': "العلوم الطبيعية", 'en': "Natural Sciences" },
            icon: "fas fa-flask",
            fields: [
                { 'ar': "الرياضيات", 'en': "Mathematics", icon: "fas fa-square-root-alt" },
                { 'ar': "الفيزياء", 'en': "Physics", icon: "fas fa-atom" },
                { 'ar': "الكيمياء", 'en': "Chemistry", icon: "fas fa-vials" },
                { 'ar': "الأحياء", 'en': "Biology", icon: "fas fa-dna" },
                { 'ar': "العلوم البيئية", 'en': "Environmental Science", icon: "fas fa-leaf" },
                { 'ar': "التكنولوجيا الحيوية", 'en': "Biotechnology", icon: "fas fa-microscope" },
                { 'ar': "الجيولوجيا", 'en': "Geology", icon: "fas fa-mountain" },
                { 'ar': "علم الفلك", 'en': "Astronomy", icon: "fas fa-star" },
                { 'ar': "الأحياء البحرية", 'en': "Marine Biology", icon: "fas fa-fish" },
                { 'ar': "الإحصاء", 'en': "Statistics", icon: "fas fa-chart-bar" }
            ]
        },
        {
            name: { 'ar': "القانون والسياسة", 'en': "Law & Politics" },
            icon: "fas fa-balance-scale",
            fields: [
                { 'ar': "القانون", 'en': "Law", icon: "fas fa-gavel" },
                { 'ar': "العلوم السياسية", 'en': "Political Science", icon: "fas fa-globe-americas" },
                { 'ar': "العلاقات الدولية", 'en': "International Relations", icon: "fas fa-handshake" },
                { 'ar': "العلوم الجنائية", 'en': "Criminology", icon: "fas fa-user-secret" },
                { 'ar': "الإدارة العامة", 'en': "Public Administration", icon: "fas fa-landmark" }
            ]
        },
        {
            name: { 'ar': "الفنون والعلوم الإنسانية", 'en': "Arts & Humanities" },
            icon: "fas fa-palette",
            fields: [
                { 'ar': "التصميم الجرافيكي", 'en': "Graphic Design", icon: "fas fa-paint-brush" },
                { 'ar': "الفنون الجميلة", 'en': "Fine Arts", icon: "fas fa-palette" },
                { 'ar': "علم النفس", 'en': "Psychology", icon: "fas fa-brain" },
                { 'ar': "علم الاجتماع", 'en': "Sociology", icon: "fas fa-users" },
                { 'ar': "التاريخ", 'en': "History", icon: "fas fa-book-open" },
                { 'ar': "الجغرافيا", 'en': "Geography", icon: "fas fa-map-marked-alt" },
                { 'ar': "التصميم الداخلي", 'en': "Interior Design", icon: "fas fa-couch" },
                { 'ar': "الفلسفة", 'en': "Philosophy", icon: "fas fa-lightbulb" },
                { 'ar': "الآثار", 'en': "Archaeology", icon: "fas fa-hammer" },
                { 'ar': "الأدب", 'en': "Literature", icon: "fas fa-book" }
            ]
        },
        {
            name: { 'ar': "الإعلام واللغات", 'en': "Media & Languages" },
            icon: "fas fa-bullhorn",
            fields: [
                { 'ar': "الصحافة والإعلام", 'en': "Journalism & Media", icon: "fas fa-newspaper" },
                { 'ar': "اللغة الإنجليزية", 'en': "English Language", icon: "fas fa-language" },
                { 'ar': "اللغة العربية", 'en': "Arabic Language", icon: "fas fa-pen-fancy" },
                { 'ar': "الترجمة", 'en': "Translation", icon: "fas fa-exchange-alt" },
                { 'ar': "الإعلام الرقمي", 'en': "Digital Media", icon: "fas fa-mobile-alt" },
                { 'ar': "العلاقات العامة", 'en': "Public Relations", icon: "fas fa-users" },
                { 'ar': "اللسانيات", 'en': "Linguistics", icon: "fas fa-microphone-alt" },
                { 'ar': "صناعة الأفلام", 'en': "Filmmaking", icon: "fas fa-video" }
            ]
        },
        {
            name: { 'ar': "التربية والتعليم", 'en': "Education" },
            icon: "fas fa-graduation-cap",
            fields: [
                { 'ar': "أساليب التدريس", 'en': "Teaching Methods", icon: "fas fa-chalkboard-teacher" },
                { 'ar': "التربية الخاصة", 'en': "Special Education", icon: "fas fa-hands-helping" },
                { 'ar': "تربية الطفل", 'en': "Childhood Education", icon: "fas fa-child" },
                { 'ar': "تكنولوجيا التعليم", 'en': "Educational Technology", icon: "fas fa-laptop" },
                { 'ar': "التربية الرياضية", 'en': "Physical Education", icon: "fas fa-volleyball-ball" }
            ]
        },
        {
            name: { 'ar': "الزراعة والبيئة", 'en': "Agriculture & Environment" },
            icon: "fas fa-seedling",
            fields: [
                { 'ar': "الهندسة الزراعية", 'en': "Agricultural Engineering", icon: "fas fa-tractor" },
                { 'ar': "علوم الأغذية", 'en': "Food Science", icon: "fas fa-utensils" },
                { 'ar': "الغابات", 'en': "Forestry", icon: "fas fa-tree" },
                { 'ar': "الاستدامة", 'en': "Sustainability", icon: "fas fa-recycle" }
            ]
        }
    ];
}

// Add common study-related translations
if (window.addTranslations) {
    window.addTranslations({
        'university_option': { 'ar': 'جامعة', 'en': 'University' },
        'school_option': { 'ar': 'مدرسة', 'en': 'School' },
        'grade_label': { 'ar': 'الصف الدراسي', 'en': 'Grade' },
        'school_grade_label': { 'ar': 'الصف الدراسي', 'en': 'Grade' },
        'study_status_label': { 'ar': 'حالة الدراسة', 'en': 'Study Status' },
        'student_status_label': { 'ar': 'حالة الطالب', 'en': 'Student Status' },
        'graduated_option': { 'ar': 'متخرج', 'en': 'Graduated' },
        'status_graduated': { 'ar': 'متخرج', 'en': 'I Graduated' },
        'studying_option': { 'ar': 'لا زلت أدرس', 'en': 'Still Studying' },
        'status_studying': { 'ar': 'قيد الدراسة', 'en': 'Studying in Progress' },
        'study_field_cat_label': { 'ar': 'فئة مجال الدراسة', 'en': 'Study Field Category' },
        'field_category_label': { 'ar': 'فئة المجال', 'en': 'Field Category' },
        'specific_field_label': { 'ar': 'التخصص الدقيق', 'en': 'Specific Specialization' },
        'degree_type_label': { 'ar': 'نوع الشهادة', 'en': 'Degree Type' },
        'bachelor_degree': { 'ar': 'بكالوريوس', 'en': 'Bachelor\'s' },
        'degree_bachelor': { 'ar': 'بكالوريوس', 'en': 'Bachelor\'s' },
        'master_degree': { 'ar': 'ماجستير', 'en': 'Master\'s' },
        'degree_masters': { 'ar': 'ماجستير', 'en': 'Master\'s' },
        'phd_degree': { 'ar': 'دكتوراه', 'en': 'PhD' },
        'degree_phd': { 'ar': 'دكتوراه', 'en': 'PhD' },
        'diploma_degree': { 'ar': 'دبلوم', 'en': 'Diploma' },
        'degree_diploma': { 'ar': 'دبلوم', 'en': 'Diploma' },
        'high_school_degree': { 'ar': 'ثانوية عامة', 'en': 'High School' },
        'select_grade_placeholder': { 'ar': 'اختر الصف', 'en': 'Select Grade' },
        'select_study_field_placeholder': { 'ar': 'اختر مجال الدراسة', 'en': 'Select Study Field' },
        'select_field_category': { 'ar': 'اختر الفئة', 'en': 'Select Field' },
        'select_degree_type_placeholder': { 'ar': 'اختر نوع الشهادة', 'en': 'Select Degree Type' },
        'select_degree_placeholder': { 'ar': 'اختر الدرجة العلمية', 'en': 'Select Degree' },
        'have_degree_question': { 'ar': 'هل لديك شهادة جامعية أو تدرس حالياً؟', 'en': 'Do you have a degree or currently studying?' },
        'other_option': { 'ar': 'أخرى', 'en': 'Other' },
        'custom_field_placeholder': { 'ar': 'أدخل التخصص يدوياً', 'en': 'Enter specialization manually' },
        'yes_option': { 'ar': 'نعم', 'en': 'Yes' },
        'no_option': { 'ar': 'لا', 'en': 'No' },
        'grade_9': { 'ar': 'الصف التاسع', 'en': 'Grade 9' },
        'grade_10': { 'ar': 'الصف العاشر', 'en': 'Grade 10' },
        'grade_11': { 'ar': 'الصف الحادي عشر', 'en': 'Grade 11' },
        'grade_12': { 'ar': 'الصف الثاني عشر (توجيهي)', 'en': 'Grade 12 (Tawjihi)' },
        'university_name_label': { 'ar': 'اسم الجامعة / الكلية', 'en': 'University / College Name' },
        'school_name_label': { 'ar': 'اسم المدرسة', 'en': 'School Name' },
        'interested_professions_placeholder': { 'ar': 'اختر المهن المهتم بها...', 'en': 'Select professions you are interested in...' },
        'portfolio_placeholder': { 'ar': 'رابط معرض الأعمال (مثلاً: https://yourportfolio.com)', 'en': 'Portfolio link (e.g., https://yourportfolio.com)' },
        'select_category_first': { 'ar': 'اختر فئة لمشاهدة المهن', 'en': 'Select a category to see professions' },
        'max_5_professions': { 'ar': 'يمكنك اختيار 5 مهن كحد أقصى', 'en': 'Maximum 5 professions can be selected' },
        'back_to_categories': { 'ar': 'العودة إلى الفئات', 'en': 'Back to Categories' }
    });
}
