const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function seedJobSources() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Deactivate ALL existing Palestinian sources to start clean
        await client.query("UPDATE job_sources SET active = false WHERE country_code = 'PS'");

        const sources = [
            // ==========================================
            // JOBS.PS MASTER CATEGORIES (PRIMARY ENGINE)
            // ==========================================
            {
                name: 'Jobs.ps - Tech & IT',
                type: 'scraper',
                country_code: 'PS',
                base_url: 'https://www.jobs.ps/categories/it-jobs',
                config: {
                    collector: 'static',
                    pages: 15,
                    selectors: {
                        job_item: 'a.list-3--row',
                        title: '.list-3--cell-title-2',
                        company: '.list--cell--company',
                        location: '.list-3--cell-1 span.tooltip'
                    }
                },
                priority: 1
            },
            {
                name: 'Jobs.ps - Business & Admin',
                type: 'scraper',
                country_code: 'PS',
                base_url: 'https://www.jobs.ps/categories/business-administration-jobs',
                config: {
                    collector: 'static',
                    pages: 15,
                    selectors: {
                        job_item: 'a.list-3--row',
                        title: '.list-3--cell-title-2',
                        company: '.list--cell--company',
                        location: '.list-3--cell-1 span.tooltip'
                    }
                },
                priority: 1
            },
            {
                name: 'Jobs.ps - Sales & Marketing',
                type: 'scraper',
                country_code: 'PS',
                base_url: 'https://www.jobs.ps/categories/sales-marketing-jobs',
                config: {
                    collector: 'static',
                    pages: 15,
                    selectors: {
                        job_item: 'a.list-3--row',
                        title: '.list-3--cell-title-2',
                        company: '.list--cell--company',
                        location: '.list-3--cell-1 span.tooltip'
                    }
                },
                priority: 1
            },
            {
                name: 'Jobs.ps - Accounting & Finance',
                type: 'scraper',
                country_code: 'PS',
                base_url: 'https://www.jobs.ps/categories/accounting-finance-jobs',
                config: {
                    collector: 'static',
                    pages: 15,
                    selectors: {
                        job_item: 'a.list-3--row',
                        title: '.list-3--cell-title-2',
                        company: '.list--cell--company',
                        location: '.list-3--cell-1 span.tooltip'
                    }
                },
                priority: 1
            },
            {
                name: 'Jobs.ps - Engineering',
                type: 'scraper',
                country_code: 'PS',
                base_url: 'https://www.jobs.ps/categories/engineering-jobs',
                config: {
                    collector: 'static',
                    pages: 10,
                    selectors: {
                        job_item: 'a.list-3--row',
                        title: '.list-3--cell-title-2',
                        company: '.list--cell--company',
                        location: '.list-3--cell-1 span.tooltip'
                    }
                },
                priority: 1
            },
            {
                name: 'Jobs.ps - Healthcare',
                type: 'scraper',
                country_code: 'PS',
                base_url: 'https://www.jobs.ps/categories/healthcare-jobs',
                config: {
                    collector: 'static',
                    pages: 10,
                    selectors: {
                        job_item: 'a.list-3--row',
                        title: '.list-3--cell-title-2',
                        company: '.list--cell--company',
                        location: '.list-3--cell-1 span.tooltip'
                    }
                },
                priority: 2
            },
            {
                name: 'Jobs.ps - Education',
                type: 'scraper',
                country_code: 'PS',
                base_url: 'https://www.jobs.ps/categories/education-training-jobs',
                config: {
                    collector: 'static',
                    pages: 10,
                    selectors: {
                        job_item: 'a.list-3--row',
                        title: '.list-3--cell-title-2',
                        company: '.list--cell--company',
                        location: '.list-3--cell-1 span.tooltip'
                    }
                },
                priority: 2
            },
            // ==========================================
            // SECONDARY AGGREGATORS
            // ==========================================
            {
                name: 'JobMatch.ps',
                type: 'scraper',
                country_code: 'PS',
                base_url: 'https://jobmatch.ps/jobs',
                config: {
                    collector: 'static',
                    pages: 5,
                    selectors: {
                        job_item: '.job-listing, .job-item, .card',
                        title: '.job-title, h5, h2',
                        company: '.company-name, .employer, .company',
                        location: '.location, .city'
                    }
                },
                priority: 3
            }
        ];

        for (const source of sources) {
            await client.query(`
                INSERT INTO job_sources (name, type, country_code, base_url, config, priority, active)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (name) DO UPDATE SET 
                    base_url = EXCLUDED.base_url,
                    config = EXCLUDED.config,
                    priority = EXCLUDED.priority,
                    active = EXCLUDED.active,
                    updated_at = NOW()
            `, [source.name, source.type, source.country_code, source.base_url, source.config, source.priority, true]);
        }

        await client.query('COMMIT');
        console.log(`Successfully focused Palestine pipeline on ${sources.length} strategic category feeds.`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error seeding job sources:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

seedJobSources();
