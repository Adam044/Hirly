/**
 * DeepSeek AI Integration
 * 
 * Handles AI-powered job data extraction and normalization.
 * Uses DeepSeek API for structured extraction from raw job data.
 */

const axios = require('axios');
const logger = require('../logger');

class DeepSeekAI {
    constructor() {
        this.apiKey = process.env.DEEPSEEK_API_KEY;
        this.baseUrl = 'https://api.deepseek.com/v1';
        this.model = 'deepseek-chat';
        
        if (!this.apiKey) {
            logger.warn('DeepSeekAI: API key not found in environment variables');
        }
    }

    /**
     * Extract structured job data from raw job payload
     * @param {Object} rawPayload - Raw job data from source
     * @param {Array} hirlyHierarchy - Hierarchy of Categories and Professions
     * @returns {Promise<Object>} - Structured job data
     */
    async extractJobData(rawPayload, hirlyHierarchy = []) {
        if (!this.apiKey) {
            logger.warn('DeepSeekAI: No API key, using rule-based extraction fallback');
            return this.ruleBasedExtraction(rawPayload);
        }

        const currentDate = new Date().toISOString().split('T')[0];
        const prompt = this.buildExtractionPrompt(rawPayload, hirlyHierarchy, currentDate);
        
        try {
            const response = await axios.post(
                `${this.baseUrl}/chat/completions`,
                {
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a premium job data extraction specialist for Hirly, a high-end job platform in MENA. Your goal is to extract the most comprehensive, professional, and accurate data possible. You MUST return ONLY valid JSON.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.1,
                    max_tokens: 3000
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 45000
                }
            );

            const content = response.data.choices[0]?.message?.content;
            if (!content) {
                throw new Error('Empty response from DeepSeek API');
            }

            // Parse the JSON response
            const extracted = this.safeJsonParse(content);
            if (!extracted) {
                logger.warn('DeepSeekAI: Failed to parse AI response, using fallback');
                return this.ruleBasedExtraction(rawPayload);
            }

            return this.normalizeExtractedData(extracted, rawPayload);

        } catch (error) {
            logger.error(`DeepSeekAI extraction error: ${error.message}`);
            return this.ruleBasedExtraction(rawPayload);
        }
    }

