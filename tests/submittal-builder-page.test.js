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

test('homepage navigation separates Contact from the quote button at desktop breakpoints', () => {
  const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

  assert.match(homepage, /<nav[\s\S]*?<div class="max-w-\[90rem\] mx-auto px-4 sm:px-6 lg:px-8">/);
  assert.match(homepage, /<div class="hidden lg:ml-6 lg:flex lg:space-x-4 xl:space-x-6 2xl:space-x-8">/);
  assert.match(homepage, /<!-- CTA Button -->\s*<div class="flex lg:hidden xl:flex items-center">/);
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
