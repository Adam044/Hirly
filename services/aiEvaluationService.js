const axios = require('axios');
const logger = require('../utils/logger');
let mammoth;
try { mammoth = require('mammoth'); } catch (e) {}

class AIEvaluationService {
    constructor(pool) {
        this.pool = pool;
        this.cvCache = new Map();
        this.CACHE_TTL = 1000 * 60 * 60 * 2; // 2 hours
    }

    cleanText(text) {
        if (!text) return "";
        return text.replace(/\s+/g, ' ').replace(/[^\w\s.,@%-]/g, '').trim();
    }

    stripHTML(text) {
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
        return t.replace(/\s+/g, " ").trim();
    }

    parseSkills(skillsData) {
        if (!skillsData) return [];
        if (Array.isArray(skillsData)) return skillsData;
        if (typeof skillsData === 'string') {
            try { return JSON.parse(skillsData); } 
            catch { return skillsData.split(',').map(s => s.trim()).filter(Boolean); }
        }
        return [];
    }

    normalizeVerdict(verdict, score) {
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

    async bufferFromUrl(url) {
        try {
            const resp = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
            return Buffer.from(resp.data);
        } catch (e) {
            return null;
        }
    }

    async readCVText(cvPath, userId) {
        if (!cvPath) return null;
        
        let url = cvPath;
        if (url && !url.startsWith('http')) {
            if (url.includes('supabase.co') || url.includes('.com')) {
                url = 'https://' + url; 
            }
        }

        const buffer = await this.bufferFromUrl(url);
        if (!buffer) return null;

        const lowerPath = cvPath.toLowerCase();
        if (lowerPath.includes('.pdf')) {
            try {
                let pdfjsLib;
                try { pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js'); } catch { return null; }
                
                const u8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
                const loadingTask = pdfjsLib.getDocument({
                    data: u8,
                    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
                    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                    cMapPacked: true
                });
                
                const doc = await loadingTask.promise;
                let content = '';
                const numPages = Math.min(doc.numPages, 10);
                for (let p = 1; p <= numPages; p++) {
                    const page = await doc.getPage(p);
                    const tc = await page.getTextContent();
                    content += '\n' + tc.items.map(i => i.str).join(' '); 
                }
                return this.cleanText(content).substring(0, 15000);
            } catch (e) { return null; }
        }

        if (lowerPath.includes('.doc') && mammoth) {
            try {
                const res = await mammoth.extractRawText({ buffer });
                return this.cleanText(res.value).substring(0, 15000);
            } catch (e) { return null; }
        }

        return null;
    }

    async getCVText(cvPath, userId) {
        if (!cvPath) return { text: '', status: { used: false, reason: 'no_cv_path' } };
        
        const cached = this.cvCache.get(cvPath);
        if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
            return { text: cached.text, status: { used: true, reason: 'cached', length: cached.text.length } };
        }

        try {
            const dbRes = await this.pool.query('SELECT cv_text FROM professionals WHERE user_id = $1 AND cv_path = $2', [userId, cvPath]);
            if (dbRes.rows[0]?.cv_text) {
                const text = dbRes.rows[0].cv_text;
                this.cvCache.set(cvPath, { text, timestamp: Date.now() });
                return { text, status: { used: true, reason: 'db_cache', length: text.length } };
            }
        } catch (e) {}

        const text = await this.readCVText(cvPath, userId);
        if (text) {
            this.cvCache.set(cvPath, { text, timestamp: Date.now() });
            // Async update DB
            this.pool.query('UPDATE professionals SET cv_text = $1, cv_text_updated_at = NOW() WHERE user_id = $2', [text, userId]).catch(() => {});
            return { text, status: { used: true, reason: 'parsed', length: text.length } };
        }

        return { text: '', status: { used: false, reason: 'parse_failed' } };
    }

    async analyzeApplication(applicationId) {
        if (!process.env.DEEPSEEK_API_KEY) return;

        try {
            const client = await this.pool.connect();
            try {
                // Fetch Application, Job, and Candidate details
                const appRes = await client.query(`
                    SELECT a.*, j.title as job_title, j.description as job_description, j.requirements, j.profession_required, j.budget, j.currency,
                    u.first_name, u.last_name, u.email, u.id as user_id, f.skills, f.bio, f.profession, f.cv_path
                    FROM applications a
                    JOIN jobs j ON a.job_id = j.id
                    JOIN users u ON a.professional_id = u.id
                    LEFT JOIN professionals f ON u.id = f.user_id
                    WHERE a.id = $1
                `, [applicationId]);

                const data = appRes.rows[0];
                if (!data) return;

                const cvInfo = await this.getCVText(data.cv_path, data.user_id);

                const job = {
                    title: data.job_title,
                    description: data.job_description,
                    requirements: data.requirements,
                    profession_required: data.profession_required,
                    budget: data.budget,
                    currency: data.currency
                };

                const candidate = {
                    user_id: data.user_id,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    profession: data.profession,
                    bio: data.bio,
                    skills: data.skills,
                    cv_path: data.cv_path,
                    proposal_message: data.proposal_message
                };

                // Trigger analysis using the robust pipeline
                const analysis = await this.runDeepSeekAnalysis(job, candidate, cvInfo);
                
                if (analysis) {
                    // 1. Main AI Evaluation
                    await client.query(`
                        INSERT INTO application_ai_evaluations 
                        (application_id, match_score, summary, strengths, weaknesses, verdict, full_report, parameters, analyzed_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                        ON CONFLICT (application_id) DO UPDATE SET 
                        match_score=EXCLUDED.match_score, summary=EXCLUDED.summary, strengths=EXCLUDED.strengths,
                        weaknesses=EXCLUDED.weaknesses, verdict=EXCLUDED.verdict, full_report=EXCLUDED.full_report, 
                        parameters=EXCLUDED.parameters, analyzed_at=NOW()
                    `, [
                        applicationId, 
                        analysis.score || 0, 
                        analysis.headline || "Analysis Complete",
                        JSON.stringify(analysis.pros || []), 
                        JSON.stringify(analysis.cons || []),
                        this.normalizeVerdict(analysis.verdict, analysis.score), 
                        JSON.stringify(analysis),
                        JSON.stringify(analysis.analysis_params || {})
                    ]);

                    // 2. Deep Report Storage
                    await client.query(`
                        INSERT INTO deep_reports (application_id, detailed_summary, detailed_strengths, detailed_weaknesses, interview_questions, analyzed_at)
                        VALUES ($1, $2, $3, $4, $5, NOW())
                        ON CONFLICT (application_id) DO UPDATE SET
                        detailed_summary=EXCLUDED.detailed_summary, detailed_strengths=EXCLUDED.detailed_strengths,
                        detailed_weaknesses=EXCLUDED.detailed_weaknesses, interview_questions=EXCLUDED.interview_questions,
                        analyzed_at=NOW()
                    `, [
                        applicationId, 
                        analysis.executive_summary || "",
                        JSON.stringify(analysis.skills_analysis?.matched || []), 
                        JSON.stringify(analysis.skills_analysis?.missing || []), 
                        JSON.stringify(analysis.interview_guide || [])
                    ]);
                }
            } finally {
                client.release();
            }
        } catch (error) {
            logger.error(`AI Evaluation Service Error for app ${applicationId}:`, error);
        }
    }

    async runDeepSeekAnalysis(job, candidate, cvInfo = null) {
        // Match the exact prompt and parameters from routes/ai.js
        const jobDesc = this.stripHTML(job.description || '').substring(0, 2000);
        const jobReqs = this.parseSkills(job.requirements);
        const jobProfs = this.parseSkills(job.profession_required);
        const effectiveReqs = [...jobReqs, ...jobProfs].filter(Boolean).slice(0, 25);
        const descNote = jobDesc && jobDesc.length >= 60 ? '' : 'DESCRIPTION UNCLEAR: Rely on the requirements list and professions as primary signal.';

        const cvText = cvInfo?.text || '';
        const cvMeta = cvInfo?.status || { used: false, reason: 'not_provided' };

        const systemPrompt = `
        ROLE: Senior Executive Recruiter & Domain Expert.
        TASK: Conduct a high-stakes, professional analysis of a candidate's suitability for a specific role.
        OUTPUT_FORMAT: JSON only. No markdown.
        LANGUAGE: English
        STRICTNESS LEVEL: 5/10. MODE: BALANCED. Be fair but verified. Require proof of skills in experience history.
        WEIGHTING: Prioritize objective evidence from CV content. Apply 2x weight to verified skills and tenure. Profile-only claims are secondary signal.
        TRANSFERABILITY: Focus on direct functional alignment.
        DOMAIN TOLERANCE: Be cautious but allow transferable competencies.

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
        
        INSTRUCTIONS: Provide a cold, objective, and professional assessment.
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
        Bio: ${this.cleanText(candidate.bio || '').substring(0, 1000)}
        Listed Skills: ${this.parseSkills(candidate.skills).join(', ')}
        Application Note: ${this.cleanText(candidate.proposal_message || '').substring(0, 1000)}

        === EXTRACTED CV CONTENT ===
        ${cvText ? cvText : "(No CV file accessible, analyze based on Profile/Bio only)"}
        `;

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
                timeout: 60000 
            });

            let raw = resp.data.choices[0].message.content;
            if (typeof raw === 'string') {
                raw = raw.trim();
                if (raw.startsWith('```')) {
                    raw = raw.replace(/^```(json)?\s*/i, '').replace(/\s*```$/, '');
                }
            }

            const obj = JSON.parse(raw);
            obj.verdict = this.normalizeVerdict(obj.verdict, obj.score);
            obj.cv_meta = { used: !!cvMeta.used, reason: cvMeta.reason, length: cvText.length };
            
            // Store the parameters used for this analysis
            obj.analysis_params = {
                instructions: "Standard professional background analysis",
                source: "background",
                strictness: 5,
                cv_weight: 66,
                domain_tolerance: 50,
                transferability: false,
                model: "deepseek-chat"
            };
            
            return obj;
        } catch (e) {
            logger.error('DeepSeek Analysis Failed in Service:', e.message);
            return null;
        }
    }
}

module.exports = AIEvaluationService;
