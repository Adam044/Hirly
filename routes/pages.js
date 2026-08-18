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

    return html.replace('</head>', `${seoTags}\n</head>`);
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
      html = injectGlobalSEO(html, req);
      res.send(html);
    } catch (err) {
      logger.error('SEO Injection Error:', err);
      res.sendFile(full);
    }
  }

  const ALLOWED_GROUPS = ['employer', 'user', 'admin', 'hirly', 'technical'];

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
    'employer_profile', 'email_verification_pending', 'start', 'employers', 'services', 'interviews_analysis', 'talent', 'privacy', 'terms',
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

  router.get('/profile/:id', (req, res, next) => {
    sendSmart(req, res, next, [path.join('user', 'profile.html'), 'profile.html']);
  });

  router.get('/profile.html', (req, res, next) => {
    sendSmart(req, res, next, [path.join('user', 'profile.html'), 'profile.html']);
  });

  router.get('/employer_profile/:id', (req, res, next) => {
    sendSmart(req, res, next, [path.join('employer', 'employer_profile.html'), 'employer_profile.html']);
  });

  router.get('/employer_profile.html', (req, res, next) => {
    sendSmart(req, res, next, [path.join('employer', 'employer_profile.html'), 'employer_profile.html']);
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

  // Human-readable Profile URLs
  router.get(['/:slug', '/@:slug', '/u/:slug'], async (req, res, next) => {
    let slug = req.params.slug;
    
    // Basic sanitization and check
    if (!slug || slug.includes('.') || htmlPages.includes(slug) || ALLOWED_GROUPS.includes(slug)) {
      return next();
    }

    let client;
    try {
      client = await pool.connect();
      const result = await client.query('SELECT id, user_type, slug FROM users WHERE slug = $1 OR slug = $2', [slug, slug.replace('@', '')]);
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        // If they used @ or /u/ but the slug is just the name, or vice versa, we could redirect or just serve.
        // For now, let's just serve the correct template.
        if (user.user_type === 'professional') {
          return sendSmart(res, [path.join('user', 'profile.html'), 'profile.html']);
        } else if (user.user_type === 'employer') {
          return sendSmart(res, [path.join('employer', 'employer_profile.html'), 'employer_profile.html']);
        }
      }
      next();
    } catch (error) {
      logger.error('Error fetching user by slug:', error);
      next();
    } finally {
      if (client) client.release();
    }
  });

  app.use('/', router);
}
