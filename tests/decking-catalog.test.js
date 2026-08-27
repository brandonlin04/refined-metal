const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const CATALOG_PATH = path.join(ROOT, 'assets', 'submittal-builder', 'data', 'catalog.json');

function loadCatalog() {
  return JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
}

test('decking catalog expands 32 source rows into 96 launch products', () => {
  const catalog = loadCatalog();
  const products = catalog.products;
  const decking = products.filter((product) => product.category === 'decking');

  assert.equal(products.length, 444);
  assert.equal(catalog.counts.total, 444);
  assert.equal(catalog.counts.decking, 96);
  assert.equal(decking.length, 96);
  assert.equal(decking.some((product) => /9\s*\/\s*16/i.test(`${product.id} ${product.designation} ${product.web_depth}`)), false);

  const ids = new Set(products.map((product) => product.id));
  const urls = new Set(products.map((product) => product.pdf_url));
  assert.equal(ids.size, products.length);
  assert.equal(urls.size, products.length);

  const variants = new Map();
  for (const product of decking) {
    assert.match(product.id, /-(G40|G60|G90)$/);
    assert.ok(product.pdf_url.endsWith('.pdf'));
    assert.ok(product.source_pages.length > 0);
    const coatings = variants.get(product.base_id) || [];
    coatings.push(product.coating);
    variants.set(product.base_id, coatings);
  }

  assert.equal(variants.size, 32);
  for (const coatings of variants.values()) {
    assert.deepEqual(coatings.sort(), ['G40', 'G60', 'G90']);
  }
});

test('decking performance metadata is coating-independent', () => {
  const decking = loadCatalog().products.filter((product) => product.category === 'decking');
  const variants = new Map();
  for (const product of decking) {
    const products = variants.get(product.base_id) || [];
    products.push(product);
    variants.set(product.base_id, products);
  }

  for (const products of variants.values()) {
    assert.equal(products.length, 3);
    const expected = JSON.stringify(products[0].section);
    for (const product of products.slice(1)) {
      assert.equal(JSON.stringify(product.section), expected);
      assert.deepEqual(product.performance_tables, products[0].performance_tables);
    }
  }
});
