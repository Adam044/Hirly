const test = require('node:test');
const assert = require('node:assert/strict');
const scoring = require('../services/candidateScoring');

const rubric = { key: 'fixture', criteria: [
  { id: 'c1', label: 'Digital strategy leadership', category: 'scope', weight: 60, required: true, job_quote: 'Digital strategy leadership' },
  { id: 'c2', label: 'Banking knowledge', category: 'domain', weight: 40, required: false, job_quote: 'Banking knowledge' }
] };
const sources = { cv: 'Led digital strategy. Banking operations.', bio: 'Digital strategy projects. Banking knowledge.' };
const rating = (score, source = 'cv', related = 0) => ({ direct_score: score, related_score: related,
  evidence: [{ source, quote: source === 'cv' ? 'Led digital strategy.' : 'Digital strategy projects.' }], explanation: 'Evidence supports the stated scope.' });
const assessments = (first, second) => [{ criterion_id: 'c1', cv: rating(first) }, { criterion_id: 'c2', cv: rating(second) }];
const defaults = scoring.settings();

test('specific criterion differences contribute to distinct calculated totals', () => {
  assert.equal(scoring.calculateScore(rubric, assessments(90, 50), sources, defaults).score, 74);
  assert.equal(scoring.calculateScore(rubric, assessments(75, 90), sources, defaults).score, 81);
  assert.equal(scoring.calculateScore(rubric, assessments(60, 40), sources, defaults).score, 52);
});

test('CV weight blends CV and profile ratings mathematically', () => {
  const rows = rubric.criteria.map(row => ({ criterion_id: row.id, cv: rating(90), profile: rating(30, 'bio') }));
  assert.equal(scoring.calculateScore(rubric, rows, sources, scoring.settings({ cv_weight: 66 })).score, 70);
  assert.equal(scoring.calculateScore(rubric, rows, sources, scoring.settings({ cv_weight: 90 })).score, 84);
  assert.equal(scoring.calculateScore(rubric, rows, sources, scoring.settings({ cv_weight: 0 })).score, 30);
});

test('domain tolerance changes credit for related industry experience', () => {
  const rows = [{ criterion_id: 'c1', cv: rating(80) }, { criterion_id: 'c2', cv: rating(20, 'cv', 90) }];
  const low = scoring.calculateScore(rubric, rows, sources, scoring.settings({ domain_tolerance: 0 }));
  const high = scoring.calculateScore(rubric, rows, sources, scoring.settings({ domain_tolerance: 100 }));
  assert.equal(low.score, 56);
  assert.equal(high.score, 84);
});

test('transferability changes related skill credit without inflating direct evidence', () => {
  const rows = [{ criterion_id: 'c1', cv: rating(20, 'cv', 80) }, { criterion_id: 'c2', cv: rating(80) }];
  const enabled = scoring.calculateScore(rubric, rows, sources, scoring.settings({ transferability: true }));
  const disabled = scoring.calculateScore(rubric, rows, sources, scoring.settings({ transferability: false }));
  assert.ok(enabled.score > disabled.score);
  assert.equal(enabled.breakdown[0].score, 60);
  assert.equal(disabled.breakdown[0].score, 28);
});

test('strictness adjusts partial matches consistently and keeps perfect matches at 100', () => {
  const rows = assessments(75, 75);
  const low = scoring.calculateScore(rubric, rows, sources, scoring.settings({ strictness: 1 }));
  const normal = scoring.calculateScore(rubric, rows, sources, defaults);
  const high = scoring.calculateScore(rubric, rows, sources, scoring.settings({ strictness: 10 }));
  assert.ok(low.score > normal.score && normal.score > high.score);
  assert.equal(scoring.calculateScore(rubric, assessments(100, 100), sources, scoring.settings({ strictness: 10 })).score, 100);
});

test('unknown evidence is excluded rather than converted to a zero or confident rejection', () => {
  const report = scoring.calculateScore(rubric, [{ criterion_id: 'c2', cv: rating(80) }], sources, defaults);
  assert.equal(report.score, 80);
  assert.equal(report.evidence_coverage, 40);
  assert.equal(report.verdict, 'Backup');
  assert.equal(report.breakdown[0].score, null);
});

