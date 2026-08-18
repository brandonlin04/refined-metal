const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('homepage links to the standalone builder instead of embedding it', () => {
  const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

  assert.doesNotMatch(homepage, /<section id="submittal-builder"/);
  assert.doesNotMatch(homepage, /href="#submittal-builder"/);
  assert.ok((homepage.match(/href="submittal-builder\.html"/g) || []).length >= 2);
  assert.doesNotMatch(homepage, /assets\/submittal-builder\/js\/submittal-builder\.js/);
});

test('standalone builder page includes the complete builder runtime', () => {
  const pagePath = path.join(root, 'submittal-builder.html');

  assert.equal(fs.existsSync(pagePath), true, 'submittal-builder.html should exist');
  const page = fs.readFileSync(pagePath, 'utf8');
  assert.match(page, /<nav[\s>]/);
  assert.match(page, /<section id="submittal-builder"/);
  assert.match(page, /<footer[\s>]/);
  assert.match(page, /assets\/submittal-builder\/css\/submittal-builder\.css/);
  assert.match(page, /assets\/submittal-builder\/vendor\/pdf-lib\.min\.js/);
  assert.match(page, /assets\/submittal-builder\/js\/submittal-builder-core\.js/);
  assert.match(page, /assets\/submittal-builder\/js\/submittal-builder\.js/);
});

test('combined package contains only selected product submittals', () => {
  const page = fs.readFileSync(path.join(root, 'submittal-builder.html'), 'utf8');
  const runtime = fs.readFileSync(path.join(root, 'assets', 'submittal-builder', 'js', 'submittal-builder.js'), 'utf8');

  assert.doesNotMatch(page, /applicable ICC-ES reports/);
  assert.doesNotMatch(runtime, /Core\.getEsrIds/);
  assert.doesNotMatch(runtime, /state\.catalog\.esrReports/);
  assert.doesNotMatch(runtime, /Appending \$\{report\.id\}/);
});
