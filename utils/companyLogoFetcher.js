/**
 * Company Logo Fetcher Utility
 * 
 * Fetches company logos from various sources:
 * 1. Clearbit Logo API (primary)
 * 2. Google Favicon Service (fallback)
 * 3. DuckDuckGo Favicon Service (fallback)
 * 
 * Also extracts domain from external URLs to generate logo URLs.
 */

const axios = require('axios');
const logger = require('./logger');

class CompanyLogoFetcher {
    constructor() {
        // Cache for logo URLs to avoid repeated requests
        this.cache = new Map();
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    }

    /**
     * Extract domain from a URL, avoiding aggregator domains
     * @param {string} url - Full URL
     * @returns {string} - Domain name (e.g., "google.com")
     */
    extractDomain(url) {
        if (!url) return null;
        
        try {
            const urlObj = new URL(url);
            let domain = urlObj.hostname.toLowerCase().replace(/^www\./, '');
            
            // List of aggregator domains to ignore
            const aggregators = ['jooble.org', 'adzuna.com', 'linkedin.com', 'indeed.com', 'glassdoor.com', 'jobs.ps', 'jobmatch.ps', 'tanqeeb.com'];
            if (aggregators.some(agg => domain.includes(agg))) {
                return null;
            }
            
            return domain;
        } catch (error) {
            // Fallback for non-standard URLs
            let domain = url.toLowerCase()
                .replace(/^https?:\/\//, '')
                .replace(/^www\./, '')
                .split('/')[0]
                .split('?')[0];
            
            if (domain.includes('.') && domain.length > 3) {
                return domain;
            }
        }
        
        return null;
    }

    /**
     * Guess the company's official domain based on its name
     * @param {string} companyName 
     * @returns {string|null}
     */
    guessDomain(companyName) {
        if (!companyName || companyName.toLowerCase().includes('private company')) return null;

        // Clean name: remove "inc", "ltd", "corp", and special characters
        const cleanName = companyName.toLowerCase()
            .replace(/\b(inc|ltd|corp|corporation|llc|gmbh|co|company)\b/g, '')
            .replace(/[^a-z0-9]/g, '')
            .trim();

        if (cleanName.length < 2) return null;

        // Common TLDs to try
        return `${cleanName}.com`;
    }

    /**
     * Check if a logo URL belongs to an aggregator
     */
    isAggregatorLogo(url) {
        if (!url) return false;
        const aggregators = ['jobs.ps', 'jooble.org', 'adzuna.com', 'linkedin.com', 'indeed.com', 'glassdoor.com', 'jobmatch.ps', 'tanqeeb.com'];
        return aggregators.some(agg => url.toLowerCase().includes(agg));
    }

    /**
     * Get company logo URL
     * @param {string} companyName - Company name
     * @param {string} externalUrl - External job URL (optional)
     * @param {string} providedWebsite - Explicitly provided website URL (optional)
     * @param {string} pageLogo - Logo URL found on the job page (optional)
     * @returns {Promise<string>} - Logo URL or null
     */
    async getLogoUrl(companyName, externalUrl = null, providedWebsite = null, pageLogo = null) {
        // Create cache key
        const cacheKey = `${companyName}_${externalUrl}_${providedWebsite}_${pageLogo}`;
        
        // Check cache
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.logoUrl;
        }

        // 0. Use page logo if provided and NOT an aggregator logo
        if (pageLogo && !this.isAggregatorLogo(pageLogo)) {
            if (await this.checkImageExists(pageLogo)) {
                return pageLogo;
            }
        }
        
        let logoUrl = null;
        let domains = new Set();
        
        // 1. Try provided website first
        if (providedWebsite) {
            const domain = this.extractDomain(providedWebsite);
            if (domain) domains.add(domain);
        }

        // 2. Try to extract domain from external job URL (if not an aggregator)
        if (externalUrl) {
            const domain = this.extractDomain(externalUrl);
            if (domain) domains.add(domain);
        }

        // 3. Guess domain from company name
        if (companyName) {
            const guessed = this.guessDomain(companyName);
            if (guessed) domains.add(guessed);
            
            // Try common abbreviations/variations
            const variations = this.guessDomainVariations(companyName);
            variations.forEach(v => domains.add(v));
        }

        // Try each domain found
        for (const domain of domains) {
            // Try Clearbit Logo API (Premium feel)
            logoUrl = `https://logo.clearbit.com/${domain}`;
            if (await this.checkImageExists(logoUrl)) break;
            
            // Try Google Favicon (Very reliable fallback)
            logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
            if (await this.checkImageExists(logoUrl)) break;

            // Try DuckDuckGo
            logoUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
            if (await this.checkImageExists(logoUrl)) break;

            logoUrl = null;
        }
        
        // Cache the result
        this.cache.set(cacheKey, {
            logoUrl,
            timestamp: Date.now()
        });
        
        return logoUrl;
    }

    /**
     * Guess variations of the domain (abbreviations, etc)
     */
    guessDomainVariations(companyName) {
        const variations = [];
        const words = companyName.toLowerCase()
            .replace(/\b(inc|ltd|corp|corporation|llc|gmbh|co|company)\b/g, '')
            .replace(/[^a-z0-9\s]/g, '')
            .trim()
            .split(/\s+/);

        if (words.length > 2) {
            // Try initials (e.g., "River Lodge Assisted Living" -> "rlal.com")
            const initials = words.map(w => w[0]).join('');
            if (initials.length > 1) variations.push(`${initials}.com`);

            // Try first word + initials of others
            const firstWithInitials = words[0] + words.slice(1).map(w => w[0]).join('');
            variations.push(`${firstWithInitials}.com`);
        }

        return variations;
    }

    /**
     * Check if an image URL exists and returns valid image
     * @param {string} url - Image URL
     * @returns {Promise<boolean>}
     */
    async checkImageExists(url) {
        try {
            // Try HEAD first (faster)
            let response;
            try {
                response = await axios.head(url, {
                    timeout: 5000,
                    maxRedirects: 3,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
                    },
                    validateStatus: (status) => status === 200
                });
            } catch (headError) {
                // Fallback to GET if HEAD is blocked
                response = await axios.get(url, {
                    timeout: 5000,
                    maxRedirects: 3,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                        'Range': 'bytes=0-1024' // Just get the beginning to check content-type
                    },
                    validateStatus: (status) => status === 200 || status === 206
                });
            }
            
            // Check if it's actually an image
            const contentType = response.headers['content-type'];
            return contentType && (
                contentType.includes('image') || 
                contentType.includes('octet-stream')
            );
        } catch (error) {
            return false;
        }
    }

    /**
     * Get default placeholder logo URL
     * @param {string} companyName - Company name
     * @returns {string} - Placeholder URL
     */
    getPlaceholderLogo(companyName = 'Company') {
        // Generate a placeholder with company initials
        const initials = companyName
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&color=fff&size=128`;
    }
}

// Export singleton instance
const logoFetcher = new CompanyLogoFetcher();

module.exports = { 
    CompanyLogoFetcher,
    logoFetcher
};
