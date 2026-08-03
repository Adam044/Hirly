const express = require('express');
const axios = require('axios');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

// --- LIBRARY INITIALIZATION ---
// NOTE: pdfParse initialization removed to fix the "Class constructors cannot be invoked without 'new'" error.
// PDF parsing now exclusively uses the robust, explicit pdfjs-dist logic.

let mammoth;
try { mammoth = require('mammoth'); } 
catch (e) { logger.warn("⚠️ 'mammoth' not installed. DOCX CVs will not be parsed."); }

let supabaseAdmin = null;
try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
    }
} catch {}

module.exports = function registerAIRoutes(app, pool, { isAuthenticated, isEmployer }) {

    // --- HELPER UTILITIES ---

    function cleanText(text) {
        if (!text) return "";
        return text
            .replace(/\s+/g, ' ')           
            .replace(/[^\w\s.,@%-]/g, '')   
            .trim();
    }

    function bufferFromUrl(url) {
        return axios.get(url, { responseType: 'arraybuffer', timeout: 30000, headers: { 'User-Agent': 'Hirly-Pilot/2.0' } })
            .then(r => Buffer.from(r.data))
            .catch(async () => {
                try {
                    const res = await fetch(url);
                    if (!res.ok) return null;
                    const ab = await res.arrayBuffer();
                    return Buffer.from(ab);
                } catch { return null; }
            });
    }

    function parseSkills(skillsData) {
        if (!skillsData) return [];
        if (Array.isArray(skillsData)) return skillsData;
        if (typeof skillsData === 'string') {
            try { return JSON.parse(skillsData); } 
            catch { return skillsData.split(',').map(s => s.trim()).filter(Boolean); }
        }
        return [];
    }

    function normalizeVerdict(verdict, score) {
        const s = typeof verdict === 'string' ? verdict.toLowerCase() : '';
        if (s.includes('reject')) return 'Reject';
        if (s.includes('backup') || s.includes('potential')) return 'Backup';
        if (s.includes('strong') || s.includes('hire')) return 'Strong Hire';
        if (s.includes('interview')) return 'Interview';
        const sc = typeof score === 'number' ? score : 0;
        if (sc >= 85) return 'Strong Hire';
        if (sc >= 60) return 'Interview';
        if (sc >= 40) return 'Backup';
        return 'Reject';
    }

    function stripHTML(text) {
        if (!text) return "";
        let t = String(text).replace(/<[^>]*>/g, " ");
        t = t.replace(/&(nbsp|amp|quot|apos|lt|gt);/g, (m) => {
            if (m === "&nbsp;") return " ";
            if (m === "&amp;") return "&";
            if (m === "&quot;") return '"';
            if (m === "&apos;") return "'";
            if (m === "&lt;") return "<";
            if (m === "&gt;") return ">";
            return " ";
        });
        t = t.replace(/\b(strong|ul|li|p|br|div|span|em|b|i|h[1-6])\b/gi, " ");
        return t.replace(/\s+/g, " ").trim();
    }

    function extractRequirementsFromDescription(desc) {
        const raw = stripHTML(desc);
        const parts = raw.split(/\n|\.|;|\u2022|\-/).map(s => s.trim()).filter(Boolean);
        const keywords = /(require|must|experience|skill|proficient|knowledge|responsib|duty|ability|sales|targets|quota|pipeline)/i;
        const picks = [];
        for (const p of parts) {
            if (keywords.test(p) && p.length > 6) {
                picks.push(p);
            }
            if (picks.length >= 12) break;
        }
        if (picks.length === 0) {
            return raw.split(/\s+/).filter(x => x.length > 4).slice(0, 8);
        }
        return picks;
    }

    // --- INTELLIGENT CV CACHE ---
    const cvCache = new Map();
    const CACHE_TTL = 1000 * 60 * 60 * 2; // 2 hours

    function setCache(key, text) {
        if (!key) return;
        cvCache.set(key, { text, timestamp: Date.now() });
    }

    function getCache(key) {
        if (!key) return null;
        const entry = cvCache.get(key);
        if (!entry) return null;
        if (Date.now() - entry.timestamp > CACHE_TTL) {
            cvCache.delete(key);
            return null;
        }
        return entry.text;
    }

    async function readCVText(cvPath, pool, userId) {
        if (!cvPath || cvPath.includes('/api/files/censored')) return null;
        
        // 1. Try memory cache
        const cached = getCache(cvPath);
        if (cached !== null) return cached;
        
        // 2. Try DB cache if we have a pool and userId
        if (pool && userId) {
            try {
                const dbRes = await pool.query('SELECT cv_text FROM professionals WHERE user_id = $1 AND cv_path = $2', [userId, cvPath]);
                if (dbRes.rows[0]?.cv_text) {
                    const text = dbRes.rows[0].cv_text;
                    setCache(cvPath, text); // Populate memory cache
                    return text;
                }
            } catch (e) { logger.warn("DB CV Cache Check Failed:", e.message); }
        }
        
        let url = cvPath;
        if (url && !url.startsWith('http')) {
             if (url.includes('supabase.co') || url.includes('.com')) {
                 url = 'https://' + url; 
             }
        }

        let buffer = null;
        try {
            if (/^https?:\/\//.test(url)) {
                buffer = await bufferFromUrl(url);
            } else if (supabaseAdmin && !url.startsWith('http')) {
                const key = url.replace(/^\/?uploads\//, '');
                const { data, error } = await supabaseAdmin.storage.from('uploads').download(key);
                if (!error && data) buffer = Buffer.from(await data.arrayBuffer());
            }
        } catch (e) { logger.error("CV Download Error:", e.message); }

        if (!buffer) return null;

        const lowerPath = cvPath.toLowerCase();
        
        if (lowerPath.includes('.pdf')) {
            // --- FIX: Use explicit PDF.js parsing only to avoid 'pdf-parse' errors ---
            try {
                let pdfjsLib;
                // Attempt CommonJS require first
                try { pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js'); } catch { pdfjsLib = null; }
                // Fallback to dynamic import for ESM/other environments
                if (!pdfjsLib) {
                    const esm = await import('pdfjs-dist/legacy/build/pdf.js');
                    pdfjsLib = esm && (esm.default || esm);
                }
                
                let finalText = '';
                
                if (pdfjsLib && typeof pdfjsLib.getDocument === 'function') {
                    const u8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
                    
                    // CRITICAL CONFIGURATION: This addresses the standardFontDataUrl warning
                    const loadingTask = pdfjsLib.getDocument({
                        data: u8,
                        standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
                        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                        cMapPacked: true
                    });
                    
                    const doc = await loadingTask.promise;
                    const numPages = Math.min(doc.numPages || 10, 20);
                    let content = '';
                    for (let p = 1; p <= numPages; p++) {
                        const page = await doc.getPage(p);
                        const tc = await page.getTextContent();
                        // Join text items with a space for better readability/parsing
                        content += '\n' + tc.items.map(i => i.str).join(' '); 
                    }
                    finalText = cleanText(String(content || '')).substring(0, 15000);
                } else {
                    logger.error('PDF.js library is not available or getDocument function is missing. Check pdfjs-dist installation.');
                }

                if (finalText.length < 500) {
                    logger.warn(`CV PDF Parse Short Text length: ${finalText.length}.`);
                }
                
                setCache(cvPath, finalText);
                
                // Save to DB cache if possible
                if (pool && userId && finalText.length > 100) {
                    pool.query('UPDATE professionals SET cv_text = $1, cv_text_updated_at = NOW() WHERE user_id = $2', [finalText, userId])
                        .catch(e => logger.error("Failed to update CV text in DB:", e.message));
                }
                
                return finalText; 
            } catch (e) { 
                logger.error('CV PDF Parse Error (PDF.js Failed):', e.message); 
                return null; 
            }
        }
        
        if (lowerPath.includes('.doc')) {
            if (!mammoth) return null;
            try {
                const res = await mammoth.extractRawText({ buffer });
                const t = cleanText(res.value).substring(0, 15000);
                setCache(cvPath, t);

                // Save to DB cache if possible
                if (pool && userId && t.length > 100) {
                    pool.query('UPDATE professionals SET cv_text = $1, cv_text_updated_at = NOW() WHERE user_id = $2', [t, userId])
                        .catch(e => logger.error("Failed to update CV text in DB:", e.message));
                }

                return t;
            } catch (e) { logger.error('CV DOC Parse Error:', e.message); return null; }
        }

        logger.error('CV Unsupported format:', cvPath);
        return null;
    }

    async function findLatestCvPathForUser(userId) {
        if (!supabaseAdmin || !userId) return null;
        try {
            const basePath = `cvs/${userId}`;
            const { data, error } = await supabaseAdmin.storage.from('uploads').list(basePath, { limit: 100 });
            if (error || !data || !data.length) return null;
            const files = data.filter(f => f && f.name && (f.name.toLowerCase().includes('.pdf') || f.name.toLowerCase().includes('.doc')));
            if (!files.length) return null;
            files.sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
            const latest = files[0];
            const fullPath = `${basePath}/${latest.name}`;
            const { data: pub } = supabaseAdmin.storage.from('uploads').getPublicUrl(fullPath);
            return pub && pub.publicUrl ? pub.publicUrl : null;
        } catch { return null; }
    }

    async function getCVTextWithStatus(cvPath, source, userId, pool) {
        if (source === 'profile_only') return { text: '', status: { used: false, reason: 'profile_only_source' } };
        if (!cvPath) return { text: '', status: { used: false, reason: 'no_cv_path' } };
        if (String(cvPath).includes('/api/files/censored')) return { text: '', status: { used: false, reason: 'censored_path' } };
        const lowerPath = String(cvPath).toLowerCase();
        
        if (lowerPath.includes('.doc') && !mammoth) {
            try {
                const esm = await import('mammoth');
                if (esm && esm.default) mammoth = esm.default; else if (esm) mammoth = esm;
            } catch {}
        }
        try {
            const t = await readCVText(cvPath, pool, userId);
            if (t && t.length) return { text: t, status: { used: true, reason: 'parsed', length: t.length } };
            // Attempt to find latest CV from account if initial path failed
            const latestUrl = await findLatestCvPathForUser(userId);
            if (latestUrl) {
                const t2 = await readCVText(latestUrl, pool, userId);
                if (t2 && t2.length) return { text: t2, status: { used: true, reason: 'found_latest_account_cv', length: t2.length } };
            }
            // Since we removed pdf-parse, we no longer need to check for its availability here.
            if (lowerPath.includes('.doc') && !mammoth) return { text: '', status: { used: false, reason: 'doc_parser_unavailable' } };
            return { text: '', status: { used: false, reason: 'download_or_parse_failed' } };
        } catch (e) {
            return { text: '', status: { used: false, reason: 'exception', message: e.message } };
        }
    }

    // --- DEEPSEEK ANALYSIS ENGINE (V3) ---
    async function analyzeWithDeepSeek(job, candidate, lang = 'en', instructions = '', source = 'both', strictness = 5, cvTextOverride = null, options = {}, pool = null) {
        if (!process.env.DEEPSEEK_API_KEY) return null;

        let cvText = "";
        let cvMeta = { used: false, reason: 'unknown' };
        if (cvTextOverride !== null) {
            cvText = cvTextOverride.text || '';
            cvMeta = cvTextOverride.status || cvMeta;
        } else {
            const info = await getCVTextWithStatus(candidate.cv_path, source, candidate.user_id, pool);
            cvText = info.text;
            cvMeta = info.status;
        }
        
        const includeProfile = source !== 'cv_only';
        const bio = includeProfile ? (candidate.bio || '') : '';
        const skills = includeProfile ? parseSkills(candidate.skills) : [];
        const proposal = (source !== 'profile_only') ? (candidate.proposal_message || '') : '';

        const jobDesc = stripHTML(job.description || '').substring(0, 2000);
        const jobReqs = parseSkills(job.requirements);
        const jobProfs = parseSkills(job.profession_required);
        const effectiveReqs = [...jobReqs, ...jobProfs].filter(Boolean).slice(0, 25);
        const descNote = jobDesc && jobDesc.length >= 60 ? '' : 'DESCRIPTION UNCLEAR: Rely on the requirements list and professions as primary signal.';

        // Dynamic Strictness Logic
        let strictnessPrompt = "";
        if (strictness >= 8) {
            strictnessPrompt = "MODE: RUTHLESS. Penalize generic skills heavily. Disqualify for minor requirement mismatches. Be extremely critical of employment gaps. Score conservatively (rarely above 85).";
        } else if (strictness <= 3) {
            strictnessPrompt = "MODE: LENIENT. Focus on potential and transferable skills. Ignore minor gaps or formatting issues. Be generous with scoring.";
        } else {
            strictnessPrompt = "MODE: BALANCED. Be fair but verified. Require proof of skills in experience history.";
        }

        const cvWeight = (typeof options.cv_weight === 'number') ? options.cv_weight : 66;
        const domainTol = (typeof options.domain_tolerance === 'number') ? options.domain_tolerance : 50;
        const emphasizeTransfer = options.transferability === true;
        const cvFactor = cvWeight >= 90 ? '3x' : (cvWeight >= 66 ? '2x' : (cvWeight >= 33 ? '1.5x' : '1x'));
        const domainNote = domainTol >= 66 ? 'Treat cross-domain experience as acceptable if achievements align.' : (domainTol <= 33 ? 'Penalize domain mismatch significantly.' : 'Be cautious but allow transferable competencies.');

        const systemPrompt = `
        ROLE: Senior Executive Recruiter & Domain Expert.
        TASK: Conduct a high-stakes, professional analysis of a candidate's suitability for a specific role.
        OUTPUT_FORMAT: JSON only. No markdown.
        LANGUAGE: ${lang === 'ar' ? 'Arabic' : 'English'}
        STRICTNESS LEVEL: ${strictness}/10. ${strictnessPrompt}
        WEIGHTING: Prioritize objective evidence from CV content. Apply ${cvFactor} weight to verified skills and tenure. Profile-only claims are secondary signal.
        TRANSFERABILITY: ${emphasizeTransfer ? 'Highlight adaptable competencies and leadership potential.' : 'Focus on direct functional alignment.'}
        DOMAIN TOLERANCE: ${domainNote}

        EVALUATION CRITERIA:
        1. **Functional Alignment**: Technical proficiency and core competency match.
        2. **Trajectory & Growth**: Career progression, tenure stability, and achievement impact.
        3. **Soft Skills/Executive Presence**: Communication clarity, professional tone, and leadership indicators.
        4. **Risk Assessment**: Gaps, job-hopping, or misalignment with seniority.

        JSON SCHEMA:
        {
          "score": number, // 0-100
          "headline": string, // Professional, punchy 5-word summary
          "executive_summary": string, // High-level assessment (2 sentences)
          "skills_analysis": {
            "matched": string[], // Top 5 skills found
            "missing": string[]  // Critical gaps
          },
          "pros": string[], // 3-4 distinct professional strengths
          "cons": string[], // 3-4 specific risks or weaknesses
          "interview_guide": string[], // 3 behavioral or technical "pressure-test" questions
          "verdict": "Strong Hire" | "Interview" | "Backup" | "Reject"
        }
        
        INSTRUCTIONS: ${instructions || "Provide a cold, objective, and professional assessment."}
        `;

        const userPrompt = `
        === JOB POSITION ===
        Title: ${job.title}
        Budget: ${job.budget} ${job.currency}
        Description: ${jobDesc}
        Requirements: ${JSON.stringify(effectiveReqs)}
        Notes: ${descNote}

        === CANDIDATE PROFILE ===
        Name: ${candidate.first_name} ${candidate.last_name}
        Current Role: ${candidate.profession}
        Bio: ${cleanText(bio).substring(0, 1000)}
        Listed Skills: ${skills.join(', ')}
        Application Note: ${cleanText(proposal).substring(0, 1000)}

        === EXTRACTED CV CONTENT ===
        ${cvText ? cvText : "(No CV file accessible, analyze based on Profile/Bio only)"}
        `;

        try {
            // Retry logic with exponential backoff
            let attempts = 0;
            const maxAttempts = 3;
            let lastError = null;

            while (attempts < maxAttempts) {
                try {
                    const resp = await axios.post('https://api.deepseek.com/chat/completions', {
                        model: "deepseek-chat",
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userPrompt }
                        ],
                        temperature: 0.1, 
                        response_format: { type: "json_object" }
                    }, { 
                        headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` }, 
                        timeout: 120000 
                    });

                    let raw = resp.data.choices[0].message.content;
                    
                    // Cleanup: Strip markdown code blocks if present (common LLM artifact)
                    if (typeof raw === 'string') {
                        raw = raw.trim();
                        if (raw.startsWith('```')) {
                            raw = raw.replace(/^```(json)?\s*/i, '').replace(/\s*```$/, '');
                        }
                    }

                    const obj = JSON.parse(raw);
                    obj.cv_meta = { used: !!cvMeta.used, reason: cvMeta.reason, length: cvText ? cvText.length : 0 };
                    obj.verdict = normalizeVerdict(obj.verdict, obj.score);
                    
                    // Store the parameters used for this analysis for future "smart skip" checks
                    obj.analysis_params = {
                        instructions: instructions,
                        source: source,
                        strictness: strictness,
                        cv_weight: options.cv_weight,
                        domain_tolerance: options.domain_tolerance,
                        transferability: options.transferability,
                        model: "deepseek-chat"
                    };
                    
                    return obj;
                } catch (err) {
                    lastError = err;
                    attempts++;
                    logger.warn(`AI Analysis Attempt ${attempts} failed: ${err.message}`);
                    
                    if (attempts >= maxAttempts) break;
                    
                    // Wait before retrying (1s, 2s, 4s...)
                    const delay = Math.pow(2, attempts) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            
            throw lastError;

        } catch (e) {
            logger.error('AI Analysis Failed after retries:', e.message);
            if (e.response) logger.error('AI Response:', e.response.data);
            return null;
        }
    }

    // --- ROUTES ---
    const pilotRuns = new Map();

    // 1. Run Bulk Analysis
    router.post('/ai/analyze-job/:jobId', isAuthenticated, isEmployer, async (req, res) => {
        const { jobId } = req.params;
        const { language, additionalInstructions, applicationIds, source, focusAreas, strictness, cv_weight, domain_tolerance, transferability } = req.body;
        
        // Default strictness to 5 if not provided
        const strictnessLevel = strictness ? parseInt(strictness) : 5;

        let finalInstructions = additionalInstructions || "";
        if (Array.isArray(focusAreas) && focusAreas.length > 0) {
            finalInstructions += `\nPRIORITIZE THESE AREAS: ${focusAreas.join(', ')}.`;
        }

        if (!process.env.DEEPSEEK_API_KEY) return res.status(500).json({ success: false, error: 'System AI Configuration Error' });

        let client;
        try {
            client = await pool.connect();
            
            // Fetch Job & Candidates
            const jobRes = await client.query(`SELECT * FROM jobs WHERE id = $1`, [jobId]);
            const job = jobRes.rows[0];
            if (!job) return res.status(404).json({ success: false, error: "Job not found" });

            let queryStr = `
                SELECT a.id as application_id, a.proposal_message,
                u.first_name, u.last_name, u.city, u.id as user_id,
                f.skills, f.bio, f.profession, f.cv_path
                FROM applications a
                JOIN users u ON a.professional_id = u.id
                LEFT JOIN professionals f ON u.id = f.user_id
                WHERE a.job_id = $1
            `;
            let queryParams = [jobId];

            const appsRes = await client.query(queryStr, queryParams);
            let applicants = appsRes.rows;

            if (applicationIds && applicationIds.length) {
                const ids = new Set(applicationIds.map(Number));
                applicants = applicants.filter(a => ids.has(a.application_id));
            }

            const startNow = await client.query('SELECT NOW() as now');
            const runId = `${jobId}:${Date.now()}`;
            pilotRuns.set(runId, { 
                jobId, 
                total: applicants.length, 
                processed: 0, 
                ids: applicants.map(a => a.application_id), 
                started_at: startNow.rows[0].now,
                status: 'running' 
            });
            res.json({ success: true, message: "Analysis started", total: applicants.length, startTime: startNow.rows[0].now, runId });

            // --- BACKGROUND PROCESSING WORKER ---
            (async () => {
                const CONCURRENCY = 3;
                let index = 0;

                const runOne = async (app) => {
                    try {
                        // Smart Check: Skip only if we have a successful result AND parameters are identical
                        const clientLocal = await pool.connect();
                        try {
                            const existing = await clientLocal.query(
                                `SELECT parameters, verdict FROM application_ai_evaluations WHERE application_id = $1`,
                                [app.application_id]
                            );
                            
                            if (existing.rows.length > 0 && existing.rows[0].verdict !== 'Error' && !req.body.force) {
                                const prevParams = existing.rows[0].parameters || {};
                                
                                // Compare current parameters with previous ones
                                const currentParams = {
                                    instructions: finalInstructions,
                                    source: source,
                                    strictness: strictnessLevel,
                                    cv_weight: (typeof cv_weight === 'number') ? cv_weight : parseInt(cv_weight || '66', 10),
                                    domain_tolerance: (typeof domain_tolerance === 'number') ? domain_tolerance : parseInt(domain_tolerance || '50', 10),
                                    transferability: !!transferability
                                };

                                const isSame = JSON.stringify(prevParams) === JSON.stringify(currentParams);
                                
                                if (isSame) {
                                    // Parameters are identical, no need to re-analyze unless forced
                                    return;
                                }
                            }
                        } finally { clientLocal.release(); }

                        const cvInfo = await getCVTextWithStatus(app.cv_path, source, app.user_id, pool);
                        const analysis = await analyzeWithDeepSeek(job, app, language, finalInstructions, source, strictnessLevel, cvInfo, {
                            cv_weight: (typeof cv_weight === 'number') ? cv_weight : parseInt(cv_weight || '66', 10),
                            domain_tolerance: (typeof domain_tolerance === 'number') ? domain_tolerance : parseInt(domain_tolerance || '50', 10),
                            transferability: !!transferability
                        }, pool);

                        const clientLocalSave = await pool.connect();
                        try {
                            if (analysis) {
                                // 1. Main AI Evaluation
                                await clientLocalSave.query(`
                                    INSERT INTO application_ai_evaluations 
                                    (application_id, match_score, summary, strengths, weaknesses, verdict, full_report, parameters, analyzed_at)
                                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                                    ON CONFLICT (application_id) DO UPDATE SET 
                                    match_score=EXCLUDED.match_score, summary=EXCLUDED.summary, strengths=EXCLUDED.strengths,
                                    weaknesses=EXCLUDED.weaknesses, verdict=EXCLUDED.verdict, full_report=EXCLUDED.full_report, 
                                    parameters=EXCLUDED.parameters, analyzed_at=NOW()
                                `, [
                                    app.application_id, 
                                    analysis.score || 0, 
                                    analysis.headline || "Analysis Complete",
                                    JSON.stringify(analysis.pros || []), 
                                    JSON.stringify(analysis.cons || []),
                                    normalizeVerdict(analysis.verdict, analysis.score) || 'Interview', 
                                    JSON.stringify(analysis),
                                    JSON.stringify(analysis.analysis_params || {})
                                ]);

                                // 2. Deep Report Storage
                                await clientLocal.query(`
                                    INSERT INTO deep_reports (application_id, detailed_summary, detailed_strengths, detailed_weaknesses, interview_questions, detailed_report_html, analyzed_at)
                                    VALUES ($1, $2, $3, $4, $5, $6, NOW())
                                    ON CONFLICT (application_id) DO UPDATE SET
                                    detailed_summary=EXCLUDED.detailed_summary, detailed_strengths=EXCLUDED.detailed_strengths,
                                    detailed_weaknesses=EXCLUDED.detailed_weaknesses, interview_questions=EXCLUDED.interview_questions,
                                    detailed_report_html=EXCLUDED.detailed_report_html, analyzed_at=NOW()
                                `, [
                                    app.application_id, 
                                    analysis.executive_summary || "",
                                    JSON.stringify(analysis.skills_analysis?.matched || []), 
                                    JSON.stringify(analysis.skills_analysis?.missing || []), 
                                    JSON.stringify(analysis.interview_guide || []),
                                    "" // Reserved for future HTML reports
                                ]);

                                // 3. Update application status if it was 'pending'
                                await clientLocal.query(`
                                    UPDATE applications SET status = 'viewed' 
                                    WHERE id = $1 AND status = 'pending'
                                `, [app.application_id]);

                            } else {
                                throw new Error("AI Engine returned empty analysis");
                            }
                        } finally {
                            clientLocal.release();
                        }
                    } catch (err) {
                        logger.error(`Worker error for app ${app.application_id}:`, err);
                        // Store failure status so UI can show error state
                        const clientLocal = await pool.connect();
                        try {
                            await clientLocal.query(`
                                INSERT INTO application_ai_evaluations 
                                (application_id, match_score, summary, strengths, weaknesses, verdict, full_report, analyzed_at)
                                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                                ON CONFLICT (application_id) DO UPDATE SET 
                                match_score=0, summary='Analysis Failed', 
                                verdict='Error', analyzed_at=NOW()
                            `, [app.application_id, 0, 'Analysis Failed', '[]', '[]', 'Error', JSON.stringify({ error: err.message })]);
                        } finally {
                            clientLocal.release();
                        }
                    } finally {
                        const r = pilotRuns.get(runId);
                        if (r) {
                            r.processed++;
                            if (r.processed >= r.total) {
                                r.completed_at = new Date();
                                // Clean up old runs after 30 mins
                                setTimeout(() => pilotRuns.delete(runId), 30 * 60 * 1000);
                            }
                        }
                    }
                };

                const worker = async () => {
                    while (true) {
                        const currentRun = pilotRuns.get(runId);
                        if (currentRun && currentRun.status === 'stopping') break;

                        const i = index;
                        index = i + 1;
                        const app = applicants[i];
                        if (!app) break;
                        await runOne(app);
                    }
                };

                const workers = Array.from({ length: Math.min(CONCURRENCY, applicants.length) }, () => worker());
                await Promise.all(workers);
            })();
            // --- END BACKGROUND WORKER ---

        } catch (e) {
            res.status(500).json({ success: false, error: e.message });
        } finally { if(client) client.release(); }
    });

    // 2. Stop Analysis Run
    router.post('/ai/stop-analysis/:jobId', isAuthenticated, isEmployer, async (req, res) => {
        const { runId } = req.body;
        if (runId && pilotRuns.has(runId)) {
            const r = pilotRuns.get(runId);
            r.status = 'stopping';
            return res.json({ success: true, message: "Analysis will stop after current candidates finish." });
        }
        res.status(404).json({ success: false, error: "Run not found" });
    });

    async function analyzeJobWithDeepSeek(job, instructions = '', options = {}) {
        if (!process.env.DEEPSEEK_API_KEY) {
            return null;
        }
        const sys = `ROLE: Senior Strategic HR Consultant. 
        TASK: Develop a comprehensive, professional job dossier for executive-level recruitment.
        OUTPUT: JSON object only. No markdown.
        REQUIRED KEYS: 
        - role_summary (string: strategic overview of the position)
        - must_haves (array: 5 non-negotiable hard skills/qualifications)
        - nice_to_haves (array: 5 preferred but not required attributes)
        - screening_questions (array: 5 deep, behavioral interview questions)
        - transferability (string: assessment of how skills from other industries might apply)`;
        
        const prefs = {
            source: options.source || 'both',
            strictness: options.strictness || 5,
            cv_weight: options.cv_weight || 66,
            domain_tolerance: options.domain_tolerance || 50,
            transferability: options.transferability === true
        };
        const prefsText = `Strategic Parameters: strictness=${prefs.strictness}/10; cv_weight=${prefs.cv_weight}%; domain_tolerance=${prefs.domain_tolerance}%; transferability=${prefs.transferability ? 'high' : 'standard'}.`;
        const usr = `Position Title: ${job.title}\nBudget: ${job.budget} ${job.currency}\nJob Context: ${stripHTML(job.description || '').substring(0, 2000)}\nTechnical Requirements: ${JSON.stringify(parseSkills(job.requirements))}\nAssociated Professions: ${JSON.stringify(parseSkills(job.profession_required))}\n${prefsText}\nEmployer Directives: ${instructions || 'Standard professional analysis.'}`;
        
        try {
            const resp = await axios.post('https://api.deepseek.com/chat/completions', {
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: sys },
                    { role: "user", content: usr }
                ],
                temperature: 0.2,
                response_format: { type: "json_object" }
            }, { headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` }, timeout: 90000 });
            
            const raw = resp.data?.choices?.[0]?.message?.content;
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            logger.error('Job Dossier AI Failed:', e.message);
            return null;
        }
    }

    router.post('/ai/job-dossier/:jobId', isAuthenticated, isEmployer, async (req, res) => {
        const { jobId } = req.params;
        const { revision_instructions, options, regenerate } = req.body || {};
        let client;
        try {
            client = await pool.connect();
            const jobRes = await client.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
            const job = jobRes.rows[0];
            if(!job) return res.status(404).json({ success: false, error: 'Job not found' });

            // Return cached if available and not revising/regenerating
            if (!revision_instructions && !regenerate && job.job_dossier) {
                return res.json({ success: true, dossier: job.job_dossier });
            }

            // If just checking/fetching (no revision, no regenerate) and no dossier exists,
            // we should NOT auto-generate if the client requested 'fetchOnly'.
            // But to keep it simple for the 'Guided Start', that one SHOULD generate.
            // The 'Job Analysis' button should probably send a flag 'dontGenerate: true'.
            if (req.body.dontGenerate && !job.job_dossier) {
                 return res.json({ success: false, error: 'No dossier found', code: 'NO_DOSSIER' });
            }

            const dossier = await analyzeJobWithDeepSeek(job, revision_instructions, options || {});
            if (!dossier) return res.status(500).json({ success: false, error: 'AI Service Error' });
            
            // Save to DB
            await client.query('UPDATE jobs SET job_dossier = $1 WHERE id = $2', [dossier, jobId]);
            
            res.json({ success: true, dossier });
        } catch (e) {
            res.status(500).json({ success: false, error: e.message });
        } finally { if(client) client.release(); }
    });

    // 2. Poll Progress
    router.get('/ai/progress/:jobId', isAuthenticated, isEmployer, async (req, res) => {
        let since = null;
        if (req.query.since) {
            const ts = Date.parse(req.query.since);
            if (!Number.isNaN(ts)) since = new Date(ts);
        }
        const runId = req.query.runId;
        const { jobId } = req.params;
        const idsParam = req.query.ids;
        let client;
        try {
            if (runId && pilotRuns.has(runId)) {
                const r = pilotRuns.get(runId);
                if (r.done) pilotRuns.delete(runId);
                return res.json({ 
                    success: true, 
                    total: r.total || 0, 
                    processed: r.processed || 0, 
                    runId, 
                    started_at: r.started_at,
                    status: r.status || 'running'
                });
            }
            client = await pool.connect();
            if (idsParam) {
                const idsArr = idsParam.split(',').map(x => parseInt(x)).filter(Boolean);
                const total = idsArr.length;
                let doneRes;
                if (since) {
                    doneRes = await client.query(
                        `SELECT COUNT(*) FROM application_ai_evaluations ae JOIN applications a ON ae.application_id = a.id WHERE a.job_id = $2 AND ae.application_id = ANY($1::int[]) AND ae.analyzed_at >= $3`,
                        [idsArr, jobId, since]
                    );
                } else {
                    doneRes = await client.query(
                        `SELECT COUNT(*) FROM application_ai_evaluations ae JOIN applications a ON ae.application_id = a.id WHERE a.job_id = $2 AND ae.application_id = ANY($1::int[])`,
                        [idsArr, jobId]
                    );
                }
                return res.json({ success: true, total, processed: parseInt(doneRes.rows[0].count) });
            }
            const totRes = await client.query(`SELECT COUNT(*) FROM applications WHERE job_id = $1`, [jobId]);
            let doneRes;
            if (since) {
                doneRes = await client.query(`SELECT COUNT(*) FROM application_ai_evaluations ae JOIN applications a ON ae.application_id = a.id WHERE a.job_id = $1 AND ae.analyzed_at >= $2`, [jobId, since]);
            } else {
                doneRes = await client.query(`SELECT COUNT(*) FROM application_ai_evaluations ae JOIN applications a ON ae.application_id = a.id WHERE a.job_id = $1`, [jobId]);
            }
            res.json({ success: true, total: parseInt(totRes.rows[0].count), processed: parseInt(doneRes.rows[0].count) });
        } catch (e) { res.json({ success: false }); } finally { if(client) client.release(); }
    });

    // 3. Get Dashboard Overview Data
    router.get('/ai/overview/:jobId', isAuthenticated, isEmployer, async (req, res) => {
        const { jobId } = req.params;
        let client;
        try {
            client = await pool.connect();
            
            const r = await client.query(`
                SELECT 
                    a.id, a.applied_at,
                    u.first_name, u.last_name, u.profile_picture_url, u.city, u.id as user_id,
                    f.profession, f.cv_path, f.skills, f.bio,
                    
                    -- Basic AI Evaluation
                    ae.match_score, ae.summary as ai_headline, ae.verdict, ae.full_report,
                    ae.strengths as pros_json, ae.weaknesses as cons_json,
                    
                    -- Deep Report Details
                    dr.detailed_summary, dr.detailed_strengths, dr.detailed_weaknesses, 
                    dr.interview_questions, dr.detailed_report_html as cultural_notes,
                    
                    -- Interview Status
                    s.status as interview_status, s.invitation_response
                    
                FROM applications a
                JOIN users u ON a.professional_id = u.id
                LEFT JOIN professionals f ON u.id = f.user_id
                LEFT JOIN application_ai_evaluations ae ON a.id = ae.application_id
                LEFT JOIN deep_reports dr ON a.id = dr.application_id
                LEFT JOIN LATERAL (SELECT status, invitation_response FROM interview_sessions WHERE application_id = a.id ORDER BY id DESC LIMIT 1) s ON true
                WHERE a.job_id = $1
                ORDER BY 
                    CASE WHEN ae.match_score IS NOT NULL THEN 0 ELSE 1 END, -- Analyzed first
                    ae.match_score DESC NULLS LAST
            `, [jobId]);

            const candidates = r.rows.map(row => {
                let rawAI = {};
                try { rawAI = JSON.parse(row.full_report || '{}'); } catch {}

                return {
                    id: row.id,
                    user_id: row.user_id,
                    first_name: row.first_name,
                    last_name: row.last_name,
                    profession: row.profession,
                    location: row.city,
                    avatar_url: row.profile_picture_url,
                    cv_path: row.cv_path,
                    
                    match_score: row.match_score || 0,
                    verdict: normalizeVerdict(row.verdict || rawAI.verdict, row.match_score || rawAI.score) || 'Pending',
                    headline: row.ai_headline || rawAI.headline || "Pending Analysis...",
                    
                    summary: row.detailed_summary || rawAI.executive_summary,
                    pros: parseSkills(row.pros_json),
                    cons: parseSkills(row.cons_json),
                    
                    matched_skills: parseSkills(row.detailed_strengths) || rawAI.skills_analysis?.matched || [],
                    missing_skills: parseSkills(row.detailed_weaknesses) || rawAI.skills_analysis?.missing || [],
                    
                    interview_questions: parseSkills(row.interview_questions) || rawAI.interview_guide || [],
                    cv_meta: rawAI.cv_meta || null,
                    
                    has_interview: !!(row.interview_status || row.invitation_response),
                    interview_status: row.interview_status,
                    invitation_response: row.invitation_response
                };
            });

            const analytics = {
                total_applicants: candidates.length,
                analyzed_count: candidates.filter(c => c.match_score > 0).length,
                avg_score: candidates.length ? Math.round(candidates.reduce((a, b) => a + (b.match_score || 0), 0) / candidates.length) : 0,
                strong_candidates: candidates.filter(c => c.match_score >= 80).length
            };

            res.json({ success: true, candidates, analytics });
            
        } catch(e) { 
            logger.error(e);
            res.status(500).json({ error: e.message }); 
        } finally { if(client) client.release(); }
    });

    app.use('/api', router);

    // AI Professional Routes DELETED per user request
};
