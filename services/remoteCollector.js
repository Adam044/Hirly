const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

/**
 * Remote Job Collector
 * Fetches high-quality remote jobs from global and regional sources.
 * Sources: We Work Remotely (WWR), Remote OK, etc.
 */
const ARAB_MARKET_KEYWORDS = [
     'palestine', 'palestinian', 'gaza', 'west bank',
     'united arab emirates', 'uae', 'dubai', 'abu dhabi',
     'saudi arabia', 'saudi', 'riyadh', 'jeddah', 'dammam',
     'qatar', 'doha',
     'kuwait',
     'egypt', 'cairo', 'alexandria',
     'oman', 'muscat',
     'bahrain', 'manama',
     'jordan', 'amman',
     'lebanon', 'beirut',
     'iraq', 'baghdad', 'erbil',
     'morocco', 'casablanca', 'rabat', 'marrakech',
     'algeria', 'algiers',
     'tunisia', 'tunis',
     'libya', 'tripoli',
     'sudan', 'khartoum',
     'syria', 'damascus',
     'yemen', 'sana',
     'somalia',
     'djibouti',
     'comoros',
     'mauritania',
     'mena', 'middle east', 'arab world', 'arabic', 'khaleej', 'gulf',
     'worldwide', 'global', 'anywhere', 'remote anywhere', 'any location'
];

 const NON_REMOTE_KEYWORDS = [
     'store manager', 'driver', 'courier', 'cleaner', 'handyman', 'handywoman',
     'technician', 'electrician', 'plumber', 'security guard', 'warehouse',
     'receptionist', 'on-site', 'onsite', 'in-person', 'in person',
     'residential valuer', 'building maintenance', 'merchandiser', 'waiter', 'waitress',
     'bartender', 'chef', 'cook', 'delivery', 'physically', 'local only',
     'curitiba', 'rio de janeiro', 'sao paulo', 'macae', 'rj', 'pr', // Specific leaking physical locations
     'english teacher', 'test', 'apply now', 'send veritas', 'don\'t close website', // Garbage from bad scrapers
     'handy person', 'laborer', 'janitor', 'server', 'hostess', 'retail', 'sales associate'
  ];

/**
 * Remote Job Collector - MAX POWER VERSION
 * Fetches high-quality remote jobs from global and regional sources.
 * Sources: WWR, Remote OK, Remotive, Working Nomads, Himalayas, Jobspresso.
 */
