// public/language/contact-page-translations.js
// This file defines translations specific to the contact page.
// They will be added to the main translations object in language.js
// by calling window.addTranslations().

if (typeof window.addTranslations === 'function') {
    window.addTranslations({
        'contact_hirly_title': { 'ar': 'تواصل مع هيرلي', 'en': 'Contact Hirly' },
        'contact_hirly_subtitle': { 'ar': 'نحن متحمسون للاستماع إليك! أرسل لنا رسالة وسنرد عليك في أقرب وقت ممكن.', 'en': 'We\'d love to hear from you! Send us a message and we\'ll respond as soon as possible.' },
        'send_us_message': { 'ar': 'أرسل لنا رسالة', 'en': 'Send Us a Message' },
        'your_name': { 'ar': 'اسمك', 'en': 'Your Name' },
        'email_address': { 'ar': 'عنوان البريد الإلكتروني', 'en': 'Email Address' },
        'subject': { 'ar': 'الموضوع', 'en': 'Subject' },
        'subject_placeholder': { 'ar': 'استفسار حول الخدمات', 'en': 'Inquiry about services' },
        'message': { 'ar': 'الرسالة', 'en': 'Message' },
        'message_placeholder': { 'ar': 'رسالتك هنا...', 'en': 'Your message here...' },
        'send_message_btn': { 'ar': 'إرسال الرسالة', 'en': 'Send Message' },
        'sending_message': { 'ar': 'جارٍ إرسال الرسالة...', 'en': 'Sending message...' },
        
        // Modal Translations
        'modal_success_title': { 'ar': 'تم إرسال الرسالة!', 'en': 'Message Sent!' },
        'modal_success_message': { 'ar': 'شكراً لك على رسالتك. سوف نرد عليك في أقرب وقت ممكن.', 'en': 'Thank you for your message. We will get back to you as soon as possible.' },
        'modal_error_title': { 'ar': 'خطأ في إرسال الرسالة', 'en': 'Error Sending Message' },
        'modal_error_message': { 'ar': 'حدث خطأ أثناء إرسال رسالتك. يرجى المحاولة مرة أخرى.', 'en': 'There was an issue sending your message. Please try again.' },
        'close': { 'ar': 'إغلاق', 'en': 'Close' },
        
        // General Errors
        'failed_to_send_message': { 'ar': 'فشل إرسال الرسالة: ', 'en': 'Failed to send message: ' },
        'unknown_error': { 'ar': 'خطأ غير معروف', 'en': 'Unknown error' },
        'an_error_occurred_sending': { 'ar': 'حدث خطأ أثناء إرسال رسالتك', 'en': 'An error occurred while sending your message' },
    });
} else {
    console.error("window.addTranslations is not defined. Ensure language.js is loaded correctly before contact-page-translations.js.");
}