test('unsupported quotes and duplicate assessments do not contribute points', () => {
  const invalid = rating(90);
  invalid.evidence[0].quote = 'Invented achievement';
  assert.throws(() => scoring.calculateScore(rubric, [{ criterion_id: 'c1', cv: invalid }], sources, defaults), /Insufficient/);
  assert.throws(() => scoring.calculateScore(rubric, [assessments(80, 80)[0], assessments(80, 80)[0]], sources, defaults), /Insufficient/);
});

test('channel evidence cannot cross sources and source selection is enforced', () => {
  const input = { bio: 'خبرة في التحول الرقمي', skills: ['C++', 'C#'], first_name: 'Private', birthdate: '1990-01-01' };
  assert.deepEqual(scoring.sourceTexts(input, { text: 'CV text' }, scoring.settings({ source: 'cv_only' })), { cv: 'CV text' });
  assert.equal(scoring.sourceTexts(input, { text: 'CV text' }, scoring.settings({ source: 'profile_only' })).cv, undefined);
  assert.equal(JSON.stringify(scoring.sourceTexts(input, {}, defaults)).includes('Private'), false);
  assert.throws(() => scoring.calculateScore(rubric, [{ criterion_id: 'c1', cv: rating(90, 'bio') }], sources, defaults), /Insufficient/);
});

test('Unicode and technical punctuation survive scoring input preparation', () => {
  assert.equal(scoring.cleanText('خبرة في C++ و C# — français'), 'خبرة في C++ و C# — français');
  assert.equal(scoring.sourceTexts({ bio: 'خبرة برمجية' }, { text: 'سيرة ذاتية' }, defaults).cv, 'سيرة ذاتية');
});

test('zero is a valid evidence-supported score and equivalent evidence can tie', () => {
  const zero = scoring.calculateScore(rubric, assessments(0, 0), sources, defaults);
  assert.equal(zero.score, 0);
  assert.equal(zero.verdict, 'Reject');
  assert.equal(scoring.calculateScore(rubric, assessments(80, 60), sources, defaults).score,
    scoring.calculateScore(rubric, assessments(80, 60), sources, defaults).score);
});

test('rubric must quote the actual job and weights are normalized', () => {
  const context = scoring.jobContext({ title: 'Developer', description: 'C++ development and SQL queries' });
  const rows = [{ label: 'C++', category: 'skills', weight: 2, job_quote: 'C++ development' },
    { label: 'SQL', category: 'skills', weight: 1, job_quote: 'SQL queries' }];
  assert.equal(Math.round(scoring.validateRubric(rows, context).reduce((sum, row) => sum + row.weight, 0)), 100);
  assert.throws(() => scoring.validateRubric([{ ...rows[0], job_quote: 'Invented requirement' }, rows[1]], context), /grounded/);
});

test('full report schema is preserved; a model-supplied overall score is ignored', async () => {
  const job = { id: 9001, title: 'Unique reporting test', description: 'Digital strategy leadership. Banking knowledge.' };
  let calls = 0;
  const transport = { post: async (_, payload) => {
    calls++;
    const content = calls === 1 ? { criteria: rubric.criteria } : {
      score: 99, verdict: 'Strong Hire', headline: 'Experienced digital strategy leader', executive_summary: 'Detailed candidate-specific report.',
      skills_analysis: { matched: ['Digital strategy'], missing: [] }, pros: ['Specific strength'], cons: ['Needs banking verification'], interview_guide: ['Describe a delivery.'],
      assessments: assessments(90, 50)
    };
    assert.equal(payload.temperature, 0);
    return { data: { choices: [{ message: { content: JSON.stringify(content) } }] } };
  } };
  const report = await scoring.analyze({ job, candidate: { bio: sources.bio }, cvInfo: { text: sources.cv, status: { reason: 'parsed' } } }, { transport });
  assert.equal(report.score, 74);
  assert.equal(report.verdict, 'Interview');
  assert.equal(report.executive_summary, 'Detailed candidate-specific report.');
  assert.deepEqual(report.pros, ['Specific strength']);
  assert.equal(report.scoring.version, scoring.VERSION);
  assert.equal(calls, 2);
  assert.equal(report.assessments, undefined);
  assert.equal(report.analysis_params.cv_weight, 66);
  assert.equal(report.analysis_params.transferability, true);
  const cached = await scoring.analyze({ job, candidate: { bio: sources.bio }, cvInfo: { text: sources.cv }, previousReport: JSON.stringify(report) }, { transport });
  assert.equal(cached.score, 74);
  assert.equal(calls, 2, 'unchanged inputs reuse the saved report');
  await scoring.analyze({ job, candidate: { bio: sources.bio }, cvInfo: { text: sources.cv }, previousReport: report, force: true }, { transport });
  assert.equal(calls, 3, 'Quick Launch forces fresh candidate analysis');
  await scoring.analyze({ job, candidate: { bio: sources.bio + ' New responsibility.' }, cvInfo: { text: sources.cv }, previousReport: report }, { transport });
  assert.equal(calls, 4, 'changed evidence invalidates the saved report');
});

