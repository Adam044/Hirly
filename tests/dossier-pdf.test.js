const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

test('dossier export produces visible PDF content even with an offscreen print container', async t => {
  const bundle = path.resolve('tmp/pdf-export-test/html2pdf.bundle.min.js');
  if (!fs.existsSync(bundle)) return t.skip('Place the page’s html2pdf 0.10.1 bundle in tmp/pdf-export-test to run this integration check.');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const html = fs.readFileSync('views/employer/ai.html', 'utf8');
    const script = html.slice(html.indexOf('        let dossierExportInProgress'), html.indexOf('        // --- INTERVIEW LOGIC ---'));
    const printMarkup = html.match(/<div id="fullReportPrint"[^>]*>[\s\S]*?<\/div>/)[0];
    await page.route('**/*', route => route.request().url().endsWith('pdf.worker.js')
      ? route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(require.resolve('pdfjs-dist/build/pdf.worker.js')) })
      : route.fulfill({ contentType: 'text/html', body: `<style>body{overflow:hidden}.hidden{display:none}.absolute{position:absolute}.left-\\[\\-9999px\\]{left:-9999px}.top-0{top:0}.w-\\[800px\\]{width:800px}</style><div id="reportModal"><button onclick="downloadPDF()">Export</button></div><canvas id="skillsRadar" width="200" height="200"></canvas>${printMarkup}` }));
    await page.goto('http://hirly.test/');
    await page.addScriptTag({ path: bundle });
    await page.addScriptTag({ path: require.resolve('pdfjs-dist/build/pdf.js') });
    await page.evaluate(() => {
      window.toasts = [];
      window.showToast = (...args) => toasts.push(args);
      window.selectedCandidateId = 1;
      window.candidates = [{ id: 1, first_name: 'Hosam', last_name: 'Ismail', match_score: 72, verdict: 'Interview',
        summary: 'Strong digital transformation delivery experience. Verify banking leadership scope in an interview.',
        pros: ['Led large digital programmes', 'Implemented bank payment integrations'], cons: ['Direct banking experience needs verification'],
        matched_skills: ['Enterprise architecture', 'Delivery'], missing_skills: ['Bank department leadership'],
        interview_questions: ['Describe the programme you led and its measurable impact.'] }];
    });
    await page.addScriptTag({ content: script });
    const [download] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => downloadPDF())]);
    const bytes = Array.from(fs.readFileSync(await download.path()));
    const inspectPdf = async exportedPdf => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'http://hirly.test/pdf.worker.js';
      const doc = await pdfjsLib.getDocument({ data: new Uint8Array(exportedPdf) }).promise;
      const first = await doc.getPage(1);
      const viewport = first.getViewport({ scale: 1 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      await first.render({ canvasContext: context, viewport }).promise;
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let darkPixels = 0;
      for (let i = 0; i < pixels.length; i += 4) if (pixels[i] < 150 && pixels[i + 1] < 150 && pixels[i + 2] < 150) darkPixels++;
      return { pages: doc.numPages, darkPixels, bytes: exportedPdf.length };
    };
    const result = await page.evaluate(inspectPdf, bytes);
    assert.ok(result.darkPixels > 1500, `PDF should contain visible dossier text; got ${result.darkPixels} dark pixels`);
    assert.ok(result.bytes > 5000);
    assert.equal(await page.locator('#fullReportPrint').evaluate(element => element.classList.contains('hidden')), true);
    await page.evaluate(() => {
      document.getElementById('skillsRadar').remove();
      candidates[0].first_name = 'شعبان';
      candidates[0].last_name = 'حماد';
      candidates[0].summary = 'خبرة في التحول الرقمي وإدارة المشاريع المؤسسية. '.repeat(100);
    });
    const [longDownload] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => downloadPDF())]);
    const longResult = await page.evaluate(inspectPdf, Array.from(fs.readFileSync(await longDownload.path())));
    assert.ok(longResult.pages >= 2, 'long dossiers should export across multiple pages');
    assert.ok(longResult.darkPixels > 1500, 'Arabic dossier remains visible without a chart');
    await page.evaluate(async () => {
      window.html2pdf = () => { throw new Error('Simulated export failure'); };
      await downloadPDF();
    });
    assert.equal(await page.locator('#reportModal button').isDisabled(), false);
    assert.equal(await page.locator('#fullReportPrint').evaluate(element => element.childElementCount), 0);
    assert.equal(await page.evaluate(() => toasts.length), 1);
  } finally { await browser.close(); }
});
