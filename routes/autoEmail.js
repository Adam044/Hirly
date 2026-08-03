const express = require('express');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const { getTemplateContent } = require('../utils/templateHelper');
const { sendAutoEmail } = require('../utils/emailService');
const logger = require('../utils/logger');

// Global state for progress tracking (similar to existing patterns in server.js)
if (!global.autoEmailCampaigns) {
    global.autoEmailCampaigns = new Map();
}

// List of real-world user agents for rotation
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.2 Mobile/15E148 Safari/604.1'
];

/**
 * Helper to extract emails from text with smart ranking
 */
function extractEmails(text, baseUrl) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailRegex) || [];
    const domain = new URL(baseUrl).hostname.replace('www.', '');
    
    // Process and rank emails
    const emailList = [...new Set(matches.map(email => email.toLowerCase()))].filter(email => {
        const commonFalsePositives = ['.png', '.jpg', '.jpeg', '.gif', '.svg', 'example.com', 'bootstrap.com', 'jquery.com', 'font.', 'w3.org'];
        return !commonFalsePositives.some(fp => email.endsWith(fp)) && email.includes('.');
    });

    return emailList.map(email => {
        let score = 0;
        const [user, emailDomain] = email.split('@');

        // High priority keywords for Hirly (employers/HR) - English & Arabic
        const hrKeywords = ['hr', 'jobs', 'career', 'hiring', 'recruitment', 'employer', 'talent', 'join', 'work', 'staff', 'recruit', 'cv', 'resume'];
        const hrArabicKeywords = ['توظيف', 'موارد', 'بشرية', 'وظائف', 'عمل', 'سيرة', 'ذاتية', 'شواغر'];
        
        const contactKeywords = ['info', 'contact', 'hello', 'support', 'office', 'admin', 'business', 'sales'];
        const contactArabicKeywords = ['تواصل', 'معلومات', 'اتصل', 'مكتب', 'ادارة'];
        
        if (hrKeywords.some(k => user.includes(k)) || hrArabicKeywords.some(k => user.includes(k))) score += 50;
        if (contactKeywords.some(k => user.includes(k)) || contactArabicKeywords.some(k => user.includes(k))) score += 20;

        // Domain matching - prioritize emails that match the company website domain
        if (emailDomain.includes(domain)) score += 40;
        
        // Prioritize .ps domains for Palestinian local accuracy
        if (email.endsWith('.ps') || emailDomain.includes('.ps.')) score += 60;

        // Penalize generic platform emails and job portals
        const platformDomains = [
            'opensooq.com', 'shobiddak.com', 'facebook.com', 'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com',
            'jobs.ps', 'wadhefa.com', 'akhtaboot.com', 'bayt.com', 'linkedin.com', 'instagram.com', 'twitter.com',
            'wixsite.com', 'blogspot.com', 'wordpress.com'
        ];
        if (platformDomains.some(d => emailDomain === d)) score -= 80;

        return { email, score, domain: emailDomain };
    });
}

/**
 * Helper to extract links that might contain emails (jobs, contact, about)
 */
function extractRelevantLinks(html, baseUrl) {
    const $ = cheerio.load(html);
    const links = new Set();
    const domain = new URL(baseUrl).hostname.replace('www.', '');

    $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (!href) return;

        try {
            const fullUrl = new URL(href, baseUrl).href;
            const linkUrl = new URL(fullUrl);
            
            // Only follow links on the same domain (allowing for www mismatch)
            const linkHostname = linkUrl.hostname.replace('www.', '');
            if (linkHostname === domain) {
                const path = linkUrl.pathname.toLowerCase();
                const text = $(el).text().toLowerCase();
                const keywords = [
                    'job', 'vacancy', 'career', 'hiring', 'contact', 'about', 'detail', 'post', 'apply', 'opportunity', 'view', 'show', 'listing', 'team',
                    'وظائف', 'توظيف', 'مهن', 'تواصل', 'عنا', 'تفاصيل', 'تقدم', 'وظيفة', 'فرصة', 'شاغر', 'عرض', 'فريق', 'انضم', 'اتصل'
                ];
                
                if (keywords.some(k => path.includes(k) || text.includes(k))) {
                    links.add(fullUrl);
                }
            }
        } catch (e) {
            // Ignore invalid URLs
        }
    });

    return Array.from(links).slice(0, 25); // Limit to 25 sub-pages per site for safety
}

