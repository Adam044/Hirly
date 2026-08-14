require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');
const path = require('path');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const crypto = require('crypto');
const winston = require('winston'); // Import winston for logging
const fs = require('fs'); // Keep fs for routes
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { body, validationResult, param, query } = require('express-validator');
const morgan = require('morgan');
const logger = require('./utils/logger');
const { initRealtime, trackVisitor } = require('./realtime/manager');
const errorHandler = require('./middleware/errorHandler');

// Log server start with current settings
logger.info(`Hirly server is starting in ${process.env.NODE_ENV || 'development'} mode`);
logger.info(`Log level set to: ${logger.level}`);

const app = express();
const PORT = process.env.PORT || 8080;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Standard Supabase client for non-admin auth operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});


app.set('trust proxy', 1);

const {
    sendVerificationEmail,
    sendContactFormEmail,
    sendPasswordResetEmail,
    sendPasswordResetConfirmationEmail,
    sendAccountActivationEmail,
    sendEmployerLeadOTPEmail,
    sendApplicationAcceptedEmail,
    sendApplicationRejectedEmail,
    sendJobOfferEmail,
    sendManualJobAlerts,
    sendEmailCampaign,
    sendEmailCampaignTest,
    sendEmailCampaignWithProgress,
    sendIdVerificationReminder,
    sendEmailVerificationReminder,
    sendGeneralWelcomeEmail,
    sendAdminVerificationEmail,
    generateEmailHtmlWrapper,
    sendUserToProfessionalEmail,
    sendEmail
} = require('./utils/emailService');

// Import performance monitoring
const PerformanceMonitor = require('./utils/monitoring');
const performanceMonitor = new PerformanceMonitor();
const { supportsWebP, getCacheDuration } = require('./utils/fileOptimization');

// Import Supabase Storage utilities
const {
    uploadProfilePicture,
    uploadCV,
    uploadCompanyLogo,
    uploadServiceImage,
    uploadJobImage,
    uploadIDDocument,
    deleteFile,
    getOptimizedImageUrl,
    extractFilePathFromUrl,
    validateFile
} = require('./utils/supabaseStorage');

const { resetSequence, initializeDatabaseSchema, cleanupLegacyEducationColumns } = require('./database/schema');
const JobAggregationService = require('./services/jobAggregationService');
const AIEvaluationService = require('./services/aiEvaluationService');
const EmployerOutreachService = require('./services/employerOutreachService');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 20, // Restored to original value
    idleTimeoutMillis: 30000, // Restored to original value
    connectionTimeoutMillis: 10000, // Restored to original value
    maxUses: 7500 // Restored to original value
    // Removed acquireTimeoutMillis which was causing connection delays
});



// Move database initialization to async function
async function initializeDatabase() {
    try {
        await new Promise((resolve, reject) => {
            pool.connect((err, client, release) => {
                if (err) {
                    logger.error('Error connecting to database:', err.message);
                    reject(err);
                    return;
                }
                client.query('SELECT NOW()', (err, result) => {
                    release();
                    if (err) {
                        logger.error('Error executing initial database query:', err.message);
                        reject(err);
                        return;
                    }
                    logger.info('Database connected successfully!');
                    resolve();
                });
            });
        });

        await initializeDatabaseSchema(pool);
        // Note: Migrations are now managed directly in Supabase
        // Remaining Node.js initialization:
        await resetSequence(pool);
        await populateSlugs();
        await populateEmailPreferences();
        logger.info('Database initialization completed successfully');
    } catch (error) {
        logger.error('Database initialization failed:', error);
        // Don't exit process, let server continue running
    }
}

function slugify(text) {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w\u0621-\u064A-]+/g, '') // Remove all non-word chars (allow Arabic characters)
        .replace(/--+/g, '-')     // Replace multiple - with single -
        .replace(/^-+/, '')       // Trim - from start of text
        .replace(/-+$/, '');      // Trim - from end of text
}

