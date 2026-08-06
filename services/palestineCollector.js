const { chromium } = require('playwright');
const logger = require('../utils/logger');

/**
 * Jobs.ps Playwright Browser Engine
 * Uses real browser automation to bypass 403 Forbidden errors.
 */
class PalestineCollector {
    constructor(addLog, dbPool) {
        this.addLog = addLog;
        this.dbPool = dbPool;
        this.browser = null;
        this.context = null;
        this.shouldStop = false;
    }

    async initBrowser() {
        if (!this.browser) {
            this.addLog('[Playwright] Launching headless browser...');
            this.browser = await chromium.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            });
            
            this.context = await this.browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                viewport: { width: 1920, height: 1080 },
                extraHTTPHeaders: {
                    'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1'
                }
            });
            
            this.addLog('[Playwright] Browser ready');
        }
    }

    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.context = null;
            this.addLog('[Playwright] Browser closed');
        }
    }

    async collect(source, options = {}) {
        this.addLog(`[Jobs.ps Playwright] Starting scan for: ${source.name}${options.isAuto ? ' (Automation Mode)' : ''}`);
        this.shouldStop = false; // Reset stop signal at start
        
        const rawJobs = [];
        let pagesToScan = options.maxPages || options.scanDepthLimit || source.config?.pages || 1;

        // Optimization: In automation mode, we only need the first page for NEW jobs
        if (options.isAuto) {
            pagesToScan = 1;
        }

        try {
            await this.initBrowser();

            for (let page = 1; page <= pagesToScan; page++) {
                if (this.shouldStop) break;

                const url = page === 1 ? source.base_url : `${source.base_url}${source.base_url.includes('?') ? '&' : '?'}page=${page}`;
                this.addLog(`[Jobs.ps Playwright] Fetching page ${page}: ${url}`);
                
                const pageJobs = await this.fetchWithBrowser(source, url, options);
                if (pageJobs.length === 0) {
                    this.addLog(`[Jobs.ps Playwright] No jobs found on page ${page}. Ending scan.`);
                    break; 
                }
                
                // Check if we should stop based on date (only if source is sorted)
                if (options.lookbackDate && options.isSorted) {
                    const hasStaleJobs = pageJobs.some(job => new Date(job.created_at) < options.lookbackDate);
                    if (hasStaleJobs) {
                        this.addLog(`[Jobs.ps Playwright] Smart Guard: Found jobs older than lookback date on a sorted source. Stopping scan.`);
                        rawJobs.push(...pageJobs.filter(job => new Date(job.created_at) >= options.lookbackDate));
                        break;
                    }
                }
                
                // Immediate yield/stage (Optimization #3)
                if (this.onJobsFound) {
                    await this.onJobsFound(pageJobs, source.id);
                }
                
                rawJobs.push(...pageJobs);
                
                // Human-like delay between pages
                if (page < pagesToScan) {
                    const delay = Math.floor(Math.random() * (5000 - 2000 + 1) + 2000);
                    this.addLog(`[Jobs.ps Playwright] Waiting ${delay}ms before next page...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            
            this.addLog(`[Jobs.ps Playwright] Completed scan. Total found: ${rawJobs.length}`);
            return rawJobs;
        } catch (error) {
            this.addLog(`[Jobs.ps Playwright] Critical failure scanning ${source.name}: ${error.message}`, 'error');
            return [];
        } finally {
            await this.closeBrowser();
        }
    }

    async fetchWithBrowser(source, url, options = {}) {
        const { selectors } = source.config;
        const pageJobs = [];
        
        try {
            const page = await this.context.newPage();
            
            // Optimization: Block images and CSS to save bandwidth and speed up loading
            await page.route('**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}', route => route.abort());
            
            // Navigate with retry logic
            let retries = 3;
            let success = false;
            
            while (retries > 0 && !success) {
                try {
                    this.addLog(`[Jobs.ps Playwright] Navigating to ${url} (attempt ${4 - retries}/3)`);
                    await page.goto(url, { 
                        waitUntil: 'domcontentloaded', 
                        timeout: 30000 
                    });

                    // Check for Bot/Security wall
                    const content = await page.content();
                    if (content.includes('security verification') || content.includes('verifying you are not a bot') || content.includes('Cloudflare')) {
                        this.addLog('[Jobs.ps Playwright] Security verification detected. Waiting for bypass...', 'warn');
                        await page.waitForTimeout(5000); // Wait 5s for potential auto-bypass
                        
                        // Check again
                        const updatedContent = await page.content();
                        if (updatedContent.includes('security verification')) {
                            throw new Error('Blocked by anti-bot wall');
                        }
                    }
                    
                    success = true;
                } catch (navError) {
                    retries--;
                    if (retries === 0) throw navError;
                    this.addLog(`[Jobs.ps Playwright] Navigation failed or blocked, retrying in 5s...`);
                    await page.waitForTimeout(5000);
                }
            }
            
            // Wait for the job listings to appear
            this.addLog(`[Jobs.ps Playwright] Waiting for job listings...`);
            try {
                await page.waitForSelector(selectors.job_item, { timeout: 15000 });
            } catch (waitError) {
                // Check if the page actually has NO jobs (e.g. end of pagination)
                const hasJobs = await page.evaluate((sel) => {
                    return document.querySelectorAll(sel.job_item).length > 0;
                }, selectors);
                
                if (!hasJobs) {
                    this.addLog(`[Jobs.ps Playwright] No jobs found on this page (likely end of pagination)`);
                    await page.close();
                    return [];
                }
                throw waitError; // Rethrow if it's a real timeout error
            }
            
            // Extract data using page.evaluate for better performance
            const extractedJobs = await page.evaluate((sel) => {
                const jobs = [];
                const items = document.querySelectorAll(sel.job_item);
                
                items.forEach(item => {
                    const titleEl = item.querySelector(sel.title);
                    const companyEl = item.querySelector(sel.company);
                    const locationEl = item.querySelector(sel.location);
                    
                    const title = titleEl ? titleEl.textContent.trim() : '';
                    const company = companyEl ? companyEl.textContent.trim() : 'Jobs.ps Source';
                    const location = locationEl ? locationEl.textContent.trim() : 'Palestine';
                    const link = item.href || item.getAttribute('href') || '';
                    
                    if (title && link) {
                        jobs.push({
                            title,
                            company,
                            location,
                            link: link.startsWith('http') ? link : `https://www.jobs.ps${link}`
                        });
                    }
                });
                
                return jobs;
            }, selectors);
            
            this.addLog(`[Jobs.ps Playwright] Extracted ${extractedJobs.length} jobs from page. Starting parallel deep extraction (Batch size: 2)...`);
            
            // Deep extraction: Visit job pages in parallel batches
            const BATCH_SIZE = 2; // Reduced from 5 to avoid triggering anti-bot
            let consecutiveDuplicates = 0;
            let consecutiveStale = 0;
            const DUPLICATE_THRESHOLD = options.isAuto ? 5 : 10; // Stricter stop in automation mode
            const STALE_THRESHOLD = 5; // Stop if we hit 5 consecutive jobs older than lookback

            if (options.isAuto) {
                this.addLog(`[Jobs.ps Playwright] Daily Mode: Fast Stop enabled (Threshold: ${DUPLICATE_THRESHOLD} duplicates)`);
            }

            for (let i = 0; i < extractedJobs.length; i += BATCH_SIZE) {
                if (this.shouldStop) break;
                
                const batch = extractedJobs.slice(i, i + BATCH_SIZE);
                const batchResults = await Promise.all(batch.map(async (job) => {
                    if (this.shouldStop) return null;

                    // 1. Deep Date Check (Before deep scan if possible, otherwise after)
                    // Note: Jobs.ps usually doesn't show dates on listing pages, only deep pages.
                    
                    // 2. High-Confidence Duplicate Check (Before Deep Scan)
                    try {
                        const linkId = job.link.split('/').pop() || 'unknown';
                        const shortHash = Buffer.from(job.link).toString('base64').slice(-15);
                        const externalId = `jobsps_${linkId}_${shortHash}`;

                        // Check 1: External ID in raw_jobs
                        const rawCheck = await this.dbPool.query(
                            "SELECT id FROM raw_jobs WHERE external_id = $1",
                            [externalId]
                        );

                        if (rawCheck.rows.length > 0) {
                            return { status: 'duplicate', title: job.title, reason: 'raw_id_match' };
                        }

                        // Check 2: External ID or Semantic match in main jobs table
                        // We use the same normalization as the service for accuracy
                        const semanticCheck = await this.dbPool.query(
                            `SELECT id FROM jobs 
                             WHERE external_id = $1 
                             OR (LOWER(title) = LOWER($2) AND LOWER(external_company_name) = LOWER($3) AND LOWER(city) = LOWER($4))
                             LIMIT 1`,
                            [externalId, job.title, job.company, job.location]
                        );

                        if (semanticCheck.rows.length > 0) {
                            return { status: 'duplicate', title: job.title, reason: 'semantic_match' };
                        }
                    } catch (e) { 
                        this.addLog(`[Jobs.ps Playwright] Pre-check error for ${job.title}: ${e.message}`, 'debug');
                    }

                    // 2. Deep Scan if not duplicate
                    try {
                        const jobPage = await this.context.newPage();
                        await jobPage.route('**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}', route => route.abort());
                        
                        await jobPage.goto(job.link, { waitUntil: 'domcontentloaded', timeout: 30000 });

                        // Check for Bot/Security wall on deep scan
                        const pageContent = await jobPage.content();
                        if (pageContent.includes('security verification') || pageContent.includes('Cloudflare')) {
                            this.addLog(`[Jobs.ps Playwright] Security wall on deep scan for ${job.title}. Waiting...`, 'warn');
                            await jobPage.waitForTimeout(5000);
                        }
                        
                        const fullData = await jobPage.evaluate(() => {
                            // Target specific high-value containers first
                            const highValueSelectors = [
                                '.job-details', 
                                '.job-info-table', 
                                '.job-description', 
                                '.vacancy-details',
                                '.post-content',
                                '.description-content'
                            ];
                            
                            let contentParts = [];
                            let dateText = null;
                            let deadlineText = null;
                            
                            // 1. Try to get specific high-value sections
                            highValueSelectors.forEach(sel => {
                                const elements = document.querySelectorAll(sel);
                                elements.forEach(el => {
                                    if (el && el.innerText && el.innerText.trim().length > 50) {
                                        const text = el.innerText.trim();
                                        contentParts.push(text);
                                        
                                        // Try to find Posted Date
                                        if (!dateText) {
                                            const postedMatch = text.match(/(?:Posted on|Published|تاريخ النشر|نشر في):?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);
                                            if (postedMatch) dateText = postedMatch[1];
                                        }

                                        // Try to find Deadline
                                        if (!deadlineText) {
                                            const deadlineMatch = text.match(/(?:Deadline|Expiry|Closing|آخر موعد|تاريخ الانتهاء):?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);
                                            if (deadlineMatch) deadlineText = deadlineMatch[1];
                                        }
                                    }
                                });
                            });

                            // 2. Specific check for Jobs.ps date containers (usually in a sidebar or info box)
                            if (!dateText || !deadlineText) {
                                const infoItems = document.querySelectorAll('.job-info-table li, .job-details li, .meta-item');
                                infoItems.forEach(item => {
                                    const text = item.innerText.trim();
                                    if (text.includes('النشر') || text.includes('Posted')) {
                                        const match = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/);
                                        if (match) dateText = match[0];
                                    }
                                    if (text.includes('الانتهاء') || text.includes('Deadline') || text.includes('Expiry')) {
                                        const match = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/);
                                        if (match) deadlineText = match[0];
                                    }
                                });
                            }

                            // 3. Broad Regex fallback
                            if (!dateText || !deadlineText) {
                                const bodyText = document.body.innerText;
                                if (!dateText) {
                                    const match = bodyText.match(/(?:Posted on|Published|نشر في):?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);
                                    if (match) dateText = match[1];
                                }
                                if (!deadlineText) {
                                    const match = bodyText.match(/(?:Deadline|Expiry|Closing|آخر موعد):?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);
                                    if (match) deadlineText = match[1];
                                }
                            }
                            
                            const logo = document.querySelector('.employer-logo img, .company-logo img, img.logo, .employer-brand img')?.src;
                            const company = document.querySelector('.employer-name, .company-name, .job-company, h1.company')?.innerText;
                            
                            return { 
                                full_text: [...new Set(contentParts)].join('\n\n') || '', 
                                page_logo: logo, 
                                page_company: company,
                                page_date: dateText,
                                page_deadline: deadlineText
                            };
                        });

                        const linkId = job.link.split('/').pop() || 'unknown';
                        const shortHash = Buffer.from(job.link).toString('base64').slice(-15);
                        
                        // Parse date if found
                        let createdAt = new Date().toISOString();
                        let deadline = null;

                        // 1. Try to parse Posted Date
                        if (fullData.page_date) {
                            try {
                                const parsedDate = new Date(fullData.page_date);
                                if (!isNaN(parsedDate.getTime())) {
                                    createdAt = parsedDate.toISOString();
                                }
                            } catch (e) {}
                        }

                        // 2. Try to parse Deadline
                        if (fullData.page_deadline) {
                            try {
                                const parsedDeadline = new Date(fullData.page_deadline);
                                if (!isNaN(parsedDeadline.getTime())) {
                                    deadline = parsedDeadline.toISOString();
                                    
                                    // Fallback: If no posted date, use deadline - 14 days as a rough estimate
                                    if (!fullData.page_date) {
                                        const estimatedPosted = new Date(parsedDeadline);
                                        estimatedPosted.setDate(estimatedPosted.getDate() - 14);
                                        createdAt = estimatedPosted.toISOString();
                                    }
                                }
                            } catch (e) {}
                        }

                        // 3. Last Resort: If the deadline itself is way in the past, force the createdAt to be old
                        // This ensures the Stale check catches it even if parsing is slightly off
                        if (deadline && new Date(deadline) < new Date()) {
                            const deadlineDate = new Date(deadline);
                            if (new Date(createdAt) > deadlineDate) {
                                createdAt = deadlineDate.toISOString();
                            }
                        }

                        const result = {
                            status: 'new',
                            data: {
                                external_id: `jobsps_${linkId}_${shortHash}`,
                                title: job.title,
                                company_name: fullData.page_company || job.company,
                                external_url: job.link,
                                external_source: 'Jobs.ps',
                                location: job.location,
                                job_text: fullData.full_text,
                                created_at: createdAt,
                                deadline: deadline,
                                raw_payload: {
                                    source_name: source.name,
                                    fetch_date: new Date().toISOString(),
                                    extracted_company: fullData.page_company || job.company,
                                    extracted_location: job.location,
                                    page_logo: fullData.page_logo,
                                    extracted_date: fullData.page_date,
                                    extracted_deadline: fullData.page_deadline
                                }
                            }
                        };
                        
                        await jobPage.close();
                        return result;
                    } catch (deepErr) {
                        return { status: 'failed', title: job.title, error: deepErr.message };
                    }
                }));

                // Process results and handle smart stop
                for (const res of batchResults) {
                    if (!res) continue;

                    // Handle Stale Logic (Smart Guard Buffer)
                    if (res.status === 'new' && options.lookbackDate) {
                        const jobDate = new Date(res.data.created_at);
                        if (jobDate < options.lookbackDate) {
                            consecutiveStale++;
                            this.addLog(`[Jobs.ps Playwright] Stale job found: "${res.title}" (${jobDate.toLocaleDateString()}). Buffer: ${consecutiveStale}/${STALE_THRESHOLD}`, 'debug');
                        } else {
                            consecutiveStale = 0; // Reset on fresh job
                        }
                    }

                    if (res.status === 'duplicate') {
                        consecutiveDuplicates++;
                        this.addLog(`[Jobs.ps Playwright] Skipping duplicate: "${res.title}" (${res.reason})`, 'debug');
                    } else if (res.status === 'new') {
                        consecutiveDuplicates = 0; // Reset counter
                        
                        // Only save if it's not stale (or we haven't hit threshold yet)
                        const isStale = options.lookbackDate && new Date(res.data.created_at) < options.lookbackDate;
                        if (!isStale) {
                            pageJobs.push(res.data);
                        }
                    } else if (res.status === 'failed') {
                        this.addLog(`[Jobs.ps Playwright] Deep scan failed for ${res.title}: ${res.error}`, 'warn');
                    }
                }

                if (consecutiveStale >= STALE_THRESHOLD) {
                    this.addLog(`[Jobs.ps Playwright] Smart Guard: Hit consecutive stale threshold (${STALE_THRESHOLD}). Archive reached. Stopping scan.`);
                    this.shouldStop = true;
                    break;
                }

                if (consecutiveDuplicates >= DUPLICATE_THRESHOLD) {
                    this.addLog(`[Jobs.ps Playwright] Smart Stop: Found ${consecutiveDuplicates} consecutive duplicates. Ending scan for this source.`);
                    break;
                }

                // Add a more human-like delay between batches
                const batchDelay = Math.floor(Math.random() * (3000 - 1000 + 1) + 1000);
                await page.waitForTimeout(batchDelay);
            }
            
            await page.close();
            return pageJobs;
            
        } catch (error) {
            this.addLog(`[Jobs.ps Playwright] Browser extraction failed: ${error.message}`, 'error');
            return [];
        }
    }
}

module.exports = PalestineCollector;
