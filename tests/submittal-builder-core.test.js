const assert = require('node:assert/strict');
const test = require('node:test');

const Core = require('../assets/submittal-builder/js/submittal-builder-core.js');

const products = [
  { id: 'S1', category: 'studs_tracks', type: 'Structural Studs', designation: 'Stud alpha', web_depth: '3.625', coating: 'G60', esr_id: 'ESR-5724' },
  { id: 'T1', category: 'studs_tracks', type: 'Structural Tracks', designation: 'Track beta', web_depth: '3.625', coating: 'G60', esr_id: 'ESR-5724' },
  { id: 'J1', category: 'joists', type: 'Joists', designation: 'Joist gamma', web_depth: '8', coating: 'G90', esr_id: 'ESR-5724' },
  { id: 'E1', category: 'eq_framing', type: 'EQ Studs', designation: 'EQ delta', web_depth: '2.5', coating: 'G40', esr_id: 'ESR-5837' },
  { id: 'D1', category: 'decking', type: '1.5" Composite Deck', designation: 'Deck epsilon', deck_type: 'Composite Deck', web_depth: '1.5"', grade: '50', gauge: '22', coating: 'G60', esr_id: null },
  { id: 'D2', category: 'decking', type: '7/8" Form Deck', designation: 'Deck zeta', deck_type: 'Form Deck', web_depth: '7/8"', grade: '50', gauge: '26', coating: 'G40', esr_id: null },
];
const productMap = new Map(products.map((product) => [product.id, product]));

test('filterProducts searches identifiers and designation and applies category fields', () => {
  assert.deepEqual(Core.filterProducts(products, { category: 'studs', search: 'alpha', filters: {} }).map((p) => p.id), ['S1']);
  assert.deepEqual(Core.filterProducts(products, { category: 'tracks', search: 'T1', filters: {} }).map((p) => p.id), ['T1']);
  assert.deepEqual(
    Core.filterProducts(products, { category: 'decking', search: '', filters: { deck_type: 'Composite Deck', coating: 'G60' } }).map((p) => p.id),
    ['D1'],
  );
});

test('getFilterOptions returns only relevant distinct values', () => {
  assert.deepEqual(Core.getFilterOptions(products, 'decking').deck_type, ['Composite Deck', 'Form Deck']);
  assert.deepEqual(Core.getFilterOptions(products, 'decking').coating, ['G40', 'G60']);
  assert.deepEqual(Core.getFilterOptions(products, 'studs').web_depth, ['3.625']);
});

test('getFilterOptions excludes facet values that would produce no matching products', () => {
  const trackProducts = [
    { id: 'T27-G60', category: 'studs_tracks', type: 'Structural Tracks', web_depth: '2.5', flange: '1.5', mil: '27', coating: 'G60' },
    { id: 'T33-G40', category: 'studs_tracks', type: 'Structural Tracks', web_depth: '2.5', flange: '1.5', mil: '33', coating: 'G40' },
    { id: 'T27-G40-DEEP', category: 'studs_tracks', type: 'Structural Tracks', web_depth: '3.625', flange: '1.5', mil: '27', coating: 'G40' },
  ];
  const options = Core.getFilterOptions(trackProducts, 'tracks', {
    type: 'Structural Tracks',
    web_depth: '2.5',
    flange: '1.5',
    mil: '27',
  });

  assert.deepEqual(options.coating, ['G60']);
});

test('selection helpers prevent duplicates and normalize quantity', () => {
  let selected = Core.addSelection([], 'S1');
  selected = Core.addSelection(selected, 'S1');
  assert.deepEqual(selected, [{ productId: 'S1', quantity: 1 }]);
  assert.deepEqual(Core.setQuantity(selected, 'S1', '4.8'), [{ productId: 'S1', quantity: 4 }]);
  assert.deepEqual(Core.setQuantity(selected, 'S1', '0'), [{ productId: 'S1', quantity: 1 }]);
  assert.deepEqual(Core.removeSelection(selected, 'S1'), []);
});

test('reorderWithinCategory swaps only products in the same output group', () => {
  const selected = [
    { productId: 'S1', quantity: 1 },
    { productId: 'D1', quantity: 1 },
    { productId: 'T1', quantity: 1 },
    { productId: 'D2', quantity: 1 },
  ];
  assert.deepEqual(
    Core.reorderWithinCategory(selected, productMap, 'D2', -1).map((item) => item.productId),
    ['S1', 'D2', 'T1', 'D1'],
  );
  assert.deepEqual(
    Core.reorderWithinCategory(selected, productMap, 'T1', -1).map((item) => item.productId),
    selected.map((item) => item.productId),
  );
});

test('groupSelections uses fixed category order', () => {
  const selected = ['D1', 'E1', 'T1', 'J1', 'S1'].map((productId) => ({ productId, quantity: 1 }));
  assert.deepEqual(Core.groupSelections(selected, productMap).map((item) => item.productId), ['S1', 'T1', 'J1', 'E1', 'D1']);
});

test('calculateIndex assigns product start pages after cover and index', () => {
  const selected = [
    { productId: 'D1', quantity: 9 },
    { productId: 'S1', quantity: 2 },
    { productId: 'E1', quantity: 1 },
  ];
  const pageCounts = new Map([['S1', 2], ['E1', 3], ['D1', 3]]);
  assert.deepEqual(Core.calculateIndex(selected, productMap, pageCounts, 1, 1), [
    { productId: 'S1', quantity: 2, startPage: 3, pageCount: 2 },
    { productId: 'E1', quantity: 1, startPage: 5, pageCount: 3 },
    { productId: 'D1', quantity: 9, startPage: 8, pageCount: 3 },
  ]);
});

test('makeFilename sanitizes project names and provides dated fallback', () => {
  const date = new Date('2026-08-17T12:00:00');
  assert.equal(Core.makeFilename('  Queens / Tower: A  ', date), 'Queens-Tower-A-Submittal.pdf');
  assert.equal(Core.makeFilename('', date), 'Refined-Metal-Submittal-2026-08-17.pdf');
});
