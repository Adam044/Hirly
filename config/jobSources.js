/**
 * Job Sources Configuration
 * 
 * Centralized configuration for all job aggregation sources.
 * These configurations are seeded into the job_sources database table
 * and can be managed via the admin dashboard.
 * 
 * Add new sources here for Palestine, Jordan, and other MENA regions.
 */

const logger = require('../utils/logger');

const jobSources = [
    // ==========================================
    // EXISTING SOURCES (Phase 1 - Keep Working)
    // ==========================================
    
    {
        name: 'Adzuna UAE',
        type: 'api',
        country_code: 'ae',
        base_url: 'https://api.adzuna.com/v1/api/jobs',
        active: true,
        priority: 10,
        config: {
            app_id_env: 'ADZUNA_APP_ID',
            app_key_env: 'ADZUNA_APP_KEY',
            results_per_page: 20,
            keywords: ['software', 'marketing', 'sales', 'engineering', 'design', 'management']
        }
    },
    {
        name: 'Adzuna Saudi Arabia',
        type: 'api',
        country_code: 'sa',
        base_url: 'https://api.adzuna.com/v1/api/jobs',
        active: true,
        priority: 10,
        config: {
            app_id_env: 'ADZUNA_APP_ID',
            app_key_env: 'ADZUNA_APP_KEY',
            results_per_page: 20,
            keywords: ['software', 'marketing', 'sales', 'engineering']
        }
    },
    {
        name: 'Jooble MENA',
        type: 'api',
        country_code: 'ae',
        base_url: 'https://api.jooble.org/api/v2/jobs',
        active: true,
        priority: 20,
        config: {
            api_key_env: 'JOOBLE_API_KEY',
            keywords: ['job', 'software', 'marketing', 'engineering', 'design'],
            countries: {
                'ae': 'United Arab Emirates',
                'sa': 'Saudi Arabia',
                'qa': 'Qatar',
                'kw': 'Kuwait',
                'eg': 'Egypt',
                'om': 'Oman',
                'bh': 'Bahrain',
                'jo': 'Jordan',
                'ps': 'Palestine',
                'iq': 'Iraq',
                'lb': 'Lebanon'
            }
        }
    },
    {
        name: 'Careerjet Middle East',
        type: 'api',
        country_code: 'ae',
        base_url: 'http://public.api.careerjet.net/search',
        active: true,
        priority: 30,
        config: {
            affid_env: 'CAREERJET_AFFID',
            keywords: ['job', 'software', 'marketing', 'engineering'],
            locales: {
                'ae': 'en_AE', 'sa': 'en_SA', 'qa': 'en_QA', 'kw': 'en_KW',
                'eg': 'en_EG', 'om': 'en_OM', 'bh': 'en_BH', 'jo': 'en_JO', 
                'iq': 'en_IQ', 'ps': 'en_PS'
            }
        }
    },

    // ==========================================
    // NEW PALESTINE & REGIONAL SOURCES (Phase 2)
    // ==========================================
    
    // Note: These are placeholders for future implementation
    // When you find actual RSS feeds or APIs for Palestine, uncomment and configure
    
    /*
    {
        name: 'PalJobs RSS',
        type: 'rss',
        country_code: 'ps',
        base_url: 'https://paljobs.ps/feed',
        active: false, // Set to true when ready
        priority: 15,
        config: {
            feed_type: 'rss',
            parser_config: {
                customFields: {
                    item: ['job_type', 'salary', 'company']
                }
            }
        }
    },
    {
        name: 'Wazzuf Palestine',
        type: 'api',
        country_code: 'ps',
        base_url: 'https://api.wuzzuf.net/v1/jobs',
        active: false,
        priority: 25,
        config: {
            api_key_env: 'WUZZUF_API_KEY',
            country_filter: 'Palestine'
        }
    },
    {
        name: 'LinkedIn Jobs API',
        type: 'api',
        country_code: 'ps',
        base_url: 'https://api.linkedin.com/v2/jobs',
        active: false,
        priority: 40,
        config: {
            client_id_env: 'LINKEDIN_CLIENT_ID',
            client_secret_env: 'LINKEDIN_CLIENT_SECRET',
            geo_urns: ['urn:li:geo:106725866'] // Palestine geo URN
        }
    },
    {
        name: 'RemoteOK Palestine',
        type: 'api',
        country_code: 'ps',
        base_url: 'https://remoteok.io/api',
        active: false,
        priority: 50,
        config: {
            tags: ['remote', 'palestine', 'arabic']
        }
    }
    */
];

/**
 * Seed job sources into database
 * Run this once during setup to populate job_sources table
 */
async function seedJobSources(pool) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        for (const source of jobSources) {
            // Check if source already exists
            const existing = await client.query(
                'SELECT id FROM job_sources WHERE name = $1',
                [source.name]
            );
            
            if (existing.rows.length === 0) {
                await client.query(
                    `INSERT INTO job_sources 
                     (name, type, country_code, base_url, active, priority, config, last_sync)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, NULL)`,
                    [
                        source.name,
                        source.type,
                        source.country_code,
                        source.base_url,
                        source.active,
                        source.priority,
                        JSON.stringify(source.config)
                    ]
                );
                logger.info(`Seeded job source: ${source.name}`);
            }
        }
        
        await client.query('COMMIT');
        logger.info('Job sources seeding complete');
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Error seeding job sources:', error);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    jobSources,
    seedJobSources
};
