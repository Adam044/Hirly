// public/language/language.js

// Global translations object
// This object holds all translatable texts for your website.
// It will be dynamically updated by page-specific translation files using window.addTranslations().
window.translations = {
    // --- General/Shared Translations ---
    // These are translations that are commonly used across multiple pages (e.g., header, footer, modals).
    'hirly_app_name': {
        'ar': 'هايرلي',
        'en': 'Hirly'
    },
    'hirly_app_name_aria_label': {
        'ar': 'هايرلي الرئيسية',
        'en': 'Hirly Home'
    },
    'footer_text': {
        'ar': 'ربط المهنيين بفرص أحلامهم، وتعزيز النمو الاقتصادي والتمكين.',
        'en': 'Connecting professionals with their dream opportunities, fostering economic growth and empowerment.'
    },
    'company': {
        'ar': 'الشركة',
        'en': 'Company'
    },
    'about_us': {
        'ar': 'حولنا',
        'en': 'About Us'
    },
    'contact_us': {
        'ar': 'اتصل بنا',
        'en': 'Contact Us'
    },
    'support': {
        'ar': 'الدعم',
        'en': 'Support'
    },
    'solutions': {
        'ar': 'الحلول',
        'en': 'Solutions'
    },
    'platform': {
        'ar': 'المنصة',
        'en': 'Platform'
    },
    'home': {
        'ar': 'الرئيسية',
        'en': 'Home'
    },
    'how_it_works': {
        'ar': 'كيف يعمل',
        'en': 'How it Works'
    },
    'privacy_heading': {
        'ar': 'سياسة الخصوصية',
        'en': 'Privacy Policy'
    },
    'terms_heading': {
        'ar': 'شروط الخدمة',
        'en': 'Terms of Service'
    },
    'all_rights_reserved': {
        'ar': '© 2026 جميع الحقوق محفوظة. فخورون بكوننا فلسطينيين 🇵🇸',
        'en': '© 2026 All Rights Reserved. Proudly Palestinian 🇵🇸'
    },
    'for_individuals': {
        'ar': 'للأفراد',
        'en': 'For Individuals'
    },
    'for_companies': {
        'ar': 'للشركات',
        'en': 'For Companies'
    },
    'for_professionals': {
        'ar': 'للمحترفين',
        'en': 'For Professionals'
    },
    'select_your_language': {
        'ar': 'اختر لغتك',
        'en': 'Select Your Language'
    },
    'choose_preferred_language': {
        'ar': 'الرجاء اختيار لغتك المفضلة:',
        'en': 'Please choose your preferred language:'
    },
    'english': {
        'ar': 'English',
        'en': 'English'
    },
    'arabic': {
        'ar': 'العربية',
        'en': 'العربية'
    },
    'confirm_delete': {
        'ar': 'هل أنت متأكد أنك تريد حذف هذا؟',
        'en': 'Are you sure you want to delete this?'
    },
    'cancel': {
        'ar': 'إلغاء',
        'en': 'Cancel'
    },
    'not_available': {
        'ar': 'غير متوفر',
        'en': 'N/A'
    },
    'on_site': {
        'ar': 'في الموقع',
        'en': 'On-site'
    },
    'remote': {
        'ar': 'عن بعد',
        'en': 'Remote'
    },
    'hybrid': {
        'ar': 'هجين',
        'en': 'Hybrid'
    },
    'sign_up': {
        'ar': 'إنشاء حساب',
        'en': 'Sign Up'
    }, // Standardized to sign_up
    'login': {
        'ar': 'تسجيل الدخول',
        'en': 'Login'
    },
    'general': {
        'ar': 'عام',
        'en': 'General'
    },
    'jobs': {
        'ar': 'وظائف',
        'en': 'Jobs'
    },
    'services': {
        'ar': 'الخدمات',
        'en': 'Services'
    },
    'more': {
        'ar': 'المزيد',
        'en': 'more'
    },
    'dashboard_link': {
        'ar': 'لوحة التحكم',
        'en': 'Dashboard'
    },
    'logout': {
        'ar': 'تسجيل الخروج',
        'en': 'Logout'
    },
    'yes_confirm_modal': {
        'ar': 'نعم، تأكيد',
        'en': 'Yes, Confirm'
    }, // Added/Standardized
    'confirm_action_modal': {
        'ar': 'تأكيد الإجراء',
        'en': 'Confirm Action'
    }, // Added/Standardized
    'are_you_sure_proceed_modal': {
        'ar': 'هل أنت متأكد أنك تريد المتابعة؟',
        'en': 'Are you sure you want to proceed?'
    }, // Added/Standardized
    'cancel_modal': {
        'ar': 'إلغاء',
        'en': 'Cancel'
    }, // Added/Standardized
    'close_modal': {
        'ar': 'إغلاق',
        'en': 'Close'
    }, // Added/Standardized
    'professionals': {
        'ar': 'المهنيين',
        'en': 'Professionals'
    },
    'for_employers_nav': {
        'ar': 'لأصحاب العمل',
        'en': 'For Employers'
    },
    'share_failed_opening_email': {
        'ar': 'فشل المشاركة. جارٍ فتح البريد الإلكتروني.',
        'en': 'Share failed. Opening email.'
    },
    'no_key_skills': {
        'ar': 'لا توجد مهارات رئيسية',
        'en': 'No key skills'
    },
    'view_profile': {
        'ar': 'عرض الملف الشخصي',
        'en': 'View Profile'
    },
    'unknown_error': {
        'ar': 'خطأ غير معروف',
        'en': 'Unknown error'
    },
    'http_error_status': {
        'ar': 'خطأ HTTP! الحالة:',
        'en': 'HTTP error! status:'
    },
    'failed_load_top_professionals': {
        'ar': 'فشل تحميل أفضل المهنيين:',
        'en': 'Failed to load top professionals:'
    },
    'failed_load_top_companies': {
        'ar': 'فشل تحميل أفضل الشركات:',
        'en': 'Failed to load top companies:'
    },
    'loading_top_professionals': {
        'ar': 'جار تحميل أفضل المهنيين...',
        'en': 'Loading top professionals...'
    },
    'loading_top_companies': {
        'ar': 'جار تحميل أفضل الشركات...',
        'en': 'Loading top companies...'
    },
    'loading_message': {
        'ar': 'جار التحميل...',
        'en': 'Loading...'
    },
    'view_application_in_dashboard': {
        'ar': 'عرض الطلب في لوحة التحكم',
        'en': 'View Application in Dashboard'
    },
    'new_job_alert': {
        'ar': 'تنبيه وظيفة جديدة',
        'en': 'New Job Alert'
    },
    'see_all_matching_jobs': {
        'ar': 'عرض جميع الوظائف المطابقة',
        'en': 'See All Matching Jobs'
    },
    'job_details': {
        'ar': 'تفاصيل الوظيفة',
        'en': 'Job Details'
    },
    'position': {
        'ar': 'المنصب',
        'en': 'Position'
    },
    'job_id': {
        'ar': 'معرف الوظيفة',
        'en': 'Job ID'
    },
    'budget': {
        'ar': 'الميزانية',
        'en': 'Budget'
    },
    'applicant_details': {
        'ar': 'تفاصيل المتقدم',
        'en': 'Applicant Details'
    },
    'name': {
        'ar': 'الاسم',
        'en': 'Name'
    },
    'profession': {
        'ar': 'المهنة',
        'en': 'Profession'
    },
    'proposal': {
        'ar': 'الاقتراح',
        'en': 'Proposal'
    },
    'message_from': {
        'ar': 'رسالة من',
        'en': 'Message from'
    },
    'go_to_dashboard': {
        'ar': 'اذهب إلى لوحة التحكم',
        'en': 'Go to Dashboard'
    },
    'new_message_from_employer': {
        'ar': 'رسالة جديدة من صاحب العمل',
        'en': 'New Message from Employer'
    },
    'from': {
        'ar': 'من',
        'en': 'From'
    },
    'message': {
        'ar': 'الرسالة',
        'en': 'Message'
    },
    'contact_form_submission': {
        'ar': 'نموذج الاتصال',
        'en': 'Contact Form Submission'
    },
    'subject': {
        'ar': 'الموضوع',
        'en': 'Subject'
    },
    'email_from_form': {
        'ar': 'البريد الإلكتروني (من النموذج)',
        'en': 'Email (from form)'
    },
    'logged_in_user_id': {
        'ar': 'معرف المستخدم المسجل دخوله',
        'en': 'Logged-in User ID'
    },
    'logged_in_user_type': {
        'ar': 'نوع المستخدم المسجل دخوله',
        'en': 'Logged-in User Type'
    },
    'logged_in_name': {
        'ar': 'اسم المستخدم المسجل دخوله',
        'en': 'Logged-in Name'
    },
    'logged_in_email': {
        'ar': 'البريد الإلكتروني للمستخدم المسجل دخوله',
        'en': 'Logged-in Email'
    },
    'logged_in_phone': {
        'ar': 'هاتف المستخدم المسجل دخوله',
        'en': 'Logged-in Phone'
    },
    'logged_in_city': {
        'ar': 'مدينة المستخدم المسجل دخوله',
        'en': 'Logged-in City'
    },
    'view_professional_profile': {
        'ar': 'عرض ملف المهني',
        'en': 'View Professional Profile'
    },
    'sender_not_logged_in': {
        'ar': 'المرسل لم يكن مسجلاً للدخول.',
        'en': 'Sender was not logged in.'
    },
    'access_restricted': {
        'ar': 'الوصول مقيد',
        'en': 'Access Restricted'
    },
    'need_login_signup_action': {
        'ar': 'يجب عليك تسجيل الدخول أو التسجيل للقيام بهذا الإجراء.',
        'en': 'You need to log in or sign up to perform this action.'
    },
    'role_mismatch': {
        'ar': 'عدم تطابق الدور',
        'en': 'Role Mismatch'
    },
    'action_only_available_for': {
        'ar': 'هذا الإجراء متاح فقط لحسابات',
        'en': 'This action is only available for'
    },
    'confirm_downgrade': {
        'ar': 'تأكيد الرجوع للخطة الأدنى',
        'en': 'Confirm Downgrade'
    },
    'about_to_downgrade_message': {
        'ar': 'أنت على وشك الرجوع من خطة <strong><span id="currentPlanName"></span></strong> إلى خطة <strong><span id="newPlanName"></span></strong>. ستفقد الوصول إلى الميزات التالية:',
        'en': 'You are about to downgrade from your <strong><span id="currentPlanName"></span></strong> plan to the <strong><span id="newPlanName"></span></strong> plan. You will lose access to the following features:'
    },
    'no_significant_features_lost': {
        'ar': 'لن يتم فقدان ميزات مهمة.',
        'en': 'No significant features will be lost.'
    },
    'current_plan': {
        'ar': 'الخطة الحالية',
        'en': 'Current Plan'
    },
    'choose_plan': {
        'ar': 'اختر الخطة',
        'en': 'Choose Plan'
    },
    'plan_free': {
        'ar': 'مجاني',
        'en': 'Free'
    },
    'price_free': {
        'ar': '<span>0</span>₪<span class="period">/شهر</span>',
        'en': '<span>0</span>₪<span class="period">/month</span>'
    },
    'feature_jobs_free': {
        'ar': '<i class="fas fa-check-circle"></i> طلبات وظائف غير محدودة',
        'en': '<i class="fas fa-check-circle"></i> Unlimited job applications'
    },
    'feature_visibility_basic': {
        'ar': '<i class="fas fa-check-circle"></i> رؤية أساسية',
        'en': '<i class="fas fa-check-circle"></i> Basic Visibility'
    },
    'feature_profile_views_count': {
        'ar': '<i class="fas fa-check-circle"></i> مشاهدات الملف الشخصي (العدد فقط)',
        'en': '<i class="fas fa-check-circle"></i> Profile views (Count only)'
    },
    'feature_direct_messaging_no': {
        'ar': '<i class="fas fa-times-circle"></i> المراسلة المباشرة',
        'en': '<i class="fas fa-times-circle"></i> Direct Messaging'
    },
    'feature_job_alerts_no': {
        'ar': '<i class="fas fa-times-circle"></i> تنبيهات الوظائف',
        'en': '<i class="fas fa-times-circle"></i> Job Alerts'
    },
    'feature_badge_no': {
        'ar': '<i class="fas fa-times-circle"></i> شارة مميزة',
        'en': '<i class="fas fa-times-circle"></i> Premium Badge'
    },
    'get_started_free': {
        'ar': 'ابدأ مجانًا',
        'en': 'Get Started Free'
    },
    'recommended': {
        'ar': 'موصى به',
        'en': 'Recommended'
    },
    'ready_to_elevate': {
        'ar': 'هل أنت مستعد لرفع مستوى تجربتك في هايرلي؟',
        'en': 'Ready to Elevate Your Hirly Experience?'
    },
    'view_all_plans': {
        'ar': 'عرض جميع الخطط',
        'en': 'View All Plans'
    },
    'contact_sales': {
        'ar': 'اتصل بالمبيعات',
        'en': 'Contact Sales'
    },
    'choose_your_plan': {
        'ar': 'اختر خطتك المثالية',
        'en': 'Choose Your Perfect Plan'
    },
    'select_plan_description': {
        'ar': 'سواء كنت باحثًا عن عمل يهدف إلى فرص غير محدودة أو صاحب عمل يبحث عن أفضل المهنيين، لدينا خطة مصممة خصيصًا لك.',
        'en': 'Whether you\'re a job seeker aiming for unlimited opportunities or an employer seeking top professionals, we have a plan tailored for you.'
    },
    'account_tools_title': {
        'ar': 'أدوات الحساب',
        'en': 'Account Tools'
    },
    'main_links_title': {
        'ar': 'روابط رئيسية',
        'en': 'Main Links'
    },
    'session_title': {
        'ar': 'الجلسة',
        'en': 'Session'
    },
    'email_verified_success_login': {
        'ar': 'تم تأكيد بريدك الإلكتروني بنجاح! يمكنك الآن تسجيل الدخول.',
        'en': 'Your email has been successfully verified! You can now log in.'
    },
    'email_verification_required_login': {
        'ar': 'الرجاء تأكيد عنوان بريدك الإلكتروني للوصول إلى هذه الصفحة. تحقق من صندوق الوارد الخاص بك للحصول على رابط التأكيد.',
        'en': 'Please verify your email address to access this page. Check your inbox for a verification link.'
    },
    'login_successful_redirect': {
        'ar': 'تم تسجيل الدخول بنجاح! جارٍ إعادة التوجيه...',
        'en': 'Login successful! Redirecting...'
    },
    'login_failed_generic': {
        'ar': 'فشل تسجيل الدخول. الرجاء المحاولة مرة أخرى.',
        'en': 'Login failed. Please try again.'
    },
    'unexpected_error_occurred': {
        'ar': 'حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى لاحقًا.',
        'en': 'An unexpected error occurred. Please try again later.'
    },
    'homepage_title': {
        'ar': 'الرئيسية',
        'en': 'Home'
    }, // Corrected translation for homepage
    'remote': {
        'ar': 'عن بعد',
        'en': 'Remote'
    }, // Added missing translation key
    'hybrid': {
        'ar': 'مختلط',
        'en': 'Hybrid'
    }, // Added missing translation key
    'full_time': {
        'ar': 'دوام كامل',
        'en': 'Full-time'
    },
    'fulltime': {
        'ar': 'دوام كامل',
        'en': 'Full-time'
    },
    'part_time': {
        'ar': 'دوام جزئي',
        'en': 'Part-time'
    },
    'parttime': {
        'ar': 'دوام جزئي',
        'en': 'Part-time'
    },
    'contract': {
        'ar': 'عقد',
        'en': 'Contract'
    },
    'freelance': {
        'ar': 'عمل حر',
        'en': 'Freelance'
    },
    // Missing services page keys from services-page-translations.js
    "services_page_title": {
        "en": "Services - Hirly",
        "ar": "الخدمات - هايرلي"
    },
    "services_list_title": {
        "en": "Services",
        "ar": "الخدمات"
    },
    "services": {
        "en": "Services",
        "ar": "خدمات"
    },
    "no_services_found": {
        "en": "No services found.",
        "ar": "لم يتم العثور على خدمات."
    },
    "view_profile_btn": {
        "en": "View Profile",
        "ar": "عرض الملف الشخصي"
    },
    "employer_access_required": {
        "ar": "مطلوب حساب صاحب عمل",
        "en": "Employer Account Required"
    },
    "employer_access_message_unauthenticated": {
        "ar": "هذا القسم مخصص لأصحاب العمل للعثور على المهنيين. يرجى تسجيل الدخول أو إنشاء حساب لمتابعة.",
        "en": "This section is for employers to find professionals. Please log in or sign up to continue."
    },
    "signup_as_employer": {
        "ar": "إنشاء حساب كصاحب عمل",
        "en": "Sign Up as Employer"
    },
    "employer_access_message_professional": {
        "ar": "أنت مسجل حاليًا كمهني. هذا القسم مخصص لأصحاب العمل فقط.",
        "en": "You are currently logged in as a professional. This section is for employers only."
    },
    "go_to_my_dashboard": {
        "ar": "اذهب إلى لوحة التحكم الخاصة بي",
        "en": "Go to My Dashboard"
    },
    "login_as_employer": {
        "ar": "تسجيل الدخول كصاحب عمل",
        "en": "Login as Employer"
    },
    "verification_required_modal_title": {
        "ar": "التحقق مطلوب",
        "en": "Verification Required"
    },
    "talent_verification_required_message": {
        "ar": "لعرض ملفات المهنيين، يجب أن يكون حسابك كصاحب عمل موثقًا.",
        "en": "To view professional profiles, your employer account must be verified."
    },
    "go_to_profile": {
        "ar": "اذهب إلى الملف الشخصي",
        "en": "Go to Profile"
    },
    "refresh_recommended_title": {
        "ar": "تم تحديث اللغة!",
        "en": "Language Updated!"
    },
    "refresh_recommended_desc": {
        "ar": "نوصي بشدة بتحديث الصفحة لتطبيق جميع التغييرات بشكل مثالي.",
        "en": "We highly recommend refreshing the page to apply all changes perfectly."
    },
    "refresh_now": {
        "ar": "تحديث الآن",
        "en": "Refresh Now"
    },
    "maybe_later": {
        "ar": "ربما لاحقاً",
        "en": "Maybe Later"
    }
};

