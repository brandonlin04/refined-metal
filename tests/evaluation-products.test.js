const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PDFDocument } = require('pdf-lib');
const Core = require('../assets/submittal-builder/js/submittal-builder-core.js');
const root = path.resolve(__dirname, '..');
const catalog = require('../assets/submittal-builder/data/catalog.json');

test('Evaluation Report separates three ICC-ES reports from four UL certificates', () => {
  const page = fs.readFileSync(path.join(root, 'icces-report.html'), 'utf8');
  assert.match(page, /<title>Evaluation Report - Refined Metal<\/title>/);
  const icc = page.match(/<section id="icc-es-reports"[\s\S]*?<\/section>/)?.[0];
  const ul = page.match(/<section id="ul-reports"[\s\S]*?<\/section>/)?.[0];
  assert.ok(icc && ul);
  assert.equal((icc.match(/<article /g) || []).length, 3);
  assert.equal((ul.match(/<article /g) || []).length, 4);
  for (const match of (icc + ul).matchAll(/href="(documents\/[^"]+\.pdf)"/g)) {
    assert.ok(fs.existsSync(path.join(root, match[1])), match[1]);
  }
  for (const filename of fs.readdirSync(root).filter((name) => name.endsWith('.html'))) {
    assert.doesNotMatch(fs.readFileSync(path.join(root, filename), 'utf8'), />ICCES Report</, filename);
  }
});

test('ESR-5723 fills missing grade/gauge combinations without merging coatings', () => {
  const additions = catalog.products.filter((product) => product.source === 'ICC-ES ESR-5723');
  assert.equal(additions.length, 213);
  assert.equal(catalog.counts['ESR-5723'], 213);
  assert.equal(catalog.counts.decking, 309);
  assert.equal(catalog.products.length, 807);
  const ids = new Set(catalog.products.map((product) => product.id));
  assert.equal(ids.size, 807);
  const urls = new Set(catalog.products.map((product) => product.pdf_url));
  assert.equal(urls.size, 807);
  for (const product of additions) {
    assert.match(product.coating, /^G(40|60|90)$/);
    assert.equal(product.esr_id, 'ESR-5723');
    assert.ok(product.source_pages.includes(15));
  }
  const sample = additions.find((p) => p.id === '916FD-FY50-24-G60');
  assert.equal(sample.section.design_thickness, '0.0238');
  assert.equal(sample.section.m_pos, '1994');
  assert.equal(sample.section.m_neg, '1968');
  assert.equal(sample.section.weight_psf, '1.202');
  const roof = additions.find((p) => p.id === '15RD-FY33-22-G90');
  assert.equal(roof.section.i_pos, '0.170');
  assert.equal(roof.section.i_neg, '0.177');
  assert.equal(roof.section.m_pos, '3523');
});

test('new product PDFs are readable and the clip is selectable with certificate-only data', async () => {
  for (const product of catalog.products.filter((p) => p.source === 'ICC-ES ESR-5723' || p.id === 'RM-SMART-CLIP')) {
    const pdf = await PDFDocument.load(fs.readFileSync(path.join(root, 'assets/submittal-builder', product.pdf_url)));
    assert.equal(pdf.getPageCount(), product.id === 'RM-SMART-CLIP' ? 3 : 2, product.id);
  }
  const clips = Core.filterProducts(catalog.products, { category: 'accessories', filters: { type: 'RM Smart Clip' } });
  assert.equal(clips.length, 1);
  assert.equal(clips[0].status, 'source_limited');
  assert.equal(clips[0].coating, undefined);
  assert.ok(clips[0].data_gaps.includes('Load capacity'));
  assert.equal(Core.addSelection([], clips[0].id).length, 1);
});