class RemoteCollector {
    constructor(addLog, dbPool) {
        this.addLog = addLog;
        this.dbPool = dbPool;
        this.shouldStop = false;
        this.onJobsFound = null; 
        
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/xml, application/xml'
        };
    }

    /**
     * Strict validation to ensure job is actually remote
     */
    isStrictlyRemote(job) {
        const title = (job.title || '').toLowerCase();
        const location = (job.location || '').toLowerCase();
        const text = (job.job_text || '').toLowerCase();

        // 1. Check for physical-only job titles/keywords
        const hasNonRemoteKeyword = NON_REMOTE_KEYWORDS.some(k => 
            title.includes(k) || (text.length < 500 && text.includes(k))
        );
        if (hasNonRemoteKeyword) return false;

        // 2. Location validation
        // If location contains specific physical cities without "Remote" or "Worldwide"
        const remoteTerms = ['remote', 'worldwide', 'global', 'anywhere', 'mena', 'work from home', 'telecommute'];
        const isRemoteFriendly = remoteTerms.some(k => location.includes(k) || title.includes(k));

        // If it's a specific city like "Curitiba", "Rio de Janeiro", "New York" AND doesn't mention remote
        // we should be very careful.
        if (!isRemoteFriendly) {
            // If location has a comma (City, State/Country) and no remote terms, it's likely physical
            if (location.includes(',') || location.includes(' - ')) {
                // Check if it's just a country name (which is often okay for remote)
                const isJustCountry = location.split(',').length === 1 && location.split(' ').length <= 2;
                if (!isJustCountry) return false;
            }
        }

        // 3. Special case for Himalayas/Remote OK leakage
        if (title.includes('manager') || title.includes('supervisor')) {
            // These are often physical if they don't explicitly say "Remote"
            if (!isRemoteFriendly) return false;
        }

        return true;
    }

    /**
     * Main collection entry point
     */
    async collect(source, options = {}) {
        this.addLog('🚀 [MAX POWER] Starting Enhanced Remote Jobs aggregation...');
        this.shouldStop = false;
        
        const lookbackDate = options.lookbackDate ? new Date(options.lookbackDate) : null;
        const marketFilter = options.remoteMarketFilter || 'all'; // 'all', 'arab', 'non-arab'

        if (lookbackDate) {
            this.addLog(`📅 Smart Guard: Only pulling jobs since ${lookbackDate.toLocaleDateString()}`);
        }
        
        if (marketFilter !== 'all') {
            this.addLog(`🎯 Market Target: ${marketFilter === 'arab' ? 'Arab World / MENA' : 'Non-Arab / Global West'}`);
        }
        
        const tasks = [
            { name: 'We Work Remotely', method: this.fetchFromWWR.bind(this) },
            { name: 'Remote OK', method: this.fetchFromRemoteOK.bind(this) },
            { name: 'Remotive', method: this.fetchFromRemotive.bind(this) },
            { name: 'Working Nomads', method: this.fetchFromWorkingNomads.bind(this) },
            { name: 'Himalayas', method: this.fetchFromHimalayas.bind(this) },
            { name: 'Jobspresso', method: this.fetchFromJobspresso.bind(this) },
            { name: 'JS Remotely', method: this.fetchFromJSRemotely.bind(this) },
            { name: 'Dribbble', method: this.fetchFromDribbble.bind(this) },
            { name: 'Authentic Jobs', method: this.fetchFromAuthenticJobs.bind(this) },
            { name: 'ProBlogger', method: this.fetchFromProBlogger.bind(this) },
            { name: 'NoDesk', method: this.fetchFromNoDesk.bind(this) },
            { name: 'Remote.co', method: this.fetchFromRemoteCo.bind(this) },
            { name: 'Python Jobs', method: this.fetchFromPythonJobs.bind(this) },
            { name: 'Rails Jobs', method: this.fetchFromRailsJobs.bind(this) },
            { name: 'Crypto Jobs', method: this.fetchFromCryptoJobs.bind(this) }
        ];

        for (const task of tasks) {
            if (this.shouldStop) break;
            
            try {
                this.addLog(`🔍 Fetching from ${task.name}...`);
                let jobs = await task.method();
                
                if (jobs && jobs.length > 0) {
                    // 0. Strict Remote Validation (Kill physical jobs)
                    const beforeRemoteCount = jobs.length;
                    jobs = jobs.filter(job => this.isStrictlyRemote(job));
                    if (jobs.length < beforeRemoteCount) {
                        this.addLog(`🛡️ [${task.name}] Blocked ${beforeRemoteCount - jobs.length} non-remote jobs (Store Managers, Technicians, etc).`);
                    }

                    // 1. Market Filter (Arab vs Non-Arab)
                    if (marketFilter !== 'all') {
                        const originalCount = jobs.length;
                        jobs = jobs.filter(job => {
                            const location = (job.location || '').toLowerCase();
                            const title = (job.title || '').toLowerCase();
                            const desc = (job.job_text || '').toLowerCase();
                            
                            // Check if job explicitly mentions Arab region
                            const arabSpecific = ARAB_MARKET_KEYWORDS.slice(0, 47); // Everything up to 'gulf'
                            const worldwideKeywords = ARAB_MARKET_KEYWORDS.slice(47); // 'worldwide' and onwards
                            
                            const mentionsArab = arabSpecific.some(k => 
                                location.includes(k) || title.includes(k) || desc.includes(k)
                            );
                            
                            // Check if job is Worldwide/Global (which counts as Arab-friendly)
                            const isWorldwide = worldwideKeywords.some(k => 
                                location.includes(k) || title.includes(k)
                            );

                            const isArabFriendly = mentionsArab || isWorldwide;
                            
                            return marketFilter === 'arab' ? isArabFriendly : !isArabFriendly;
                        });
                        if (jobs.length < originalCount) {
                            this.addLog(`🎯 [${task.name}] Market Filter: Kept ${jobs.length} Arab-friendly jobs (Worldwide or MENA).`);
                        }
                    }

                    // 2. Smart Filter: Remove stale jobs
                    if (lookbackDate) {
                        const originalCount = jobs.length;
                        jobs = jobs.filter(job => new Date(job.created_at) >= lookbackDate);
                        if (jobs.length < originalCount) {
                            this.addLog(`🧹 [${task.name}] Filtered ${originalCount - jobs.length} stale jobs.`);
                        }
                    }

                    if (jobs.length > 0) {
                        if (this.onJobsFound) await this.onJobsFound(jobs, source.id);
                        this.addLog(`✅ [${task.name}] Found ${jobs.length} fresh jobs.`);
                    } else {
                        this.addLog(`⚠️ [${task.name}] No fresh jobs found.`);
                    }
                } else {
                    this.addLog(`⚠️ [${task.name}] No new jobs found.`);
                }
            } catch (error) {
                this.addLog(`❌ [${task.name}] Error: ${error.message}`, 'error');
            }
            
            // Be kind to APIs
            await new Promise(r => setTimeout(r, 2000));
        }

        this.addLog(`🏁 Remote collection complete. Full domination achieved.`);
        return [];
    }

    /**
     * WWR RSS
     */
    async fetchFromWWR() {
        const url = 'https://weworkremotely.com/remote-jobs.rss';
        const response = await axios.get(url, { headers: this.headers, timeout: 20000 });
        const $ = cheerio.load(response.data, { xmlMode: true });
        const jobs = [];

        $('item').each((i, el) => {
            const title = $(el).find('title').text();
            const link = $(el).find('link').text();
            const desc = $(el).find('description').text();
            const pubDate = $(el).find('pubDate').text();
            
            const parts = title.split(':');
            const company = parts.length > 1 ? parts[0].trim() : 'Remote Company';
            const jobTitle = parts.length > 1 ? parts[1].trim() : title;

            jobs.push({
                title: jobTitle,
                company_name: company,
                location: 'Remote',
                external_url: link,
                external_source: 'We Work Remotely',
                external_id: `wwr_${Buffer.from(link).toString('base64').slice(-15)}`,
                job_text: desc,
                created_at: new Date(pubDate || new Date()).toISOString(),
                job_site_type: 'Remote',
                raw_payload: { source: 'WWR', fetch_date: new Date().toISOString() }
            });
        });
        return jobs;
    }

    /**
     * Remote OK API (JSON) - RSS is deprecated (410)
     */
    async fetchFromRemoteOK() {
        const url = 'https://remoteok.com/api';
        const response = await axios.get(url, { 
            headers: {
                ...this.headers,
                'Referer': 'https://remoteok.com/'
            }, 
            timeout: 20000 
        });
        
        // Remote OK returns an array, first element is a metadata object
        const rawJobs = Array.isArray(response.data) ? response.data.filter(j => j.id) : [];
        
        return rawJobs.map(job => ({
            title: job.position,
            company_name: job.company,
            location: job.location || 'Remote',
            external_url: job.url,
            external_source: 'Remote OK',
            external_id: `rok_${job.id}`,
            job_text: job.description,
            created_at: new Date(job.date).toISOString(),
            job_site_type: 'Remote',
            raw_payload: { 
                source: 'RemoteOK', 
                fetch_date: new Date().toISOString(),
                tags: job.tags,
                salary: job.salary
            }
        }));
    }

    /**
     * Remotive API
     */
    async fetchFromRemotive() {
        const url = 'https://remotive.com/api/remote-jobs?limit=50';
        const response = await axios.get(url, { headers: this.headers, timeout: 20000 });
        const rawJobs = response.data.jobs || [];
        
        return rawJobs.map(job => ({
            title: job.title,
            company_name: job.company_name,
            location: job.candidate_required_location || 'Remote',
            external_url: job.url,
            external_source: 'Remotive',
            external_id: `rem_${job.id}`,
            job_text: job.description,
            created_at: new Date(job.publication_date).toISOString(),
            job_site_type: 'Remote',
            category: job.category,
            raw_payload: { 
                source: 'Remotive', 
                fetch_date: new Date().toISOString(),
                tags: job.tags,
                salary: job.salary
            }
        }));
    }

    /**
     * Working Nomads API
     */
    async fetchFromWorkingNomads() {
        const url = 'https://www.workingnomads.com/api/exposed_jobs/';
        const response = await axios.get(url, { headers: this.headers, timeout: 20000 });
        const rawJobs = Array.isArray(response.data) ? response.data : [];
        
        return rawJobs.slice(0, 50).map(job => ({
            title: job.title,
            company_name: job.company_name,
            location: 'Remote',
            external_url: job.url,
            external_source: 'Working Nomads',
            external_id: `wn_${job.id || Buffer.from(job.url).toString('base64').slice(-15)}`,
            job_text: job.description || job.instructions || '',
            created_at: new Date(job.pub_date || new Date()).toISOString(),
            job_site_type: 'Remote',
            category: job.category,
            raw_payload: { source: 'Working Nomads', fetch_date: new Date().toISOString() }
        }));
    }

    /**
     * Himalayas API
     */
    async fetchFromHimalayas() {
        const url = 'https://himalayas.app/jobs/api?limit=50';
        const response = await axios.get(url, { headers: this.headers, timeout: 20000 });
        const rawJobs = response.data.jobs || [];
        
        return rawJobs.map(job => ({
            title: job.title,
            company_name: job.companyName,
            location: job.location || 'Remote',
            external_url: job.applicationLink || job.link,
            external_source: 'Himalayas',
            external_id: `him_${job.id}`,
            job_text: job.description,
            created_at: new Date(job.publishedAt || new Date()).toISOString(),
            job_site_type: 'Remote',
            raw_payload: { 
                source: 'Himalayas', 
                fetch_date: new Date().toISOString(),
                salary: job.salaryRange
            }
        }));
    }

    /**
     * Jobspresso RSS
     */
    async fetchFromJobspresso() {
        const url = 'https://jobspresso.co/feed/?post_type=job_listing';
        const response = await axios.get(url, { 
            headers: {
                ...this.headers,
                'Referer': 'https://jobspresso.co/',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1'
            }, 
            timeout: 20000 
        });
        const $ = cheerio.load(response.data, { xmlMode: true });
        const jobs = [];

        $('item').each((i, el) => {
            const title = $(el).find('title').text();
            const link = $(el).find('link').text();
            const desc = $(el).find('description').text() || $(el).find('content\\:encoded').text();
            const pubDate = $(el).find('pubDate').text();
            
            // Jobspresso titles are usually "Job Title - Company"
            const parts = title.split(' – '); // Note: En-dash
            const jobTitle = parts[0].trim();
            const company = parts.length > 1 ? parts[1].trim() : 'Remote Company';

            jobs.push({
                title: jobTitle,
                company_name: company,
                location: 'Remote',
                external_url: link,
                external_source: 'Jobspresso',
                external_id: `jpr_${Buffer.from(link).toString('base64').slice(-15)}`,
                job_text: desc,
                created_at: new Date(pubDate).toISOString(),
                job_site_type: 'Remote',
                raw_payload: { source: 'Jobspresso', fetch_date: new Date().toISOString() }
            });
        });
        return jobs;
    }

    /**
     * JS Remotely RSS
     */
    async fetchFromJSRemotely() {
        return this.fetchGenericRSS('https://jsremotely.com/jobs.rss', 'JS Remotely', 'jsr');
    }

    /**
     * Dribbble RSS
     */
    async fetchFromDribbble() {
        return this.fetchGenericRSS('https://dribbble.com/jobs.rss', 'Dribbble', 'drb');
    }

    /**
     * Authentic Jobs RSS
     */
    async fetchFromAuthenticJobs() {
        return this.fetchGenericRSS('https://authenticjobs.com/feed/', 'Authentic Jobs', 'ath');
    }

    /**
     * ProBlogger RSS
     */
    async fetchFromProBlogger() {
        return this.fetchGenericRSS('https://problogger.com/jobs/feed/', 'ProBlogger', 'pbl');
    }

    /**
     * NoDesk RSS
     */
    async fetchFromNoDesk() {
        return this.fetchGenericRSS('https://nodesk.co/remote-jobs/index.xml', 'NoDesk', 'ndk');
    }

    /**
     * Remote.co RSS
     */
    async fetchFromRemoteCo() {
        return this.fetchGenericRSS('https://remote.co/remote-jobs/feed/', 'Remote.co', 'rco');
    }

    /**
     * Python Jobs RSS
     */
    async fetchFromPythonJobs() {
        return this.fetchGenericRSS('https://www.python.org/jobs/feed/rss/', 'Python Jobs', 'pyj');
    }

    /**
     * Rails Jobs RSS
     */
    async fetchFromRailsJobs() {
        return this.fetchGenericRSS('https://www.rubyonrailsjobs.com/jobs.rss', 'Rails Jobs', 'rlj');
    }

    /**
     * Crypto Jobs RSS
     */
    async fetchFromCryptoJobs() {
        return this.fetchGenericRSS('https://cryptojobslist.com/rss', 'Crypto Jobs', 'crj');
    }

    /**
     * Generic RSS Fetcher
     */
    async fetchGenericRSS(url, sourceName, idPrefix) {
        try {
            const response = await axios.get(url, { headers: this.headers, timeout: 20000 });
            const $ = cheerio.load(response.data, { xmlMode: true });
            const jobs = [];

            $('item').each((i, el) => {
                const title = $(el).find('title').text();
                const link = $(el).find('link').text();
                const desc = $(el).find('description').text() || $(el).find('content\\:encoded').text();
                const pubDate = $(el).find('pubDate').text();
                
                // Common pattern "Job Title at Company" or "Company: Job Title"
                let company = 'Remote Company';
                let jobTitle = title;

                if (title.includes(' at ')) {
                    const parts = title.split(' at ');
                    jobTitle = parts[0].trim();
                    company = parts[1].trim();
                } else if (title.includes(': ')) {
                    const parts = title.split(': ');
                    company = parts[0].trim();
                    jobTitle = parts[1].trim();
                }

                jobs.push({
                    title: jobTitle,
                    company_name: company,
                    location: 'Remote',
                    external_url: link,
                    external_source: sourceName,
                    external_id: `${idPrefix}_${Buffer.from(link).toString('base64').slice(-15)}`,
                    job_text: desc,
                    created_at: new Date(pubDate || new Date()).toISOString(),
                    job_site_type: 'Remote',
                    raw_payload: { source: sourceName, fetch_date: new Date().toISOString() }
                });
            });
            return jobs;
        } catch (error) {
            this.addLog(`Generic RSS Error [${sourceName}]: ${error.message}`, 'error');
            return [];
        }
    }
}

module.exports = RemoteCollector;
