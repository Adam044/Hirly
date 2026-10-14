Candidate scoring (backend only)
================================

The existing AI page, controls, report fields, verdict names and displayed percentages are unchanged. No database migration, scorecard approval screen or new frontend asset is required. Quick Launch still analyzes all applicants using the existing defaults.

Diagnosis
---------

A read-only inspection of job 2051 confirmed that the seven 72-point reports used different readable CVs (roughly 3,800–6,500 extracted characters) with the same calibration. Their reports described different skill, leadership and industry strengths, but the old prompt requested an unconstrained overall number. This supports changing the scoring strategy; it does not establish that every tie is incorrect. `scripts/inspect-ai-scores.js` performs that read-only inspection without downloading CVs or changing reports.

Scoring strategy
----------------

1. Before evaluating candidates, extract 2–12 weighted criteria from the job and existing dossier. Every criterion must quote actual job text or requirements. Job-specific employer priorities can affect this rubric. The same rubric is reused for every candidate under those priorities; no candidate data influences the rubric request.
2. For each criterion, AI assesses CV and profile evidence separately. It returns direct and related alignment ratings, exact source excerpts and an explanation. Anchors are 0 (explicit mismatch), 25 (small relevant element), 50 (substantial partial alignment), 75 (most established), and 100 (full requirement demonstrated). Intermediate integers require evidence-based justification. Missing evidence is unknown, not zero.
3. The server validates source excerpts, applies calibration, and calculates the final score. The model's proposed overall score or verdict, if any, is ignored. It continues to supply the same detailed report sections.

Calibration mathematics
-----------------------

For each criterion/source channel: `alignment = max(direct_score, related_score * related_credit)`.

For industry/domain criteria, related credit is `domain_tolerance / 100`. For other criteria it is 0.75 with transferability enabled and 0.35 when disabled. This keeps documented direct alignment separate from analogous experience; the model must not pre-apply the discounts.

CV and profile scores are blended using the existing CV-weight slider (default 66/34). Missing channels are excluded and remaining weights normalized; an explicitly zero-weight channel contributes nothing. CV-only and profile-only selections enforce their source independently of the slider.

The weighted average of assessed job criteria gives a base match. Unknown criteria are excluded from the denominator. Strictness applies a monotonic adjustment: `score = round(100 * (base / 100) ** (1 + (strictness - 5) * 0.08))`. Balanced (5) preserves the base score; higher strictness reduces partial matches, lower strictness increases them, and complete matches remain 100. This is an explicit initial calibration policy, not a statistically validated probability.

Existing recommendation bands are consistent: Strong Hire at 85+, Interview at 60+, Backup at 40+, and Reject below 40. If less than 60% of criterion weight is assessed or a required criterion is unknown, recommendation is Backup and the existing executive summary explains the evidence limitation. No usable evidence produces the existing analysis-failure path rather than an invented score or automatic rejection.

Operational behavior
--------------------

Rubrics are cached per job content and employer priorities. Their snapshots are stored in the existing full-report JSON and reused after restart when available. Each report includes hidden scoring details for diagnosis. The cache checks scoring version, rubric, evidence content, language and calibration; a changed input requires fresh analysis. Quick Launch's existing force flag bypasses candidate-result reuse.

Manual and background analysis use the shared engine. Background defaults now match Quick Launch, including transferability enabled. Arabic, accents and technical punctuation are preserved by text cleaning. Existing previously damaged extraction caches are not rewritten by this change.

Temporary network/server/rate-limit errors retry at most three times. Failed manual reruns preserve prior successful reports. Existing applicant scores are not changed until a new analysis runs. A cold rubric requires one extra model request per job/priorities, shared across candidates; subsequent runs reuse the persisted rubric where possible.

Validation and limitations
--------------------------

Run `node --test tests/candidate-scoring.test.js tests/quick-launch.test.js`.

Tests use mocked model/database responses, consume no AI credits and do not update applicant reports. They verify arithmetic, calibration, evidence checks, cache invalidation and report compatibility; they do not prove improved hiring accuracy. The model still interprets evidence and selects raw criterion ratings. Exact-excerpt checks establish source presence, not factual truth or correct interpretation. Equivalent evidence may legitimately produce equal scores. Validate ranking quality and repeat-run consistency against recruiter-reviewed cases before relying on small score differences.
