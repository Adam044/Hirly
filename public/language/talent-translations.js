// public/language/talent-translations.js
// These are translations specific to the talent.html page.
// They will be added to the main translations object in language.js
// by calling window.addTranslations().

// Check if window.addTranslations function is available before attempting to use it.
if (typeof window.addTranslations === 'function') {
    window.addTranslations({
        'talent_page_title': { 'ar': 'وظف مهنيين فلسطينيين | هايرلي', 'en': 'Hire Palestinian Professionals | Hirly' },
        'hero_title_professionals': { 'ar': 'أعثر على الشخص المناسب للعمل الذي تحتاجه خلال ثوانٍ.', 'en': 'Find exactly who you need' },
        'hero_badge_talent': { 'ar': 'شبكة مهنية متميزة', 'en': 'Premium Network' },
        'hero_subtitle_professionals': { 'ar': 'سواءً كنت تبحث عن مستقل لمشروع، مساعدة سريعة، أو موظف للانضمام إلى فريقك. من الحرفيين إلى المتخصصين، استخدم الفلاتر الذكية للعثور على المهني المناسب بسهولة.', 'en': 'Whether you need freelancers for a project, a quick fix, or even to hire someone. From electricians to doctors, use the filters to choose exactly who you want.' },
        'search_talent_placeholder': { 'ar': 'ابحث بالاسم أو المهارة أو المهنة...', 'en': 'Search by name, skill, or profession...' },
        'search_talent': { 'ar': 'بحث', 'en': 'Search' },
        'categories': { 'ar': 'الفئات', 'en': 'Categories' }, // Keep as-is for now, handled by data-lang-key
        'filters': { 'ar': 'الفلاتر', 'en': 'Filters' },
        'category_filter_label': { 'ar': 'الفئة', 'en': 'Category' },
        'professions_filter_label': { 'ar': 'المهن', 'en': 'Professions' },
        'city': { 'ar': 'المدينة', 'en': 'City' },
        'anywhere_palestine': { 'ar': 'أي مكان في فلسطين', 'en': 'Anywhere in Palestine' },
        'specific_skill': { 'ar': 'مهارة محددة', 'en': 'Specific Skill' },
        'skill_placeholder': { 'ar': 'مثال: React, Photoshop', 'en': 'e.g., React, Photoshop' },
        'sort_by': { 'ar': 'ترتيب حسب', 'en': 'Sort By' },
        'has_profile_picture': { 'ar': 'لديه صورة شخصية', 'en': 'Has Profile Picture' },
        'rating_highest_first': { 'ar': 'التقييم (الأعلى أولاً)', 'en': 'Rating (Highest First)' },
        'newest_first': { 'ar': 'الأحدث أولاً', 'en': 'Newest First' },
        'apply_filters': { 'ar': 'تطبيق الفلاتر', 'en': 'Apply Filters' },
        'clear_filters': { 'ar': 'مسح الفلاتر', 'en': 'Clear Filters' },
        'browse_talent_section_title': { 'ar': 'تصفح المهنيين', 'en': 'Browse Professionals' },
        'loading_talent': { 'ar': 'جارٍ تحميل المهنيين...', 'en': 'Loading professionals...' },
        'no_talent_found': { 'ar': 'لم يتم العثور على مهنيين مطابقين لمعاييرك', 'en': 'No professionals found matching your criteria' },
        'clear_all': { 'ar': 'مسح الكل', 'en': 'Clear All' },
        'no_key_skills': { 'ar': 'لا توجد مهارات رئيسية', 'en': 'No key skills' },
        'view_profile': { 'ar': 'عرض الملف الشخصي', 'en': 'View Profile' },
        'no_results_found': { 'ar': 'لم يتم العثور على نتائج', 'en': 'No Results Found' },
        'no_talent_matching_criteria': { 'ar': 'لم نتمكن من العثور على أي مهنيين مطابقين لمعاييرك.', 'en': 'We couldn\'t find any professionals matching your criteria.' },
        'searching': { 'ar': 'جاري البحث عن المهنيين...', 'en': 'Searching talent...' },
        'quick_services': { 'ar': 'خدمات سريعة', 'en': 'Quick Services' }, // Renamed from one_person_team_jobs
        'select_professions': { 'ar': 'اختر المهن', 'en': 'Select Professions' },
        'professions_selected': { 'ar': 'مهن مختارة', 'en': 'Professions Selected' },
        'all_professions': { 'ar': 'جميع المهن', 'en': 'All Professions' },
        'categories_selected': { 'ar': 'فئات مختارة', 'en': 'Categories Selected' },
        'all_categories': { 'ar': 'جميع الفئات', 'en': 'All Categories' },
        'all_cities': { 'ar': 'جميع المدن', 'en': 'All Cities' }, // Added for city dropdown
        'all_countries': { 'ar': 'جميع الدول', 'en': 'All Countries' },
        'countries_selected': { 'ar': 'دول مختارة', 'en': 'Countries Selected' },
        'cities_selected': { 'ar': 'مدن مختارة', 'en': 'Cities Selected' }, // Added for city multi-select
        'no_matching_professions': { 'ar': 'لم يتم العثور على مهن مطابقة.', 'en': 'No matching professions found.' },
        'remote_only': { 'ar': 'عن بعد فقط', 'en': 'Remote Only' },
        'uncategorized': { 'ar': 'غير مصنف', 'en': 'Uncategorized' },
        'error_loading_talent': { 'ar': 'خطأ في تحميل المهنيين', 'en': 'Error loading professionals' },
        'try_again_later': { 'ar': 'الرجاء المحاولة مرة أخرى لاحقًا.', 'en': 'Please try again later.' },
        'employer_access_required': { 'ar': 'يتطلب وصول صاحب عمل', 'en': 'Employer Access Required' },
        'employer_access_message_unauthenticated': { 'ar': 'هذا القسم مخصص لأصحاب العمل للعثور على المهنيين. يرجى تسجيل الدخول أو إنشاء حساب للمتابعة.', 'en': 'This section is for employers to find professionals. Please log in or sign up to continue.' },
        'login': { 'ar': 'تسجيل الدخول', 'en': 'Log In' },
        'signup_as_employer': { 'ar': 'إنشاء حساب كصاحب عمل', 'en': 'Sign Up as Employer' },
        'employer_access_message_freelancer': { 'ar': 'أنت مسجل حاليًا كمهني. هذا القسم مخصص لأصحاب العمل.', 'en': 'You are currently logged in as a professional. This section is for employers.' },
        'go_to_my_dashboard': { 'ar': 'اذهب إلى لوحة التحكم الخاصة بي', 'en': 'Go to My Dashboard' },
        'login_as_employer': { 'ar': 'تسجيل الدخول كصاحب عمل', 'en': 'Login as Employer' },
        'freelancer_privacy_title': { 'ar': 'خصوصية المهنيين', 'en': 'Professional Privacy' },
        'freelancer_privacy_message': { 'ar': 'في هايرلي، نحن نحترم خصوصية جميع المهنيين لدينا. لهذا السبب، لا نسمح للمهنيين الآخرين بمشاهدة ملفك الشخصي أو تفاصيلك. هذا القسم مخصص فقط لأصحاب العمل للعثور على الكفاءات وتوظيفها.', 'en': 'At Hirly, we respect the privacy of all our professionals. For this reason, we don\'t allow other professionals to view your profile or details. This section is strictly for employers to find and hire talent.' },
        'verification_required_modal_title': { 'ar': 'التوثيق مطلوب', 'en': 'Verification Required' },
        'talent_verification_required_message': { 'ar': 'لعرض ملفات المهنيين، يجب أن يكون حالة توثيق هوية حساب صاحب العمل الخاص بك "موثق".', 'en': 'To view professional profiles, your employer account\'s ID verification status must be Verified.' },
        'go_to_profile': { 'ar': 'اذهب إلى الملف الشخصي', 'en': 'Go to Profile' },
        'close_modal': { 'ar': 'إغلاق', 'en': 'Close' },
        // Category translations (copied from categories-professions-translations for direct use by data-lang-key)
        'category_trades___services': { 'ar': 'الخدمات الحرفية والعامة', 'en': 'Trades & Services' },
        'category_general_services': { 'ar': 'الخدمات العامة', 'en': 'General Services' },
        'category_creative___design': { 'ar': 'الإبداع والتصميم', 'en': 'Creative & Design' },
        'category_tech___development': { 'ar': 'التكنولوجيا والتطوير', 'en': 'Tech & Development' },
        'category_business___finance': { 'ar': 'الأعمال والمالية', 'en': 'Business & Finance' },
        'category_writing___content': { 'ar': 'الكتابة والمحتوى', 'en': 'Writing & Content' },
        'category_education___research': { 'ar': 'التعليم والبحث', 'en': 'Education & Research' },
        'category_legal___consulting': { 'ar': 'القانون والاستشارات', 'en': 'Legal & Consulting' },
        'category_engineering': { 'ar': 'الهندسة', 'en': 'Engineering' },
        'category_healthcare': { 'ar': 'الرعاية الصحية', 'en': 'Healthcare' },
        'category_sales___marketing': { 'ar': 'المبيعات والتسويق', 'en': 'Sales & Marketing' },
        'category_hospitality___tourism': { 'ar': 'الضيافة والسياحة', 'en': 'Hospitality & Tourism' },
        'category_science___research': { 'ar': 'العلوم والبحث', 'en': 'Science & Research' },
        'category_customer_service': { 'ar': 'خدمة العملاء', 'en': 'Customer Service' },
        'category_arts___entertainment': { 'ar': 'الفنون والترفيه', 'en': 'Arts & Entertainment' },
        'category_sports___fitness': { 'ar': 'الرياضة واللياقة البدنية', 'en': 'Sports & Fitness' },
        'category_logistics___transportation': { 'ar': 'اللوجستيات والنقل', 'en': 'Logistics & Transportation' },
        'category_agriculture___food': { 'ar': 'الزراعة والغذاء', 'en': 'Agriculture & Food' },
        // Added missing general/modal keys
        'confirm_action_modal': { 'ar': 'تأكيد الإجراء', 'en': 'Confirm Action' },
        'are_you_sure_proceed_modal': { 'ar': 'هل أنت متأكد أنك تريد المتابعة؟', 'en': 'Are you sure you want to proceed?' },
        'yes_confirm_modal': { 'ar': 'نعم، تأكيد', 'en': 'Yes, Confirm' },
        'access_denied_title': { 'ar': 'الوصول مرفوض', 'en': 'Access Denied' }, // Ensure this is explicitly here for modals
        'access_denied_message': { 'ar': 'يجب أن تكون صاحب عمل موثق لعرض ملفات المهنيين.', 'en': 'You must be a verified employer to view professional profiles.' }, // Ensure this is explicitly here for modals
        'more': { 'ar': 'المزيد', 'en': 'more' }, // Ensure 'more' is defined
        // Quick Fix Professions - these are needed for direct lookup in populateQuickFilters
        'plumber': { 'ar': 'سباك', 'en': 'Plumber' },
        'electrician': { 'ar': 'كهربائي', 'en': 'Electrician' },
        'mechanic': { 'ar': 'ميكانيكي', 'en': 'Mechanic' },
        'tow_truck_driver': { 'ar': 'سائق شاحنة سحب', 'en': 'Tow Truck Driver' },
        'tutor': { 'ar': 'مدرس', 'en': 'Tutor' },
        'cleaner': { 'ar': 'عامل نظافة', 'en': 'Cleaner' },
        'gardener': { 'ar': 'بستاني', 'en': 'Gardener' },
        'painter': { 'ar': 'دهان', 'en': 'Painter' },
        'delivery_driver': { 'ar': 'سائق توصيل', 'en': 'Delivery Driver' },
        'hairdresser': { 'ar': 'مصفف شعر', 'en': 'Hairdresser' },
        'barista': { 'ar': 'باريستا', 'en': 'Barista' },
        'supermarket_staff': { 'ar': 'موظف سوبر ماركت', 'en': 'Supermarket Staff' },
        'construction_worker': { 'ar': 'عامل بناء', 'en': 'Construction Worker' },
        'load_more': { 'ar': 'تحميل المزيد', 'en': 'Load More' }
    });

    // Re-apply translations to the page once added
    if (typeof window.applyTranslations === 'function') {
        window.applyTranslations(window.currentLanguage || 'ar');
    }
} else {
    console.error("window.addTranslations is not defined. Ensure language.js is loaded correctly before talent-translations.js.");
}