// Global variable to store the current language
// Initialize currentLanguage from localStorage, or default to 'ar' if not found
window.currentLanguage = localStorage.getItem('hirlyLang') || 'ar';

/**
 * Merges new translations into the global translations object.
 * This allows page-specific translation files to add their keys.
 * @param {Object} newTranslations - An object containing new translation keys and their values.
 */
window.addTranslations = function(newTranslations) {
    if (newTranslations && typeof newTranslations === 'object') {
        Object.assign(window.translations, newTranslations);
    }
};

// Function to apply translations to the current page
window.applyTranslations = function(lang) {
    // Set the global current language
    window.currentLanguage = lang;
    localStorage.setItem('hirlyLang', lang); // Save preference to local storage

    // Update the HTML tag's lang and dir attributes
    const htmlTag = document.documentElement || document.getElementById('htmlTag');
    if (htmlTag) {
        htmlTag.setAttribute('lang', lang);
        // Always set RTL for Arabic, LTR for English
        htmlTag.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
        // Add/remove RTL class for additional styling control
        if (lang === 'ar') {
            htmlTag.classList.add('rtl-mode');
        } else {
            htmlTag.classList.remove('rtl-mode');
        }
    }

    // --- Dynamic Logo Display Logic ---
    const headerImageLogo = document.getElementById('headerImageLogo');
    const headerTextLogo = document.getElementById('headerTextLogo');
    // Removed headerLogoLink and aria-label manipulation from here
    // const headerLogoLink = document.getElementById('headerLogoLink'); // No longer needed for aria-label

    if (headerImageLogo && headerTextLogo) { // Simplified condition
        if (lang === 'ar') {
            headerImageLogo.style.display = 'none';
            headerTextLogo.style.display = 'block';
            // Removed: headerLogoLink.setAttribute('aria-label', window.translations['hirly_app_name_aria_label']['ar']);
        } else { // lang === 'en'
            headerImageLogo.style.display = 'block';
            headerTextLogo.style.display = 'none';
            // Removed: headerLogoLink.setAttribute('aria-label', window.translations['hirly_app_name_aria_label']['en']);
        }
    }
    // --- End Dynamic Logo Display Logic ---


    // Iterate over all elements with a data-lang-key attribute
    document.querySelectorAll('[data-lang-key]').forEach(element => {
        const key = element.getAttribute('data-lang-key');
        // Now `window.translations` should contain all merged translations from global and page-specific files
        if (window.translations[key] && window.translations[key][lang]) {
            const translatedText = window.translations[key][lang];
            
            // Check if the translated text contains HTML or if the element already has children
            const hasHTML = /<[a-z][\s\S]*>/i.test(translatedText);
            
            if (hasHTML || element.children.length > 0 || element.innerHTML.includes('<') || element.innerHTML.includes('>')) {
                // If it's a button with an icon, update the span inside it
                if (element.classList.contains('btn-icon')) {
                    const buttonTextSpan = element.querySelector('.button-text');
                    if (buttonTextSpan) {
                        buttonTextSpan.textContent = translatedText;
                    } else {
                        // Fallback if span is missing, but icon exists
                        const existingIcon = element.querySelector('i');
                        if (existingIcon) {
                            element.innerHTML = `${existingIcon.outerHTML} ${translatedText}`;
                        } else {
                            element.textContent = translatedText;
                        }
                    }
                } else if (element.tagName === 'H2' || element.tagName === 'H3' || element.tagName === 'A') {
                    // For H2, H3, A tags, specifically handle their content to preserve icons
                    const existingIcon = element.querySelector('i');
                    if (existingIcon) {
                        element.innerHTML = `${existingIcon.outerHTML} ${translatedText}`;
                    } else {
                        element.textContent = translatedText;
                    }
                } else if (element.tagName === 'SPAN' && element.id && (element.id.includes('Label') || element.id.includes('Display'))) {
                    // For span elements with IDs containing 'Label' or 'Display' (like firstNameLabel, selectedCategoriesDisplay), just update text content
                    element.textContent = translatedText;
                } else {
                    element.innerHTML = translatedText;
                }
            } else {
                // Special handling for input/textarea placeholders
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
                    element.setAttribute('placeholder', translatedText);
                } else {
                    element.textContent = translatedText;
                }
            }
        } else {
            console.warn(`Translation key '${key}' not found for language '${lang}'.`);
        }
    });

    // NEW: Handle elements with data-lang-placeholder
    document.querySelectorAll('[data-lang-placeholder]').forEach(element => {
        const key = element.getAttribute('data-lang-placeholder');
        if (window.translations[key] && window.translations[key][lang]) {
            element.setAttribute('placeholder', window.translations[key][lang]);
        }
    });

    // Dispatch a custom event to notify other scripts that translations have been applied
    // This is useful for components that need to update their UI based on the new language (e.g., header language switcher)
    const event = new CustomEvent('translationsApplied', {
        detail: {
            lang: lang
        }
    });
    window.dispatchEvent(event);
};