test('saved job rubric is reused after process-cache misses', async () => {
  const job = { id: 9002, title: 'Persisted rubric test', description: 'Digital strategy leadership. Banking knowledge.' };
  const config = scoring.settings();
  const key = scoring.hash({ version: scoring.VERSION, job: scoring.jobContext(job), priorities: config.instructions });
  const result = await scoring.prepareRubric(job, config, { pool: { query: async () => ({ rows: [{ full_report: JSON.stringify({ scoring: { version: scoring.VERSION, rubric_key: key, rubric: rubric.criteria } }) }] }) }, transport: { post: () => { throw new Error('No rubric API request expected'); } } });
  assert.equal(result.key, key);
  assert.equal(result.criteria.length, 2);
});

test('background analysis uses the same engine and Quick Launch default calibration', async () => {
  const Service = require('../services/aiEvaluationService');
  const original = scoring.analyze;
  let input;
  scoring.analyze = async value => { input = value; return { score: 74 }; };
  try {
    const result = await new Service({}).runDeepSeekAnalysis({}, {}, { text: 'CV' });
    assert.equal(result.score, 74);
    assert.equal(input.cv_weight, 66);
    assert.equal(input.domain_tolerance, 50);
    assert.equal(input.strictness, 5);
    assert.equal(input.transferability, true);
  } finally { scoring.analyze = original; }
});

test('manual analysis forwards current calibration, dossier and force flag without a new UI flow', async () => {
  const vm = require('node:vm');
  const fs = require('node:fs');
  const source = fs.readFileSync('routes/ai.js', 'utf8');
  const wrapper = source.slice(source.indexOf('    async function analyzeWithDeepSeek'), source.indexOf('    // --- ROUTES ---'));
  let forwarded;
  const context = vm.createContext({ process: { env: { DEEPSEEK_API_KEY: 'test-not-real' } }, logger: { error() {} },
    candidateScoring: { analyze: async input => { forwarded = input; return { score: 73 }; } } });
  vm.runInContext(wrapper, context);
  const job = { job_dossier: { must_haves: ['Digital strategy'] } };
  const report = await context.analyzeWithDeepSeek(job, {}, 'ar', 'Prioritize delivery', 'both', 8,
    { text: 'CV evidence' }, { cv_weight: 85, domain_tolerance: 25, transferability: true, previousReport: '{}', force: true }, {});
  assert.equal(report.score, 73);
  assert.equal(forwarded.job, job);
  assert.equal(forwarded.strictness, 8);
  assert.equal(forwarded.cv_weight, 85);
  assert.equal(forwarded.domain_tolerance, 25);
  assert.equal(forwarded.force, true);
  assert.equal(forwarded.language, 'ar');
});

test('rubric normalization remains stable across persistence and reload', () => {
  const context = scoring.jobContext({ title: 'Role', description: 'Skill one. Skill two. Skill three.' });
  const input = ['one', 'two', 'three'].map(word => ({ label: word, category: 'skills', weight: 1, job_quote: `Skill ${word}` }));
  const first = scoring.validateRubric(input, context);
  assert.equal(scoring.hash(scoring.validateRubric(JSON.parse(JSON.stringify(first)), context)), scoring.hash(first));
});