/**
 * Simple search to find URLs based on a query
 * Uses DuckDuckGo or similar (easier to scrape than Google)
 */
async function discoverUrlsFromSearch(queries) {
    const discoveredUrls = new Set();
    
    for (const query of queries) {
        try {
            // Enhance query for Palestinian company discovery
            let enhancedQuery = query;
            const palestineKeywords = ['فلسطين', 'palestine', '.ps', 'ramallah', 'gaza', 'nablus', 'hebron'];
            if (!palestineKeywords.some(k => query.toLowerCase().includes(k))) {
                enhancedQuery += ' Palestine شركات';
            }

            const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(enhancedQuery)}`;
            const response = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': USER_AGENTS[0],
                    'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8'
                }
            });

            const $ = cheerio.load(response.data);
            $('.result__url').each((i, el) => {
                const urlText = $(el).text().trim();
                if (urlText) {
                    try {
                        let fullUrl = urlText;
                        if (!fullUrl.startsWith('http')) fullUrl = 'https://' + fullUrl;
                        const url = new URL(fullUrl);
                        // Filter out major social media and the search engine itself
                        const blockedDomains = ['duckduckgo.com', 'facebook.com', 'twitter.com', 'linkedin.com', 'youtube.com', 'instagram.com', 'google.com', 'bing.com', 'yahoo.com'];
                        if (!blockedDomains.some(d => url.hostname.includes(d))) {
                            discoveredUrls.add(url.origin);
                        }
                    } catch (e) { /* ignore */ }
                }
            });
        } catch (error) {
            logger.error(`Search discovery failed for "${query}":`, error.message);
        }
    }
    
    return Array.from(discoveredUrls).slice(0, 25); 
}

/**
 * Scans a list of websites for emails
 */
async function scanWebsites(urls, campaignId, deepScan = true) {
    const progress = global.autoEmailCampaigns.get(campaignId);
    const emailsFound = new Map(); // Store email -> {email, score, domain}
    const visitedUrls = new Set();
    const emailsPerDomain = new Map(); // Store domain -> count

    for (const url of urls) {
        if (progress.stopRequested) break;

        let formattedUrl = url.trim();
        if (!formattedUrl) continue;
        if (!formattedUrl.startsWith('http')) formattedUrl = 'https://' + formattedUrl;

        const queue = [formattedUrl];
        const siteVisited = new Set();
        let subPagesScanned = 0;

        while (queue.length > 0 && (deepScan ? subPagesScanned < 15 : subPagesScanned < 1)) {
            if (progress.stopRequested) break;
            
            const currentUrl = queue.shift();
            if (visitedUrls.has(currentUrl)) continue;
            visitedUrls.add(currentUrl);
            siteVisited.add(currentUrl);
            subPagesScanned++;

            try {
                progress.logs.push({ type: 'info', message: `Scanning: ${currentUrl}` });
                
                let response;
                let lastError;
                
                // Attempt with different user agents if blocked
                for (let attempt = 0; attempt < 3; attempt++) {
                    try {
                        const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
                        response = await axios.get(currentUrl, { 
                            timeout: 12000,
                            headers: {
                                'User-Agent': ua,
                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                                'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
                                'Cache-Control': 'no-cache',
                                'Pragma': 'no-cache',
                                'Referer': 'https://www.google.com/',
                                'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                                'sec-ch-ua-mobile': '?0',
                                'sec-ch-ua-platform': '"Windows"',
                                'Upgrade-Insecure-Requests': '1'
                            },
                            validateStatus: (status) => status < 500 // Allow 403 to be handled manually
                        });

                        if (response.status === 200) break;
                        if (response.status === 403) {
                            lastError = new Error('Access Forbidden (403)');
                            // Wait a bit before retry
                            await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
                            continue;
                        }
                    } catch (e) {
                        lastError = e;
                        await new Promise(r => setTimeout(r, 1000));
                    }
                }

                if (!response || response.status !== 200) {
                    throw lastError || new Error(`Failed with status ${response?.status || 'unknown'}`);
                }
                
                const html = response.data;
                
                // Simple check for Cloudflare or other bot protection
                if (html.includes('cloudflare') || html.includes('Verifying you are human')) {
                    progress.logs.push({ type: 'warning', message: `Site ${currentUrl} seems to have bot protection. Scanning might be limited.` });
                }

                const extracted = extractEmails(html, currentUrl);
                
                if (extracted.length > 0) {
                    extracted.forEach(obj => {
                        const existing = emailsFound.get(obj.email);
                        if (!existing || existing.score < obj.score) {
                            emailsFound.set(obj.email, obj);
                        }
                    });
                    progress.logs.push({ type: 'success', message: `Found ${extracted.length} potential emails on ${currentUrl}` });
                    progress.emailsFoundCount = emailsFound.size;
                }

                // If deep scan is enabled, find more links to scan
                if (deepScan && subPagesScanned === 1) { // Only extract links from the first page (main listing page)
                    const relevantLinks = extractRelevantLinks(html, currentUrl);
                    relevantLinks.forEach(link => {
                        if (!visitedUrls.has(link)) {
                            queue.push(link);
                        }
                    });
                    if (relevantLinks.length > 0) {
                        progress.logs.push({ type: 'system', message: `Found ${relevantLinks.length} potential sub-pages to check...` });
                    }
                }
            } catch (error) {
                progress.logs.push({ type: 'error', message: `Failed to scan ${currentUrl}: ${error.message}` });
            }
        }
    }

    // Sort by score and filter
    const sortedEmails = Array.from(emailsFound.values())
        .sort((a, b) => b.score - a.score)
        .filter(obj => obj.score > 0);

    // Limit emails per domain to ensure variety and avoid spamming one company
    const filteredEmails = [];
    const MAX_EMAILS_PER_DOMAIN = 2;

    for (const obj of sortedEmails) {
        const domainCount = emailsPerDomain.get(obj.domain) || 0;
        if (domainCount < MAX_EMAILS_PER_DOMAIN) {
            filteredEmails.push(obj.email);
            emailsPerDomain.set(obj.domain, domainCount + 1);
        }
    }

    return filteredEmails;
}

module.exports = function registerAutoEmailRoutes(app, pool, { isAuthenticated, isAdmin }) {
    const router = express.Router();

    // GET /admin/auto-email - Render the UI
    router.get('/admin/auto-email', isAuthenticated, isAdmin, (req, res) => {
        res.sendFile(path.join(__dirname, '../views/admin/auto_email.html'));
    });

    // POST /admin/auto-email/start - Start the process
    router.post('/admin/auto-email/start', isAuthenticated, isAdmin, async (req, res) => {
        const { websites, template, maxEmails, delay, deepScan, mode, aiMode } = req.body;

        if (!websites || !template) {
            return res.status(400).json({ success: false, error: 'Missing required parameters' });
        }

        const campaignId = `auto_${Date.now()}`;
        
        // Advanced AI Mode Logic
        let inputList = [];
        if (aiMode) {
            // Specialized Palestinian Industry Queries
            inputList = [
                'شركات تكنولوجيا المعلومات في فلسطين',
                'NGOs in Palestine ramallah',
                'مصانع في الخليل ونابلس',
                'شركات استيراد وتصدير فلسطين',
                'Palestine construction companies',
                'شركات دعاية واعلان رام الله',
                'Tech startups Gaza Ramallah',
                'Palestinian business directory .ps',
                'شركات التأمين في فلسطين',
                'بنوك ومؤسسات مالية فلسطين',
                'شركات الخدمات اللوجستية فلسطين',
                'Palestine industrial zones companies',
                'مؤسسات دولية في القدس ورام الله',
                'شركات السياحة والسفر فلسطين',
                'Palestine engineering offices'
            ];
        } else {
            inputList = websites.split(/[\n,]/).map(u => u.trim()).filter(u => u);
        }

        const progress = {
            id: campaignId,
            status: 'running',
            emailsFoundCount: 0,
            emailsSentCount: 0,
            totalToSent: 0,
            logs: [],
            stopRequested: false,
            startTime: new Date()
        };

        global.autoEmailCampaigns.set(campaignId, progress);

        // Run the process in the background
        (async () => {
            try {
                let websiteList = aiMode ? [] : inputList;

                // If in search mode or AI mode, discover URLs
                if (mode === 'search' || aiMode) {
                    const searchQueries = aiMode ? inputList : inputList;
                    progress.logs.push({ 
                        type: 'info', 
                        message: aiMode ? 'Advanced AI Mode: Generating specialized industry queries...' : `Searching for websites related to: ${inputList.join(', ')}...` 
                    });
                    
                    // Discover URLs from search
                    websiteList = await discoverUrlsFromSearch(searchQueries);
                    
                    if (websiteList.length === 0) {
                        progress.status = 'completed';
                        progress.logs.push({ type: 'warning', message: 'No relevant websites found for your search query.' });
                        return;
                    }
                    progress.logs.push({ type: 'success', message: `Discovered ${websiteList.length} websites to scan.` });
                }

                // 1. Scan for emails
                progress.logs.push({ type: 'info', message: `Starting scanning (Deep Scan: ${deepScan ? 'ON' : 'OFF'})...` });
                const allEmails = await scanWebsites(websiteList, campaignId, deepScan);
                
                if (progress.stopRequested) {
                    progress.status = 'stopped';
                    progress.logs.push({ type: 'warning', message: 'Automation stopped by user during scanning.' });
                    return;
                }

                if (allEmails.length === 0) {
                    progress.status = 'completed';
                    progress.logs.push({ type: 'warning', message: 'No emails found to send to.' });
                    return;
                }

                // 2. Filter by maxEmails - STRICTLY RESPECT LIMIT
                const limit = Math.min(parseInt(maxEmails) || 50, 500);
                const emailsToSend = allEmails.slice(0, limit);
                progress.totalToSent = emailsToSend.length;
                progress.logs.push({ type: 'info', message: `Ready to send to ${emailsToSend.length} top-ranked employers.` });

                // 3. Get template content
                const content = getTemplateContent(template);
                if (!content) {
                    throw new Error(`Template ${template} not found`);
                }

                // 4. Sequential Sending
                for (const email of emailsToSend) {
                    if (progress.stopRequested) break;

                    try {
                        progress.logs.push({ type: 'info', message: `Sending to: ${email}...` });
                        
                        await sendAutoEmail(email, content.subject, content.html || content.message);
                        
                        progress.emailsSentCount++;
                        progress.logs.push({ type: 'success', message: `Successfully sent to ${email} (${progress.emailsSentCount}/${emailsToSend.length})` });

                        // Wait for delay
                        if (progress.emailsSentCount < emailsToSend.length && !progress.stopRequested) {
                            const delayMs = (parseInt(delay) || 15) * 1000;
                            await new Promise(resolve => setTimeout(resolve, delayMs));
                        }
                    } catch (err) {
                        progress.logs.push({ type: 'error', message: `Failed to send to ${email}: ${err.message}` });
                    }
                }

                progress.status = progress.stopRequested ? 'stopped' : 'completed';
                progress.logs.push({ 
                    type: progress.status === 'completed' ? 'success' : 'warning', 
                    message: `Automation ${progress.status}. Total sent: ${progress.emailsSentCount}` 
                });

            } catch (error) {
                logger.error('Auto Email Automation Error:', error);
                progress.status = 'failed';
                progress.logs.push({ type: 'error', message: `Critical failure: ${error.message}` });
            }
        })();

        res.json({ success: true, campaignId });
    });

    // POST /admin/auto-email/stop/:campaignId - Stop the process
    router.post('/admin/auto-email/stop/:campaignId', isAuthenticated, isAdmin, (req, res) => {
        const { campaignId } = req.params;
        const progress = global.autoEmailCampaigns.get(campaignId);

        if (progress) {
            progress.stopRequested = true;
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, error: 'Campaign not found' });
        }
    });

    // GET /admin/auto-email/status/:campaignId - Get status
    router.get('/admin/auto-email/status/:campaignId', isAuthenticated, isAdmin, (req, res) => {
        const { campaignId } = req.params;
        const progress = global.autoEmailCampaigns.get(campaignId);

        if (progress) {
            res.json({ success: true, progress });
        } else {
            res.status(404).json({ success: false, error: 'Campaign not found' });
        }
    });

    // Test Email Route
    router.post('/admin/auto-email/test', isAuthenticated, isAdmin, async (req, res) => {
        const { email, templateId } = req.body;
        
        if (!email || !templateId) {
            return res.status(400).json({ success: false, error: 'Email and Template ID are required' });
        }
        
        try {
            // Get template content
            const content = getTemplateContent(templateId);
            
            if (!content) {
                return res.status(404).json({ success: false, error: 'Template not found' });
            }
            
            // Send test email
            await sendAutoEmail(email, content.subject, content.html || content.message);
            
            res.json({ success: true, message: 'Test email sent successfully' });
        } catch (error) {
            logger.error('Error in test email route:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.use('/', router);
};
