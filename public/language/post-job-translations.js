// public/language/post-job-translations.js
// These are translations specific to the post_job.html page.
// They will be added to the main translations object in language.js
// by calling window.addTranslations().

// Check if window.addTranslations function is available before attempting to use it.
if (typeof window.addTranslations === 'function') {
    window.addTranslations({
        'post_job_title': { 'ar': 'انشر وظيفة جديدة - هايرلي', 'en': 'Post a New Job - Hirly' },
        'post_job_heading': { 'ar': 'انشر وظيفة جديدة', 'en': 'Post a New Job' },
        'job_title_label': { 'ar': 'عنوان الوظيفة', 'en': 'Job Title' },
        'job_title_placeholder': { 'ar': 'مثال: مطور ويب أول', 'en': 'e.g., Senior Web Developer' },
        'job_description_label': { 'ar': 'وصف الوظيفة', 'en': 'Job Description' },
        'job_description_placeholder': { 'ar': 'قدم وصفًا واضحًا للوظيفة (المهام والسياق). ضع المتطلبات التفصيلية في قسم "المتطلبات" أدناه.', 'en': 'Describe the role clearly (responsibilities and context). Add specific requirements in the Requirements section below.' },
        'toggle_richtext': { 'ar': 'تنسيق', 'en': 'Format' }, // NEW: Translation for rich text toggle button
        'toggle_richtext_plain': { 'ar': 'نص عادي', 'en': 'Plain Text' }, // NEW: Translation for rich text toggle button
        'align_left': { 'ar': 'محاذاة لليسار', 'en': 'Align Left' }, // NEW: Translation for align left
        'align_center': { 'ar': 'محاذاة للوسط', 'en': 'Align Center' }, // NEW: Translation for align center
        'align_right': { 'ar': 'محاذاة لليمين', 'en': 'Align Right' }, // NEW: Translation for align right
        'justify_full': { 'ar': 'ضبط', 'en': 'Justify' }, // NEW: Translation for justify
        'budget_type_label': { 'ar': 'الميزانية', 'en': 'Budget' }, // Updated translation for the budget type label
        'specify_budget': { 'ar': 'حدد ميزانية', 'en': 'Specify a budget' }, // NEW: Translation for "Specify a budget" radio button
        'will_be_discussed': { 'ar': 'سيتم النقاش لاحقًا', 'en': 'Will be discussed' }, // NEW: Translation for "Will be discussed" radio button
        'budget_label': { 'ar': 'الراتب/ الميزانية', 'en': 'Budget Amount' }, // Updated translation as requested
        'budget_placeholder': { 'ar': 'مثال: 1500', 'en': 'e.g., 1500' },
        'currency_label': { 'ar': 'العملة', 'en': 'Currency' },
        'select_currency': { 'ar': 'اختر العملة', 'en': 'Select Currency' },
        'usd_currency': { 'ar': 'دولار أمريكي ($)', 'en': 'USD ($)' },
        'ils_currency': { 'ar': 'شيكل إسرائيلي (₪)', 'en': 'ILS (₪)' },
        'jod_currency': { 'ar': 'دينار أردني (JD)', 'en': 'JOD (JD)' },
        'eur_currency': { 'ar': 'يورو (€)', 'en': 'EUR (€)' },
        'category_label': { 'ar': 'الفئة', 'en': 'Category' },
        'select_category': { 'ar': 'اختر فئة', 'en': 'Select a Category' },
        'loading_categories_spinner': { 'ar': 'جارٍ تحميل الفئات...', 'en': 'Loading categories...' },
        'select_professions': { 'ar': 'اختر المهن', 'en': 'Select Professions' },
        'loading_professions_spinner': { 'ar': 'جارٍ تحميل المهن...', 'en': 'Loading professions...' },
        'select_category_first': { 'ar': 'اختر فئة أولاً...', 'en': 'Select a category first...' },
        'no_professions_selected_tag': { 'ar': 'لم يتم اختيار مهن', 'en': 'No professions selected' },
        'job_type_label': { 'ar': 'نوع الوظيفة', 'en': 'Job Type' },
        'select_job_type': { 'ar': 'اختر نوع الوظيفة', 'en': 'Select Job Type' },
        'full_time': { 'ar': 'دوام كامل', 'en': 'Full-time' },
        'part_time': { 'ar': 'دوام جزئي', 'en': 'Part-time' },
        'contract': { 'ar': 'عقد', 'en': 'Contract' },
        'freelance': { 'ar': 'عمل حر', 'en': 'Freelance' },
        'job_site_type_label': { 'ar': 'نوع موقع العمل', 'en': 'Job Site Type' },
        'select_site_type': { 'ar': 'اختر نوع الموقع', 'en': 'Select Site Type' },
        'on_site': { 'ar': 'في الموقع', 'en': 'On-site' },
        'remote': { 'ar': 'عن بعد', 'en': 'Remote' },
        'hybrid': { 'ar': 'مختلط', 'en': 'Hybrid' },
        'job_city_label': { 'ar': 'مدينة العمل', 'en': 'Job City' },
        'select_city': { 'ar': 'اختر المدينة', 'en': 'Select City' },
        'job_image_label': { 'ar': 'صورة الوظيفة (اختياري)', 'en': 'Job Image (Optional)' },
        'choose_image': { 'ar': 'اختر صورة', 'en': 'Choose Image' },
        'no_file_chosen': { 'ar': 'لم يتم اختيار ملف', 'en': 'No file chosen' },
        'remove_image': { 'ar': 'إزالة الصورة', 'en': 'Remove Image' },
        'deadline_label': { 'ar': 'الموعد النهائي للتقديم', 'en': 'Application Deadline' },
        'post_job_button': { 'ar': 'نشر الوظيفة', 'en': 'Post Job' },
        'job_posted_successfully': { 'ar': 'تم نشر الوظيفة بنجاح!', 'en': 'Job posted successfully!' },
        'failed_to_post_job': { 'ar': 'فشل نشر الوظيفة.', 'en': 'Failed to post job.' },
        'error_posting_job': { 'ar': 'حدث خطأ أثناء نشر الوظيفة.', 'en': 'An error occurred while posting the job.' },
        'please_enter_job_title': { 'ar': 'الرجاء إدخال عنوان الوظيفة.', 'en': 'Please enter a job title.' },
        'please_provide_description': { 'ar': 'الرجاء تقديم وصف تفصيلي للوظيفة.', 'en': 'Please provide a detailed job description.' },
        'please_enter_valid_budget': { 'ar': 'الرجاء إدخال ميزانية صالحة (رقم موجب).', 'en': 'Please enter a valid budget (a positive number).' },
        'please_select_currency': { 'ar': 'الرجاء اختيار عملة.', 'en': 'Please select a currency.' },
        'please_select_category': { 'ar': 'الرجاء اختيار فئة.', 'en': 'Please select a category.' },
        'please_select_job_type': { 'ar': 'الرجاء اختيار نوع الوظيفة.', 'en': 'Please select a job type.' },
        'please_select_site_type': { 'ar': 'الرجاء اختيار نوع موقع العمل.', 'en': 'Please select a job site type.' },
        'please_select_deadline': { 'ar': 'الرجاء اختيار موعد نهائي للتقديم.', 'en': 'Please select an application deadline.' },
        'please_select_city_onsite_hybrid': { 'ar': 'الرجاء اختيار مدينة للوظائف في الموقع أو المختلطة.', 'en': 'Please select a city for On-site or Hybrid jobs.' },
        'no_categories_available': { 'ar': 'لا توجد فئات متاحة.', 'en': 'No categories available.' },
        'select_category_first_professions': { 'ar': 'اختر فئة أولاً لرؤية المهن.', 'en': 'Select a category first to see professions.' },
        'no_professions_found_category': { 'ar': 'لم يتم العثور على مهن في هذه الفئة.', 'en': 'No professions found in this category.' },
        'no_professions_selected': { 'ar': 'لم يتم اختيار مهن', 'en': 'No professions selected' },
        'professions_selected': { 'ar': 'مهن مختارة', 'en': 'Professions Selected' },
        'loading_message': { 'ar': 'جارٍ التحميل...', 'en': 'Loading...' },

        // External application link
        'external_apply_label': { 'ar': 'رابط التقديم الخارجي (اختياري)', 'en': 'External Application Link (Optional)' },
        'external_apply_placeholder': { 'ar': 'مثال: https://company.com/careers/apply/123', 'en': 'e.g., https://company.com/careers/apply/123' },
        'external_apply_hint': { 'ar': 'إذا تم توفيره، سيتم إعادة توجيه المتقدمين إلى هذا الرابط.', 'en': 'If provided, applicants will be redirected to this link.' },

        // Requirements builder
        'requirements_label': { 'ar': 'المتطلبات (اختياري)', 'en': 'Requirements (Optional)' },
        'no_requirements_selected': { 'ar': 'لم تتم إضافة متطلبات', 'en': 'No requirements added' },
        'add_requirement_placeholder': { 'ar': 'أضف متطلبًا، مثال: خبرة 3+ سنوات', 'en': 'Add a requirement, e.g., 3+ years experience' },
        'add_requirement_btn': { 'ar': 'إضافة', 'en': 'Add' }
        ,
        'professions_search_placeholder': { 'ar': 'ابحث في المهن...', 'en': 'Search professions...' },
        'professions_search_guidance': { 'ar': 'يمكنك إما البحث والاختيار أو تصفح حسب الفئة — كلاهما يعمل.', 'en': 'Tip: Either search and select, or browse by category — both work.' }
        ,
        'gender_label': { 'ar': 'الجنس المطلوب', 'en': 'Gender Requirement' },
        'select_gender_any': { 'ar': 'لا يهم', 'en': "Doesn't matter" },
        'male_option': { 'ar': 'ذكر', 'en': 'Male' },
        'female_option': { 'ar': 'أنثى', 'en': 'Female' },
        'age_range_label': { 'ar': 'العمر (من - إلى)', 'en': 'Age Range (from - to)' },
        'age_from_placeholder': { 'ar': 'من', 'en': 'From' },
        'age_to_placeholder': { 'ar': 'إلى', 'en': 'To' },
        'please_enter_valid_age_range': { 'ar': 'يرجى إدخال نطاق عمر صالح.', 'en': 'Please enter a valid age range.' }
        ,
        'please_provide_description_min_length': { 'ar': 'يرجى تقديم وصف لا يقل عن 10 أحرف.', 'en': 'Please provide a description of at least 10 characters.' },
        
        // Success Modal
         'job_posted_success_title': { 'ar': 'تم نشر الوظيفة بنجاح!', 'en': 'Job Posted Successfully!' },
         'job_posted_success_msg': { 'ar': 'وظيفتك الآن مباشرة. ابدأ في مشاركتها للوصول إلى أفضل المواهب.', 'en': 'Your job is now live. Start sharing it to reach the best talent.' },
         'share_job_link': { 'ar': 'مشاركة رابط الوظيفة', 'en': 'Share Job Link' },
         'link_copied': { 'ar': 'تم النسخ!', 'en': 'Link copied!' },
         'download_qr': { 'ar': 'تحميل رمز QR', 'en': 'Download QR Code' },
         'post_another_job': { 'ar': 'نشر وظيفة أخرى', 'en': 'Post Another Job' },
         'go_to_dashboard': { 'ar': 'الذهاب إلى لوحة التحكم', 'en': 'Go to Dashboard' }
    });
} else {
    console.error("window.addTranslations is not defined. Ensure language.js is loaded correctly before post-job-translations.js.");
}
