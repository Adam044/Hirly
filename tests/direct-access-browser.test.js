const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');

test('admin modal preserves credentials and requires explicit replacement', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const html = fs.readFileSync('views/admin/admin_dashboard.html', 'utf8');
    const start = html.indexOf('<div id="directAccessModal"');
    const end = html.indexOf('<div id="confirmationModal"', start);
    await page.setContent('<style>.hidden {display:none}</style>' + html.slice(start, end));
    const source = fs.readFileSync('public/js/admin/sections/Jobs.js', 'utf8');
    const script = source.slice(source.indexOf('function generateSecureKey()'), source.indexOf('export const initJobs'));
    await page.evaluate(script => {
      window.calls = [];
      window.toastMessages = [];
      window.currentDirectJobId = null;
      window.listenersAttached = false;
      window.showToast = text => window.toastMessages.push(text);
      window.fetch = async (url, options) => {
        window.calls.push({ url, options });
        return { ok: true, json: async () => ({ success: true, provisioned: true, accessKey: 'original-password' }) };
      };
      window.eval(script + '\ninitDirectAccessListeners();');
    }, script);
    await page.evaluate(() => openDirectAccessModal('1', 'Example'));
    assert.equal(await page.locator('#resDirectPass').textContent(), 'original-password');
    await page.locator('#closeDirectAccessModal').click();
    assert.equal(await page.locator('#resDirectPass').textContent(), '');
    await page.evaluate(() => openDirectAccessModal('1', 'Example'));
    assert.equal(await page.evaluate(() => calls.filter(c => c.options?.method === 'POST').length), 0);
    await page.locator('#changeDirectPassword').click();
    await page.locator('#directEmployerPassword').fill('replacement-password');
    await page.locator('#confirmDirectAccess').click();
    assert.equal(await page.evaluate(() => calls.filter(c => c.options?.method === 'POST').length), 0);
    await page.locator('#acknowledgeDirectReplacement').check();
    await page.locator('#confirmDirectAccess').click();
    const payload = await page.evaluate(() => JSON.parse(calls.find(c => c.options?.method === 'POST').options.body));
    assert.equal(payload.rotate, true);
    assert.equal(payload.customKey, 'replacement-password');
    await page.evaluate(() => {
      window.fetch = async () => ({ ok: true, json: async () => ({ success: true, provisioned: true, accessKey: null }) });
      return openDirectAccessModal('1', 'Example');
    });
    assert.match(await page.locator('#resDirectPass').textContent(), /current password still works/);
    assert.equal(await page.locator('#copyDirectDetails').isDisabled(), true);
    assert.equal(await page.locator('#resDirectUrl').isVisible(), true);
    await page.evaluate(() => {
      window.fetch = async () => { throw new Error('Connection failed'); };
      return openDirectAccessModal('1', 'Example');
    });
    assert.equal(await page.locator('#retryDirectAccess').isVisible(), true);
    assert.equal(await page.locator('#directAccessSetup').isVisible(), false);
    await page.evaluate(() => {
      window.fetch = async (url, options) => {
        window.calls.push({ url, options });
        return { ok: true, json: async () => ({ success: true, provisioned: false, accessKey: 'new-password' }) };
      };
    });
    await page.locator('#retryDirectAccess').click();
    await page.locator('#directEmployerPassword').waitFor({ state: 'visible' });
    await page.locator('#directEmployerPassword').fill('new-password');
    await page.locator('#confirmDirectAccess').click();
    assert.equal(await page.evaluate(() => JSON.parse(calls.filter(c => c.options?.method === 'POST').at(-1).options.body).rotate), false);
    await page.evaluate(async () => {
      let resolveFirst;
      window.fetch = url => url.endsWith('/1')
        ? new Promise(resolve => { resolveFirst = resolve; })
        : Promise.resolve({ ok: true, json: async () => ({ success: true, provisioned: true, accessKey: 'job-two-password' }) });
      const first = openDirectAccessModal('1', 'First');
      await openDirectAccessModal('2', 'Second');
      resolveFirst({ ok: true, json: async () => ({ success: true, provisioned: true, accessKey: 'stale-job-one-password' }) });
      await first;
    });
    assert.equal(await page.locator('#resDirectPass').textContent(), 'job-two-password');
  } finally {
    await browser.close();
  }
});
