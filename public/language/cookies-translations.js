// public/language/cookies-translations.js
if (typeof window.addTranslations === 'function') {
    window.addTranslations({
        "cookies_policy_title": {
            "en": "Cookie Policy",
            "ar": "سياسة ملفات تعريف الارتباط"
        },
        "last_updated": {
            "en": "Last Updated",
            "ar": "آخر تحديث"
        },
        "last_updated_date": {
            "en": "August 29, 2026",
            "ar": "29 أغسطس 2026"
        },
        "what_are_cookies": {
            "en": "1. What are Cookies?",
            "ar": "1. ما هي ملفات تعريف الارتباط؟"
        },
        "cookies_definition": {
            "en": "Cookies are small text files stored on your device when you visit websites. They help us remember your preferences and provide a more personalized experience.",
            "ar": "ملفات تعريف الارتباط هي ملفات نصية صغيرة يتم تخزينها على جهازك عند زيارة مواقع الويب. فهي تساعدنا على تذكر تفضيلاتك وتقديم تجربة أكثر تخصيصاً."
        },
        "how_we_use_cookies": {
            "en": "2. How We Use Cookies",
            "ar": "2. كيف نستخدم ملفات تعريف الارتباط"
        },
        "cookies_usage_intro": {
            "en": "We use cookies for the following purposes:",
            "ar": "نحن نستخدم ملفات تعريف الارتباط للأغراض التالية:"
        },
        "essential_cookies": {
            "en": "Essential:",
            "ar": "أساسية:"
        },
        "essential_cookies_desc": {
            "en": "Necessary for the website to function, such as authentication and security.",
            "ar": "ضرورية لعمل الموقع، مثل المصادقة والأمن."
        },
        "functional_cookies": {
            "en": "Functional:",
            "ar": "وظيفية:"
        },
        "functional_cookies_desc": {
            "en": "Remembering your language preferences and UI settings.",
            "ar": "تذكر تفضيلات اللغة وإعدادات واجهة المستخدم."
        },
        "analytics_cookies": {
            "en": "Analytics:",
            "ar": "تحليلية:"
        },
        "analytics_cookies_desc": {
            "en": "Understanding how users interact with Hirly to improve our features.",
            "ar": "فهم كيفية تفاعل المستخدمين مع هايرلي لتحسين ميزاتنا."
        },
        "marketing_cookies": {
            "en": "Marketing:",
            "ar": "تسويقية:"
        },
        "marketing_cookies_desc": {
            "en": "Serving relevant job opportunities and career insights.",
            "ar": "تقديم فرص عمل ذات صلة ورؤى مهنية."
        },
        "managing_preferences": {
            "en": "3. Managing Your Preferences",
            "ar": "3. إدارة تفضيلاتك"
        },
        "cookies_management_desc": {
            "en": "You can control cookies through your browser settings. However, disabling essential cookies may affect your ability to use certain features of the platform.",
            "ar": "يمكنك التحكم في ملفات تعريف الارتباط من خلال إعدادات متصفحك. ومع ذلك، قد يؤثر تعطيل ملفات تعريف الارتباط الأساسية على قدرتك على استخدام ميزات معينة في المنصة."
        }
    });

    // Re-apply translations to the page once added
    if (typeof window.applyTranslations === 'function') {
        window.applyTranslations(window.currentLanguage || 'ar');
    }
}
