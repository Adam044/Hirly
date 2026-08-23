const logger = require('../utils/logger');

/**
 * Initializes the database schema by creating tables if they do not exist.
 * This is a safe operation that uses CREATE TABLE IF NOT EXISTS.
 */
async function initializeDatabaseSchema(pool) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Ensure pgcrypto extension is available for UUID generation
        await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

        // 1. Users Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                phone TEXT,
                city TEXT,
                user_type TEXT NOT NULL CHECK (user_type IN ('professional', 'employer', 'admin')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_email_verified BOOLEAN DEFAULT false,
                profile_picture_url TEXT,
                auth_user_id UUID UNIQUE,
                gender TEXT CHECK (gender IN ('male', 'female')),
                birthdate DATE,
                slug TEXT UNIQUE,
                country TEXT
            );
        `);

        // 2. Employers Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS employers (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE REFERENCES users(id),
                company_name TEXT,
                company_description TEXT,
                address TEXT,
                id_verification_path TEXT,
                verification_status TEXT DEFAULT 'Not Submitted' CHECK (verification_status IN ('Not Submitted', 'Pending Verification', 'Verified', 'Rejected')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                id_rejection_reason TEXT,
                employer_type TEXT,
                company_email TEXT,
                company_phone TEXT,
                company_logo_path TEXT,
                company_category TEXT,
                job_post_credits INTEGER DEFAULT 0 CHECK (job_post_credits >= 0),
                profile_views INTEGER DEFAULT 0,
                has_claimed_free_credit BOOLEAN DEFAULT false,
                rating REAL DEFAULT 0,
                website_link TEXT
            );
        `);

        // 3. Professionals Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS professionals (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE REFERENCES users(id),
                skills TEXT,
                bio TEXT,
                cv_path TEXT,
                id_verification_path TEXT,
                verification_status TEXT DEFAULT 'Not Submitted' CHECK (verification_status IN ('Not Submitted', 'Pending Verification', 'Verified', 'Rejected')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                profession TEXT,
                current_status TEXT DEFAULT 'Don''t Work',
                interested_professions JSONB,
                profile_views_count INTEGER,
                rating REAL,
                id_rejection_reason TEXT,
                privacy_visibility TEXT DEFAULT 'ALL' CHECK (privacy_visibility IN ('ALL', 'companies', 'none')),
                privacy_hide_contact_info BOOLEAN DEFAULT false,
                cv_text TEXT,
                cv_text_updated_at TIMESTAMP,
                employer_views_count INTEGER DEFAULT 0,
                website_link TEXT
            );
        `);

        // 4. Jobs Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS jobs (
                id SERIAL PRIMARY KEY,
                employer_id INTEGER REFERENCES users(id),
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                budget DOUBLE PRECISION,
                deadline DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'open',
                job_type TEXT,
                city TEXT,
                job_site_type TEXT,
                timeline TEXT,
                profession_required JSONB,
                job_image_path TEXT,
                currency TEXT,
                auto_outreach_sent BOOLEAN DEFAULT false,
                has_been_sent BOOLEAN DEFAULT false,
                external_apply_url TEXT,
                requirements JSONB,
                external_apply_clicks INTEGER DEFAULT 0,
                views_count INTEGER DEFAULT 0,
                gender_requirement TEXT CHECK (gender_requirement IN ('male', 'female', 'any')),
                age_min INTEGER,
                age_max INTEGER,
                job_dossier JSONB,
                is_external BOOLEAN DEFAULT false,
                external_source TEXT,
                external_company_name TEXT,
                external_company_logo TEXT,
                external_id TEXT,
                country VARCHAR
            );
        `);

        // 5. Applications Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS applications (
                id SERIAL PRIMARY KEY,
                job_id INTEGER REFERENCES jobs(id),
                professional_id INTEGER REFERENCES users(id),
                proposal_message TEXT,
                bid_amount DOUBLE PRECISION,
                cv_path TEXT,
                timeline TEXT,
                status TEXT DEFAULT 'pending',
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                rejection_reason TEXT
            );
        `);

        // 6. Contracts Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS contracts (
                id SERIAL PRIMARY KEY,
                job_id INTEGER UNIQUE REFERENCES jobs(id),
                professional_id INTEGER NOT NULL REFERENCES users(id),
                employer_id INTEGER NOT NULL REFERENCES users(id),
                start_date DATE,
                end_date DATE,
                agreed_amount REAL,
                status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 7. Payments Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                contract_id INTEGER REFERENCES contracts(id),
                amount DOUBLE PRECISION,
                status TEXT CHECK (status IN ('pending', 'completed', 'failed')),
                transaction_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 8. Profile Views Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS profile_views (
                id SERIAL PRIMARY KEY,
                viewer_id INTEGER REFERENCES employers(id),
                professional_id INTEGER REFERENCES professionals(id),
                viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 10. Categories Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL UNIQUE
            );
        `);

        // 11. Job Categories Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS job_categories (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL UNIQUE
            );
        `);

        // 12. Email Notifications Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS email_notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                job_id INTEGER REFERENCES jobs(id),
                email_type TEXT NOT NULL,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 13. Email Preferences Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS email_preferences (
                user_id INTEGER PRIMARY KEY REFERENCES users(id),
                notifications_enabled BOOLEAN DEFAULT true,
                notification_frequency TEXT DEFAULT 'daily' CHECK (notification_frequency IN ('daily', 'weekly', 'monthly', 'none')),
                last_notification_sent TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 14. Email Verification Tokens Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS email_verification_tokens (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                token TEXT NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 15. Job Outreach Recipients Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS job_outreach_recipients (
                job_id INTEGER NOT NULL REFERENCES jobs(id),
                professional_id INTEGER NOT NULL REFERENCES users(id),
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (job_id, professional_id)
            );
        `);

        // 16. Reviews Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                job_id INTEGER NOT NULL REFERENCES jobs(id),
                professional_id INTEGER NOT NULL REFERENCES users(id),
                reviewer_id INTEGER NOT NULL REFERENCES users(id),
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 17. File Storage Table (Legacy - Deprecated in favor of Supabase Storage)
        /*
        await client.query(`
            CREATE TABLE IF NOT EXISTS file_storage (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                file_type VARCHAR NOT NULL CHECK (file_type IN ('cv', 'cv_webp', 'id_verification', 'id_verification_webp', 'company_logo', 'company_logo_webp', 'job_image', 'job_image_webp', 'profile_picture', 'profile_picture_webp', 'service_image', 'service_image_webp')),
                file_name TEXT NOT NULL,
                mime_type TEXT NOT NULL,
                file_data BYTEA NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                parent_file_id INTEGER REFERENCES file_storage(id)
            );
        `);
        */

        // 18. User Sessions Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_sessions (
                sid VARCHAR PRIMARY KEY,
                sess JSON NOT NULL,
                expire TIMESTAMP NOT NULL
            );
        `);

        // 19. Password Reset Tokens Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                token TEXT NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 20. Services Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS services (
                id SERIAL PRIMARY KEY,
                professional_id INTEGER NOT NULL REFERENCES professionals(id),
                service_title TEXT NOT NULL,
                service_description TEXT,
                price REAL,
                currency TEXT,
                delivery_time TEXT,
                service_image_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                category TEXT
            );
        `);

        // 21. Job Application Notifications Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS job_application_notifications (
                id SERIAL PRIMARY KEY,
                job_id INTEGER UNIQUE REFERENCES jobs(id),
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                sent_by_admin_id INTEGER REFERENCES users(id)
            );
        `);

        // 22. Gift Codes Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS gift_codes (
                id SERIAL PRIMARY KEY,
                code TEXT NOT NULL UNIQUE,
                gift_type TEXT NOT NULL CHECK (gift_type IN ('pro_membership', 'job_credits', 'profile_view_credits')),
                credits_value INTEGER,
                pro_duration_days INTEGER,
                notes TEXT,
                is_redeemed BOOLEAN DEFAULT false,
                redeemed_by_user_id INTEGER REFERENCES users(id),
                redeemed_at TIMESTAMP WITH TIME ZONE,
                expires_at TIMESTAMP WITH TIME ZONE,
                created_by_admin_id INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                usage_limit INTEGER,
                used_count INTEGER DEFAULT 0
            );
        `);

        // 23. Gift Code Redemptions Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS gift_code_redemptions (
                id SERIAL PRIMARY KEY,
                code_id INTEGER NOT NULL REFERENCES gift_codes(id),
                user_id INTEGER NOT NULL REFERENCES users(id),
                redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 24. Gift Code Items Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS gift_code_items (
                id SERIAL PRIMARY KEY,
                code_id INTEGER NOT NULL REFERENCES gift_codes(id),
                item_type TEXT NOT NULL CHECK (item_type IN ('pro_membership', 'job_credits', 'profile_view_credits')),
                credits_value INTEGER,
                pro_duration_days INTEGER
            );
        `);

        // 25. Application AI Evaluations Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS application_ai_evaluations (
                id SERIAL PRIMARY KEY,
                application_id INTEGER UNIQUE REFERENCES applications(id),
                match_score INTEGER,
                summary TEXT,
                strengths JSONB,
                weaknesses JSONB,
                verdict TEXT,
                analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                full_report TEXT,
                parameters JSONB
            );
        `);

        // 26. Deep Reports Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS deep_reports (
                application_id INTEGER PRIMARY KEY REFERENCES applications(id),
                detailed_summary TEXT,
                detailed_strengths JSONB,
                detailed_weaknesses JSONB,
                interview_questions JSONB,
                detailed_report_html TEXT,
                analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 27. Interview Sessions Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS interview_sessions (
                id SERIAL PRIMARY KEY,
                application_id INTEGER REFERENCES applications(id),
                job_id INTEGER REFERENCES jobs(id),
                employer_id INTEGER REFERENCES users(id),
                professional_id INTEGER REFERENCES users(id),
                token TEXT NOT NULL UNIQUE,
                instructions TEXT,
                language TEXT DEFAULT 'ar',
                status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'expired')),
                expires_at TIMESTAMP,
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                invitation_response TEXT DEFAULT 'pending',
                duration_minutes INTEGER
            );
        `);

        // 28. Interview Messages Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS interview_messages (
                id SERIAL PRIMARY KEY,
                session_id INTEGER REFERENCES interview_sessions(id),
                sender TEXT NOT NULL CHECK (sender IN ('ai', 'applicant')),
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 29. Interview Reports Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS interview_reports (
                id SERIAL PRIMARY KEY,
                session_id INTEGER UNIQUE REFERENCES interview_sessions(id),
                summary TEXT,
                score INTEGER,
                wage_expectation TEXT,
                budget_alignment TEXT,
                readiness TEXT,
                concerns JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 30. Job Calibrations Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS job_calibrations (
                job_id INTEGER PRIMARY KEY REFERENCES jobs(id),
                analysis_json JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // 31. Employer Reviews Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS employer_reviews (
                id SERIAL PRIMARY KEY,
                employer_id INTEGER NOT NULL REFERENCES users(id),
                reviewer_id INTEGER NOT NULL REFERENCES users(id),
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 32. Email Logs Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS email_logs (
                id SERIAL PRIMARY KEY,
                sender_email TEXT NOT NULL,
                recipient_email TEXT NOT NULL,
                subject TEXT,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 33. Visitor Logs Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS visitor_logs (
                id SERIAL PRIMARY KEY,
                visitor_id TEXT NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                page_path TEXT,
                referrer TEXT,
                device_type TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Index for visitor logs performance (Fast AF)
        await client.query('CREATE INDEX IF NOT EXISTS idx_visitor_logs_created_at ON visitor_logs(created_at);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_visitor_logs_visitor_id ON visitor_logs(visitor_id);');

        // 34. System Settings Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                key TEXT PRIMARY KEY,
                value JSONB NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 35. Job Sources Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS job_sources (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR NOT NULL UNIQUE,
                type VARCHAR NOT NULL CHECK (type IN ('api', 'rss', 'scraper')),
                country_code VARCHAR,
                base_url TEXT,
                config JSONB DEFAULT '{}',
                active BOOLEAN DEFAULT true,
                priority INTEGER DEFAULT 100,
                last_sync TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        // 36. Raw Jobs Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS raw_jobs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                source_id UUID REFERENCES job_sources(id),
                external_id VARCHAR,
                external_url TEXT,
                job_text TEXT,
                raw_payload JSONB NOT NULL,
                status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed', 'duplicate', 'spam')),
                fetch_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(source_id, external_id)
            );
        `);

        // 37. Job Review Queue Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS job_review_queue (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                raw_job_id UUID REFERENCES raw_jobs(id),
                final_job_id INTEGER REFERENCES jobs(id),
                ai_extracted JSONB,
                ai_confidence_score NUMERIC,
                duplicate_warnings JSONB,
                status VARCHAR DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected', 'auto_approved')),
                reviewed_by INTEGER REFERENCES users(id),
                reviewed_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        // 38. Employer Lead OTPs Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS employer_lead_otps (
                id SERIAL PRIMARY KEY,
                job_id INTEGER NOT NULL REFERENCES jobs(id),
                email TEXT NOT NULL,
                otp TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Add country column to users if it doesn't exist
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='country') THEN
                    ALTER TABLE users ADD COLUMN country TEXT;
                END IF;
            END $$;
        `);

        // Migration: Rename profile_view_credits to profile_views in employers table
        await client.query(`
            DO $$ 
            BEGIN 
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employers' AND column_name='profile_view_credits') THEN
                    ALTER TABLE employers RENAME COLUMN profile_view_credits TO profile_views;
                END IF;
            END $$;
        `);

        // 24. Education Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS education (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                type TEXT NOT NULL CHECK (type IN ('university', 'school', 'certificate', 'course')),
                institution_name TEXT NOT NULL,
                institution_id TEXT,
                title TEXT NOT NULL,
                field_of_study TEXT,
                education_level TEXT,
                start_date DATE,
                end_date DATE,
                is_current BOOLEAN DEFAULT false,
                grade_score TEXT,
                credential_url TEXT,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 39. Lead Tracking Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS lead_tracking (
                id SERIAL PRIMARY KEY,
                job_id INTEGER NOT NULL REFERENCES jobs(id),
                email TEXT NOT NULL,
                event_type TEXT NOT NULL CHECK (event_type IN ('page_access', 'cta_click', 'otp_stage_reached', 'otp_verify_success', 'workspace_created')),
                ip_address TEXT,
                user_agent TEXT,
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query('COMMIT');
        logger.info('Full Database schema initialized successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Error initializing database schema:', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Resets the SERIAL sequences for all main tables to match the current MAX(id).
 * Prevents "duplicate key value violates unique constraint" errors after manual inserts.
 */
async function resetSequence(pool) {
    const client = await pool.connect();
    try {
        const tables = [
            'users', 'employers', 'professionals', 'jobs', 'applications', 
            'contracts', 'payments', 'profile_views', 'categories', 
            'job_categories', 'email_notifications', 'email_verification_tokens', 
            'reviews', 'password_reset_tokens', 'services', 
            'job_application_notifications', 'gift_codes', 'gift_code_redemptions', 
            'gift_code_items', 'application_ai_evaluations', 'interview_sessions', 
            'interview_messages', 'interview_reports', 'employer_reviews', 
            'email_logs', 'visitor_logs'
        ];
        
        for (const table of tables) {
            const seqCheck = await client.query(`
                SELECT pg_get_serial_sequence('${table}', 'id') as seq_name
            `);
            
            const seqName = seqCheck.rows[0].seq_name;
            if (seqName) {
                await client.query(`
                    SELECT setval('${seqName}', 
                    COALESCE((SELECT MAX(id) FROM ${table}), 1), 
                    (SELECT MAX(id) FROM ${table}) IS NOT NULL);
                `);
            }
        }
        logger.info('All Database sequences reset successfully');
    } catch (error) {
        logger.warn('Error resetting database sequences (this is non-critical):', error.message);
    } finally {
        client.release();
    }
}

async function cleanupLegacyEducationColumns(pool) {
    const client = await pool.connect();
    try {
        logger.info('Cleaning up legacy education columns from professionals table...');
        const columnsToRemove = [
            'degree', 'degree_field', 'university', 'student_type', 
            'study_status', 'school_grade', 'field_category', 
            'has_education', 'education_history', 'university_year'
        ];
        
        for (const col of columnsToRemove) {
            await client.query(`
                DO $$ 
                BEGIN 
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='professionals' AND column_name='${col}') THEN
                        ALTER TABLE professionals DROP COLUMN ${col};
                    END IF;
                END $$;
            `);
        }
        logger.info('Legacy education columns cleanup completed.');
    } catch (error) {
        logger.error('Error during education columns cleanup:', error);
    } finally {
        client.release();
    }
}

module.exports = {
    initializeDatabaseSchema,
    resetSequence,
    cleanupLegacyEducationColumns
};
