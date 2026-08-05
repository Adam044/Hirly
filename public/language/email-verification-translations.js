// public/language/email-verification-translations.js
// These are translations specific to the email_verification_pending.html page.
// They will be added to the main translations object in language.js
// by calling window.addTranslations().

// Check if window.addTranslations function is available before attempting to use it.
if (typeof window.addTranslations === 'function') {
    window.addTranslations({
        'verify_email_title': { 'ar': 'التحقق من بريدك الإلكتروني - هايرلي', 'en': 'Verify Your Email - Hirly' },
        'verify_email_heading': { 'ar': 'التحقق من عنوان بريدك الإلكتروني', 'en': 'Verify Your Email Address' },
        'verification_instruction': { 'ar': 'تم إرسال رمز تحقق مكون من 6 أرقام إلى <strong>{email}</strong>. الرجاء إدخاله أدناه لتفعيل حسابك.', 'en': 'A 6-digit verification code has been sent to <strong>{email}</strong>. Please enter it below to activate your account.' },
        'verify_account_btn': { 'ar': 'تفعيل الحساب', 'en': 'Verify Account' },
        'enter_valid_code_error': { 'ar': 'الرجاء إدخال رمز صحيح مكون من 6 أرقام.', 'en': 'Please enter a valid 6-digit code.' },
        'email_missing_error': { 'ar': 'معلومات البريد الإلكتروني مفقودة. الرجاء العودة إلى صفحة التسجيل أو تسجيل الدخول.', 'en': 'User email not found. Please go back to signup or login.' },
        'sending_new_code_info': { 'ar': 'جارٍ إرسال رمز جديد...', 'en': 'Sending new code...' },
        'new_code_sent_success': { 'ar': 'تم إرسال رمز تحقق جديد! الرجاء التحقق من صندوق الوارد الخاص بك.', 'en': 'New verification code sent! Please check your inbox.' },
        'resend_failed_generic': { 'ar': 'فشل إعادة إرسال رمز التحقق. الرجاء المحاولة مرة أخرى لاحقًا.', 'en': 'Failed to resend verification code. Please try again later.' },
        'unexpected_error_occurred': { 'ar': 'حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.', 'en': 'An unexpected error occurred. Please try again.' },
        'didnt_receive_code_question': { 'ar': 'لم تستلم الرمز؟', 'en': 'Didn\'t receive the code?' },
        'resend_verification_btn': { 'ar': 'إعادة إرسال رمز التحقق', 'en': 'Resend Verification Code' },
        'go_to_login_page': { 'ar': 'الذهاب إلى صفحة تسجيل الدخول', 'en': 'Go to Login Page' },
        'email_verified_success': { 'ar': 'تم التحقق من البريد الإلكتروني بنجاح!', 'en': 'Email verified successfully!' },
        'verification_failed_generic': { 'ar': 'فشلت عملية التحقق. الرجاء المحاولة مرة أخرى.', 'en': 'Verification failed. Please try again.' },
        'your_email_address': { 'ar': 'عنوان بريدك الإلكتروني', 'en': 'your email address' },
        'max_resend_attempts_reached': { 'ar': 'تم الوصول إلى الحد الأقصى لمحاولات إعادة الإرسال (3 محاولات). الرجاء الاتصال بالدعم إذا لم تستلم الرمز.', 'en': 'Maximum resend attempts reached (3 attempts). Please contact support if you haven\'t received the code.' },
        'max_attempts_reached': { 'ar': 'تم الوصول للحد الأقصى', 'en': 'Maximum attempts reached' },
        'new_code_sent_with_attempts': { 'ar': 'تم إرسال رمز تحقق جديد بنجاح. {remaining} محاولات متبقية.', 'en': 'New verification code sent successfully. {remaining} attempts remaining.' },
        // API Error Responses
        'Invalid verification code.': { 'ar': 'رمز التحقق غير صالح.', 'en': 'Invalid verification code.' },
        'Verification code has expired. Please request a new one.': { 'ar': 'انتهت صلاحية رمز التحقق. الرجاء طلب رمز جديد.', 'en': 'Verification code has expired. Please request a new one.' },
        'User not found for this email.': { 'ar': 'المستخدم غير موجود لهذا البريد الإلكتروني.', 'en': 'User not found for this email.' },
        'Email is already verified.': { 'ar': 'تم التحقق من البريد الإلكتروني بالفعل.', 'en': 'Email is already verified.' }
    });
} else {
    console.error("window.addTranslations is not defined. Ensure language.js is loaded correctly before email-verification-translations.js.");
}
