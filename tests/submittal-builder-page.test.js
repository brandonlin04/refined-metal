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
  assert.match(homepage, /<div class="hidden lg:ml-6 lg:flex lg:space-x-3 xl:space-x-4 2xl:space-x-6">/);
  assert.match(homepage, /<!-- CTA Button -->\s*<div class="flex max-\[359px\]:hidden lg:hidden xl:flex items-center">/);
});

test('all public pages share the same desktop and mobile navigation', () => {
  const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const normalize = (nav) => nav
    .replace(/ aria-current="page"/g, '')
    .replace(/border-red-500 text-gray-900/g, 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900')
    .replace(/font-semibold whitespace-nowrap/g, 'font-medium whitespace-nowrap transition-colors duration-200')
    .replace(/bg-red-50 text-red-700 font-semibold/g, 'text-gray-600 hover:bg-gray-50 hover:text-gray-900');
  const expected = normalize(homepage.match(/<nav\b[\s\S]*?<\/nav>/)?.[0] || '');
  const links = [
    'index.html', 'about.html', 'studs.html', 'tracks.html', 'joists.html',
    'decking.html', 'doors.html', 'railings.html', 'icces-report.html',
    'submittal-builder.html', 'contact.html',
  ];

  for (const filename of fs.readdirSync(root).filter((name) => name.endsWith('.html'))) {
    const page = fs.readFileSync(path.join(root, filename), 'utf8');
    const nav = page.match(/<nav\b[\s\S]*?<\/nav>/)?.[0] || '';
    assert.equal(normalize(nav), expected, filename);
    assert.match(nav, /aria-label="Primary navigation"/, filename);
    const desktop = nav.match(/<!-- Navigation Menu -->[\s\S]*?<!-- CTA Button -->/)?.[0] || '';
    const mobile = nav.match(/<details\b[\s\S]*?<\/details>/)?.[0] || '';
    for (const menu of [desktop, mobile]) {
      assert.deepEqual([...menu.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map((match) => match[1]), links, filename);
    }
    if (filename !== 'privacy-policy.html') {
      assert.equal((nav.match(new RegExp(`href="${filename.replace('.', '\\.')}" aria-current="page"`, 'g')) || []).length, 2, filename);
    }
  }
});

test('every public footer links the uploaded UL badge to the UL certificates', () => {
  assert.ok(fs.existsSync(path.join(root, 'images/common/ul-logo.webp')));
  for (const filename of fs.readdirSync(root).filter((name) => name.endsWith('.html'))) {
    const page = fs.readFileSync(path.join(root, filename), 'utf8');
    const footer = page.match(/<footer\b[\s\S]*?<\/footer>/)?.[0] || '';
    assert.equal((footer.match(/src="images\/common\/ul-logo\.webp"/g) || []).length, 1, filename);
    assert.match(footer, /href="icces-report\.html#ul-reports"[\s\S]*?<img[^>]*alt="UL certification"/, filename);
  }
  assert.match(fs.readFileSync(path.join(root, 'icces-report.html'), 'utf8'), /<section id="ul-reports"/);
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