async function populateSlugs() {
    let client;
    try {
        client = await pool.connect();
        // Fixed ambiguous id by using u.id
        const usersWithoutSlugs = await client.query('SELECT u.id, u.first_name, u.last_name, e.company_name, u.user_type FROM users u LEFT JOIN employers e ON u.id = e.user_id WHERE u.slug IS NULL');

        for (const user of usersWithoutSlugs.rows) {
            let baseName = '';
            if (user.user_type === 'employer' && user.company_name) {
                baseName = user.company_name;
            } else {
                baseName = `${user.first_name} ${user.last_name}`;
            }

            let baseSlug = slugify(baseName);
            if (!baseSlug) baseSlug = 'user';

            // To make it look "nice and personally done", we'll try the name first, 
            // and if it exists, we'll append the ID which is cleaner than a counter
            let finalSlug = baseSlug;

            const check = await client.query('SELECT id FROM users WHERE slug = $1 AND id != $2', [finalSlug, user.id]);
            if (check.rows.length > 0) {
                finalSlug = `${baseSlug}-${user.id}`;
            }

            await client.query('UPDATE users SET slug = $1 WHERE id = $2', [finalSlug, user.id]);
            logger.info(`Populated slug for user ${user.id}: ${finalSlug}`);
        }
    } catch (error) {
        logger.error('Error populating slugs:', error);
    } finally {
        if (client) client.release();
    }
}

