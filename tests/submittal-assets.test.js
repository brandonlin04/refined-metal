const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { PDFDocument } = require('pdf-lib');

const ROOT = path.resolve(__dirname, '..');
const BUILDER_ROOT = path.join(ROOT, 'assets', 'submittal-builder');
const catalog = JSON.parse(fs.readFileSync(path.join(BUILDER_ROOT, 'data', 'catalog.json'), 'utf8'));

function assertPdf(relativePath) {
  const absolutePath = path.join(BUILDER_ROOT, relativePath);
  assert.equal(fs.existsSync(absolutePath), true, `Missing ${relativePath}`);
  const bytes = fs.readFileSync(absolutePath);
  assert.ok(bytes.length > 1024, `Empty or truncated ${relativePath}`);
  assert.equal(bytes.subarray(0, 4).toString('ascii'), '%PDF', `Invalid PDF header ${relativePath}`);
  return bytes;
}

test('all catalog product and ESR assets exist as non-empty PDFs', () => {
  assert.equal(catalog.products.length, 444);
  for (const product of catalog.products) {
    assertPdf(product.pdf_url);
  }
  for (const report of Object.values(catalog.esrReports)) {
    assertPdf(report.file);
  }
});

test('ICC-ES report assets remain readable PDFs', async () => {
  for (const report of Object.values(catalog.esrReports)) {
    const document = await PDFDocument.load(assertPdf(report.file));
    assert.ok(document.getPageCount() > 0, report.file);
  }
});

test('generated decking PDFs have the approved page counts', async () => {
  const decking = catalog.products.filter((product) => product.category === 'decking');
  assert.equal(decking.length, 96);
  for (const product of decking) {
    const document = await PDFDocument.load(assertPdf(product.pdf_url));
    const expectedPages = product.deck_type === 'Composite Deck' ? 3 : 2;
    assert.equal(document.getPageCount(), expectedPages, product.id);
  }
});

test('core product photos match the approved uploaded source images', () => {
  const approvedPhotos = {
    'stud.png': '26d6961968c9a865c45f51ddbf0d1a600120072a4e60f75d667b216cbda6abf9',
    'track.png': '5591c77502cbc79826d319cc993214382737aeeaf32b1c0f737f89dc3cea0e1b',
    'joist.png': 'fb59d50f5277c74b77c970f6cafdbcc90133cd5c936fcdedd68d452e0e1ab484',
  };
  const photoRoot = path.join(ROOT, 'scripts', 'submittal-builder', 'source', 'photos');

  for (const [filename, expectedHash] of Object.entries(approvedPhotos)) {
    const bytes = fs.readFileSync(path.join(photoRoot, filename));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), expectedHash, filename);
  }
});