    /**
     * Build the extraction prompt for the AI
     */
    buildExtractionPrompt(rawPayload, hirlyHierarchy = [], currentDate = '') {
        const title = rawPayload.title || rawPayload.job_title || '';
        const description = rawPayload.job_text || rawPayload.description || rawPayload.snippet || rawPayload.content || '';
        const company = rawPayload.company || rawPayload.company_name || rawPayload.employer || '';
        const location = rawPayload.location || rawPayload.city || rawPayload.area || '';
        const originalDate = rawPayload.original_date || '';

        // Import city translations for prompt inclusion
        const cityData = {
            'Abasan al-Kabira': 'عبسان الكبيرة',
            'Abu Dis': 'أبو ديس',
            'Bani Na\'im': 'بني نعيم',
            'Bani Suheila': 'بني سهيلا',
            'Beit Hanoun': 'بيت حانون',
            'Beit Jala': 'بيت جالا',
            'Beit Lahia': 'بيت لاهيا',
            'Beit Sahour': 'بيت ساحور',
            'Beit Ummar': 'بيت أمر',
            'Beitunia': 'بيتونيا',
            'Bethlehem': 'بيت لحم',
            'al-Bireh': 'البيرة',
            'Deir al-Balah': 'دير البلح',
            'ad-Dhahiriya': 'الظاهرية',
            'Dura': 'دورا',
            'Gaza City': 'مدينة غزة',
            'Halhul': 'حلحول',
            'Hebron': 'الخليل',
            'Idhna': 'إذنا',
            'Jabalia': 'جباليا',
            'Jenin': 'جنين',
            'Jericho': 'أريحا',
            'Jerusalem': 'القدس',
            'Khan Yunis': 'خان يونس',
            'Nablus': 'نابلس',
            'Qabatiya': 'قباطية',
            'Qalqilya': 'قلقيلية',
            'Rafah': 'رفح',
            'Ramallah': 'رام الله',
            'Sa\'ir': 'سعير',
            'Salfit': 'سلفيت',
            'as-Samu': 'السموع',
            'Surif': 'صوريف',
            'Tubas': 'طوباس',
            'Tulkarm': 'طولكرم',
            'Ya\'bad': 'يعبد',
            'al-Yamun': 'اليمون',
            'Yatta': 'يطا',
            'az-Zawayda': 'الزوايدة'
        };

        let hierarchyString = '';
        if (hirlyHierarchy.length > 0) {
            hierarchyString = "VALID HIERARCHY (Category -> Professions):\n";
            hirlyHierarchy.forEach(cat => {
                const professions = cat.professions.map(p => p.en).join(', ');
                hierarchyString += `- ${cat.name.en}: [${professions}]\n`;
            });
        }

        let citiesString = "VALID PALESTINIAN CITIES (Use English names ONLY):\n";
        citiesString += Object.keys(cityData).join(', ');

        return `Extract structured job information from the following job posting.

TODAY'S DATE: ${currentDate}
SOURCE API DATE: ${originalDate}

JOB TITLE: ${title}

COMPANY: ${company}

LOCATION: ${location}

DESCRIPTION: 
${description}

${hierarchyString}

${citiesString}

Extract and return ONLY a JSON object with this exact structure:
{
  "title": "string (professionalized job title in English)",
  "company": "string (full company name in English)",
  "description": "string (comprehensive summary of the job. PRESERVE THE ORIGINAL LANGUAGE of the source text. If it is in Arabic, use Arabic. If it is in English, use English.)",
  "responsibilities": ["array (PRESERVE THE ORIGINAL LANGUAGE of the source text. Do NOT translate to English if the source is Arabic.)"],
  "requirements": ["array (PRESERVE THE ORIGINAL LANGUAGE of the source text. Do NOT translate to English if the source is Arabic.)"],
  "preferred_qualifications": ["array (PRESERVE THE ORIGINAL LANGUAGE of the source text.)"],
  "benefits": ["array (PRESERVE THE ORIGINAL LANGUAGE of the source text.)"],
  "location": "string (city, country in English)",
  "city": "string (city ONLY from the provided list in English, e.g. 'Hebron' instead of 'الخليل'. If the specific city is unknown or not in the list, use 'Other')",
  "country": "string (country name in English, e.g. 'Palestine' instead of 'فلسطين')",
  "job_type": "string (Full-time, Part-time, Contract, Freelance in English)",
  "job_site_type": "string (On-site, Remote, Hybrid in English)",
  "category": "string (Parent category from hierarchy in English)",
  "professions": ["array (professions from the selected category in English)"],
  "salary": "number or null",
  "currency": "string (USD, ILS, JOD, EUR, AED, SAR or null)",
  "skills": ["array (technical skills mentioned in English)"],
  "experience_level": "string (Entry/Mid/Senior/Lead in English)",
  "gender_requirement": "string (male, female, or any in English)",
  "age_min": "number or null",
  "age_max": "number or null",
  "company_website": "string (official company website URL if you can highly accurately guess it from the company name, otherwise null)",
  "posted_at": "string (ISO date. CRITICAL: If the text says '2 months ago', you MUST subtract 60 days from ${currentDate}. If it says '1 day ago', subtract 1 day. DO NOT just return today's date.)",
  "deadline": "string (ISO date. Look for 'آخر موعد للتقديم' or 'Deadline' in the text. Convert to ISO format, e.g., '2026-08-10'. If not found, use null. This is extremely important for Palestinian jobs.)"
}

Rules:
1. Return ONLY valid JSON.
2. CRITICAL: Pay special attention to the JOB TITLE for keywords like '[Remote]', 'Remote', 'Hybrid', 'Work from home'. If these are present, set 'job_site_type' accordingly.
3. If 'posted_at' mentions relative time (e.g. '2 months ago', 'منذ يوم', 'منذ 3 ساعات'), calculate the EXACT date relative to ${currentDate}.
4. If the description does NOT mention a post date, use the 'SOURCE API DATE' (${originalDate}) for the 'posted_at' field.
5. Return null for 'posted_at' ONLY if both the description and SOURCE API DATE are missing.
6. The 'description' should be a high-quality professional summary (3-5 sentences). 
7. The 'responsibilities' and 'requirements' MUST be comprehensive and detailed. Do NOT summarize them into 2-3 points; extract all significant points mentioned in the text.
8. For 'job_type' and 'job_site_type', use the standard values provided.
9. Match the 'category' and 'professions' STRICTLY to the hierarchy provided.
10. If a value is unknown, use null.
11. LANGUAGE RULE: Preserve the language of the SOURCE TEXT for 'description', 'responsibilities', 'requirements', 'preferred_qualifications', and 'benefits'. If the source is in English, keep it in English. If it is in Arabic, keep it in Arabic. DO NOT translate these fields.
12. SYSTEM FIELDS: 'title', 'company', 'location', 'city', 'country', 'job_type', 'job_site_type', 'category', 'professions', and 'experience_level' MUST ALWAYS be in English regardless of the source language.
13. GEOGRAPHIC RULE: For Palestine, you MUST map any Arabic city name (e.g. 'الخليل') to its English counterpart from the provided list (e.g. 'Hebron'). If the city is not in the list, use the English transliteration.
14. NO HALLUCINATION: Only use the information provided in the text. If a field like 'experience_level' or 'years of experience' is not mentioned, use null. Do NOT guess or use general knowledge.
15. JOBS.PS SPECIFIC: For Jobs.ps, the deadline is usually in a table at the bottom labeled 'آخر موعد للتقديم'. Always check that section.`;
    }