// Function to show the language selection modal
window.showLanguageSelectionModal = function() {
    const modal = document.getElementById('languageSelectionModal');
    const step1 = document.getElementById('langModalStep1');
    const step2 = document.getElementById('langModalStep2');
    
    if (step1) step1.style.display = 'block';
    if (step2) step2.style.display = 'none';

    if (modal && typeof window.showModal === 'function') {
        window.showModal(modal);
    } else if (modal) {
        // Fallback if components.js isn't loaded or showModal isn't global
        modal.classList.add('show');
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
    }
};

// Function to hide the language selection modal
window.hideLanguageSelectionModal = function() {
    const modal = document.getElementById('languageSelectionModal');
    if (modal && typeof window.hideModal === 'function') {
        window.hideModal(modal);
    } else if (modal) {
        // Fallback
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
};

// NEW: Function to initialize language modal event listeners (called after header is loaded)
window.initializeLanguageModalListeners = function() {
    const selectLanguageEnButton = document.getElementById('selectLanguageEn');
    const selectLanguageArButton = document.getElementById('selectLanguageAr');
    const closeLanguageModalBtn = document.getElementById('closeLanguageModalBtn');
    const refreshPageBtn = document.getElementById('refreshPageBtn');
    const maybeLaterBtn = document.getElementById('maybeLaterBtn');

    const showStep2 = () => {
        const step1 = document.getElementById('langModalStep1');
        const step2 = document.getElementById('langModalStep2');
        if (step1) step1.style.display = 'none';
        if (step2) step2.style.display = 'block';
    };

    if (selectLanguageEnButton && !selectLanguageEnButton._hasListener) {
        selectLanguageEnButton.addEventListener('click', function() {
            window.applyTranslations('en');
            showStep2();
        });
        selectLanguageEnButton._hasListener = true;
    }

    if (selectLanguageArButton && !selectLanguageArButton._hasListener) {
        selectLanguageArButton.addEventListener('click', function() {
            window.applyTranslations('ar');
            showStep2();
        });
        selectLanguageArButton._hasListener = true;
    }

    if (closeLanguageModalBtn && !closeLanguageModalBtn._hasListener) {
        closeLanguageModalBtn.addEventListener('click', function() {
            window.hideLanguageSelectionModal();
        });
        closeLanguageModalBtn._hasListener = true;
    }

    if (refreshPageBtn && !refreshPageBtn._hasListener) {
        refreshPageBtn.addEventListener('click', function() {
            location.reload();
        });
        refreshPageBtn._hasListener = true;
    }

    if (maybeLaterBtn && !maybeLaterBtn._hasListener) {
        maybeLaterBtn.addEventListener('click', function() {
            window.hideLanguageSelectionModal();
        });
        maybeLaterBtn._hasListener = true;
    }
};

// Helper function to format time (Moved from jobs.js to be global)
window.timeAgo = function(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    const lang = window.currentLanguage || 'en';
    const t = window.translations;

    // Add time-related translations to the global translations object
    if (!window.translations.just_now) {
        window.translations.just_now = {
            'ar': 'الآن',
            'en': 'Just now'
        };
    }
    if (!window.translations.minutes_ago) {
        window.translations.minutes_ago = {
            'ar': 'منذ {minutes} دقيقة',
            'en': '{minutes} min ago'
        };
    }
    if (!window.translations.hours_ago) {
        window.translations.hours_ago = {
            'ar': 'منذ {hours} ساعة',
            'en': '{hours} hr ago'
        };
    }
    if (!window.translations.days_ago) {
        window.translations.days_ago = {
            'ar': 'منذ {days} يوم',
            'en': '{days} d ago'
        };
    }
    if (!window.translations.weeks_ago) {
        window.translations.weeks_ago = {
            'ar': 'منذ {weeks} أسبوع',
            'en': '{weeks} w ago'
        };
    }

    const translations = {
        just_now: window.translations.just_now[lang],
        minutes_ago: window.translations.minutes_ago[lang],
        hours_ago: window.translations.hours_ago[lang],
        days_ago: window.translations.days_ago[lang],
        weeks_ago: window.translations.weeks_ago[lang]
    };

    if (seconds < 60) {
        return translations.just_now;
    }
    let interval = seconds / 60;
    if (interval < 60) {
        const mins = Math.floor(interval);
        return translations.minutes_ago.replace('{minutes}', mins);
    }
    interval = seconds / 3600;
    if (interval < 24) {
        const hrs = Math.floor(interval);
        return translations.hours_ago.replace('{hours}', hrs);
    }
    interval = seconds / 86400;
    if (interval < 7) {
        const days = Math.floor(interval);
        return translations.days_ago.replace('{days}', days);
    }
    interval = seconds / 604800;
    if (interval < 4) {
        const weeks = Math.floor(interval);
        return translations.weeks_ago.replace('{weeks}', weeks);
    }
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    return date.toLocaleDateString(lang, options);
};


// Event listener for DOMContentLoaded to initialize language
document.addEventListener('DOMContentLoaded', function() {
    // Determine the initial language to apply
    // It will first try to get from localStorage, otherwise default to 'ar'
    const initialLang = localStorage.getItem('hirlyLang') || 'ar';
    window.applyTranslations(initialLang);
    // Note: Language modal listeners will be initialized by components.js after header load.
    // The mobile language switcher button listener will also be attached by components.js.
});

// Re-apply translations when components are loaded dynamically
document.addEventListener('headerLoaded', () => {
    window.applyTranslations(window.currentLanguage);
});

document.addEventListener('footerLoaded', () => {
    window.applyTranslations(window.currentLanguage);
});
