const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('views/employer/ai.html', 'utf8');
const quickLaunch = html.slice(html.indexOf('        function quickLaunchPilot()'), html.indexOf('        function analyzeCandidateNow('));
const runAnalysis = html.slice(html.indexOf('        async function runAnalysis('), html.indexOf('        // --- REPORT LOGIC ---'));

test('Quick Launch queues all applicants even when all already have scores', async () => {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, { value: '', checked: false, innerText: '', innerHTML: '', style: {},
      classList: { add() {}, remove() {}, contains() { return false; } }, prepend() {} });
    return elements.get(id);
  };
  const allScope = { value: 'all', checked: false };
  let request;
  const warnings = [];
  let scope;
  const applicants = [{ id: 11, match_score: 72 }, { id: 12, match_score: 68 }, { id: 13, match_score: 35 }];
  const context = vm.createContext({
    candidates: applicants, currentJobId: 1, activeChips: [], currentRunId: null,
    document: {
      getElementById: element,
      querySelector: selector => selector.includes('input[name="scope"]') ? allScope : null,
      querySelectorAll: () => []
    },
    updateStrictnessLabel() {}, toggleSpecificList(value) { scope = value; },
    closeWizard() {}, renderList() {}, addProcessingLog() {},
    showToast: (...args) => warnings.push(args),
    setInterval() { return 1; }, clearInterval() {}, setTimeout() {},
    fetch: async (url, options) => {
      request = { url, body: JSON.parse(options.body) };
      return { json: async () => ({ success: true, runId: 'test-run' }) };
    }
  });
  vm.runInContext(quickLaunch + runAnalysis, context);
  await vm.runInContext('quickLaunchPilot()', context);
  assert.deepEqual(request.body.applicationIds, [11, 12, 13]);
  assert.equal(request.body.force, true);
  assert.equal(request.body.source, 'both');
  assert.equal(allScope.checked, true);
  assert.equal(scope, 'none');
  assert.equal(warnings.length, 0);
});

test('calibrated specific selection retains its scope and default cache behavior', async () => {
  const elements = new Map();
  const context = vm.createContext({
    candidates: [{ id: 11 }, { id: 12 }], currentJobId: 1, activeChips: [],
    document: {
      getElementById: id => {
        if (!elements.has(id)) elements.set(id, { value: 'both', checked: false, style: {}, classList: { remove() {}, contains() {} } });
        return elements.get(id);
      },
      querySelector: () => ({ value: 'specific' }), querySelectorAll: () => [{ value: '12' }]
    }, closeWizard() {}, renderList() {}, addProcessingLog() {}, showToast() {},
    setInterval() {}, setTimeout() {}, clearInterval() {},
    fetch: async (_, options) => { context.payload = JSON.parse(options.body); return { json: async () => ({ success: true }) }; }
  });
  vm.runInContext(runAnalysis, context);
  await vm.runInContext('runAnalysis()', context);
  assert.deepEqual(context.payload.applicationIds, [12]);
  assert.equal(context.payload.force, false);
});
