require('dotenv').config({ quiet: true });
const { Pool } = require('pg');
const object = value => { try { return typeof value === 'string' ? JSON.parse(value) : value || {}; } catch { return {}; } };

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  const client = await pool.connect();
  try {
    await client.query('BEGIN READ ONLY');
    await client.query("SET LOCAL statement_timeout = '15s'");
    const result = await client.query(`
      SELECT a.id, a.job_id, j.title, concat_ws(' ', u.first_name, u.last_name) AS name,
        e.match_score, e.verdict, e.full_report, e.parameters, e.analyzed_at,
        length(f.cv_text) AS cached_cv_length,
        length(regexp_replace(coalesce(f.cv_text, ''), '[^ء-ي]', '', 'g')) AS cached_arabic_characters,
        length(f.bio) AS bio_length, f.cv_path IS NOT NULL AS has_cv
      FROM applications a JOIN users u ON u.id = a.professional_id JOIN jobs j ON j.id = a.job_id
      JOIN application_ai_evaluations e ON e.application_id = a.id
      LEFT JOIN professionals f ON f.user_id = u.id
      WHERE lower(trim(concat_ws(' ', u.first_name, u.last_name))) = ANY($1::text[])
      ORDER BY e.analyzed_at DESC LIMIT 30`, [[
      'hosam ismail', 'sami ghaben', 'شعبان حماد', 'nizar hardan', 'adham hannoun', 'zeid khalil', 'ishaq serhan', 'ibrahim harb'
    ]]);
    for (const row of result.rows) {
      const report = object(row.full_report);
      const params = object(row.parameters);
      console.log(JSON.stringify({ application_id: row.id, job_id: row.job_id, job: row.title, name: row.name,
        score: row.match_score, verdict: row.verdict, analyzed_at: row.analyzed_at,
        cv_meta: report.cv_meta, cached_cv_length: row.cached_cv_length, cached_arabic_characters: row.cached_arabic_characters,
        bio_length: row.bio_length, has_cv: row.has_cv,
        settings: { strictness: params.strictness, source: params.source, cv_weight: params.cv_weight, domain_tolerance: params.domain_tolerance, transferability: params.transferability },
        summary: String(report.executive_summary || '').slice(0, 500), pros: report.pros, cons: report.cons }));
    }
    await client.query('COMMIT');
  } finally { client.release(); await pool.end(); }
}
main().catch(error => { console.error('Read-only evaluation inspection failed:', error.code || error.message); process.exitCode = 1; });
