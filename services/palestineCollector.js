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
        this.activePage = null;
        this.shouldStop = false;
    }

    async initBrowser(forceFresh = false) {
        if (!this.browser) {
            const path = require('path');
            const fs = require('fs');
            const userDataDir = path.join(process.cwd(), '.browser-data');
            
            // If we are stuck in a loop, clearing the session data is often the only way
            if (forceFresh && fs.existsSync(userDataDir)) {
                this.addLog('[Playwright] ⚠️ Stuck loop detected. Clearing browser session data...', 'warn');
                try {
                    fs.rmSync(userDataDir, { recursive: true, force: true });
                } catch (e) {
                    this.addLog(`[Playwright] Failed to clear session data: ${e.message}`, 'error');
                }
            }

            if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

            this.addLog('[Playwright] Launching Persistent Chrome (Stealth Mode)...');
            
            this.browser = await chromium.launchPersistentContext(userDataDir, {
                headless: false,
                channel: 'chrome',
                args: [
                    '--window-position=0,0',
                    '--window-size=1920,1080',
                    '--start-maximized',
                    '--disable-notifications',
                    '--no-first-run',
                    '--disable-blink-features=AutomationControlled',
                    // REMOVED: --no-sandbox, --disable-setuid-sandbox as they trigger warnings
                    // REMOVED: --disable-web-security as it can be a bot signal
                ],
                ignoreDefaultArgs: ['--enable-automation'],
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                viewport: { width: 1920, height: 1080 },
                deviceScaleFactor: 1,
                hasTouch: false,
                isMobile: false,
                javaScriptEnabled: true,
                locale: 'en-US,ar-PS',
                timezoneId: 'Asia/Gaza'
            });

            this.context = this.browser; 
            
            // Set default timeouts
            this.context.setDefaultTimeout(60000);
            this.context.setDefaultNavigationTimeout(60000);

            await this.context.addInitScript(() => {
                // 1. Fully mask webdriver
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                
                // 2. Mock hardware concurrency and languages
                Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
                Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en', 'ar'] });

                // 3. Mock plugins (Empty but present, like real Chrome)
                Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });

                // 4. Mock permissions
                const originalQuery = window.navigator.permissions.query;
                window.navigator.permissions.query = (parameters) => (
                    parameters.name === 'notifications' ?
                        Promise.resolve({ state: Notification.permission }) :
                        originalQuery(parameters)
                );

                // 5. Subtle Chrome identification
                window.chrome = {
                    runtime: {},
                    loadTimes: function() {},
                    csi: function() {},
                    app: {}
                };

                // 6. WebGL Vendor/Renderer masking
                const getParameter = WebGLRenderingContext.prototype.getParameter;
                WebGLRenderingContext.prototype.getParameter = function(parameter) {
                    if (parameter === 37445) return 'Intel Inc.';
                    if (parameter === 37446) return 'Intel(R) Iris(TM) Graphics 6100';
                    return getParameter.apply(this, arguments);
                };
            });
            
            this.addLog('[Playwright] Stability Context Ready');
        }
    }

    /**
     * Consolidates challenge handling (Auto + Manual Fallback)
     */
    async handleChallenge(page, contextName = 'General') {
        let title = '';
        try { title = await page.title(); } catch (e) { title = 'Error'; }
        
        const checkChallenge = async () => {
            try {
                const currentTitle = await page.title();
                const content = await page.content();
                return currentTitle.includes('Just a moment') || 
                       currentTitle.includes('Cloudflare') || 
                       currentTitle.includes('Security Check') ||
                       content.includes('cf-turnstile') ||
                       content.includes('challenges.cloudflare.com') ||
                       currentTitle === 'Error';
            } catch (e) {
                return true;
            }
        };

        if (!(await checkChallenge())) return true;

        this.addLog(`[Jobs.ps Playwright] [${contextName}] 🛡️ Security challenge detected.`, 'warn');

        // 1. Try Auto-solve first (5 attempts)
        for (let i = 0; i < 5; i++) {
            this.addLog(`[Jobs.ps Playwright] [${contextName}] Auto-solve attempt ${i+1}/5...`);
            
            try {
                const frames = page.frames();
                for (const frame of frames) {
                    try {
                        const fContent = await frame.content().catch(() => '');
                        if (fContent.includes('cf-turnstile') || frame.url().includes('challenges.cloudflare.com')) {
                            const checkbox = await frame.$('#challenge-stage, .ctp-checkbox-container, .cf-turnstile-wrapper');
                            if (checkbox) {
                                const rect = await checkbox.boundingBox();
                                if (rect) {
                                    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2, { steps: 15 });
                                    await page.waitForTimeout(500);
                                    await page.mouse.click(rect.x + rect.width / 2, rect.y + rect.height / 2);
                                    await page.waitForTimeout(5000);
                                }
                            }
                        }
                    } catch (frameErr) {}
                }
            } catch (e) {}

            await page.waitForTimeout(3000);
            if (!(await checkChallenge())) {
                this.addLog(`[Jobs.ps Playwright] [${contextName}] ✅ Auto-solve successful!`);
                return true;
            }
        }

        // 2. Manual Fallback
        this.addLog(`[Jobs.ps Playwright] [${contextName}] ⚠️ AUTO-SOLVE FAILED. SWITCHING TO MANUAL MODE.`, 'warn');
        this.addLog(`[Jobs.ps Playwright] 🔴 ATTENTION: Please solve the Cloudflare challenge in the browser window NOW!`, 'error');
        this.addLog(`[Jobs.ps Playwright] Waiting for manual verification... (Max 2 minutes)`);

        const startTime = Date.now();
        const timeout = 120000; // 2 minutes

        while (Date.now() - startTime < timeout) {
            if (this.shouldStop) return false;
            
            await page.waitForTimeout(3000);
            if (!(await checkChallenge())) {
                this.addLog(`[Jobs.ps Playwright] [${contextName}] 🎉 Solve detected! Verifying session stability...`, 'success');
                
                // CRITICAL: Wait for the page to actually load after the challenge clears
                try {
                    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
                    
                    // If we are still on a challenge-like page or the loop continues, try a reload
                    if (await checkChallenge()) {
                        this.addLog(`[Jobs.ps Playwright] Loop detected. Forcing page reload...`, 'warn');
                        await page.reload({ waitUntil: 'domcontentloaded' });
                        await page.waitForTimeout(5000);
                    }
                } catch (e) {}

                if (!(await checkChallenge())) {
                    this.addLog(`[Jobs.ps Playwright] [${contextName}] ✅ Manual verification confirmed! Proceeding...`, 'success');
                    return true;
                }
            }

            // Periodic reminder
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            if (elapsed > 0 && elapsed % 20 === 0) {
                this.addLog(`[Jobs.ps Playwright] Still waiting for manual solve... (${elapsed}s elapsed). Please ensure you click the checkbox.`, 'warn');
            }
        }

        this.addLog(`[Jobs.ps Playwright] [${contextName}] ❌ Manual solve timed out.`, 'error');
        return false;
    }

    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.context = null;
            this.addLog('[Playwright] Browser closed');
        }
    }

    async connectToRealBrowser(silent = false) {
        if (!silent) {
            this.addLog('[Playwright] 🔴 REAL BROWSER BRIDGE MODE', 'error');
            this.addLog('[Playwright] ', 'error');
            this.addLog('[Playwright] ⚠️  MANUAL SETUP REQUIRED - FOLLOW THESE STEPS EXACTLY:', 'error');
            this.addLog('[Playwright] ', 'error');
            this.addLog('[Playwright] Step 1: Force-close ALL Chrome processes first!', 'error');
            this.addLog('[Playwright]         Run this in PowerShell:  Stop-Process -Name "chrome" -ErrorAction SilentlyContinue', 'error');
            this.addLog('[Playwright] ', 'error');
            this.addLog('[Playwright] Step 2: Open a new PowerShell as Administrator and run:', 'error');
            this.addLog('[Playwright]         & "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\\temp\\chrome-debug"', 'error');
            this.addLog('[Playwright] ', 'error');
            this.addLog('[Playwright] Step 3: In the new Chrome window, navigate to: https://www.jobs.ps/', 'error');
            this.addLog('[Playwright] Step 4: Solve any CAPTCHA manually', 'error');
            this.addLog('[Playwright] Step 5: PRESS ENTER in this terminal ONLY AFTER the homepage is fully loaded', 'error');
            this.addLog('[Playwright] ', 'error');
            this.addLog('[Playwright] Waiting for you to complete the steps above...', 'error');
            
            const readline = require('readline');
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            
            await new Promise(resolve => {
                rl.question('[Playwright] Press ENTER to attempt connection...', () => {
                    rl.close();
                    resolve();
                });
            });
        }
        
        if (silent) {
            this.addLog('[Playwright] Checking for existing Real Browser Bridge (localhost:9222)...');
        } else {
            this.addLog('[Playwright] Attempting to connect to http://localhost:9222 ...');
        }
        
        try {
            // Connect to the real Chrome via CDP
            this.browser = await chromium.connectOverCDP('http://localhost:9222', { timeout: silent ? 3000 : 10000 });
            
            const contexts = this.browser.contexts();
            this.context = contexts[0] || await this.browser.newContext();
            
            const pages = this.context.pages();
            let targetPage = pages.find(p => p.url().includes('jobs.ps'));
            
            if (targetPage) {
                this.addLog('[Playwright] ✅ Found existing Jobs.ps tab!');
                this.activePage = targetPage;
            } else {
                this.addLog('[Playwright] ⚠️ Jobs.ps tab not found. Opening a new one in your Chrome...');
                this.activePage = await this.context.newPage();
                await this.activePage.goto('https://www.jobs.ps/', { waitUntil: 'load' });
            }
            
            this.addLog('[Playwright] ✅ Successfully connected! Using your real human session.');
            return true;
        } catch (error) {
            if (!silent) {
                this.addLog(`[Playwright] ❌ Connection failed: ${error.message}`, 'error');
                this.addLog('[Playwright] Likely cause: Chrome was not started with --remote-debugging-port=9222 or was not fully closed first.', 'error');
            }
            return false;
        }
    }

    async collect(source, options = {}) {
        this.addLog(`[Jobs.ps Playwright] Starting scan for: ${source.name}${options.isAuto ? ' (Automation Mode)' : ''}`);
        this.shouldStop = false; 
        
        const rawJobs = [];
        let pagesToScan = options.maxPages || options.scanDepthLimit || source.config?.pages || 1;

        if (options.isAuto) {
            pagesToScan = 1;
        }

        // FIRST: Try a SILENT Real Browser Bridge (in case debug Chrome is already open)
        this.addLog('[Playwright] Attempting Silent Browser Bridge check...');
        let realBrowserConnected = await this.connectToRealBrowser(true);
        
        if (!realBrowserConnected) {
            this.addLog('[Playwright] No existing Bridge found, trying Standard Stealth Automation...');
            
            let loopCount = 0;
            const MAX_LOOPS = 2;

            while (loopCount < MAX_LOOPS) {
                try {
                    await this.initBrowser(loopCount > 0);

                    const mainPage = await this.context.newPage();
                    this.addLog(`[Jobs.ps Playwright] Warming up session via homepage...`);
                    
                    try {
                        await mainPage.goto('https://www.jobs.ps/', { waitUntil: 'load', timeout: 60000 });
                    } catch (gotoError) {}
                    
                    const warmedUp = await this.handleChallenge(mainPage, 'Warm-up');
                    
                    // IF AUTOMATION FAILS (Warm-up blocked), ESCALATE to Manual Bridge
                    if (!warmedUp) {
                        this.addLog(`[Jobs.ps Playwright] Automation blocked. Escalating to Real Browser Bridge...`, 'error');
                        await mainPage.close();
                        await this.closeBrowser();
                        
                        realBrowserConnected = await this.connectToRealBrowser(false);
                        if (realBrowserConnected) break; // Success via Bridge

                        loopCount++;
                        if (loopCount < MAX_LOOPS) continue;
                        return [];
                    }

                    await mainPage.close();
                    break;
                } catch (error) {
                    this.addLog(`[Jobs.ps Playwright] Initial setup failure: ${error.message}`, 'error');
                    await this.closeBrowser();
                    loopCount++;
                    if (loopCount >= MAX_LOOPS) return [];
                }
            }
        }

        if (realBrowserConnected) {
            this.addLog('[Playwright] Real Browser Bridge active - using your verified Chrome');
            try {
                if (this.activePage) {
                    await this.activePage.bringToFront();
                    await this.handleChallenge(this.activePage, 'Bridge Check');
                }
            } catch (e) {}
        }

        try {
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
            
            // Navigate with retry logic
            let retries = 3;
            let success = false;
            
            while (retries > 0 && !success) {
                try {
                    this.addLog(`[Jobs.ps Playwright] Navigating to ${url} (attempt ${4 - retries}/3)`);
                    await page.goto(url, { 
                        waitUntil: 'domcontentloaded', 
                        timeout: 90000 
                    });

                    // Enhanced Bot/Security wall bypass
                    const handled = await this.handleChallenge(page, 'Fetch');
                    if (!handled) {
                        this.addLog(`[Jobs.ps Playwright] Security wall could not be bypassed for ${url}.`, 'error');
                        await page.close();
                        return [];
                    }
                    
                    success = true;
                } catch (navError) {
                    retries--;
                    if (retries === 0) throw navError;
                    this.addLog(`[Jobs.ps Playwright] Navigation failed or blocked (${navError.message}), retrying in 10s...`);
                    await page.waitForTimeout(10000);
                }
            }
            
            // Wait for the job listings to appear with smart detection
            this.addLog(`[Jobs.ps Playwright] Waiting for job listings...`);
            try {
                // Wait for either the job row OR the "no results" message
                await Promise.race([
                    page.waitForSelector(selectors.job_item, { timeout: 30000 }),
                    page.waitForSelector('.no-results, .alert-warning, .empty-state, .list-3', { timeout: 30000 }).catch(() => null)
                ]);
            } catch (waitError) {
                const finalContent = await page.content();
                this.addLog(`[Jobs.ps Playwright] Timeout waiting for selectors. Current Title: "${await page.title()}". Content Length: ${finalContent.length}`, 'error');
                
                // Log first 200 chars of body to see what's there
                const bodyPreview = await page.evaluate(() => document.body.innerText.substring(0, 200));
                this.addLog(`[Jobs.ps Playwright] Body Preview: ${bodyPreview.replace(/\n/g, ' ')}`);
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
                    const company = companyEl ? companyEl.textContent.trim() : ''; // Removed 'Jobs.ps Source' fallback
                    const location = locationEl ? locationEl.textContent.trim() : 'Palestine';
                    const link = item.href || item.getAttribute('href') || '';
                    
                    // Email discovery in item (mailto or text)
                    let foundEmail = null;
                    const mailtoEl = item.querySelector('a[href^="mailto:"]');
                    if (mailtoEl) {
                        foundEmail = mailtoEl.getAttribute('href').replace('mailto:', '').split('?')[0].trim();
                    } else {
                        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
                        const textMatch = item.textContent.match(emailRegex);
                        if (textMatch) foundEmail = textMatch[0];
                    }
                    
                    if (title && link) {
                        const finalLink = link.startsWith('http') ? link : `https://www.jobs.ps${link}`;
                        jobs.push({
                            title,
                            company,
                            location,
                            link: finalLink,
                            email: foundEmail,
                            raw_payload: {
                                company_name: company,
                                location: location,
                                page_logo: item.querySelector('img') ? item.querySelector('img').src : null
                            }
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
                        
                        await jobPage.goto(job.link, { waitUntil: 'domcontentloaded', timeout: 90000 });

                        // Check for Bot/Security wall on deep scan
                        const deepHandled = await this.handleChallenge(jobPage, `Deep Scan: ${job.title}`);
                        if (!deepHandled) {
                            this.addLog(`[Jobs.ps Playwright] Skipping job ${job.title} due to security challenge.`, 'warn');
                            await jobPage.close();
                            return null;
                        }
                        
                        const fullData = await jobPage.evaluate(() => {
                            // Target specific high-value containers first
                            const highValueSelectors = [
                                '.job-details', 
                                '.job-info-table', 
                                '.job-description', 
                                '.vacancy-details',
                                '.post-content',
                                '.description-content',
                                '.list-3',
                                '.view-content',
                                'article'
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
                                            const postedMatch = text.match(/(?:Posted on|Published|تاريخ النشر|نشر في):?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
                                            if (postedMatch) dateText = postedMatch[1];
                                        }

                                        // Try to find Deadline
                                        if (!deadlineText) {
                                            const deadlineMatch = text.match(/(?:Deadline|Expiry|Closing|آخر موعد|تاريخ الانتهاء):?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
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
                                        const match = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
                                        if (match) dateText = match[0];
                                    }
                                    if (text.includes('الانتهاء') || text.includes('Deadline') || text.includes('Expiry')) {
                                        const match = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
                                        if (match) deadlineText = match[0];
                                    }
                                });
                            }

                            // 3. Broad Regex fallback
                            if (!dateText || !deadlineText) {
                                const bodyText = document.body.innerText;
                                if (!dateText) {
                                    const match = bodyText.match(/(?:Posted on|Published|نشر في):?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
                                    if (match) dateText = match[1];
                                }
                                if (!deadlineText) {
                                    const match = bodyText.match(/(?:Deadline|Expiry|Closing|آخر موعد):?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
                                    if (match) deadlineText = match[1];
                                }
                            }
                            
                            const logo = document.querySelector('.employer-logo img, .company-logo img, img.logo, .employer-brand img')?.src;
                            const company = document.querySelector('.employer-name, .company-name, .job-company, h1.company, h2.company, .post-content h2, .job-details h2')?.innerText;
                            
                            return { 
                                full_text: [...new Set(contentParts)].join('\n\n') || document.querySelector('.main-content, #content, .content')?.innerText || '', 
                                page_logo: logo, 
                                page_company: company,
                                page_date: dateText,
                                page_deadline: deadlineText,
                                page_email: (() => {
                                    // 1. Try mailto links
                                    const mailto = document.querySelector('a[href^="mailto:"]');
                                    if (mailto) return mailto.href.replace('mailto:', '').split('?')[0].trim();
                                    
                                    // 2. Try to find in high-value selectors
                                    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
                                    for (const sel of highValueSelectors) {
                                        const el = document.querySelector(sel);
                                        if (el && el.innerText) {
                                            const match = el.innerText.match(emailRegex);
                                            if (match) return match[0];
                                        }
                                    }
                                    
                                    // 3. Last resort: Body search
                                    const bodyMatch = document.body.innerText.match(emailRegex);
                                    return bodyMatch ? bodyMatch[0] : null;
                                })()
                            };
                        });

                        const linkId = job.link.split('/').pop() || 'unknown';
                        const shortHash = Buffer.from(job.link).toString('base64').slice(-15);
                        
                        // --- COMPANY VALIDATION & CLEANUP ---
                        let finalCompany = (fullData.page_company || job.company || '').trim();
                        
                        // Blacklist check: Never allow "Jobs.ps Source" or generic site names
                        const blacklistedNames = ['jobs.ps source', 'jobs.ps', 'job.ps', 'jobs ps', 'aggregator'];
                        if (blacklistedNames.includes(finalCompany.toLowerCase())) {
                            finalCompany = '';
                        }
                        
                        // If still empty after deep scan, skip this job (Guard against bad data)
                        if (!finalCompany || finalCompany.length < 2) {
                            this.addLog(`[Jobs.ps Playwright] Skipping job "${job.title}" - Invalid company name detected.`, 'warn');
                            await jobPage.close();
                            return null;
                        }

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
                                company_name: finalCompany,
                                external_url: job.link,
                                external_source: 'Jobs.ps',
                                location: job.location,
                                email: fullData.page_email || job.email, // Use deep scan email, fallback to listing email
                                job_text: fullData.full_text,
                                created_at: createdAt,
                                deadline: deadline,
                                raw_payload: {
                                    ...job.raw_payload,
                                    source_name: source.name,
                                    fetch_date: new Date().toISOString(),
                                    extracted_company: finalCompany,
                                    extracted_location: job.location,
                                    page_logo: fullData.page_logo,
                                    extracted_date: fullData.page_date,
                                    extracted_deadline: fullData.page_deadline,
                                    external_source: 'Jobs.ps'
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
