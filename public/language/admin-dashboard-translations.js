// Admin Dashboard Translations
const adminDashboardTranslations = {
    ar: {
        // Navigation
        'overview': 'نظرة عامة',
        'users': 'المستخدمون',
        'jobs': 'الوظائف',
        'reviews': 'التقييمات',
        'job-alerts': 'تنبيهات الوظائف',
        'job-application-notifications': 'إشعارات طلبات التوظيف',
        'email-campaigns': 'الحملات الإعلانية',
        'logout': 'تسجيل الخروج',

        // Job Application Notifications Section
        'job-application-notifications-title': 'إشعارات طلبات التوظيف',
        'job-application-notifications-description': 'إرسال إشعارات للأرباب عن الطلبات الجديدة على وظائفهم',
        'search-jobs': 'البحث في الوظائف...',
        'filter-by-city': 'تصفية حسب المدينة',
        'filter-by-category': 'تصفية حسب الفئة',
        'filter-by-notification-status': 'تصفية حسب حالة الإشعار',
        'all-cities': 'جميع المدن',
        'all-categories': 'جميع الفئات',
        'all-statuses': 'جميع الحالات',
        'notified': 'تم الإرسال',
        'not-notified': 'لم يتم الإرسال',
        'select-all': 'تحديد الكل',
        'job-title': 'عنوان الوظيفة',
        'employer': 'صاحب العمل',
        'city': 'المدينة',
        'category': 'الفئة',
        'applications-count': 'عدد الطلبات',
        'posted-date': 'تاريخ النشر',
        'notification-status': 'حالة الإشعار',
        'send-notifications': 'إرسال الإشعارات',
        'no-jobs-found': 'لا توجد وظائف مع طلبات توظيف',
        'sending-notifications': 'جاري إرسال الإشعارات...',
        'notification-sent': 'تم الإرسال',
        'notification-not-sent': 'لم يتم الإرسال',
        'no-job-selected': 'لم يتم اختيار أي وظيفة',
        'selected-jobs-summary': 'تم اختيار {count} وظيفة مع {applications} طلب توظيف',
        'notifications-sent-success': 'تم إرسال {count} إشعار بنجاح',
        'error-loading-jobs': 'خطأ في تحميل الوظائف مع الطلبات',
        'error-sending-notifications': 'خطأ في إرسال الإشعارات',
        'select-at-least-one-job': 'يرجى اختيار وظيفة واحدة على الأقل'
    },
    en: {
        // Navigation
        'overview': 'Overview',
        'users': 'Users',
        'jobs': 'Jobs',
        'reviews': 'Reviews',
        'job-alerts': 'Job Alerts',
        'job-application-notifications': 'Job Application Notifications',
        'email-campaigns': 'Email Campaigns',
        'logout': 'Logout',

        // Job Application Notifications Section
        'job-application-notifications-title': 'Job Application Notifications',
        'job-application-notifications-description': 'Send notifications to employers about new applications on their jobs',
        'search-jobs': 'Search jobs...',
        'filter-by-city': 'Filter by City',
        'filter-by-category': 'Filter by Category',
        'filter-by-notification-status': 'Filter by Notification Status',
        'all-cities': 'All Cities',
        'all-categories': 'All Categories',
        'all-statuses': 'All Statuses',
        'notified': 'Notified',
        'not-notified': 'Not Notified',
        'select-all': 'Select All',
        'job-title': 'Job Title',
        'employer': 'Employer',
        'city': 'City',
        'category': 'Category',
        'applications-count': 'Applications',
        'posted-date': 'Posted Date',
        'notification-status': 'Notification Status',
        'send-notifications': 'Send Notifications',
        'no-jobs-found': 'No jobs with applications found',
        'sending-notifications': 'Sending notifications...',
        'notification-sent': 'Sent',
        'notification-not-sent': 'Not Sent',
        'no-job-selected': 'No job selected',
        'selected-jobs-summary': 'Selected {count} jobs with {applications} applications',
        'notifications-sent-success': 'Successfully sent {count} notifications',
        'error-loading-jobs': 'Error loading jobs with applications',
        'error-sending-notifications': 'Error sending notifications',
        'select-at-least-one-job': 'Please select at least one job'
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = adminDashboardTranslations;
}