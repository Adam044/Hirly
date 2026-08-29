// public/language/terms-translations.js
if (typeof window.addTranslations === 'function') {
    window.addTranslations({
        "terms_service_title": {
            "en": "Terms of Service",
            "ar": "شروط الخدمة"
        },
        "last_updated": {
            "en": "Last Updated",
            "ar": "آخر تحديث"
        },
        "last_updated_date": {
            "en": "August 29, 2026",
            "ar": "29 أغسطس 2026"
        },
        "terms_acceptance_title": {
            "en": "1. Acceptance of Terms",
            "ar": "1. قبول الشروط"
        },
        "terms_acceptance_desc": {
            "en": "By accessing or using Hirly, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this site.",
            "ar": "من خلال الوصول إلى هايرلي أو استخدامها، فإنك توافق على الالتزام بشروط الخدمة هذه وجميع القوانين واللوائح المعمول بها. إذا كنت لا توافق على أي من هذه الشروط، فيُحظر عليك استخدام هذا الموقع."
        },
        "terms_conduct_title": {
            "en": "2. User Conduct",
            "ar": "2. سلوك المستخدم"
        },
        "terms_conduct_desc": {
            "en": "Users are responsible for their own behavior on the platform. You agree not to post false information, impersonate others, or use the platform for any illegal activities.",
            "ar": "المستخدمون مسؤولون عن سلوكهم الخاص على المنصة. أنت توافق على عدم نشر معلومات كاذبة، أو انتحال شخصية الآخرين، أو استخدام المنصة في أي أنشطة غير قانونية."
        },
        "terms_ip_title": {
            "en": "3. Intellectual Property",
            "ar": "3. الملكية الفكرية"
        },
        "terms_ip_desc": {
            "en": "The content, features, and functionality of Hirly are owned by us and are protected by international copyright, trademark, and other intellectual property laws.",
            "ar": "المحتوى والميزات والوظائف الخاصة بهايرلي مملوكة لنا ومحمية بموجب قوانين حقوق النشر والعلامات التجارية والقوانين الدولية الأخرى للملكية الفكرية."
        },
        "terms_liability_title": {
            "en": "4. Limitation of Liability",
            "ar": "4. تحديد المسؤولية"
        },
        "terms_liability_desc": {
            "en": "Hirly shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use the platform.",
            "ar": "هايرلي لن تكون مسؤولة عن أي أضرار غير مباشرة أو عرضية أو تبعية ناتجة عن استخدام أو عدم القدرة على استخدام المنصة."
        },
        "terms_changes_title": {
            "en": "5. Changes to Terms",
            "ar": "5. تغييرات على الشروط"
        },
        "terms_changes_desc": {
            "en": "We reserve the right to modify these terms at any time. We will notify users of any significant changes by posting the new terms on this page.",
            "ar": "نحن نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سنقوم بإخطار المستخدمين بأي تغييرات جوهرية من خلال نشر الشروط الجديدة على هذه الصفحة."
        }
    });

    // Re-apply translations to the page once added
    if (typeof window.applyTranslations === 'function') {
        window.applyTranslations(window.currentLanguage || 'ar');
    }
}
