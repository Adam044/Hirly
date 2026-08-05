// public/language/index-page-translations.js
// These are translations specific to the index.html page.
// They will be added to the main translations object in language.js
// by calling window.addTranslations().

// Check if window.addTranslations function is available before attempting to use it.
if (typeof window.addTranslations === 'function') {
    window.addTranslations({
        // Hero Toggle Texts
        'hero_toggle_hire_btn': {
            'ar': 'أريد توظيف',
            'en': 'I want to hire'
        },
        'hero_toggle_work_btn': {
            'ar': 'أريد العمل',
            'en': 'I want to work'
        },
        'hero_toggle_hire_title': { 
            'ar': 'وظّف أفضل المهنيين<br><span class="hero-accent">بثقة وسهولة</span>',
            'en': 'Hire Top Professionals<br><span class="hero-accent">with Confidence</span>'
        },
        'hero_toggle_hire_subtitle': {
            'ar': 'آلاف المحترفين في فلسطين جاهزون لمساعدتك اليوم — من مطورين ومصممين إلى محاسبين ومستشارين.',
            'en': 'Thousands of professionals in Palestine are ready to help you today — from developers and designers to accountants and consultants.'
        },
        'hero_toggle_hire_placeholder': {
            'ar': 'ابحث عن مطور، مصمم، محاسب...',
            'en': 'Search for developer, designer, accountant...'
        },
        'hero_toggle_work_title': {
            'ar': 'ابحث عن عمل<br><span class="hero-accent">وابنِ مسيرتك المهنية</span>',
            'en': 'Find Your Job<br><span class="hero-accent">Build Your Career</span>'
        },
        'hero_toggle_work_subtitle': {
            'ar': 'مئات الفرص الوظيفية تنتظرك — اعرض مهاراتك، قدّم على وظائف، وابدأ مسيرتك المهنية اليوم.',
            'en': 'Hundreds of opportunities await you — showcase your skills, apply for jobs, and start your career today.'
        },
        'hero_toggle_work_placeholder': {
            'ar': 'ابحث عن وظيفة، مجال، أو شركة...',
            'en': 'Search for a job, field, or company...'
        },
        // Removed 'homepage_title' from here to avoid overwriting the global definition in language.js
        'hero_main_title': { 'ar': 'فرصتك القادمة، على بعد كبسة واحدة.', 'en': 'One Professional Home for People and Opportunities.' },
        'hero_main_subtitle': { 'ar': 'من الباحثين عن عمل والمستقلين إلى الشركات، يجمع هايرلي الجميع في نظام مهني موحّد حيث تُبنى هويتك المهنية مرة واحدة وتُستخدم في كل فرصة، من الوظائف إلى تقديم الخدمات، بينما تحصل الشركات على ملفات موحدة وواضحة.', 'en': 'From job seekers and freelancers to companies, Hirly brings everyone into one professional system: you build your profile once and reuse it for jobs, services, and your public career, while employers receive structured, comparable profiles instead of scattered CVs.' },
        'start_now': { 'ar': 'ابدأ الآن', 'en': 'Start Now' },
        'how_it_works': { 'ar': 'كيف يعمل؟', 'en': 'How it works?' },
        'what_is_hirly_title': { 'ar': 'ما هو هايرلي؟', 'en': 'What is Hirly?' },
        'opening_question': { 'ar': 'هايرلي: مجتمع العمل والفرص في فلسطين', 'en': 'Hirly: Your Gateway to Opportunities in Palestine' },
        'what_is_hirly_desc': {
            'ar': 'هايرلي منصة فلسطينية تجمع بين المبدعين وأصحاب الأعمال في سوق عمل متكامل. سواء كنت تبحث عن خبير محترف أو ترغب في تطوير مسيرتك المهنية، نوفر لك وصولاً مباشراً لأكثر من 150 تخصصاً مهنياً وتقنياً. في هايرلي، نحن نبسط عملية التوظيف ونفتح آفاقاً جديدة للنمو.',
            'en': 'Hirly is a professional ecosystem that connects job seekers, freelancers, professionals, and companies in one unified system. It acts as your professional identity layer: one public profile you can use to apply to jobs, offer services, and share your career, while employers receive structured, comparable profiles instead of scattered CVs. On top of this, Hirly Pilot — our optional AI engine — helps employers review and prioritize candidates faster.'
        },
        'feature_1_title': { 'ar': 'انطلاقة مهنية ذكية', 'en': 'Smart Career Launch' },
        'feature_2_title': { 'ar': 'شفافية ومصداقية', 'en': 'Transparency & Trust' },
        'feature_3_title': { 'ar': 'أمان وتقنية متطورة', 'en': 'Secure & Advanced Tech' },
        'create_freelancer_profile_benefit': { 'ar': 'أنشئ ملفك الاحترافي في دقائق، ودع مهاراتك تتحدث عنك أمام نخبة الشركات والباحثين عن التميز.', 'en': 'Create one professional page in minutes and use it everywhere — for job applications, freelance services, and as your public career link.' },
        'browse_company_profiles_benefit': { 'ar': 'استكشف فرص العمل بشفافية مطلقة؛ راجع تقييمات الشركات الحقيقية واتخذ قراراتك المهنية بثقة.', 'en': 'Explore opportunities in a standardized format, review real company profiles, and make decisions based on clear, comparable information.' },
        'unprecedented_features_benefit': { 'ar': 'استخدم أدواتنا الذكية المصممة لضمان رحلة عمل حر سلسة، عادلة، ومحمية بالكامل بأحدث التقنيات.', 'en': 'Use our smart tools and Hirly Pilot, the AI engine for employers, to keep hiring fair, efficient, and insight‑driven.' },
        'hirly_new_beginning_desc': { 'ar': 'هايرلي ليس مجرد منصة... هو بداية جديدة لفرص العمل في فلسطين. انضم الآن وكن جزءًا من التغيير. مستقبلك المهني يبدأ هنا!', 'en': 'Hirly is not just a platform... it\'s a new beginning for job opportunities in Palestine. Join now and be part of the change. Your professional future starts here!' },
        'find_your_perfect_match': { 'ar': 'اكتشف الفرص', 'en': 'Discover Opportunities' },
        'build_your_career': { 'ar': 'ابنِ مسيرتك المهنية', 'en': 'Build Your Career' },
        'view_all_opportunities': { 'ar': 'عرض جميع الفرص', 'en': 'View All Opportunities' },
        'development_it': { 'ar': 'تطوير وتكنولوجيا المعلومات', 'en': 'Development & IT' },
        'dev_it_desc': { 'ar': 'هندسة البرمجيات، تطوير الويب، تطبيقات الجوال، حلول السحابة', 'en': 'Software Engineering, Web Development, Mobile Apps, Cloud Solutions' },
        'most_in_demand': { 'ar': 'الأكثر طلباً', 'en': 'Most In-Demand' },
        'design_creative': { 'ar': 'تصميم وإبداع', 'en': 'Design & Creative' },
        'design_creative_desc': { 'ar': 'واجهة المستخدم/تجربة المستخدم، رسومات، علامات تجارية', 'en': 'UI/UX, Graphics, Branding' },
        'marketing_sales': { 'ar': 'تسويق ومبيعات', 'en': 'Marketing & Sales' },
        'marketing_sales_desc': { 'ar': 'تسويق رقمي، نمو', 'en': 'Digital Marketing, Growth' },
        'writing_translation': { 'ar': 'كتابة وترجمة', 'en': 'Writing & Translation' },
        'writing_translation_desc': { 'ar': 'محتوى، توطين', 'en': 'Content, Localization' },
        'finance_accounting': { 'ar': 'مالية ومحاسبة', 'en': 'Finance & Accounting' },
        'finance_accounting_desc': { 'ar': 'مسك الدفاتر، تخطيط', 'en': 'Bookkeeping, Planning' },
        'immediate_solutions': { 'ar': 'حلول فورية', 'en': 'Immediate Solutions' },
        'view_all_services': { 'ar': 'عرض جميع الخدمات', 'en': 'View All Services' },
        'garden_care': { 'ar': 'العناية بالحدائق', 'en': 'Garden Care' },
        'garden_care_desc': { 'ar': 'تنسيق حدائق احترافي، صيانة حدائق، العناية بالنباتات، وخدمات موسمية', 'en': 'Professional landscaping, garden maintenance, plant care, and seasonal services' },
        'most_popular': { 'ar': 'الأكثر شعبية', 'en': 'Most Popular' },
        'plumbing': { 'ar': 'سباكة', 'en': 'Plumbing' },
        'plumbing_desc': { 'ar': 'طوارئ وتركيبات', 'en': 'Emergencies & Installations' },
        'electrical': { 'ar': 'كهرباء', 'en': 'Electrical' },
        'electrical_desc': { 'ar': 'إصلاحات وتمديدات', 'en': 'Repairs & Wiring' },
        'cleaning': { 'ar': 'تنظيف', 'en': 'Cleaning' },
        'cleaning_desc': { 'ar': 'منازل ومكاتب', 'en': 'Homes & Offices' },
        'tutoring': { 'ar': 'تدريس', 'en': 'Tutoring' },
        'tutoring_desc': { 'ar': 'أكاديمي ومهارات', 'en': 'Academic & Skills' },
        'featured_professionals_label': { 'ar': 'مهنيون مميزون', 'en': 'Featured Professionals' },
        'find_your_next_pro': { 'ar': 'ابحث عن محترفك القادم', 'en': 'Find Your Next Pro' },
        'view_all_professionals': { 'ar': 'عرض جميع المهنيين', 'en': 'View All Professionals' },
        'no_featured_professionals': { 'ar': 'لا يوجد مهنيون مميزون حالياً.', 'en': 'No featured professionals currently.' },
        // Featured Jobs
        'featured_jobs_label': { 'ar': 'وظائف مميزة', 'en': 'Featured Jobs' },
        'explore_top_jobs': { 'ar': 'استكشف أفضل فرص العمل.', 'en': 'Explore top job opportunities.' },
        'no_featured_jobs_label': { 'ar': 'لا توجد وظائف مميزة حالياً.', 'en': 'No featured jobs currently.' },
        'view_all_jobs': { 'ar': 'عرض جميع الوظائف', 'en': 'View All Jobs' },
        // New keys for Fresh Jobs Section
        'fresh_jobs_eyebrow': { 'ar': 'فرص جديدة', 'en': 'Fresh Opportunities' },
        'fresh_jobs_title': { 'ar': 'وظائف تم نشرها حديثاً', 'en': 'Recently Posted Jobs' },
        'no_jobs_title': { 'ar': 'لا توجد وظائف حالياً', 'en': 'No Jobs Available' },
        'no_jobs_desc': { 'ar': 'كن أول من ينشر وظيفة على هايرلي!', 'en': 'Be the first to post a job on Hirly!' },
        'post_job_now': { 'ar': 'انشر وظيفة الآن', 'en': 'Post a Job Now' },

        // New keys for Discover Talent Section
        'discover_talent_eyebrow': { 'ar': 'اكتشف المواهب', 'en': 'Discover Talent' },
        'discover_talent_title': { 'ar': 'محترفون متميزون', 'en': 'Featured Professionals' },
        'discover_talent_desc': { 'ar': 'مواهب مختارة بعناية — بروفايلات كاملة بتقييمات ومهارات حقيقية', 'en': 'Hand-picked talent — complete profiles with real ratings and skills' },
        'explore_all_talent': { 'ar': 'استكشف جميع المحترفين', 'en': 'Explore All Professionals' },
        'show_more_talent': { 'ar': 'عرض محترفين آخرين', 'en': 'Show More Professionals' },
        'no_talent_title': { 'ar': 'لا يوجد محترفون متاحون حالياً', 'en': 'No Professionals Available' },
        'no_talent_desc': { 'ar': 'سيتم عرض المحترفين بمجرد اكتمال بروفايلاتهم', 'en': 'Professionals will be displayed once their profiles are complete' },

        // New keys for Featured Companies
        'discover_companies_title': { 'ar': 'الشركاء المميزون', 'en': 'Featured Partners' },
        'discover_companies_subtitle': { 'ar': 'شركات وثقت بنا وتوظف أفضل المواهب.', 'en': 'Companies that trust us and hire top talent.' },
        'view_all_companies': { 'ar': 'عرض جميع الشركات', 'en': 'View All Companies' },
        'no_featured_companies': { 'ar': 'لا توجد شركات مميزة حالياً.', 'en': 'No featured companies currently.' },
        'signup_as_employer': { 'ar': 'التسجيل كصاحب عمل', 'en': 'Sign Up as an Employer' },
        'ready_to_connect': { 'ar': 'هل أنت مستعد للانطلاق؟', 'en': 'Ready to Launch Your Journey?' },
        'join_hirly_today': { 'ar': 'انضم إلى مجتمع مهني متكامل في فلسطين، حيث تلتقي المهارات بالفرص. ابدأ رحلتك اليوم!', 'en': 'Join a comprehensive professional community in Palestine, where talent meets opportunity. Start your journey today!' },
        'cta_label_pro': { 'ar': 'أريد تقديم خدماتي', 'en': 'I Want to Offer My Services' },
        'cta_label_employer': { 'ar': 'ابحث عن خبراء', 'en': 'Find Experts' },
        'i_need_work': { 'ar': 'ابدأ كمهني', 'en': 'Start as a Professional' },
        'i_need_help': { 'ar': 'ابدأ كصاحب عمل', 'en': 'Start as an Employer' },
        'employer_login_modal_title': { 'ar': 'تسجيل الدخول كصاحب عمل', 'en': 'Login as Employer' },
        'employer_login_modal_desc': { 'ar': 'يجب عليك تسجيل الدخول كصاحب عمل لعرض ملفات تعريف المهنيين.', 'en': 'You must log in as an employer to view professional profiles.' },
        'freelancer_login_modal_title': { 'ar': 'تسجيل الدخول كمهني', 'en': 'Login as Freelancer' },
        'freelancer_login_modal_desc': { 'ar': 'يجب عليك تسجيل الدخول كمهني لعرض ملفات تعريف الشركات والتقديم على الوظائف.', 'en': 'You must log in as a freelancer to view company profiles and apply for jobs.' },
        'cancel_modal_btn': { 'ar': 'إلغاء', 'en': 'Cancel' },
        'signup_modal_btn': { 'ar': 'التسجيل', 'en': 'Sign Up' },
        'login_as_employer_icon_desc': { 'ar': 'أيقونة تسجيل الدخول كصاحب عمل', 'en': 'Employer Login Icon' },
        'login_as_freelancer_icon_desc': { 'ar': 'أيقونة تسجيل الدخول كمهني', 'en': 'Freelancer Login Icon' },
        'freelancer_profile_restriction_modal_title': { 'ar': 'الوصول مقيد', 'en': 'Access Restricted' },
        'freelancer_profile_restriction_modal_desc': { 'ar': 'كمهني، لا يمكنك عرض ملفات تعريف المهنيين الآخرين. هذه الميزة متاحة لأصحاب العمل.', 'en': 'As a freelancer, you cannot view other freelancer profiles. This feature is available for employers.' },
        'login_as_employer': { 'ar': 'تسجيل الدخول كصاحب عمل', 'en': 'Login as Employer' },
        'close_modal': { 'ar': 'إغلاق', 'en': 'Close' },
        'view_company_profile': { 'ar': 'عرض ملف الشركة', 'en': 'View Company Profile' },
        'no_logo': { 'ar': 'لا يوجد شعار', 'en': 'No Logo' },
        'loading_top_companies': { 'ar': 'تحميل الشركات المميزة...', 'en': 'Loading featured companies...' },

        // WHY CHOOSE HIRLY PILLARS
        'why_hirly_title': { 'ar': 'لماذا تختار هايرلي؟', 'en': 'Why Choose Hirly?' },
        'why_hirly_subtitle': { 'ar': 'نظام موحّد يجعل بناء الهوية المهنية والتوظيف والتعاون عملية واحدة مترابطة.', 'en': 'A unified system that turns professional identity, hiring, and collaboration into one connected experience.' },

        'pillar_freelancer_title': { 'ar': 'هويتك الرقمية', 'en': 'Your Digital Identity' },
        'pillar_freelancer_desc': { 'ar': 'حوّل خبراتك إلى ملف مهني متكامل يسهل الوصول إليه عبر QR Code، وشارك مهاراتك مع الشركات بكل بساطة.', 'en': 'Turn your experience into one living professional profile you can reuse for every role, project, and opportunity.' },
        'pillar_freelancer_feat1': { 'ar': 'موقع شخصي احترافي', 'en': 'Professional Personal Site' },
        'pillar_freelancer_feat2': { 'ar': 'نظام تقييمات شفاف', 'en': 'Transparent Rating System' },

        'pillar_employer_title': { 'ar': 'توظيف ذكي وموثوق', 'en': 'Smart & Trusted Hiring' },
        'pillar_employer_desc': { 'ar': 'نقدم نظام توظيف موحّد حيث تصل جميع الطلبات بنفس الصيغة، مع إمكانية إضافة Hirly Pilot لمساعدة فريقك على الفرز والتقييم بسرعة.', 'en': 'We provide a structured hiring system where every candidate arrives in the same format, and Hirly Pilot can help your team review and prioritize faster.' },
        'pillar_employer_feat1': { 'ar': 'فلترة ذكية للمرشحين', 'en': 'Smart Candidate Filtering' },
        'pillar_employer_feat2': { 'ar': 'إدارة كاملة للتوظيف', 'en': 'Full Hiring Management' },

        'pillar_quick_title': { 'ar': 'حلول سريعة ومحلية', 'en': 'Quick & Local Solutions' },
        'pillar_quick_desc': { 'ar': 'سواء كنت بحاجة إلى خدمة محلية سريعة أو فرصة عمل جديدة، يمكنك استخدام نفس هويتك المهنية للعثور على ما تحتاجه بسرعة.', 'en': 'Whether you need a quick local service or a new role, you use the same professional identity to reach what you need faster.' },

        'ecosystem_connect_title': { 'ar': 'كيف يعمل نظام هايرلي المتكامل؟', 'en': 'How the Hirly Ecosystem Connects' },
        'ecosystem_connect_subtitle': { 'ar': 'ثلاثة أطراف، نظام واحد: المستخدمون، أصحاب العمل، وHirly Pilot يعملون معاً ضمن بنية موحّدة.', 'en': 'Three sides, one system: users, employers, and Hirly Pilot working together in a unified structure.' },
        'ecosystem_users_title': { 'ar': 'المستخدمون: هوية مهنية واحدة', 'en': 'Users: One Professional Identity' },
        'ecosystem_users_desc': { 'ar': 'يبني الباحثون عن عمل والمستقلون والمهنيون صفحة مهنية عامة واحدة تُستخدم في التقديم للوظائف، عرض الخدمات، ومشاركة الهوية المهنية مع أي جهة.', 'en': 'Job seekers, freelancers, and professionals build one public page they reuse for job applications, services, and sharing their career identity anywhere.' },
        'ecosystem_employers_title': { 'ar': 'أصحاب العمل: ملفات موحدة', 'en': 'Employers: Structured Profiles' },
        'ecosystem_employers_desc': { 'ar': 'تستقبل الشركات طلبات التوظيف بصيغة موحدة بدلاً من ملفات مبعثرة، مما يسهل المقارنة، المتابعة، واتخاذ القرار.', 'en': 'Companies receive candidates in a unified format instead of scattered CVs and emails, making comparison, tracking, and decisions much clearer.' },
        'ecosystem_pilot_title': { 'ar': 'Hirly Pilot: طبقة الذكاء', 'en': 'Hirly Pilot: The Intelligence Layer' },
        'ecosystem_pilot_desc': { 'ar': 'يضيف Hirly Pilot طبقة ذكاء اختيارية فوق النظام، يراجع الطلبات بكفاءة، ويبرز المرشحين الأهم مع الحفاظ على القرار النهائي بيد فرق التوظيف.', 'en': 'Hirly Pilot adds an optional intelligence layer on top of the system, reviewing applications efficiently and surfacing top candidates while keeping final decisions with hiring teams.' },
        'pillar_quick_feat1': { 'ar': 'بحث جغرافي دقيق', 'en': 'Precise Geo-Search' },
        'pillar_quick_feat2': { 'ar': 'تواصل مباشر وفوري', 'en': 'Direct & Instant Contact' },

        // START PAGE
        'start_page_title': { 'ar': 'هايرلي - ابدأ', 'en': 'Hirly - Get Started' },
        'start_page_header': { 'ar': 'مرحباً بك مجدداً!', 'en': 'Welcome Back!' },
        'start_page_subtitle': { 'ar': 'ماذا ترغب أن تفعل اليوم؟', 'en': 'What would you like to do today?' },
        'discover_jobs_card_title': { 'ar': 'اكتشف فرص العمل', 'en': 'Discover Jobs' },
        'discover_jobs_card_desc': { 'ar': 'تصفح أحدث الوظائف المتاحة وابحث عن فرصة أحلامك.', 'en': 'Browse the latest available jobs and find your dream opportunity.' },
        'dashboard_freelancer_card_title': { 'ar': 'لوحة التحكم الخاصة بي', 'en': 'My Dashboard' },
        'dashboard_freelancer_card_desc': { 'ar': 'قوّي ملفك الشخصي وزد من فرص قبولك للعمل.', 'en': 'Strengthen your profile and increase your chances of getting hired.' },
        'post_job_card_title': { 'ar': 'انشر وظيفة جديدة', 'en': 'Post a New Job' },
        'post_job_card_desc': { 'ar': 'ابحث عن أفضل المواهب لشركتك من خلال نشر وظيفة جديدة.', 'en': 'Find the best talent for your company by posting a new job.' },
        'discover_talent_card_title': { 'ar': 'اكتشف المهنيين', 'en': 'Discover Professionals' },
        'discover_talent_card_desc': { 'ar': 'تصفح ملفات أفضل المهنيين في فلسطين واكتشف محترفيك القادمين.', 'en': 'Browse the profiles of top professionals in Palestine and find your next expert.' },
        'dashboard_employer_card_title': { 'ar': 'لوحة التحكم الخاصة بي', 'en': 'My Dashboard' },
        'dashboard_employer_card_desc': { 'ar': 'تابع طلبات التوظيف الخاصة بك وأدر وظائفك الحالية.', 'en': 'Track your job applications and manage your current jobs.' },
        'go_to_link': { 'ar': 'انتقل', 'en': 'Go to link' },
        'featured_services_label': { 'ar': 'خدمات مميزة', 'en': 'Featured Services' },
        'view_all_services_link': { 'ar': 'عرض جميع الخدمات', 'en': 'View All Services' },
        'loading_top_services': { 'ar': 'تحميل الخدمات المميزة...', 'en': 'Loading featured services...' },
        'no_featured_services': { 'ar': 'لا توجد خدمات مميزة حالياً.', 'en': 'No featured services currently.' },
        // NEW TRANSLATIONS TO FIX THE ERRORS
        'why_hirly_title': { 'ar': 'لماذا تختار هايرلي؟', 'en': 'Why Choose Hirly?' },
        'why_hirly_subtitle': { 'ar': 'منصة واحدة، إمكانيات لا حدود لها.', 'en': 'One Platform, Endless Possibilities.' },
        'why_hirly_feature1_title': { 'ar': 'منصة موثوقة ومحلية', 'en': 'Trusted & Local Platform' },
        'why_hirly_feature1_desc': { 'ar': 'نحن نركز على بناء الثقة من خلال ضمان هوية جميع المستخدمين، مما يوفر بيئة آمنة للمهنيين وأصحاب العمل على حد سواء.', 'en': 'We focus on building trust by verifying the identity of all users, providing a secure environment for professionals and employers alike.' },
        'why_hirly_feature2_title': { 'ar': 'بحث متقدم وفعال', 'en': 'Advanced & Efficient Search' },
        'why_hirly_feature2_desc': { 'ar': 'يمكنك البحث بسهولة عن المواهب أو الوظائف باستخدام فلاتر متقدمة تضمن لك العثور على ما يناسبك تماماً، بسرعة ودقة.', 'en': 'Easily search for talent or jobs using advanced filters to ensure you find exactly what fits your needs, quickly and accurately.' },
        'why_hirly_feature3_title': { 'ar': 'إدارة المشاريع بسهولة', 'en': 'Easy Project Management' },
        'why_hirly_feature3_desc': { 'ar': 'تتيح لك أدواتنا المدمجة التواصل والتعاون وتتبع المشاريع بسلاسة، مما يضمن سير العمل بكفاءة عالية من البداية إلى النهاية.', 'en': 'Our built-in tools allow you to communicate, collaborate, and track projects seamlessly, ensuring an efficient workflow from start to finish.' },

        // === REDESIGNED HOMEPAGE (2026) ===
        // Hero toggle
        'toggle_hire': { 'ar': 'أريد توظيف', 'en': 'I Want to Hire' },
        'toggle_work': { 'ar': 'أريد العمل', 'en': 'I Want to Work' },
        'hero_hire_title': { 'ar': 'وظّف أفضل المواهب<br><span class="hero-accent">بثقة وسهولة</span>', 'en': 'Hire Top Professionals<br><span class="hero-accent">with Confidence</span>' },
        'hero_work_title': { 'ar': 'ابحث عن وظيفتك<br><span class="hero-accent">وابنِ مسيرتك المهنية</span>', 'en': 'Find Your Job<br><span class="hero-accent">Build Your Career</span>' },
        'hero_hire_subtitle': { 'ar': 'آلاف المحترفين في فلسطين جاهزون لمساعدتك اليوم — من مطورين ومصممين إلى محاسبين ومستشارين.', 'en': 'Thousands of professionals in Palestine ready to help you today — developers, designers, accountants, and more.' },
        'hero_work_subtitle': { 'ar': 'مئات الفرص الوظيفية تنتظرك — اعرض مهاراتك، قدّم على وظائف، وابدأ مسيرتك المهنية اليوم.', 'en': 'Hundreds of job opportunities await — showcase your skills, apply for jobs, and start your career today.' },
        'hero_hire_search_placeholder': { 'ar': 'ابحث عن مطور، مصمم، محاسب...', 'en': 'Search for a developer, designer, accountant...' },
        'hero_work_search_placeholder': { 'ar': 'ابحث عن مطور، مصمم، محاسب...', 'en': 'Search for a developer, designer, accountant...' },
        'hero_search_btn': { 'ar': 'بحث', 'en': 'Search' },
        // Hire Mode Pills (Professions)
        'pill_software_engineer': { 'ar': 'مهندس برمجيات', 'en': 'Software Engineer' },
        'pill_uiux_designer': { 'ar': 'مصمم UI/UX', 'en': 'UI/UX Designer' },
        'pill_accountant': { 'ar': 'محاسب', 'en': 'Accountant' },
        'pill_marketing_spec': { 'ar': 'أخصائي تسويق', 'en': 'Marketing Specialist' },
        'pill_project_manager': { 'ar': 'مدير مشاريع', 'en': 'Project Manager' },
        // Work Mode Pills (Categories)
        'pill_tech_dev': { 'ar': 'تكنولوجيا وتطوير', 'en': 'Tech & Development' },
        'pill_biz_finance': { 'ar': 'أعمال ومالية', 'en': 'Business & Finance' },
        'pill_creative_design': { 'ar': 'إبداع وتصميم', 'en': 'Creative & Design' },
        'pill_healthcare': { 'ar': 'رعاية صحية', 'en': 'Healthcare' },
        'pill_media_journalism': { 'ar': 'إعلام وصحافة', 'en': 'Media & Journalism' },
        // Stats
        'stat_users': { 'ar': 'مستخدم مسجل', 'en': 'Registered Users' },
        'stat_companies': { 'ar': 'شركة مسجلة', 'en': 'Companies' },
        'stat_employers': { 'ar': 'صاحب عمل', 'en': 'Employers' },
        'stat_professions': { 'ar': 'تخصص مهني', 'en': 'Professions' },
        // Trusted by
        'trusted_label': { 'ar': 'موثوق من قِبَل الشركات والمؤسسات', 'en': 'TRUSTED BY COMPANIES & ORGANIZATIONS' },
        // Segments section
        'segments_eyebrow': { 'ar': 'من يستخدم هايرلي؟', 'en': 'Who is Hirly for?' },
        'segments_title': { 'ar': 'منصة واحدة، ثلاثة عوالم', 'en': 'One Platform, Three Worlds' },
        'segments_desc': { 'ar': 'سواء كنت تبحث عن محترف، أو تدير مؤسسة، أو تبني هويتك المهنية — هايرلي صُمّمت لك.', 'en': 'Whether you are looking for a professional, running an organization, or building your career — Hirly was made for you.' },
        'seg_individuals_tag': { 'ar': 'للأفراد والفرق', 'en': 'For Individuals & Teams' },
        'seg_individuals_title': { 'ar': 'احتاج محترفاً لفريقي أو مشروعي', 'en': 'I Need a Professional for My Team or Project' },
        'seg_individuals_desc': { 'ar': 'ابحث عن مطور، مصمم، فني، أو أي متخصص تحتاجه — لمشروع سريع أو تعاون طويل الأمد، بدون تعقيدات.', 'en': 'Find a developer, designer, technician, or any specialist — for a quick project or long-term collaboration, without hassle.' },
        'seg_companies_tag': { 'ar': 'للشركات والمؤسسات', 'en': 'For Companies & Organizations' },
        'seg_companies_title': { 'ar': 'وظّف بذكاء وإدارة متكاملة', 'en': 'Hire Smart with Full Management' },
        'seg_companies_desc': { 'ar': 'أنشر وظائف، واستقبل طلبات، وأجرِ مقابلات بالذكاء الاصطناعي، وأدر كامل عملية التوظيف من لوحة تحكم واحدة.', 'en': 'Post jobs, receive applications, conduct AI-powered interviews, and manage the entire hiring process from one dashboard.' },
        'seg_professionals_tag': { 'ar': 'للمستقلين والمحترفين', 'en': 'For Freelancers & Professionals' },
        'seg_professionals_title': { 'ar': 'ابنِ هويتك المهنية الرقمية', 'en': 'Build Your Digital Professional Identity' },
        'seg_professionals_desc': { 'ar': 'أنشئ ملفك الشخصي، أضف خدماتك، اشترك بالشبكة، واحصل على رابطك ورمز QR الخاص.', 'en': 'Create your profile, add your services, join the network, and get your personal link and QR code.' },
        'seg_cta_learn_more': { 'ar': 'اكتشف المزيد', 'en': 'Learn more' },
        // Categories section
        'categories_eyebrow': { 'ar': 'تصفح حسب التخصص', 'en': 'Browse by Specialty' },
        'categories_title': { 'ar': 'ابحث في كل المجالات', 'en': 'Search Across All Fields' },
        'categories_see_all': { 'ar': 'عرض جميع التخصصات', 'en': 'View All Specialties' },
        // CTA Section
        'cta_eyebrow': { 'ar': '🚀 ابدأ الآن مجاناً', 'en': '🚀 Start for Free Today' },
        'cta_title': { 'ar': 'هايرلي — فرصتك القادمة على بُعد خطوة', 'en': 'Hirly — Your Next Opportunity is One Step Away' },
        'cta_subtitle': { 'ar': 'سواء كنت تبحث أو تُوظّف أو تبني مسيرتك — هايرلي معك في كل خطوة.', 'en': 'Whether you are searching, hiring, or building your career — Hirly is with you every step of the way.' },
        'cta_create_account': { 'ar': 'إنشاء حساب مجاني', 'en': 'Create a Free Account' },
        'cta_browse_talent': { 'ar': 'تصفح المواهب', 'en': 'Browse Talent' }
    });
} else {
    console.error("window.addTranslations is not defined. Ensure language.js is loaded correctly before index-page-translations.js.");
}
