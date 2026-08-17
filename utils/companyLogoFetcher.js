/**
 * Company Logo Fetcher Utility
 * 
 * Fetches company logos from various sources using an "Elite Tier" pipeline:
 * 1. LinkedIn Profile Extraction (via Playwright)
 * 2. Deep Website Crawling (via Playwright)
 * 3. API Aggregation (Brandfetch, Clearbit, Microlink, Google)
 * 4. Multi-Source Search Discovery (DuckDuckGo)
 * 5. Visual Validation & Sanitization (Sharp)
 */

const axios = require('axios');
const logger = require('./logger');
const cheerio = require('cheerio');
const { DeepSeekAI } = require('./ai/deepSeekAI');
const sharp = require('sharp');
const { chromium } = require('playwright');

class CompanyLogoFetcher {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
        this.ai = new DeepSeekAI();
        this.brandMap = {
            'american express': 'americanexpress.com',
            'amex': 'americanexpress.com',
            'bk': 'bk.com',
            'burger king': 'bk.com',
            'apple': 'apple.com',
            'google': 'google.com',
            'microsoft': 'microsoft.com',
            'amazon': 'amazon.com',
            'facebook': 'facebook.com',
            'meta': 'facebook.com',
            'instagram': 'instagram.com',
            'paltel': 'paltel.ps',
            'jawwal': 'jawwal.ps',
            'bank of palestine': 'bankofpalestine.com',
            'bop': 'bankofpalestine.com',
            'wefaq': 'wefaq.org'
        };
    }

    /**
     * Resolve domain from company name or URL
     */
    resolveDomain(companyName, url = null) {
        // 1. If URL provided, extract domain
        if (url) {
            const domain = this.extractDomain(url);
            if (domain) return domain;
        }

        // 2. Clean and Handle Bilingual Names
        let cleanName = (companyName || '').toLowerCase().trim();
        
        // Handle bilingual names (e.g., "Company Name - اسم الشركة")
        // Split by common separators and take the English part (non-Arabic)
        const parts = cleanName.split(/[-|:–—]/);
        for (const part of parts) {
            const trimmed = part.trim();
            // Check if part contains mostly Latin characters
            if (/^[a-z0-9\s.,&'()]+$/i.test(trimmed) && trimmed.length > 2) {
                cleanName = trimmed;
                break;
            }
        }

        // 3. Check Brand Map
        if (this.brandMap[cleanName]) return this.brandMap[cleanName];

        // 4. Strip Noise Words for better guessing
        const noiseWords = [
            'inc', 'ltd', 'corp', 'corporation', 'llc', 'gmbh', 'co', 'company', 
            'for trade', 'general contracting', 'manufacturing', 'solutions', 
            'technologies', 'group', 'associates', 'association', 'center', 
            'foundation', 'institute', 'society', 'services', 'systems', 'industries',
            'pharmaceuticals', 'manufacturing', 'investment', 'trading', 'marketing'
        ];
        
        let guessed = cleanName;
        noiseWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'g');
            guessed = guessed.replace(regex, '');
        });

        guessed = guessed
            .replace(/[^a-z0-9]/g, '')
            .trim();
        
        return guessed ? `${guessed}.com` : null;
    }

    /**
     * Elite: Search for official website using Playwright
     */
    async searchForOfficialWebsite(companyName) {
        if (!companyName) return null;
        
        let browser;
        try {
            browser = await chromium.launch({ headless: true });
            const context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            });
            const page = await context.newPage();
            
            // Search DuckDuckGo (faster, less anti-bot)
            const searchQuery = `${companyName} official website`;
            await page.goto(`https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}`, { waitUntil: 'networkidle', timeout: 15000 });
            
            // Extract the first non-ad result link
            const links = await page.evaluate(() => {
                const results = Array.from(document.querySelectorAll('.result__a, [data-testid="result-title-a"]'));
                return results.map(a => a.href).filter(href => {
                    const domain = new URL(href).hostname.toLowerCase();
                    const ignored = ['linkedin.com', 'facebook.com', 'twitter.com', 'instagram.com', 'wikipedia.org', 'crunchbase.com', 'glassdoor.com', 'indeed.com', 'jooble.org', 'jobs.ps', 'tanqeeb.com'];
                    return !ignored.some(agg => domain.includes(agg));
                });
            });

            if (links && links.length > 0) {
                const discoveredDomain = this.extractDomain(links[0]);
                if (discoveredDomain) {
                    logger.info(`[MagicLogo] Discovered domain for ${companyName} via search: ${discoveredDomain}`);
                    return discoveredDomain;
                }
            }
            
            return null;
        } catch (error) {
            logger.error(`[MagicLogo] Search discovery failed for ${companyName}: ${error.message}`);
            return null;
        } finally {
            if (browser) await browser.close();
        }
    }

    /**
     * Utility: Extract domain from a URL
     */
    extractDomain(url) {
        if (!url) return null;
        try {
            const urlObj = new URL(url);
            let domain = urlObj.hostname.toLowerCase().replace(/^www\./, '');
            const aggregators = ['jooble.org', 'adzuna.com', 'linkedin.com', 'indeed.com', 'glassdoor.com', 'jobs.ps', 'jobmatch.ps', 'tanqeeb.com'];
            if (aggregators.some(agg => domain.includes(agg))) return null;
            return domain;
        } catch (error) {
            let domain = url.toLowerCase()
                .replace(/^https?:\/\//, '')
                .replace(/^www\./, '')
                .split('/')[0]
                .split('?')[0];
            if (domain.includes('.') && domain.length > 3) return domain;
        }
        return null;
    }

    /**
     * Elite: Validate image content using Sharp
     */
    async validateLogoWithSharp(buffer) {
        try {
            const image = sharp(buffer);
            const metadata = await image.metadata();
            const stats = await image.stats();

            if (metadata.width < 32 || metadata.height < 32) return false;
            const ratio = metadata.width / metadata.height;
            if (ratio > 5 || ratio < 0.2) return false;
            const isSolidColor = stats.channels.every(channel => channel.stdev < 5);
            if (isSolidColor) return false;

            return true;
        } catch (err) {
            return false;
        }
    }

    /**
     * Multi-Source Fetching Sequence
     */
    async getLogoUrl(companyName, externalUrl = null, providedUrl = null) {
        let domain = this.resolveDomain(companyName, providedUrl || externalUrl);
        
        const attemptFetch = async (targetDomain) => {
            if (!targetDomain) return null;
            
            const providers = [
                `https://logo.clearbit.com/${targetDomain}?size=256`,
                `https://unavatar.io/${targetDomain}?fallback=false`,
                `https://unavatar.io/duckduckgo/${targetDomain}?fallback=false`,
                `https://www.google.com/s2/favicons?domain=${targetDomain}&sz=128`,
                `https://icons.duckduckgo.com/ip3/${targetDomain}.ico`
            ];

            for (const url of providers) {
                if (await this.checkImageExists(url)) return url;
            }
            return null;
        };

        // 1. Try guessed/resolved domain
        if (domain) {
            let logoUrl = await attemptFetch(domain);
            if (logoUrl) return logoUrl;

            // Try Palestinian fallbacks if applicable
            const extensions = ['.ps', '.com.ps', '.org', '.net'];
            const base = domain.split('.')[0];
            for (const ext of extensions) {
                if (domain.endsWith(ext)) continue;
                logoUrl = await attemptFetch(`${base}${ext}`);
                if (logoUrl) return logoUrl;
            }
        }

        // 2. Try AI Discovery
        if (companyName) {
            const aiDomain = await this.ai.discoverCompanyWebsite(companyName);
            if (aiDomain && aiDomain !== domain) {
                const logoUrl = await attemptFetch(aiDomain);
                if (logoUrl) return logoUrl;
            }
        }

        // 3. Try Search Discovery (The "Smartest" Fallback)
        if (companyName) {
            const searchDomain = await this.searchForOfficialWebsite(companyName);
            if (searchDomain) {
                const logoUrl = await attemptFetch(searchDomain);
                if (logoUrl) return logoUrl;
            }
        }

        return null;
    }

    /**
     * Download image buffer from URL
     */
    async fetchImageBuffer(url) {
        try {
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
                }
            });
            return Buffer.from(response.data);
        } catch (error) {
            logger.error(`Error fetching image buffer from ${url}:`, error.message);
            throw error;
        }
    }

    async checkImageExists(url) {
        if (!url) return false;
        if (url.includes('clearbit.com') && !url.includes('size=')) return false;

        try {
            let response;
            try {
                response = await axios.head(url, {
                    timeout: 5000,
                    maxRedirects: 3,
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    validateStatus: (status) => status === 200
                });
            } catch (headError) {
                response = await axios.get(url, {
                    timeout: 5000,
                    maxRedirects: 3,
                    headers: { 'User-Agent': 'Mozilla/5.0', 'Range': 'bytes=0-1024' },
                    validateStatus: (status) => status === 200 || status === 206
                });
            }
            
            const contentType = (response.headers['content-type'] || '').toLowerCase();
            const isImage = contentType.includes('image') || contentType.includes('octet-stream') || contentType.includes('svg+xml');
            if (!isImage) return false;

            let contentLength = parseInt(response.headers['content-length'] || '0');
            if (contentLength === 0 || contentLength < 500) {
                try {
                    const fullRes = await axios.get(url, { timeout: 5000, responseType: 'arraybuffer' });
                    contentLength = fullRes.data.length;
                    
                    // Visual validation if we have the buffer
                    const isValid = await this.validateLogoWithSharp(Buffer.from(fullRes.data));
                    if (!isValid) return false;
                } catch (e) {
                    if (contentLength > 0 && contentLength < 200) return false;
                }
            }
            
            if (contentLength < 200) return false;
            if (url.includes('google.com/s2/favicons') && contentLength < 600) return false;

            return true;
        } catch (error) {
            return false;
        }
    }

    getPlaceholderLogo(companyName = 'Company') {
        const initials = companyName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&color=fff&size=128`;
    }
}

const logoFetcher = new CompanyLogoFetcher();

module.exports = { 
    CompanyLogoFetcher,
    logoFetcher
};
