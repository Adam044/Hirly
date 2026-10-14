const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const fs = require('node:fs');
const vm = require('node:vm');
const localSessionCookie = require('../middleware/localSessionCookie');

test('production cookie configuration supports a local HTTP CSRF login round trip', async () => {
  const app = express();
  app.use(session({ secret: 'test-only-session-secret', resave: false, saveUninitialized: false,
    cookie: { secure: true, httpOnly: true, sameSite: 'lax' } }));
  app.use(localSessionCookie);
  const source = fs.readFileSync('server.js', 'utf8');
  const middleware = source.slice(source.indexOf('const setCsrfCookie ='), source.indexOf('app.use(csrfProtection);'));
  const protection = vm.runInNewContext(middleware + '\ncsrfProtection;', { crypto, logger: { warn() {}, error() {} } });
  app.use(protection);
  app.get('/login', (req, res) => res.json({ token: req.session.csrfToken }));
  let loginCalls = 0;
  app.post('/api/login', (req, res) => { loginCalls++; res.json({ success: true }); });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    const initial = await fetch(`${origin}/login`);
    const cookies = initial.headers.getSetCookie();
    assert.ok(cookies.some(cookie => cookie.startsWith('connect.sid=')));
    assert.ok(cookies.some(cookie => cookie.startsWith('XSRF-TOKEN=')));
    const { token } = await initial.json();
    const cookie = cookies.map(value => value.split(';')[0]).join('; ');
    const result = await fetch(`${origin}/api/login`, { method: 'POST', headers: { cookie, 'x-xsrf-token': token } });
    assert.equal(result.status, 200);
    const stale = await fetch(`${origin}/api/login`, { method: 'POST', headers: { 'x-xsrf-token': token } });
    assert.equal(stale.status, 403);
    const invalid = await fetch(`${origin}/api/login`, { method: 'POST', headers: { cookie, 'x-xsrf-token': 'invalid' } });
    assert.equal(invalid.status, 403);
    assert.equal(loginCalls, 1);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('remote and proxied requests retain secure session cookies', () => {
  for (const properties of [
    { hostname: 'hirly.com', remoteAddress: '127.0.0.1' },
    { hostname: 'localhost', remoteAddress: '198.51.100.1' },
    { hostname: 'localhost', remoteAddress: '127.0.0.1', headers: { 'x-forwarded-for': '198.51.100.1' } },
    { hostname: 'localhost', remoteAddress: '127.0.0.1', secure: true }
  ]) {
    const req = { session: { cookie: { secure: true } }, headers: properties.headers || {},
      hostname: properties.hostname, socket: { remoteAddress: properties.remoteAddress }, secure: !!properties.secure };
    let proceeded = false;
    localSessionCookie(req, {}, () => { proceeded = true; });
    assert.equal(req.session.cookie.secure, true);
    assert.equal(proceeded, true);
  }
});

test('a CSRF session persistence failure stops the request', () => {
  const source = fs.readFileSync('server.js', 'utf8');
  const middleware = source.slice(source.indexOf('const setCsrfCookie ='), source.indexOf('app.use(csrfProtection);'));
  const protection = vm.runInNewContext(middleware + '\ncsrfProtection;', { crypto, logger: { warn() {}, error() {} } });
  let status;
  let proceeded = false;
  protection({ method: 'GET', session: { save(callback) { callback(new Error('store unavailable')); } } },
    { status(value) { status = value; return this; }, json() {} }, () => { proceeded = true; });
  assert.equal(status, 503);
  assert.equal(proceeded, false);
});
