const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const bcrypt = require('bcryptjs');
const keys = require('../utils/directAccessKey');
process.env.DIRECT_ACCESS_SECRET = 'test-only-persistent-secret-32-bytes-minimum';

function harness(job) {
  const handlers = {};
  const router = new Proxy({}, { get: (_, method) => (path, ...args) => { handlers[`${method} ${path}`] = args.at(-1); } });
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(require.resolve('../routes/admin'), 'utf8'), {
    module, __dirname: __dirname, Buffer, process,
    require(name) {
      if (name === 'express') return { Router: () => router };
      if (name === 'crypto' || name === 'path' || name === 'bcryptjs') return require(name);
      if (name.endsWith('directAccessKey')) return keys;
      if (name.endsWith('logger')) return { error() {} };
      if (name.endsWith('manager')) return { logLiveEvent() {} };
      return {};
    }
  });
  let updates = 0;
  let lock = Promise.resolve();
  function connect() {
    let unlock;
    return {
      async query(sql, values) {
        if (sql.endsWith('FOR UPDATE')) {
          const previous = lock;
          lock = new Promise(resolve => { unlock = resolve; });
          await previous;
        }
        if (sql.startsWith('SELECT')) return { rowCount: 1, rows: [{ ...job }] };
        if (sql.startsWith('UPDATE')) {
          updates++;
          job.access_key_hash = values[0]; job.access_key_encrypted = values[1];
        }
        if (sql === 'COMMIT' || sql === 'ROLLBACK') { unlock?.(); unlock = null; }
        return {};
      }, release() { unlock?.(); }
    };
  }
  module.exports({ use() {} }, { connect: async () => connect(), query: (...args) => connect().query(...args) }, {});
  return {
    async call(method, body = {}) {
      let result;
      const res = { set() {}, status() { return this; }, json(value) { result = value; return this; } };
      await handlers[method]({ body, params: { jobId: '1' } }, res);
      return result;
    }, updates: () => updates
  };
}

test('credentials persist across provisioning and retrieval; rotation is explicit', async () => {
  const job = { id: 1, title: 'Example' };
  const h = harness(job);
  const endpoint = 'post /admin/generate-job-access-key';
  const first = await h.call(endpoint, { jobId: 1, customKey: 'original-password' });
  assert.equal(first.accessKey, 'original-password');
  assert.notEqual(job.access_key_encrypted, first.accessKey);
  const hash = job.access_key_hash;
  assert.equal((await h.call(endpoint, { jobId: 1, customKey: 'accidental-replacement' })).accessKey, first.accessKey);
  assert.equal(job.access_key_hash, hash);
  assert.equal((await h.call('get /admin/job-access-key/:jobId')).accessKey, first.accessKey);
  assert.equal(h.updates(), 1);
  await h.call(endpoint, { jobId: 1, customKey: 'explicit-new-password', rotate: true });
  assert.equal(await bcrypt.compare('original-password', job.access_key_hash), false);
  assert.equal(await bcrypt.compare('explicit-new-password', job.access_key_hash), true);
  assert.equal(h.updates(), 2);
});

test('legacy hash-only passwords are preserved', async () => {
  const job = { id: 1, title: 'Legacy', access_key_hash: await bcrypt.hash('legacy-password', 4) };
  const h = harness(job);
  assert.equal((await h.call('post /admin/generate-job-access-key', { jobId: 1 })).accessKey, null);
  assert.equal(h.updates(), 0);
  assert.equal(await bcrypt.compare('legacy-password', job.access_key_hash), true);
});


test('simultaneous provisioning requests preserve the first saved password', async () => {
  const h = harness({ id: 1, title: 'Concurrent' });
  const responses = await Promise.all(['first-password', 'second-password'].map(customKey =>
    h.call('post /admin/generate-job-access-key', { jobId: 1, customKey })));
  assert.equal(responses[0].accessKey, 'first-password');
  assert.equal(responses[1].accessKey, 'first-password');
  assert.equal(h.updates(), 1);
});

test('unreadable encrypted credentials leave verification and retrieval available', async () => {
  const hash = await bcrypt.hash('still-valid', 4);
  const job = { id: 1, title: 'Unreadable', access_key_hash: hash, access_key_encrypted: 'v1:invalid:data:here' };
  const h = harness(job);
  const result = await h.call('get /admin/job-access-key/:jobId');
  assert.equal(result.success, true);
  assert.equal(result.provisioned, true);
  assert.equal(result.accessKey, null);
  await h.call('post /admin/generate-job-access-key', { jobId: 1 });
  assert.equal(h.updates(), 0);
  assert.equal(await bcrypt.compare('still-valid', job.access_key_hash), true);
});

test('session secret changes do not affect saved password retrieval', () => {
  const encrypted = keys.encryptAccessKey('persistent-password');
  const previous = process.env.SESSION_SECRET;
  process.env.SESSION_SECRET = 'changed-session-secret';
  assert.equal(keys.decryptAccessKey(encrypted), 'persistent-password');
  if (previous === undefined) delete process.env.SESSION_SECRET;
  else process.env.SESSION_SECRET = previous;
});

test('missing encryption configuration reports setup error without changing credentials', async () => {
  const previous = process.env.DIRECT_ACCESS_SECRET;
  delete process.env.DIRECT_ACCESS_SECRET;
  try {
    const h = harness({ id: 1, title: 'Unconfigured' });
    const result = await h.call('post /admin/generate-job-access-key', { jobId: 1 });
    assert.equal(result.success, false);
    assert.match(result.error, /DIRECT_ACCESS_SECRET/);
    assert.equal(h.updates(), 0);
  } finally {
    if (previous === undefined) delete process.env.DIRECT_ACCESS_SECRET;
    else process.env.DIRECT_ACCESS_SECRET = previous;
  }
});
