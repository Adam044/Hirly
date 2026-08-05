window.servicesPageTranslations = {
    "services_page_title": {
        "en": "Services - Hirly",
        "ar": "الخدمات - هيرلي"
    },
    "services_list_title": {
        "en": "Browse Services",
        "ar": "تصفح الخدمات"
    },
    "loading_services_spinner": {
        "en": "Loading services...",
        "ar": "جاري تحميل الخدمات..."
    },
    "no_services_found": {
        "en": "No services found matching your criteria.",
        "ar": "لم يتم العثور على خدمات مطابقة لمعايير البحث."
    },
    "view_profile_btn": {
        "en": "View Profile",
        "ar": "عرض الملف الشخصي"
    },
    "no_image_available_alt": {
        "en": "No Image Available",
        "ar": "لا توجد صورة متوفرة"
    },
    "search_placeholder": {
        "en": "Search services by title or description...",
        "ar": "ابحث عن الخدمات حسب العنوان أو الوصف..."
    },
    "category_label": {
        "en": "Category",
        "ar": "الفئة"
    },
    "all_categories": {
        "en": "All Categories",
        "ar": "جميع الفئات"
    }
};

// This directly merges translations into the global object.
// This ensures that the translations are available immediately,
// preventing a timing issue (race condition) where the page
// tries to translate before the data is loaded.
if (!window.translations) {
    window.translations = {};
}
Object.assign(window.translations, window.servicesPageTranslations);
