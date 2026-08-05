// Translation interfaces
interface TranslationStrings {
    // Post Job Page
    post_job_title: string;
    job_title_label: string;
    job_title_placeholder: string;
    job_description_label: string;
    job_description_placeholder: string;
    budget_label: string;
    budget_placeholder: string;
    currency_label: string;
    select_currency: string;
    // ... other translation keys

    // Index Page
    hero_main_title: string;
    hero_main_subtitle: string;
    start_now: string;
    find_your_perfect_match: string;
    // ... other translation keys
}

interface Translations {
    en: TranslationStrings;
    ar: TranslationStrings;
}

// Export the interfaces
export type { Translations, TranslationStrings };