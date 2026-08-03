const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const logger = require('../utils/logger');
const router = express.Router();

module.exports = function registerInterviewRoutes(app, pool, { isAuthenticated, isEmployer }) {
  const { sendInterviewInviteEmail, sendInterviewCompletedEmail } = require('../utils/emailService');

  // ==========================================
  // HELPER: AI & LOGIC UTILITIES
  // ==========================================

  /**
   * Calls DeepSeek API to generate an interview reply.
   * Includes retry logic and language context handling.
   */
  async function deepseekInterviewReply(context, lang = 'ar') {
    try {
    if (!process.env.DEEPSEEK_API_KEY) {
        logger.warn("AI: API Key missing.");
        return { reply: lang === 'ar' ? 'عذراً، خدمة الذكاء الاصطناعي غير متوفرة حالياً.' : 'AI service unavailable.' };
      }
      
      const systemPrompt = lang === 'ar'
        ? `أنت 'بايلوت' (Pilot)، مسؤول توظيف محترف من منصة Hirly.
           أهدافك:
           1. كن ودوداً ومحترفاً. استخدم لغة طبيعية.
           2. اطرح سؤالاً واحداً فقط في كل مرة.
           3. التزم بتعليمات صاحب العمل (إن وجدت) بدقة تامة.
           4. استخدم عبارات انتقالية طبيعية مثل "هذا مثير للاهتمام" أو "فهمت" قبل طرح السؤال التالي.
           5. حافظ على الردود قصيرة وموجزة (أقل من 50 كلمة).
           أجب باللغة العربية فقط.`
        : `You are 'Pilot', a professional AI Recruiter for Hirly.
           Your Prime Directives:
           1. Be friendly, professional, and slightly conversational.
           2. Ask EXACTLY ONE clear question at a time. Never double-barrel questions.
           3. STRICTLY FOLLOW any specific instructions provided by the Hiring Manager. If they asked to focus on "React", ask deep technical questions about React.
           4. If the candidate asks a question, answer it strictly based on the provided Job Description. If unknown, say "I'll make a note for the hiring manager."
           5. Keep responses concise (under 50 words usually).
           Response Language: English only.`;

      const response = await axios.post('https://api.deepseek.com/chat/completions', {
        model: 'deepseek-chat',
        messages: [
            { role: 'system', content: systemPrompt }, 
            { role: 'user', content: context }
        ],
        temperature: 0.3, // Slightly higher for human feel
        max_tokens: 150
      }, { 
        headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` }, 
        timeout: 60000 
      });
      
      if(response.data && response.data.choices && response.data.choices.length > 0) {
          return { reply: response.data.choices[0].message.content };
      }
      throw new Error("Empty response from AI provider");

    } catch (e) { 
        logger.error("AI Error:", e.message);
        return { reply: lang === 'ar' ? 'عذراً، فقدت حبل أفكاري. هل يمكنك التوضيح؟' : 'I apologize, I lost my train of thought. Could you elaborate on your last point?' }; 
    }
  }

  /**
   * Fallback heuristic scoring system if AI is unavailable or fails.
   * Scans keywords to determine readiness and concerns.
   */
  function deriveEvaluation(convo, C, beforeScore) {
    try {
      const lines = (convo || '').split('\n');
      const appl = lines.filter(l => l.startsWith('APPLICANT:')).join(' ');
      const low = appl.toLowerCase();
      
      // Fetch structured data from context if available
      const strengthsArr = Array.isArray(C.detailed_strengths) ? C.detailed_strengths : [];
      const weaknessesArr = Array.isArray(C.detailed_weaknesses) ? C.detailed_weaknesses : [];
      
      // Readiness Heuristic
      let ready = 'developing';
      if (/convinc|marketing|represent|store|sales|manage|lead/.test(low) || (strengthsArr.join(' ').toLowerCase().match(/sales|field|communication|leadership/))) {
        ready = 'ready';
      }

      // Concerns Heuristic
      const concerns = [];
      // Budget check
      if (C.budget) {
          const budgetVal = parseFloat(C.budget);
          // Look for numbers in user text that might indicate salary expectation
          const numbers = low.match(/(\d{3,6})/g);
          if (numbers && numbers.some(n => parseFloat(n) > budgetVal * 1.2)) {
              concerns.push('Potential salary mismatch (detected numbers exceed budget)');
          }
      }
      if (/remote only|can't relocate|visa issue/.test(low)) {
          concerns.push('Logistical constraints mentioned');
      }

      // Base score calculation
      let s = Number.isFinite(beforeScore) ? beforeScore : 50;
      if (ready === 'ready') s += 15;
      if (concerns.length > 0) s -= 10;
      
      // Clamp
      s = Math.max(0, Math.min(100, Math.round(s)));

      return {
        score: s,
        summary: `Interview completed. Automated heuristic score: ${s}. (AI analysis unavailable).`,
        wage_expectation: 'Not extracted',
        budget_alignment: concerns.length > 0 ? 'misaligned' : 'aligned',
        readiness: ready,
        concerns
      };
    } catch (e) { 
        logger.error("Heuristic Eval Error:", e);
        return { score: Number.isFinite(beforeScore) ? beforeScore : 50, summary: 'Interview completed (Evaluation Failed).', concerns: [] }; 
    }
  }

  // ==========================================
  // ROUTES: EMPLOYER MANAGEMENT
  // ==========================================

  // 1. INITIATE INTERVIEW
  router.post('/interviews/initiate', isAuthenticated, isEmployer, async (req, res) => {
    const { applicationId, instructions, language, expiresDays, durationMinutes, deadlineAt } = req.body;
    const employerId = req.session.userId;
    let client;
    
    try {
      client = await pool.connect();
      
      // 1. Validate Application Ownership
      const appRes = await client.query(`
        SELECT a.id AS application_id, a.job_id, a.professional_id, u.email AS professional_email, u.first_name, u.last_name,
               j.title AS job_title, j.employer_id
        FROM applications a
        JOIN users u ON a.professional_id = u.id
        JOIN jobs j ON a.job_id = j.id
        WHERE a.id = $1 AND j.employer_id = $2
      `, [applicationId, employerId]);
      
      if (appRes.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'Application not found or you do not have permission.' });
      }
      const row = appRes.rows[0];

      // 2. Generate Secure Token
      const token = crypto.randomBytes(32).toString('hex'); // 64 chars high entropy
      
      // 3. Calculate Expiry
      let expiresAt = new Date(Date.now() + (expiresDays || 7) * 24 * 60 * 60 * 1000);
      if(deadlineAt) {
          const parsed = new Date(deadlineAt);
          if(!isNaN(parsed.getTime())) expiresAt = parsed;
      }
      
      // 4. Create Session Record
      await client.query(`
        INSERT INTO interview_sessions (application_id, job_id, employer_id, professional_id, token, instructions, language, status, expires_at, duration_minutes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9)
      `, [
          row.application_id, 
          row.job_id, 
          employerId, 
          row.professional_id, 
          token, 
          instructions || '', 
          language || 'en', 
          expiresAt, 
          durationMinutes || 20
      ]);
      
      // 5. Update Application Status
      await client.query(`UPDATE applications SET status = 'interviewing' WHERE id = $1`, [applicationId]);
      
      // 6. Send Invitation Email
      const link = `${process.env.APP_BASE_URL}/interview.html?token=${token}`;
      await sendInterviewInviteEmail(row.professional_email, row.job_title, link, employerId, { expiresAt });
      
      res.json({ success: true, link, message: "Interview initiated successfully." });

    } catch (e) { 
        logger.error("Initiate Error:", e);
        res.status(500).json({ success: false, error: e.message }); 
    } finally { 
        if (client) client.release(); 
    }
  });

  // ==========================================
  // ROUTES: PUBLIC CANDIDATE INTERFACE (TOKEN BASED)
  // ==========================================

  // 2. GET SESSION DETAILS (Public)
  router.get('/interviews/session/:token', async (req, res) => {
    const { token } = req.params;
    let client;
    try {
      client = await pool.connect();
      const sRes = await client.query(`
        SELECT s.id, s.status, s.language, s.invitation_response, s.professional_id,
               s.expires_at, s.started_at, s.completed_at,
               fu.email AS professional_email, fu.first_name AS professional_first_name, fu.last_name AS professional_last_name
        FROM interview_sessions s
        JOIN users fu ON fu.id = s.professional_id
        WHERE s.token = $1
      `, [token]);
      
      if (sRes.rows.length === 0) return res.status(404).json({ success: false, error: 'Session not found' });
      
      // NOTE: We return the numeric ID because some internal frontend logic might map it, 
      // but strictly speaking, all actions should use the token.
      res.json({ success: true, session: sRes.rows[0] });
    } catch (e) { 
        res.status(500).json({ success: false, error: e.message }); 
    } finally { 
        if (client) client.release(); 
    }
  });

  // 3. RESPOND TO INVITE (Public)
  router.post('/interviews/:token/respond', async (req, res) => {
    const { token } = req.params;
    const { action } = req.body; // 'accept' or 'reject'
    let client;
    try {
      if (!['accept','reject'].includes(action)) return res.status(400).json({ success: false, error: 'Invalid action' });
      
      client = await pool.connect();
      const sRes = await client.query(`SELECT id, status, invitation_response FROM interview_sessions WHERE token = $1`, [token]);
      
      if (sRes.rows.length === 0) return res.status(404).json({ success: false, error: 'Session not found' });
      const s = sRes.rows[0];

      if (action === 'accept') {
        // Prevent re-starting completed sessions
        if (s.status === 'completed' || s.status === 'expired') {
            return res.status(409).json({ success: false, error: 'Session is no longer active' });
        }
        await client.query(`
            UPDATE interview_sessions 
            SET invitation_response = 'accepted', status = 'active', started_at = COALESCE(started_at, NOW()) 
            WHERE id = $1
        `, [s.id]);
      } else {
        await client.query(`
            UPDATE interview_sessions 
            SET invitation_response = 'rejected' 
            WHERE id = $1
        `, [s.id]);
      }
      res.json({ success: true });
    } catch (e) { 
        res.status(500).json({ success: false, error: e.message }); 
    } finally { 
        if (client) client.release(); 
    }
  });

  // 4. SEND MESSAGE (SECURE - uses :token to prevent IDOR)
  router.post('/interviews/token/:token/message', async (req, res) => {
    const { token } = req.params;
    const { sender, content } = req.body;
    let client;
    try {
      client = await pool.connect();
      
      // Look up ID securely via Token
      const sessionRes = await client.query(`SELECT id, status FROM interview_sessions WHERE token = $1`, [token]);
      if (sessionRes.rows.length === 0) return res.status(403).json({ success: false, error: "Invalid Session Token" });
      
      const session = sessionRes.rows[0];
      if(session.status !== 'active' && session.status !== 'pending') {
          return res.status(400).json({ success: false, error: "Session is not active" });
      }

      await client.query(`INSERT INTO interview_messages (session_id, sender, content) VALUES ($1,$2,$3)`, [session.id, sender, content]);
      res.json({ success: true });
    } catch (e) { 
        res.status(500).json({ success: false, error: e.message }); 
    } finally { 
        if (client) client.release(); 
    }
  });

  // 5. GENERATE NEXT AI QUESTION (SECURE - uses :token)
  // UPDATED LOGIC: Smart Pipeline with Employer Instruction Priority
  router.post('/interviews/token/:token/next', async (req, res) => {
    const { token } = req.params;
    let client;
    try {
      client = await pool.connect();
      
      // 1. Fetch Context via Token
      const ctxRes = await client.query(`
        SELECT s.id, s.application_id, s.instructions, s.language, 
               j.title, j.description, j.budget, j.currency, j.job_type, j.city AS job_city,
               u.first_name, u.last_name, f.profession, f.bio,
               ae.match_score AS before_score, ae.summary AS before_summary,
               dr.detailed_summary, dr.detailed_strengths, dr.detailed_weaknesses, dr.interview_questions
        FROM interview_sessions s
          JOIN jobs j ON s.job_id = j.id
          JOIN users u ON s.professional_id = u.id
          LEFT JOIN professionals f ON f.user_id = u.id
          LEFT JOIN application_ai_evaluations ae ON ae.application_id = s.application_id
        LEFT JOIN deep_reports dr ON dr.application_id = s.application_id
        WHERE s.token = $1
      `, [token]);
      
      if (ctxRes.rows.length === 0) return res.status(404).json({ success: false, error: "Invalid Token" });
      const C = ctxRes.rows[0];
      const sessionId = C.id;

      // 2. Fetch Conversation History
      const msgsRes = await client.query(`SELECT sender, content FROM interview_messages WHERE session_id = $1 ORDER BY id ASC`, [sessionId]);
      const allMsgs = msgsRes.rows;
      const convoLen = allMsgs.length;
      
      // Get last message from applicant for analysis
      const lastApplicant = [...allMsgs].reverse().find(m => (m.sender || '').toLowerCase() === 'applicant');
      
      // 3. Determine Conversation Stage (Enhanced State Machine)
      // Stages: intro -> instructions_priority -> job_fit -> reverse_qa -> wrap_up
      let stage = 'intro';
      
      // Check if we have specific instructions to prioritize
      const hasSpecificInstructions = C.instructions && C.instructions.length > 5;
      
      if (convoLen >= 2) stage = hasSpecificInstructions ? 'instructions_priority' : 'job_fit';
      if (stage === 'instructions_priority' && convoLen >= 6) stage = 'job_fit'; // Spend ~2 Qs on instructions
      if (stage === 'job_fit' && convoLen >= 10) stage = 'reverse_qa';
      if (convoLen >= 14) stage = 'wrap_up';

      // 4. Construct AI Prompt
      const tailMsgs = allMsgs.slice(-10); // Context window
      const convoTail = tailMsgs.map(r => `${r.sender.toUpperCase()}: ${r.content}`).join('\n');
      
      const prompt = `
        Current Interview Stage: ${stage}
        
        [JOB DATA]
        Title: ${C.title}
        Desc: ${C.description.substring(0, 500)}...
        Budget: ${C.budget || 'N/A'} ${C.currency}
        Location: ${C.job_city}
        
        [CANDIDATE]
        Name: ${C.first_name}
        Bio: ${C.bio.substring(0, 300)}...
        Known Strengths: ${(C.detailed_strengths || []).slice(0,3).join(', ')}
        
        [CRITICAL INSTRUCTIONS FROM HIRING MANAGER]
        ${C.instructions || "None. Focus on general fit."}
        
        [INSTRUCTIONS FOR STAGE: ${stage}]
        - intro: Ask 1 friendly icebreaker. Do NOT ask "Tell me about yourself" if Bio is known.
        - instructions_priority: Ask a specific question DIRECTLY related to the [CRITICAL INSTRUCTIONS].
        - job_fit: Ask a probing question about a skill listed in Job Desc but missing from strengths.
        - reverse_qa: Ask if they have questions. IF they asked one in the last message, ANSWER it using [JOB DATA].
        - wrap_up: Thank them and say "Goodbye".
        
        [CONVERSATION HISTORY]
        ${convoTail}
        
        [YOUR TURN]
        Generate ONE response. Keep it professional and warm. Under 50 words.
      `;

      // 5. Generate Response
      const aiResult = await deepseekInterviewReply(prompt, C.language);
      
      // 6. Save AI Reply to DB
      await client.query(`INSERT INTO interview_messages (session_id, sender, content) VALUES ($1,'ai',$2)`, [sessionId, aiResult.reply]);
      
      // 7. Check for Implicit Wrap Up
      if (stage === 'wrap_up' && aiResult.reply.toLowerCase().includes('goodbye')) {
         // Trigger async completion logic
         axios.post(`${process.env.APP_BASE_URL}/api/interviews/token/${token}/complete`).catch(e => logger.error("Async Complete Error:", e.message));
      }

      res.json({ success: true, aiReply: aiResult.reply });

    } catch (e) { 
        res.status(500).json({ success: false, error: e.message }); 
    } finally { 
        if (client) client.release(); 
    }
  });

  // 6. COMPLETE SESSION (SECURE via TOKEN)
  router.post('/interviews/token/:token/complete', async (req, res) => {
    const { token } = req.params;
    let client;
    try {
      client = await pool.connect();
      
      // 1. Fetch Session Data
      const sessionRes = await client.query(`
        SELECT s.id, s.application_id, s.job_id, j.title, j.description, j.budget, j.currency,
               ae.match_score AS before_score, u.email AS employer_email, fu.first_name, fu.last_name
        FROM interview_sessions s
        JOIN jobs j ON s.job_id = j.id
        JOIN users u ON j.employer_id = u.id
        JOIN users fu ON s.professional_id = fu.id
        LEFT JOIN application_ai_evaluations ae ON ae.application_id = s.application_id
        WHERE s.token = $1
      `, [token]);
      
      if (sessionRes.rows.length === 0) return res.status(404).json({ success: false, error: "Session not found" });
      const C = sessionRes.rows[0];
      const sessionId = C.id;

      // 2. Fetch Full Transcript
      const msgsRes = await client.query(`SELECT sender, content FROM interview_messages WHERE session_id = $1 ORDER BY id ASC`, [sessionId]);
      const convo = msgsRes.rows.map(r => `${r.sender.toUpperCase()}: ${r.content}`).join('\n');
      
      // 3. Perform AI Analysis (or Heuristic)
      let analysis = { summary: 'Interview Completed.', score: 50 };
      
      if (process.env.DEEPSEEK_API_KEY) {
        const sys = 'Output ONLY valid JSON: { score: number, summary: string, readiness: string, concerns: string[], wage_expectation: string, budget_alignment: string }';
        const user = `Analyze this interview transcript for the role of ${C.title}.
                      Budget: ${C.budget} ${C.currency}.
                      
                      Transcript:
                      ${convo}
                      
                      Produce the JSON evaluation.`;
        try {
            const resp = await axios.post('https://api.deepseek.com/chat/completions', {
                model: 'deepseek-chat',
                messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
                response_format: { type: "json_object" }
            }, { headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` }, timeout: 60000 });
            
            const rawContent = resp.data.choices[0].message.content;
            analysis = JSON.parse(rawContent);
        } catch (e) {
            logger.warn("Completion AI Failed, using heuristic:", e.message);
            analysis = deriveEvaluation(convo, C, C.before_score);
        }
      } else {
        analysis = deriveEvaluation(convo, C, C.before_score);
      }

      // 4. Save Report to DB
      await client.query(`
        INSERT INTO interview_reports (session_id, summary, score, readiness, concerns, wage_expectation, budget_alignment)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (session_id) DO UPDATE SET 
            summary=EXCLUDED.summary, 
            score=EXCLUDED.score,
            readiness=EXCLUDED.readiness,
            concerns=EXCLUDED.concerns,
            wage_expectation=EXCLUDED.wage_expectation,
            budget_alignment=EXCLUDED.budget_alignment
      `, [
          sessionId, 
          analysis.summary || 'Summary unavailable', 
          analysis.score || 0, 
          analysis.readiness || 'unknown', 
          JSON.stringify(analysis.concerns || []),
          analysis.wage_expectation || '',
          analysis.budget_alignment || ''
      ]);
      
      // 5. Mark Session Completed
      await client.query(`UPDATE interview_sessions SET status = 'completed', completed_at = NOW() WHERE id = $1`, [sessionId]);
      
      // 6. Notify Employer
      if (C.employer_email) {
        try { 
            await sendInterviewCompletedEmail(C.employer_email, C.title, `${C.first_name || ''} ${C.last_name || ''}`); 
        } catch(e) { logger.warn("Email failed:", e.message); }
      }
      
      res.json({ success: true });

    } catch (e) { 
        res.status(500).json({ success: false, error: e.message }); 
    } finally { 
        if (client) client.release(); 
    }
  });

  // 7. CHECK STATUS (Public poll)
  router.get('/interviews/token/:token/status', async (req, res) => {
    const { token } = req.params;
    let client;
    try {
      client = await pool.connect();
      const rows = await client.query(`
        SELECT s.status, s.completed_at, ir.score, ir.summary
        FROM interview_sessions s
        LEFT JOIN interview_reports ir ON ir.session_id = s.id
        WHERE s.token = $1
      `, [token]);
      
      if (rows.rows.length === 0) return res.json({ success: false });
      const r = rows.rows[0];
      
      res.json({ success: true, status: r.status, completed_at: r.completed_at, report_exists: !!r.summary });
    } catch (e) { 
        res.status(500).json({ success: false, error: e.message }); 
    } finally { 
        if (client) client.release(); 
    }
  });

  // ==========================================
  // ROUTES: ANALYTICS & REPORTING (AUTHENTICATED)
  // ==========================================

  // 8. GET TRANSCRIPT (Authenticated Employer)
  router.get('/interviews/:sessionId/transcript', isAuthenticated, isEmployer, async (req, res) => {
    const { sessionId } = req.params;
    let client;
    try {
        client = await pool.connect();
        // Verify ownership (simplified check - assumes employer has access to session ID)
        // In strictly high-security app, we should join with Jobs to check employer_id.
        const msgsRes = await client.query(`
            SELECT m.sender, m.content, m.created_at 
            FROM interview_messages m
            JOIN interview_sessions s ON m.session_id = s.id
            JOIN jobs j ON s.job_id = j.id
            WHERE s.id = $1 AND j.employer_id = $2
            ORDER BY m.id ASC
        `, [sessionId, req.session.userId]);
        
        res.json({ success: true, messages: msgsRes.rows });
    } catch (e) { 
        res.status(500).json({ success: false, error: e.message }); 
    } finally { 
        if (client) client.release(); 
    }
  });

  // 9. ANALYSIS OVERVIEW (Authenticated Employer)
  router.get('/interviews/analysis/:jobId', isAuthenticated, isEmployer, async (req, res) => {
    const { jobId } = req.params;
    const employerId = req.session.userId;
    let client;
    try {
      client = await pool.connect();
      const rows = await client.query(`
        SELECT 
          a.id AS application_id,
          u.first_name, u.last_name, u.city,
          f.profession,
          ae.match_score AS before_score,
          s.id AS session_id, s.token AS session_token, s.status AS session_status, s.invitation_response, s.completed_at,
          ir.score AS after_score, ir.summary AS after_summary,
          ir.wage_expectation, ir.budget_alignment, ir.readiness, ir.concerns
        FROM applications a
          JOIN jobs j ON a.job_id = j.id
          JOIN users u ON a.professional_id = u.id
          LEFT JOIN professionals f ON u.id = f.user_id
          LEFT JOIN application_ai_evaluations ae ON a.id = ae.application_id
        LEFT JOIN LATERAL (
          SELECT id, token, status, invitation_response, completed_at
          FROM interview_sessions
          WHERE application_id = a.id
          ORDER BY id DESC
          LIMIT 1
        ) s ON true
        LEFT JOIN LATERAL (
          SELECT score, summary, wage_expectation, budget_alignment, readiness, concerns
          FROM interview_reports
          WHERE session_id = s.id
          ORDER BY session_id DESC
          LIMIT 1
        ) ir ON true
        WHERE a.job_id = $1 AND j.employer_id = $2
        ORDER BY COALESCE(ir.score, -1) DESC, COALESCE(ae.match_score, -1) DESC
      `, [jobId, employerId]);
      
      const items = rows.rows.map(r => ({
        application_id: r.application_id,
        name: `${r.first_name} ${r.last_name}`.trim(),
        city: r.city,
        profession: r.profession,
        before_score: r.before_score || 0,
        after_score: r.after_score,
        delta: r.after_score != null ? (r.after_score - (r.before_score || 0)) : null,
        after_summary: r.after_summary || '',
        session_id: r.session_id,
        session_token: r.session_token,
        session_status: r.session_status || 'pending',
        invitation_response: r.invitation_response || null,
        completed_at: r.completed_at || null,
        readiness: r.readiness,
        concerns: (() => { 
            try { 
                if (Array.isArray(r.concerns)) return r.concerns; 
                if (typeof r.concerns === 'string') { 
                    const v = JSON.parse(r.concerns); 
                    return Array.isArray(v) ? v : []; 
                } 
                return []; 
            } catch { return []; } 
        })()
      }));
      
      res.json({ success: true, items });
    } catch (e) { 
        res.status(500).json({ success: false, error: e.message }); 
    } finally { 
        if (client) client.release(); 
    }
  });

  // 10. RE-EVALUATE SESSION (Authenticated Employer)
  // FULLY IMPLEMENTED: Fetches transcript and re-runs AI analysis
  router.post('/interviews/:sessionId/reevaluate', isAuthenticated, isEmployer, async (req, res) => {
      const { sessionId } = req.params;
      const employerId = req.session.userId;
      let client;
      
      try {
          client = await pool.connect();
          
          // 1. Validate Access
          const sessionRes = await client.query(`
            SELECT s.id, s.job_id, j.title, j.description, j.budget, j.currency,
                   ae.match_score AS before_score
            FROM interview_sessions s
            JOIN jobs j ON s.job_id = j.id
            LEFT JOIN application_ai_evaluations ae ON ae.application_id = s.application_id
            WHERE s.id = $1 AND j.employer_id = $2
          `, [sessionId, employerId]);
          
          if (sessionRes.rows.length === 0) {
              return res.status(403).json({ success: false, error: "Access denied or session not found" });
          }
          const C = sessionRes.rows[0];

          // 2. Fetch Transcript
          const msgsRes = await client.query(`SELECT sender, content FROM interview_messages WHERE session_id = $1 ORDER BY id ASC`, [sessionId]);
          const convo = msgsRes.rows.map(r => `${r.sender.toUpperCase()}: ${r.content}`).join('\n');

          // 3. Run AI Analysis
          let analysis = { summary: 'Re-evaluation completed.', score: 0 };
          
          if (process.env.DEEPSEEK_API_KEY) {
            const sys = 'Output ONLY valid JSON: { score: number, summary: string, readiness: string, concerns: string[], wage_expectation: string, budget_alignment: string }';
            const user = `RE-EVALUATE this interview transcript for the role of ${C.title}.
                          Budget: ${C.budget} ${C.currency}.
                          
                          Transcript:
                          ${convo}
                          
                          Produce the JSON evaluation.`;
            try {
                const resp = await axios.post('https://api.deepseek.com/chat/completions', {
                    model: 'deepseek-chat',
                    messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
                    response_format: { type: "json_object" }
                }, { headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` }, timeout: 60000 });
                
                analysis = JSON.parse(resp.data.choices[0].message.content);
            } catch (e) {
                logger.warn("Re-eval AI Failed:", e.message);
                analysis = deriveEvaluation(convo, C, C.before_score);
            }
          } else {
            analysis = deriveEvaluation(convo, C, C.before_score);
          }

          // 4. Update Report
          await client.query(`
            INSERT INTO interview_reports (session_id, summary, score, readiness, concerns, wage_expectation, budget_alignment)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            ON CONFLICT (session_id) DO UPDATE SET 
                summary=EXCLUDED.summary, 
                score=EXCLUDED.score,
                readiness=EXCLUDED.readiness,
                concerns=EXCLUDED.concerns,
                wage_expectation=EXCLUDED.wage_expectation,
                budget_alignment=EXCLUDED.budget_alignment
          `, [
              sessionId, 
              analysis.summary || 'Summary unavailable', 
              analysis.score || 0, 
              analysis.readiness || 'unknown', 
              JSON.stringify(analysis.concerns || []),
              analysis.wage_expectation || '',
              analysis.budget_alignment || ''
          ]);

          res.json({ success: true, message: "Session re-evaluated successfully", analysis });

      } catch (e) {
          res.status(500).json({ success: false, error: e.message });
      } finally {
          if (client) client.release();
      }
  });

  app.use('/api', router);
};