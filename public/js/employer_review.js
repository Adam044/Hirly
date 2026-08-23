document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('jobId');

    // DOM Elements
    const htmlTag = document.getElementById('htmlTag');
    const langToggle = document.getElementById('langToggle');
    const authSection = document.getElementById('authSection');
    const emailState = document.getElementById('emailState');
    const otpState = document.getElementById('otpState');
    const reviewSection = document.getElementById('reviewSection');
    const companyEmailInput = document.getElementById('companyEmail');
    const displayEmail = document.getElementById('displayEmail');
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const reviewCandidatesBtn = document.getElementById('reviewCandidatesBtn');
    const autoEmailView = document.getElementById('autoEmailView');
    const manualEmailView = document.getElementById('manualEmailView');
    const autoDetectedEmail = document.getElementById('autoDetectedEmail');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    const backToEmailBtn = document.getElementById('backToEmailBtn');
    const otpInputs = document.querySelectorAll('.otp-input-char');
    const previewJobTitle = document.getElementById('previewJobTitle');
    const previewAppCount = document.getElementById('previewAppCount');
    const morphLangToggle = document.getElementById('morphLangToggle');
    const analyzedBadge = document.getElementById('analyzedBadge');
    const segStrong = document.getElementById('segStrong');
    const segInterview = document.getElementById('segInterview');
    const segBackup = document.getElementById('segBackup');
    const segRejected = document.getElementById('segRejected');
    const countStrong = document.getElementById('countStrong');
    const countInterview = document.getElementById('countInterview');
    const countBackup = document.getElementById('countBackup');
    const countRejected = document.getElementById('countRejected');

    // State Management
    let currentLang = localStorage.getItem('hirly_lang') || 'en';
    let employerData = null;
    let detectedEmail = urlParams.get('email') || '';

    // Tracking Helper
    const trackEvent = async (eventType, metadata = {}) => {
        const currentEmail = (companyEmailInput ? companyEmailInput.value.trim() : '') || detectedEmail || (displayEmail ? displayEmail.textContent.trim() : '');
        try {
            await fetch('/api/employer-review/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobId: parseInt(jobId),
                    email: currentEmail || 'anonymous',
                    eventType: eventType,
                    metadata: {
                        ...metadata,
                        url: window.location.href,
                        referrer: document.referrer,
                        lang: currentLang
                    }
                })
            });
        } catch (error) {
            console.error('Tracking error:', error);
        }
    };

    // Track Page Access
    if (jobId) {
        trackEvent('page_access');
    }

    // Elite Avatar Fallback System
    const getApplicantAvatar = (app, sizeClasses = "w-full h-full", textClass = "text-xl") => {
        const initials = `${(app.first_name || '').charAt(0)}${(app.last_name || '').charAt(0)}`.toUpperCase() || 'U';
        const bgColors = ['bg-indigo-50', 'bg-emerald-50', 'bg-blue-50', 'bg-violet-50', 'bg-slate-50'];
        const textColors = ['text-indigo-500', 'text-emerald-500', 'text-blue-500', 'text-violet-500', 'text-slate-500'];
        const colorIdx = (app.application_id || 0) % bgColors.length;
        
        const fallbackHtml = `<div class="${sizeClasses} flex items-center justify-center ${bgColors[colorIdx]} ${textColors[colorIdx]} font-black ${textClass}">${initials}</div>`;

        if (app.profile_picture_url) {
            // Escape double quotes for the onerror attribute to prevent breaking the HTML structure
            const escapedFallback = fallbackHtml.replace(/"/g, '&quot;').replace(/'/g, "\\'");
            return `<img src="${app.profile_picture_url}" class="${sizeClasses} object-cover transition-transform duration-500 group-hover:scale-110" onerror="this.onerror=null; this.parentElement.innerHTML='${escapedFallback}';">`;
        }
        return fallbackHtml;
    };

    let filters = {
        verdict: 'all',
        minScore: 0,
        city: 'all'
    };

    // Initialize Sidebar Strips & Auth Marquee
    async function initLogos() {
        const leftStrip = document.getElementById('leftStrip');
        const rightStrip = document.getElementById('rightStrip');
        const authMarqueeGrid = document.getElementById('authMarqueeGrid');
        
        try {
            const response = await fetch('/api/companies/featured');
            const data = await response.json();

            if (data.success && data.companies && data.companies.length > 0) {
                const companies = data.companies.filter(c => c.company_name && c.company_name.toLowerCase() !== 'hirly');
                
                // Sidebar Strips
                const renderStrip = (container) => {
                    if (!container) return;
                    container.innerHTML = companies.map(c => {
                        if (c.company_logo_path) {
                            return `<div class="company-pill"><img src="${c.company_logo_path}" alt="${c.company_name}"></div>`;
                        } else {
                            return `<div class="company-pill text-slate-300 text-xs"><i class="fas fa-building"></i></div>`;
                        }
                    }).join('');
                };

                renderStrip(leftStrip);
                renderStrip(rightStrip);

                // Auth Marquee (Split Hero View)
                if (authMarqueeGrid) {
                    // Double items for seamless loop
                    const fullSet = [...companies, ...companies];
                    authMarqueeGrid.innerHTML = fullSet.map(c => {
                        const logoHtml = c.company_logo_path 
                            ? `<img src="${c.company_logo_path}" alt="${c.company_name}" class="marquee-logo">`
                            : `<div class="marquee-logo flex items-center justify-center text-slate-200 text-2xl"><i class="fas fa-building"></i></div>`;
                        
                        return `
                            <div class="marquee-card">
                                ${logoHtml}
                                <span class="marquee-name">${c.company_name}</span>
                            </div>
                        `;
                    }).join('');
                }
            }
        } catch (error) {
            console.error('Error fetching companies for logos:', error);
        }
    }

    initLogos();

    // Translations
    const translations = {
        en: {
            auth_title: "Your candidates are ready",
            auth_desc: "We've organized and evaluated the candidates so you can quickly identify the strongest matches.",
            secure_access: "Talent Intelligence Ready",
            secure_access_desc: "Your custom evaluations and candidate rankings are prepared. Access your full report now.",
            email_placeholder: "hr@company.com",
            email_label: "Email",
            continue: "Access Report",
            review_btn: "Review Candidates",
            not_your_email: "Not your email?",
            otp_notice: "We'll send you a one-time verification code. No password required.",
            intel_ready: "Everything is Ready",
            ready_for: "Full intelligence report prepared for",
            otp_notice_subtle: "Secure one-time access • No password required",
            check_email: "Check your email",
            sent_to: "Verification code sent to",
            will_send_to: "Verification code will be sent to",
            verify: "Verify",
            no_code: "Didn't receive it?",
            resend: "Resend code",
            change_email: "Change email",
            stat_applicants: "Applicants",
            stat_elite: "Elite Match",
            stat_strong: "Strong Match",
            stat_potential: "Potential Fit",
            stat_rejected: "Rejected",
            trust_marquee_label: "Trusted by Palestinian Industry Leaders",
            value_dna: "Deep Technical DNA Analysis",
            value_ranking: "Instant AI Candidate Ranking",
            verified_access: "Verified Portal",
            pipeline_status: "Candidate Pipeline Distribution",
            value_locked: "Value Locked",
            pilot_title: "Hirly",
            pilot_desc: "Candidates have been evaluated against the requirements of this opportunity.",
            conv_title: "Everything you need to hire better",
            card1_title: "AI Candidate Matching",
            card1_desc: "Find the strongest candidates faster with our automated evaluation engine.",
            card2_title: "Professional Profiles",
            card2_desc: "Everything you need to evaluate a candidate in one place — CVs, skills, and experience.",
            card3_title: "Applicant Management",
            card3_desc: "Shortlist, manage, and communicate with your candidates directly on Hirly.",
            card4_title: "Talent Discovery",
            card4_desc: "Search for additional professionals beyond your current applicants in our talent pool.",
            claim_title: "Want to keep managing your candidates?",
            claim_desc: "Claim your free Hirly employer workspace and continue managing these candidates directly on Hirly.",
            claim_btn: "Claim My Hiring Workspace",
            candidate_details: "Candidate Profile",
            view_profile: "View Profile",
            match: "Match",
            ai_summary: "AI Summary",
            executive_summary: "Executive Summary",
            strengths: "Strengths",
            weaknesses: "Weaknesses",
            experience: "Experience",
            skills: "Skills",
            matched_skills: "Matched Skills",
            missing_skills: "Missing Skills",
            interview_questions: "Suggested Interview Questions",
            locked_notice: "Unlock professional CVs and direct contact by claiming your workspace.",
            verdict_strong: "Elite Match",
            verdict_interview: "Strong Match",
            verdict_backup: "Potential Fit",
            verdict_reject: "Rejected",
            years: "years",
            no_summary: "No AI summary available yet.",
            deep_report: "Deep Report",
            public_profile: "Public Profile",
            skill_tech: "Technical",
            skill_comm: "Comm.",
            skill_lead: "Lead.",
            skill_solve: "Problem",
            skill_exp: "Exp.",
            filter_verdict: "Verdict",
            filter_score: "Min Match",
            filter_city: "City",
            all: "All",
            all_cities: "All Cities",
            no_results: "No candidates match your current filters.",
            claim_modal_title: "Claim Your Workspace",
            claim_modal_desc: "We just need a few more details to set up your professional environment.",
            first_name_label: "First Name",
            last_name_label: "Last Name",
            phone_number_label: "Phone Number",
            company_address: "Office Address",
            country_label: "Country",
            city_label: "City",
            company_category_label: "Company Industry",
            company_description_label: "Company Bio",
            password_label: "Create Password",
            confirm_password_label: "Confirm Password",
            select_industry: "Select Industry",
            signup_success: "Workspace claimed successfully! Redirecting...",
            passwords_not_match: "Passwords do not match.",
            password_requirements: "Password must be at least 8 characters long.",
            wizard_welcome_title: "Setting up your\nworkspace",
            wizard_welcome_desc: "Your candidate evaluations are being moved to your professional dashboard.",
            back_to_review: "Back to review",
            step1_title: "The Basics",
            full_name_placeholder: "Full Name",
            work_email_placeholder: "Company Email",
            contact_number_label: "Contact Number",
            phone_placeholder: "Phone Number",
            next_step: "Next Step",
            step2_title: "Let's get to know your company",
            company_name_placeholder: "Company Name",
            office_address_label: "Office Address",
            address_placeholder: "Address",
            industry_label: "Industry",
            select_category: "Select Category",
            company_bio_label: "Company Bio",
            company_bio_placeholder: "Briefly describe your company...",
            back: "Back",
            almost_there: "Almost there",
            step3_title: "Access & Security",
            password_placeholder: "Password",
            confirm_password_placeholder: "Confirm Password",
            create_workspace_btn: "Create My Workspace",
            finalizing: "Finalizing...",
            password_req_length: "8+ chars",
            password_req_lowercase: "abc",
            password_req_uppercase: "ABC",
            password_req_number: "123",
            feature_outreach_title: "Smart Outreach",
            feature_outreach_desc: "Automated messaging that candidates actually answer.",
            feature_scheduling_title: "Unified Scheduling",
            feature_scheduling_desc: "Interviews organized and synced in one click.",
            feature_collab_title: "Team Collaboration",
            feature_collab_desc: "A centralized hub for your entire hiring team.",
            feature_dna_title: "Technical DNA",
            feature_dna_desc: "Go beyond the CV with deep AI-driven technical analysis.",
            trust_label: "Trusted by industry leaders",
            trust_link: "Success Stories",
            intel_title: "Intelligence Report",
            intel_subtitle: "Hirly has evaluated your entire talent pool",
            stat_total: "Evaluated Profiles",
            stat_top: "Elite Matches",
            feature_dna: "Technical DNA Matrices Ready",
            feature_verdict: "AI Behavioral Verdicts Generated",
            feature_ranking: "Instant Candidate Ranking Complete",
            contact_us: "Contact Us",
            quick_support: "Quick Support",
            contact_page: "Contact Page"
        },
        ar: {
            auth_title: "مرشحوك جاهزون للمراجعة",
            auth_desc: "لقد قمنا بتنظيم وتقييم المتقدمين حتى تتمكن من تحديد أفضل المطابقات بسرعة.",
            secure_access: "جاهزية بيانات التوظيف",
            secure_access_desc: "تقييماتك المخصصة وتصنيفات المرشحين جاهزة. قم بالدخول لعرض التقرير الكامل الآن.",
            email_placeholder: "hr@company.com",
            email_label: "البريد الإلكتروني",
            continue: "عرض التقرير",
            review_btn: "مراجعة المرشحين",
            not_your_email: "ليس بريدك الإلكتروني؟",
            otp_notice: "سنرسل لك رمز تحقق لمرة واحدة. لا يلزم وجود كلمة مرور.",
            intel_ready: "كل شيء جاهز",
            ready_for: "تم إعداد تقرير التوظيف الكامل لـ",
            otp_notice_subtle: "دخول آمن لمرة واحدة • لا يلزم كلمة مرور",
            check_email: "تحقق من بريدك الإلكتروني",
            sent_to: "تم إرسال رمز التحقق إلى",
            will_send_to: "سيتم إرسال رمز التحقق إلى",
            verify: "تحقق",
            no_code: "لم يصلك الرمز؟",
            resend: "إعادة إرسال الرمز",
            change_email: "تغيير البريد الإلكتروني",
            stat_applicants: "متقدمين",
            stat_elite: "مطابقة نخبوية",
            stat_strong: "مطابقة قوية",
            stat_potential: "فرصة محتملة",
            stat_rejected: "مرفوض",
            trust_marquee_label: "موثوق من قِبَل رواد الصناعة الفلسطينيين",
            value_dna: "تحليل عميق للبصمة التقنية",
            value_ranking: "تصنيف فوري للمرشحين بالذكاء الاصطناعي",
            verified_access: "بوابة موثقة",
            pipeline_status: "توزيع مسار المرشحين",
            value_locked: "المحتوى مقفل",
            pilot_title: "Hirly",
            pilot_desc: "تم تقييم المرشحين بناءً على متطلبات هذه الفرصة.",
            conv_title: "كل ما تحتاجه للتوظيف بشكل أفضل",
            card1_title: "مطابقة المرشحين بالذكاء الاصطناعي",
            card1_desc: "اعثر على أقوى المرشحين بشكل أسرع باستخدام محرك التقييم الآلي الخاص بنا.",
            card2_title: "الملفات الشخصية المهنية",
            card2_desc: "كل ما تحتاجه لتقييم المرشح في مكان واحد - السير الذاتية والمهارات والخبرة.",
            card3_title: "إدارة المتقدمين",
            card3_desc: "قم بتصفية وإدارة والتواصل مع مرشحيك مباشرة على هايرلي.",
            card4_title: "اكتشاف المواهب",
            card4_desc: "ابحث عن محترفين إضافيين يتجاوزون المتقدمين الحاليين في قاعدة بياناتنا.",
            claim_title: "هل تريد الاستمرار في إدارة مرشحيك؟",
            claim_desc: "امتلك مساحة عمل صاحب العمل المجانية من هايرلي واستمر في إدارة هؤلاء المرشحين مباشرة.",
            claim_btn: "امتلك مساحة التوظيف الخاصة بي",
            candidate_details: "ملف المرشح",
            view_profile: "عرض الملف",
            match: "مطابقة",
            ai_summary: "ملخص الذكاء الاصطناعي",
            executive_summary: "الملخص التنفيذي",
            strengths: "نقاط القوة",
            weaknesses: "نقاط الضعف",
            experience: "الخبرة",
            skills: "المهارات",
            matched_skills: "المهارات المتطابقة",
            missing_skills: "المهارات المفقودة",
            interview_questions: "أسئلة المقابلة المقترحة",
            locked_notice: "افتح السير الذاتية المهنية والتواصل المباشر من خلال امتلاك مساحة عملك.",
            verdict_strong: "مطابقة نخبوية",
            verdict_interview: "مطابقة قوية",
            verdict_backup: "فرصة محتملة",
            verdict_reject: "مرفوض",
            years: "سنوات",
            no_summary: "لا يوجد ملخص ذكاء اصطناعي متاح حالياً.",
            deep_report: "تقرير عميق",
            public_profile: "الملف العام",
            skill_tech: "تقني",
            skill_comm: "تواصل",
            skill_lead: "قيادة",
            skill_solve: "حل مشكلات",
            skill_exp: "خبرة",
            filter_verdict: "القرار",
            filter_score: "أدنى تطابق",
            filter_city: "المدينة",
            all: "الكل",
            all_cities: "جميع المدن",
            no_results: "لا يوجد مرشحون يطابقون الفلاتر الحالية.",
            claim_modal_title: "امتلك مساحة عملك",
            claim_modal_desc: "نحتاج فقط إلى بعض التفاصيل الإضافية لإعداد بيئتك المهنية.",
            first_name_label: "الاسم الأول",
            last_name_label: "اسم العائلة",
            phone_number_label: "رقم الهاتف",
            company_address: "عنوان المكتب",
            country_label: "الدولة",
            city_label: "المدينة",
            company_category_label: "مجال الشركة",
            company_description_label: "وصف الشركة",
            password_label: "إنشاء كلمة مرور",
            confirm_password_label: "تأكيد كلمة المرور",
            select_industry: "اختر المجال",
            signup_success: "تم امتلاك مساحة العمل بنجاح! جاري التحويل...",
            passwords_not_match: "كلمات المرور غير متطابقة.",
            password_requirements: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.",
            wizard_welcome_title: "إعداد مساحة\nالعمل الخاصة بك",
            wizard_welcome_desc: "يتم نقل تقييمات المرشحين الخاصة بك إلى لوحة التحكم الاحترافية الخاصة بك.",
            back_to_review: "العودة للمراجعة",
            step1_title: "الأساسيات",
            feature_outreach_title: "تواصل ذكي",
            feature_outreach_desc: "رسائل مؤتمتة يرد عليها المرشحون بالفعل.",
            feature_scheduling_title: "جدولة موحدة",
            feature_scheduling_desc: "تنظيم المقابلات ومزامنتها بنقرة واحدة.",
            feature_collab_title: "تعاون الفريق",
            feature_collab_desc: "مركز مركزي لفريق التوظيف الخاص بك بالكامل.",
            feature_dna_title: "البصمة التقنية",
            feature_dna_desc: "تجاوز السيرة الذاتية مع تحليل تقني عميق مدعوم بالذكاء الاصطناعي.",
            trust_label: "موثوق به من قبل قادة الصناعة",
            trust_link: "قصص النجاح",
            full_name_placeholder: "الاسم الكامل",
            work_email_placeholder: "البريد الإلكتروني للشركة",
            contact_number_label: "رقم التواصل",
            phone_placeholder: "رقم الهاتف",
            next_step: "الخطوة التالية",
            step2_title: "دعنا نتعرف على شركتك",
            company_name_placeholder: "اسم الشركة",
            office_address_label: "عنوان المكتب",
            address_placeholder: "العنوان",
            industry_label: "المجال",
            select_category: "اختر التصنيف",
            company_bio_label: "نبذة عن الشركة",
            password_req_length: "8+ أحرف",
            password_req_lowercase: "أحرف صغيرة",
            password_req_uppercase: "أحرف كبيرة",
            password_req_number: "أرقام",
            company_bio_placeholder: "صف شركتك باختصار...",
            back: "رجوع",
            almost_there: "أوشكنا على الانتهاء",
            step3_title: "الوصول والأمان",
            password_placeholder: "كلمة المرور",
            confirm_password_placeholder: "تأكيد كلمة المرور",
            create_workspace_btn: "أنشئ مساحة العمل الخاصة بي",
            finalizing: "جاري الإنهاء...",
            intel_title: "تقرير الذكاء الاصطناعي",
            intel_subtitle: "قام هايرلي بتقييم كامل قاعدة بيانات المتقدمين لديك",
            stat_total: "ملفات تم تقييمها",
            stat_top: "مطابقات نخبوية",
            feature_dna: "مصفوفات البصمة التقنية جاهزة",
            feature_verdict: "تم إنشاء أحكام السلوك الآلية",
            feature_ranking: "اكتمل التصنيف الفوري للمرشحين",
            contact_us: "اتصل بنا",
            quick_support: "الدعم السريع",
            contact_page: "صفحة التواصل"
        }
    };

    // DOM Elements (Already declared at the top)

    // Review Elements
    const reviewJobTitle = document.getElementById('reviewJobTitle');
    const reviewCompanyName = document.getElementById('reviewCompanyName');
    const statTotal = document.getElementById('statTotal');
    const statHigh = document.getElementById('statHigh');
    const statStrong = document.getElementById('statStrong');
    const statOther = document.getElementById('statOther');
    const candidatesList = document.getElementById('candidatesList');
    const claimWorkspaceBtn = document.getElementById('claimWorkspaceBtn');

    // Modal Elements
    const candidateModal = document.getElementById('candidateModal');
    const modalContent = document.getElementById('modalContent');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalOverlay = document.getElementById('modalOverlay');

    if (!jobId) {
        window.location.href = '/';
        return;
    }

    // Initial State Check
    if (detectedEmail && autoEmailView && manualEmailView && autoDetectedEmail) {
        manualEmailView.classList.add('hidden');
        autoEmailView.classList.remove('hidden');
        // Initial fallback to email if company name not yet fetched
        autoDetectedEmail.textContent = detectedEmail;
        companyEmailInput.value = detectedEmail;
    }

    // --- Language Logic ---
    function updateLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('hirly_lang', lang);
        htmlTag.setAttribute('lang', lang);
        htmlTag.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
        
        const langText = lang === 'en' ? 'العربية' : 'English';
        if (langToggle) langToggle.textContent = langText;
        if (morphLangToggle) morphLangToggle.textContent = langText;

        // Update all data-t elements
        document.querySelectorAll('[data-t]').forEach(el => {
            const key = el.getAttribute('data-t');
            if (translations[lang][key]) {
                el.textContent = translations[lang][key];
            }
        });

        // Update placeholders
        const inputs = [
            { id: 'wizardCompanyName', key: 'company_name_placeholder' },
            { id: 'wizardEmail', key: 'work_email_placeholder' },
            { id: 'wizardPhone', key: 'phone_placeholder' },
            { id: 'wizardAddress', key: 'address_placeholder' },
            { id: 'wizardBio', key: 'company_bio_placeholder' },
            { id: 'wizardPassword', key: 'password_placeholder' },
            { id: 'wizardConfirmPassword', key: 'confirm_password_placeholder' }
        ];

        inputs.forEach(input => {
            const el = document.getElementById(input.id);
            if (el) el.placeholder = translations[lang][input.key];
            
            // Also update the label if it exists
            const label = el.previousElementSibling;
            if (label && label.classList.contains('wizard-label')) {
                label.textContent = translations[lang][input.key];
            }
        });

        if (companyEmailInput) {
            companyEmailInput.placeholder = translations[lang].email_placeholder;
        }

        // Update Wizard Category Display if not selected
        if (!selectedWizardCategory && wizardCategoryDisplay) {
            wizardCategoryDisplay.textContent = translations[lang].select_category;
        }

        if (previewAppCount && previewAppCount.textContent.includes(' ')) {
            const count = previewAppCount.textContent.split(' ')[0];
            previewAppCount.textContent = `${count} ${translations[lang].stat_applicants.toLowerCase()} ${lang === 'en' ? 'applied through Hirly' : 'تقدّموا عبر هايرلي'}`;
        }

        // Re-render candidates if data exists
        if (employerData) {
            populateCityFilter(employerData.applicants);
            applyFilters();
        }
    }

    // (Already declared at the top)

    langToggle.addEventListener('click', () => {
        updateLanguage(currentLang === 'en' ? 'ar' : 'en');
    });

    if (morphLangToggle) {
        morphLangToggle.addEventListener('click', () => {
            updateLanguage(currentLang === 'en' ? 'ar' : 'en');
        });
    }

    // --- Initial Job Preview ---
    async function fetchJobPreview() {
        try {
            const resp = await fetch(`/api/employer-review/data/${jobId}/public`);
            const data = await resp.json();
            if (resp.ok) {
                previewJobTitle.textContent = data.title;
                if (autoDetectedEmail) {
                    autoDetectedEmail.textContent = data.company_name || (currentLang === 'en' ? 'Your Company' : 'شركتك');
                }
                const totalCount = data.count || 0;
                previewAppCount.textContent = `${totalCount} ${translations[currentLang].stat_applicants.toLowerCase()} ${currentLang === 'en' ? 'applied through Hirly' : 'تقدّموا عبر هايرلي'}`;
                
                // 1. Update Pipeline Diagram with Actual Status Mapping
                const p = data.pipeline || { strong: 0, interview: 0, backup: 0, reject: 0 };
                const analyzedCount = data.analyzedCount || 0;
                
                // Update Analyzed Badge
                if (analyzedBadge) {
                    analyzedBadge.textContent = `${analyzedCount}/${totalCount} analyzed`;
                }

                const counts = {
                    strong: parseInt(p.strong) || 0,
                    interview: parseInt(p.interview) || 0,
                    backup: parseInt(p.backup) || 0,
                    reject: parseInt(p.reject) || 0
                };

                const totalAnalyzed = counts.strong + counts.interview + counts.backup + counts.reject;
                const divisor = totalAnalyzed || 1;
                
                // Update Bar
                if (segStrong) segStrong.style.width = `${(counts.strong / divisor) * 100}%`;
                if (segInterview) segInterview.style.width = `${(counts.interview / divisor) * 100}%`;
                if (segBackup) segBackup.style.width = `${(counts.backup / divisor) * 100}%`;
                if (segRejected) segRejected.style.width = `${(counts.reject / divisor) * 100}%`;

                // Update Legend Counts
                if (countStrong) countStrong.textContent = counts.strong;
                if (countInterview) countInterview.textContent = counts.interview;
                if (countBackup) countBackup.textContent = counts.backup;
                if (countRejected) countRejected.textContent = counts.reject;

                // Always show all filter chips for transparency
                const strongChip = document.querySelector('.verdict-chip[data-verdict="Strong Hire"]');
                if (strongChip) strongChip.style.display = 'block';
                
                const interviewChip = document.querySelector('.verdict-chip[data-verdict="Interview"]');
                if (interviewChip) interviewChip.style.display = 'block';

                const backupChip = document.querySelector('.verdict-chip[data-verdict="Backup"]');
                if (backupChip) backupChip.style.display = 'block';

                const rejectChip = document.querySelector('.verdict-chip[data-verdict="Reject"]');
                if (rejectChip) rejectChip.style.display = 'block';

                // 2. Update Intelligence Report with Dynamic Matching Logic
                const totalCountEl = document.getElementById('intelTotalApps');
                const topMatchesCountEl = document.getElementById('intelTopMatches');
                const topMatchesLabelEl = document.querySelector('[data-t="stat_top"]');

                if (totalCountEl) totalCountEl.textContent = totalCount;
                
                if (topMatchesCountEl && topMatchesLabelEl) {
                    if (counts.strong > 0) {
                        topMatchesCountEl.textContent = counts.strong;
                        topMatchesLabelEl.textContent = translations[currentLang].stat_elite;
                        topMatchesCountEl.classList.add('text-secondary');
                        topMatchesCountEl.classList.remove('text-primary');
                    } else if (counts.interview > 0) {
                        topMatchesCountEl.textContent = counts.interview;
                        topMatchesLabelEl.textContent = translations[currentLang].stat_strong;
                        topMatchesCountEl.classList.add('text-primary');
                        topMatchesCountEl.classList.remove('text-secondary');
                    } else {
                        topMatchesCountEl.textContent = totalAnalyzed;
                        topMatchesLabelEl.textContent = translations[currentLang].stat_total;
                        topMatchesCountEl.classList.remove('text-secondary', 'text-primary');
                    }
                }
            }
        } catch (e) {
            console.error('Job preview error:', e);
        }
    }

    // Filter Elements
    const verdictChips = document.querySelectorAll('.verdict-chip');
    const scoreFilter = document.getElementById('scoreFilter');
    const scoreValue = document.getElementById('scoreValue');
    const cityFilter = document.getElementById('cityFilter');

    // Workspace Morph Elements
    const morphOverlay = document.getElementById('workspaceMorphOverlay');
    const cancelMorphBtn = document.getElementById('cancelMorphBtn');
    const wizardForm = document.getElementById('wizardForm');
    const wizardCountrySelect = document.getElementById('wizardCountry');
    const wizardCategoryBtn = document.getElementById('wizardCategoryBtn');
    const wizardCategoryMenu = document.getElementById('wizardCategoryMenu');
    const wizardCategoryDisplay = document.getElementById('wizardCategoryDisplay');
    const wizardSteps = document.querySelectorAll('.setup-step');
    const stepDots = document.querySelectorAll('.step-dot');
    let currentStep = 1;
    let selectedWizardCategory = null;

    function applyFilters() {
        if (!employerData) return;

        const filtered = employerData.applicants.filter(app => {
            const matchVerdict = filters.verdict === 'all' || app.verdict === filters.verdict;
            const matchScore = (app.match_score || 0) >= filters.minScore;
            
            // For city, we need to handle translations or raw values
            const appCity = (app.city || '').toLowerCase();
            const matchCity = filters.city === 'all' || appCity === filters.city.toLowerCase();

            return matchVerdict && matchScore && matchCity;
        });

        renderCandidates(filtered);
    }

    verdictChips.forEach(chip => {
        chip.addEventListener('click', () => {
            verdictChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            filters.verdict = chip.getAttribute('data-verdict');
            applyFilters();
        });
    });

    if (scoreFilter) {
        scoreFilter.addEventListener('input', (e) => {
            const val = e.target.value;
            filters.minScore = parseInt(val);
            scoreValue.textContent = `${val}%`;
            applyFilters();
        });
    }

    if (cityFilter) {
        cityFilter.addEventListener('change', (e) => {
            filters.city = e.target.value;
            applyFilters();
        });
    }

    function populateCityFilter(applicants) {
        if (!cityFilter) return;
        
        const currentSelected = cityFilter.value;
        const cities = [...new Set(applicants.map(a => a.city).filter(Boolean))].sort();
        const lang = currentLang || 'en';
        const cityData = window.palestinianCitiesTranslations || {};

        // Keep the "All Cities" option
        cityFilter.innerHTML = `<option value="all">${translations[lang].all_cities}</option>`;
        
        cities.forEach(city => {
            const key = Object.keys(cityData).find(k => 
                k.startsWith('city_') && (cityData[k].en === city || k === city || k === 'city_' + city.toLowerCase().replace(/\s+/g, '_'))
            );
            const label = key ? (cityData[key][lang] || cityData[key].en) : city;
            
            const option = document.createElement('option');
            option.value = city;
            option.textContent = label;
            if (city === currentSelected) option.selected = true;
            cityFilter.appendChild(option);
        });
    }

    // --- Workspace Morph & Wizard Logic ---
    function openWorkspaceMorph() {
        if (!employerData) return;
        
        // Update Side Preview with real data
        const appCount = employerData.applicants?.length || 0;
        const topMatches = employerData.applicants?.filter(a => a.verdict === 'Strong Hire' || a.verdict === 'Interview').length || 0;
        
        const morphPreviewAppCount = document.getElementById('morphPreviewAppCount');
        const morphPreviewMatchCount = document.getElementById('morphPreviewMatchCount');
        const morphWelcomeDesc = document.getElementById('morphWelcomeDesc');

        if (morphPreviewAppCount) morphPreviewAppCount.textContent = appCount;
        if (morphPreviewMatchCount) morphPreviewMatchCount.textContent = topMatches;
        if (morphWelcomeDesc) {
            morphWelcomeDesc.textContent = currentLang === 'en' 
                ? `Your ${appCount} candidate evaluations are being moved to your professional dashboard.`
                : `يتم نقل ${appCount} من تقييمات المرشحين إلى لوحة التحكم الاحترافية الخاصة بك.`;
        }

        // Pre-fill Step 1: The Basics
        // Ensure we get the email from the most reliable source
        let email = employerData.email || '';
        if (!email || email === '...') {
            if (detectedEmail && detectedEmail !== '...') email = detectedEmail;
        }
        if (!email || email === '...') {
            const manualEmail = companyEmailInput ? companyEmailInput.value.trim() : '';
            if (manualEmail) email = manualEmail;
        }
        if (!email || email === '...') {
            email = localStorage.getItem('employer_review_email') || '';
        }
        
        const wizardEmailInput = document.getElementById('wizardEmail');
        const wizardCompanyNameInput = document.getElementById('wizardCompanyName');

        if (wizardEmailInput) {
            wizardEmailInput.value = email;
            wizardEmailInput.readOnly = false;
        }
        if (wizardCompanyNameInput) {
            wizardCompanyNameInput.value = employerData.job?.company_name || employerData.job?.external_company_name || '';
            wizardCompanyNameInput.readOnly = false;
        }
        
        // Pre-fill Step 2: Details
        const wizardBioInput = document.getElementById('wizardBio');
        const wizardAddressInput = document.getElementById('wizardAddress');

        if (wizardBioInput) wizardBioInput.value = ''; // Bio is NOT pre-filled as requested.
        if (wizardAddressInput) wizardAddressInput.value = employerData.job?.address || '';

        // Initialize
        initWizardCountryCodes();
        initWizardLocations();
        initWizardCategories();
        goToStep(1);

        morphOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeWorkspaceMorph() {
        morphOverlay.style.display = 'none';
        document.body.style.overflow = '';
    }

    function goToStep(stepNumber) {
        currentStep = stepNumber;
        
        // Update Steps
        wizardSteps.forEach((step, idx) => {
            step.classList.remove('active', 'past');
            if (idx + 1 < stepNumber) step.classList.add('past');
            if (idx + 1 === stepNumber) step.classList.add('active');
        });

        // Update Dots
        stepDots.forEach((dot, idx) => {
            dot.classList.remove('active', 'completed');
            if (idx + 1 < stepNumber) dot.classList.add('completed');
            if (idx + 1 === stepNumber) dot.classList.add('active');
        });

        // Update Header Titles
        const titleEl = document.getElementById('morphSectionTitle');
        const headerTitleEl = document.getElementById('morphHeaderSectionTitle');
        const stepKey = `step${stepNumber}_title`;
        
        if (titleEl) {
            titleEl.textContent = translations[currentLang][stepKey];
            titleEl.setAttribute('data-t', stepKey);
        }
        if (headerTitleEl) {
            headerTitleEl.textContent = translations[currentLang][stepKey];
            headerTitleEl.setAttribute('data-t', stepKey);
        }

        // Scroll to top of form
        const scrollArea = document.querySelector('.morph-scroll-area');
        if (scrollArea) scrollArea.scrollTop = 0;
    }

    function initWizardCountryCodes() {
        const select = document.getElementById('wizardCountryCode');
        if (!select) return;

        // Use the same global list used in signup.js
        const countryCodes = [
            { name: "Palestine", code: "+970" },
            { name: "Afghanistan", code: "+93" },
            { name: "Albania", code: "+355" },
            { name: "Algeria", code: "+213" },
            { name: "Andorra", code: "+376" },
            { name: "Angola", code: "+244" },
            { name: "Argentina", code: "+54" },
            { name: "Armenia", code: "+374" },
            { name: "Australia", code: "+61" },
            { name: "Austria", code: "+43" },
            { name: "Azerbaijan", code: "+994" },
            { name: "Bahrain", code: "+973" },
            { name: "Bangladesh", code: "+880" },
            { name: "Belarus", code: "+375" },
            { name: "Belgium", code: "+32" },
            { name: "Bolivia", code: "+591" },
            { name: "Bosnia and Herzegovina", code: "+387" },
            { name: "Brazil", code: "+55" },
            { name: "Bulgaria", code: "+359" },
            { name: "Cambodia", code: "+855" },
            { name: "Cameroon", code: "+237" },
            { name: "Canada", code: "+1" },
            { name: "Chile", code: "+56" },
            { name: "China", code: "+86" },
            { name: "Colombia", code: "+57" },
            { name: "Costa Rica", code: "+506" },
            { name: "Croatia", code: "+385" },
            { name: "Cuba", code: "+53" },
            { name: "Cyprus", code: "+357" },
            { name: "Czech Republic", code: "+420" },
            { name: "Denmark", code: "+45" },
            { name: "Dominican Republic", code: "+1" },
            { name: "Ecuador", code: "+593" },
            { name: "Egypt", code: "+20" },
            { name: "El Salvador", code: "+503" },
            { name: "Estonia", code: "+372" },
            { name: "Ethiopia", code: "+251" },
            { name: "Finland", code: "+358" },
            { name: "France", code: "+33" },
            { name: "Georgia", code: "+995" },
            { name: "Germany", code: "+49" },
            { name: "Ghana", code: "+233" },
            { name: "Greece", code: "+30" },
            { name: "Guatemala", code: "+502" },
            { name: "Honduras", code: "+504" },
            { name: "Hong Kong", code: "+852" },
            { name: "Hungary", code: "+36" },
            { name: "Iceland", code: "+354" },
            { name: "India", code: "+91" },
            { name: "Indonesia", code: "+62" },
            { name: "Iran", code: "+98" },
            { name: "Iraq", code: "+964" },
            { name: "Ireland", code: "+353" },
            { name: "Israel", code: "+972" },
            { name: "Italy", code: "+39" },
            { name: "Jamaica", code: "+1" },
            { name: "Japan", code: "+81" },
            { name: "Jordan", code: "+962" },
            { name: "Kazakhstan", code: "+7" },
            { name: "Kenya", code: "+254" },
            { name: "Kuwait", code: "+965" },
            { name: "Laos", code: "+856" },
            { name: "Latvia", code: "+371" },
            { name: "Lebanon", code: "+961" },
            { name: "Libya", code: "+218" },
            { name: "Liechtenstein", code: "+423" },
            { name: "Lithuania", code: "+370" },
            { name: "Luxembourg", code: "+352" },
            { name: "Macau", code: "+853" },
            { name: "Macedonia", code: "+389" },
            { name: "Malaysia", code: "+60" },
            { name: "Malta", code: "+356" },
            { name: "Mexico", code: "+52" },
            { name: "Moldova", code: "+373" },
            { name: "Monaco", code: "+377" },
            { name: "Mongolia", code: "+976" },
            { name: "Montenegro", code: "+382" },
            { name: "Morocco", code: "+212" },
            { name: "Myanmar", code: "+95" },
            { name: "Nepal", code: "+977" },
            { name: "Netherlands", code: "+31" },
            { name: "New Zealand", code: "+64" },
            { name: "Nicaragua", code: "+505" },
            { name: "Nigeria", code: "+234" },
            { name: "North Korea", code: "+850" },
            { name: "Norway", code: "+47" },
            { name: "Oman", code: "+968" },
            { name: "Pakistan", code: "+92" },
            { name: "Panama", code: "+507" },
            { name: "Paraguay", code: "+595" },
            { name: "Peru", code: "+51" },
            { name: "Philippines", code: "+63" },
            { name: "Poland", code: "+48" },
            { name: "Portugal", code: "+351" },
            { name: "Puerto Rico", code: "+1" },
            { name: "Qatar", code: "+974" },
            { name: "Romania", code: "+40" },
            { name: "Russia", code: "+7" },
            { name: "San Marino", code: "+378" },
            { name: "Saudi Arabia", code: "+966" },
            { name: "Serbia", code: "+381" },
            { name: "Singapore", code: "+65" },
            { name: "Slovakia", code: "+421" },
            { name: "Slovenia", code: "+386" },
            { name: "South Africa", code: "+27" },
            { name: "South Korea", code: "+82" },
            { name: "Spain", code: "+34" },
            { name: "Sri Lanka", code: "+94" },
            { name: "Sudan", code: "+249" },
            { name: "Sweden", code: "+46" },
            { name: "Switzerland", code: "+41" },
            { name: "Syria", code: "+963" },
            { name: "Taiwan", code: "+886" },
            { name: "Tajikistan", code: "+992" },
            { name: "Tanzania", code: "+255" },
            { name: "Thailand", code: "+66" },
            { name: "Tunisia", code: "+216" },
            { name: "Turkey", code: "+90" },
            { name: "Turkmenistan", code: "+993" },
            { name: "Ukraine", code: "+380" },
            { name: "United Arab Emirates", code: "+971" },
            { name: "United Kingdom", code: "+44" },
            { name: "United States", code: "+1" },
            { name: "Uruguay", code: "+598" },
            { name: "Uzbekistan", code: "+998" },
            { name: "Venezuela", code: "+58" },
            { name: "Vietnam", code: "+84" },
            { name: "Yemen", code: "+967" },
            { name: "Zambia", code: "+260" },
            { name: "Zimbabwe", code: "+263" }
        ].sort((a, b) => a.name.localeCompare(b.name));

        const lang = currentLang || 'en';
        select.innerHTML = countryCodes.map(cc => `
            <option value="${cc.code}" ${cc.name === 'Palestine' ? 'selected' : ''}>
                ${cc.name} (${cc.code})
            </option>
        `).join('');
    }

    function initWizardLocations() {
        const lang = currentLang || 'en';
        
        const mainCountries = {
            'country_palestine': { en: 'Palestine', ar: 'فلسطين' },
            'country_jordan': { en: 'Jordan', ar: 'الأردن' },
            'country_uae': { en: 'United Arab Emirates', ar: 'الإمارات' },
            'country_saudi_arabia': { en: 'Saudi Arabia', ar: 'السعودية' },
            'country_egypt': { en: 'Egypt', ar: 'مصر' },
            'country_lebanon': { en: 'Lebanon', ar: 'لبنان' },
            'country_syria': { en: 'Syria', ar: 'سوريا' },
            'country_iraq': { en: 'Iraq', ar: 'العراق' },
            'country_bahrain': { en: 'Bahrain', ar: 'البحرين' },
            'country_qatar': { en: 'Qatar', ar: 'قطر' },
            'country_oman': { en: 'Oman', ar: 'عمان' },
            'country_kuwait': { en: 'Kuwait', ar: 'الكويت' }
        };

        if (wizardCountrySelect) {
            // Sort countries alphabetically
            const sortedCountries = Object.keys(mainCountries).sort((a, b) => {
                const nameA = mainCountries[a][lang] || mainCountries[a].en;
                const nameB = mainCountries[b][lang] || mainCountries[b].en;
                return nameA.localeCompare(nameB);
            });

            wizardCountrySelect.innerHTML = sortedCountries.map(key => `
                <option value="${key}">${mainCountries[key][lang] || mainCountries[key].en}</option>
            `).join('');
            
            // Initialize with Palestine if available
            const defaultCountry = sortedCountries.includes('country_palestine') ? 'country_palestine' : sortedCountries[0];
            wizardCountrySelect.value = defaultCountry;
        }
    }

    function initWizardCategories() {
        const lang = currentLang || 'en';
        const cats = window.globalCategoriesAndProfessions || [];
        
        if (wizardCategoryMenu) {
            wizardCategoryMenu.innerHTML = cats.map(cat => `
                <div class="dropdown-item flex items-center gap-3" data-en="${cat.name.en}">
                    <i class="${cat.icon || 'fas fa-briefcase'} text-slate-300 w-5"></i>
                    <span>${cat.name[lang] || cat.name.en}</span>
                </div>
            `).join('');

            wizardCategoryMenu.querySelectorAll('.dropdown-item').forEach(item => {
                item.addEventListener('click', () => {
                    const enName = item.getAttribute('data-en');
                    const cat = cats.find(c => c.name.en === enName);
                    selectedWizardCategory = enName;
                    
                    // Update display with icon
                    wizardCategoryDisplay.innerHTML = `
                        <div class="flex items-center gap-3">
                            <i class="${cat.icon || 'fas fa-briefcase'} text-primary"></i>
                            <span>${cat.name[lang] || cat.name.en}</span>
                        </div>
                    `;
                    wizardCategoryMenu.classList.remove('show');
                });
            });
        }
    }

    // Wizard Event Listeners
    document.querySelectorAll('.next-step-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Validation
            if (currentStep === 1) {
                const company = document.getElementById('wizardCompanyName').value.trim();
                const email = document.getElementById('wizardEmail').value.trim();
                if (!company || !email) {
                    const msg = currentLang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة (اسم الشركة والبريد الإلكتروني).' : 'Please fill in all required fields (Company Name and Email).';
                    alert(msg);
                    return;
                }
                if (!email.includes('@')) {
                    alert(currentLang === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Please enter a valid email.');
                    return;
                }
            } else if (currentStep === 2) {
                const address = document.getElementById('wizardAddress').value.trim();
                const bio = document.getElementById('wizardBio').value.trim();
                if (!selectedWizardCategory) {
                    alert(currentLang === 'ar' ? 'يرجى اختيار مجال الشركة.' : 'Please select your company industry.');
                    return;
                }
                if (!address) {
                    alert(currentLang === 'ar' ? 'يرجى إدخال عنوان الشركة.' : 'Please enter your company address.');
                    return;
                }
                if (!bio) {
                    alert(currentLang === 'ar' ? 'يرجى كتابة نبذة بسيطة عن الشركة.' : 'Please write a brief bio for your company.');
                    return;
                }
            }

            goToStep(currentStep + 1);
        });
    });

    document.querySelectorAll('.prev-step-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            goToStep(currentStep - 1);
        });
    });

    if (wizardCategoryBtn) {
        wizardCategoryBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            wizardCategoryMenu.classList.toggle('show');
        });
    }
    
    window.addEventListener('click', () => {
        if (wizardCategoryMenu) wizardCategoryMenu.classList.remove('show');
        if (supportMenu) supportMenu.classList.remove('show');
    });

    // Password Requirements Validation
    const wizardPassword = document.getElementById('wizardPassword');
    if (wizardPassword) {
        wizardPassword.addEventListener('input', () => {
            const password = wizardPassword.value;
            const elements = {
                length: document.getElementById('req-length'),
                lowercase: document.getElementById('req-lowercase'),
                uppercase: document.getElementById('req-uppercase'),
                number: document.getElementById('req-number')
            };

            const updateReq = (el, isValid) => {
                if (!el) return;
                if (isValid) {
                    el.classList.add('valid');
                } else {
                    el.classList.remove('valid');
                }
            };

            updateReq(elements.length, password.length >= 8);
            updateReq(elements.lowercase, /[a-z]/.test(password));
            updateReq(elements.uppercase, /[A-Z]/.test(password));
            updateReq(elements.number, /\d/.test(password));
        });
    }

    if (cancelMorphBtn) cancelMorphBtn.addEventListener('click', closeWorkspaceMorph);

    if (wizardForm) {
        wizardForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = document.getElementById('wizardPassword').value;
            const confirmPassword = document.getElementById('wizardConfirmPassword').value;

            // Robust validation
            const hasLength = password.length >= 8;
            const hasLowercase = /[a-z]/.test(password);
            const hasUppercase = /[A-Z]/.test(password);
            const hasNumber = /\d/.test(password);

            if (!hasLength || !hasLowercase || !hasUppercase || !hasNumber) {
                alert(currentLang === 'ar' ? 'يرجى التأكد من استيفاء جميع متطلبات كلمة المرور.' : 'Please ensure all password requirements are met.');
                return;
            }

            if (password !== confirmPassword) {
                alert(translations[currentLang].passwords_not_match);
                return;
            }

            const submitBtn = document.getElementById('wizardSubmitBtn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finalizing...';
            submitBtn.disabled = true;

            const mainCountries = {
                'country_palestine': { en: 'Palestine', ar: 'فلسطين' },
                'country_jordan': { en: 'Jordan', ar: 'الأردن' },
                'country_uae': { en: 'United Arab Emirates', ar: 'الإمارات' },
                'country_saudi_arabia': { en: 'Saudi Arabia', ar: 'السعودية' },
                'country_egypt': { en: 'Egypt', ar: 'مصر' },
                'country_lebanon': { en: 'Lebanon', ar: 'لبنان' },
                'country_syria': { en: 'Syria', ar: 'سوريا' },
                'country_iraq': { en: 'Iraq', ar: 'العراق' },
                'country_bahrain': { en: 'Bahrain', ar: 'البحرين' },
                'country_qatar': { en: 'Qatar', ar: 'قطر' },
                'country_oman': { en: 'Oman', ar: 'عمان' },
                'country_kuwait': { en: 'Kuwait', ar: 'الكويت' }
            };

            const selectedCountryKey = wizardCountrySelect.value;
            const countryNameEn = mainCountries[selectedCountryKey] ? mainCountries[selectedCountryKey].en : 'Palestine';
            
            const signupData = {
                initialUserType: 'employer',
                userType: 'employer',
                employerType: 'company',
                firstName: employerData.first_name || 'Employer',
                lastName: employerData.last_name || 'User',
                email: document.getElementById('wizardEmail').value.trim(),
                phone: document.getElementById('wizardCountryCode').value + document.getElementById('wizardPhone').value.replace(/\s/g, ''),
                companyName: document.getElementById('wizardCompanyName').value.trim(),
                companyEmail: document.getElementById('wizardEmail').value.trim(),
                companyPhone: document.getElementById('wizardCountryCode').value + document.getElementById('wizardPhone').value.replace(/\s/g, ''),
                address: document.getElementById('wizardAddress').value.trim(),
                country: countryNameEn,
                companyCategory: selectedWizardCategory,
                companyDescription: document.getElementById('wizardBio').value.trim(),
                password: password,
                claimJobId: jobId
            };

            try {
                const response = await fetch('/api/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(signupData)
                });

                const result = await response.json();
                if (response.ok && result.success) {
                    // Track Workspace Created
                    trackEvent('workspace_created', { 
                        companyName: signupData.companyName,
                        industry: signupData.companyCategory
                    });
                    
                    alert(translations[currentLang].signup_success);
                    window.location.href = result.redirect || '/employer/hire_dashboard.html';
                } else {
                    alert(result.error || 'Setup failed');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            } catch (error) {
                alert('An unexpected error occurred.');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Support Dropdown Logic
    const supportDropdownBtn = document.getElementById('supportDropdownBtn');
    const supportMenu = document.getElementById('supportMenu');

    if (supportDropdownBtn && supportMenu) {
        supportDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            supportMenu.classList.toggle('show');
        });
    }

    // Main Claim Button trigger
    if (claimWorkspaceBtn) {
        claimWorkspaceBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openWorkspaceMorph();
        });
    }

    // --- OTP Logic ---
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });

    async function sendOtp() {
        const email = (companyEmailInput ? companyEmailInput.value.trim() : '') || detectedEmail;
        
        if (!email || !email.includes('@')) {
            alert(currentLang === 'en' ? 'Please enter a valid email.' : 'يرجى إدخال بريد إلكتروني صحيح.');
            return;
        }

        if (!jobId) {
            alert(currentLang === 'en' ? 'Invalid Job ID.' : 'رقم الوظيفة غير صحيح.');
            return;
        }

        // Track CTA Click
        trackEvent('cta_click');

        // Disable both buttons and show loading state
        if (sendOtpBtn) {
            sendOtpBtn.disabled = true;
            sendOtpBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
        }
        if (reviewCandidatesBtn) {
            reviewCandidatesBtn.disabled = true;
            const originalText = reviewCandidatesBtn.innerHTML;
            reviewCandidatesBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> ' + (currentLang === 'en' ? 'Sending...' : 'جاري الإرسال...');
        }

        try {
            const resp = await fetch('/api/employer-review/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId: parseInt(jobId), email })
            });

            if (resp.ok) {
                if (displayEmail) displayEmail.textContent = email;
                if (emailState) emailState.classList.add('hidden');
                if (otpState) otpState.classList.remove('hidden');
                if (otpInputs && otpInputs[0]) otpInputs[0].focus();
                
                // Track OTP Stage Reached
                trackEvent('otp_stage_reached');
            } else {
                const data = await resp.json();
                alert(data.error || 'Failed to send verification code.');
            }
        } catch (e) {
            alert('Connection error. Please try again.');
        } finally {
            if (sendOtpBtn) {
                sendOtpBtn.disabled = false;
                sendOtpBtn.textContent = translations[currentLang].continue;
            }
            if (reviewCandidatesBtn) {
                reviewCandidatesBtn.disabled = false;
                reviewCandidatesBtn.innerHTML = `<span data-t="review_btn">${translations[currentLang].review_btn}</span>`;
            }
        }
    }

    if (sendOtpBtn) sendOtpBtn.addEventListener('click', sendOtp);
    if (reviewCandidatesBtn) reviewCandidatesBtn.addEventListener('click', sendOtp);

    verifyOtpBtn.addEventListener('click', async () => {
        const otp = Array.from(otpInputs).map(i => i.value).join('');
        // Ensure we capture the email from whatever state we are in
        const email = (companyEmailInput ? companyEmailInput.value.trim() : '') || detectedEmail || (displayEmail ? displayEmail.textContent.trim() : '');

        if (otp.length < 6) return;
        if (!jobId || !email || email === '...') {
            alert(currentLang === 'en' ? 'Missing email or job ID.' : 'البريد الإلكتروني أو رقم الوظيفة مفقود.');
            console.error('Verify OTP failed: jobId or email missing', { jobId, email });
            return;
        }

        verifyOtpBtn.disabled = true;
        verifyOtpBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';

        try {
            const resp = await fetch('/api/employer-review/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId: parseInt(jobId), email, otp })
            });

            if (resp.ok) {
                // Save email to localStorage for morph pre-fill fallback
                localStorage.setItem('employer_review_email', email);
                
                // Track OTP Verification Success
                trackEvent('otp_verify_success');
                
                loadDashboardData();
            } else {
                const data = await resp.json();
                alert(data.error || 'Invalid code.');
            }
        } catch (e) {
            console.error('Verify OTP Error:', e);
            alert('Verification failed. Try again.');
        } finally {
            verifyOtpBtn.disabled = false;
            verifyOtpBtn.textContent = translations[currentLang].verify;
        }
    });

    backToEmailBtn.addEventListener('click', () => {
        otpState.classList.add('hidden');
        emailState.classList.remove('hidden');
    });

    function parseSkills(skillsData) {
        if (!skillsData) return [];
        if (Array.isArray(skillsData)) return skillsData;
        if (typeof skillsData === 'string') {
            try {
                const parsed = JSON.parse(skillsData);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                return skillsData.split(',').map(s => s.trim()).filter(Boolean);
            }
        }
        return [];
    }

    function formatLocation(country, city) {
        const lang = currentLang || 'en';
        const translations = window.palestinianCitiesTranslations || {};
        
        const getTranslated = (val, type) => {
            if (!val) return null;
            // Try to find translation key
            const key = Object.keys(translations).find(k => 
                k.startsWith(type + '_') && (translations[k].en === val || k === val || k === type + '_' + val.toLowerCase().replace(/\s+/g, '_'))
            );
            return key ? (translations[key][lang] || translations[key].en) : val;
        };

        const translatedCountry = getTranslated(country, 'country');
        const translatedCity = getTranslated(city, 'city');

        const cExists = translatedCountry && translatedCountry.trim() !== '' && translatedCountry.toLowerCase() !== 'n/a' && translatedCountry.toLowerCase() !== 'unknown';
        const tExists = translatedCity && translatedCity.trim() !== '' && translatedCity.toLowerCase() !== 'n/a' && translatedCity.toLowerCase() !== 'unknown' && translatedCity.toLowerCase() !== 'other';
        
        if (cExists && tExists) return `${translatedCountry} | ${translatedCity}`;
        if (cExists) return translatedCountry;
        if (tExists) return translatedCity;
        return '';
    }

    // --- Crazy Effects Implementation ---
    function decryptText(element, targetText, duration = 1000) {
        if (!element) return;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
        const length = targetText.length;
        let iteration = 0;
        
        const interval = setInterval(() => {
            element.innerText = targetText
                .split("")
                .map((char, index) => {
                    if (index < iteration) return targetText[index];
                    return chars[Math.floor(Math.random() * chars.length)];
                })
                .join("");

            if (iteration >= length) clearInterval(interval);
            iteration += length / (duration / 30);
        }, 30);
    }

    async function runThoughtStream(container, matchScore, verdict) {
        if (!container) return;
        container.innerHTML = '';
        const lines = [
            `> Initializing Hirly Pilot v1.0...`,
            `> Analyzing professional DNA...`,
            `> Cross-referencing candidate skills...`,
            `> Evaluating verdict: ${verdict}...`,
            `> Match score stabilized at ${matchScore}%`,
            `> DEEP ANALYSIS COMPLETE.`
        ];

        for (let i = 0; i < lines.length; i++) {
            const line = document.createElement('div');
            line.className = 'thought-log-line text-[10px] font-mono text-primary/70';
            line.innerText = lines[i];
            container.appendChild(line);
            await new Promise(r => setTimeout(r, 400));
        }
    }

    function generateRadarSVG(score) {
        const t = translations[currentLang];
        const basePoints = [
            { x: 50, y: 15, label: t.skill_tech },
            { x: 85, y: 35, label: t.skill_comm },
            { x: 80, y: 75, label: t.skill_lead },
            { x: 20, y: 75, label: t.skill_solve },
            { x: 15, y: 35, label: t.skill_exp }
        ];
        
        const scale = (score / 100) * 0.8 + 0.2; // Ensure at least 20% size
        const points = basePoints.map(p => {
            const dx = p.x - 50;
            const dy = p.y - 50;
            return `${50 + dx * scale},${50 + dy * scale}`;
        }).join(" ");

        const labels = basePoints.map(p => {
            const anchor = p.x > 50 ? 'start' : (p.x < 50 ? 'end' : 'middle');
            const dy = p.y < 30 ? '-5' : (p.y > 70 ? '12' : '4');
            return `<text x="${p.x}" y="${p.y}" dy="${dy}" text-anchor="${anchor}" class="fill-slate-400 font-bold text-[6px] uppercase tracking-tighter">${p.label}</text>`;
        }).join("");

        return `
            <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_0_10px_rgba(99,102,241,0.4)] overflow-visible">
                <!-- Grid -->
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" stroke-width="0.3" stroke-dasharray="1"/>
                <circle cx="50" cy="50" r="25" fill="none" stroke="#e2e8f0" stroke-width="0.3" stroke-dasharray="1"/>
                <line x1="50" y1="10" x2="50" y2="90" stroke="#e2e8f0" stroke-width="0.3" stroke-dasharray="1"/>
                <line x1="10" y1="50" x2="90" y2="50" stroke="#e2e8f0" stroke-width="0.3" stroke-dasharray="1"/>
                <!-- Data -->
                <polygon points="${points}" class="radar-poly fill-primary/20 stroke-primary stroke-[1]" />
                <!-- Labels -->
                ${labels}
            </svg>
        `;
    }

    // --- Dashboard Data Logic ---
    async function loadDashboardData() {
        try {
            const resp = await fetch(`/api/employer-review/data/${jobId}`);
            const data = await resp.json();

            if (resp.ok) {
                employerData = data;
                authSection.classList.add('hidden');
                reviewSection.classList.remove('hidden');
                
                // Hide sidebar banners on dashboard
                document.querySelectorAll('.side-banner').forEach(b => b.classList.add('hidden'));
                
                populateCityFilter(data.applicants);
                renderDashboard(data);
            } else {
                console.error('Dashboard data fetch failed:', data.error);
                alert(data.error || 'Failed to load candidate data.');
            }
        } catch (e) {
            console.error('Dashboard error:', e);
            alert('Failed to load candidate data.');
        }
    }

    function renderDashboard(data) {
        reviewJobTitle.textContent = data.job.title;
        reviewCompanyName.textContent = data.job.external_company_name;

        // 4-Box Tier Grid: Elite, Strong, Potential, Rejected
        const eliteCount = parseInt(data.stats.high) || 0;
        const strongCount = parseInt(data.stats.strong) || 0;
        const potentialCount = parseInt(data.stats.backup) || 0;
        const rejectedCount = parseInt(data.stats.other) || 0;

        const statElite = document.getElementById('statElite');
        const statStrong = document.getElementById('statStrong');
        const statPotential = document.getElementById('statPotential');
        const statRejected = document.getElementById('statRejected');

        if (statElite) statElite.textContent = eliteCount;
        if (statStrong) statStrong.textContent = strongCount;
        if (statPotential) statPotential.textContent = potentialCount;
        if (statRejected) statRejected.textContent = rejectedCount;

        // Dynamic Aha Moment text based on top available tier
        const pilotDesc = document.querySelector('[data-t="pilot_desc"]');
        if (pilotDesc) {
            if (eliteCount > 0) {
                pilotDesc.innerHTML = currentLang === 'en' 
                    ? `We've identified <span class="font-black text-indigo-900">${eliteCount} Elite Matches</span> for this role. Candidates have been evaluated against your requirements using Hirly's advanced AI pipeline.`
                    : `لقد حددنا <span class="font-black text-indigo-900">${eliteCount} مطابقة نخبوية</span> لهذا الدور. تم تقييم المرشحين بناءً على متطلباتك باستخدام نظام الذكاء الاصطناعي المتقدم من هايرلي.`;
            } else if (strongCount > 0) {
                pilotDesc.innerHTML = currentLang === 'en'
                    ? `We've found <span class="font-black text-indigo-900">${strongCount} Strong Candidates</span> worth interviewing. Candidates have been evaluated against your requirements using Hirly's advanced AI pipeline.`
                    : `لقد وجدنا <span class="font-black text-indigo-900">${strongCount} مرشحاً قوياً</span> يستحقون المقابلة. تم تقييم المرشحين بناءً على متطلباتك باستخدام نظام الذكاء الاصطناعي المتقدم من هايرلي.`;
            } else {
                pilotDesc.innerHTML = currentLang === 'en'
                    ? `Hirly AI has completed the evaluation of your talent pool. All candidates have been analyzed against your specific requirements.`
                    : `اكتمل تقييم ذكاء هايرلي لقاعدة بيانات المتقدمين لديك. تم تحليل جميع المرشحين بناءً على متطلباتك المحددة.`;
            }
        }

        renderCandidates(data.applicants);
    }

    function renderCandidates(applicants) {
        if (!applicants || applicants.length === 0) {
            candidatesList.innerHTML = `
                <div class="bg-white p-20 rounded-[2.5rem] border border-slate-200 shadow-sm text-center">
                    <div class="w-20 h-20 bg-slate-50 text-slate-300 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-3xl">
                        <i class="fas fa-filter"></i>
                    </div>
                    <h3 class="text-xl font-black text-slate-900 mb-2">${translations[currentLang].no_results}</h3>
                </div>
            `;
            return;
        }

        candidatesList.innerHTML = applicants.map((app, idx) => {
            const verdictClass = {
                'Strong Hire': 'text-secondary bg-secondary/10 border-secondary/20',
                'Interview': 'text-primary bg-primary/10 border-primary/20',
                'Backup': 'text-slate-500 bg-slate-100 border-slate-200',
                'Reject': 'text-red-500 bg-red-50 border-red-100'
            }[app.verdict] || 'text-slate-400 bg-slate-50 border-slate-100';

            let verdictLabel = translations[currentLang]['verdict_' + (app.verdict || 'backup').toLowerCase().replace(' ', '_')] || app.verdict;
            const score = app.match_score || 0;

            // Score-Based Nuance: Protect Hirly's credibility
            // If the verdict is "Interview" (Strong Match) but the score is low, use "Worth Interviewing"
            if (app.verdict === 'Interview' && score < 60) {
                verdictLabel = currentLang === 'en' ? 'Worth Interviewing' : 'يستحق المقابلة';
            }

            const scoreColor = score >= 85 ? 'text-secondary' : (score >= 60 ? 'text-primary' : 'text-slate-400');
            const location = formatLocation(app.country, app.city);

            return `
                <div class="candidate-item bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-primary/40 transition-all group relative overflow-hidden">
                    <div class="absolute top-0 left-0 w-1 h-full bg-primary/10 group-hover:bg-primary transition-colors"></div>
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div class="flex-1">
                            <div class="flex items-center gap-4 mb-6">
                                <div class="flex items-baseline gap-1.5">
                                    <span class="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">${String(idx + 1).padStart(2, '0')}</span>
                                    <span class="w-1 h-1 rounded-full bg-slate-200"></span>
                                    <span class="text-2xl font-black ${scoreColor} tracking-tighter">${score}%</span>
                                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${translations[currentLang].match}</span>
                                </div>
                                <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${verdictClass} shadow-sm">
                                    ${verdictLabel}
                                </span>
                                ${location ? `<span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-auto md:ml-0"><i class="fas fa-location-dot text-[8px]"></i> ${location}</span>` : ''}
                            </div>
                            
                            <div class="flex items-start gap-6">
                                <div class="w-20 h-20 rounded-[2rem] bg-slate-50 overflow-hidden shrink-0 border border-slate-100 relative group/avatar">
                                    ${getApplicantAvatar(app, 'w-full h-full', 'text-2xl')}
                                    <div class="absolute inset-0 bg-primary/5 opacity-0 group-hover/avatar:opacity-100 transition-opacity"></div>
                                </div>
                                <div>
                                    <h4 class="text-2xl font-black text-slate-900 mb-1 tracking-tight">${app.first_name} ${app.last_name}</h4>
                                    <p class="text-slate-500 font-bold text-sm mb-4 uppercase tracking-wide">${app.profession || ''}</p>
                                    <div class="flex flex-wrap gap-2">
                                        ${parseSkills(app.skills).slice(0, 4).map(s => `<span class="text-[10px] font-black bg-slate-50 text-slate-500 px-3 py-1.5 rounded-xl border border-slate-100 hover:border-primary/20 transition-colors">${s}</span>`).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="shrink-0 flex flex-col sm:flex-row items-center gap-3">
                            <!-- Public Profile (Locked) -->
                            <button class="locked-action-btn flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-50 text-slate-500 font-bold text-xs border border-slate-100 hover:bg-slate-100 transition-all group/btn" onclick="document.getElementById('claimWorkspaceBtn').scrollIntoView({behavior:'smooth'})">
                                <i class="fas fa-user-circle text-slate-400 group-hover/btn:text-primary transition-colors"></i>
                                ${translations[currentLang].public_profile}
                                <i class="fas fa-lock text-[10px] opacity-40"></i>
                            </button>
                            
                            <!-- Deep Report (Locked) -->
                            <button class="locked-action-btn flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-50 text-slate-500 font-bold text-xs border border-slate-100 hover:bg-slate-100 transition-all group/btn" onclick="document.getElementById('claimWorkspaceBtn').scrollIntoView({behavior:'smooth'})">
                                <i class="fas fa-file-invoice text-slate-400 group-hover/btn:text-secondary transition-colors"></i>
                                ${translations[currentLang].deep_report}
                                <i class="fas fa-lock text-[10px] opacity-40"></i>
                            </button>

                            <button class="view-profile-btn w-full md:w-auto bg-slate-900 text-white font-black px-8 py-4 rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95 flex items-center gap-2" data-id="${app.application_id}">
                                ${translations[currentLang].view_profile}
                                <i class="fas fa-chevron-right text-[10px] opacity-60"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Attach listeners
        document.querySelectorAll('.view-profile-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const appId = btn.getAttribute('data-id');
                const app = applicants.find(a => a.application_id == appId);
                showCandidateModal(app);
            });
        });
    }

    function showCandidateModal(app) {
        const t = translations[currentLang];
        const verdictClass = {
            'Strong Hire': 'text-secondary bg-secondary/10 border-secondary/20',
            'Interview': 'text-primary bg-primary/10 border-primary/20',
            'Backup': 'text-slate-500 bg-slate-100 border-slate-200',
            'Reject': 'text-red-500 bg-red-50 border-red-100'
        }[app.verdict] || 'text-slate-400 bg-slate-50 border-slate-100';

        const parseArray = (data) => {
            if (!data) return [];
            if (Array.isArray(data)) return data;
            try { return JSON.parse(data); } catch(e) { return []; }
        };

        const strengths = parseArray(app.strengths);
        const weaknesses = parseArray(app.weaknesses);
        const matchedSkills = parseArray(app.matched_skills);
        const missingSkills = parseArray(app.missing_skills);
        const questions = parseArray(app.interview_questions);

        modalContent.innerHTML = `
            <div class="flex flex-col md:flex-row gap-12 p-8 md:p-12 relative">
                <!-- Profile Sidebar -->
                <div class="md:w-1/3 text-center md:text-left">
                    <div class="relative inline-block mb-8">
                        <div class="w-32 h-32 rounded-[32px] overflow-hidden border-4 border-slate-50 shadow-sm mx-auto md:mx-0 relative group">
                            ${getApplicantAvatar(app, 'w-full h-full', 'text-4xl')}
                            <div class="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <div class="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xs shadow-lg border-4 border-white">
                            ${app.match_score || 0}%
                        </div>
                    </div>
                    
                    <h2 class="text-3xl font-extrabold text-slate-900 mb-2">${app.first_name} ${app.last_name}</h2>
                    <p class="text-primary font-bold text-lg mb-2">${app.profession || ''}</p>
                    <div class="flex items-center justify-center md:justify-start gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-8">
                        <i class="fas fa-location-dot text-[8px]"></i>
                        ${formatLocation(app.country, app.city) || 'Remote'}
                    </div>
                    
                    <div class="bg-slate-50 rounded-3xl p-6 border border-slate-100 text-center mb-8 relative overflow-hidden">
                        <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">${t.match}</div>
                        <div class="inline-block px-6 py-2 rounded-full text-sm font-black border ${verdictClass} relative z-10">
                            ${(app.verdict === 'Interview' && (app.match_score || 0) < 60) 
                                ? (currentLang === 'en' ? 'Worth Interviewing' : 'يستحق المقابلة')
                                : (t['verdict_' + (app.verdict || 'backup').toLowerCase().replace(' ', '_')] || app.verdict)}
                        </div>
                        <div class="absolute inset-0 flex items-center justify-center opacity-[0.03] z-0">
                            <i class="fas fa-fingerprint text-8xl"></i>
                        </div>
                    </div>

                    <!-- Skill Radar -->
                    <div class="mb-8 p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Skill DNA Matrix</div>
                        <div class="w-40 h-40 mx-auto">
                            ${generateRadarSVG(app.match_score || 85)}
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div class="text-left">
                            <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">${t.matched_skills}</h4>
                            <div class="flex flex-wrap gap-2">
                                ${matchedSkills.length ? matchedSkills.map(s => `<span class="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-1.5"><i class="fas fa-check-circle"></i> ${s}</span>`).join('') : '<span class="text-slate-400 text-xs italic px-2">None detected</span>'}
                            </div>
                        </div>
                        <div class="text-left">
                            <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2 mt-6">${t.missing_skills}</h4>
                            <div class="flex flex-wrap gap-2">
                                ${missingSkills.length ? missingSkills.map(s => `<span class="bg-rose-50 text-rose-500 text-[10px] font-black px-3 py-1.5 rounded-xl border border-rose-100 flex items-center gap-1.5"><i class="fas fa-times-circle"></i> ${s}</span>`).join('') : '<span class="text-slate-400 text-xs italic px-2">None detected</span>'}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Analysis Content -->
                <div class="md:w-2/3 space-y-10">
                    <section>
                        <div class="flex items-center justify-between mb-4">
                            <h4 class="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <i class="fas fa-robot text-primary"></i> ${t.executive_summary}
                            </h4>
                            <div class="text-[10px] font-mono text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">PILOT_VERIFIED</div>
                        </div>
                        <div class="text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-3xl border border-slate-100 text-sm md:text-base relative min-h-[100px]" id="decryptionSummary">
                            ${app.detailed_summary || app.summary || t.no_summary}
                        </div>
                    </section>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section>
                            <h4 class="text-[10px] font-black text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                                <i class="fas fa-plus-circle"></i> ${t.strengths}
                            </h4>
                            <ul class="space-y-3">
                                ${strengths.map(s => `
                                    <li class="flex items-start gap-3 text-sm text-slate-600 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm transition-transform hover:translate-x-1">
                                        <i class="fas fa-check text-secondary mt-0.5 shrink-0 text-xs"></i>
                                        <span>${s}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </section>
                        <section>
                            <h4 class="text-[10px] font-black text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <i class="fas fa-minus-circle"></i> ${t.weaknesses}
                            </h4>
                            <ul class="space-y-3">
                                ${weaknesses.map(w => `
                                    <li class="flex items-start gap-3 text-sm text-slate-600 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm transition-transform hover:translate-x-1">
                                        <i class="fas fa-exclamation text-red-300 mt-0.5 shrink-0 text-xs"></i>
                                        <span>${w}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </section>
                    </div>

                    <section>
                        <h4 class="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <i class="fas fa-comments text-primary"></i> ${t.interview_questions}
                        </h4>
                        <div class="space-y-3">
                            ${questions.length ? questions.map((q, i) => `
                                <div class="flex gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 transition-all hover:bg-primary/10">
                                    <div class="text-primary font-black font-mono">Q${i+1}</div>
                                    <div class="text-slate-700 text-sm font-medium leading-relaxed">${q}</div>
                                </div>
                            `).join('') : `<div class="text-slate-400 italic text-sm">${t.no_summary}</div>`}
                        </div>
                    </section>

                    <!-- Thought Stream Console -->
                    <div class="bg-slate-50 rounded-3xl p-6 border border-slate-200" id="thoughtStreamContainer">
                        <!-- Populated via JS -->
                    </div>

                    <!-- Locked Experience/CV -->
                    <div id="modalClaimTrigger" class="bg-slate-900 text-white rounded-[32px] p-8 relative overflow-hidden group shadow-2xl shadow-slate-900/20 cursor-pointer">
                        <div class="relative z-10 flex items-center justify-between gap-6">
                            <div>
                                <h4 class="font-bold text-lg mb-2">${t.experience} & CV</h4>
                                <p class="text-slate-400 text-sm leading-relaxed">${t.locked_notice}</p>
                            </div>
                            <div class="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
                                <i class="fas fa-lock"></i>
                            </div>
                        </div>
                        <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-primary/20 transition-all"></div>
                    </div>
                </div>
            </div>
        `;

        candidateModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Attach modal claim trigger
        const modalClaimTrigger = document.getElementById('modalClaimTrigger');
        if (modalClaimTrigger) {
            modalClaimTrigger.addEventListener('click', () => {
                closeModal();
                openClaimModal();
            });
        }

        // Trigger Effects
        const modalContainer = document.getElementById('modalContainer');
        modalContainer.classList.add('scanning');
        
        const summaryEl = document.getElementById('decryptionSummary');
        const summaryText = summaryEl.innerText;
        decryptText(summaryEl, summaryText, 1200);

        const thoughtContainer = document.getElementById('thoughtStreamContainer');
        runThoughtStream(thoughtContainer, app.match_score || 0, app.verdict || 'Backup');

        setTimeout(() => {
            modalContainer.classList.remove('scanning');
        }, 2000);
    }

    // Modal Events
    const closeModal = () => {
        if (candidateModal) {
            candidateModal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    };
    
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

    // Initialize
    updateLanguage(currentLang);
    fetchJobPreview();
});