    /**
     * Safely parse JSON from AI response
     */
    safeJsonParse(content) {
        try {
            // Remove markdown code blocks if present
            const cleaned = content
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            
            return JSON.parse(cleaned);
        } catch (e) {
            return null;
        }
    }

    /**
     * Normalize extracted data to consistent structure
     */
    normalizeExtractedData(extracted, rawPayload) {
        return {
            title: extracted.title || rawPayload.title || 'Untitled Job',
            company: extracted.company || rawPayload.company || 'Private Company',
            description: extracted.description || rawPayload.description || '',
            location: extracted.location || rawPayload.location || 'Remote',
            city: extracted.city || 'Other',
            country: extracted.country || 'Unknown',
            job_type: extracted.job_type || 'Full-time',
            job_site_type: extracted.job_site_type || 'On-site',
            category: extracted.category || 'Other',
            professions: Array.isArray(extracted.professions) ? extracted.professions : [],
            salary: typeof extracted.salary === 'number' ? extracted.salary : null,
            currency: extracted.currency || null,
            skills: extracted.skills || [],
            requirements: Array.isArray(extracted.requirements) ? extracted.requirements : [],
            responsibilities: Array.isArray(extracted.responsibilities) ? extracted.responsibilities : [],
            preferred_qualifications: Array.isArray(extracted.preferred_qualifications) ? extracted.preferred_qualifications : [],
            benefits: Array.isArray(extracted.benefits) ? extracted.benefits : [],
            experience_level: extracted.experience_level || 'Not specified',
            gender_requirement: extracted.gender_requirement || 'any',
            age_min: extracted.age_min || null,
            age_max: extracted.age_max || null,
            company_website: extracted.company_website || null,
            posted_at: extracted.posted_at || rawPayload.original_date || null,
            deadline: extracted.deadline || null
        };
    }

    /**
     * Rule-based extraction fallback when AI fails
     */
    ruleBasedExtraction(rawPayload) {
        logger.info('DeepSeekAI: Using rule-based extraction fallback');
        
        const extractText = (field) => {
            const value = rawPayload[field];
            if (!value) return '';
            return String(value).replace(/<[^>]*>/g, '').trim();
        };
        
        const title = extractText('title') || extractText('job_title') || 'Untitled Job';
        const company = extractText('company') || extractText('company_name') || extractText('employer') || 'Private Company';
        const description = extractText('description') || extractText('snippet') || extractText('content') || '';
        const location = extractText('location') || extractText('city') || extractText('area') || 'Remote';
        
        // Simple category detection
        const categoryKeywords = {
            'Tech & Development': ['software', 'developer', 'engineer', 'programming', 'it ', 'technical'],
            'Sales & Marketing': ['sales', 'marketing', 'digital marketing', 'seo', 'social media'],
            'Design': ['designer', 'design', 'ui', 'ux', 'graphic', 'creative'],
            'Business & Finance': ['finance', 'accounting', 'business', 'admin', 'hr', 'human resources']
        };
        
        let category = 'Other';
        const textToCheck = `${title} ${description}`.toLowerCase();
        for (const [cat, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(kw => textToCheck.includes(kw))) {
                category = cat;
                break;
            }
        }
        
        return {
            title,
            company,
            description: description.substring(0, 500),
            location,
            city: 'Other',
            country: 'Unknown',
            job_type: 'Full-time',
            job_site_type: (textToCheck.includes('remote') || title.toLowerCase().includes('remote') || location.toLowerCase().includes('remote')) ? 'Remote' : 
                           (textToCheck.includes('hybrid')) ? 'Hybrid' : 'On-site',
            category,
            professions: [],
            salary: null,
            currency: null,
            skills: [],
            experience_level: 'Not specified',
            gender_requirement: 'any',
            age_min: null,
            age_max: null,
            company_website: null,
            posted_at: rawPayload.original_date || null
        };
    }
}

module.exports = { DeepSeekAI };
