const express = require('express');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

module.exports = function registerPagesRoutes(app, { isAuthenticated, isProfessional, isEmployer, isEmployerVerified, isAdmin, pool }) {
  const router = express.Router();

  const ROOT_DIR = path.join(__dirname, '..');
  const VIEWS_DIR = path.join(ROOT_DIR, 'views');
  const viewCache = new Map();

  function resolveViewCandidates(candidates) {
    const cacheKey = candidates.join('|');
    if (process.env.NODE_ENV !== 'development' && viewCache.has(cacheKey)) {
      return viewCache.get(cacheKey);
    }

    for (const rel of candidates) {
      const full = path.join(VIEWS_DIR, rel);
      if (fs.existsSync(full)) {
        if (process.env.NODE_ENV !== 'development') {
          viewCache.set(cacheKey, full);
        }
        return full;
      }
    }

    if (process.env.NODE_ENV !== 'development') {
      viewCache.set(cacheKey, null);
    }
    return null;
  }

  function sendSmart(req, res, next, candidates) {
    const full = resolveViewCandidates(candidates);
    if (full) return res.sendFile(full);
    
    const err = new Error('Page not found');
    err.statusCode = 404;
    next(err);
  }

  /**
   * Inject Global SEO Tags (Canonical, Hreflang)
   */
  function injectGlobalSEO(html, req) {
    const siteUrl = 'https://hirly.net';
    const currentUrl = `${siteUrl}${req.path}`;
    
    const seoTags = `
    <!-- Institutional SEO -->
    <link rel="canonical" href="${currentUrl}" />
    <link rel="alternate" hreflang="en" href="${currentUrl}" />
    <link rel="alternate" hreflang="ar" href="${currentUrl}" />
    <link rel="alternate" hreflang="x-default" href="${currentUrl}" />
    `;

    html = html.replace('</head>', `${seoTags}\n</head>`);

    // Inject Cookie Consent Component
    const cookieConsentPath = path.join(VIEWS_DIR, 'components', 'cookie_consent.html');
    if (fs.existsSync(cookieConsentPath)) {
      const cookieConsentHtml = fs.readFileSync(cookieConsentPath, 'utf8');
      if (html.includes('</body>')) {
        html = html.replace('</body>', `${cookieConsentHtml}\n</body>`);
      } else {
        html += cookieConsentHtml;
      }
    }

    return html;
  }

  async function sendSmartSEO(req, res, next, candidates) {
    const full = resolveViewCandidates(candidates);
    if (!full) {
      const err = new Error('Page not found');
      err.statusCode = 404;
      return next(err);
    }

    try {
      let html = fs.readFileSync(full, 'utf8');
      
      // Inject Global SEO Tags
      html = injectGlobalSEO(html, req);

      // Page-specific SEO overrides
      const page = path.basename(full, '.html');
      if (page === 'index') {
        html = html
          .replace(/{{PAGE_TITLE}}/g, 'Hirly | The Professional Career Network for Palestine')
          .replace(/{{PAGE_DESCRIPTION}}/g, 'Hirly is the elite career network connecting Palestinian talent with global opportunities. Discover jobs, hire professionals, and grow your career.');
      } else if (page === 'jobs') {
        html = html
          .replace(/{{PAGE_TITLE}}/g, 'Explore Jobs | Hirly')
          .replace(/{{PAGE_DESCRIPTION}}/g, 'Find your next career move. Browse thousands of jobs in Palestine and remote roles worldwide on Hirly.');
      } else if (page === 'talent') {
        html = html
          .replace(/{{PAGE_TITLE}}/g, 'Hire Top Talent | Hirly')
          .replace(/{{PAGE_DESCRIPTION}}/g, 'Discover elite Palestinian professionals. Filter by skills, experience, and location to find your next great hire.');
      }

      res.send(html);
    } catch (err) {
      logger.error('SEO Injection Error:', err);
      res.sendFile(full);
    }
  }

  async function injectProfileSEO(html, req, user) {
    let client;
    try {
      client = await pool.connect();
      let profileData = {};

      if (user.user_type === 'professional') {
        const profResult = await client.query(`
          SELECT 
            u.first_name, u.last_name, u.slug, u.profile_picture_url,
            p.profession, p.bio, p.skills
          FROM users u
          JOIN professionals p ON u.id = p.user_id
          WHERE u.id = $1
        `, [user.id]);
        
        if (profResult.rows.length > 0) {
          const prof = profResult.rows[0];
          const name = `${prof.first_name} ${prof.last_name}`;
          const bio = prof.bio || `${prof.profession || 'Professional'} with skills in ${prof.skills || 'various fields'}.`;
          
          html = html
            .replace(/{{USER_NAME}}/g, name)
            .replace(/{{USER_DESCRIPTION}}/g, bio.substring(0, 160).trim())
            .replace(/{{USER_IMAGE}}/g, prof.profile_picture_url || 'https://ecxvfjceuynwtpjvmxpw.supabase.co/storage/v1/object/public/assets/default-avatar.png')
            .replace(/{{USER_SLUG}}/g, prof.slug);
        }
      } else if (user.user_type === 'employer') {
        const empResult = await client.query(`
          SELECT 
            u.slug,
            e.company_name, e.company_description, e.company_logo_path
          FROM users u
          JOIN employers e ON u.id = e.user_id
          WHERE u.id = $1
        `, [user.id]);

        if (empResult.rows.length > 0) {
          const emp = empResult.rows[0];
          html = html
            .replace(/{{COMPANY_NAME}}/g, emp.company_name || 'Hirly Partner')
            .replace(/{{COMPANY_DESCRIPTION}}/g, (emp.company_description || 'Elite partner on Hirly Network.').substring(0, 160).trim())
            .replace(/{{COMPANY_LOGO}}/g, emp.company_logo_path || 'https://ecxvfjceuynwtpjvmxpw.supabase.co/storage/v1/object/public/assets/cta-employer-bg.jpg')
            .replace(/{{USER_SLUG}}/g, emp.slug);
        }
      }
      
      return injectGlobalSEO(html, req);
    } catch (error) {
      logger.error('Profile SEO Injection Error:', error);
      return injectGlobalSEO(html, req);
    } finally {
      if (client) client.release();
    }
  }

  const ALLOWED_GROUPS = ['employer', 'user', 'admin', 'hirly', 'technical', 'legal'];

  router.get('/:group/:page.html', (req, res, next) => {
    const { group, page } = req.params;
    if (!ALLOWED_GROUPS.includes(group)) {
      const err = new Error('Page not found');
      err.statusCode = 404;
      return next(err);
    }
    if (page === 'interview') {
      return sendSmart(req, res, next, [
        path.join('employer', 'interview.html'),
        path.join('user', 'interview.html'),
        'interview.html'
      ]);
    }
    sendSmart(req, res, next, [path.join(group, `${page}.html`)]);
  });

  router.get('/forgot_password.html', (req, res, next) => {
    sendSmart(req, res, next, [path.join('technical', 'forgot_password.html'), 'forgot_password.html']);
  });

  router.get('/reset_password.html', (req, res, next) => {
    sendSmart(req, res, next, [path.join('technical', 'reset_password.html'), 'reset_password.html']);
  });

  const htmlPages = [
    'index', 'signup', 'login', 'jobs', 'job_details', 'dashboard',
    'hire_dashboard', 'about', 'contact', 'post_job', 'ai',
    'profile', 'applicants', 'admin_dashboard',
    'employer_profile', 'email_verification_pending', 'start', 'employers', 'services', 'interviews_analysis', 'talent', 'privacy', 'terms', 'cookies',
    'for-individuals', 'for-companies', 'for-professionals', 'employer_review'
  ];

  htmlPages.forEach(page => {
    if (['dashboard', 'hire_dashboard', 'post_job', 'applicants', 'profile', 'admin_dashboard', 'forgot_password', 'reset_password', 'ai', 'interviews_analysis'].includes(page)) {
      return;
    }
    router.get(`/${page}`, (req, res, next) => {
      sendSmartSEO(req, res, next, [
        path.join('employer', `${page}.html`),
        path.join('user', `${page}.html`),
        path.join('admin', `${page}.html`),
        path.join('hirly', `${page}.html`),
        path.join('technical', `${page}.html`),
        path.join('legal', `${page}.html`),
        `${page}.html`
      ]);
    });
    router.get(`/${page}.html`, (req, res, next) => {
      sendSmartSEO(req, res, next, [
        path.join('employer', `${page}.html`),
        path.join('user', `${page}.html`),
        path.join('admin', `${page}.html`),
        path.join('hirly', `${page}.html`),
        path.join('technical', `${page}.html`),
        path.join('legal', `${page}.html`),
        `${page}.html`
      ]);
    });
  });

  router.get(['/employer-review', '/employer-review.html'], (req, res, next) => {
    sendSmart(req, res, next, [
      path.join('employer', 'employer_review.html'),
      'employer_review.html'
    ]);
  });

  router.get('/components/:componentName.html', (req, res) => {
    const cacheKey = `component_${req.params.componentName}`;
    let componentPath;
    
    if (process.env.NODE_ENV !== 'development' && viewCache.has(cacheKey)) {
      componentPath = viewCache.get(cacheKey);
    } else {
      componentPath = path.join(VIEWS_DIR, 'components', `${req.params.componentName}.html`);
      if (!fs.existsSync(componentPath)) {
        componentPath = null;
      }
      if (process.env.NODE_ENV !== 'development') {
        viewCache.set(cacheKey, componentPath);
      }
    }

    if (!componentPath) {
      return res.status(404).send(`Component ${req.params.componentName} not found`);
    }
    res.sendFile(componentPath);
  });

  const { generateJobSlug } = require('../utils/seoHelper');

  router.get(['/job_details/:id', '/jobs/:id/:slug'], async (req, res, next) => {
    const jobId = req.params.id;
    const page = 'job_details';
    const candidates = [
      path.join('employer', `${page}.html`),
      path.join('user', `${page}.html`),
      path.join('admin', `${page}.html`),
      path.join('hirly', `${page}.html`),
      path.join('technical', `${page}.html`),
      `${page}.html`
    ];
    const fullPath = resolveViewCandidates(candidates);

    if (!fullPath) {
      const err = new Error('Page not found');
      err.statusCode = 404;
      return next(err);
    }

    try {
      // Fetch job details for SEO
      const jobResult = await pool.query(`
        SELECT 
          j.title, 
          j.description,
          COALESCE(j.external_company_name, e.company_name, 'Private Company') as company_name,
          COALESCE(j.external_company_logo, e.company_logo_path, 'https://ecxvfjceuynwtpjvmxpw.supabase.co/storage/v1/object/public/assets/cta-employer-bg.jpg') as company_logo,
          j.city,
          j.country
        FROM jobs j
        LEFT JOIN employers e ON j.employer_id = e.user_id
        WHERE j.id::text = $1::text OR j.external_id = $1::text
        LIMIT 1
      `, [jobId]);

      let html = fs.readFileSync(fullPath, 'utf8');

      if (jobResult.rows.length > 0) {
        const job = jobResult.rows[0];
        const jobSlug = generateJobSlug(job);
        
        // SEO: Redirect to slugified URL if not already there (Elite practice)
        if (req.path.startsWith('/job_details/') || (req.params.slug && req.params.slug !== jobSlug)) {
          return res.redirect(301, `/jobs/${jobId}/${jobSlug}`);
        }

        // Clean description for meta tag (strip HTML, limit length)
        const cleanDesc = (job.description || '')
          .replace(/<[^>]*>?/gm, '')
          .substring(0, 160)
          .trim();

        html = html
          .replace(/{{JOB_TITLE}}/g, job.title)
          .replace(/{{COMPANY_NAME}}/g, job.company_name)
          .replace(/{{COMPANY_LOGO}}/g, job.company_logo)
          .replace(/{{JOB_ID}}/g, jobId)
          .replace(/{{JOB_SLUG}}/g, jobSlug)
          .replace(/{{JOB_DESCRIPTION}}/g, cleanDesc || `Strategic opportunity at ${job.company_name}.`)
          .replace(/{{JOB_LOCATION}}/g, `${job.city || ''}, ${job.country || ''}`);
      } else {
        // Fallback for missing job
        html = html
          .replace(/{{JOB_TITLE}}/g, 'Professional Milestone')
          .replace(/{{COMPANY_NAME}}/g, 'Hirly Network')
          .replace(/{{COMPANY_LOGO}}/g, 'https://ecxvfjceuynwtpjvmxpw.supabase.co/storage/v1/object/public/assets/cta-employer-bg.jpg')
          .replace(/{{JOB_ID}}/g, jobId)
          .replace(/{{JOB_DESCRIPTION}}/g, 'Explore professional milestones on Hirly\'s curated career network.')
          .replace(/{{JOB_LOCATION}}/g, 'Palestine');
      }
      
      // SEO: Inject Global SEO Tags
      html = injectGlobalSEO(html, req);

      res.send(html);
    } catch (error) {
      logger.error('SEO Injection Error:', error);
      res.sendFile(fullPath); // Fallback to normal file if DB fails
    }
  });

  router.get('/', (req, res, next) => {
    sendSmartSEO(req, res, next, [path.join('hirly', 'index.html'), 'index.html']);
  });

  router.get(['/start', '/start.html'], isAuthenticated, (req, res, next) => {
    sendSmartSEO(req, res, next, ['start.html']);
  });

  router.get(['/talent', '/talent.html'], (req, res, next) => {
    sendSmartSEO(req, res, next, [path.join('hirly', 'talent.html'), 'talent.html']);
  });

  // Legal Routes
  router.get(['/privacy', '/privacy.html'], (req, res, next) => {
    sendSmartSEO(req, res, next, [path.join('legal', 'privacy.html'), 'privacy.html']);
  });

  router.get(['/terms', '/terms.html'], (req, res, next) => {
    sendSmartSEO(req, res, next, [path.join('legal', 'terms.html'), 'terms.html']);
  });

  router.get(['/cookies', '/cookies.html'], (req, res, next) => {
    sendSmartSEO(req, res, next, [path.join('legal', 'cookies.html'), 'cookies.html']);
  });

  router.get(['/dashboard', '/dashboard.html'], isAuthenticated, isProfessional, (req, res, next) => {
    sendSmart(req, res, next, [path.join('user', 'dashboard.html'), 'dashboard.html']);
  });

  router.get(['/hire_dashboard', '/hire_dashboard.html'], isAuthenticated, isEmployer, (req, res, next) => {
    sendSmart(req, res, next, [path.join('employer', 'hire_dashboard.html'), 'hire_dashboard.html']);
  });

  router.get(['/post_job', '/post_job.html'], isAuthenticated, isEmployer, isEmployerVerified, (req, res, next) => {
    sendSmart(req, res, next, [path.join('employer', 'post_job.html'), 'post_job.html']);
  });

  router.get(['/applicants', '/applicants.html'], isAuthenticated, isEmployer, async (req, res, next) => {
    sendSmart(req, res, next, [path.join('employer', 'applicants.html'), 'applicants.html']);
  });

  router.get(['/ai', '/ai.html'], isAuthenticated, isEmployer, (req, res, next) => {
    sendSmart(req, res, next, [path.join('employer', 'ai.html'), 'ai.html']);
  });

  router.get(['/interviews_analysis', '/interviews_analysis.html'], isAuthenticated, isEmployer, (req, res, next) => {
    sendSmart(req, res, next, [path.join('employer', 'interviews_analysis.html'), 'interviews_analysis.html']);
  });

  router.get('/profile/:id', async (req, res, next) => {
    const userId = req.params.id;
    const candidates = [path.join('user', 'profile.html'), 'profile.html'];
    const fullPath = resolveViewCandidates(candidates);
    if (!fullPath) return next();

    try {
      const userResult = await pool.query('SELECT id, user_type FROM users WHERE id::text = $1', [userId]);
      if (userResult.rows.length > 0) {
        let html = fs.readFileSync(fullPath, 'utf8');
        html = await injectProfileSEO(html, req, userResult.rows[0]);
        res.send(html);
      } else {
        res.sendFile(fullPath);
      }
    } catch (error) {
      res.sendFile(fullPath);
    }
  });

  router.get('/profile.html', (req, res, next) => {
    sendSmartSEO(req, res, next, [path.join('user', 'profile.html'), 'profile.html']);
  });

  router.get('/employer_profile/:id', async (req, res, next) => {
    const userId = req.params.id;
    const candidates = [path.join('employer', 'employer_profile.html'), 'employer_profile.html'];
    const fullPath = resolveViewCandidates(candidates);
    if (!fullPath) return next();

    try {
      const userResult = await pool.query('SELECT id, user_type FROM users WHERE id::text = $1', [userId]);
      if (userResult.rows.length > 0) {
        let html = fs.readFileSync(fullPath, 'utf8');
        html = await injectProfileSEO(html, req, userResult.rows[0]);
        res.send(html);
      } else {
        res.sendFile(fullPath);
      }
    } catch (error) {
      res.sendFile(fullPath);
    }
  });

  router.get('/employer_profile.html', (req, res, next) => {
    sendSmartSEO(req, res, next, [path.join('employer', 'employer_profile.html'), 'employer_profile.html']);
  });

  router.get(['/admin_dashboard', '/admin_dashboard.html'], isAuthenticated, isAdmin, (req, res, next) => {
    sendSmart(req, res, next, [path.join('admin', 'admin_dashboard.html'), 'admin_dashboard.html']);
  });

  router.get(['/interview', '/interview.html'], (req, res, next) => {
    sendSmart(req, res, next, [
      path.join('employer', 'interview.html'),
      path.join('user', 'interview.html'),
      'interview.html'
    ]);
  });

  router.get(['/how-it-works', '/how-it-works.html'], (req, res) => {
    res.redirect('/about.html');
  });

  // Institutional Profile URLs
  // Supports hirly.net/slug (Professional/Employer) as the primary format.
  // Legacy prefixes like /talent/, /@, /u/ are redirected to the clean root slug.
  router.get(['/talent/:slug', '/:slug', '/@:slug', '/u/:slug'], async (req, res, next) => {
    let slug = req.params.slug;
    const reqPath = req.path;
    const siteUrl = 'https://hirly.net';
    
    // Clean up slug if it has prefix
    if (slug.startsWith('@')) slug = slug.substring(1);

    // Basic sanitization and check to avoid matching static pages or files
    if (!slug || slug.includes('.') || htmlPages.includes(slug) || ALLOWED_GROUPS.includes(slug)) {
      return next();
    }

    let client;
    try {
      client = await pool.connect();
      // Search for the user by slug
      const result = await client.query('SELECT id, user_type, slug FROM users WHERE slug = $1', [slug]);
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        
        // SEO: Enforce clean root-level slug (hirly.net/slug)
        // Redirect if using legacy /talent/, /@slug, or /u/slug
        if (reqPath.startsWith('/talent/') || reqPath.startsWith('/@') || reqPath.startsWith('/u/')) {
          return res.redirect(301, `/${user.slug}`);
        }

        // Serve the appropriate profile template with SEO injection
        let candidates;
        if (user.user_type === 'professional') {
          candidates = [path.join('user', 'profile.html'), 'profile.html'];
        } else if (user.user_type === 'employer') {
          candidates = [path.join('employer', 'employer_profile.html'), 'employer_profile.html'];
        }

        const fullPath = resolveViewCandidates(candidates);
        if (fullPath) {
          let html = fs.readFileSync(fullPath, 'utf8');
          html = await injectProfileSEO(html, req, user);
          return res.send(html);
        }
      }
      
      // If no user found, fall through to 404
      next();
    } catch (error) {
      logger.error('Error fetching user by slug:', error);
      next();
    } finally {
      if (client) client.release();
    }
  });

  router.get('/robots.txt', (req, res) => {
    const robots = `User-agent: *
Allow: /
Sitemap: https://hirly.net/sitemap.xml

User-agent: GPTBot
Disallow: /admin/
Disallow: /dashboard/
Disallow: /hire_dashboard/`;
    res.type('text/plain');
    res.send(robots);
  });

  router.get('/sitemap.xml', async (req, res) => {
    try {
      const siteUrl = 'https://hirly.net';
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${siteUrl}/</loc><priority>1.0</priority></url>
  <url><loc>${siteUrl}/jobs</loc><priority>0.9</priority></url>
  <url><loc>${siteUrl}/talent</loc><priority>0.9</priority></url>
  <url><loc>${siteUrl}/about</loc><priority>0.7</priority></url>
  <url><loc>${siteUrl}/contact</loc><priority>0.7</priority></url>`;

      // Add Jobs
      const jobsResult = await pool.query('SELECT id, title, created_at FROM jobs WHERE status = \'open\' ORDER BY created_at DESC LIMIT 500');
      jobsResult.rows.forEach(job => {
        const slug = generateJobSlug(job);
        xml += `\n  <url><loc>${siteUrl}/jobs/${job.id}/${slug}</loc><lastmod>${job.created_at.toISOString().split('T')[0]}</lastmod><priority>0.8</priority></url>`;
      });

      // Add Profiles
      const usersResult = await pool.query('SELECT slug, created_at FROM users WHERE slug IS NOT NULL ORDER BY created_at DESC LIMIT 500');
      usersResult.rows.forEach(user => {
        xml += `\n  <url><loc>${siteUrl}/${user.slug}</loc><lastmod>${user.created_at.toISOString().split('T')[0]}</lastmod><priority>0.6</priority></url>`;
      });

      xml += '\n</urlset>';
      res.type('application/xml');
      res.send(xml);
    } catch (error) {
      logger.error('Sitemap Generation Error:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  app.use('/', router);
}
