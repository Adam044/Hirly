// public/language/privacy-translations.js
if (typeof window.addTranslations === 'function') {
    window.addTranslations({
        "privacy_policy_title": {
            "en": "Privacy Policy",
            "ar": "سياسة الخصوصية"
        },
        "last_updated": {
            "en": "Last Updated",
            "ar": "آخر تحديث"
        },
        "last_updated_date": {
            "en": "August 29, 2026",
            "ar": "29 أغسطس 2026"
        },
        "privacy_intro_title": {
            "en": "1. Introduction",
            "ar": "1. مقدمة"
        },
        "privacy_intro_desc": {
            "en": "Welcome to Hirly. We are committed to protecting your personal data and your right to privacy. This Privacy Policy explains how we collect, use, and share information when you use our platform.",
            "ar": "مرحباً بك في هايرلي. نحن ملتزمون بحماية بياناتك الشخصية وحقك في الخصوصية. تشرح سياسة الخصوصية هذه كيفية جمع واستخدام ومشاركة المعلومات عند استخدام منصتنا."
        },
        "privacy_data_collection_title": {
            "en": "2. Information We Collect",
            "ar": "2. المعلومات التي نجمعها"
        },
        "privacy_data_collection_desc": {
            "en": "We collect information that you provide directly to us, including:",
            "ar": "نقوم بجمع المعلومات التي تقدمها لنا مباشرة، بما في ذلك:"
        },
        "privacy_data_account": {
            "en": "Account information (name, email, password)",
            "ar": "معلومات الحساب (الاسم، البريد الإلكتروني، كلمة المرور)"
        },
        "privacy_data_profile": {
            "en": "Professional profile data (CV, skills, experience)",
            "ar": "بيانات الملف الشخصي المهني (السيرة الذاتية، المهارات، الخبرة)"
        },
        "privacy_data_comms": {
            "en": "Communication records with other users",
            "ar": "سجلات التواصل مع المستخدمين الآخرين"
        },
        "privacy_data_payment": {
            "en": "Payment information (processed securely via third-party providers)",
            "ar": "معلومات الدفع (تتم معالجتها بشكل آمن عبر مزودي خدمة خارجيين)"
        },
        "privacy_data_usage_title": {
            "en": "3. How We Use Your Information",
            "ar": "3. كيف نستخدم معلوماتك"
        },
        "privacy_data_usage_desc": {
            "en": "We use the collected data to provide and improve our services, including:",
            "ar": "نحن نستخدم البيانات التي نجمعها لتقديم وتحسين خدماتنا، بما في ذلك:"
        },
        "privacy_usage_connecting": {
            "en": "Connecting professionals with job opportunities",
            "ar": "ربط المهنيين بفرص العمل"
        },
        "privacy_usage_verifying": {
            "en": "Verifying user identities for platform security",
            "ar": "التحقق من هويات المستخدمين لأمان المنصة"
        },
        "privacy_usage_notifications": {
            "en": "Sending important account notifications",
            "ar": "إرسال إشعارات الحساب الهامة"
        },
        "privacy_usage_analytics": {
            "en": "Analyzing platform usage to enhance user experience",
            "ar": "تحليل استخدام المنصة لتحسين تجربة المستخدم"
        },
        "privacy_data_security_title": {
            "en": "4. Data Security",
            "ar": "4. أمن البيانات"
        },
        "privacy_data_security_desc": {
            "en": "We implement industry-standard security measures to protect your data. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.",
            "ar": "نحن نطبق تدابير أمنية قياسية في الصناعة لحماية بياناتك. ومع ذلك، لا توجد وسيلة نقل عبر الإنترنت آمنة بنسبة 100٪، ولا يمكننا ضمان الأمان المطلق."
        },
        "privacy_rights_title": {
            "en": "5. Your Rights",
            "ar": "5. حقوقك"
        },
        "privacy_rights_desc": {
            "en": "You have the right to access, correct, or delete your personal information at any time via your account settings or by contacting our support team.",
            "ar": "لديك الحق في الوصول إلى معلوماتك الشخصية أو تصحيحها أو حذفها في أي وقت عبر إعدادات حسابك أو عن طريق الاتصال بفريق الدعم لدينا."
        }
    });
    
    // Re-apply translations to the page once added
    if (typeof window.applyTranslations === 'function') {
        window.applyTranslations(window.currentLanguage || 'ar');
    }
}