async function migrateEducationData() {
    let client;
    try {
        client = await pool.connect();
        
        const existingCount = await client.query('SELECT COUNT(*) FROM education');
        if (parseInt(existingCount.rows[0].count) > 0) {
            logger.info('Education data already exists in new table. Skipping migration.');
            return;
        }

        logger.info('Starting education data migration...');
        
        // 1. Check if legacy columns exist before querying
        const checkCols = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='professionals' 
            AND column_name IN ('education_history', 'university', 'degree', 'degree_field', 'student_type', 'school_grade', 'university_year', 'study_status')
        `);

        if (checkCols.rowCount === 0) {
            logger.info('Legacy education columns not found. Migration may have already completed or columns were dropped.');
            return;
        }

        const cols = checkCols.rows.map(r => r.column_name);
        const hasHistory = cols.includes('education_history');
        const hasUni = cols.includes('university');
        const hasDegree = cols.includes('degree');
        const hasStudentType = cols.includes('student_type');

        // Build a dynamic query based on existing columns
        const selectFields = ['user_id'];
        if (hasHistory) selectFields.push('education_history');
        if (hasUni) selectFields.push('university');
        if (hasDegree) selectFields.push('degree');
        if (cols.includes('degree_field')) selectFields.push('degree_field');
        if (cols.includes('university_year')) selectFields.push('university_year');
        if (hasStudentType) selectFields.push('student_type');
        if (cols.includes('school_grade')) selectFields.push('school_grade');
        if (cols.includes('study_status')) selectFields.push('study_status');

        const result = await client.query(`SELECT ${selectFields.join(', ')} FROM professionals`);
        
        let migratedCount = 0;
        for (const row of result.rows) {
            const userId = row.user_id;
            const entries = [];

            // A. Process JSONB history if exists
            if (hasHistory && row.education_history) {
                let history = row.education_history;
                if (typeof history === 'string') {
                    try { history = JSON.parse(history); } catch (e) { history = []; }
                }
                if (Array.isArray(history)) {
                    history.forEach(item => {
                        entries.push({
                            type: (item.type || 'university').toLowerCase(),
                            institution_name: item.organization || item.university || 'Unknown',
                            institution_id: item.orgId || null,
                            title: item.title || item.degree || 'Unknown',
                            field_of_study: item.field || item.degree_field || null,
                            end_date: item.date || item.graduation_year || null,
                            credential_url: item.link || null,
                            is_current: false
                        });
                    });
                }
            }

            // B. Process flat fields if they have data and aren't redundant
            if (hasStudentType && row.student_type === 'University' && (row.university || row.degree)) {
                entries.push({
                    type: 'university',
                    institution_name: row.university || 'Unknown University',
                    title: row.degree || 'Student',
                    field_of_study: row.degree_field || null,
                    grade_score: row.university_year ? `${row.university_year} Year` : null,
                    is_current: row.study_status !== 'Graduated',
                    description: 'Migrated from profile status'
                });
            } else if (hasStudentType && row.student_type === 'School' && row.school_grade) {
                entries.push({
                    type: 'school',
                    institution_name: row.university || 'My School',
                    title: `${row.school_grade} Grade`,
                    is_current: true,
                    description: 'Migrated from school status'
                });
            }

            // C. Insert all unique entries
            for (const entry of entries) {
                const validTypes = ['university', 'school', 'certificate', 'course'];
                const finalType = validTypes.includes(entry.type) ? entry.type : 'university';

                await client.query(`
                    INSERT INTO education (
                        user_id, type, institution_name, institution_id, title, 
                        field_of_study, end_date, credential_url, is_current, grade_score, description
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                `, [
                    userId, finalType, entry.institution_name, entry.institution_id, 
                    entry.title, entry.field_of_study, entry.end_date, 
                    entry.credential_url, entry.is_current || false, 
                    entry.grade_score || null, entry.description || null
                ]);
                migratedCount++;
            }
        }
        
        logger.info(`Successfully migrated ${migratedCount} education entries to the new table.`);
    } catch (error) {
        logger.error('Error migrating education data:', error);
    } finally {
        if (client) client.release();
    }
}

async function populateEmailPreferences() {
    let client;
    try {
        client = await pool.connect();
        logger.info('Seeding default email preferences for all users...');
        
        // Insert default preferences for all users who don't have them yet
        const result = await client.query(`
            INSERT INTO email_preferences (user_id, notifications_enabled, notification_frequency)
            SELECT id, true, 'daily'
            FROM users
            ON CONFLICT (user_id) DO NOTHING
            RETURNING user_id
        `);
        
        if (result.rowCount > 0) {
            logger.info(`Seeded default email preferences for ${result.rowCount} new users.`);
        } else {
            logger.info('All users already have email preferences set.');
        }
    } catch (error) {
        logger.error('Error seeding email preferences:', error);
    } finally {
        if (client) client.release();
    }
}

// Remove the old synchronous database connection code
// pool.connect((err, client, release) => { ... });


// --- Middleware ---
app.use(cookieParser());
app.use(trackVisitor);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Morgan middleware for logging HTTP requests
const morganFormat = ':method :url :status :res[content-length] - :response-time ms';
app.use(morgan(morganFormat, {
    stream: {
        write: (message) => logger.http(message.trim()),
    },
    skip: (req, res) => {
        // Log only API routes and main page loads, skip common static assets
        const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.otf'];
        const urlPath = req.url.split('?')[0].toLowerCase();

        // Skip common static assets by extension
        const isStatic = staticExtensions.some(ext => urlPath.endsWith(ext));

        // Also skip common static directories and component requests
        const isStaticDir = urlPath.startsWith('/styling/') ||
            urlPath.startsWith('/js/') ||
            urlPath.startsWith('/css/') ||
            urlPath.startsWith('/images/') ||
            urlPath.startsWith('/uploads/') ||
            urlPath.startsWith('/components/') ||
            urlPath.startsWith('/language/');

        const shouldSkip = isStatic || isStaticDir;

        if (shouldSkip && process.env.DEBUG === 'true') {
            logger.debug(`Skipping log for static asset: ${req.url}`);
        }

        return shouldSkip;
    }
}));

app.use(session({
    store: new pgSession({
        pool,
        tableName: 'user_sessions',
        createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || (() => {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('FATAL: SESSION_SECRET is not set in production!');
        }
        return 'a_very_strong_default_secret_for_dev';
    })(),
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
        secure: false, // Set to false for local development
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/'
    }
}));

// --- NEW RLS Middleware: Sets PostgreSQL session variables for RLS ---
app.use(async (req, res, next) => {
    if (req.session && req.session.userId) {
        let client;
        try {
            client = await pool.connect();
            // Use parameterized queries to prevent SQL injection
            await client.query('SELECT set_config($1, $2, false)', ['app.user_id', req.session.userId.toString()]);
            await client.query('SELECT set_config($1, $2, false)', ['app.user_type', req.session.userType.toString()]);
            logger.debug(`PostgreSQL session variables set: app.user_id='${req.session.userId}', app.user_type='${req.session.userType}'`);
        } catch (err) {
            logger.error("Error setting PostgreSQL session variables for RLS:", err);
        } finally {
            if (client) client.release();
        }
    }
    next();
});

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs for auth endpoints
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests
    skipSuccessfulRequests: true
});

// Rate limiting for password reset endpoints
const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 password reset actions per 15 minutes
    message: {
        error: 'Too many password reset attempts. Try again in 15 minutes.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiting for resend verification code
const resendVerificationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 resend verification requests per hour
    message: {
        error: 'Too many resend verification attempts, please try again later.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// General API rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per windowMs
    message: {
        error: 'Too many requests, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Apply general rate limiting to all API routes
app.use('/api', apiLimiter);

// Validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn('Validation failed', {
            errors: errors.array(),
            path: req.path,
            method: req.method
        });
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// Common validation rules
const emailValidation = body('email')
    .isEmail()
    .withMessage('Please provide a valid email address');

const passwordValidation = body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number');

// Validation for newPassword field used in reset-password flow
const newPasswordValidation = body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number');

const nameValidation = body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces');

const phoneValidation = body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number');

const textValidation = (field, minLength = 1, maxLength = 1000) =>
    body(field)
        .trim()
        .isLength({ min: minLength, max: maxLength })
        .withMessage(`${field} must be between ${minLength} and ${maxLength} characters`)
        .escape(); // Prevent XSS

app.use((req, res, next) => {
    if (req.path.endsWith('/') && req.path.length > 1 && req.path.startsWith('/api')) {
        const newPath = req.path.slice(0, -1);
        req.url = newPath + req.url.substring(req.path.length);
        logger.debug(`Rewriting URL: ${req.path} -> ${req.url}`);
    }
    next();
});

// Serve public files (both at root and /public prefix for tool compatibility)
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Explicitly serve favicon
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'favicon.ico'));
});

// Remove dangerous root static middleware and redundant views static middleware
// app.use(express.static(path.join(__dirname))); 
// app.use(express.static(path.join(__dirname, 'views')));

app.set('views', path.join(__dirname, 'views'));

app.get('/components/:componentName.html', (req, res) => {
    const componentPath = path.join(__dirname, 'views', 'components', `${req.params.componentName}.html`);
    if (!fs.existsSync(componentPath)) {
        return res.status(404).send(`Component ${req.params.componentName} not found`);
    }
    res.sendFile(componentPath);
});

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

const updateUserSession = async (req, userId) => {
    const client = await pool.connect();
    try {
        const userResult = await client.query('SELECT user_type FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];

        if (user) {
            req.session.userType = user.user_type === 'freelancer' ? 'professional' : user.user_type;
        }

        return new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err) {
                    logger.error('Error saving session after DB update:', err);
                    reject(err);
                } else {
                    logger.debug(`Session for user ${userId} successfully updated.`);
                    resolve();
                }
            });
        });
    } catch (error) {
        logger.error('Error updating user session:', error);
        throw error;
    } finally {
        if (client) client.release();
    }
};



const memoryStorage = multer.memoryStorage();
const upload = multer();
const uploadProfileFiles = multer({
    storage: memoryStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'profilePic') {
            const allowedTypes = /jpeg|jpg|png|gif/;
            const mimetype = allowedTypes.test(file.mimetype);
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            if (mimetype && extname) return cb(null, true);
            cb(new Error('Only JPG, PNG, and GIF image files are allowed for profile pictures.'));
        } else if (file.fieldname === 'cv') {
            const allowedTypes = /pdf|doc|docx/;
            const mimetype = allowedTypes.test(file.mimetype);
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            if (mimetype && extname) return cb(null, true);
            cb(new Error('Only PDF, DOC, and DOCX files are allowed for CVs.'));
        } else {
            cb(null, true);
        }
    }
}).fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'cv', maxCount: 1 }
]);

const uploadServiceImageMiddleware = multer({
    storage: memoryStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only JPG, PNG, and GIF image files are allowed for service images.'));
    }
}).single('serviceImageFile');

const uploadLogo = multer({
    storage: memoryStorage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|svg/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only JPG, PNG, GIF, and SVG image files are allowed for logos'));
    }
}).single('file');

const uploadAdminLogo = multer({
    storage: memoryStorage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|svg/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only JPG, PNG, GIF, and SVG image files are allowed for logos'));
    }
}).single('logo');

const uploadJobImageMiddleware = multer({
    storage: memoryStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only JPG, PNG, and GIF image files are allowed for job images'));
    }
}).single('job_image');


// Add in-memory cache for frequently accessed files
const fileCache = new Map();
const CACHE_MAX_SIZE = 1000; // Maximum number of files to cache
const CACHE_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB max file size to cache

// Cache cleanup function
function cleanupCache() {
    if (fileCache.size > CACHE_MAX_SIZE) {
        const oldestKey = fileCache.keys().next().value;
        fileCache.delete(oldestKey);
    }
}

// Rate limiter for file downloads to prevent excessive egress
const fileDownloadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 file downloads per windowMs
    message: {
        error: 'Too many file download requests, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    keyGenerator: (req) => {
        // Normalize IP for IPv6 users to prevent bypass; include user ID if available
        const ipKey = ipKeyGenerator(req.ip);
        return req.session?.user?.id ? `${ipKey}-${req.session.user.id}` : ipKey;
    }
});

// Supabase Storage file handling functions
async function storeFileInSupabase(userId, fileType, file) {
    try {
        let uploadResult;

        switch (fileType) {
            case 'profile_picture':
                uploadResult = await uploadProfilePicture(file.buffer, file.originalname, file.mimetype, userId);
                break;
            case 'cv':
                uploadResult = await uploadCV(file.buffer, file.originalname, file.mimetype, userId);
                break;
            case 'company_logo':
                uploadResult = await uploadCompanyLogo(file.buffer, file.originalname, file.mimetype, userId);
                break;
            case 'service_image':
                uploadResult = await uploadServiceImage(file.buffer, file.originalname, file.mimetype, userId);
                break;
            case 'job_image':
                uploadResult = await uploadJobImage(file.buffer, file.originalname, file.mimetype, userId);
                break;
            case 'id_verification':
                uploadResult = await uploadIDDocument(file.buffer, file.originalname, file.mimetype, userId);
                break;
            default:
                throw new Error(`Unsupported file type: ${fileType}`);
        }

        return uploadResult.publicUrl;
    } catch (error) {
        logger.error('Error uploading file to Supabase:', error);
        throw error;
    }
}

async function deleteFileFromSupabase(fileUrl, bucket = 'uploads') {
    try {
        if (!fileUrl) return false;

        // 1. Try to extract path from full Supabase URL
        let filePath = extractFilePathFromUrl(fileUrl);
        
        // 2. If it's not a URL, it might be a direct path or a legacy ID
        if (!filePath) {
            if (typeof fileUrl === 'string' && fileUrl.includes('/')) {
                filePath = fileUrl; // It's already a path
            } else {
                // It's likely a legacy file ID from the file_storage table
                const fileId = parseInt(fileUrl);
                if (!isNaN(fileId)) {
                    let client;
                    try {
                        client = await pool.connect();
                        await client.query('DELETE FROM file_storage WHERE id = $1', [fileId]);
                        return true;
                    } catch (err) {
                        logger.error('Error deleting legacy file from database:', err);
                        return false;
                    } finally {
                        if (client) client.release();
                    }
                }
                return false;
            }
        }

        const success = await deleteFile(filePath, bucket);
        return success;
    } catch (error) {
        logger.error('Error deleting file from Supabase:', error);
        return false;
    }
}

// Endpoint moved to routes/storage.js


const checkAuthStatus = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ isAuthenticated: false, error: 'Unauthorized' });
    }
};

function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }

    const isApiRequest = req.originalUrl.startsWith('/api/') || req.originalUrl.startsWith('/admin/');
    if (isApiRequest) {
        return res.status(401).json({ error: 'Not authenticated', redirect: '/login.html' });
    }

    res.redirect('/login.html');
}

function isProfessional(req, res, next) {
    if (req.session.userId && (req.session.userType === 'professional' || req.session.userType === 'freelancer' || req.session.userType === 'admin')) {
        return next();
    }
    
    const isApiRequest = req.originalUrl.startsWith('/api/');
    if (isApiRequest) {
        return res.status(403).json({ error: 'Access Denied: Professional account required.' });
    }
    
    if (req.session.userType === 'employer') {
        return res.redirect('/hire_dashboard.html');
    }
    if (req.session.userType === 'admin') {
        return res.redirect('/admin_dashboard.html');
    }
    res.status(403).send('Access Denied: Professional account required.');
}

function isEmployer(req, res, next) {
    if (req.session.userId && req.session.userType === 'employer') {
        return next();
    }
    
    const isApiRequest = req.originalUrl.startsWith('/api/') || req.originalUrl.startsWith('/admin/');
    if (isApiRequest) {
        return res.status(403).json({ error: 'Access Denied: Employer account required.' });
    }
    
    if (req.session.userType === 'professional' || req.session.userType === 'freelancer') {
        return res.redirect('/dashboard.html');
    }
    if (req.session.userType === 'admin') {
        return res.redirect('/admin_dashboard.html');
    }
    res.status(403).send('Access Denied: Employer account required.');
}

function isAdmin(req, res, next) {
    if (req.session.userId && req.session.userType === 'admin') {
        return next();
    }
    
    const isApiRequest = req.originalUrl.startsWith('/api/') || req.originalUrl.startsWith('/admin/');
    if (isApiRequest) {
        return res.status(403).json({ error: 'Access Denied: Admin account required.' });
    }
    
    if (req.session.userType === 'professional' || req.session.userType === 'freelancer') {
        return res.redirect('/dashboard.html');
    }
    if (req.session.userType === 'employer') {
        return res.redirect('/hire_dashboard.html');
    }
    res.status(403).send('Access Denied: Admin account required.');
}

async function isEmployerVerified(req, res, next) {
    // ID verification check removed for Unlimited access overhaul
    next();
}

const isEmailVerified = async (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
    }
    let client;
    try {
        client = await pool.connect();
        const result = await client.query('SELECT is_email_verified FROM users WHERE id = $1', [req.session.userId]);

        if (result.rows.length > 0 && result.rows[0].is_email_verified === true) {
            next();
        } else {
            const isApiRequest = req.xhr || req.headers.accept?.includes('application/json') || req.originalUrl.startsWith('/api/');
            if (isApiRequest) {
                return res.status(403).json({ success: false, message: 'Email verification required to perform this action. Please check your inbox.' });
            }
            return res.redirect('/email_verification_pending.html?message=email_verification_required');
        }
    } catch (error) {
        logger.error('Error checking email verification status in middleware:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    } finally {
        if (client) client.release();
    }
};


// Routes are registered below...

















// Endpoint moved to routes/applications.js






// Removed: /api/employer/verify-id (obsolete)

























// Bulk reject all pending applicants for a job








// New endpoint to get services for the authenticated professional.
// --- Contact form submission endpoint ---
app.post('/api/contact', async (req, res) => {
    try {
        const formData = req.body;
        logger.info('Contact form submission received', { formData });
        const emailResult = await sendContactFormEmail(formData);
        if (emailResult.success) {
            res.json({ success: true, message: 'Message sent successfully.' });
        } else {
            logger.error('Failed to send contact form email:', emailResult.error);
            res.status(500).json({ success: false, message: 'Failed to send message.' });
        }
    } catch (error) {
        logger.error('Error in /api/contact endpoint:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});














// Endpoint moved to routes/messages.js

// Endpoint moved to routes/messages.js

// Endpoint moved to routes/messages.js

// Endpoint moved to routes/messages.js


// ADMIN DASHBOARD API ROUTES
// ---
// All admin routes should be protected by the `isAuthenticated` and `isAdmin` middleware.
// This ensures that only logged-in administrators can access these endpoints.
// ---

/**
 * Endpoint to get dashboard statistics for the overview section.
 */

/**
 * Endpoint to get all professionals with optional search and filter.
 */

/**
 * Endpoint to get all employers with optional search and filter.
 */

/**
 * Endpoint to update a user's verification status.
 */

/**
 * Endpoint to get all jobs with optional search and filters.
 */

/**
 * Endpoint to get all reviews.
 */

/**
 * Endpoint to get a list of potential recipients for job alerts based on filters.
 */



/**
 * Endpoint to get jobs with applications for admin notifications.
 */

/**
 * Endpoint to send job application notifications to employers.
 */

/**
 * Endpoint to send manual job alerts to a filtered list of users.
 */

/**
 * Endpoint to send a general email campaign.
 */







// Email Campaign Progress Tracking
const emailCampaignProgress = new Map(); // In-memory storage for progress tracking
global.emailCampaignProgress = emailCampaignProgress; // Make it globally accessible

/**
 * Endpoint to get email campaign progress.
 */

/**
 * Endpoint to start a batch email campaign with progress tracking.
 */

/**
 * Endpoint to stop a running email campaign.
 */

// Admin Logo Management Endpoints



// --- Jobs routes registered in routes/jobs.js ---
const registerJobsRoutes = require('./routes/jobs');
const { autoCloseExpiredJobs } = registerJobsRoutes(app, pool, {
    isAuthenticated,
    isEmployer,
    isEmployerVerified,
    isEmailVerified,
    isProfessional,
    upload,
    uploadJobImageMiddleware,
    storeFileInSupabase,
    deleteFileFromSupabase,
    sendApplicationRejectedEmail,
    handleValidationErrors,
    sendEmail
});

const registerApplicationsRoutes = require('./routes/applications');
registerApplicationsRoutes(app, pool, {
    isAuthenticated,
    isEmployer,
    isEmployerVerified,
    isProfessional,
    isEmailVerified,
    upload,
    sendApplicationAcceptedEmail,
    sendApplicationRejectedEmail,
    handleValidationErrors
});

// AI Assistant routes
const registerAIRoutes = require('./routes/ai');
registerAIRoutes(app, pool, { isAuthenticated, isEmployer, handleValidationErrors });

// Interviews routes
const registerInterviewRoutes = require('./routes/interviews');
registerInterviewRoutes(app, pool, { isAuthenticated, isEmployer });

const registerUserRoutes = require('./routes/user');
const userService = require('./services/userService');
const EducationService = require('./services/educationService');
const educationService = new EducationService(pool);

// Initialize Job Aggregation Service early for route registration
const jobAggregator = new JobAggregationService(pool);
app.set('jobAggregator', jobAggregator);

const aiEvaluationService = new AIEvaluationService(pool);
app.set('aiEvaluationService', aiEvaluationService);

const employerOutreach = new EmployerOutreachService(pool, app);
app.set('employerOutreach', employerOutreach);

registerUserRoutes(app, pool, {
    isAuthenticated,
    isProfessional,
    isEmailVerified,
    uploadServiceImageMiddleware,
    uploadProfileFiles,
    storeFileInSupabase,
    deleteFileFromSupabase,
    getOptimizedImageUrl,
    handleValidationErrors,
    userService,
    educationService
});

const registerReviewsRoutes = require('./routes/reviews');
registerReviewsRoutes(app, pool, {
    isAuthenticated,
    isAdmin,
    isEmployer,
    isEmailVerified,
    updateProfessionalRating,
    updateEmployerRating
});

const registerEmployersRoutes = require('./routes/employers');
registerEmployersRoutes(app, pool, {
    isAuthenticated,
    isEmployer,
    isEmailVerified,
    uploadProfileFiles,
    uploadLogo,
    storeFileInSupabase,
    deleteFileFromSupabase,
    autoCloseExpiredJobs
});

const registerServicesRoutes = require('./routes/services');
registerServicesRoutes(app, pool, { getOptimizedImageUrl });

const registerPreferencesRoutes = require('./routes/preferences');
registerPreferencesRoutes(app, pool, { isAuthenticated });

// Messages routes removed per request

const registerAdminRoutes = require('./routes/admin');
registerAdminRoutes(app, pool, {
    isAuthenticated,
    isAdmin,
    uploadAdminLogo,
    storeFileInSupabase,
    deleteFileFromSupabase,
    sendManualJobAlerts,
    sendEmailCampaign,
    sendEmailCampaignTest,
    sendEmailCampaignWithProgress,
    sendVerificationEmail,
    sendEmail,
    checkAuthStatus,
    employerOutreach
});

const registerAutoEmailRoutes = require('./routes/autoEmail');
registerAutoEmailRoutes(app, pool, { isAuthenticated, isAdmin });

// --- Auth routes registered in routes/auth.js ---
const registerAuthRoutes = require('./routes/auth');
registerAuthRoutes(app, pool, {
    authLimiter,
    passwordResetLimiter,
    resendVerificationLimiter,
    emailValidation,
    passwordValidation,
    newPasswordValidation,
    handleValidationErrors,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendPasswordResetConfirmationEmail,
    sendAccountActivationEmail,
    supabaseAdmin,
    autoCloseExpiredJobs,
    educationService
});

// --- Talent routes registered in routes/talent.js ---
const registerTalentRoutes = require('./routes/talent');
registerTalentRoutes(app, pool, { isAuthenticated, isEmployer, isEmployerVerified, handleValidationErrors });

// --- Storage routes registered in routes/storage.js ---
const registerStorageRoutes = require('./routes/storage');
registerStorageRoutes(app, pool, {
    isAuthenticated,
    isProfessional,
    isEmailVerified,
    deleteFileFromSupabase,
    fileDownloadLimiter,
    performanceMonitor,
    fileCache,
    CACHE_MAX_SIZE,
    CACHE_MAX_FILE_SIZE,
    supportsWebP,
    getCacheDuration,
    cleanupCache
});

// --- Employer Review routes ---
const registerEmployerReviewRoutes = require('./routes/employerReview');
registerEmployerReviewRoutes(app, pool, { sendEmployerLeadOTPEmail });

// --- Pages routes (SPA) - Must be registered AFTER all API and Admin routes ---
const registerPagesRoutes = require('./routes/pages');
registerPagesRoutes(app, { isAuthenticated, isProfessional, isEmployer, isEmployerVerified, isAdmin, pool });

// Existing endpoints
// ... (All existing routes remain the same)







// New endpoint to add a service








async function updateProfessionalRating(professionalUserId, client) {
    try {
        const reviewsResult = await client.query(`
            SELECT r.rating
            FROM reviews r
            WHERE r.professional_id = $1
        `, [professionalUserId]);

        const ratings = reviewsResult.rows.map(row => row.rating);

        let newAverageRating = 0;
        if (ratings.length > 0) {
            const sum = ratings.reduce((acc, current) => acc + current, 0);
            newAverageRating = sum / ratings.length;
        }

        await client.query(
            'UPDATE professionals SET rating = $1 WHERE user_id = $2',
            [newAverageRating, professionalUserId]
        );
        logger.info(`Professional ${professionalUserId} rating updated to: ${newAverageRating}`);
    } catch (error) {
        logger.error('Error updating professional rating:', error);
    }
}

async function updateEmployerRating(employerUserId, client) {
    try {
        const reviewsResult = await client.query(`
            SELECT r.rating
            FROM employer_reviews r
            WHERE r.employer_id = $1
        `, [employerUserId]);

        const ratings = reviewsResult.rows.map(row => row.rating);

        let newAverageRating = 0;
        if (ratings.length > 0) {
            const sum = ratings.reduce((acc, current) => acc + current, 0);
            newAverageRating = sum / ratings.length;
        }

        await client.query(
            'UPDATE employers SET rating = $1 WHERE user_id = $2',
            [newAverageRating, employerUserId]
        );
        logger.info(`Employer ${employerUserId} rating updated to: ${newAverageRating}`);
    } catch (error) {
        logger.error('Error updating employer rating:', error);
    }
}




// New endpoint to get a professional's services








app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API Endpoint not found' });
});

app.get('*', (req, res, next) => {
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', 'hirly', 'index.html'));
    } else {
        const error = new Error('Not Found');
        error.status = 404;
        next(error);
    }
});

app.use(errorHandler);

// Add health check endpoint for Cloud Run
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server immediately, initialize database asynchronously
const server = app.listen(PORT, () => {
    logger.info(`Server is live on http://localhost:${PORT}`);
    logger.info('Health check endpoint available at /health');

    // Initialize Socket.io
    initRealtime(server, pool);

    // Initialize schedule and database asynchronously
    if (process.env.DISABLE_INTERNAL_CRON === 'true') {
        logger.info('Internal cron scheduler is DISABLED (External trigger mode)');
    } else {
        jobAggregator.initSchedule();
        employerOutreach.initSchedule();
        logger.info('Internal cron scheduler is ACTIVE');
    }

    initializeDatabase().then(async () => {
        logger.info('Job Aggregation Service ready for full operation.');
    });

    // Start performance monitoring
    logger.info('Performance monitoring initialized');

    // Log performance stats every 5 minutes
    setInterval(() => {
        performanceMonitor.logCurrentStats();
    }, 5 * 60 * 1000);

    // Log initial baseline
    setTimeout(() => {
        logger.info('Logging initial performance baseline');
        performanceMonitor.logCurrentStats();
    }, 10000); // Wait 10 seconds for initial requests
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. Please try a different port.`);
    } else {
        logger.error('Error starting server:', err.message);
    }
    process.exit(1);
});

async function gracefulShutdown(signal) {
    logger.info(`Received ${signal}. Performing graceful shutdown...`);

    try {
        await new Promise((resolve) => server.close(resolve));
        logger.info('Server closed.');

        await pool.end();
        logger.info('Database connections closed.');

        logger.info('Graceful shutdown completed.');
        process.exit(0);
    } catch (err) {
        logger.error('Error during graceful shutdown:', err);
        process.exit(1);
    }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
